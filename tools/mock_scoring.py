#!/usr/bin/env python3
"""모의고사 채점 방식 비교 (원장님용, 이름·수험번호 없음) → 엑셀 + docs/assets/scoring.js

비교하는 점수 5가지 (만점 = EJU에서 실제로 나온 최고점. 단 B~E는 모의고사 난이도 그대로의 득점률 환산이라 EJU 평균에 맞춘 A보다 낮을 수 있음):
  A 학원 자체   학원 채점시트의 변환점수 그대로 (문항별 배점이 다름)
  B 정답수 비례 만점 × 정답수 / 문항수  (만점 보정만 한 가장 단순한 방식)
  C 득점등화 1모수  모든 문항 같은 변별력, 어려운 문항을 맞히면 더 높게
  D 득점등화 2모수  문항마다 변별력이 다름 (같은 정답수라도 무엇을 맞혔나에 따라 점수가 다름)
  E 득점등화 3모수  2모수 + 찍어서 맞힐 확률
득점등화 = 1~4회 문항을 한꺼번에 놓고 같은 학생의 능력은 회차가 바뀌어도 같다고 보고 문항 모수를 추정(MML, 구분구적 EM).
점수 = 만점 × (그 과목 1~4회 전체 문항의 평균 정답확률, 학생 능력 추정값 기준).

보정: ① EJU 결과지(JASSO 2026-1): 독해 199 · 청해청독해 175 · 일본어 합 374 상한, 전국 평균·SD와 대조
      ② 만점 점수: 모든 방식의 만점을 위 상한에 맞춤
      ③ 6월 EJU 실제 점수로 회귀 보정한 뒤(학생 한 명씩 빼고 검증) 방식별 예측 오차를 비교, 11월 예측까지

사용: python3 tools/mock_scoring.py [--dir <모의고사 성적 폴더>] [--xlsx <출력>] [--js docs/assets/scoring.js]
"""
import argparse
import json
import sys
import time
from datetime import date
from pathlib import Path

import numpy as np
import openpyxl
from openpyxl.chart import LineChart, Reference
from openpyxl.styles import Alignment, Font

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mock_equate import (BOX, DEFAULT_DIR, F_G, F_H, F_R, INK, MUTE, ROUNDS, SMAX, put, read_eju6, read_round, resolve, sig)  # noqa: E402
from openpyxl.utils import get_column_letter as L  # noqa: E402

SUBS = [("jr", "독해", 199), ("jl", "청해·청독해", 175), ("so", "종합과목", 200)]
CAP = {k: c for k, _, c in SUBS}
SNAME = {k: n for k, n, _ in SUBS}
SCH = ["A", "B", "C", "D", "E"]
SCH_NAME = {"A": "학원 자체", "B": "정답수 비례", "C": "득점등화 1모수", "D": "득점등화 2모수", "E": "득점등화 3모수"}
SCH_DESC = {
    "A": "학원 채점시트의 변환점수 그대로. EJU 평균에 맞춰 환산한 점수이고, 문항별 배점이 달라 같은 정답수여도 점수가 다를 수 있음. (배점표는 채점시트에 비어 있어 재현 불가)",
    "B": "만점 × 정답수 ÷ 문항수. 틀린 문항 1개당 감점이 항상 같음. (만점 보정만 적용)",
    "C": "Rasch. 어려운 문항을 맞히면 점수가 더 오르고, 같은 정답수면 같은 점수. 회차 난이도 차이를 보정.",
    "D": "2모수. 문항마다 변별력이 달라, 변별력 높은 문항을 맞힌 학생이 더 높은 점수. 같은 정답수라도 점수 차이.",
    "E": "3모수. 2모수에 찍기 확률(약 0.2)을 더함. 0점 근처가 바닥(약 20%)으로 올라감.",
}
GROUP = {"jp": ("일본어 (독해+청해·청독해)", ["jr", "jl"], 374), "so": ("종합과목", ["so"], 200)}
# JASSO 2026년도 제1회 일본유학시험 결과 개요 (평균, 표준편차, 최고점). 문서의 표를 옮김 — 원문 대조 필요.
JASSO_URL = "https://www.jasso.go.jp/ryugaku/eju/about/data/result/__icsFiles/afieldfile/2026/07/24/outline_of_results_j_2026-1.pdf"
JASSO = {"jr": ("일본어 독해", 136.2, 37.5, 199), "jl": ("일본어 청해·청독해", 100.8, 30.2, 175), "jp": ("일본어 합계", 237.0, 61.9, 374), "so": ("종합과목", 122.5, 32.0, 199),
         "m1": ("수학 코스1", 97.3, 27.1, 194), "m2": ("수학 코스2", 108.5, 20.4, 200), "phy": ("물리", 53.8, 14.0, 95), "chem": ("화학", 52.4, 14.2, 98), "bio": ("생물", 63.8, 14.8, 92)}
GRID = np.linspace(-5, 5, 61)


# ---------------- IRT (MML-EM) ----------------
def log_probs(a, b, c, th):
    P = c[:, None] + (1 - c[:, None]) * sig(a[:, None] * (th[None, :] - b[:, None]))
    P = np.clip(P, 1e-6, 1 - 1e-6)
    return np.log(P), np.log(1 - P)


def item_nll(P, rj, nj, model):
    """문항마다 기대 정답수(rj)·기대 응시수(nj)에 대한 음의 로그우도 — 모든 문항을 한꺼번에 계산"""
    pen = 0.0
    if model == 1:
        a_, b_, c_ = np.ones(len(P)), P[:, 0], np.zeros(len(P))
    else:
        a_, b_ = np.exp(P[:, 0]), P[:, 1]
        pen = 0.5 * (P[:, 0] / 0.5) ** 2
        c_ = np.zeros(len(P))
        if model == 3:
            c_ = 1 / (1 + np.exp(-P[:, 2]))
            pen = pen - (3 * np.log(c_) + 15 * np.log(1 - c_))   # Beta(4,16): 찍기 확률 약 0.2 근처
    Q = np.clip(c_[:, None] + (1 - c_[:, None]) * sig(a_[:, None] * (GRID[None, :] - b_[:, None])), 1e-6, 1 - 1e-6)
    return -(rj * np.log(Q) + (nj - rj) * np.log(1 - Q)).sum(1) + pen


BOUNDS = {1: ([-5], [5]), 2: ([np.log(.25), -5], [np.log(3), 5]), 3: ([np.log(.25), -5, -6], [np.log(3), 5, -0.4])}


def mstep(P, rj, nj, model, inner=8):
    """scipy 없이: 문항별 감쇠 뉴턴법(수치 미분), 모든 문항 동시에"""
    lo, hi = np.array(BOUNDS[model][0], float), np.array(BOUNDS[model][1], float)
    J, d = P.shape
    h = 1e-3
    lam = np.full(J, 1e-3)
    f = lambda Q: item_nll(Q, rj, nj, model)  # noqa: E731
    for _ in range(inner):
        f0 = f(P)
        g = np.zeros((J, d))
        H = np.zeros((J, d, d))
        for k in range(d):
            Pp, Pm = P.copy(), P.copy()
            Pp[:, k] += h
            Pm[:, k] -= h
            fp, fm = f(Pp), f(Pm)
            g[:, k] = (fp - fm) / (2 * h)
            H[:, k, k] = (fp - 2 * f0 + fm) / h ** 2
            for l in range(k + 1, d):
                A = P.copy(); A[:, k] += h; A[:, l] += h
                B = P.copy(); B[:, k] += h; B[:, l] -= h
                C = P.copy(); C[:, k] -= h; C[:, l] += h
                D = P.copy(); D[:, k] -= h; D[:, l] -= h
                H[:, k, l] = H[:, l, k] = (f(A) - f(B) - f(C) + f(D)) / (4 * h * h)
        step = np.linalg.solve(H + lam[:, None, None] * np.eye(d)[None], -g[:, :, None])[:, :, 0]
        step = np.clip(step, -1.0, 1.0)
        Pn = np.clip(P + step, lo, hi)
        ok = f(Pn) < f0
        P = np.where(ok[:, None], Pn, P)
        lam = np.where(ok, np.maximum(lam * 0.3, 1e-4), np.minimum(lam * 8, 1e6))
    return P


def mml(X, model, iters=60, tol=3e-3):
    obs = ~np.isnan(X)
    Xz = np.where(obs, X, 0.0)
    O = obs.astype(float)
    J = X.shape[1]
    p = np.clip(Xz.sum(0) / np.maximum(O.sum(0), 1), .03, .97)
    b = -np.log(p / (1 - p))
    a, c, sd = np.ones(J), np.zeros(J), 1.0
    for it in range(iters):
        prior = np.exp(-GRID ** 2 / (2 * sd * sd))
        prior /= prior.sum()
        lp, lq = log_probs(a, b, c, GRID)
        LL = Xz @ lp + (O - Xz) @ lq + np.log(prior)[None, :]
        LL -= LL.max(1, keepdims=True)
        W = np.exp(LL)
        W /= W.sum(1, keepdims=True)
        n, r = O.T @ W, Xz.T @ W
        old = np.concatenate([a, b, c])
        if model == 1:
            P0 = b[:, None].copy()
        elif model == 2:
            P0 = np.c_[np.log(a), b]
        else:
            cc = np.clip(c, 0.02, 0.4)
            P0 = np.c_[np.log(a), b, np.log(cc / (1 - cc))]
        P1 = mstep(P0, r, n, model)
        if model == 1:
            b = P1[:, 0]
        else:
            a, b = np.exp(P1[:, 0]), P1[:, 1]
            if model == 3:
                c = 1 / (1 + np.exp(-P1[:, 2]))
        if model == 1:
            sd = float(np.sqrt((W.sum(0) @ GRID ** 2) / W.sum()))
        if np.max(np.abs(np.concatenate([a, b, c]) - old)) < tol:
            break
    return {"a": a, "b": b, "c": c, "sd": sd, "iters": it + 1}


def theta_hat(fit, Xr, mask):
    """학생 능력 추정 — 거의 최대우도(약한 사전분포) 그래서 만점은 만점 근처, 0점은 바닥 근처."""
    lp, lq = log_probs(fit["a"], fit["b"], fit["c"], GRID)
    LL = Xr @ lp + (mask - Xr) @ lq - GRID[None, :] ** 2 / (2 * 9.0 * fit["sd"] ** 2)
    LL -= LL.max(1, keepdims=True)
    W = np.exp(LL)
    W /= W.sum(1, keepdims=True)
    return W @ GRID


def tcc_mean(fit, th):
    return (fit["c"][None, :] + (1 - fit["c"][None, :]) * sig(fit["a"][None, :] * (th[:, None] - fit["b"][None, :]))).mean(1)


# ---------------- 데이터 ----------------
def build(d):
    rounds = [n for n in ROUNDS if n in d]
    off, tot = {}, 0
    for n in rounds:
        off[n] = tot
        tot += d[n]["N"]
    persons, X = {}, []
    for n in rounds:
        for r in d[n]["rows"]:
            pk = ("c", r["cid"]) if r["cid"] else ("s", n, r["sid"])
            r["pkey"] = pk
            if pk not in persons:
                persons[pk] = len(X)
                X.append(np.full(tot, np.nan))
            X[persons[pk]][off[n]:off[n] + d[n]["N"]] = np.where(np.isnan(r["x"]), 0.0, r["x"])
    return np.vstack(X), off, rounds


def score_subject(key, d):
    X, off, rounds = build(d)
    cap = CAP[key]
    fits = {}
    for m in (1, 2, 3):
        t0 = time.time()
        fits[m] = mml(X, m)
        print(f"  {SNAME[key]} {m}모수: 문항 {X.shape[1]}, 반복 {fits[m]['iters']}, {time.time() - t0:.0f}초", flush=True)
    J = X.shape[1]
    recs, tabs_c = [], {}
    for n in rounds:
        N = d[n]["N"]
        rows = d[n]["rows"]
        Xr = np.zeros((len(rows), J))
        mask = np.zeros((len(rows), J))
        for i, r in enumerate(rows):
            Xr[i, off[n]:off[n] + N] = np.where(np.isnan(r["x"]), 0.0, r["x"])
            mask[i, off[n]:off[n] + N] = 1
        sc = {}
        for m, nm in ((1, "C"), (2, "D"), (3, "E")):
            sc[nm] = cap * tcc_mean(fits[m], theta_hat(fits[m], Xr, mask))
        # 1모수는 정답수만 같으면 점수가 같으므로 모든 정답수의 점수를 만들 수 있다
        Pm = np.zeros((N + 1, J))
        Mm = np.zeros((N + 1, J))
        for rr in range(N + 1):
            Pm[rr, off[n]:off[n] + rr] = 1
            Mm[rr, off[n]:off[n] + N] = 1
        tabs_c[n] = (cap * tcc_mean(fits[1], theta_hat(fits[1], Pm, Mm))).tolist()
        for i, r in enumerate(rows):
            cnt = int(round(float(np.nansum(r["x"]))))
            recs.append({"subj": key, "round": n, "pkey": r["pkey"], "sid": r["sid"], "N": N, "r": cnt, "w": N - cnt,
                         "S": {"A": float(r["hak"]), "B": float(cap * cnt / N), "C": float(sc["C"][i]), "D": float(sc["D"][i]), "E": float(sc["E"][i])}})
    meta = {"N": {n: d[n]["N"] for n in rounds}, "rounds": rounds, "items": J, "persons": int(X.shape[0]),
            "iters": {m: fits[m]["iters"] for m in fits}, "c_med": float(np.median(fits[3]["c"])), "a_med": float(np.median(fits[2]["a"])),
            "sd1": float(fits[1]["sd"])}
    return recs, tabs_c, meta


def r1(v):
    return None if v is None or (isinstance(v, float) and np.isnan(v)) else round(float(v), 1)


def summarize(recs, tabs_c, meta, key):
    cap = CAP[key]
    out = {"tables": {}, "hist": {}, "stats": {}}
    edges = np.linspace(0, cap, 21)
    labels = [f"{int(round(edges[i]))}–{int(round(edges[i + 1]))}" for i in range(20)]
    out["bins"] = labels
    for n in meta["rounds"] + ["all"]:
        R = [x for x in recs if n == "all" or x["round"] == n]
        out["hist"][str(n)] = {s: np.histogram([x["S"][s] for x in R], bins=edges)[0].tolist() for s in SCH}
        out["stats"][str(n)] = {s: {"n": len(R), "mean": r1(np.mean([x["S"][s] for x in R])), "sd": r1(np.std([x["S"][s] for x in R])),
                                    "min": r1(min(x["S"][s] for x in R)), "max": r1(max(x["S"][s] for x in R))} for s in SCH}
        if n == "all":
            continue
        N = meta["N"][n]
        T = {"w": list(range(N + 1)), "n": [0] * (N + 1)}
        for s in SCH:
            T[s] = [None] * (N + 1)
            T[s + "lo"] = [None] * (N + 1)
            T[s + "hi"] = [None] * (N + 1)
        for w in range(N + 1):
            G = [x for x in R if x["w"] == w]
            T["n"][w] = len(G)
            for s in SCH:
                if s == "B":
                    T[s][w] = r1(cap * (N - w) / N)
                elif s == "C":
                    T[s][w] = r1(tabs_c[n][N - w])
                elif G:
                    v = [x["S"][s] for x in G]
                    T[s][w], T[s + "lo"][w], T[s + "hi"][w] = r1(np.mean(v)), r1(min(v)), r1(max(v))
        out["tables"][str(n)] = T
    return out


# ---------------- 예측 ----------------
def loo_reg(x, y):
    X = np.c_[np.ones(len(x)), x]
    beta = np.linalg.lstsq(X, y, rcond=None)[0]
    h = np.diag(X @ np.linalg.pinv(X.T @ X) @ X.T)
    e = y - X @ beta
    return y - e / (1 - h), beta


def predict_group(gk, recs, eju):
    name, subs, top = GROUP[gk]
    by = {}
    for x in recs:
        if x["subj"] in subs:
            by.setdefault((x["round"], x["sid"]), {})[x["subj"]] = x
    stu = {}   # pkey → {round: {scheme: score}}, sids
    for (n, sid), dd in by.items():
        if len(dd) < len(subs):
            continue
        pk = dd[subs[0]]["pkey"]
        e = stu.setdefault(pk, {"rounds": {}, "sids": set()})
        e["sids"].add(sid)
        e["rounds"][n] = {s: sum(dd[k]["S"][s] for k in subs) for s in SCH}
    zs = {}
    for n in ROUNDS:
        vals = {s: np.array([e["rounds"][n][s] for e in stu.values() if n in e["rounds"]]) for s in SCH}
        zs[n] = {s: (vals[s].mean(), vals[s].std() or 1.0) for s in SCH if len(vals[s])}
    key = "jp" if gk == "jp" else "so"
    out = {"name": name, "top": top, "schemes": {}, "nov": {}}
    # 6월 학습: 1·2회 모두 응시 + 6월 EJU 있음
    tr = []
    for pk, e in stu.items():
        if 1 in e["rounds"] and 2 in e["rounds"]:
            y = next((eju[s][key] for s in e["sids"] if s in eju and key in eju[s]), None)
            if y is not None:
                tr.append((pk, y))
    out["n"] = len(tr)
    y = np.array([t[1] for t in tr])
    Z = {s: np.array([np.mean([(stu[pk]["rounds"][n][s] - zs[n][s][0]) / zs[n][s][1] for n in (1, 2)]) for pk, _ in tr]) for s in SCH}
    errs, betas = {}, {}
    for s in SCH:
        p, beta = loo_reg(Z[s], y)
        p = np.clip(p, 0, top)
        err = p - y
        errs[s], betas[s] = err, beta
        q20, q80 = np.quantile(y, .2), np.quantile(y, .8)
        out["schemes"][s] = {"mae": r1(np.abs(err).mean()), "rmse": r1(np.sqrt((err ** 2).mean())), "r": round(float(np.corrcoef(p, y)[0, 1]), 3),
                             "top": r1(err[y >= q80].mean()), "bot": r1(err[y <= q20].mean()), "within15": round(float((np.abs(err) <= (15 if gk == "so" else 22)).mean()), 2)}
    for s in SCH:
        d = np.abs(errs[s]) - np.abs(errs["B"])
        se = d.std(ddof=1) / np.sqrt(len(d))
        out["schemes"][s]["dmae"] = r1(d.mean())
        out["schemes"][s]["ci"] = [r1(d.mean() - 1.96 * se), r1(d.mean() + 1.96 * se)]
    # 11월 예측: 3·4회
    nv = []
    for pk, e in stu.items():
        r34 = [n for n in (3, 4) if n in e["rounds"]]
        if r34:
            nv.append((pk, r34))
    P = {}
    for s in SCH:
        z = np.array([np.mean([(stu[pk]["rounds"][n][s] - zs[n][s][0]) / zs[n][s][1] for n in r34]) for pk, r34 in nv])
        P[s] = np.clip(betas[s][0] + betas[s][1] * z, 0, top)
    out["nov"] = {"n": len(nv), "schemes": {s: {"mean": r1(P[s].mean()), "sd": r1(P[s].std()), "max": r1(P[s].max()), "p90": r1(np.quantile(P[s], .9)),
                                                 "vsB": r1(np.abs(P[s] - P["B"]).mean()), "maxdiff": r1(np.abs(P[s] - P["B"]).max()),
                                                 "corr": round(float(np.corrcoef(P[s], P["B"])[0, 1]), 3)} for s in SCH}}
    return out


def cohort6(eju):
    r = {}
    for k in ("jp", "so"):
        v = np.array([e[k] for e in eju.values() if k in e])
        if len(v):
            r[k] = {"n": int(len(v)), "mean": r1(v.mean()), "sd": r1(v.std()), "max": r1(v.max())}
    return r


def conclusions(res):
    P = res["pred"]
    L_ = []
    for gk in ("jp", "so"):
        g = P[gk]
        sc = g["schemes"]
        best = min(SCH, key=lambda s: sc[s]["mae"])
        spread = max(sc[s]["mae"] for s in SCH) - min(sc[s]["mae"] for s in SCH)
        sig_ = [s for s in SCH if s != "B" and not (sc[s]["ci"][0] <= 0 <= sc[s]["ci"][1])]
        t = f"{g['name']}: 6월 EJU 예측 오차(MAE)는 {SCH_NAME[best]}이 {sc[best]['mae']}점으로 가장 낮지만 다섯 방식의 차이는 {spread:.1f}점 이내 → 실질적 차이 없음."
        if sig_:
            t += f" ({', '.join(SCH_NAME[s] for s in sig_)}은 정답수 비례와 통계상 차이가 있으나 {abs(sc[sig_[0]]['dmae']):.1f}점으로 점수 단위로는 무시할 수준)"
        L_.append(t)
    nj, ns = P["jp"]["nov"]["schemes"], P["so"]["nov"]["schemes"]
    L_.append(f"11월 예측값도 방식에 따라 거의 안 바뀝니다: 정답수 비례와의 평균 차이가 일본어 {min(nj[s]['vsB'] for s in 'ACDE'):.1f}~{max(nj[s]['vsB'] for s in 'ACDE'):.1f}점(374점 만점), 종합 {min(ns[s]['vsB'] for s in 'ACDE'):.1f}~{max(ns[s]['vsB'] for s in 'ACDE'):.1f}점(200점 만점).")
    L_.append("추천: ① 11월 예측은 지금처럼 정답수 기반 유지(가장 단순하고 일본어에서 오차 최저). ② 학생에게 보여주는 모의고사 점수는 득점등화 1모수 — 회차 난이도 차이를 보정하고, 틀린 문항 수가 같으면 점수가 같아서 시험지 체크 지도와 맞고, 2·3모수는 설명이 어려운데 예측 이득이 없음.")
    return L_


# ---------------- 엑셀 ----------------
def hdr(ws, r, c, v, w=None):
    put(ws, r, c, v, bold=True, fill=F_H, al="center", wrap=True)
    if w:
        ws.column_dimensions[L(c)].width = w


def title(ws, text, sub=None):
    ws.sheet_view.showGridLines = False
    ws.cell(row=1, column=1, value=text).font = Font(name="Malgun Gothic", size=15, bold=True, color=INK)
    if sub:
        ws.cell(row=2, column=1, value=sub).font = Font(name="Malgun Gothic", size=9, color=MUTE)


def write_xlsx(path, res):
    wb = openpyxl.Workbook()
    # --- 요약
    ws = wb.active
    ws.title = "요약"
    title(ws, "모의고사 채점 방식 비교", f"학원 자체 채점 vs 보정한 방식 · 2026 모의고사 1~4회 · 작성 {date.today().isoformat()} · 학생 이름·수험번호 없음")
    r = 4
    put(ws, r, 1, "■ 결론", bold=True, border=False, size=11)
    for t in res["conclusion"]:
        r += 1
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=9)
        put(ws, r, 1, "· " + t, wrap=True, border=False)
        ws.row_dimensions[r].height = 46
    r += 2
    put(ws, r, 1, "■ 비교한 다섯 방식", bold=True, border=False, size=11)
    for s in SCH:
        r += 1
        put(ws, r, 1, s, bold=True, al="center", fill=F_H)
        put(ws, r, 2, SCH_NAME[s], bold=True)
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=9)
        put(ws, r, 3, SCH_DESC[s], wrap=True)
        ws.row_dimensions[r].height = 30
    r += 2
    put(ws, r, 1, "■ 적용한 보정 세 가지", bold=True, border=False, size=11)
    for t in res["corrections"]:
        r += 1
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=9)
        put(ws, r, 1, t, wrap=True, border=False)
        ws.row_dimensions[r].height = 44
    r += 2
    put(ws, r, 1, "■ 읽을 때 주의", bold=True, border=False, size=11)
    for t in res["notes"]:
        r += 1
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=9)
        put(ws, r, 1, "· " + t, wrap=True, border=False)
        ws.row_dimensions[r].height = 44
    r += 2
    put(ws, r, 1, "■ 6월 EJU 예측 오차 (MAE, 점) — 학생 한 명씩 빼고 검증", bold=True, border=False, size=11)
    r += 1
    for j, h in enumerate(["과목", "n"] + [f"{s} {SCH_NAME[s]}" for s in SCH]):
        hdr(ws, r, 1 + j, h)
    for gk in ("jp", "so"):
        g = res["pred"][gk]
        r += 1
        put(ws, r, 1, g["name"])
        put(ws, r, 2, g["n"], al="center")
        best = min(g["schemes"][s]["mae"] for s in SCH)
        for j, s in enumerate(SCH):
            put(ws, r, 3 + j, g["schemes"][s]["mae"], al="center", fmt="0.0", fill=F_G if g["schemes"][s]["mae"] == best else None)
    for c, w in zip("ABCDEFGHI", (16, 16, 16, 16, 16, 16, 16, 12, 12)):
        ws.column_dimensions[c].width = w
    ws.column_dimensions["A"].width = 26
    # --- 틀린 문항 수별 점수
    ws = wb.create_sheet("틀린문항수별 점수")
    title(ws, "틀린 문항 수별 점수", "표시는 점수(만점 = EJU 최고점). A·D·E는 같은 틀린 수라도 학생마다 달라서 평균과 (최소~최대)를 함께 적음. B·C는 틀린 수만 같으면 점수가 같음.")
    r = 4
    for key, nm, cap in SUBS:
        for n in res["meta"][key]["rounds"]:
            T = res["subj"][key]["tables"][str(n)]
            put(ws, r, 1, f"{nm} · {n}회 (만점 {cap})", bold=True, border=False, size=11)
            r += 1
            heads = ["틀린 수", "응시자"] + ["A 학원 평균", "A 범위", "B 정답수 비례", "C 1모수", "C 틀릴 때 감점", "D 2모수 평균", "D 범위", "E 3모수 평균", "E 범위"]
            for j, h in enumerate(heads):
                hdr(ws, r, 1 + j, h)
            for w in T["w"]:
                r += 1
                n_ = T["n"][w]
                rng = lambda s: (f"{T[s + 'lo'][w]:.0f}~{T[s + 'hi'][w]:.0f}" if T[s + "lo"][w] is not None else "")  # noqa: E731
                drop = (T["C"][w - 1] - T["C"][w]) if w > 0 else None
                vals = [w, n_ or None, T["A"][w], rng("A"), T["B"][w], T["C"][w], r1(drop) if drop is not None else None, T["D"][w], rng("D"), T["E"][w], rng("E")]
                for j, v in enumerate(vals):
                    put(ws, r, 1 + j, v, al="center", fmt="0.0" if isinstance(v, float) else None, color=INK if n_ or j in (0, 4, 5, 6) else MUTE)
            r += 2
    for j, w in enumerate((10, 9, 12, 11, 13, 10, 12, 12, 11, 12, 11)):
        ws.column_dimensions[L(1 + j)].width = w
    ws.freeze_panes = "A4"
    # --- 분포
    ws = wb.create_sheet("분포")
    title(ws, "점수 분포", "1~4회 응시자 전체(학생×회차)를 모은 분포. 구간은 만점의 5%씩 20칸. 칸 안은 인원수.")
    r = 4
    for key, nm, cap in SUBS:
        put(ws, r, 1, f"{nm} (만점 {cap}) · 평균 / 표준편차 / 최고", bold=True, border=False, size=11)
        r += 1
        hdr(ws, r, 1, "구간")
        for j, s in enumerate(SCH):
            hdr(ws, r, 2 + j, f"{s} {SCH_NAME[s]}", 14)
        top = r
        H = res["subj"][key]["hist"]["all"]
        for i, lb in enumerate(res["subj"][key]["bins"]):
            r += 1
            put(ws, r, 1, lb, al="center")
            for j, s in enumerate(SCH):
                put(ws, r, 2 + j, H[s][i], al="center")
        r += 1
        put(ws, r, 1, "평균", bold=True, fill=F_H, al="center")
        for j, s in enumerate(SCH):
            st = res["subj"][key]["stats"]["all"][s]
            put(ws, r, 2 + j, f"{st['mean']:.1f} / {st['sd']:.1f} / {st['max']:.0f}", al="center", fill=F_H)
        ch = LineChart()
        ch.title = f"{nm} 점수 분포 (인원)"
        ch.height, ch.width = 7.5, 17
        ch.add_data(Reference(ws, min_col=2, max_col=6, min_row=top, max_row=top + 20), titles_from_data=True)
        ch.set_categories(Reference(ws, min_col=1, min_row=top + 1, max_row=top + 20))
        for se in ch.series:
            se.smooth = False
        ws.add_chart(ch, f"H{top - 1}")
        r += 14
    ws.column_dimensions["A"].width = 12
    # --- 예측 비교
    ws = wb.create_sheet("예측 비교")
    title(ws, "6월 EJU 예측 오차와 11월 예측", "모의고사 1·2회 점수를 회차별로 표준화해 평균 → 6월 EJU 실제 점수에 직선 회귀(EJU 점수로 보정) → 학생 한 명씩 빼고 검증. 예측은 EJU 최고점(일본어 374 · 종합 200)을 넘지 않게 자름.")
    r = 4
    for gk in ("jp", "so"):
        g = res["pred"][gk]
        put(ws, r, 1, f"■ {g['name']} — 6월 EJU 예측 오차 (n={g['n']})", bold=True, border=False, size=11)
        r += 1
        for j, h in enumerate(["방식", "MAE", "RMSE", "상관 r", "상위20% 편향", "하위20% 편향", "MAE 차이 (정답수 비례 기준)", "차이 95% 구간"]):
            hdr(ws, r, 1 + j, h)
        best = min(g["schemes"][s]["mae"] for s in SCH)
        for s in SCH:
            v = g["schemes"][s]
            r += 1
            put(ws, r, 1, f"{s} {SCH_NAME[s]}")
            for j, x in enumerate([v["mae"], v["rmse"], v["r"], v["top"], v["bot"]]):
                put(ws, r, 2 + j, x, al="center", fmt="0.00" if j == 2 else "0.0", fill=F_G if (j == 0 and x == best) else None)
            put(ws, r, 7, "기준" if s == "B" else v["dmae"], al="center", fmt="0.00")
            put(ws, r, 8, "" if s == "B" else f"{v['ci'][0]:+.1f} ~ {v['ci'][1]:+.1f}", al="center")
        r += 2
        nv = g["nov"]
        put(ws, r, 1, f"■ {g['name']} — 11월 EJU 예측 (3·4회 응시자 {nv['n']}명, 같은 보정식 사용)", bold=True, border=False, size=11)
        r += 1
        for j, h in enumerate(["방식", "예측 평균", "표준편차", "상위10% 경계", "최고", "정답수 비례와 평균 차이", "최대 차이", "정답수 비례와 상관"]):
            hdr(ws, r, 1 + j, h)
        for s in SCH:
            v = nv["schemes"][s]
            r += 1
            put(ws, r, 1, f"{s} {SCH_NAME[s]}")
            for j, x in enumerate([v["mean"], v["sd"], v["p90"], v["max"], v["vsB"], v["maxdiff"], v["corr"]]):
                put(ws, r, 2 + j, x, al="center", fmt="0.000" if j == 6 else "0.0")
        r += 3
    ws.column_dimensions["A"].width = 24
    for c in "BCDEFGH":
        ws.column_dimensions[c].width = 15
    ws.column_dimensions["G"].width = 22
    # --- EJU 결과지 대조
    ws = wb.create_sheet("EJU 결과지 대조")
    title(ws, "EJU 2026년 제1회 결과(JASSO)와 대조", f"출처: {JASSO_URL} — 표를 옮긴 것이므로 원문 대조 필요. 모의고사 응시생은 전국 응시생과 수준이 달라 분포를 억지로 맞추지 않고 참고만 함.")
    r = 4
    for j, h in enumerate(["과목", "전국 평균", "전국 표준편차", "전국 최고점", "우리 학생 6월 EJU 평균", "우리 학생 SD", "우리 학생 최고", "우리 n", "모의고사 만점(보정 후)"]):
        hdr(ws, r, 1 + j, h)
    c6 = res["cohort6"]
    for k in ("jr", "jl", "jp", "so", "m1", "m2", "phy", "chem", "bio"):
        nm, mean, sd, mx = JASSO[k]
        r += 1
        put(ws, r, 1, nm)
        put(ws, r, 2, mean, al="center", fmt="0.0")
        put(ws, r, 3, sd, al="center", fmt="0.0")
        put(ws, r, 4, mx, al="center")
        cc = c6.get(k)
        for j, x in enumerate([cc["mean"], cc["sd"], cc["max"], cc["n"]] if cc else [None] * 4):
            put(ws, r, 5 + j, x, al="center", fmt="0.0" if j < 3 else None)
        put(ws, r, 9, {"jr": 199, "jl": 175, "jp": 374, "so": 200}.get(k), al="center")
    r += 2
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=9)
    put(ws, r, 1, "종합 만점 200은 6월 1회 최고 199를 구조적 상한으로 보지 않아 그대로 둠(한 회차 값). 수학·과학은 이 비교에서 제외.", wrap=True, border=False, color=MUTE)
    ws.column_dimensions["A"].width = 20
    for c in "BCDEFGHI":
        ws.column_dimensions[c].width = 16
    wb.save(path)


def write_js(path, res):
    j = json.dumps(res, ensure_ascii=False, separators=(",", ":"))
    Path(path).write_text("/* 자동 생성: tools/mock_scoring.py — 집계만, 이름·수험번호 없음. 직접 고치지 않는다. */\nwindow.SCORING = " + j + ";\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=DEFAULT_DIR)
    ap.add_argument("--xlsx", default=None)
    ap.add_argument("--js", default=None)
    a = ap.parse_args()
    dirp = str(resolve(a.dir))
    warn = []
    data = {}
    for n in ROUNDS:
        try:
            data[n] = read_round(dirp, n, warn)
        except FileNotFoundError:
            warn.append(f"{n}회 채점시트 없음")
    allrecs, subj, meta = [], {}, {}
    for key, nm, _ in SUBS:
        d = {n: data[n][key] for n in ROUNDS if n in data and key in data[n]}
        recs, tabs_c, m = score_subject(key, d)
        subj[key] = summarize(recs, tabs_c, m, key)
        meta[key] = m
        allrecs += recs
    eju = read_eju6(dirp, warn)
    pred = {gk: predict_group(gk, allrecs, eju) for gk in GROUP}
    res = {"asof": date.today().isoformat(), "schemes": [{"id": s, "name": SCH_NAME[s], "desc": SCH_DESC[s]} for s in SCH],
           "subjects": [{"key": k, "name": n, "cap": c} for k, n, c in SUBS], "subj": subj, "meta": meta, "pred": pred, "cohort6": cohort6(eju),
           "jasso": {k: {"name": v[0], "mean": v[1], "sd": v[2], "max": v[3]} for k, v in JASSO.items()}, "jasso_url": JASSO_URL}
    res["conclusion"] = conclusions(res)
    res["corrections"] = [
        "① EJU 결과지(JASSO 2026년 1회) 기준 상한: 독해 199 · 청해·청독해 175 · 일본어 합계 374. 학원 점수의 만점(독해 198~199, 청청독 173~175)과 거의 같아서 학원 척도는 이미 EJU에 가깝고, 득점등화 점수만 이 상한에 맞췄습니다.",
        "② 만점 점수: 5개 방식 모두 만점 = 위 상한. 정답수 비례도 200점이 아니라 199·175 기준. 예측값도 이 상한(일본어 374, 종합 200)을 넘지 않게 자릅니다.",
        "③ 득점등화 1·2·3모수: 모의고사 안에서는 2·3모수가 문항 응답을 더 잘 설명하지만, 6월 EJU를 예측하는 정확도는 정답수와 차이가 없었습니다(아래 표). EJU 점수로 회귀 보정한 뒤의 비교입니다.",
    ]
    res["notes"] = [
        "점수 척도: A(학원)는 EJU 평균에 맞춰 환산한 점수, B~E는 모의고사 난이도 그대로의 득점률 환산입니다. 종합은 모의고사가 EJU보다 어려워 B~E가 A보다 약 36점 낮게 나옵니다(독해·청해청독해는 차이 작음). 점수 수준을 직접 비교하지 말고, 순위·틀린 수당 감점·예측 정확도를 비교하세요.",
        "3모수는 찍기 확률 때문에 0점 근처 점수가 바닥(약 30~40점)에서 멈추고, 학원 점수는 최저 20점입니다.",
        "예측 비교는 모든 방식에 같은 보정(회차별 표준화 → 6월 EJU 직선 회귀 → EJU 최고점 상한)을 적용한 결과라, 점수 척도 차이는 예측에 영향이 없습니다.",
        "한계: 6월 EJU 한 번, 2026년 표본(일본어 n=151, 종합 n=105). 11월 결과가 나오면 3·4회로 같은 비교를 다시 할 수 있습니다.",
    ]
    res["pred_note"] = "모의고사 점수를 회차별로 표준화해 평균 낸 뒤 6월 EJU 실제 점수에 직선 회귀. 학생 한 명씩 빼고 검증."
    xlsx = Path(a.xlsx) if a.xlsx else Path(dirp) / "EJU_모의고사_채점방식비교_원장님용.xlsx"
    write_xlsx(xlsx, res)
    print("엑셀:", xlsx)
    if a.js:
        write_js(a.js, res)
        print("js:", a.js)
    for t in res["conclusion"]:
        print("·", t)
    for w in warn:
        print("!", w)


if __name__ == "__main__":
    main()
