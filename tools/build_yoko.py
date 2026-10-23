#!/usr/bin/env python3
"""모집요강(예전 要項ノート) 데이터 빌드 — 진학 상담 「모집요강」 탭.

data/yoko/<연도>/*.json (모집요강 1건 = 파일 1개) + data/yoko/glossary.json
  -> 검사 -> docs/assets/yoko.js (window.YOKO_DATA)

사용: python3 tools/build_yoko.py
검사에서 오류가 나면 data.js를 만들지 않는다. 경고는 출력만 한다.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "yoko"
OUT = ROOT / "docs" / "assets" / "yoko.js"
ONLY = None  # --check <파일>: 그 파일 하나만 검사하고 yoko.js는 만들지 않음

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
REQ_CODES = {"R", "C", "N", "U"}  # 필수·선택·불필요·요강에 언급 없음
DOC_REQ = {"필수", "해당자", "임의", "일부 필수"}
EJU_KEYS = ["jp", "ki", "so", "m1", "m2", "ri"]

errors, warnings = [], []


def err(where, msg):
    errors.append(f"[오류] {where}: {msg}")


def warn(where, msg):
    warnings.append(f"[경고] {where}: {msg}")


def check_date(where, s):
    if not isinstance(s, str) or not DATE_RE.match(s):
        err(where, f"날짜 형식이 YYYY-MM-DD가 아님: {s!r}")
        return None
    try:
        return date.fromisoformat(s)
    except ValueError:
        err(where, f"없는 날짜: {s}")
        return None


def check_doc(d, path):
    w = path.name
    missing = [k for k in ("id", "year", "univ", "doc", "tracks") if k not in d]
    for k in missing:
        err(w, f"필수 항목 {k} 없음")
    if missing:
        return
    if not d["univ"].get("aliases"):
        warn(w, "univ.aliases가 비어 있음 (검색이 약해짐)")
    pages = d["doc"].get("pages") or 999
    for t in d["tracks"]:
        tw = f"{w} / {t.get('id')}"
        # 일정
        apply = [s for s in t.get("schedule", []) if s.get("k") == "apply"]
        if not apply:
            err(tw, "출원 기간(k=apply) 일정이 없음")
        for s in t.get("schedule", []):
            a = check_date(tw, s.get("start"))
            if s.get("end"):
                b = check_date(tw, s["end"])
                if a and b and b < a:
                    err(tw, f"{s.get('label')}: 끝 날짜가 시작보다 빠름")
        ap = apply[0] if apply else None
        if ap:
            ap_end = date.fromisoformat(ap.get("end") or ap["start"])
            for s in t.get("schedule", []):
                if s.get("k") in ("exam", "result1", "result", "enroll"):
                    if date.fromisoformat(s["start"]) < ap_end:
                        err(tw, f"{s.get('label')}가 출원 마감보다 빠름 — 날짜 확인")
        # 쪽 번호
        def pg(item, label):
            p = item.get("p")
            if p is None:
                warn(tw, f"{label}: 원문 쪽(p) 없음")
            elif not (1 <= p <= pages):
                err(tw, f"{label}: 쪽 번호 {p}가 범위 밖 (1~{pages})")
        for k in ("eligibility", "documents", "cautions", "selection", "schedule"):
            for i, it in enumerate(t.get(k, [])):
                pg(it, f"{k}[{i}]")
        # 서류
        for it in t.get("documents", []):
            if it.get("req") not in DOC_REQ:
                err(tw, f"서류 '{it.get('n')}'의 req 값이 {sorted(DOC_REQ)} 중 하나가 아님")
        # 모집 단위
        ncols = len(t.get("results", {}).get("cols", []))
        if not t.get("units"):
            err(tw, "units(학부·학과)가 비어 있음")
        for i, u in enumerate(t.get("units", [])):
            uw = f"{tw} / {u.get('fac')} {u.get('dept', '')}"
            for k in EJU_KEYS:
                if u.get("eju", {}).get(k) not in REQ_CODES:
                    err(uw, f"eju.{k} 값이 R/C/N/U가 아님")
            if u.get("en") not in REQ_CODES:
                err(uw, "en 값이 R/C/N/U가 아님")
            if ncols and u.get("res") is not None and len(u["res"]) != ncols:
                err(uw, f"res 칸 수 {len(u['res'])} ≠ results.cols {ncols}")
            mn = u.get("eju", {}).get("jp_min")
            if mn is not None and not (0 < mn <= 400):
                err(uw, f"EJU 일본어 기준점 {mn}이 0~400 밖")
        # 수수료
        f = t.get("fees", {})
        if f.get("exam") and not (5000 <= f["exam"] <= 60000):
            warn(tw, f"검정료 {f['exam']}엔 — 범위 확인")
    for s in d.get("translation", []):
        if s.get("p") and not (1 <= s["p"] <= pages):
            err(w, f"번역 섹션 {s.get('id')} 쪽 번호 범위 밖")
        if "否" in s.get("body", "") or "否" in s.get("title", ""):
            warn(w, f"번역 섹션 {s.get('id')}에 한자 '否'가 남아 있음")


def main():
    docs = []
    paths = [Path(ONLY)] if ONLY else sorted(DATA.glob("*/*.json"))
    for path in paths:
        try:
            d = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            err(path.name, f"JSON 문법 오류: {e}")
            continue
        n_before = len(errors)
        check_doc(d, path)
        if len(errors) == n_before:
            docs.append(d)
    ids = [d["id"] for d in docs]
    if len(ids) != len(set(ids)):
        err("전체", "id가 겹치는 모집요강이 있음")
    gl = json.loads((DATA / "glossary.json").read_text(encoding="utf-8"))

    for m in warnings:
        print(m)
    for m in errors:
        print(m)
    if errors:
        print(f"\n오류 {len(errors)}건 — yoko.js를 만들지 않았습니다.")
        sys.exit(1)
    if ONLY:
        print(f"검사 통과: {ONLY} (경고 {len(warnings)}건)")
        return

    payload = {"built": date.today().isoformat(), "docs": docs, "glossary": gl["terms"]}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        "/* 자동 생성 — 직접 고치지 말고 data/yoko/*.json을 고친 뒤 tools/build_yoko.py. 학원 밖 공개 금지 */\n"
        "window.YOKO_DATA = " + json.dumps(payload, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    n_units = sum(len(t["units"]) for d in docs for t in d["tracks"])
    print(f"완료: 모집요강 {len(docs)}건, 모집 단위 {n_units}개, 경고 {len(warnings)}건 → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--check":
        ONLY = sys.argv[2]
    main()
