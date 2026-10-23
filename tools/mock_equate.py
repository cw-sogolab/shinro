#!/usr/bin/env python3
"""모의고사 1~4회: 학원 방식 점수 vs 득점등화(Rasch) 점수 비교 → 엑셀 한 파일.

입력: iCloud 일공/자료/EJU성적/모의고사 성적/2026_{N}회_전국모의고사_채점시트.xlsx
      (과목 시트 독해·청해청독해·종합과목·물리·화학·생물: 변환점수(=학원 방식) + 문항별 정오표)
      EJU_점수예측_분석.xlsx 「11월예측_문과·이과」 (6월 EJU 실제 점수 — 1·2회와 비교용)
출력: iCloud .../모의고사 성적/EJU_모의고사_득점등화비교.xlsx  (이름·수험번호 포함 — 레포·공개 금지)

득점등화 방식 (성적노트 Core.equate · 선생님 실전.xlsx 「등화_*」 시트와 같은 Rasch 방식)
 1. 과목마다 1~4회 모든 문항을 한꺼번에 놓고 문항 난이도 b 를 추정. 같은 학생(102classID)의 능력은 4회 내내 같다고 봄. b 평균 = 0.
 2. 회차마다 정답수 r → 능력 θ  (그 회차 문항으로 Σσ(θ−b)=r, 0점·만점은 0.3 보정)
 3. 득점등화 점수 = 만점 × (그 과목 모든 문항에서 θ 의 평균 정답확률)  「1~4회 문항 전체 평균 난이도 시험을 봤다면 받았을 점수」
 한계: 능력이 회차마다 같다는 가정이라 실력이 늘어난 학생이 많으면 뒤 회차가 쉬웠던 것으로 읽힌다.

사용: python3 tools/mock_equate.py [--dir <모의고사 성적 폴더>] [--out <엑셀>] [--probe]
"""
import argparse
import os
import sys
import unicodedata
from pathlib import Path

import numpy as np
import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as L

DEFAULT_DIR = "~/Library/Mobile Documents/com~apple~CloudDocs/일공/자료/EJU성적/모의고사 성적"
OUTNAME = "EJU_모의고사_득점등화비교.xlsx"
SUBJ = [("jr", "독해", 200), ("jl", "청해청독해", 200), ("so", "종합과목", 200), ("phy", "물리", 100), ("chem", "화학", 100), ("bio", "생물", 100)]
SNAME = {k: n for k, n, _ in SUBJ}
SMAX = {k: m for k, _, m in SUBJ}
# 실제 EJU에서 나올 수 있는 최고점 (독해 199 + 청해·청독해 175 = 일본어 374). 득점등화 점수도 이 상한에 맞춘다. 종합·이과 과목은 확인된 값이 없어 만점 그대로.
EJUCAP = {"jr": 199, "jl": 175}
ROUNDS = [1, 2, 3, 4]


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
    if v is None or v == "" or isinstance(v, bool):
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def sheet(wb, name):
    for s in wb.sheetnames:
        if nfc(s) == nfc(name):
            return wb[s]
    return None


def sid_key(v):
    f = num(v)
    return str(int(f)) if f is not None else (str(v).strip() if v is not None else None)


# ---------------- 읽기 ----------------
def read_round(dirp, n, warn):
    f = resolve(f"{dirp}/2026_{n}회_전국모의고사_채점시트.xlsx")
    wb = openpyxl.load_workbook(f, read_only=True, data_only=True)
    idmap = {}
    wsi = sheet(wb, f"학생정보_2026_{n}회")
    if wsi is not None:
        R = [list(r) for r in wsi.iter_rows(values_only=True)]
        h = [nfc(x).strip() if x is not None else "" for x in R[0]]
        if "수험번호" in h and "102classID" in h:
            a, b = h.index("수험번호"), h.index("102classID")
            for r in R[1:]:
                if r[a] is not None and r[b]:
                    idmap[sid_key(r[a])] = str(r[b]).strip().lower()
    else:
        warn.append(f"{n}회: 학생정보 시트 없음 — 같은 학생 연결 불가")
    out = {}
    for key, name, mx in SUBJ:
        ws = sheet(wb, name)
        if ws is None:
            warn.append(f"{n}회 {name}: 시트 없음")
            continue
        R = [list(r) for r in ws.iter_rows(values_only=True)]
        if len(R) < 3:
            continue
        h2 = [nfc(x).strip() if isinstance(x, str) else x for x in R[1]]
        try:
            c_id, c_sc, c_cnt = h2.index("수험번호"), h2.index("변환점수"), h2.index("정답수/문제수")
        except ValueError:
            warn.append(f"{n}회 {name}: 머리글을 못 찾음 {h2[:5]}")
            continue
        c_nm = h2.index("이름") if "이름" in h2 else None
        N = 0
        for v in h2[4:]:
            if num(v) is None:
                break
            N += 1
        if not N:
            warn.append(f"{n}회 {name}: 문항 머리글 없음")
            continue
        rs, cs = 4, 4 + N + 1
        rows = []
        for r in R[2:]:
            sid = sid_key(r[c_id]) if r[c_id] is not None else None
            sc = num(r[c_sc])
            corr = [num(v) for v in r[cs:cs + N]]
            if sid is None or sc is None or all(v is None for v in corr):
                continue
            if not (0 <= sc <= mx):
                continue
            cnt = None
            if isinstance(r[c_cnt], str) and "/" in r[c_cnt]:
                try:
                    cnt = int(float(r[c_cnt].split("/")[0]))
                except ValueError:
                    pass
            rows.append({"sid": sid, "name": (str(r[c_nm]).strip() if c_nm is not None and r[c_nm] else ""), "hak": sc,
                         "x": np.array([np.nan if v is None else v for v in corr], float), "cnt": cnt, "cid": idmap.get(sid)})
        out[key] = {"N": N, "rows": rows}
    return out


# ---------------- Rasch ----------------
def sig(z):
    return 1 / (1 + np.exp(-z))


def fit_rasch(X, iters=300):
    """X: 사람×문항 (1/0/nan). 반환 θ(사람), b(문항, 평균 0). 만점·0점 사람과 전부 맞은/틀린 문항은 0.3 보정."""
    M = ~np.isnan(X)
    Z = np.where(M, X, 0.0)
    n_i = M.sum(1).astype(float)
    n_j = M.sum(0).astype(float)
    s_i = np.clip(Z.sum(1), 0.3, np.maximum(n_i - 0.3, 0.3))
    c_j = np.clip(Z.sum(0), 0.3, np.maximum(n_j - 0.3, 0.3))
    th = np.log(s_i / np.maximum(n_i - s_i, 0.3))
    b = -np.log(c_j / np.maximum(n_j - c_j, 0.3))
    b -= b.mean()
    for _ in range(iters):
        P = sig(th[:, None] - b[None, :]) * M
        g = P.sum(1) - s_i
        h = np.maximum((P * (1 - P)).sum(1), 1e-6)
        th = th - np.clip(g / h, -1, 1)
        P = sig(th[:, None] - b[None, :]) * M
        g = P.sum(0) - c_j
        h = np.maximum((P * (1 - P)).sum(0), 1e-6)
        b = b + np.clip(g / h, -1, 1)
        b -= b.mean()
    return th, b


def theta_of(r, bj):
    """정답수 r(0.3 보정) → θ : Σσ(θ−b)=r"""
    N = len(bj)
    t = float(np.clip(r, 0.3, N - 0.3))
    th = np.log(t / (N - t))
    for _ in range(60):
        P = sig(th - bj)
        g, h = P.sum() - t, max((P * (1 - P)).sum(), 1e-6)
        th -= np.clip(g / h, -1, 1)
    return th


def equate_subject(key, data):
    """data: {round: {N, rows}} → 같은 학생 능력 고정으로 문항난이도 추정 → 변환표·학생 점수 채움"""
    rounds = [n for n in ROUNDS if n in data]
    off, tot = {}, 0
    for n in rounds:
        off[n] = tot
        tot += data[n]["N"]
    persons = {}
    X = []
    for n in rounds:
        for r in data[n]["rows"]:
            pid = ("c", r["cid"]) if r["cid"] else ("s", n, r["sid"])
            if pid not in persons:
                persons[pid] = len(X)
                X.append(np.full(tot, np.nan))
            row = X[persons[pid]]
            x = np.where(np.isnan(r["x"]), 0.0, r["x"])   # 빈칸 = 틀림 (응시했으므로)
            row[off[n]:off[n] + data[n]["N"]] = x
            r["_pid"] = persons[pid]
    X = np.vstack(X)
    th, b = fit_rasch(X)
    mx = EJUCAP.get(key, SMAX[key])
    table = {}
    for n in rounds:
        N = data[n]["N"]
        bj = b[off[n]:off[n] + N]
        tb = []
        for r in range(N + 1):
            t = theta_of(r, bj)
            tb.append(float(mx * sig(t - b).mean()))
        table[n] = tb
        for r in data[n]["rows"]:
            r["r"] = int(round(float(np.nansum(r["x"]))))
            r["eq"] = tb[r["r"]]
    return {"b": b, "off": off, "table": table, "rounds": rounds, "npersons": len(X)}


# ---------------- 통계 ----------------
def ranks(v):
    o = np.argsort(v, kind="mergesort")
    r = np.empty(len(v))
    r[o] = np.arange(len(v))
    for u in np.unique(v):   # 동점은 평균 순위
        m = v == u
        r[m] = r[m].mean()
    return r


def corr(a, b):
    if len(a) < 3 or np.std(a) == 0 or np.std(b) == 0:
        return float("nan")
    return float(np.corrcoef(a, b)[0, 1])


def compare(rows):
    a = np.array([r["hak"] for r in rows]); e = np.array([r["eq"] for r in rows])
    d = e - a
    if np.std(a) > 0:
        beta, alpha = np.polyfit(a, e, 1)
        rmse = float(np.sqrt(np.mean((e - (alpha + beta * a)) ** 2)))
    else:
        rmse = float("nan")
    by = {}
    for r in rows:
        by.setdefault(r["r"], []).append(r["hak"])
    spans = [max(v) - min(v) for v in by.values() if len(v) >= 2]
    return {"n": len(rows), "mean_hak": a.mean(), "mean_eq": e.mean(), "bias": d.mean(), "rmse": rmse, "span": float(np.mean(spans)) if spans else 0.0,
            "r": corr(a, e), "rho": corr(ranks(a), ranks(e))}


def read_eju6(dirp, warn):
    """6월 EJU 실제 점수 (수험번호 → {jp, so}) — 11월예측 시트에서"""
    out = {}
    try:
        wb = openpyxl.load_workbook(resolve(f"{dirp}/EJU_점수예측_분석.xlsx"), read_only=True, data_only=True)
    except Exception as ex:
        warn.append(f"6월 EJU 읽기 실패: {ex}")
        return out
    for nm in ("11월예측_문과", "11월예측_이과"):
        ws = sheet(wb, nm)
        if ws is None:
            continue
        R = [list(r) for r in ws.iter_rows(values_only=True, max_row=400)]
        g = [nfc(x).strip() if x else "" for x in R[2]]
        s = [nfc(x).strip() if x else "" for x in R[3]]
        grp, cur = [], ""
        for x in g:
            cur = x or cur
            grp.append(cur)
        col = {(grp[i], s[i]): i for i in range(len(s)) if s[i]}
        cj, cs_ = col.get(("6월EJU", "일본어")), col.get(("6월EJU", "종합"))
        for r in R[4:]:
            sid = sid_key(r[2]) if len(r) > 2 and r[2] is not None else None
            if not sid:
                continue
            e = out.setdefault(sid, {})
            if cj is not None and num(r[cj]) is not None and 0 < num(r[cj]) <= 400:
                e["jp"] = num(r[cj])
            if cs_ is not None and num(r[cs_]) is not None and 0 < num(r[cs_]) <= 200:
                e["so"] = num(r[cs_])
    return out


# ---------------- 엑셀 ----------------
INK, MUTE, LINE = "1F1F1F", "6B6B6B", "E4E4E4"
F_H = PatternFill("solid", fgColor="F1F1EF")
F_G = PatternFill("solid", fgColor="E8F1EC")
F_R = PatternFill("solid", fgColor="FDEBEC")
THIN = Side(style="thin", color=LINE)
BOX = Border(top=THIN, bottom=THIN, left=THIN, right=THIN)


def put(ws, r, c, v, bold=False, fill=None, fmt=None, al="left", color=INK, size=10, wrap=False, border=True):
    cell = ws.cell(row=r, column=c, value=v)
    cell.font = Font(name="Malgun Gothic", size=size, bold=bold, color=color)
    if fill:
        cell.fill = fill
    if fmt:
        cell.number_format = fmt
    cell.alignment = Alignment(horizontal=al, vertical="center", wrap_text=wrap)
    if border:
        cell.border = BOX
    return cell


def write_xlsx(path, data, eq, eju, stats, warn):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "요약"
    # ---- 요약 ----
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 2
    put(ws, 2, 2, "모의고사 1~4회 — 학원 방식 vs 득점등화 점수 비교", True, size=16, border=False)
    put(ws, 3, 2, "2026 전국모의고사 · 독해·청해청독해(일본어) · 종합 · 물리·화학·생물 · 수학(코스1·2)은 채점 형식이 달라 제외", color=MUTE, border=False)
    r = 5
    put(ws, r, 2, "■ 한 줄 결론", True, size=12, border=False); r += 1
    real = {k: v for k, v in stats.items() if not v.get("_eju_only")}
    mn_rho = min(v["rho"] for v in real.values())
    mean_rho = float(np.mean([v["rho"] for v in real.values()]))
    mean_span = float(np.mean([v["span"] / SMAX[k[1]] * 100 for k, v in real.items()]))
    ejs = [v["eju"] for v in stats.values() if "eju" in v]
    concl = [
        f"1. 학생 순위는 두 방식이 거의 같습니다. 학원 점수와 득점등화 점수의 순위 상관은 모든 회차·과목에서 {mn_rho:.2f} 이상(평균 {mean_rho:.2f})입니다.",
        "2. 득점등화 점수는 실제 EJU 상한(독해 199, 청해·청독해 175, 일본어 합 374)에 맞춰 환산했습니다. 학원 점수의 만점 구간도 198/174~175라 이 두 과목은 척도가 같습니다. 종합은 학원 점수가 EJU 점수대로 환산돼 있어(정답률 42%가 130/200) 득점등화 평균보다 약 30점 높은데, 이는 척도 차이라 순위·간격으로 비교해야 합니다.",
        (f"3. 학원 점수는 문항마다 배점이 달라 같은 정답수라도 점수가 벌어집니다(평균 폭 만점의 약 {mean_span:.0f}%). 득점등화는 정답수가 같으면 점수가 같습니다. "
         + (f"6월 EJU와의 상관은 정답수·학원·득점등화 세 방식의 차이가 최대 {max(max(e['r_hak'], e['r_eq'], e['r_raw']) - min(e['r_hak'], e['r_eq'], e['r_raw']) for e in ejs):.2f}에 그쳐 예측력은 비슷합니다 (1·2회, 아래 표)." if ejs else "")),
    ]
    for t in concl:
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=13)
        put(ws, r, 2, t, wrap=True, border=False); ws.row_dimensions[r].height = 34; r += 1
    r += 1
    put(ws, r, 2, "■ 회차·과목별 비교 (같은 학생의 학원 점수 vs 득점등화 점수)", True, size=12, border=False); r += 1
    heads = ["회차", "과목", "응시", "학원 평균", "득점등화 평균", "평균 점수 차(척도)", "순위 상관", "상관 r", "선형 맞춘 뒤 오차(RMSE)", "같은 정답수 안 학원 점수 폭", "정답률(회차 난이도)"]
    for i, h in enumerate(heads):
        put(ws, r, 2 + i, h, True, F_H, al="center", wrap=True)
    ws.row_dimensions[r].height = 30; r += 1
    for n in ROUNDS:
        for key, name, mx in SUBJ:
            v = stats.get((n, key))
            if not v:
                continue
            p = v["p"]
            vals = [f"{n}회", name, v["n"], v["mean_hak"], v["mean_eq"], v["bias"], v["rho"], v["r"], v["rmse"], v["span"], p]
            fm = [None, None, "0", "0.0", "0.0", "+0.0;-0.0;0.0", "0.000", "0.000", "0.0", "0.0", "0%"]
            for i, (x, f) in enumerate(zip(vals, fm)):
                put(ws, r, 2 + i, x, fmt=f, al="center" if i < 2 else "right")
            r += 1
    ws.cell(row=r, column=2, value="※ 평균 점수 차는 척도가 달라서 생기는 값이라 좋고 나쁨이 아닙니다. 선형 맞춘 뒤 오차 = 학원 점수로 득점등화 점수를 직선으로 맞췄을 때 남는 오차(득점등화 점수 단위). 같은 정답수 안 폭 = 정답수가 같은 학생끼리 학원 점수가 벌어진 폭의 평균(배점 효과).").font = Font(size=9, color=MUTE)
    r += 2
    # 6월 EJU 상관
    put(ws, r, 2, "■ 6월 EJU 실제 점수와의 상관 (어느 점수가 EJU를 더 잘 설명하나 · 1·2회)", True, size=12, border=False); r += 1
    h2 = ["회차", "과목", "비교 인원", "학원 점수 r", "득점등화 r", "정답수 r", "더 높은 쪽"]
    for i, h in enumerate(h2):
        put(ws, r, 2 + i, h, True, F_H, al="center")
    r += 1
    anyrow = False
    for (n, key), v in sorted(stats.items()):
        if "eju" not in v:
            continue
        e = v["eju"]
        best = max([("학원", e["r_hak"]), ("득점등화", e["r_eq"]), ("정답수", e["r_raw"])], key=lambda t: t[1])
        diff = max(e["r_hak"], e["r_eq"], e["r_raw"]) - sorted([e["r_hak"], e["r_eq"], e["r_raw"]])[-2]
        lab = best[0] if diff >= 0.01 else "비슷함"
        for i, (x, f) in enumerate([(f"{n}회", None), ("일본어(독해+청해청독해)" if key == "jp" else SNAME[key], None), (e["n"], "0"), (e["r_hak"], "0.000"), (e["r_eq"], "0.000"), (e["r_raw"], "0.000"), (lab, None)]):
            put(ws, r, 2 + i, x, fmt=f, al="center" if i in (0, 1, 6) else "right")
        r += 1; anyrow = True
    if not anyrow:
        put(ws, r, 2, "수험번호로 6월 EJU 점수를 짝지은 학생이 없어 비교하지 못했습니다.", color=MUTE, border=False); r += 1
    ws.cell(row=r, column=2, value="※ 같은 학생의 모의 점수와 6월 EJU 실제 점수 사이의 피어슨 상관. 0.01 이상 차이 나야 「더 높은 쪽」으로 표시, 아니면 「비슷함」. 일본어는 두 과목 합(400점).").font = Font(size=9, color=MUTE)
    r += 2
    put(ws, r, 2, "■ 시트 안내", True, size=12, border=False); r += 1
    guide = [("1회~4회", "학생별: 정답수 · 학원 점수 · 득점등화 점수 · 차이 (과목별). 일본어 합계도 같이"),
             ("변환표", "정답수가 몇 개면 학원 점수는 몇 점 범위(최저~최고), 득점등화는 몇 점인지"),
             ("문항난이도", "문항별 정답률과 득점등화가 추정한 난이도 b"),
             ("방법", "득점등화 계산 순서와 한계")]
    for a, b in guide:
        put(ws, r, 2, a, True, F_H); ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=13); put(ws, r, 3, b); r += 1
    if warn:
        r += 1
        put(ws, r, 2, "■ 읽을 때 걸린 점", True, size=12, border=False); r += 1
        for w in warn[:12]:
            ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=13); put(ws, r, 2, w, color=MUTE, border=False); r += 1
    widths = [2, 8, 12, 8, 11, 12, 12, 10, 10, 14, 14, 12, 4]
    for i, w in enumerate(widths):
        ws.column_dimensions[L(i + 1)].width = w
    # ---- 회차별 ----
    for n in ROUNDS:
        if n not in {k[0] for k in stats}:
            continue
        w = wb.create_sheet(f"{n}회")
        subs = [(k, nm, mx) for k, nm, mx in SUBJ if k in data[n]]
        w.freeze_panes = "D4"
        put(w, 1, 1, f"{n}회 — 학생별 학원 점수 vs 득점등화 점수   (순위차 = 학원 등수 − 득점등화 등수, +면 득점등화에서 더 높은 순위 · 점수 자체는 척도가 달라 직접 빼지 않음)", True, size=12, border=False)
        heads = [("이름", 12), ("수험번호", 11), ("102 연결", 9)]
        for i, (h, wd) in enumerate(heads):
            put(w, 3, 1 + i, h, True, F_H, al="center"); w.merge_cells(start_row=3, start_column=1 + i, end_row=3, end_column=1 + i)
            w.column_dimensions[L(1 + i)].width = wd
        c = 4
        order = {}
        for key, nm, mx in subs + [("jp", "일본어 합(독해+청해청독해)", 400)]:
            if key == "jp" and not ("jr" in data[n] and "jl" in data[n]):
                continue
            w.merge_cells(start_row=2, start_column=c, end_row=2, end_column=c + 3)
            put(w, 2, c, f"{nm} ({mx}점)", True, F_H, al="center")
            for j in range(1, 4):
                put(w, 2, c + j, None, fill=F_H)
            for j, h in enumerate(["정답수" if key != "jp" else "정답수 합", "학원", "득점등화", "순위차"]):
                put(w, 3, c + j, h, True, F_H, al="center")
                w.column_dimensions[L(c + j)].width = 8 if j == 0 else 9
            order[key] = c
            c += 4
        stu = {}
        for key, nm, mx in subs:
            for rr in data[n][key]["rows"]:
                s = stu.setdefault(rr["sid"], {"name": rr["name"], "cid": rr["cid"] or ""})
                s[key] = rr
        rowi = 4
        last = 3 + len(stu)
        for sid, s in sorted(stu.items(), key=lambda t: (t[1]["name"], t[0])):
            put(w, rowi, 1, s["name"]); put(w, rowi, 2, int(sid) if sid.isdigit() else sid, al="center", fmt="0"); put(w, rowi, 3, "○" if s["cid"] else "", al="center")
            for key, nm, mx in subs:
                cc = order[key]
                rr = s.get(key)
                if rr:
                    put(w, rowi, cc, rr["r"], al="right", fmt="0"); put(w, rowi, cc + 1, rr["hak"], al="right", fmt="0")
                    put(w, rowi, cc + 2, round(rr["eq"], 1), al="right", fmt="0.0")
                    put(w, rowi, cc + 3, f"=RANK({L(cc + 1)}{rowi},{L(cc + 1)}$4:{L(cc + 1)}${last})-RANK({L(cc + 2)}{rowi},{L(cc + 2)}$4:{L(cc + 2)}${last})", al="right", fmt="+0;-0;0")
                else:
                    for j in range(4):
                        put(w, rowi, cc + j, None)
            if "jp" in order:
                cc = order["jp"]
                a, b2 = s.get("jr"), s.get("jl")
                if a and b2:
                    put(w, rowi, cc, a["r"] + b2["r"], al="right", fmt="0"); put(w, rowi, cc + 1, a["hak"] + b2["hak"], al="right", fmt="0")
                    put(w, rowi, cc + 2, round(a["eq"] + b2["eq"], 1), al="right", fmt="0.0")
                    put(w, rowi, cc + 3, f"=RANK({L(cc + 1)}{rowi},{L(cc + 1)}$4:{L(cc + 1)}${last})-RANK({L(cc + 2)}{rowi},{L(cc + 2)}$4:{L(cc + 2)}${last})", al="right", fmt="+0;-0;0")
                else:
                    for j in range(4):
                        put(w, rowi, cc + j, None)
            rowi += 1
        w.auto_filter.ref = f"A3:{L(c - 1)}{rowi - 1}"
    # ---- 변환표 ----
    wt = wb.create_sheet("변환표")
    put(wt, 1, 1, "정답수 → 점수  (학원 점수는 학생마다 다를 수 있어 최저~최고 범위로 표시)", True, size=13, border=False)
    c = 1
    for key, nm, mx in SUBJ:
        if key not in eq:
            continue
        for n in eq[key]["rounds"]:
            wt.merge_cells(start_row=2, start_column=c, end_row=2, end_column=c + 3)
            put(wt, 2, c, f"{n}회 {nm} ({mx}점)", True, F_H, al="center")
            for j in range(1, 4):
                put(wt, 2, c + j, None, fill=F_H)
            for j, h in enumerate(["정답수", "학원 최저", "학원 최고", "득점등화"]):
                put(wt, 3, c + j, h, True, F_H, al="center"); wt.column_dimensions[L(c + j)].width = 9
            by = {}
            for rr in data[n][key]["rows"]:
                by.setdefault(rr["r"], []).append(rr["hak"])
            for rcount, val in enumerate(eq[key]["table"][n]):
                put(wt, 4 + rcount, c, rcount, al="center", fmt="0")
                hs = by.get(rcount)
                put(wt, 4 + rcount, c + 1, min(hs) if hs else None, al="right", fmt="0"); put(wt, 4 + rcount, c + 2, max(hs) if hs else None, al="right", fmt="0")
                put(wt, 4 + rcount, c + 3, round(val, 1), al="right", fmt="0.0")
            c += 5
    wt.freeze_panes = "A4"
    # ---- 문항난이도 ----
    wd = wb.create_sheet("문항난이도")
    put(wd, 1, 1, "문항별 정답률과 득점등화 난이도 b (클수록 어려움, 1~4회 전체 평균 0)", True, size=13, border=False)
    for i, h in enumerate(["과목", "회차", "문항", "정답률", "난이도 b"]):
        put(wd, 3, 1 + i, h, True, F_H, al="center")
    rr_ = 4
    for key, nm, mx in SUBJ:
        if key not in eq:
            continue
        for n in eq[key]["rounds"]:
            X = np.vstack([x["x"] for x in data[n][key]["rows"]])
            off, N = eq[key]["off"][n], data[n][key]["N"]
            for j in range(N):
                put(wd, rr_, 1, nm); put(wd, rr_, 2, f"{n}회", al="center"); put(wd, rr_, 3, j + 1, al="center", fmt="0")
                put(wd, rr_, 4, float(np.nanmean(X[:, j])), al="right", fmt="0%"); put(wd, rr_, 5, round(float(eq[key]["b"][off + j]), 2), al="right", fmt="0.00")
                rr_ += 1
    for i, wdt in enumerate([12, 8, 8, 9, 10]):
        wd.column_dimensions[L(i + 1)].width = wdt
    wd.freeze_panes = "A4"; wd.auto_filter.ref = f"A3:E{rr_ - 1}"
    # ---- 방법 ----
    wm = wb.create_sheet("방법")
    wm.sheet_view.showGridLines = False
    wm.column_dimensions["A"].width = 2; wm.column_dimensions["B"].width = 120
    lines = ["득점등화 계산 방법 (성적노트 Core.equate · 선생님 실전.xlsx 「등화_*」 시트와 같은 Rasch 방식)", "",
             "1. 과목마다 1~4회 모든 문항을 한 표에 놓습니다. 같은 학생(102classID로 연결)의 능력은 4회 내내 같다고 보고, 문항 난이도 b와 학생 능력 θ를 함께 추정합니다. b의 평균은 0.",
             "2. 회차마다 정답수 r → θ: 그 회차 문항으로 Σσ(θ−b) = r 이 되는 θ. 0점·만점은 0.3 보정.",
             "3. 득점등화 점수 = 상한 × (그 과목 1~4회 모든 문항에서 θ의 평균 정답확률). 상한은 실제 EJU 최고점: 독해 199, 청해·청독해 175 (일본어 합 374), 그 밖의 과목은 만점. 「1~4회 문항 전체의 평균 난이도 시험을 봤다면 받았을 점수」입니다.",
             "4. 같은 회차에서는 정답수가 같으면 득점등화 점수도 같습니다 (정답수가 곧 점수를 결정하는 방식).", "",
             "학원 점수: 채점시트 과목 시트의 「변환점수」를 그대로 썼습니다. 문항마다 배점이 달라서 같은 정답수라도 점수가 다를 수 있습니다.", "",
             "한계", "· 학생 능력이 4회 내내 같다는 가정입니다. 3월부터 11월까지 실력이 늘어난 학생이 많으면 뒤 회차가 실제보다 쉬웠던 것으로 읽혀 득점등화 점수가 낮게 나올 수 있습니다.",
             "· 4회를 모두 본 학생이 적은 과목(물리·화학·생물)은 문항 난이도 추정이 불안정합니다.",
             "· 수험번호는 회차마다 달라서 학생정보 시트의 102classID로 같은 학생을 이었습니다. 연결되지 않은 학생은 그 회차 안의 문항에만 기여합니다.",
             "· 득점등화는 문항 난이도의 차이만 반영하고, 선택지·변별도 같은 문항 특성은 반영하지 않습니다 (2·3모수와의 비교는 「모델비교」 결과: 예측 정확도 차이 없음)."]
    for i, t in enumerate(lines):
        c_ = wm.cell(row=2 + i, column=2, value=t)
        c_.font = Font(name="Malgun Gothic", size=13 if i == 0 else 10, bold=(i == 0 or t == "한계"), color=INK)
        c_.alignment = Alignment(wrap_text=True, vertical="top")
    wb.save(path)


# ---------------- 실행 ----------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=DEFAULT_DIR)
    ap.add_argument("--out", default=None)
    ap.add_argument("--probe", action="store_true")
    a = ap.parse_args()
    dirp = str(resolve(a.dir))
    warn = []
    data = {}
    for n in ROUNDS:
        try:
            data[n] = read_round(dirp, n, warn)
        except FileNotFoundError:
            warn.append(f"{n}회 채점시트 없음")
            continue
        print(n, "회:", {k: (v["N"], len(v["rows"])) for k, v in data[n].items()}, flush=True)
        for key, v in data[n].items():
            bad = [(r["sid"], r["cnt"], int(np.nansum(r["x"]))) for r in v["rows"] if r["cnt"] is not None and r["cnt"] != int(np.nansum(r["x"]))]
            if bad:
                warn.append(f"{n}회 {SNAME[key]}: 시트의 정답수와 정오표 합이 다른 학생 {len(bad)}명 (정오표 합을 사용)")
    if a.probe:
        for w in warn:
            print("!", w)
        return
    bysub = {k: {n: data[n][k] for n in ROUNDS if n in data and k in data[n]} for k, _, _ in SUBJ}
    eq = {}
    for k, d in bysub.items():
        if d:
            eq[k] = equate_subject(k, d)
            print(f"{SNAME[k]}: 학생(연결 후) {eq[k]['npersons']}명, 문항 {len(eq[k]['b'])}개", flush=True)
    stats = {}
    for k, d in bysub.items():
        for n, v in d.items():
            s = compare(v["rows"])
            s["p"] = float(np.mean([np.nanmean(r["x"]) for r in v["rows"]]))
            stats[(n, k)] = s
    eju = read_eju6(dirp, warn)
    for n in (1, 2):
        if n not in data:
            continue
        # 일본어 합은 독해+청해청독해
        if "jr" in data[n] and "jl" in data[n]:
            jr = {r["sid"]: r for r in data[n]["jr"]["rows"]}
            jl = {r["sid"]: r for r in data[n]["jl"]["rows"]}
            pairs = [(jr[s], jl[s]) for s in jr if s in jl and s in eju and "jp" in eju[s]]
            if len(pairs) >= 10:
                y = np.array([eju[a_["sid"]]["jp"] for a_, _ in pairs])
                e = {"n": len(pairs), "r_hak": corr(np.array([a_["hak"] + b_["hak"] for a_, b_ in pairs]), y),
                     "r_eq": corr(np.array([a_["eq"] + b_["eq"] for a_, b_ in pairs]), y),
                     "r_raw": corr(np.array([a_["r"] + b_["r"] for a_, b_ in pairs], float), y)}
                stats[(n, "jp")] = {**stats[(n, "jr")], "eju": e, "n": len(pairs), "mean_hak": float("nan"), "mean_eq": float("nan"), "bias": float("nan"),
                                    "rmse": float("nan"), "span": float("nan"), "r": float("nan"), "rho": float("nan"), "p": float("nan"), "_eju_only": True}
        if "so" in data[n]:
            pairs = [r for r in data[n]["so"]["rows"] if r["sid"] in eju and "so" in eju[r["sid"]]]
            if len(pairs) >= 10:
                y = np.array([eju[r["sid"]]["so"] for r in pairs])
                stats[(n, "so")]["eju"] = {"n": len(pairs), "r_hak": corr(np.array([r["hak"] for r in pairs]), y), "r_eq": corr(np.array([r["eq"] for r in pairs]), y),
                                           "r_raw": corr(np.array([r["r"] for r in pairs], float), y)}
    # 요약 표에는 일본어 합 행을 넣지 않기 위해 따로 분리
    eju_rows = {k: v for k, v in stats.items() if v.get("_eju_only")}
    base = {k: v for k, v in stats.items() if not v.get("_eju_only")}
    for k, v in eju_rows.items():
        base[k] = v
    out = Path(a.out) if a.out else Path(dirp) / OUTNAME
    write_xlsx(out, data, eq, eju, base, warn)
    print("완료:", out, flush=True)
    for w in warn:
        print("!", w)


if __name__ == "__main__":
    main()
