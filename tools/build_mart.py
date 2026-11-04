#!/usr/bin/env python3
"""입시 결과 원본 엑셀(연도별) → 클렌징한 마트 테이블 + 원장님 검토 엑셀.

과정 설명: docs_plan/마트_만드는_과정.md

입력
  --raw    원본 엑셀 폴더 (파일 이름에 연도 20xx 가 들어 있어야 함. 같은 내용 파일이 두 개면 하나만 씀)
  --yoko   2027 모집요강 데이터 (docs/assets/yoko.js 또는 data/yoko/2027 폴더) — 요강 비교용, 없어도 돌아감
  --review 원장님이 판단을 적어 돌려준 검토 엑셀 (있으면 판단을 반영: 학부 계보 이어 붙이기, 소수 조합 인정/제외, 규칙 시작 연도)
출력 (--out 폴더)
  admissions_mart.csv.gz   마트 (지원 기록 한 줄 = 한 행, 학부만)
  admissions_mart.xlsx     같은 내용 (사람이 열어 보는 용도)
  admissions_rules.csv     학부·학과별 과목 규칙 (연도 구간)
  원장님_검토_입시데이터.xlsx  사람이 판단할 것만 모은 엑셀 (판단 칸 = 노란색)
  build_log.txt            단계별 건수

이름·수험번호는 원본에도 없다. 그래도 합격 데이터이므로 저장소에 올리지 않는다.
사용: python3 tools/build_mart.py --raw <원본 폴더> --yoko docs/assets/yoko.js --out <출력 폴더> [--review <판단 엑셀>]
필요: pip install pandas openpyxl
"""
import argparse, collections, hashlib, json, math, re, statistics as st, sys, unicodedata
from pathlib import Path
import openpyxl
import pandas as pd
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import yoko_rule as yr  # noqa: E402

SUB = ['jp', 'ki', 'phy', 'chem', 'bio', 'so', 'm1', 'm2']           # 원본 순서: 日本語 記述 物理 化学 生物 総合 コース1 コース2
SUBK = dict(jp='일본어', ki='기술', phy='물리', chem='화학', bio='생물', so='종합', m1='수학1', m2='수학2')
MAX = dict(jp=400, ki=50, phy=100, chem=100, bio=100, so=200, m1=200, m2=200)
SES = ('6', '11')                                                    # 첫 점수 묶음 = 6월(1회), 둘째 = 11월(2회)
LEVEL_GAP = 100        # 수준이탈: 같은 학부·같은 계열 합격자 중앙값보다 이만큼 이상 높으면
OUT_Z, OUT_MIN = 3.5, 8
ACC_SHARE, ACC_MIN = .10, 2     # 이 계열(문과·이과·일본어만)로 합격한 기록이 10% 이상·2건 이상이면 「인정하는 계열」
REQ_SHARE = .85                 # 인정 계열 안에서 85% 이상이 낸 과목은 「필수」
YEAR_MIN_N = 8                  # 연도별 규칙 비교에 쓰는 최소 합격 기록 수
DEPT_MIN_N = 30                 # 학과 단위 규칙을 따로 만드는 최소 합격 기록 수
FLAGS = ['중복', '점수없음', '기호', '범위밖', '조합불일치', '영어증빙없음', '수준이탈', '점수이상']

nk = lambda s: unicodedata.normalize('NFKC', str(s)).replace(' ', '').replace('　', '').replace('\n', '').strip() if s is not None else ''
fac_key = lambda s: re.sub(r'学部$', '', nk(s)) or '(미기재)'
dept_key = lambda s: re.sub(r'学科$', '', nk(s)) or '(미기재)'
LOG = []
ok_ = lambda v: v is not None and not (isinstance(v, float) and math.isnan(v))   # 점수가 있나 (빈칸·NaN 아님)


def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)


# ---------------- 1. 원본 읽기 ----------------
def header_map(h):
    """연도마다 다른 열 이름 → 표준 위치"""
    iu = next(i for i, c in enumerate(h) if '受験校' in c)
    g = [i for i, c in enumerate(h) if re.match(r'^(区分|分類|備考|区)\d', c)]
    ps = [i for i, c in enumerate(h) if c == '合否']
    js = [i for i, c in enumerate(h) if re.search(r'日(本)?語(-\d)?$', c)]
    if len(js) != 2:
        raise ValueError(f'일본어 점수 열을 두 개 못 찾음: {h}')
    it = [i for i, c in enumerate(h) if c.upper() in ('IBT', 'TOEFL', 'TOEFLIBT')]
    ix = [i for i, c in enumerate(h) if c.upper() == 'TOEIC']
    ic = next((i for i, c in enumerate(h) if 'コード' in c), None)
    return dict(code=ic, u=iu, f=iu + 1, d=iu + 2, g1=g[0] if g else None, g2=g[1] if len(g) > 1 else None,
                p=ps, s6=js[0], s11=js[1], toefl=it[0] if it else None, toeic=ix[0] if ix else None)


def cell(r, i):
    return r[i] if i is not None and i < len(r) else None


def num_or_sym(v):
    """(숫자 또는 None, 기호 또는 None)"""
    if v is None or (isinstance(v, str) and not v.strip()):
        return None, (None if v is None or v == '' else '공백')
    if isinstance(v, (int, float)):
        return float(v), None
    t = nk(v)
    try:
        return float(t), None
    except ValueError:
        return None, t or '공백'


def read_year(path, y):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    R = list(ws.iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(R[:10]) if r and any('受験校' in nk(c) for c in r))
    m = header_map([nk(c) for c in R[hi]])
    # 合否 열이 둘이면 값이 더 많이 찬 쪽
    ip = max(m['p'], key=lambda j: sum(1 for r in R[hi + 1:] if r and cell(r, j) not in (None, '')))
    out = []
    for k, r in enumerate(R[hi + 1:], hi + 2):
        if not r or not cell(r, m['u']):
            continue
        p = nk(cell(r, ip))
        rec = dict(연도=y, 원본파일=Path(path).name, 원본행=k, 대학코드=nk(cell(r, m['code'])),
                   학교=nk(cell(r, m['u'])), 학부_원표기=nk(cell(r, m['f'])), 학과_원표기=nk(cell(r, m['d'])),
                   구분1=nk(cell(r, m['g1'])), 구분2=nk(cell(r, m['g2'])),
                   합부={'1': 1, '〇': 1, '○': 1, '0': 0, '×': 0}.get(p), 합부_원값=p)
        syms, rng = [], []
        for se, j0 in (('6', m['s6']), ('11', m['s11'])):
            for k2, s in enumerate(SUB):
                v, sy = num_or_sym(cell(r, j0 + k2))
                if sy:
                    syms.append(f'{se}월 {SUBK[s]}:{sy}')
                if v is not None and (v < 0 or v > MAX[s] or (s == 'jp' and v < 50)):
                    rng.append(f'{se}월 {SUBK[s]}:{v:g}'); v = None
                rec[f'{s}_{se}'] = v
        rec['TOEFL'] = num_or_sym(cell(r, m['toefl']))[0]
        rec['TOEIC'] = num_or_sym(cell(r, m['toeic']))[0]
        rec['기호_원값'] = '; '.join(syms); rec['범위밖_원값'] = '; '.join(rng)
        out.append(rec)
    return out


def level_of(r):
    """학부 / 院 / 短大 / 別科. 2017·2018 은 구분 칸이 대부분 비어 있어 이름으로 보충"""
    g = r['구분1']
    if g in ('院', '短大', '別科', '短大別科'):
        return g
    if '大学院大学' in r['학교'] or '研究科' in r['학부_원표기']:
        return '院'
    if '短期大学' in r['학교']:
        return '短大'
    return '学部'


# ---------------- 2. 과목 조합 ----------------
def combo(r, se):
    """(조합 이름, 계열) — 계열: 문과(종합) · 이과(이과 과목) · 일본어만 · 기타(둘 다/일본어 없음). 점수 없으면 (None, None)"""
    has = {s: ok_(r[f'{s}_{se}']) for s in SUB}
    if not any(has.values()):
        return None, None
    sci = sum(has[s] for s in ('phy', 'chem', 'bio'))
    name = ('일본어' if has['jp'] else '(일본어 없음)') + ('+종합' if has['so'] else '') + (f'+이과{sci}' if sci else '') + ('+수1' if has['m1'] else '') + ('+수2' if has['m2'] else '')
    if not has['jp'] or (has['so'] and sci):
        kind = '기타'
    elif has['so']:
        kind = '문과'
    elif sci:
        kind = '이과'
    else:
        kind = '일본어만'
    return name, kind


def total(r, se, kind):
    v = lambda s: r[f'{s}_{se}'] if ok_(r[f'{s}_{se}']) else None
    if kind == '문과' and v('jp') and v('so') and v('m1'):
        return v('jp') + v('so') + v('m1')
    if kind == '이과' and v('jp') and v('m2'):
        sc = sorted(x for x in (v('phy'), v('chem'), v('bio')) if x)
        if len(sc) >= 2:
            return v('jp') + sc[-1] + sc[-2] + v('m2')
    if kind == '일본어만' and v('jp'):
        return v('jp')
    return None


# ---------------- 3. 규칙 (연도 구간) ----------------
def signature(recs):
    """합격 기록들 → {'n', 'share':{계열:비율}, 'acc':{인정 계열}, 'req':{계열:{필수 과목}}}"""
    n = len(recs)
    if not n:
        return None
    by = collections.defaultdict(list)
    for x in recs:
        by[x['kind']].append(x)
    share = {k: len(v) / n for k, v in by.items()}
    acc = {k for k, v in by.items() if k != '기타' and len(v) / n >= ACC_SHARE and len(v) >= ACC_MIN}
    req = {}
    for k in acc:
        L = by[k]; rq = set()
        for s, cond in (('m1', k == '문과'), ('m2', k == '이과'), ('sci2', k == '이과')):
            if not cond:
                continue
            have = sum(1 for x in L if (x['sci'] >= 2 if s == 'sci2' else x[s]))
            if have / len(L) >= REQ_SHARE:
                rq.add(s)
        req[k] = rq
    return dict(n=n, share=share, acc=acc, req=req)


def conflicts(year_sig, ref):
    """한 해의 규칙이 기준 규칙과 분명히 다른가 (애매하면 다르지 않다고 봄)"""
    for k in ('문과', '이과', '일본어만'):
        a, b = year_sig['share'].get(k, 0), ref['share'].get(k, 0)
        if (a >= .25 and b <= .05) or (b >= .25 and a <= .05):
            return True
    for k in ref['acc'] & year_sig['acc']:
        if ref['req'].get(k, set()) ^ year_sig['req'].get(k, set()):
            return True
    return False


def estimate_rules(recs, start_override=None):
    """한 단위(학부 또는 학과)의 합격 기록 → 현재 규칙 시작 연도, 현재 규칙, 이전 규칙, 연도별 요약"""
    ys = sorted({x['y'] for x in recs})
    byy = {y: [x for x in recs if x['y'] == y] for y in ys}
    # 기준: 최근 연도부터 거꾸로 모아 15건 이상
    pool, i = [], len(ys) - 1
    while i >= 0 and len(pool) < 15:
        pool += byy[ys[i]]; i -= 1
    ref = signature(pool)
    start = ys[0]
    if start_override:
        start = start_override
    else:
        for y in reversed(ys[:i + 1]):
            s = signature(byy[y])
            if s and s['n'] >= YEAR_MIN_N and conflicts(s, ref):
                start = y + 1; break
    cur = signature([x for x in recs if x['y'] >= start])
    prev = signature([x for x in recs if x['y'] < start])
    yearly = {y: signature(byy[y]) for y in ys}
    return dict(start=start, cur=cur, prev=prev, yearly=yearly)


def sig_text(s):
    if not s:
        return ''
    parts = []
    for k in ('문과', '이과', '일본어만'):
        if k in s['acc']:
            ex = {'m1': '수1', 'm2': '수2', 'sci2': '이과2과목'}
            parts.append(k + ('(' + '·'.join(ex[e] for e in sorted(s['req'][k])) + ' 필수)' if s['req'][k] else ''))
    return ' / '.join(parts) + f'  [{s["n"]}건]'


def mismatch(x, sig):
    if not sig or x['kind'] is None:
        return False
    if x['kind'] not in sig['acc']:
        return True
    rq = sig['req'].get(x['kind'], set())
    return any(not (x['sci'] >= 2 if s == 'sci2' else x[s]) for s in rq)


# ---------------- 4. 학부 계보 후보 ----------------
def lineage_candidates(df):
    out = []
    for u, du in df.groupby('학교'):
        uy0, uy1 = du['연도'].min(), du['연도'].max()
        facs = {f: (g['연도'].min(), g['연도'].max(), len(g), set(g['학과'])) for f, g in du.groupby('학부')}
        for f1, (a1, b1, n1, d1) in facs.items():
            if b1 >= uy1:
                continue                       # 마지막 해까지 있는 학부는 사라지지 않았음
            for f2, (a2, b2, n2, d2) in facs.items():
                if f2 == f1 or a2 <= uy0 or a2 < b1 or a2 - b1 > 3:
                    continue                   # 새 학부: 처음부터 있던 게 아니고, 옛 학부가 끝날 무렵(같은 해~3년 뒤) 처음 나타남
                name = len(set(f1) & set(f2) - set('学部'))
                dov = len({d for d in d1 & d2 if d != '(미기재)'})
                score = 2 * bool(f1 in f2 or f2 in f1) + bool(name) + 2 * bool(dov) + (a2 - b1 <= 1)
                out.append(dict(학교=u, 옛학부=f1, 옛연도=f'{a1}~{b1}', 옛지원=n1, 새학부=f2, 새연도=f'{a2}~{b2}', 새지원=n2,
                                이름겹침='포함' if (f1 in f2 or f2 in f1) else ('글자 겹침' if name else ''),
                                같은학과=', '.join(sorted(d for d in d1 & d2 if d != '(미기재)'))[:80], 단서점수=score,
                                제안='같은 학부일 가능성 높음' if score >= 4 else ('확인 필요' if score >= 2 else '다른 학부일 가능성')))
    return sorted(out, key=lambda r: (-r['단서점수'], r['학교']))


# ---------------- 5. 검토 엑셀에서 판단 읽기 ----------------
def read_review(path):
    dec = dict(lineage={}, split=set(), combo={}, start={})
    if not path:
        return dec
    wb = openpyxl.load_workbook(path, data_only=True)
    def rows(name):
        if name not in wb.sheetnames:
            return []
        ws = wb[name]; H = [c.value for c in ws[1]]
        return [dict(zip(H, [c.value for c in r])) for r in ws.iter_rows(min_row=2)]
    for r in rows('학부계보'):
        j = nk(r.get('판단'))
        if j in ('이름변경', '통합'):
            dec['lineage'][(r['학교'], r['옛학부'])] = r['새학부']
        elif j == '분리':
            dec['split'].add((r['학교'], r['옛학부']))
    for r in rows('소수조합'):
        j = nk(r.get('판단'))
        if j in ('인정', '제외'):
            dec['combo'][(r['학교'], r['학부'], r['학과'] or '', r['조합'])] = j
    for r in rows('규칙변경'):
        v = r.get('확정 시작 연도')
        if v:
            dec['start'][(r['학교'], r['학부'], r['학과'] or '')] = int(v)
    return dec


# ---------------- 6. 요강 ----------------
def load_yoko(p):
    if not p:
        return False
    p = Path(p)
    if p.is_dir():
        return True                            # yoko_rule 기본 경로
    t = p.read_text(encoding='utf-8')
    D = json.loads(t[t.index('{'):t.rindex('}') + 1])
    yr._docs = {yr._nk(d['univ']['ja']): d for d in D['docs']}
    return True


def yoko_kinds(u, f):
    r = yr.rule(u, f)
    return (set(r['kinds']), r) if r else (None, None)


def yoko_en(u, f):
    """요강에서 영어가 필수(R)인 단위가 있으면 True, 모두 선택/불필요면 False, 요강 없으면 None"""
    d = yr.docs().get(yr._nk(u))
    if not d:
        return None
    ens = [un.get('en') for tr in d['tracks'] for un in tr['units'] if yr.fac_match(f, un.get('fac_ja'))]
    if not ens:
        return None
    return all(e == 'R' for e in ens)


# ---------------- main ----------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--raw', required=True); ap.add_argument('--yoko'); ap.add_argument('--review'); ap.add_argument('--out', required=True)
    a = ap.parse_args()
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    have_yoko = load_yoko(a.yoko)

    # 1. 읽기
    files, seen = {}, {}
    for p in sorted(Path(a.raw).glob('*.xlsx')):
        m = re.search(r'(20[12]\d)', unicodedata.normalize('NFC', p.name))
        if not m:
            continue
        h = hashlib.md5(p.read_bytes()).hexdigest()
        if h in seen:
            log(f'[같은 파일 건너뜀] {p.name} = {seen[h]}'); continue
        seen[h] = p.name; y = int(m.group(1))
        if y in files:
            raise SystemExit(f'{y}년 파일이 둘: {files[y].name}, {p.name}')
        files[y] = p
    rows = []
    for y in sorted(files):
        r = read_year(files[y], y); rows += r
        log(f'1. 읽기 {y}: {len(r):,}행  ({files[y].name})')
    df = pd.DataFrame(rows)
    log(f'   전체 {len(df):,}행')

    # 2. 학부만
    df['단계'] = df.apply(level_of, axis=1)
    for y, g in df.groupby('연도'):
        c = g['단계'].value_counts().to_dict()
        log(f'2. 학부만 {y}: 학부 {c.get("学部", 0):,} / 제외 ' + ', '.join(f'{k} {v}' for k, v in c.items() if k != '学部'))
    df = df[df['단계'] == '学部'].drop(columns=['단계']).reset_index(drop=True)
    nop = df['합부'].isna().sum()
    log(f'   합부 값이 0/1/〇/× 가 아닌 행 {nop}건 제외'); df = df[df['합부'].notna()].reset_index(drop=True)
    df['합부'] = df['합부'].astype(int)

    # 3. 이름 통일 + 계보
    df['학부'] = df['학부_원표기'].map(fac_key); df['학과'] = df['학과_원표기'].map(dept_key)
    dec = read_review(a.review)
    lin = lineage_candidates(df)
    df['학부_계보'] = ''
    for (u, f), f2 in dec['lineage'].items():
        m = (df['학교'] == u) & (df['학부'] == f)
        df.loc[m, '학부_계보'] = f'{f}→{f2}'; df.loc[m, '학부'] = f2
    for (u, f) in dec['split']:
        df.loc[(df['학교'] == u) & (df['학부'] == f), '학부_계보'] = f'{f}(분리 전)'
    log(f'3. 이름 통일: 학교 {df["학교"].nunique()} · 학부 {df.groupby(["학교", "학부"]).ngroups} · 학과 {df.groupby(["학교", "학부", "학과"]).ngroups}')
    log(f'   학부 계보 후보 {len(lin)}쌍 (지원 1명 이상 전부) · 판단 반영: 이어 붙임 {len(dec["lineage"])} · 분리 {len(dec["split"])}')
    codes = df.groupby('대학코드')['학교'].nunique(); names = df.groupby('학교')['대학코드'].nunique()
    univ_var = [dict(대학코드=c, 학교들=' / '.join(sorted(df.loc[df['대학코드'] == c, '학교'].unique()))) for c in codes[codes > 1].index if c]
    univ_var += [dict(대학코드=' / '.join(sorted(df.loc[df['학교'] == n, '대학코드'].unique())), 학교들=n) for n in names[names > 1].index]

    # 4. 조합·계열·총점
    for se in SES:
        cc = df.apply(lambda r: combo(r, se), axis=1)
        df[f'조합_{se}'] = [c[0] for c in cc]; df[f'계열_{se}'] = [c[1] for c in cc]
        df[f'총점_{se}'] = [total(r, se, r[f'계열_{se}']) for _, r in df.iterrows()]
    df['flags'] = [[] for _ in range(len(df))]
    addf = lambda mask, name: [df.at[i, 'flags'].append(name) for i in df.index[mask]]

    # 5. 플래그: 중복·점수없음·기호·범위밖
    key = ['연도', '학교', '학부_원표기', '학과_원표기', '합부'] + [f'{s}_{se}' for se in SES for s in SUB] + ['TOEFL', 'TOEIC']
    addf(df.duplicated(subset=key, keep='first') & df[[f'{s}_{se}' for se in SES for s in SUB]].notna().any(axis=1), '중복')
    addf(df['조합_6'].isna() & df['조합_11'].isna(), '점수없음')
    addf(df['기호_원값'] != '', '기호')
    addf(df['범위밖_원값'] != '', '범위밖')

    # 6. 연도별 과목 규칙 (학부, 데이터 많은 학과는 학과 단위)
    live = df[~df['flags'].map(lambda f: '중복' in f)]
    recs = []
    for i, r in live.iterrows():
        if r['합부'] != 1:
            continue
        for se in SES:
            if isinstance(r[f'계열_{se}'], str):
                recs.append(dict(i=i, y=r['연도'], u=r['학교'], f=r['학부'], d=r['학과'], kind=r[f'계열_{se}'],
                                 sci=sum(ok_(r[f'{s}_{se}']) for s in ('phy', 'chem', 'bio')),
                                 m1=ok_(r[f'm1_{se}']), m2=ok_(r[f'm2_{se}'])))
    byf, byd = collections.defaultdict(list), collections.defaultdict(list)
    for x in recs:
        byf[(x['u'], x['f'])].append(x); byd[(x['u'], x['f'], x['d'])].append(x)
    rules = {}
    for k, L in byf.items():
        rules[(k[0], k[1], '')] = estimate_rules(L, dec['start'].get((k[0], k[1], '')))
    for k, L in byd.items():
        if k[2] != '(미기재)' and len(L) >= DEPT_MIN_N and len({x['d'] for x in byf[(k[0], k[1])]}) > 1:
            rules[k] = estimate_rules(L, dec['start'].get(k))
    log(f'6. 과목 규칙: 학부 {sum(1 for k in rules if not k[2])} · 학과 단위 {sum(1 for k in rules if k[2])} · 연도에 따라 규칙이 바뀐 단위 {sum(1 for k, v in rules.items() if v["start"] > min(v["yearly"]))}')

    def rule_for(r):
        k = (r['학교'], r['학부'], r['학과'])
        return (k, rules[k]) if k in rules else ((r['학교'], r['학부'], ''), rules.get((r['학교'], r['학부'], '')))
    df['규칙단위'] = ''; df['규칙구간'] = ''; df['요강허용'] = ''
    nmis = 0
    for i, r in df.iterrows():
        k, R = rule_for(r)
        if not R:
            df.at[i, '규칙구간'] = '규칙 없음(합격 기록 없음)'; continue
        df.at[i, '규칙단위'] = '학과' if k[2] else '학부'
        cur = r['연도'] >= R['start']; df.at[i, '규칙구간'] = '현재' if cur else '이전'
        sig = R['cur'] if cur else R['prev']
        bad = []
        for se in SES:
            kind = r[f'계열_{se}']
            if not isinstance(kind, str):
                continue
            x = dict(kind=kind, sci=sum(ok_(r[f'{s}_{se}']) for s in ('phy', 'chem', 'bio')), m1=ok_(r[f'm1_{se}']), m2=ok_(r[f'm2_{se}']))
            if mismatch(x, sig):
                j = dec['combo'].get((r['학교'], r['학부'], k[2], r[f'조합_{se}']))
                if j != '인정':
                    bad.append(se)
        if bad:
            df.at[i, 'flags'].append('조합불일치'); nmis += 1
        if have_yoko:
            yk, _ = yoko_kinds(r['학교'], r['학부'])
            if yk is not None:
                ks = {r[f'계열_{se}'] for se in SES if isinstance(r[f'계열_{se}'], str)}
                df.at[i, '요강허용'] = '예' if (ks & yk or ('일본어만' in yk and ks)) else ('아니오' if ks else '')
    log(f'   조합불일치 {nmis:,}행 (판단 「인정」 반영 후)')

    # 7. 영어증빙없음: 요강에서 영어 필수인 학부만. 요강 없는 학부는 합격자 60% 이상 기재면 추정
    df['영어기준'] = ''
    for (u, f), g in df.groupby(['학교', '학부']):
        en = yoko_en(u, f) if have_yoko else None
        if en is None:
            p = g[g['합부'] == 1]; e = (p['TOEFL'].notna() | p['TOEIC'].notna())
            en = 'est' if len(p) >= 8 and e.mean() >= .6 else False
            src = '추정 필수' if en else ''
        else:
            src = '요강 필수' if en else '요강 필수 아님'
        df.loc[g.index, '영어기준'] = src
        if en:
            m = g.index[(g['TOEFL'].isna() & g['TOEIC'].isna()) & (g['연도'] >= (rules.get((u, f, ''), {}).get('start', 0) if src == '요강 필수' else 0))]
            for i in m:
                df.at[i, 'flags'].append('영어증빙없음' + ('(추정)' if src == '추정 필수' else ''))

    # 8. 수준이탈·점수이상 (같은 학부·같은 계열 안에서)
    df['총점'] = df['총점_11'].where(df['총점_11'].notna(), df['총점_6'])
    df['계열'] = df['계열_11'].where(df['총점_11'].notna(), df['계열_6'])
    ok = df[df['총점'].notna() & ~df['flags'].map(lambda f: '중복' in f)]
    med = ok[ok['합부'] == 1].groupby(['학교', '학부', '계열'])['총점'].agg(['median', 'count'])
    medu = ok[ok['합부'] == 1].groupby(['학교', '계열'])['총점'].agg(['median', 'count'])
    df['비교중앙값'] = None
    for i, r in ok.iterrows():
        k = (r['학교'], r['학부'], r['계열'])
        mm = med.loc[k] if k in med.index and med.loc[k, 'count'] >= 10 else (medu.loc[(r['학교'], r['계열'])] if (r['학교'], r['계열']) in medu.index and medu.loc[(r['학교'], r['계열']), 'count'] >= 10 else None)
        if mm is not None:
            df.at[i, '비교중앙값'] = mm['median']
            if r['총점'] - mm['median'] >= LEVEL_GAP:
                df.at[i, 'flags'].append('수준이탈')
    for k, g in ok.groupby(['학교', '학부', '합부', '계열']):
        if len(g) < OUT_MIN:
            continue
        v = g['총점']; m0 = v.median(); mad = (v - m0).abs().median() or 1
        for i in g.index[((v - m0).abs() / (1.4826 * mad)) >= OUT_Z]:
            df.at[i, 'flags'].append('점수이상')

    # 9. 출력
    df['플래그'] = df['flags'].map(lambda f: ';'.join(f))
    for fl in FLAGS:
        log(f'   플래그 {fl}: {df["flags"].map(lambda f: any(x.startswith(fl) for x in f)).sum():,}행')
    cols = ['연도', '대학코드', '학교', '학부', '학과', '학부_원표기', '학과_원표기', '학부_계보', '구분2', '합부', '합부_원값'] + \
           [f'{s}_{se}' for se in SES for s in SUB] + ['TOEFL', 'TOEIC', '조합_6', '계열_6', '총점_6', '조합_11', '계열_11', '총점_11', '총점', '계열',
           '규칙단위', '규칙구간', '요강허용', '영어기준', '비교중앙값', '플래그', '기호_원값', '범위밖_원값', '원본파일', '원본행']
    mart = df[cols]
    mart.to_csv(out / 'admissions_mart.csv.gz', index=False, encoding='utf-8', compression='gzip')
    with pd.ExcelWriter(out / 'admissions_mart.xlsx', engine='openpyxl') as w:
        mart.to_excel(w, index=False, sheet_name='마트')
        ws = w.sheets['마트']; ws.freeze_panes = 'D2'; ws.auto_filter.ref = ws.dimensions
    rule_rows = []
    for (u, f, d), R in sorted(rules.items()):
        yk, yrul = yoko_kinds(u, f) if have_yoko else (None, None)
        rule_rows.append(dict(학교=u, 학부=f, 학과=d, 단위='학과' if d else '학부', 데이터연도=f'{min(R["yearly"])}~{max(R["yearly"])}',
                              현재규칙시작=R['start'], 현재규칙=sig_text(R['cur']), 이전규칙=sig_text(R['prev']),
                              요강2027=(' / '.join(yk) if yk else ('요강 없음' if have_yoko else '')),
                              연도별=' | '.join(f'{y}: {sig_text(s)}' for y, s in R['yearly'].items() if s)))
    pd.DataFrame(rule_rows).to_csv(out / 'admissions_rules.csv', index=False, encoding='utf-8-sig')
    write_review(out / '원장님_검토_입시데이터.xlsx', df, lin, rule_rows, rules, univ_var, have_yoko)
    (out / 'build_log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
    log(f'완료 → {out}')


def write_review(path, df, lin, rule_rows, rules, univ_var, have_yoko):
    wb = openpyxl.Workbook(); H = Font(bold=True); G = PatternFill('solid', fgColor='EFEFEC'); Y = PatternFill('solid', fgColor='FFF4CC')

    def sheet(name, rows, cols, widths, judge, note=None):
        ws = wb.create_sheet(name); ws.append(cols)
        for c in ws[1]:
            c.font = H; c.fill = Y if c.value in judge else G; c.alignment = Alignment(wrap_text=True, vertical='top')
        for r in rows:
            ws.append([r.get(c, '') for c in cols])
        for j, c in enumerate(cols, 1):
            ws.column_dimensions[get_column_letter(j)].width = widths.get(c, 12)
            if c in judge:
                for i in range(2, len(rows) + 2):
                    ws.cell(i, j).fill = Y
        ws.freeze_panes = 'A2'; ws.auto_filter.ref = ws.dimensions
        return ws
    ws = wb.active; ws.title = '안내'
    for t in ['입시 데이터 검토 — 판단이 필요한 것만 모았습니다',
              '',
              '노란 칸에 판단을 적어 주세요. 비워 두면 「아직 판단 안 함」으로 보고, 자동 규칙대로 둡니다.',
              '판단을 적은 이 파일을 돌려주시면 마트를 다시 만들 때 그대로 반영합니다 (내년에도 계속 적용).',
              '',
              '1. 학부계보 — 학부 이름이 바뀐 것 같은 짝입니다. 판단: 이름변경 / 통합 / 분리 / 아님',
              '   · 이름변경·통합: 옛 학부 기록을 새 학부에 합칩니다.  · 분리: 옛 기록은 따로 둡니다.  · 아님: 다른 학부.',
              '   · 「단서점수」가 높을수록 같은 학부일 가능성이 큽니다 (이름 포함·같은 학과 이름·바로 다음 해 등장).',
              '2. 규칙변경 — 해마다 합격자가 낸 과목을 보면 필수 과목이 바뀐 것 같은 학부·학과입니다.',
              '   · 「현재 규칙 시작」이 맞으면 비워 두고, 다르면 「확정 시작 연도」에 연도를 적어 주세요.',
              '   · 현재 규칙 시작 연도 이후 기록만 합격 곡선에 씁니다 (지금 기준이 제일 중요하므로).',
              '3. 소수조합 — 그 학부 합격자 대부분과 다른 과목으로 합격한 기록입니다. 판단: 인정(그 조합도 받는 학부) / 제외(잘못된 기록)',
              '4. 학교명 — 같은 대학코드에 이름이 둘 이상이거나, 같은 이름에 코드가 둘 이상입니다. 판단: 같은 학교 / 다른 학교',
              '',
              '참고: 플래그(중복·점수없음·기호·범위밖·수준이탈·점수이상)는 사람이 판단할 필요가 없어 이 파일에 넣지 않았습니다.',
              '      이 기록을 계산에 넣을지는 화면·계산 쪽에서 정합니다.']:
        ws.append([t])
    ws['A1'].font = Font(bold=True, size=13); ws.column_dimensions['A'].width = 120
    sheet('학부계보', lin, ['학교', '옛학부', '옛연도', '옛지원', '새학부', '새연도', '새지원', '이름겹침', '같은학과', '단서점수', '제안', '판단', '메모'],
          {'학교': 22, '옛학부': 18, '새학부': 18, '같은학과': 30, '제안': 20, '판단': 12, '메모': 24}, {'판단', '메모'})
    ch = [dict(r, **{'확정 시작 연도': '', '메모': ''}) for r in rule_rows if r['현재규칙시작'] > int(r['데이터연도'][:4])]
    sheet('규칙변경', ch, ['학교', '학부', '학과', '단위', '데이터연도', '현재규칙시작', '이전규칙', '현재규칙', '요강2027', '연도별', '확정 시작 연도', '메모'],
          {'학교': 20, '학부': 16, '학과': 16, '이전규칙': 34, '현재규칙': 34, '요강2027': 20, '연도별': 60, '확정 시작 연도': 12, '메모': 20}, {'확정 시작 연도', '메모'})
    mm = df[df['flags'].map(lambda f: '조합불일치' in f) & (df['합부'] == 1)]
    agg = collections.Counter()
    for _, r in mm.iterrows():
        k = (r['학교'], r['학부'], r['학과'] if r['규칙단위'] == '학과' else '')
        for se in SES:
            if isinstance(r[f'조합_{se}'], str):
                agg[(k, r[f'조합_{se}'], r['규칙구간'])] += 1
    rows = []
    for ((u, f, d), c, seg), n in agg.most_common():
        R = rules.get((u, f, d)) or rules.get((u, f, ''))
        rows.append(dict(학교=u, 학부=f, 학과=d, 조합=c, 건수=n, 규칙구간=seg, 그구간규칙=sig_text(R['cur'] if seg == '현재' else R['prev']) if R else '', 판단='', 메모=''))
    sheet('소수조합', rows, ['학교', '학부', '학과', '조합', '건수', '규칙구간', '그구간규칙', '판단', '메모'],
          {'학교': 20, '학부': 16, '학과': 16, '조합': 20, '그구간규칙': 40, '판단': 10, '메모': 24}, {'판단', '메모'})
    sheet('학교명', [dict(r, 판단='', 메모='') for r in univ_var], ['대학코드', '학교들', '판단', '메모'], {'대학코드': 24, '학교들': 50, '판단': 14, '메모': 24}, {'판단', '메모'})
    wb.save(path)


if __name__ == '__main__':
    main()
