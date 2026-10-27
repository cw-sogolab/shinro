/* 진학 상담 — 공통(라우터·도우미) + 예측·추천 / 비교 / 학부 곡선 / 검증
 * 모집요강 탭은 view-yoko.js, 모의고사 분석 탭은 view-mock.js (window.SH.views에 등록).
 * 데이터: assets/model.js (예측 계수, 엑셀 정본) · curves.js (합격 곡선) · names_ko.js (학교 한국어 이름)
 *        · yoko.js (모집요강, tools/build_yoko.py) · mock.js (모의고사 집계, tools/mock_export.py)
 * 화면: ../design 디자인 시스템 (ig- 클래스, window.Ilgong). 빨강은 선택·현재 위치 표시와 D-7 마감·경고에만.
 * 학생 이름·점수는 이 브라우저에만 저장(localStorage). 서버로 보내지 않음. */
(function () {
  "use strict";
  const M = window.MODEL, C = window.CURVES, Y = window.YOKO_DATA, KO = window.NAMES_KO || { univ: {}, fac: {} }, IG = window.Ilgong;
  const app = document.getElementById('app');
  if (!M || !C || !IG) { app.innerHTML = '<div class="ig-card ig-empty"><b>데이터가 없습니다</b><p>assets/model.js · curves.js 와 ../design/ilgong.js 가 있어야 합니다. tools/ 스크립트를 먼저 실행하세요.</p></div>'; return; }

  /* ---------- 도우미 ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sig = t => 1 / (1 + Math.exp(-t));
  const icon = (n, c) => IG.icon(n, c || 'ig-icon--sm');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('shinro.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('shinro.' + k, JSON.stringify(v)); } catch (e) { } }
  };
  const TODAY = (() => { const q = new URLSearchParams(location.search).get('today'); const d = q ? new Date(q + 'T00:00') : new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();
  const ISO = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const md = s => { const d = parse(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const fmt = s => `${md(s)} (${WD[parse(s).getDay()]})`;
  const range = s => s.end && s.end !== s.start ? `${fmt(s.start)} ~ ${fmt(s.end)}` : fmt(s.start);
  // D-day: 출원은 마감일 기준(접수 기간 안이면 「접수 중」), 나머지는 그날 기준. 빨강은 7일 이내만.
  const ddayOf = s => s.end && s.end !== s.start ? IG.dday(s.end, ISO, s.start) : IG.dday(s.start, ISO);
  const dday = s => { const d = ddayOf(s); return `<span class="ig-dday ig-dday--${d.cls}">${d.label}</span>`; };
  const pct = IG.pct;
  const yen = n => n.toLocaleString('ko-KR') + '엔';
  const DISC = `<p class="ig-disclaimer">${icon('info')}<span>참고용 · 합격을 보장하지 않음 · 합격 가능성은 과거 비슷한 점수 지원자 중 합격한 비율입니다.</span></p>`;

  const SUBJ = { jp: '일본어', so: '종합', math: '수학', phy: '물리', chem: '화학', bio: '생물', ki: '기술' };
  const MAXS = { jp: 400, so: 200, math: 200, phy: 100, chem: 100, bio: 100, ki: 50 };
  const SETCAP = { J: 374, JS: 574, JSM: 774, JR: 574, JRM: 774 };   // 조합 점수의 실제 최고점
  const REALMAX = { jp: 374 };   // 실제 EJU 일본어는 독해 199 + 청해·청독해 175 = 374가 최고 (400이 아님) — 예측이 이 위로 나오지 않게
  const SUBJ_SD = { jp: 25, so: 19, math: 17, phy: 8, chem: 8, bio: 9 };   // 과목별 예측 오차(근사, 엑셀 오차율요약 기준)
  const SETS = { J: ['jp'], JS: ['jp', 'so'], JSM: ['jp', 'so', 'm1'], JR: ['jp', 'r'], JRM: ['jp', 'r', 'm2'] };
  const SETLAB = { J: '일본어', JS: '일본어+종합', JSM: '일본어+종합+수학1', JR: '일본어+이과', JRM: '일본어+이과+수학2' };
  const EXAMS = [  // 시간 순서
    { id: 'm1', label: '모의고사 1회', short: '모의 1회', tiny: '모1', type: 'mock' }, { id: 'm2', label: '모의고사 2회', short: '모의 2회', tiny: '모2', type: 'mock' },
    { id: 'e6', label: 'EJU 6월', short: '6월 EJU', tiny: '6월', type: 'eju' }, { id: 'm3', label: '모의고사 3회', short: '모의 3회', tiny: '모3', type: 'mock' },
    { id: 'm4', label: '모의고사 4회', short: '모의 4회', tiny: '모4', type: 'mock' }, { id: 'e11', label: 'EJU 11월', short: '11월 EJU', tiny: '11월', type: 'eju' }];
  const ZONES = [['안정', .7], ['적정', .4], ['도전', .15]];
  const ZK = { 안정: 'safe', 적정: 'fit', 도전: 'try' };
  const zoneOf = p => (ZONES.find(z => p >= z[1]) || [null])[0];
  const zoneChip = z => z ? `<span class="ig-zone ig-zone--${ZK[z]}">${z}</span>` : '<span class="ig-badge">15% 미만</span>';

  /* 학교 이름: 한국어(굵게) 위, 일본어 아래 */
  const koName = u => { const a = KO.univ[u.s], b = KO.fac[u.f]; return a ? `${a} ${b || u.f}` : null; };
  const school = u => { const k = koName(u); return `<div class="ig-school">${k ? `<b>${esc(k)}</b><span class="ig-jp" lang="ja">${esc(u.s)} ${esc(u.f)}</span>` : `<b class="ig-jp" lang="ja">${esc(u.s)} ${esc(u.f)}</b>`}</div>`; };

  /* ---------- 영어 성적 (토플·토익·IELTS) ---------- */
  const ENG = window.ENG_RULES || {};
  /* 2026-01-21부터 TOEFL iBT 는 1~6 밴드로도 표기된다. 밴드 → 예전 0~120 점수는 ETS 환산표의 아래쪽 끝(보수적)을 쓴다 */
  const BAND_LOW = [[6.0, 114], [5.5, 107], [5.0, 95], [4.5, 82], [4.0, 69], [3.5, 55], [3.0, 42], [2.5, 30], [2.0, 18], [1.5, 12], [1.0, 0]];
  const bandToIbt = b => (BAND_LOW.find(([k]) => b >= k) || [0, 0])[1];
  /* 토플 칸 입력 → { t: iBT 0~120, b: 밴드 1~6 }. '92', '4.5', '5.0(100)', '80(4.0)' 모두 됨. 6.5 이하는 밴드, 7~120은 iBT 점수 */
  function parseToefl(v) {
    const out = {};
    for (const m of String(v ?? '').match(/\d+(?:\.\d+)?/g) || []) { const x = +m; if (x < 1) continue; if (x <= 6.5) { if (out.b == null) out.b = x; } else if (x <= 120) { if (out.t == null) out.t = Math.round(x); } }
    return out;
  }
  const engText = en => { en = en || {}; const t = en.t != null ? (en.b != null ? `${en.t}(${en.b})` : String(en.t)) : en.b != null ? String(en.b) : ''; return { t, x: en.x != null ? String(en.x) : '', i: en.i != null ? String(en.i) : '' }; };
  const engSummary = en => [en && (en.t != null || en.b != null) ? `TOEFL ${engText(en).t}` : '', en && en.x != null ? `TOEIC ${en.x}` : '', en && en.i != null ? `IELTS ${en.i}` : ''].filter(Boolean).join(' · ');
  /* 모집요강 한 전형·학부의 영어 요건을 학생 점수와 비교. st: ok 충족 · ng 미달 · no 점수 없음 · none 불필요 · check 요강 확인 */
  function engJudge(doc, tr, un, en) {
    en = en || (S && S.en) || {};
    if (un.en === 'N') return { st: 'none', t: '불필요', why: '' };
    const R = ENG[`${doc.id}/${tr.id}`], r = R && ((R.by_fac && R.by_fac[un.fac_ja]) || R.all);
    if (un.en === 'U' || !r) return { st: 'check', t: '요강 확인', why: '' };
    const have = { ibt: en.t != null || en.b != null, ielts: en.i != null, toeic: en.x != null };
    const mine = r.accept.filter(k => have[k]), th = r.min || null, NAME = { ibt: 'TOEFL', ielts: 'IELTS', toeic: 'TOEIC' };
    const tf = th && (th.band != null ? `TOEFL 밴드 ${th.band}${th.ibt != null ? ` (구 ${th.ibt}점)` : ''}` : th.ibt != null ? `TOEFL ${th.ibt}점` : '');
    const req = `${r.accept.map(k => NAME[k]).join('·')}${r.accept.length > 1 ? ' 중 하나' : '만'} · ${th ? [r.accept.includes('ibt') ? tf : '', r.accept.includes('ielts') && th.ielts != null ? `IELTS ${th.ielts}` : '', r.accept.includes('toeic') && th.toeic != null ? `TOEIC ${th.toeic}` : ''].filter(Boolean).join(' / ') + ' 이상' : '기준점 없음 (제출 필수)'}`;
    if (!mine.length) return { req, st: 'no', t: '점수 없음', why: (have.ibt || have.ielts || have.toeic) ? `인정 시험: ${r.accept.map(k => NAME[k]).join('·')}` : '영어 점수를 넣으면 판정', note: r.note };
    if (!th) return { req, st: 'ok', t: '제출 가능', why: '기준점 없음 (제출 필수)', note: r.note };
    const tries = mine.map(k => {
      if (k === 'ielts') return th.ielts == null ? { ok: true, why: 'IELTS (기준 없음)' } : { ok: en.i >= th.ielts, why: `IELTS ${en.i} / ${th.ielts}` };
      if (k === 'toeic') return th.toeic == null ? { ok: true, why: 'TOEIC (기준 없음)' } : { ok: en.x >= th.toeic, why: `TOEIC ${en.x} / ${th.toeic}` };
      if (th.band == null && th.ibt == null) return { ok: true, why: 'TOEFL (기준 없음)' };
      if (en.b != null && th.band != null) return { ok: en.b >= th.band, why: `TOEFL 밴드 ${en.b} / ${th.band}` };
      if (en.t != null && th.ibt != null) return { ok: en.t >= th.ibt, why: `TOEFL ${en.t} / ${th.ibt}점` };
      if (en.b != null) return { ok: bandToIbt(en.b) >= th.ibt, why: `TOEFL 밴드 ${en.b}(≈${bandToIbt(en.b)}점) / ${th.ibt}점` };
      return { ok: en.t >= bandToIbt(th.band), why: `TOEFL ${en.t}점 / 밴드 ${th.band}(≈${bandToIbt(th.band)}점)` };
    });
    const good = tries.find(x => x.ok);
    return good ? { req, st: 'ok', t: '충족', why: good.why, note: r.note } : { req, st: 'ng', t: '미달', why: tries.map(x => x.why).join(' · '), note: r.note };
  }

  /* ---------- 상태 ---------- */
  const DEFAULT = { name: '예시 학생', kind: '문과', sci: ['phy', 'chem'], target: 'auto',
    rows: { m1: { jp: 290, so: 130, math: 120, ki: 35 }, m2: { jp: 305, so: 138, math: 128, ki: 35 }, e6: { jp: 318, so: 142, math: 135, ki: 40 }, m3: { jp: 320, so: 145, math: 140, ki: 40 }, m4: {}, e11: {} } };
  let S = store.get('student', DEFAULT);
  /* 학생 목록 (tools/students_export.py → students.js). 저장소엔 없고 드라이브 폴더에서 접속 코드 확인 후 내려옴. 없으면 직접 입력만 */
  const STU = window.STUDENTS && window.STUDENTS.list && window.STUDENTS.list.length ? window.STUDENTS : null;
  /* dest: 불러온 뒤 갈 화면. 홈에서 부르면 'home'으로 그대로 머문다 */
  function loadStudent(st, dest = 'pred') {
    S = { name: st.n, campus: st.c, kind: st.k, sci: st.sci && st.sci.length === 2 ? st.sci.slice() : ['phy', 'chem'], target: 'auto', src: 'xlsx', en: st.en ? { ...st.en } : {},
      rows: { m1: {}, m2: {}, e6: {}, m3: {}, m4: {}, e11: {}, ...JSON.parse(JSON.stringify(st.rows)) } };
    save(); if (dest === 'pred') store.set('sqFocus', true); go(dest);
  }
  function bindStudentSearch(q = document.getElementById('sq'), box = document.getElementById('ssugg'), dest = 'pred') {
    let act = -1, hits = [];
    const norm = t => t.replace(/\s/g, '');
    const run = () => {
      const t = norm(q.value); act = -1;
      if (!t) { box.innerHTML = ''; hits = []; return; }
      hits = STU.list.filter(x => norm(x.n).startsWith(t)).concat(STU.list.filter(x => !norm(x.n).startsWith(t) && norm(x.n).includes(t))).slice(0, 8);
      box.innerHTML = hits.length ? hits.map((x, i) => `<a href="#" data-i="${i}"><span><b>${esc(x.n)}</b> <span class="ig-muted">${esc(x.c)} · ${x.k}</span>${x.c === '외부' ? ' <span class="ig-badge ig-badge--warning">외부 응시생</span>' : ''}</span><small>${EXAMS.filter(e => x.rows[e.id]).map(e => e.short).join(' · ')}</small></a>`).join('')
        : '<p class="ig-muted" style="margin:8px 0 0;font-size:13px">맞는 학생이 없습니다.</p>';
      box.querySelectorAll('a').forEach(a => a.onclick = e => { e.preventDefault(); loadStudent(hits[+a.dataset.i], dest); });
    };
    q.addEventListener('input', run);
    q.addEventListener('keydown', e => {
      const items = [...box.querySelectorAll('a')];
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((a, i) => a.setAttribute('aria-current', i === act)); }
      if (e.key === 'Enter' && hits.length) { e.preventDefault(); loadStudent(hits[Math.max(0, act)], dest); }
      if (e.key === 'Escape') { q.value = ''; run(); }
    });
  }
  let cmp = store.get('cmp', []);   // ['학교|학부|계열', ...]
  let tab = 'pred', sel = null, filt = store.get('filt', { q: '', weak: true });
  const ukey = u => `${u.s}|${u.f}|${u.k}`;
  const unitByKey = k => C.units.find(u => ukey(u) === k);
  function save() { store.set('student', S); }
  function setCmp(v) { cmp = v.slice(0, 4); store.set('cmp', cmp); const c = document.getElementById('cmpCnt'); c.textContent = cmp.length; c.hidden = !cmp.length; }

  /* ---------- 예측 (엑셀 모델계수와 같은 식) ---------- */
  function subjects() { return S.kind === '문과' ? ['jp', 'so', 'math', 'ki'] : ['jp', S.sci[0], S.sci[1], 'math', 'ki']; }
  function parts() { return S.kind === '문과' ? ['jp', 'so', 'math'] : ['jp', S.sci[0], S.sci[1], 'math']; }
  function hasRow(id) { const r = S.rows[id] || {}; return subjects().some(s => r[s] !== '' && r[s] != null && !isNaN(+r[s])); }
  function autoTarget() { return hasRow('e11') ? 'a11' : hasRow('e6') ? 'e11' : 'e6'; }
  /* 과목별 예측 점수 → 조합 점수 계산에 쓰는 벡터 */
  function vecFrom(P) {
    const sc = S.sci;
    return { jp: P.jp?.fin, so: P.so?.fin, m1: S.kind === '문과' ? P.math?.fin : undefined,
             r: S.kind === '이과' && P[sc[0]] && P[sc[1]] ? P[sc[0]].fin + P[sc[1]].fin : undefined, m2: S.kind === '이과' ? P.math?.fin : undefined };
  }
  function predict() {
    const target = S.target === 'auto' ? autoTarget() : S.target;
    const out = { target, subj: {}, used: new Set() };
    for (const s of subjects()) {
      if (target === 'a11') { const v = +S.rows.e11?.[s]; if (S.rows.e11?.[s] !== '' && S.rows.e11?.[s] != null && !isNaN(v)) out.subj[s] = { fin: v, raw: v }; out.used.add('e11'); continue; }
      const co = M.coef[S.kind]?.[target]?.[s]; if (!co) continue;
      let num = 0, den = 0;
      for (const [src, c] of Object.entries(co)) {
        const raw = S.rows[src]?.[s]; if (raw === '' || raw == null || isNaN(+raw)) continue;
        num += c.w * (c.a + c.b * (+raw - c.d)); den += c.w; out.used.add(src);
      }
      if (!den) continue;
      const r = num / den; let f = r;
      const A = target === 'e11' && M.adj[S.kind]?.[s]; if (A) f = Math.min(A.cap, Math.max(0, A.c0 + A.c1 * r));
      out.subj[s] = { raw: r, fin: Math.min(REALMAX[s] || MAXS[s], Math.max(0, f)) };
    }
    const P = out.subj;
    out.vec = vecFrom(P);
    const pp = parts();
    out.total = pp.every(p => P[p]) ? pp.reduce((t, p) => t + P[p].fin, 0) : null;
    out.sd = target === 'a11' ? 0 : (target === 'e11' ? M.sd11 : M.sd6)[S.kind];
    out.fullVar = pp.reduce((t, p) => t + (SUBJ_SD[p] || 10) ** 2, 0);
    return out;
  }
  /* 예측 범위의 하한(-1)·상한(+1) 점수 (평균=0은 그대로). 총점이 「보통 범위」 끝(± P.sd)에 오도록 과목마다 분산 비율로 나눠 움직인다.
   * 끝점은 점수가 그 값이라고 보고 곡선을 바로 읽으므로 오차 평균(sd)은 0으로 둔다 */
  function scenarioPred(P, k) {
    if (!k || !P.sd || P.total == null) return P;
    const pp = parts(), subj = {};
    for (const s of Object.keys(P.subj)) {
      const v = P.subj[s], w = pp.includes(s) ? (SUBJ_SD[s] || 10) ** 2 / P.fullVar : 0;
      subj[s] = { ...v, fin: Math.min(REALMAX[s] || MAXS[s], Math.max(0, v.fin + k * P.sd * w)) };
    }
    return { ...P, subj, vec: vecFrom(subj), total: pp.reduce((t, q) => t + subj[q].fin, 0), sd: 0 };
  }
  function setScore(pred, set) {
    let t = 0; for (const c of SETS[set]) { const v = pred.vec[c]; if (v == null) return null; t += v; } return t;
  }
  function setSd(pred, set) {
    if (!pred.sd) return 0;
    const map = { jp: ['jp'], so: ['so'], m1: ['math'], m2: ['math'], r: S.sci };
    const v = SETS[set].flatMap(c => map[c]).reduce((t, s) => t + (SUBJ_SD[s] || 10) ** 2, 0);
    return pred.sd * Math.sqrt(v / pred.fullVar);
  }
  function pAt(u, x, sd) {
    const f = v => sig(u.a + u.b * v + C.shift);
    if (!sd) return f(x);
    const zs = [-2, -1.5, -1, -.5, 0, .5, 1, 1.5, 2], w = zs.map(z => Math.exp(-z * z / 2)), W = w.reduce((a, b) => a + b);
    const top = Math.min(u.max, SETCAP[u.set] || u.max);   // 실제로 나올 수 없는 점수(예: 일본어 374 위)는 계산에서 뺀다
    return zs.reduce((acc, z, i) => acc + w[i] * f(Math.min(top, Math.max(0, x + z * sd))), 0) / W;
  }
  const p50 = u => { const v = (-u.a - C.shift) / u.b; return v >= 0 && v <= Math.min(u.max, SETCAP[u.set] || u.max) ? Math.round(v) : null; };   // 실제 최고점(예: 일본어+종합+수학1 774)을 넘으면 「만점 넘음」
  const MIN_AUC = .5;   // 구별력(AUC)이 이보다 낮으면 점수로 합격이 갈리지 않으므로 참고용
  const MIN_N = 30;   // 학습 인원이 이보다 적으면 곡선이 흔들려서 참고용
  const weak = u => u.auc < MIN_AUC || p50(u) == null || u.n < MIN_N;
  const weakTag = u => `<span class="ig-tag-nonscore">${u.auc >= MIN_AUC && p50(u) != null && u.n < MIN_N ? '자료 적음' : '점수 외 요소 큼'}</span>`;
  function evalUnit(u, pred) {
    const x = setScore(pred, u.set); if (x == null) return null;
    const p = pAt(u, x, setSd(pred, u.set)); return { u, x: Math.round(x), p, z: zoneOf(p), m: p50(u), weak: weak(u) };
  }
  const examTotal = id => { const r = S.rows[id] || {}; const pp = parts(); return pp.every(p => r[p] !== '' && r[p] != null && !isNaN(+r[p])) ? pp.reduce((t, p) => t + +r[p], 0) : null; };

  /* ---------- 要項ノート 연결 ---------- */
  function yokoFor(u) {
    if (!Y) return null;
    const doc = Y.docs.find(d => d.univ.ja === u.s); if (!doc) return null;
    const cf = u.f.split('-')[0];
    for (const tr of doc.tracks) {
      const i = tr.units.findIndex(x => { const yf = (x.fac_ja || '').replace(/学部$/, ''); return yf === cf || cf.startsWith(yf) || yf.startsWith(cf); });
      if (i >= 0) return { doc, tr, unit: tr.units[i], i, key: `${doc.id}/${tr.id}/${i}`, link: `#yoko/s/${doc.id}/${tr.id}/${i}` };
    }
    return null;
  }
  const src = (y, p) => p ? ` <a class="ig-src" href="#yoko/d/${y.doc.id}?p=${p}">원문 ${p}쪽</a>` : '';
  function yokoByKey(key) {
    if (!Y) return null; const [d, t, i] = key.split('/'); const doc = Y.docs.find(x => x.id === d); const tr = doc && doc.tracks.find(x => x.id === t);
    const unit = tr && tr.units[+i]; return unit ? { doc, tr, unit, i: +i, key, link: `#yoko/s/${key}` } : null;
  }
  /* 모집요강 학부 → 합격 곡선 학부 (계열은 지금 학생 계열 우선) */
  function curveFor(y) {
    const fj = (y.unit.fac_ja || '').replace(/学部$/, '');
    const c = C.units.filter(u => u.s === y.doc.univ.ja && (() => { const cf = u.f.split('-')[0]; return fj && (cf === fj || cf.startsWith(fj) || fj.startsWith(cf)); })());
    return c.find(u => u.k === S.kind) || c.find(u => u.k === '일본어만') || c[0] || null;
  }
  /* 비교 바구니: 곡선 학부 '학교|학부|계열' 또는 모집요강 학부 'y:대학/전형/번호' */
  function cmpItem(k) {
    if (k.startsWith('s:')) { const [su, sf, sk] = k.slice(2).split('|'); const cu = C.units.find(x => x.s === su && x.f === sf && x.k === sk) || null; return { k, u: cu, y: yokoFor({ s: su, f: sf }), sch: { u: su, f: sf, kind: sk } }; }
    if (k.startsWith('y:')) { const y = yokoByKey(k.slice(2)); return y ? { k, y, u: curveFor(y) } : null; }
    const u = unitByKey(k); return u ? { k, u, y: yokoFor(u) } : null;
  }
  function cmpKeyForYoko(y) { const u = curveFor(y); return u ? ukey(u) : 'y:' + y.key; }
  const yokoSchool = y => `<div class="ig-school"><b>${esc(KO.univ[y.doc.univ.ja] || y.doc.univ.ko)} ${esc((y.unit.fac || '').replace(/학부$/, ''))}${y.unit.dept && y.tr.units.filter(z => z.fac === y.unit.fac).length > 1 ? ' · ' + esc(y.unit.dept) : ''}</b><span class="ig-jp" lang="ja">${esc(y.doc.univ.ja)} ${esc(y.unit.fac_ja || '')}</span></div>`;

  /* ---------- 공통: 페이지 머리 ---------- */
  const pagehead = (eyebrow, title, desc, actions) => `<div class="ig-pagehead"><div><p class="ig-pagehead__eyebrow">${eyebrow}</p><h1 class="ig-pagehead__title" id="ptitle">${title}</h1>${desc ? `<p class="ig-pagehead__desc">${desc}</p>` : ''}</div>${actions ? `<div class="ig-pagehead__actions">${actions}</div>` : ''}</div>`;
  const sectionH = (no, title, meta, id) => `<div class="ig-section-h"><span class="ig-step-no">${no}</span><h2>${title}</h2><span class="ig-muted sh-sec-meta"${id ? ` id="${id}"` : ''}>${meta || ''}</span></div>`;
  const TGT_LABEL = { e6: 'EJU 6월 예측', e11: 'EJU 11월 예측', a11: 'EJU 11월 실제 점수' };

  /* ---------- 탭 1: 예측·추천 ---------- */
  function viewPred() {
    const subs = subjects();
    const seg = (id, items, on, label) => `<div class="ig-seg" role="group" aria-label="${label}" id="${id}">${items.map(([v, l]) => `<button type="button" value="${v}" aria-pressed="${on(v)}">${l}</button>`).join('')}</div>`;
    app.innerHTML = `
      ${pagehead('진학 상담 · 예측·추천', esc(S.name), S.src ? `${S.kind}${S.campus ? ' · ' + esc(S.campus) : ''} · 「${esc(STU.source)}」(${esc(STU.built)} 기준)에서 불러옴 · 점수를 고치면 이 화면에서만 바뀜` : `${S.kind} · 성적 → 다음 EJU 예측 → 안정·적정·도전 추천 → 비교에 담기`,
        `<a class="ig-btn" href="#report">${icon('file')}상담 리포트 (PDF)</a><a class="ig-btn" href="#curve">${icon('chart')}합격 곡선 모아 보기</a><button type="button" class="ig-btn ig-btn--ghost" id="reset">${icon('edit')}예시 점수로 되돌리기</button>`)}
      <section>
        ${sectionH(1, '성적', '모의고사와 EJU를 따로 표시 · 본 시험만 입력')}
        <div class="ig-card">
          ${STU ? `<div class="sh-find">
            <label class="ig-field"><span class="ig-field__label">학생 찾기 · ${STU.list.length}명 (이름을 치면 성적이 바로 채워집니다)</span><span class="ig-field__control">${icon('search', '')}<input class="ig-input" id="sq" type="search" placeholder="이름 입력 후 Enter" autocomplete="off" aria-controls="ssugg"></span></label>
            <div class="sh-sugg" id="ssugg" role="listbox" aria-label="찾은 학생"></div></div>` : ''}
          <div class="sh-controls">
            <label class="ig-field"><span class="ig-field__label">학생 이름${STU ? '' : ' (가상 이름 권장)'}</span><input class="ig-input" id="nm" value="${esc(S.name)}" autocomplete="off"></label>
            <div class="ig-field"><span class="ig-field__label">계열 (수험 과목으로 정함)</span>${seg('kind', [['문과', '문과 · 종합'], ['이과', '이과 · 물화생']], v => S.kind === v, '계열')}</div>
            ${S.kind === '이과' ? `<div class="ig-field"><span class="ig-field__label">이과 과목 2개</span>${seg('sci', ['phy', 'chem', 'bio'].map(s => [s, SUBJ[s]]), v => S.sci.includes(v), '이과 과목')}</div>` : ''}
          </div>
          <div class="ig-table-wrap"><table class="ig-table ig-table--sticky sh-scores">
            <thead><tr><th scope="col">시험</th><th scope="col">구분</th>${subs.map(s => `<th scope="col" class="num">${SUBJ[s]}<small>/${MAXS[s]}</small></th>`).join('')}<th scope="col" class="num">총점<small>(기술 제외)</small></th></tr></thead>
            <tbody>${EXAMS.map(e => `<tr class="${e.type === 'eju' ? 'is-eju' : ''}"><td><b>${e.label}</b></td>
              <td>${e.type === 'mock' ? '<span class="ig-badge ig-badge--outline">모의고사</span>' : '<span class="ig-badge ig-badge--info">EJU</span>'}</td>
              ${subs.map(s => `<td class="num"><input class="ig-input" inputmode="numeric" data-r="${e.id}" data-s="${s}" value="${esc(S.rows[e.id]?.[s] ?? '')}" aria-label="${e.label} ${SUBJ[s]}"></td>`).join('')}
              <td class="num" data-tot="${e.id}"></td></tr>`).join('')}</tbody></table></div>
          <div class="sh-en-in">
            <span class="ig-field__label">영어 성적 (선택) <span class="ig-muted">· 모집요강의 영어 조건 판정에 쓰입니다</span></span>
            <label class="ig-field"><span class="ig-field__label">TOEFL iBT</span><input class="ig-input" id="en-t" inputmode="decimal" placeholder="92 · 4.5 · 5.0(100)" value="${esc(engText(S.en).t)}" autocomplete="off"></label>
            <label class="ig-field"><span class="ig-field__label">TOEIC</span><input class="ig-input" id="en-x" inputmode="numeric" placeholder="780" value="${esc(engText(S.en).x)}" autocomplete="off"></label>
            <label class="ig-field"><span class="ig-field__label">IELTS</span><input class="ig-input" id="en-i" inputmode="decimal" placeholder="6.5" value="${esc(engText(S.en).i)}" autocomplete="off"></label>
          </div>
          <p class="sh-note">모의고사는 학원 전국모의고사 변환점수, EJU는 실제 성적표 점수. 빈칸은 계산에서 빠집니다. 이름·점수는 이 컴퓨터 브라우저에만 저장됩니다.</p>
        </div>
      </section>
      <section>
        ${sectionH(2, '다음 EJU 예측', '', 'predmeta')}
        <div class="ig-grid ig-grid--main">
          <div class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">총점 추이</h3><p class="ig-card__sub" id="trendsub"></p></div><ul class="ig-legend" style="margin:0"><li><i></i>본인</li><li><i class="range"></i>예측 범위</li></ul></div><div class="ig-chart" id="trend"></div></div>
          <div class="ig-card" id="predbox"></div>
        </div>
      </section>
      <section>
        ${sectionH(3, '추천 학교', '', 'recmeta')}
        <div class="sh-filters" id="scnrow"><div class="ig-field"><span class="ig-field__label">예측 점수 구간 <span class="ig-muted" id="scnnote"></span></span><div class="ig-seg" role="group" aria-label="예측 점수 구간" id="scn">${[['low', '하한'], ['mid', '평균'], ['high', '상한'], ['all', '세 구간 비교']].map(([v, l]) => `<button type="button" value="${v}" aria-pressed="${scn === v}">${l}</button>`).join('')}</div></div></div>
        <div class="sh-filters">
          <label class="ig-field"><span class="ig-sr">학교·학부 거르기</span><span class="ig-field__control">${icon('search', '')}<input class="ig-input" type="search" id="fq" placeholder="학교·학부 이름 (한국어·일본어)" value="${esc(filt.q)}"></span></label>
          <label class="sh-check"><input type="checkbox" id="fw" ${filt.weak ? 'checked' : ''}>「참고용」 학부도 보기</label>
          <span class="ig-muted" style="font-size:12px;margin-left:auto">칸마다 휠로 내려 보기 · 반반 점수 높은 학교부터</span>
        </div>
        <div class="ig-grid ig-grid--3" id="cols"></div>
        <div id="refbox" style="margin-top:12px"></div>
        <div style="margin-top:12px">${DISC}</div>
      </section>`;

    const setEn = () => {
      const t = parseToefl(document.getElementById('en-t').value), x = parseFloat(document.getElementById('en-x').value), i = parseFloat(document.getElementById('en-i').value);
      S.en = { ...(t.t != null ? { t: t.t } : {}), ...(t.b != null ? { b: t.b } : {}), ...(x > 0 ? { x: Math.round(x) } : {}), ...(i > 0 ? { i } : {}) }; save();
    };
    ['en-t', 'en-x', 'en-i'].forEach(id => document.getElementById(id).oninput = setEn);
    document.getElementById('nm').oninput = e => { S.name = e.target.value; save(); document.getElementById('ptitle').textContent = S.name; };
    if (STU) bindStudentSearch();
    app.querySelectorAll('#kind button').forEach(b => b.onclick = () => { S.kind = b.value; save(); viewPred(); });
    app.querySelectorAll('#sci button').forEach(b => b.onclick = () => {
      const s = b.value; if (S.sci.includes(s)) { b.setAttribute('aria-pressed', 'true'); return; } S.sci = [S.sci[1], s]; save(); viewPred();
    });
    document.getElementById('reset').onclick = () => { S = JSON.parse(JSON.stringify(DEFAULT)); save(); viewPred(); IG.toast('예시 점수로 되돌렸습니다'); };
    if (STU && store.get('sqFocus', false)) { store.set('sqFocus', false); const q = document.getElementById('sq'); if (q) q.focus(); }
    app.querySelectorAll('.sh-scores input').forEach(inp => inp.oninput = () => {
      const r = inp.dataset.r, s = inp.dataset.s; S.rows[r] = S.rows[r] || {};
      const v = inp.value.trim(); if (v === '') delete S.rows[r][s]; else S.rows[r][s] = +v;
      save(); drawPred();
    });
    app.querySelectorAll('#scn button').forEach(b => b.onclick = () => { scn = b.value; store.set('scn', scn); drawRec(); });
    document.getElementById('fq').oninput = e => { filt.q = e.target.value; store.set('filt', filt); drawRec(); };
    document.getElementById('fw').onchange = e => { filt.weak = e.target.checked; store.set('filt', filt); drawRec(); };
    drawPred();
  }

  /* 예측 총점의 「보통」 범위 [lo, hi] — 예측이 없으면 [null, null] */
  function predRange(P) {
    if (P.total == null) return [null, null];
    return [Math.max(0, Math.round(P.total - P.sd)), Math.min(Math.round(P.total + P.sd), parts().reduce((t, q) => t + (REALMAX[q] || MAXS[q]), 0))];
  }
  function drawPred() {
    const P = predict(), box = document.getElementById('predbox'); if (!box) return;
    app.querySelectorAll('[data-tot]').forEach(td => { const t = examTotal(td.dataset.tot); td.innerHTML = t == null ? '<span class="ig-muted">—</span>' : `<b>${t}</b>`; });
    const tl = TGT_LABEL[P.target];
    const used = EXAMS.filter(e => P.used.has(e.id)).map(e => e.short).join(' · ');
    document.getElementById('predmeta').textContent = `${tl.replace(' 점수', '')} · ${used ? used + ' 반영' : '반영한 시험 없음'}`;
    const opts = [['auto', '자동'], ['e6', '6월 예측'], ['e11', '11월 예측'], ['a11', '11월 실제']];
    const segHtml = `<div class="sh-target"><span class="ig-field__label">예측 기준</span><div class="ig-seg" role="group" aria-label="예측 기준" id="tgt">${opts.map(([v, l]) => `<button type="button" value="${v}" aria-pressed="${S.target === v}">${l}</button>`).join('')}</div></div>`;
    const [lo, hi] = predRange(P);

    if (P.total == null) {
      box.innerHTML = `<div class="ig-card__head"><div><h3 class="ig-card__title">${tl}</h3></div></div>
        <div class="ig-empty" style="padding:24px 8px">${icon('trend', '')}<b>아직 예측할 수 없어요</b><p>${P.target === 'e6' ? '6월 예측은 모의고사 1·2회 점수로 계산합니다.' : P.target === 'a11' ? 'EJU 11월 점수를 넣어 주세요.' : '점수를 넣으면 예측이 나옵니다.'}</p></div>${segHtml}`;
    } else {
      const total = Math.round(P.total), isAct = P.target === 'a11';
      const sLo = Math.max(0, Math.floor((lo - 60) / 50) * 50), sHi = Math.min(800, Math.ceil((hi + 60) / 50) * 50), L = v => ((v - sLo) / (sHi - sLo) * 100).toFixed(1) + '%';
      const subPred = s => {
        const v = P.subj[s]; if (!v) return `<div class="ig-pred"><span class="ig-pred__label">${SUBJ[s]}</span><div class="ig-pred__value"><b>—</b></div></div>`;
        const f = Math.round(v.fin), sd = P.sd ? P.sd * (SUBJ_SD[s] || 10) / Math.sqrt(P.fullVar) : 0, a = Math.max(0, Math.round(v.fin - sd)), b = Math.min(REALMAX[s] || MAXS[s], Math.round(v.fin + sd)), X = x => (x / MAXS[s] * 100).toFixed(1) + '%';
        return `<div class="ig-pred"><span class="ig-pred__label">${SUBJ[s]} <span class="ig-muted">/${MAXS[s]}</span></span><div class="ig-pred__value"><b>${f}</b>${sd ? `<span>보통 ${a}~${b}</span>` : ''}</div>
          ${sd ? `<div class="ig-pred__track" aria-hidden="true"><span class="ig-pred__range" style="left:${X(a)};width:calc(${X(b)} - ${X(a)})"></span><span class="ig-pred__point" style="left:${X(f)}"></span></div>` : ''}</div>`;
      };
      box.innerHTML = `<div class="ig-card__head"><div><h3 class="ig-card__title">${tl}</h3><p class="ig-card__sub">${S.kind === '문과' ? '일본어+종합+수학' : '일본어+이과 2과목+수학'} 총점 · 기술 제외</p></div><span class="ig-badge ${isAct ? 'ig-badge--info' : 'ig-badge--outline'}">${isAct ? '실제' : '예측'}</span></div>
        <div class="ig-pred sh-pred-total"><span class="ig-pred__label">${isAct ? '11월 EJU 총점' : '예상 총점'}</span>
          <div class="ig-pred__value"><b>${total}</b><span>${isAct ? '점 · 실제 점수' : `보통 ${lo}~${hi}점`}</span></div>
          ${isAct ? '' : `<div class="ig-pred__track" aria-hidden="true"><span class="ig-pred__range" style="left:${L(lo)};width:calc(${L(hi)} - ${L(lo)})"></span><span class="ig-pred__point" style="left:${L(total)}"></span></div><div class="ig-pred__scale"><span>${sLo}</span><span>${sHi}</span></div>`}</div>
        <div class="sh-pred-sub">${parts().map(subPred).join('')}</div>
        ${segHtml}
        <p class="sh-note">${isAct ? '실제 점수라 범위 없이 추천을 계산합니다.' : `「보통」 범위는 지난 검증에서 예측이 실제와 벌어진 정도(±${Math.round(P.sd)}점). 추천의 합격 가능성도 이 범위를 반영합니다.${P.target === 'e11' ? ' 11월 예측은 상위권 보정을 적용했습니다.' : ''}`}</p>`;
    }
    box.querySelectorAll('#tgt button').forEach(b => b.onclick = () => { S.target = b.value; save(); drawPred(); });
    drawTrend(P, lo, hi);
    drawRec(P);
  }

  /* 성적 추이 차트 옵션 (예측·추천 화면과 상담 리포트가 같이 씀). 그릴 점수가 하나도 없으면 null */
  function trendOpts(P, lo, hi, narrow) {
    const pi = P.total == null || P.target === 'a11' ? -1 : P.target === 'e6' ? 2 : 5;
    const me = EXAMS.map((e, i) => i === pi ? null : examTotal(e.id));
    const vals = me.filter(v => v != null).concat(pi >= 0 ? [lo, hi] : []);
    if (!vals.length) return null;
    const min = Math.max(0, Math.floor((Math.min(...vals) - 30) / 50) * 50), max = Math.min(800, Math.ceil((Math.max(...vals) + 30) / 50) * 50);
    const known = EXAMS.map((e, i) => me[i] != null ? `${e.short} ${me[i]}점` : null).filter(Boolean).join(', ');
    return { labels: EXAMS.map(e => narrow ? e.tiny : e.short), me, min, max: max === min ? min + 100 : max,
      pred: pi >= 0 ? { i: pi, point: Math.round(P.total), lo, hi } : null,
      label: `${S.kind} 총점 추이: ${known || '입력 없음'}${pi >= 0 ? `. ${EXAMS[pi].short} 예상 ${Math.round(P.total)}점(보통 ${lo}~${hi})` : ''}` };
  }
  function drawTrend(P, lo, hi) {
    const el = document.getElementById('trend'); if (!el) return;
    document.getElementById('trendsub').textContent = `${S.kind} 총점 · 모의고사는 변환점수`;
    const o = trendOpts(P, lo, hi, el.clientWidth < 520);
    if (!o) { el.innerHTML = `<div class="ig-empty">${icon('chart', '')}<b>점수를 넣으면 추이가 보여요</b></div>`; return; }
    IG.trendChart(el, o);
  }

  let lastPred = null;
  let scn = store.get('scn', 'mid');   // 추천을 볼 예측 점수 구간: low 하한 · mid 평균 · high 상한 · all 세 구간 비교
  const SCN = { low: [-1, '하한'], mid: [0, '평균'], high: [1, '상한'] };
  function drawRec(P) {
    P = P || lastPred || predict(); lastPred = P;
    const cols = document.getElementById('cols'); if (!cols) return;
    const hasBand = P.total != null && !!P.sd, mode = hasBand ? scn : 'mid';
    const tot = k => Math.round(scenarioPred(P, k).total);
    const sr = document.getElementById('scnrow'); if (sr) sr.style.display = hasBand ? '' : 'none';
    const sn = document.getElementById('scnnote'); if (sn) sn.textContent = hasBand ? `하한 ${tot(-1)} · 평균 ${tot(0)} · 상한 ${tot(1)}점` : '';
    document.querySelectorAll('#scn button').forEach(b => b.setAttribute('aria-pressed', b.value === mode));
    if (mode === 'all') return drawRecAll(P, cols);
    const Q = scenarioPred(P, SCN[mode][0]);
    const q = filt.q.trim();
    const rows = C.units.filter(u => (u.k === S.kind || u.k === '일본어만') && (!q || (u.s + u.f + (koName(u) || '')).includes(q)))
      .map(u => evalUnit(u, Q)).filter(r => r && r.z);
    const ref = rows.filter(r => r.weak), main = rows.filter(r => !r.weak);
    document.getElementById('recmeta').textContent = P.total == null ? '점수를 넣으면 나옵니다' : `${S.kind} · ${hasBand ? `${SCN[mode][1]} ${Math.round(Q.total)}점 · ` : ''}추천 ${main.length}개 학부 + 참고용 ${ref.length}개 · 15% 미만은 숨김`;
    cols.innerHTML = ZONES.map(([z]) => {
      const list = main.filter(r => r.z === z).sort((a, b) => (b.m ?? -1) - (a.m ?? -1) || b.p - a.p);
      return `<section class="ig-card ig-card--flush sh-col"><div class="sh-col__head">${zoneChip(z)}<b>${list.length}</b><span>${z === '안정' ? '70% 이상' : z === '적정' ? '40~70%' : '15~40%'}</span></div>
        <div class="sh-col__list" tabindex="0" aria-label="${z} 학교 목록 ${list.length}개">${list.length ? list.map(card).join('') : `<div class="ig-empty">${icon('school', '')}<p>${P.total == null ? '점수를 넣으면 나옵니다' : '해당 학부 없음'}</p></div>`}</div></section>`;
    }).join('');
    const rb = document.getElementById('refbox');
    if (rb) rb.innerHTML = filt.weak && ref.length && P.total != null ? `<section class="ig-card ig-card--flush sh-ref"><div class="sh-col__head"><span class="ig-tag-nonscore">참고용</span><b>${ref.length}</b><span>자료가 적거나 점수로 잘 안 갈리는 학부 — 합격 가능성 구간으로 나누지 않고 참고만 하세요</span></div><div class="sh-ref__list" tabindex="0" aria-label="참고용 학부 목록 ${ref.length}개">${ref.sort((a, b) => (b.m ?? -1) - (a.m ?? -1) || b.p - a.p).map(card).join('')}</div></section>` : '';
    (rb || cols).querySelectorAll('[data-add]').forEach(b => b.onclick = () => toggleCmp(b.dataset.add, () => drawRec(P)));
    cols.querySelectorAll('[data-add]').forEach(b => b.onclick = () => toggleCmp(b.dataset.add, () => drawRec(P)));
  }
  /* 세 구간 비교: 학부마다 하한·평균·상한 점수일 때의 합격 가능성을 한 줄에 */
  function drawRecAll(P, cols) {
    const Qs = [-1, 0, 1].map(k => scenarioPred(P, k)), q = filt.q.trim();
    const rows = C.units.filter(u => (u.k === S.kind || u.k === '일본어만') && (!q || (u.s + u.f + (koName(u) || '')).includes(q)))
      .map(u => ({ u, rs: Qs.map(Q => evalUnit(u, Q)) })).filter(x => x.rs.every(Boolean) && x.rs.some(r => r.z));
    const main = rows.filter(x => !x.rs[1].weak).sort((a, b) => b.rs[1].p - a.rs[1].p || b.rs[2].p - a.rs[2].p);
    document.getElementById('recmeta').textContent = `${S.kind} · 세 구간 비교 · ${main.length}개 학부 · 참고용 ${rows.length - main.length}개 제외 · 15% 미만은 숨김`;
    const cell = r => `<td><b class="ig-num">${pct(r.p)}</b> ${zoneChip(r.z)}</td>`;
    cols.innerHTML = `<section class="ig-card ig-card--flush" style="grid-column:1/-1"><div class="ig-table-wrap" style="max-height:640px;overflow:auto"><table class="ig-table ig-table--sticky">
      <thead><tr><th>학교 · 학부</th>${[['하한', 0], ['평균', 1], ['상한', 2]].map(([l, i]) => `<th>${l} <span class="ig-muted">${Math.round(Qs[i].total)}점</span></th>`).join('')}<th></th></tr></thead>
      <tbody>${main.map(x => `<tr><td><a class="sh-schoollink" href="${SH.hrefSchool ? SH.hrefSchool(x.u.s, x.u.f) : '#curve'}">${school(x.u)}</a></td>${x.rs.map(cell).join('')}<td>${addBtn(ukey(x.u), cmp.includes(ukey(x.u)))}</td></tr>`).join('') || `<tr><td colspan="5"><div class="ig-empty"><p>해당 학부 없음</p></div></td></tr>`}</tbody></table></div></section>`;
    const rb = document.getElementById('refbox'); if (rb) rb.innerHTML = '';
    cols.querySelectorAll('[data-add]').forEach(b => b.onclick = () => toggleCmp(b.dataset.add, () => drawRec(P)));
  }
  function card(r) {
    const u = r.u, k = ukey(u), inC = cmp.includes(k), yk = yokoFor(u);
    return `<article class="sh-rec${r.weak ? ' sh-rec--ref' : ''}">
      <div class="sh-rec__top"><a class="sh-schoollink" href="${SH.hrefSchool ? SH.hrefSchool(u.s, u.f) : '#curve'}">${school(u)}</a>${addBtn(k, inC)}</div>
      <div class="ig-chance ig-chance--${ZK[r.z]}"><span class="ig-chance__bar"><i style="width:${Math.round(r.p * 100)}%"></i></span><span class="ig-chance__pct">${pct(r.p)}</span></div>
      <div class="sh-rec__meta"><span>반반 ${r.m ?? '—'}점</span><span>· ${SETLAB[u.set]} ${r.x}점</span>
        ${r.weak ? weakTag(u) : ''}${u.k === '일본어만' ? '<span class="ig-tag-nonscore">일본어만 지원자 기준</span>' : ''}${yk ? `<a class="ig-src" href="${yk.link}">모집요강</a>` : ''}
        <a href="#curve/${encodeURIComponent(k)}" class="ig-src">합격 곡선</a><a href="${SH.hrefSchool ? SH.hrefSchool(u.s, u.f) : '#curve'}" class="ig-src">합격생 점수대</a></div>
    </article>`;
  }
  const addBtn = (k, inC, id) => `<button type="button" class="ig-btn ig-btn--sm ${inC ? 'sh-on' : ''}" ${id ? `id="${id}"` : `data-add="${esc(k)}"`} aria-pressed="${inC}" ${inC ? 'title="다시 누르면 비교에서 뺍니다"' : ''}>${icon(inC ? 'check' : 'plus')}${inC ? '담음' : '비교에 담기'}</button>`;
  function toggleCmp(k, after) {
    const on = cmp.includes(k);
    if (!on && cmp.length >= 4) { IG.toast('비교는 4곳까지 담을 수 있어요', { tone: 'error' }); return; }
    setCmp(on ? cmp.filter(x => x !== k) : [...cmp, k]); if (after) after();
    if (!on) IG.toast(`비교에 담았습니다 (${cmp.length}/4)`, { action: '비교 보기', onAction: () => go('cmp') });
  }

  /* 비교 항목 → 합격 데이터의 학교·학부 */
  function schOf(it) { return it.sch || (it.u ? { u: it.u.s, f: it.u.f, kind: it.u.k } : { u: it.y.doc.univ.ja, f: (it.y.unit.fac_ja || '').replace(/学部$/, ''), kind: S.kind }); }
  function schEval(it) {
    if (!SH.evalFac || !SH.UNIV) return null;
    const s = schOf(it), uo = SH.UNIV.get(s.u); if (!uo) return null;
    const fo = uo.fac.find(x => x.f === s.f) || uo.fac.find(x => s.f && (x.f.startsWith(s.f) || s.f.startsWith(x.f))); if (!fo) return null;
    return SH.evalFac(uo, fo, s.kind === '일본어만' ? s.kind : S.kind, 'r', SH.student());
  }

  /* ---------- 탭 2: 비교 ---------- */
  function viewCmp() {
    const P = predict();
    const items = cmp.map(cmpItem).filter(Boolean).map(it => ({ ...it, r: it.u ? evalUnit(it.u, P) : null }));
    const desc = `${esc(S.name)} · ${S.kind} · ${P.total != null ? `${TGT_LABEL[P.target].replace(' 점수', '')} ${Math.round(P.total)}점` : '예측 없음'}`;
    if (!items.length) {
      app.innerHTML = pagehead('진학 상담 · 비교', '학교 비교', desc) + `<div class="ig-card ig-empty">${icon('school', '')}<b>아직 담은 학교가 없어요</b><p>「예측·추천」의 학교마다 있는 「비교에 담기」를 누르면 최대 4곳까지 여기 나란히 보입니다.</p><button type="button" class="ig-btn ig-btn--primary" id="go">${icon('trend')}예측·추천으로 가기</button></div>`;
      document.getElementById('go').onclick = () => go('pred'); return;
    }
    const row = (label, f) => `<tr><td>${label}</td>${items.map(it => `<td>${f(it)}</td>`).join('')}</tr>`;
    const grp = (t, sub) => `<tr class="ig-table__group"><td colspan="${items.length + 1}">${t}${sub ? `<span class="ig-muted">${sub}</span>` : ''}</td></tr>`;
    const none = '<span class="ig-muted">—</span>';
    const yrow = (label, f) => row(label, it => it.y ? f(it.y) : none);
    const sch = (y, k) => y.tr.schedule.filter(s => s.k === k);
    const ejuTags = y => `<div class="ig-eju">${[['jp', '일본어'], ['ki', '기술'], ['so', '종합'], ['m1', '수학1'], ['m2', '수학2'], ['ri', '이과']]
      .filter(([k]) => ['R', 'C'].includes(y.unit.eju[k])).map(([k, l]) => `<span class="${y.unit.eju[k] === 'R' ? 'r' : 'c'}">${l}${y.unit.eju[k] === 'C' ? ' (선택)' : ''}</span>`).join('')}</div>`;
    app.innerHTML = `
      ${pagehead('진학 상담 · 비교', '학교 비교', desc)}
      <section class="ig-card ig-card--flush">
        <div class="ig-table-wrap"><table class="ig-table ig-table--sticky sh-cmp">
          <thead><tr><th scope="col">항목</th>${items.map(it => `<th scope="col">${it.u ? school(it.u) : it.y ? yokoSchool(it.y) : SH.schoolHtml(it.sch.u, it.sch.f)}${SH.hrefSchool ? `<a class="ig-src" href="${SH.hrefSchool(schOf(it).u, schOf(it).f)}">학교 상세</a>` : ''}${it.y ? `<span class="sh-sub">${esc(it.y.tr.name_ko)}</span>` : ''}
            <div class="sh-cmp__act">${it.y ? `<a class="ig-btn ig-btn--sm" href="${it.y.link}">${icon('book')}모집요강 보기</a>` : ''}<button type="button" class="ig-btn ig-btn--sm ig-btn--ghost" data-rm="${esc(it.k)}">${icon('x')}빼기</button></div></th>`).join('')}</tr></thead>
          <tbody>
            ${grp('합격 가능성', '과거 비슷한 점수 지원자 기준')}
            ${row('지금 예측으로', it => !it.u ? '<span class="ig-zone ig-zone--ref">참고</span><span class="sh-sub">합격 곡선 없음 (지원자 데이터 부족)</span>' : it.r ? `<span class="sh-big">${pct(it.r.p)}</span>${zoneChip(it.r.z)}` : '<span class="ig-muted">이 학부가 보는 과목 점수가 없음</span>')}
            ${row('반반 점수', it => it.u ? `<b>${p50(it.u) != null ? p50(it.u) + '점' : '만점 넘음'}</b><span class="sh-sub">${SETLAB[it.u.set]} · ${it.u.r === '최고' ? '6·11월 중 높은 점수' : it.u.r}</span>` : none)}
            ${row('학생 비교 점수', it => it.r ? `${it.r.x}점` : none)}
            ${row('최근 5년 데이터', it => it.u ? `${it.u.n}명 지원 · ${it.u.p}명 합격${weak(it.u) ? ' ' + weakTag(it.u) : ''}` : none)}
            ${grp('합격생 점수대', '최근 5년 · 실제 합격자 EJU (점 = 학생)')}
            ${row('합격자 점수대', it => { const r = schEval(it); return r && r.q ? `${SH.rangeBar(r.q, r.x != null ? Math.round(r.x) : null, r.set, true)}<span class="sh-sub">${SETLAB[r.set]} · 합격 ${r.st.ps} / 지원 ${r.st.ap}</span>` : none; })}
            ${row('내 위치', it => { const r = schEval(it); return r && r.v ? `<span class="ig-badge ${r.v.cls ? 'ig-badge--' + r.v.cls : ''}">${r.v.t}</span>` : none; })}
            ${grp('모집요강 2027', '모집요강 탭에서 정리한 내용')}
            ${row('전형', it => it.y ? `<b>${esc(it.y.tr.name_ko)}</b><span class="sh-sub">${esc(it.y.tr.kind)}${it.y.unit.dept ? ' · ' + esc(it.y.unit.dept) : ''}</span>` : '<span class="ig-verify">모집요강 미등록</span><span class="sh-sub">모집요강 탭에 아직 없음</span>')}
            ${yrow('출원', y => `<div class="sh-lines">${sch(y, 'apply').map(s => `<div>${range(s)} ${s.time ? `<b>${esc(s.time)}</b>` : ''} ${dday(s)}${src(y, s.p)}</div>`).join('')}</div>`)}
            ${yrow('시험·면접', y => `<div class="sh-lines">${sch(y, 'exam').map(s => `<div>${fmt(s.start)} ${esc(s.label)}${src(y, s.p)}</div>`).join('') || '서류만'}</div>`)}
            ${yrow('최종 발표', y => sch(y, 'result').map(s => fmt(s.start) + src(y, s.p)).join('') || none)}
            ${yrow('입학 수속', y => sch(y, 'enroll').map(s => range(s) + src(y, s.p)).join('') || none)}
            ${yrow('EJU 과목', y => ejuTags(y))}
            ${yrow('EJU 기준', y => esc(y.unit.eju.combo || (y.unit.eju.jp_min ? `일본어 ${y.unit.eju.jp_min}점 이상` : '공개 기준 없음')))}
            ${yrow('합격자 점수', y => y.unit.score ? esc(y.unit.score) : '<span class="ig-muted">공개 안 함</span>')}
            ${yrow('영어', y => y.unit.en === 'N' ? '불필요' : `${esc(y.tr.english.tests)}<span class="sh-sub">${esc(y.tr.english.min)}</span>${src(y, y.tr.english.p)}`)}
            ${yrow('모집 인원', y => esc(y.unit.quota))}
            ${yrow('검정료', y => `<span class="ig-num">${yen(y.tr.fees.exam)}</span>${src(y, y.tr.fees.p)}`)}
            ${yrow('서류', y => `<span class="ig-req ig-req--must">필수</span> ${y.tr.documents.filter(d => d.req === '필수').length}개 · 해당자 ${y.tr.documents.filter(d => d.req !== '필수').length}개`)}
            ${yrow('한국 학생 주의', y => y.tr.cautions.filter(c => c.kr).map(c => `<p class="ig-krnote"><b>한국 학생</b>${esc(c.t)}</p>`).join('') || none)}
          </tbody></table></div>
      </section>
      <section>
        <div class="ig-section-h"><h2>합친 일정</h2><span class="ig-muted sh-sec-meta">담은 학교의 모집요강 일정을 날짜순으로 · 오늘 ${fmt(ISO)}</span></div>
        <div id="tl"></div>
      </section>
      ${DISC}`;
    app.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { setCmp(cmp.filter(k => k !== b.dataset.rm)); viewCmp(); });

    // 합친 일정 + 충돌 경고 (같은 학교의 여러 학부는 한 줄로 묶음)
    const ev = [], seen = {};
    items.filter(it => it.y).forEach(it => it.y.tr.schedule.forEach(s => {
      const key = it.y.doc.id + '|' + s.k + '|' + s.start + '|' + s.label;
      const fl = it.u ? it.u.f : (it.y.unit.fac_ja || it.y.unit.fac);
      if (seen[key]) { seen[key].facs.push(fl); return; }
      ev.push(seen[key] = { doc: it.y.doc, s, facs: [fl] });
    }));
    ev.sort((a, b) => a.s.start.localeCompare(b.s.start));
    const uk = d => KO.univ[d.univ.ja] || d.univ.ko;
    const results = ev.filter(e => e.s.k === 'result');
    const warn = e => {
      if (e.s.k === 'enroll') {
        const end = e.s.end || e.s.start, later = results.filter(r => r.doc !== e.doc && r.s.start > end);
        if (later.length) return `${later.map(r => esc(uk(r.doc)) + ' 최종 발표(' + md(r.s.start) + ')').join(', ')}보다 먼저 끝남 → 입학금을 낼지 미리 결정`;
      }
      if (e.s.k === 'exam' && ev.some(o => o !== e && o.doc !== e.doc && o.s.k === 'exam' && o.s.start === e.s.start)) return '같은 날 다른 학교 시험';
      return '';
    };
    const dup = [...new Set(items.filter(it => it.y).map(it => it.y.doc))].filter(d => items.filter(it => it.y && it.y.doc === d).length > 1);
    const dupNotes = dup.map(d => { const c = d.tracks[0].cautions.find(c => /병원|併願/.test(c.t)); return c ? `${esc(uk(d))}: ${esc(c.t)} — 담은 학부 중 하나만 지원할 수 있어요` : ''; }).filter(Boolean);
    const warns = ev.map(e => ({ e, w: warn(e) })).filter(x => x.w);
    const alerts = dupNotes.concat(warns.map(x => `${esc(uk(x.e.doc))} ${esc(x.e.s.label)} (${md(x.e.s.start)}): ${x.w}`));
    const nextIdx = ev.findIndex(e => (e.s.end || e.s.start) >= ISO);
    document.getElementById('tl').innerHTML = !ev.length
      ? `<div class="ig-card ig-empty">${icon('calendar', '')}<b>모집요강이 등록된 학교가 없어요</b><p>데모에는 호세이·도쿄대·히토쓰바시 모집요강만 있습니다.</p></div>`
      : `<div class="ig-grid" style="gap:12px">${alerts.length ? `<div class="ig-card sh-alert"><span class="ig-ring" aria-hidden="true"></span><div><b>자동 경고 ${alerts.length}건</b><ul>${alerts.map(a => `<li>${a}</li>`).join('')}</ul></div></div>` : ''}
        <div class="ig-card"><ol class="ig-tl">${ev.map((e, i) => {
          const w = warn(e), past = (e.s.end || e.s.start) < ISO, multi = e.s.end && e.s.end !== e.s.start;
          return `<li class="${past ? 'is-past' : ''} ${i === nextIdx ? 'is-next' : ''} ${w ? 'is-warn' : ''}">
            <div class="ig-tl__date">${md(e.s.start)}<small>(${WD[parse(e.s.start).getDay()]})${multi ? ` ~ ${md(e.s.end)}` : ''}</small></div><span class="ig-tl__dot"></span>
            <div class="ig-tl__what"><b>${esc(uk(e.doc))} · ${esc(e.s.label)}</b><span><span class="ig-jp" lang="ja">${e.facs.map(esc).join('・')}</span>${e.s.time ? ' · ' + esc(e.s.time) : ''}${e.s.note ? ' · ' + esc(e.s.note) : ''}</span>
              <div>${dday(e.s)}</div>${w ? `<div class="sh-warn"><span class="ig-ring ig-ring--sm" aria-hidden="true"></span>${w}</div>` : ''}</div></li>`;
        }).join('')}</ol></div></div>`;
  }

  /* ---------- 탭 3: 학부 곡선 ---------- */
  function viewCurve(parts) {
    if (parts && parts[0]) { const i = C.units.findIndex(u => ukey(u) === decodeURIComponent(parts[0])); if (i >= 0) sel = i; }
    if (sel == null) sel = Math.max(0, C.units.findIndex(u => u.s === '法政大学' && u.f === '経済'));
    app.innerHTML = pagehead('진학 상담 · 학부 곡선', '점수별 합격 가능성', `최근 5년 지원자 ${C.units.length}개 학부 곡선 (${C.years[0]}~${C.years[1]}) · 올해 수준으로 보정`) + `
      <div class="sh-curve">
        <aside class="ig-card"><label class="ig-field"><span class="ig-field__label">학부 찾기</span><span class="ig-field__control">${icon('search', '')}<input class="ig-input" type="search" id="cq" placeholder="예: 호세이, 法政, 経済" value="${esc(store.get('cq', ''))}"></span></label><div class="sh-list" id="clist"></div></aside>
        <section class="ig-card" id="cview"></section>
      </div>`;
    const cq = document.getElementById('cq'); cq.oninput = () => { store.set('cq', cq.value); drawList(); }; drawList(); drawCurve();
  }
  function drawList() {
    const q = document.getElementById('cq').value.trim();
    document.getElementById('clist').innerHTML = C.units.map((u, i) => [u, i]).filter(([u]) => !q || (u.s + u.f + (koName(u) || '')).includes(q))
      .map(([u, i]) => `<button type="button" data-i="${i}" aria-current="${i === sel}">${school(u)}<small>${u.k}</small></button>`).join('') || '<p class="ig-muted" style="padding:8px 12px">없음</p>';
    document.querySelectorAll('#clist button').forEach(a => a.onclick = () => { sel = +a.dataset.i; drawList(); drawCurve(); });
    const cur = document.querySelector('#clist [aria-current="true"]'); if (cur && !q) { const L = document.getElementById('clist'); L.scrollTop = cur.offsetTop - L.offsetTop - 8; }
  }
  /* 곡선 그래프의 가로 범위와 학생 점수·오차 (곡선 화면과 상담 리포트 공용) */
  function curveRange(u, P) {
    const x = setScore(P, u.set), sd = setSd(P, u.set);
    const xs = u.bins.map(b => b[0]).concat(x != null ? [x - sd, x + sd] : []);
    return { x, sd, lo: Math.max(0, Math.floor((Math.min(...xs) - 40) / 50) * 50), hi: Math.min(u.max, Math.ceil((Math.max(...xs) + 40) / 50) * 50) };
  }
  function drawCurve() {
    const u = C.units[sel], P = predict(), yk = yokoFor(u), m = p50(u), k = ukey(u);
    const { x, sd, lo, hi } = curveRange(u, P);
    const r = x != null ? evalUnit(u, P) : null;
    document.getElementById('cview').innerHTML = `
      <div class="ig-card__head"><div>${school(u)}<p class="ig-card__sub" style="margin-top:6px">${u.k} · 비교 점수 = ${SETLAB[u.set]} (${u.max}점 만점) · ${u.r === '최고' ? '6월·11월 중 높은 점수' : u.r + ' 점수'}</p></div>
        <div class="ig-card__actions">${weak(u) ? weakTag(u) : ''}${r ? zoneChip(r.z) : ''}${yk ? `<a class="ig-btn ig-btn--sm" href="${yk.link}">${icon('book')}모집요강 보기</a>` : ''}${addBtn(k, cmp.includes(k), 'cadd')}</div></div>
      <div class="ig-chart" id="cv"></div>
      <ul class="ig-legend"><li><i></i>합격 가능성 곡선 (올해 수준 보정)</li><li><i class="bin"></i>20점 구간 실제 합격 비율 · 원 크기 = 인원</li><li><i class="range"></i>${esc(S.name)} 예측 범위</li></ul>
      <dl class="ig-kv" style="margin-top:16px"><div><dt>학습 인원 (합격)</dt><dd>${u.n}명 (${u.p}명)</dd></div><div><dt>최근 2년</dt><dd>${u.recent}명</dd></div><div><dt>반반 점수</dt><dd>${m != null ? m + '점' : '만점 넘음'}</dd></div><div><dt>구별력 (AUC)</dt><dd>${u.auc.toFixed(2)}<small>${u.auc < MIN_AUC ? '점수만으로 잘 갈리지 않음' : '점수로 잘 갈림'}</small></dd></div></dl>
      <details class="sh-how" open><summary>이 곡선은 어떻게 만들었나요?</summary><ol>
        <li><b>재료</b> — 최근 5년(${C.years[0]}~${C.years[1]}) 이 학부 ${u.k} 지원자 ${u.n}명의 EJU 점수와 합격·불합격. 과목은 ${SETLAB[u.set]} (기술 제외), 회차는 ${u.r === '최고' ? '6월·11월 중 높은 쪽' : u.r}. 이 조합이 합격·불합격을 가장 잘 가르는 것(AUC)이라 자동으로 골랐어요.</li>
        <li><b>점</b> — 20점 구간마다 실제로 합격한 비율. 원이 클수록 그 구간 지원자가 많아요.</li>
        <li><b>선</b> — 점들을 가장 잘 지나는 S자 곡선(로지스틱 회귀): 합격 확률 = 1 / (1 + e<sup>−(a + b×점수)</sup>). 최근 해일수록 가중치를 크게(1·0.7·0.5·0.35·0.25) 줬어요.</li>
        <li><b>올해 보정</b> — 같은 점수의 합격률이 해마다 조금씩 떨어져서, 가장 최근 해 수준에 맞춰 곡선을 오른쪽으로 옮겼어요 (이 학부에서는 약 ${Math.round(Math.abs(C.shift) / u.b)}점).</li>
        <li><b>학생 위치</b> — 예측 점수 하나가 아니라 예측 범위(±오차) 전체에서 합격 확률을 평균 내요. 그래서 곡선 위 값과 조금 다를 수 있어요.</li>
        <li><b>믿을 만한가</b> — 2026년을 모르는 상태로 계산해 맞춰 보니 안정 74% · 적정 52% · 도전 30%가 실제로 합격했어요. <a href="#how">계산 방법 자세히</a></li></ol></details>
      <div style="margin-top:12px">${DISC}</div>`;
    IG.passCurve(document.getElementById('cv'), { lo, hi, a: u.a, b: u.b, shift: C.shift, bins: u.bins,
      you: x != null ? { score: Math.round(x), lo: Math.max(lo, Math.round(x - sd)), hi: Math.min(hi, Math.round(x + sd)), p: pAt(u, x, sd) } : null,
      label: `${koName(u) || u.s + ' ' + u.f} 합격 가능성 곡선. 반반 점수 ${m ?? '만점 넘음'}${x != null ? `, 학생 예상 ${Math.round(x)}점에서 ${pct(pAt(u, x, sd))}` : ''}` });
    document.getElementById('cadd').onclick = () => toggleCmp(k, drawCurve);
  }

  /* ---------- 상담 리포트: 모의고사 예측·추천 + 합격 곡선을 A4 한 장으로 (인쇄 창에서 「PDF로 저장」) ---------- */
  const RPT_PER_ZONE = 3, RPT_CURVES = 4;
  function viewReport() {
    const P = predict();
    if (P.total == null) {
      app.innerHTML = pagehead('진학 상담 · 상담 리포트', esc(S.name), '') + `<div class="ig-card ig-empty">${icon('trend', '')}<b>아직 예측할 수 없어요</b><p>모의고사나 EJU 점수를 넣으면 리포트를 만들 수 있어요.</p><a class="ig-btn ig-btn--primary" href="#pred">예측·추천으로 가기</a></div>`;
      return;
    }
    const [lo, hi] = predRange(P), isAct = P.target === 'a11';
    // 예측이 범위(±오차)면 하한·평균·상한 세 구간, 실제 점수면 한 구간
    const kindUnits = C.units.filter(u => u.k === S.kind || u.k === '일본어만');
    const scenOf = Q => { const rs = kindUnits.map(u => evalUnit(u, Q)).filter(r => r && r.z), main = rs.filter(r => !r.weak);
      return { Q, nref: rs.length - main.length, lists: Object.fromEntries(ZONES.map(([z]) => [z, main.filter(r => r.z === z).sort((a, b) => (b.m ?? -1) - (a.m ?? -1) || b.p - a.p)])) }; };
    const scens = (P.sd ? [[-1, '하한'], [0, '평균'], [1, '상한']] : [[0, '실제']]).map(([k, l]) => ({ l, ...scenOf(scenarioPred(P, k)) }));
    const mid = scens.find(x => x.l === '평균' || x.l === '실제'), lists = mid.lists, nref = mid.nref;
    // 곡선을 보여 줄 학교: 비교에 담은 학교(곡선 있는 것) 우선, 없으면 적정 2 · 도전 1 · 안정 1 순으로 고름
    const fromCmp = cmp.map(cmpItem).filter(it => it && it.u).map(it => evalUnit(it.u, P)).filter(Boolean).slice(0, RPT_CURVES);
    let picks = fromCmp;
    if (!picks.length) {
      const q = { 적정: lists.적정.slice(), 도전: lists.도전.slice(), 안정: lists.안정.slice() };
      picks = [...q.적정.splice(0, 2), ...q.도전.splice(0, 1), ...q.안정.splice(0, 1)];
      for (const z of ['적정', '도전', '안정']) while (picks.length < RPT_CURVES && q[z].length) picks.push(q[z].shift());
    }
    const sdOf = s => P.sd ? P.sd * (SUBJ_SD[s] || 10) / Math.sqrt(P.fullVar) : 0;
    const subRow = s => { const v = P.subj[s]; if (!v) return `<tr><td>${SUBJ[s]}</td><td class="num">—</td><td class="num">—</td></tr>`; const d = sdOf(s);
      return `<tr><td>${SUBJ[s]} <span class="sh-rpt-mute">/${MAXS[s]}</span></td><td class="num"><b>${Math.round(v.fin)}</b></td><td class="num">${d ? `${Math.max(0, Math.round(v.fin - d))}~${Math.min(REALMAX[s] || MAXS[s], Math.round(v.fin + d))}` : '실제'}</td></tr>`; };
    const scnCol = x => `<div><div class="sh-rpt-sh"><b>${x.l}</b><span>${Math.round(x.Q.total)}점</span></div><table class="sh-rpt-tb"><tbody>${ZONES.map(([z]) => `<tr class="zh"><td colspan="2">${zoneChip(z)}</td></tr>`
      + (x.lists[z].slice(0, RPT_PER_ZONE).map(r => `<tr><td class="nm">${esc(koName(r.u) || r.u.s + ' ' + r.u.f)}</td><td class="num"><b>${pct(r.p)}</b></td></tr>`).join('') || '<tr><td colspan="2" class="sh-rpt-mute">해당 학부 없음</td></tr>')).join('')}</tbody></table></div>`;
    const trend = trendOpts(P, lo, hi, true);
    const dateTxt = `${TODAY.getFullYear()}년 ${md(ISO)}`;
    app.innerHTML = `
      <div class="ig-noprint sh-rpt-bar"><div><b>상담 리포트</b> <span class="ig-muted">A4 한 장 · 인쇄 창에서 「대상: PDF로 저장」을 고르세요</span></div>
        <div class="sh-row"><a class="ig-btn" href="#pred">${icon('trend')}예측·추천으로</a><button type="button" class="ig-btn ig-btn--primary" id="rprint">${icon('file')}PDF로 저장</button></div></div>
      <div class="ig-sheet-wrap"><article class="ig-sheet sh-rpt">
        <div class="ig-sheet__head"><div><h1>상담 리포트 · ${esc(S.name)}</h1><div class="sh-rpt-mute">${dateTxt} · ${S.kind}${S.campus ? ' · ' + esc(S.campus) : ''} · ${TGT_LABEL[P.target].replace(' 점수', '')}</div></div><img class="ig-logo--light" src="../design/assets/ilgong-logo.png" alt="일공학원"></div>
        <section><h2>1. 성적 추이와 다음 EJU 예측</h2>
          <div class="sh-rpt-two"><div class="ig-chart" id="rtrend"></div>
            <div><div class="sh-rpt-total"><span class="sh-rpt-mute">${isAct ? '11월 EJU 총점' : '예상 총점'} (기술 제외)</span><b>${Math.round(P.total)}</b><span>${isAct ? '점 · 실제' : `점 · 보통 ${lo}~${hi}`}</span></div>
              <table><thead><tr><th>과목</th><th class="num">${isAct ? '점수' : '예상'}</th><th class="num">${isAct ? '' : '보통 범위'}</th></tr></thead><tbody>${parts().map(subRow).join('')}</tbody></table></div></div></section>
        <section><h2>2. 추천 학교 <span class="sh-rpt-mute">${P.sd ? '예측 점수의 하한·평균·상한마다 · ' : ''}합격 가능성 = 과거 비슷한 점수 지원자 중 합격한 비율</span></h2>
          <div class="sh-rpt-scn" style="grid-template-columns:repeat(${scens.length},1fr)">${scens.map(scnCol).join('')}</div></section>
        <section><h2>3. 합격 곡선 <span class="sh-rpt-mute">${fromCmp.length ? '비교에 담은 학교' : '추천 학교 가운데 상담할 만한 곳'} · 점 = 실제 합격 비율 · 세로선 = 학생 예측</span></h2>
          <div class="sh-rpt-curves">${picks.length ? picks.map((r, i) => `<div><div class="sh-rpt-ct">${school(r.u)}<span>${zoneChip(r.z)} <b>${pct(r.p)}</b></span></div><div class="ig-chart" id="rc${i}"></div></div>`).join('') : '<p class="sh-rpt-mute">곡선이 있는 추천 학교가 없습니다.</p>'}</div></section>
        <div class="ig-sheet__foot">참고용 · 합격을 보장하지 않음 · 최종 판단은 상담 강사와 함께 합니다. 예측 점수는 범위로 보며, 합격 가능성은 과거 비슷한 점수 지원자 중 합격한 비율입니다.${nref ? ` 점수만으로 잘 갈리지 않거나 자료가 적은 ${nref}개 학부는 이 표에서 뺐습니다.` : ''} 학원 내부 자료 · 외부 반출 금지.</div>
      </article></div>`;
    const tc = document.getElementById('rtrend');
    if (trend) IG.trendChart(tc, { ...trend, labels: EXAMS.map(e => e.tiny), width: 400, height: 150 }); else tc.innerHTML = '';
    picks.forEach((r, i) => { const u = r.u, c = curveRange(u, P), m = p50(u);
      IG.passCurve(document.getElementById('rc' + i), { lo: c.lo, hi: c.hi, a: u.a, b: u.b, shift: C.shift, bins: u.bins, width: 340, height: 135, xstep: 100,
        you: c.x != null ? { score: Math.round(c.x), lo: Math.max(c.lo, Math.round(c.x - c.sd)), hi: Math.min(c.hi, Math.round(c.x + c.sd)), p: pAt(u, c.x, c.sd) } : null,
        label: `${koName(u) || u.s + ' ' + u.f} 합격 가능성 곡선. 반반 점수 ${m ?? '만점 넘음'}` }); });
    document.getElementById('rprint').onclick = () => {
      const old = document.title; document.title = `상담리포트_${S.name}_${ISO}`;   // 크롬은 이 제목을 PDF 파일 이름으로 쓴다
      window.addEventListener('afterprint', () => { document.title = old; }, { once: true }); window.print();
    };
  }

  /* ---------- 탭 5: 검증 ---------- */
  function viewHow() {
    const z = [['안정', '70%+', '67%', '74%'], ['적정', '40~70%', '42%', '52%'], ['도전', '15~40%', '22%', '30%'], [null, '15% 미만', '6%', '10%']];
    app.innerHTML = pagehead('진학 상담 · 계산 방법', '어떻게 계산하고, 얼마나 맞나', '자세한 설명은 레포의 「계산방법_원장님설명.md」 · 여기는 요약과 검증 결과') + `
      <section class="ig-card sh-prose"><h3 class="ig-card__title">세 가지 기능이 쓰는 데이터</h3>
        <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>기능</th><th>원래 엑셀</th><th>계산</th></tr></thead><tbody>
          <tr><td><b>① EJU로 학교 찾기</b></td><td>EJU통합_성적분석 v8 (조회 시트)</td><td>학교·학부·계열마다 합격자의 EJU 점수 분포(최저·하위25%·중앙·상위25%·최고)를 미리 계산 → 학생 점수가 그 안 어디인지</td></tr>
          <tr><td><b>② 예측·추천</b></td><td>EJU_점수예측_분석 (모델계수 시트)</td><td>회차별 등가점수 = a + b×(점수 − 난이도보정) → 정확도 가중평균 → 11월은 상위권 보정 → 범위(±오차) → 합격 곡선으로 합격 가능성</td></tr>
          <tr><td><b>③ 모집요강</b></td><td>모집요강 PDF 9건</td><td>원문 그대로 정리(숫자·날짜는 원문만, 원문 쪽수 표시) · 한국어 번역 + 일본어 원문</td></tr>
        </tbody></table></div></section>
      <div class="ig-grid ig-grid--2">
        <section class="ig-card sh-prose"><h3 class="ig-card__title">EJU 예측</h3>
          <p>학원 엑셀 「EJU_점수예측_분석」의 모델계수를 그대로 씁니다. 엑셀이 계산한 11월 예측 1,866개(학생 481명 × 과목)와 이 화면의 계산이 소수점까지 같습니다.</p>
          <dl class="ig-kv"><div><dt>일본어 평균 오차</dt><dd>약 25점</dd></div><div><dt>종합</dt><dd>약 16점</dd></div><div><dt>수학</dt><dd>약 11점</dd></div></dl>
          <p class="sh-note">2026년 6월 실제 점수 대비</p></section>
        <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">추천 (합격 곡선)</h3><p class="ig-card__sub">2022~2025년 데이터로만 곡선을 만들고 2026년 실제 결과와 비교</p></div></div>
          <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>구간</th><th class="num">보정 전 실제</th><th class="num">보정 후 실제</th></tr></thead>
          <tbody>${z.map(r => `<tr><td>${r[0] ? zoneChip(r[0]) : '<span class="ig-badge">15% 미만</span>'} <span class="ig-muted">${r[0] ? r[1] : ''}</span></td><td class="num ig-muted">${r[2]}</td><td class="num"><b>${r[3]}</b></td></tr>`).join('')}</tbody></table></div></section>
      </div>
      <section class="ig-card sh-prose"><h3 class="ig-card__title">알아 둘 것</h3><ul>
        <li>같은 점수라도 합격률이 해마다 떨어져(문과 600~650점대 2022년 47% → 2026년 36%) 최근 해 수준으로 보정했습니다.</li>
        <li>예측 80% 이상이어도 실제는 80% 근처에서 멈춥니다. 그래서 90% 이상은 「90%+」로만 표시합니다.</li>
        <li>점수를 알려준 지원자만의 데이터라 전체 지원자와 다를 수 있습니다. 학과 차이는 학부로 묶었습니다.</li>
        <li>자세한 표: iCloud 「EJU성적/EJU_합격곡선_v1.xlsx」</li></ul></section>
      ${DISC}`;
  }

  /* ---------- 라우터 · 다른 탭과 나누는 도우미 ---------- */
  const VIEWS = { pred: viewPred, cmp: viewCmp, curve: viewCurve, how: viewHow, report: viewReport };
  function route() {
    const [path, qs] = location.hash.slice(1).split('?'); const parts = path.split('/').filter(Boolean);
    let t = parts[0] || 'home'; if (!VIEWS[t]) t = 'home';
    const prev = tab; tab = t;
    const nt = { curve: 'pred', school: 'find', report: 'pred' }[t] || t;
    document.querySelectorAll('.ig-appbar__nav a[data-t]').forEach(a => a.dataset.t === nt ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    const keep = VIEWS[t](parts.slice(1), new URLSearchParams(qs || ''));
    if (keep !== 'keep') window.scrollTo(0, 0);
  }
  function go(h) { if (location.hash.slice(1) === h) route(); else location.hash = h; }
  window.SH = { views: VIEWS, go, esc, icon, store, ISO, TODAY, parse, WD, md, fmt, range, dday, ddayOf, pct, yen, DISC, KO, Y, C, M,
    SUBJ, MAXS, ZK, zoneChip, school, koName, pagehead, sectionH, yokoFor, yokoByKey, curveFor, evalUnit, predict, examTotal,
    cmpKeyForYoko, toggleCmp, addBtn, save, engJudge, engSummary, hasStudents: !!STU, studentCount: STU ? STU.list.length : 0, bindStudentSearch, pAt, setSd, setScore, SETLAB, ukey, unitByKey, school, showCurve(i) { sel = i; go('curve'); }, get S() { return S; }, get cmp() { return cmp; }, subjects, parts };
  document.querySelectorAll('[data-t]').forEach(a => a.onclick = e => { e.preventDefault(); go(a.dataset.t); });
  window.addEventListener('hashchange', route);
  const verEl = document.getElementById('ver'); if (verEl) verEl.textContent = `${C.version || 'v1'} · ${C.units.length}개`;
  document.getElementById('foot').innerHTML = `예측 모델 ${esc(M.built)} · 합격 곡선 ${C.units.length}개 학부 (${C.years[0]}~${C.years[1]}) · 모집요강 ${Y ? Y.docs.length : 0}건${window.MOCK ? ` · 모의고사 ${window.MOCK.year}년 ${window.MOCK.rounds.length}회분` : ''} · 학생 이름·점수는 이 브라우저에만 저장되고 서버로 보내지 않습니다. 합격·모의고사 데이터는 학원 밖 공유 금지.`;
  setCmp(cmp);
  if (STU) { const band = document.querySelector('.ig-band'); if (band) { band.className = 'ig-band ig-band--dev'; band.textContent = `실제 학생 ${STU.list.length}명 성적 (${STU.built} 기준) · 접속 코드로만 열림 · 화면 공유·캡처·전달 주의`; } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route);   // 정적으로 읽을 때. lock.js로 읽을 때는 모든 view-*.js가 등록된 뒤 lock.js가 hashchange로 첫 화면을 시작한다
})();

/* ---------- 합격 곡선 호버 (디자인 시스템 passCurve를 감싸서, 그래프 위에 마우스·손가락을 올리면 값이 뜬다) ---------- */
(function () {
  const IG = window.Ilgong; if (!IG || !IG.passCurve) return;
  const base = IG.passCurve, L = 44, R = 20, T = 14, B = 32, SVGNS = 'http://www.w3.org/2000/svg';
  const sig = t => 1 / (1 + Math.exp(-t));
  const zone = p => p >= .7 ? '안정' : p >= .4 ? '적정' : p >= .15 ? '도전' : '15% 미만';
  const P = p => p < .005 ? '1% 미만' : p > .995 ? '99%+' : Math.round(p * 100) + '%';
  IG.passCurve = function (target, o) {
    const s = base.apply(this, arguments);
    target._pc = o;
    target.querySelectorAll('.bin title').forEach(t => t.remove());
    if (target._pcOn) return s;
    target._pcOn = true; target.style.position = 'relative';
    // 크기가 바뀌어 그래프가 다시 그려지면 안의 말풍선도 지워지므로 매번 확인해 다시 만든다
    const getTip = () => { let t = target.querySelector(':scope > .sh-tip'); if (!t) { t = document.createElement('div'); t.className = 'sh-tip'; t.hidden = true; t.setAttribute('aria-hidden', 'true'); target.appendChild(t); } return t; };
    const hide = () => { getTip().hidden = true; target.querySelectorAll('.sh-hov').forEach(n => n.remove()); };
    const move = e => {
      const tip = getTip();
      const svg = target.querySelector('svg'), o = target._pc; if (!svg || !o) return;
      const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, k = vb.width / r.width, W = vb.width, H = vb.height;
      const px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k;
      if (px < L - 4 || px > W - R + 4 || py < T - 4 || py > H - B + 4) return hide();
      const X = v => L + (W - L - R) * (v - o.lo) / (o.hi - o.lo), Y = p => T + (H - T - B) * (1 - p);
      const score = o.lo + (px - L) / (W - L - R) * (o.hi - o.lo), f = x => sig(o.a + o.b * x + (o.shift || 0));
      // 가장 가까운 점(원) — 원 반지름 + 여유 안에 있으면 그 구간을 보여 준다
      const mx = Math.max.apply(null, (o.bins || []).map(b => b[1]).concat([1]));
      let hit = null, best = 1e9;
      (o.bins || []).forEach(b => { const d = Math.hypot(X(b[0]) - px, Y(b[2] / b[1]) - py), rad = 3 + 7 * Math.sqrt(b[1] / mx) + 8; if (d < rad && d < best) { best = d; hit = b; } });
      target.querySelectorAll('.sh-hov').forEach(n => n.remove());
      const mk = (n, a) => { const el = document.createElementNS(SVGNS, n); el.setAttribute('class', 'sh-hov'); Object.entries(a).forEach(([q, v]) => el.setAttribute(q, v)); svg.appendChild(el); return el; };
      let html, ax, ay;
      if (hit) {
        const rate = hit[2] / hit[1], cp = f(hit[0]);
        mk('circle', { cx: X(hit[0]), cy: Y(rate), r: 3 + 7 * Math.sqrt(hit[1] / mx) + 2.5, fill: 'none', stroke: 'var(--brand)', 'stroke-width': 2 });
        html = `<b>${hit[0] - 10}~${hit[0] + 9}점</b><span>지원 ${hit[1]}명 중 <b>${hit[2]}명 합격</b></span><span>실제 합격 비율 <b>${Math.round(rate * 100)}%</b></span><span class="sh-tip__sub">곡선(올해 보정) ${P(cp)} · ${zone(cp)}</span>`;
        ax = X(hit[0]); ay = Y(rate);
      } else {
        const sc = Math.round(score), cp = f(sc);
        mk('line', { x1: X(sc), x2: X(sc), y1: T, y2: H - B, stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3' });
        mk('circle', { cx: X(sc), cy: Y(cp), r: 5, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 });
        html = `<b>${sc}점이면</b><span>합격 가능성 <b>${P(cp)}</b> · ${zone(cp)}</span><span class="sh-tip__sub">올해 수준으로 보정한 곡선 값</span>`;
        ax = X(sc); ay = Y(cp);
      }
      tip.innerHTML = html; tip.hidden = false;
      const sx = ax / k, sy = ay / k, tw = tip.offsetWidth, th = tip.offsetHeight, cw = r.width;
      tip.style.left = Math.max(4, Math.min(cw - tw - 4, sx + 14 + tw > cw ? sx - tw - 14 : sx + 14)) + 'px';
      tip.style.top = Math.max(4, sy - th - 12 < 4 ? sy + 14 : sy - th - 12) + 'px';
    };
    target.addEventListener('pointermove', move); target.addEventListener('pointerdown', move);
    target.addEventListener('pointerleave', hide);
    return s;
  };
})();
