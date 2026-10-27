#!/usr/bin/env python3
"""학교·학부·학과별 입시 결과 → docs/assets/results.js (진학 상담 「입시 결과」 탭).

입력: iCloud 일공/자료/EJU성적/EJU통합_성적분석_vN.xlsx 「데이터」 시트 (2017~ 지원자 점수 + 합격여부)
출력: docs/assets/results.js (window.RESULTS) — 이름·수험번호 없는 지원자 한 줄씩(점수·합격여부).
      합격 데이터라 공개 금지(.gitignore). 드라이브 「진학상담_데이터」 폴더에 같은 이름으로 올린다.

엑셀 「조회」 시트(연도 범위·회차·학교·학부·학과·구분1 → 합격/불합격 인원, 과목별 평균, 최고·최저 총점자, TOEFL/TOEIC)를
화면에서 그대로 다시 계산할 수 있게, 집계가 아니라 지원자 한 줄씩을 압축해서 담는다 (조건을 바꿔도 엑셀과 같은 값).

형식 (window.RESULTS)
  built, source, years [첫해, 끝해]
  univ  [학교(일본어)]            · type [국립|공립|사립|''] (학교와 같은 순서)
  fac   [학부(일본어)]  · fack [학부 한국어 읽기(한자음 자동 변환)]
  dept  [학과(일본어)]  · deptk [학과 한국어 읽기(한자음 자동 변환)]
  g1    [구분1]                   (学部·大学院 등)
  units [[학교, 학부, 학과, 구분1, 시작행, 행수], ...]  · 같은 학교·학부·학과·구분1 지원자는 rows 에서 이어서 놓인다
  rows  "행;행;…"  각 행 = 연도-2000, 합격(1/0), 6월 {일본어,記述,물리,화학,생물,종합,수학1,수학2,총점}, 11월 {같은 9칸}, TOEFL, TOEIC (쉼표 구분, 빈 칸 = 없음)

한국어 읽기: 학부·학과 이름의 한자를 한국 한자음으로 바꾼 것(예: 経済→경제). 학교 이름은 지명 읽기가 달라 바꾸지 않고
화면이 names_ko.js(손으로 만든 한국어 이름)를 쓴다.

사용: python3 tools/results_export.py [--src <xlsx>] [--out <js>]
  필요: pip install pandas openpyxl hanja
"""
import argparse
import json
import os
import unicodedata
from datetime import date
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "assets" / "results.js"
DEFAULT = "~/Library/Mobile Documents/com~apple~CloudDocs/일공/자료/EJU성적/EJU통합_성적분석_v8.xlsx"
TYPE = {'国': '국립', '公': '공립', '私': '사립'}
SUBJ = ['일본어', '記述', '물리', '화학', '생물', '종합', '수학1', '수학2', '총점']
COLS = [f'{se}_{s}' for se in ('6월', '11월') for s in SUBJ] + ['TOEFL_iBT', 'TOEIC']
# 일본어 한자 단어와 한국어가 다르게 쓰는 말 (한자음 변환 뒤에 고침)
FIX = {'총합': '종합'}


def nfc(s):
    return unicodedata.normalize("NFC", str(s))


def nk(s):
    return unicodedata.normalize('NFKC', str(s)).strip() if pd.notna(s) else ''


def resolve(path):
    p = Path(os.path.expanduser(path))
    if p.exists():
        return p
    cur = Path(p.anchor)
    for part in p.parts[1:]:
        hit = [x for x in os.listdir(cur) if nfc(x) == nfc(part)]
        if not hit:
            raise FileNotFoundError(path)
        cur = cur / hit[0]
    return cur


def korean(texts):
    """일본어 학부·학과 이름 → 한국 한자음 읽기. hanja 가 없으면 빈 문자열(한국어 검색만 약해짐)."""
    try:
        import hanja
    except ImportError:
        print('주의: hanja 가 없어 한국어 읽기를 만들지 않습니다 (pip install hanja)')
        return ['' for _ in texts]
    out = []
    for t in texts:
        k = hanja.translate(t, 'substitution')
        for a, b in FIX.items():
            k = k.replace(a, b)
        out.append(k if k != t else '')
    return out


def num(v):
    if pd.isna(v):
        return ''
    f = float(v)
    return str(int(f)) if f == int(f) else str(round(f, 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=DEFAULT)
    ap.add_argument('--out', default=str(OUT))
    a = ap.parse_args()
    src = resolve(a.src)
    df = pd.read_excel(src, sheet_name='데이터', engine='openpyxl', usecols=list(range(30)))
    df = df[df['합격여부'].isin(['합격', '불합격']) & df['학교'].notna()].copy()
    df['대학코드'] = df['대학코드'].map(nk)
    df['학교n'] = df['학교'].map(nk)
    df['학부n'] = df['학부'].map(lambda s: nk(s) or '(미기재)')
    df['학과n'] = df['학과'].map(lambda s: nk(s) or '(미기재)')
    df['구분n'] = df['구분1'].map(lambda s: nk(s) or '(미기재)')
    df = df.sort_values(['학교n', '학부n', '학과n', '구분n', '연도'], kind='stable').reset_index(drop=True)

    univ = sorted(df['학교n'].unique())
    fac = sorted(df['학부n'].unique())
    dept = sorted(df['학과n'].unique())
    g1 = sorted(df['구분n'].unique())
    ix = lambda L: {v: i for i, v in enumerate(L)}
    iu, ifa, ide, ig = ix(univ), ix(fac), ix(dept), ix(g1)
    code = df.groupby('학교n')['대학코드'].first()
    types = [TYPE.get(code.get(u, '')[:1], '') for u in univ]

    units, rows = [], []
    start = 0
    for (u, f, d, g), dd in df.groupby(['학교n', '학부n', '학과n', '구분n'], sort=False):
        units.append([iu[u], ifa[f], ide[d], ig[g], start, len(dd)])
        start += len(dd)
    vals = df[COLS].apply(pd.to_numeric, errors='coerce')
    for i in range(len(df)):
        r = df.iloc[i]
        rows.append(','.join([str(int(r['연도']) - 2000), '1' if r['합격여부'] == '합격' else '0'] + [num(vals.iat[i, j]) for j in range(len(COLS))]))
    payload = {'built': date.today().isoformat(), 'source': src.name, 'years': [int(df['연도'].min()), int(df['연도'].max())],
               'univ': univ, 'type': types, 'fac': fac, 'fack': korean(fac), 'dept': dept, 'deptk': korean(dept), 'g1': g1,
               'units': units, 'rows': ';'.join(rows)}
    out = Path(a.out)
    out.write_text("/* 자동 생성 — tools/results_export.py. 합격 데이터(이름·수험번호 없음). 학원 밖 공개 금지 */\n"
                   "window.RESULTS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"완료: {len(df):,}행 → 학교 {len(univ)}·학부 {len(fac)}·학과 {len(dept)}·단위 {len(units):,} → {out} ({out.stat().st_size / 1e6:.1f}MB)")


if __name__ == "__main__":
    main()
