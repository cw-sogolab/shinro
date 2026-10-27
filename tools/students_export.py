#!/usr/bin/env python3
"""학생 성적 → docs/assets/students.js (로컬 전용, 이름 치면 성적이 바로 채워지게).

입력: iCloud 일공/자료/EJU성적/모의고사 성적/EJU_점수예측_분석.xlsx 의 「11월예측_문과」「11월예측_이과」 시트
      (모의 1~4회 · 6월 EJU · 11월 실제 입력 칸. 수식 칸은 읽지 않음 — 예측은 화면이 같은 모델로 다시 계산)
출력: docs/assets/students.js (window.STUDENTS)

!! 실제 학생 이름·성적이 들어간다. .gitignore에 있음. 공개 저장소·공개 페이지·메신저로 내보내지 않는다.
   수험번호는 넣지 않는다.

영어 성적(선택): --eng 2026_1회.xlsx 2026_2회.xlsx … (전국모의고사 결과 엑셀)의 「학생정보_2026_N회」 시트에서
      이름으로 토플(iBT)·토익·IELTS 를 찾아 학생에 붙인다. 이름이 겹쳐 값이 서로 다르면 붙이지 않는다. 회차가 늦은 값이 앞선 값을 덮는다.

사용: python3 tools/students_export.py [--src <xlsx>] [--eng <xlsx> ...]
"""
import argparse
import json
import os
import re
import unicodedata
from datetime import date
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "assets" / "students.js"
DEFAULT = "~/Library/Mobile Documents/com~apple~CloudDocs/일공/자료/EJU성적/모의고사 성적/EJU_점수예측_분석.xlsx"

GROUPS = {"1회": "m1", "2회": "m2", "6월EJU": "e6", "3회": "m3", "4회": "m4", "11월 실제": "e11"}
SUBJ = {"일본어": "jp", "종합": "so", "수학": "math", "기술": "ki", "물리": "phy", "화학": "chem", "생물": "bio"}
MAX = {"jp": 400, "so": 200, "math": 200, "ki": 50, "phy": 100, "chem": 100, "bio": 100}


def nfc(s):
    return unicodedata.normalize("NFC", str(s))


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


def num(v):
    if v is None or isinstance(v, bool):
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# 2026년부터 TOEFL iBT 는 1~6 밴드로도 표기된다. ETS 환산표의 아래쪽 끝(보수적으로)을 점수 비교용으로 쓴다.
BAND_LOW = [(6.0, 114), (5.5, 107), (5.0, 95), (4.5, 82), (4.0, 69), (3.5, 55), (3.0, 42), (2.5, 30), (2.0, 18), (1.5, 12), (1.0, 0)]


def band_to_ibt(b):
    return next(v for k, v in BAND_LOW if b >= k)


def parse_toefl(v):
    """토플 칸 → (iBT 0~120 점수 | None, 밴드 1~6 | None). '100', '5.0', '5.0(100)', '80(4.0)', '5n' 같은 표기를 모두 읽는다.
    6.5 이하는 밴드, 7~120 은 iBT 점수, 120 초과(ITP 등)는 버린다."""
    if v is None or isinstance(v, bool):
        return None, None
    nums = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', str(v))]
    ibt = band = None
    for x in nums:
        if x <= 6.5:
            band = band if band is not None else x
        elif x <= 120:
            ibt = ibt if ibt is not None else x
    return (round(ibt) if ibt is not None else None), band


def eng_map(paths):
    """모의고사 결과 엑셀들의 「학생정보_2026_N회」 → {이름: {'t': iBT, 'b': 밴드, 'x': 토익, 'i': IELTS}} (늦은 회차가 덮어씀)"""
    found = []   # (회차, 이름, dict)
    for path in paths:
        wb = openpyxl.load_workbook(resolve(path), read_only=True, data_only=True)
        for sn in wb.sheetnames:
            m = re.match(r'학생정보_2026_(\d+)회$', nfc(sn))
            if not m:
                continue
            R = list(wb[sn].iter_rows(values_only=True))
            if not R:
                continue
            h = {nfc(str(c)).strip(): i for i, c in enumerate(R[0]) if c is not None}
            if '이름' not in h or '토플' not in h:
                continue
            col = lambda r, k: r[h[k]] if k in h and h[k] < len(r) else None
            rows = {}
            for r in R[1:]:
                n = nfc(col(r, '이름') or '').strip()
                if not n:
                    continue
                t, b = parse_toefl(col(r, '토플'))
                x, i = num(col(r, '토익')), num(col(r, 'IELTS'))
                e = {k: v for k, v in (('t', t), ('b', b), ('x', round(x) if x and x > 0 else None), ('i', i if i and i > 0 else None)) if v is not None}
                if e:
                    rows.setdefault(n, []).append(e)
            for n, L in rows.items():
                if any(e != L[0] for e in L):   # 같은 이름의 값이 서로 다르면 누구 것인지 몰라 건너뜀
                    found.append((int(m.group(1)), n, None))
                else:
                    found.append((int(m.group(1)), n, L[0]))
    out = {}
    for _, n, e in sorted(found, key=lambda x: x[0]):
        if e is None:
            out.pop(n, None)
        else:
            out[n] = {**out.get(n, {}), **e}
    return out


def sheet(ws, kind):
    R = [list(r) for r in ws.iter_rows(values_only=True)]
    hi = next(i for i, r in enumerate(R) if r and nfc(r[0] or "") == "이름")
    h3, h4 = R[hi], R[hi + 1]
    cols, cur = {}, None
    for i in range(len(h4)):
        if i < len(h3) and h3[i]:
            g = nfc(h3[i]).replace("\n", " ")
            cur = next((v for k, v in GROUPS.items() if g.startswith(k)), None)
        s = SUBJ.get(nfc(h4[i] or "").strip())
        if cur and s:
            cols[(cur, s)] = i
    out = []
    for r in R[hi + 2:]:
        if not r or not r[0]:
            continue
        rows = {}
        for (g, s), i in cols.items():
            v = num(r[i]) if i < len(r) else None
            if v is None or not (0 < v <= MAX[s]) or (s == "jp" and v < 50):
                continue  # 결시·입력 오류(일본어 0점 등)는 뺀다
            rows.setdefault(g, {})[s] = round(v)
        if not rows:
            continue
        st = {"n": nfc(r[0]).strip(), "c": nfc(r[1] or "").strip(), "k": kind, "rows": rows}
        if kind == "이과":
            cnt = {s: sum(1 for g in rows.values() if s in g) for s in ("phy", "chem", "bio")}
            st["sci"] = [s for s, _ in sorted(cnt.items(), key=lambda x: -x[1])[:2]]
        out.append(st)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=DEFAULT)
    ap.add_argument("--eng", nargs="+", metavar="XLSX", help="전국모의고사 결과 엑셀 (토플·토익·IELTS 가 든 「학생정보_2026_N회」 시트)")
    a = ap.parse_args()
    src = resolve(a.src)
    wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
    lst = []
    for name, kind in (("11월예측_문과", "문과"), ("11월예측_이과", "이과")):
        ws = next((wb[s] for s in wb.sheetnames if nfc(s) == name), None)
        if ws is None:
            print(f"[경고] 시트 없음: {name}")
            continue
        lst += sheet(ws, kind)
    # 같은 이름·캠퍼스·계열이 겹치면 번호를 붙여 구분
    seen = {}
    for s in lst:
        k = (s["n"], s["c"], s["k"])
        seen[k] = seen.get(k, 0) + 1
        if seen[k] > 1:
            s["n"] = f'{s["n"]} ({seen[k]})'
    if a.eng:
        em = eng_map(a.eng)
        hit = 0
        for s in lst:
            e = em.get(s["n"])   # 이름이 겹쳐 「이름 (2)」가 된 학생은 누구 것인지 몰라 건너뜀
            if e:
                s["en"] = e
                hit += 1
        print(f"영어 성적: 시트에서 {len(em)}명 → 학생 {hit}명에게 붙임")
    payload = {"built": date.today().isoformat(), "source": src.name, "list": lst}
    OUT.write_text("/* 자동 생성 — tools/students_export.py. 실제 학생 이름·성적: 이 컴퓨터 밖으로 내보내지 않는다 (.gitignore) */\n"
                   "window.STUDENTS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    n = {k: sum(1 for s in lst if s["k"] == k) for k in ("문과", "이과")}
    print(f"완료: 문과 {n['문과']}명, 이과 {n['이과']}명 → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
