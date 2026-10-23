#!/usr/bin/env python3
"""학교·학부별 합격생 점수대 → docs/assets/schools.js (진학 상담 「학교 찾기」·「학교 상세」).

입력: iCloud 일공/자료/EJU성적/EJU통합_성적분석_vN.xlsx 「데이터」 시트 (2017~ 지원자 점수 + 합격여부)
출력: docs/assets/schools.js (window.SCHOOLS) — 집계만. 이름·수험번호 없음. 그래도 합격 데이터라 공개 금지(.gitignore).

엑셀 「조회」 시트가 하는 일(학교·학부·학과 조건 → 합격/불합격 인원, 과목별 평균, 최고·최저 총점자)을
학교·학부·계열마다 미리 계산해 두고, 학생 점수와 비교할 수 있게 과목 조합별 분포(사분위)를 더한다.

규칙 (curves.py와 같음)
- 계열: 그 회차에 종합이 있고 과학이 없으면 문과, 과학 2과목 이상이고 종합이 없으면 이과, 일본어만 있으면 일본어만.
  두 회차의 계열이 다르면 11월을 따른다.
- 과목 조합 점수: J=일본어, JS=+종합, JSM=+수학1, JR=일본어+과학 2과목, JRM=+수학2. 기술(記述)은 뺀다.
  회차는 「최고」(6월·11월 중 그 조합 점수가 높은 쪽).
- 학부가 보는 조합(곡선이 없을 때): 합격자의 60% 이상이 가진 조합 중 과목이 가장 많은 것.
- 기간: 최근 5년(r)과 전체(a) 두 가지.

사용: python3 tools/schools_export.py [--src <xlsx>]
"""
import argparse
import json
import os
import unicodedata
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "assets" / "schools.js"
DEFAULT = "~/Library/Mobile Documents/com~apple~CloudDocs/일공/자료/EJU성적/EJU통합_성적분석_v8.xlsx"

SCI = ['물리', '화학', '생물']
SETS = {'문과': ['J', 'JS', 'JSM'], '이과': ['J', 'JR', 'JRM'], '일본어만': ['J']}
SET_PARTS = {'J': ['jp'], 'JS': ['jp', 'so'], 'JSM': ['jp', 'so', 'm1'], 'JR': ['jp', 'r'], 'JRM': ['jp', 'r', 'm2']}
SUBJ_COLS = {'jp': '일본어', 'ki': '記述', 'phy': '물리', 'chem': '화학', 'bio': '생물', 'so': '종합', 'm1': '수학1', 'm2': '수학2'}
TYPE = {'国': '국립', '公': '공립', '私': '사립'}


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


def prep(df):
    df = df[df['합격여부'].isin(['합격', '불합격']) & df['학교'].notna()].copy()
    g1 = df['구분1'].map(lambda s: nk(s))
    df = df[g1.isin(['学部', '', 'nan'])].copy()
    df['y'] = (df['합격여부'] == '합격').astype(int)
    df['학교n'] = df['학교'].map(nk)
    df['학부n'] = df['학부'].map(lambda s: nk(s) or '(미기재)')
    df['학과n'] = df['학과'].map(lambda s: nk(s) or '')
    for se in ['6월', '11월']:
        g = lambda c: pd.to_numeric(df[f'{se}_{c}'], errors='coerce')
        jp, so, m1, m2 = g('일본어'), g('종합'), g('수학1'), g('수학2')
        sci = pd.concat([g(c) for c in SCI], axis=1)
        nsci = sci.notna().sum(axis=1)
        arr = np.sort(np.where(np.isnan(sci.to_numpy(float)), -np.inf, sci.to_numpy(float)), axis=1)[:, ::-1]
        r = pd.Series(np.where(nsci.to_numpy() >= 2, arr[:, 0] + arr[:, 1], np.nan), index=df.index)
        kind = pd.Series(None, index=df.index, dtype=object)
        kind[jp.notna() & so.notna() & (nsci == 0)] = '문과'
        kind[jp.notna() & (nsci >= 2) & so.isna()] = '이과'
        kind[jp.notna() & so.isna() & (nsci == 0) & m1.isna() & m2.isna()] = '일본어만'
        df[f'kind_{se}'] = kind
        for k, v in {'jp': jp, 'so': so, 'm1': m1, 'm2': m2, 'r': r}.items():
            df[f'{k}_{se}'] = v
        for k, c in SUBJ_COLS.items():
            df[f'sub_{k}_{se}'] = g(c)
    df['kind'] = df['kind_11월'].where(df['kind_11월'].notna(), df['kind_6월'])
    for kind, sets in SETS.items():
        for s in sets:
            one = {}
            for se in ['6월', '11월']:
                v = sum(df[f'{c}_{se}'] for c in SET_PARTS[s])
                one[se] = v.where(df[f'kind_{se}'] == kind)
            best = pd.concat([one['6월'].rename('6월'), one['11월'].rename('11월')], axis=1)
            df[f'S_{s}'] = df.get(f'S_{s}', pd.Series(np.nan, index=df.index)).where(df['kind'] != kind, best.max(axis=1))
            df[f'SE_{s}'] = df.get(f'SE_{s}', pd.Series(None, index=df.index, dtype=object)).where(
                df['kind'] != kind, np.where(best['11월'].fillna(-1) >= best['6월'].fillna(-1), '11월', '6월'))
    for s in {x for v in SETS.values() for x in v}:
        for k in SUBJ_COLS:
            df[f'B_{s}_{k}'] = df[f'sub_{k}_11월'].where(df[f'SE_{s}'] == '11월', df[f'sub_{k}_6월'])
    return df


def q(v):
    v = np.sort(np.asarray(v, float))
    if not len(v):
        return None
    p = lambda t: int(round(np.quantile(v, t)))
    return [len(v), int(round(v[0])), p(.25), p(.5), p(.75), int(round(v[-1])), round(float(v.mean()), 1)]


def unit_stats(d, kind):
    """한 학교·학부·계열·기간의 집계"""
    out = {'ap': int(len(d)), 'ps': int(d['y'].sum())}
    p = d[d['y'] == 1]
    sets = {}
    for s in SETS[kind]:
        sp = p[f'S_{s}'].dropna(); sf = d[d['y'] == 0][f'S_{s}'].dropna()
        if len(sp) or len(sf):
            sets[s] = {'p': q(sp), 'f': q(sf), 'cov': round(len(sp) / max(1, len(p)), 2)}
    out['sets'] = sets
    # 학부가 보는 조합(추정): 합격자 60% 이상이 가진 조합 중 과목이 가장 많은 것
    cand = [s for s in SETS[kind] if s in sets and sets[s]['p'] and sets[s]['cov'] >= .6]
    out['set'] = cand[-1] if cand else (SETS[kind][0] if SETS[kind][0] in sets else None)
    # 과목별 합격 평균 (그 조합 점수가 높았던 회차의 과목 점수)
    if out['set'] and len(p):
        s = out['set']
        means = {}
        for k in SUBJ_COLS:
            vals = p.loc[p[f'S_{s}'].notna(), f'B_{s}_{k}'].dropna()
            if len(vals):
                means[k] = round(float(vals.mean()), 1)
        out['mean'] = means
        sp = p[p[f'S_{s}'].notna()]
        if len(sp):
            def vec(row):
                return {k: (None if pd.isna(row[f'B_{s}_{k}']) else int(row[f'B_{s}_{k}'])) for k in SUBJ_COLS} | {'t': int(row[f'S_{s}']), 'y': int(row['연도']), 'se': row[f'SE_{s}']}
            out['top'] = vec(sp.loc[sp[f'S_{s}'].idxmax()])
            out['low'] = vec(sp.loc[sp[f'S_{s}'].idxmin()])
    # 연도별: 지원·합격·합격자 중앙(조합 점수)
    yr = []
    for y, dy in d.groupby('연도'):
        s = out.get('set')
        med = dy[dy['y'] == 1][f'S_{s}'].dropna().median() if s else np.nan
        yr.append([int(y), int(len(dy)), int(dy['y'].sum()), None if pd.isna(med) else int(round(med))])
    out['yr'] = yr
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=DEFAULT)
    a = ap.parse_args()
    src = resolve(a.src)
    df = pd.read_excel(src, sheet_name='데이터', engine='openpyxl', usecols=list(range(30)))
    df = prep(df)
    last = int(df['연도'].max()); first = int(df['연도'].min())
    recent = df[df['연도'] >= last - 4]
    univ = []
    for u, du in df.groupby('학교n'):
        code = nk(du['대학코드'].dropna().iloc[0]) if du['대학코드'].notna().any() else ''
        facs = []
        for f, dfa in du.groupby('학부n'):
            ent = {'f': f, 'dept': [k for k, _ in dfa['학과n'].value_counts().items() if k and k != '(미기재)'][:12], 'k': {}}
            for kind in SETS:
                dk = dfa[dfa['kind'] == kind]
                if not len(dk):
                    continue
                rk = recent.loc[recent.index.intersection(dk.index)]
                e = {'a': unit_stats(dk, kind)}
                if len(rk):
                    e['r'] = unit_stats(rk, kind)
                ent['k'][kind] = e
            if ent['k']:
                ent['n'] = int(len(dfa)); ent['p'] = int(dfa['y'].sum())
                facs.append(ent)
        if facs:
            facs.sort(key=lambda x: -x['n'])
            univ.append({'u': u, 'type': TYPE.get(code[:1], ''), 'n': int(len(du)), 'p': int(du['y'].sum()), 'fac': facs})
    univ.sort(key=lambda x: -x['n'])
    payload = {'built': date.today().isoformat(), 'source': src.name, 'years': {'r': [last - 4, last], 'a': [first, last]},
               'rows': int(len(df)), 'univ': univ}
    OUT.write_text("/* 자동 생성 — tools/schools_export.py. 합격 데이터 집계(이름·수험번호 없음). 학원 밖 공개 금지 */\n"
                   "window.SCHOOLS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    nf = sum(len(x['fac']) for x in univ)
    print(f"완료: {len(df):,}행 → 학교 {len(univ)}개, 학부 {nf}개 → {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
