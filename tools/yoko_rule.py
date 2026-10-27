#!/usr/bin/env python3
"""2027 모집요강(data/yoko/2027/*.json)에서 「이 학부가 어떤 계열·과목 조합의 지원자를 인정하는가」를 뽑는다.

schools_export.py · curves.py · results_export.py 가 같이 쓴다. 화면(view-school.js yokoOf)과 같은 방식으로 학교·학부를 맞춘다:
  학교 = doc.univ.ja == 입시 데이터의 학교 이름, 학부 = 데이터 학부(「-」앞)와 요강 fac_ja(끝의 学部 뗌)가
  같거나 한쪽이 다른 쪽으로 시작.

계열 규칙 (요강 unit.eju 의 R=필수 · C=선택 · N=불필요 · U=언급 없음)
  종합(so)·수학1(m1) 중 하나라도 R/C  → 문과 허용
  이과(ri)·수학2(m2) 중 하나라도 R/C  → 이과 허용
  둘 다 아니면(일본어만 보는 학부)     → 모든 계열 허용, 비교 점수는 일본어(J)만
  네 과목이 모두 U(요강에 언급 없음)   → 규칙을 만들지 않는다(요강 미확인으로 취급)
과목 조합
  문과: J 는 항상, 종합이 R/C 면 JS, 종합·수학1 모두 R/C 면 JSM
  이과: J 는 항상, 이과가 R/C 면 JR, 이과·수학2 모두 R/C 면 JRM
같은 학부가 여러 전형에 있으면 합집합(어느 전형으로든 낼 수 있는 계열·조합).
기술(ki)은 점수 비교에서 제외하는 현행 규칙을 유지한다(조합에 넣지 않음).
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "yoko" / "2027"
KINDS = ['문과', '이과', '일본어만']
ORDER = {'문과': ['J', 'JS', 'JSM'], '이과': ['J', 'JR', 'JRM'], '일본어만': ['J']}
_RC = ('R', 'C')

_docs = None
MISS = []   # 학부 매칭 실패(요강은 있는데 데이터 학부와 못 맞춤 / 데이터 학부는 있는데 요강 학부가 없음)


def _nk(s):
    return unicodedata.normalize('NFKC', str(s)).strip()


def docs():
    global _docs
    if _docs is None:
        _docs = {}
        for fp in sorted(DATA.glob('*.json')):
            d = json.loads(fp.read_text(encoding='utf-8'))
            _docs[_nk(d['univ']['ja'])] = d
    return _docs


def _fk(s):
    """학부 이름 비교용: 끝의 学部·学群, 가운뎃점, 探究/探求 표기 차이를 없앤다 (view-school.js yokoOf 와 같은 규칙)"""
    return re.sub('学部$|学群$', '', _nk(s).replace('・', '').replace('探究', '探求'))


def fac_match(data_fac, fac_ja):
    cf = _fk(_nk(data_fac).split('-')[0])
    yf = _fk(fac_ja or '')
    return bool(yf) and (yf == cf or cf.startswith(yf) or yf.startswith(cf))


def _sets(e):
    ok = lambda k: e.get(k) in _RC
    arts = ok('so') or ok('m1')
    sci = ok('ri') or ok('m2')
    out = {}
    if arts:
        out['문과'] = ['J'] + (['JS'] if ok('so') else []) + (['JSM'] if ok('so') and ok('m1') else [])
    if sci:
        out['이과'] = ['J'] + (['JR'] if ok('ri') else []) + (['JRM'] if ok('ri') and ok('m2') else [])
    if not arts and not sci:
        out = {k: ['J'] for k in KINDS}
    return out


def rule(univ, fac):
    """(학교, 학부) → {'doc','kinds':[…],'sets':{계열:[조합…]},'jonly':bool} 또는 None(요강 없음·미확인)"""
    doc = docs().get(_nk(univ))
    if not doc:
        return None
    merged, hit, unknown = {}, False, True
    for tr in doc['tracks']:
        for un in tr['units']:
            if not fac_match(fac, un.get('fac_ja')):
                continue
            e = un.get('eju') or {}
            hit = True
            if any(e.get(k, 'U') != 'U' for k in ('so', 'm1', 'ri', 'm2')):
                unknown = False
            for kind, ss in _sets(e).items():
                m = merged.setdefault(kind, [])
                for s in ss:
                    if s not in m:
                        m.append(s)
    if not hit:
        MISS.append((univ, fac, '요강에 이 학부가 없음'))
        return None
    if unknown:
        MISS.append((univ, fac, '요강의 EJU 과목이 모두 「언급 없음」'))
        return None
    kinds = [k for k in KINDS if k in merged]
    jonly = all(v == ['J'] for v in merged.values())
    return {'doc': doc['id'], 'kinds': kinds,
            'sets': {k: sorted(merged[k], key=ORDER[k].index) for k in kinds}, 'jonly': jonly}


def report_misses(out=print):
    """매칭 실패 목록 (조용히 넘기지 않는다)"""
    seen = sorted(set(MISS))
    for u, f, why in seen:
        out(f'  [요강 매칭 실패] {u} / {f} — {why}')
    return seen


def doc_facs_unmatched(df_pairs):
    """요강 학부(fac_ja)인데 데이터에 짝이 하나도 없는 것 → 목록. df_pairs = {(학교,학부)} """
    miss = []
    byu = {}
    for u, f in df_pairs:
        byu.setdefault(_nk(u), []).append(f)
    for uja, doc in docs().items():
        if uja not in byu:
            miss.append((uja, '(학교 전체)', '입시 데이터에 이 학교가 없음'))
            continue
        for tr in doc['tracks']:
            for un in tr['units']:
                if not any(fac_match(f, un.get('fac_ja')) for f in byu[uja]):
                    miss.append((uja, un.get('fac_ja') or un.get('fac'), '입시 데이터에 짝이 되는 학부가 없음'))
    return sorted(set(miss))
