#!/usr/bin/env python3
"""학생 성적 → docs/assets/students.js (로컬 전용, 이름 치면 성적이 바로 채워지게).

입력: iCloud 일공/자료/EJU성적/모의고사 성적/EJU_점수예측_분석.xlsx 의 「11월예측_문과」「11월예측_이과」 시트
      (모의 1~4회 · 6월 EJU · 11월 실제 입력 칸. 수식 칸은 읽지 않음 — 예측은 화면이 같은 모델로 다시 계산)
출력: docs/assets/students.js (window.STUDENTS)

!! 실제 학생 이름·성적이 들어간다. .gitignore에 있음. 공개 저장소·공개 페이지·메신저로 내보내지 않는다.
   수험번호는 넣지 않는다.

전국모의고사 채점시트로 바로 만들기(권장): --mock 2026_1회_전국모의고사_채점시트.xlsx … 2026_4회….xlsx
      각 파일의 「종합점수(지망대학포함)」 시트 한 줄 = 학생 한 명 → 모의 N회 점수(일본어=독해+청독해, 기술, 종합, 물리·화학·생물, 수학=코스1(문과)/코스2(이과))와
      토플·토익·IELTS 를 한 번에 읽는다. 문/이과는 점수로 정한다(과학 점수가 있으면 이과). --src 를 같이 주면 그 파일의 6월 EJU·11월 실제 점수를 이름·캠퍼스로 붙인다.

이전 students.js 에서 6월 EJU·11월 실제 점수만 가져오기: --prev 이전_students.js
      (채점시트에는 6월 EJU 점수가 없으므로, 예전에 만든 파일의 e6·e11 만 이름·캠퍼스로 붙인다. 모의 1~4회 점수는 채점시트 것을 쓴다)

영어 성적(선택, --src 로 만들 때): --eng 2026_1회.xlsx 2026_2회.xlsx … (전국모의고사 결과 엑셀)의 「학생정보_2026_N회」 시트에서
      이름으로 토플(iBT)·토익·IELTS 를 찾아 학생에 붙인다. 이름이 겹쳐 값이 서로 다르면 붙이지 않는다. 회차가 늦은 값이 앞선 값을 덮는다.

사용: python3 tools/students_export.py --mock <채점시트.xlsx> ... [--src <점수예측 xlsx>]
      python3 tools/students_export.py --src <점수예측 xlsx> [--eng <xlsx> ...]
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
        if x < 1:
            continue   # 0 은 「없음」
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


def mock_students(paths):
    """전국모의고사 채점시트들(회차 순서 무관) → 학생 목록. 시트 「종합점수(지망대학포함)」의 한 줄 = 한 명."""
    by = {}   # (이름, 캠퍼스, 같은 파일 안 몇 번째 동명) → {'rows':{}, 'en':{}}
    for path in paths:
        m = re.search(r'2026_(\d)', nfc(Path(path).name))
        if not m:
            print(f"[경고] 파일 이름에서 회차를 못 찾아 건너뜀: {Path(path).name}")
            continue
        ex = f"m{m.group(1)}"
        wb = openpyxl.load_workbook(resolve(path), read_only=True, data_only=True)
        ws = next((wb[x] for x in wb.sheetnames if nfc(x) == "종합점수(지망대학포함)"), None)
        if ws is None:
            print(f"[경고] 「종합점수(지망대학포함)」 시트 없음: {Path(path).name}")
            continue
        R = list(ws.iter_rows(values_only=True))
        hi = next((i for i, r in enumerate(R) if r and any(nfc(str(c or "")).strip() == "이름" for c in r)), None)
        if hi is None:
            continue
        h = {}
        for i, c in enumerate(R[hi]):
            if c is not None:
                h.setdefault(nfc(str(c)).replace("\n", "").replace(" ", ""), i)
        need = ["이름", "독해", "청독해"]
        if any(k not in h for k in need):
            print(f"[경고] 필요한 칸(이름·독해·청독해)이 없어 건너뜀: {Path(path).name}")
            continue
        g = lambda r, k: num(r[h[k]]) if k in h and h[k] < len(r) else None
        seen = {}
        for r in R[hi + 1:]:
            if not r or h["이름"] >= len(r) or not r[h["이름"]]:
                continue
            name = nfc(r[h["이름"]]).strip()
            camp = nfc(r[h["캠퍼스구분"]] or "").strip() if "캠퍼스구분" in h and h["캠퍼스구분"] < len(r) else ""
            seen[(name, camp)] = seen.get((name, camp), 0) + 1
            sid = r[h["이름"] - 1] if h["이름"] > 0 and isinstance(r[h["이름"] - 1], (int, float)) else None
            key = int(sid) if sid else (name, camp, seen[(name, camp)])   # 학생번호가 있으면 번호만으로 구분 (이름 표시·캠퍼스 칸이 시트마다 다르거나 틀린 경우가 있다)
            du, cd = g(r, "독해"), g(r, "청독해")
            sc = {"so": g(r, "종과") or g(r, "종합"), "ki": g(r, "기술"), "phy": g(r, "물리"), "chem": g(r, "화학"), "bio": g(r, "생물"), "c1": g(r, "코스1"), "c2": g(r, "코스2")}
            jp = (du or 0) + (cd or 0) if (du or cd) else None
            tf, tx, il = (r[h["토플"]] if "토플" in h and h["토플"] < len(r) else None), g(r, "토익"), g(r, "IELTS")
            ent = by.setdefault(key, {"rows": {}, "sc": [], "en": {}, "names": [], "camps": []})
            ent["names"].append(name)
            ent["camps"].append(camp)
            ent["rows"][ex] = {"jp": jp, **sc}
            t, b = parse_toefl(tf)
            for k, v in (("t", t), ("b", b), ("x", round(tx) if tx and tx > 0 else None), ("i", il if il and il > 0 else None)):
                if v is not None:
                    ent["en"][k] = v   # 회차 순서로 읽으므로 늦은 값이 덮음 (아래에서 정렬)
    out = []
    for key, ent in by.items():
        if isinstance(key, int):
            sid = key
            name = max(dict.fromkeys(ent["names"]), key=ent["names"].count)    # 가장 많이 적힌 이름·캠퍼스 (같으면 먼저 나온 것)
            camp = max(dict.fromkeys(ent["camps"]), key=ent["camps"].count)
        else:
            sid, (name, camp) = None, key[:2]
        rows, sci = {}, {"phy": 0, "chem": 0, "bio": 0}
        for ex, v in sorted(ent["rows"].items()):
            for s_ in sci:
                if v.get(s_):
                    sci[s_] += 1
        kind = "이과" if sum(1 for x in sci.values() if x) >= 2 else "문과"
        top = [k for k, _ in sorted(sci.items(), key=lambda x: -x[1])[:2]]
        for ex, v in sorted(ent["rows"].items()):
            o = {}
            for s_, val in (("jp", v["jp"]), ("so", v["so"]), ("ki", v["ki"]), ("math", v["c2"] if kind == "이과" else v["c1"]), ("phy", v["phy"]), ("chem", v["chem"]), ("bio", v["bio"])):
                if kind == "문과" and s_ in ("phy", "chem", "bio"):
                    continue
                if val is None or not (0 < val <= MAX[s_]) or (s_ == "jp" and val < 50):
                    continue
                o[s_] = round(val)
            if o:
                rows[ex] = o
        if not rows:
            continue
        st = {"n": name, "c": camp, "k": kind, "rows": rows}
        if sid:
            st["id"] = sid
        if kind == "이과":
            st["sci"] = top
        if ent["en"]:
            st["en"] = ent["en"]
        out.append(st)
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
        if len(r) > 2 and isinstance(r[2], (int, float)):
            st["id"] = int(r[2])
        if kind == "이과":
            cnt = {s: sum(1 for g in rows.values() if s in g) for s in ("phy", "chem", "bio")}
            st["sci"] = [s for s, _ in sorted(cnt.items(), key=lambda x: -x[1])[:2]]
        out.append(st)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=None, help="점수예측 엑셀 (「11월예측_문과·이과」 시트). --mock 과 같이 주면 6월 EJU·11월 실제 점수만 붙인다")
    ap.add_argument("--mock", nargs="+", metavar="XLSX", help="전국모의고사 채점시트 (모의 1~4회 점수와 토플·토익·IELTS 가 같이 든 파일)")
    ap.add_argument("--prev", metavar="JS", help="이전 students.js (6월 EJU·11월 실제 점수를 이름·캠퍼스로 가져옴)")
    ap.add_argument("--out", default=str(OUT), help="내보낼 파일 (기본 docs/assets/students.js)")
    ap.add_argument("--eng", nargs="+", metavar="XLSX", help="전국모의고사 결과 엑셀 (토플·토익·IELTS 가 든 「학생정보_2026_N회」 시트)")
    a = ap.parse_args()
    if not a.src and not a.mock:
        ap.error("--mock <채점시트.xlsx …> 또는 --src <점수예측.xlsx> 가 필요합니다")
    if a.prev and not a.mock:
        ap.error("--prev 는 --mock 과 같이 씁니다")
    lst = []
    if a.src:
        src = resolve(a.src)
        wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
        for name, kind in (("11월예측_문과", "문과"), ("11월예측_이과", "이과")):
            ws = next((wb[s] for s in wb.sheetnames if nfc(s) == name), None)
            if ws is None:
                print(f"[경고] 시트 없음: {name}")
                continue
            lst += sheet(ws, kind)
    if a.mock:
        ml = mock_students(a.mock)
        if lst:   # 점수예측 파일의 6월 EJU·11월 실제를 이름·캠퍼스로 붙인다 (없는 학생은 점수예측 쪽 기록을 그대로 둔다)
            old = {(s["n"], s["c"]): s for s in lst}
            oid = {s["id"]: (s["n"], s["c"]) for s in lst if s.get("id")}
            hit = 0
            for s in ml:
                o = old.pop(oid.get(s.get("id")) or (s["n"], s["c"]), None)   # 학생번호가 맞으면 그 학생 (이름 표시가 달라도), 아니면 이름·캠퍼스
                if o:
                    s["n"], s["c"] = o["n"], o["c"]   # 점수예측 파일 쪽 이름 ((경기) 등 구분 표시 포함)
                    for ex in ("e6", "e11"):
                        if ex in o["rows"]:
                            s["rows"][ex] = o["rows"][ex]
                    hit += 1
            print(f"점수예측 파일과 이름·캠퍼스가 맞은 학생 {hit}명 (6월 EJU·11월 실제 점수 붙임)")
            ml += list(old.values())
        lst = ml
        src = Path(a.mock[0])
    if a.prev:
        txt = resolve(a.prev).read_text(encoding="utf-8")
        old = json.loads(txt[txt.index("{"):txt.rindex("}") + 1])["list"]
        idx = {(s["n"], s["c"]): s for s in lst}
        got = added = 0
        for o in old:
            cur = idx.get((o["n"], o["c"]))
            if cur is None:   # 이전 파일에만 있는 학생은 그대로 둔다
                lst.append(o)
                added += 1
                continue
            for ex in ("e6", "e11"):
                if ex in o["rows"] and ex not in cur["rows"]:
                    cur["rows"][ex] = o["rows"][ex]
                    got += 1
            if "sci" not in cur and o.get("sci"):
                cur["sci"] = o["sci"]
        print(f"이전 파일에서 6월 EJU·11월 실제 점수 {got}건을 붙였고, 이전 파일에만 있던 학생 {added}명을 남겼습니다")
    # 같은 이름·캠퍼스·계열이 겹치면 번호를 붙여 구분
    lst.sort(key=lambda s: (s["k"], s["n"], s["c"]))
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
    for s in lst:
        s.pop("id", None)   # 학생번호는 파일에 담지 않는다 (이름·캠퍼스만)
    payload = {"built": date.today().isoformat(), "source": src.name if a.src or not a.mock else "전국모의고사 채점시트 %d개" % len(a.mock), "list": lst}
    Path(a.out).write_text("/* 자동 생성 — tools/students_export.py. 실제 학생 이름·성적: 이 컴퓨터 밖으로 내보내지 않는다 (.gitignore) */\n"
                   "window.STUDENTS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    n = {k: sum(1 for s in lst if s["k"] == k) for k in ("문과", "이과")}
    print(f"완료: 문과 {n['문과']}명, 이과 {n['이과']}명 → {a.out}")


if __name__ == "__main__":
    main()
