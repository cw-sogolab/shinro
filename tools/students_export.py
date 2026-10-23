#!/usr/bin/env python3
"""학생 성적 → docs/assets/students.js (로컬 전용, 이름 치면 성적이 바로 채워지게).

입력: iCloud 일공/자료/EJU성적/모의고사 성적/EJU_점수예측_분석.xlsx 의 「11월예측_문과」「11월예측_이과」 시트
      (모의 1~4회 · 6월 EJU · 11월 실제 입력 칸. 수식 칸은 읽지 않음 — 예측은 화면이 같은 모델로 다시 계산)
출력: docs/assets/students.js (window.STUDENTS)

!! 실제 학생 이름·성적이 들어간다. .gitignore에 있음. 공개 저장소·공개 페이지·메신저로 내보내지 않는다.
   수험번호는 넣지 않는다.

사용: python3 tools/students_export.py [--src <xlsx>]
"""
import argparse
import json
import os
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
    payload = {"built": date.today().isoformat(), "source": src.name, "list": lst}
    OUT.write_text("/* 자동 생성 — tools/students_export.py. 실제 학생 이름·성적: 이 컴퓨터 밖으로 내보내지 않는다 (.gitignore) */\n"
                   "window.STUDENTS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    n = {k: sum(1 for s in lst if s["k"] == k) for k in ("문과", "이과")}
    print(f"완료: 문과 {n['문과']}명, 이과 {n['이과']}명 → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
