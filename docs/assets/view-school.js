/* 진학 상담 — 홈(상담 대시보드) · ① EJU로 학교 찾기 · 학교 상세 · 통합 검색
 * 데이터: window.SCHOOLS (tools/schools_export.py — EJU통합_성적분석 v8의 「조회」 기능을 학교·학부·계열마다 미리 계산한 집계)
 *        + 합격 곡선(curves.js) + 모집요강(yoko.js) + 학교 한국어 이름(names_ko.js)
 * 주소: #home · #find · #school/<대학(일본어)>[/<학부(일본어)>] */
(function () {
  "use strict";
  const SH = window.SH, SC = window.SCHOOLS, IG = window.Ilgong;
  if (!SH) return;
  const { esc, icon, store, pagehead, KO, C, Y, ISO } = SH;
  const app = document.getElementById('app');

  /* ---------- 이름·검색 ---------- */
  const SETMAX = { J: 374, JS: 574, JSM: 774, JR: 574, JRM: 774 };   // 실제 EJU 최고점 (일본어 374)
  const AXIS = { J: [150, 400], JS: [250, 600], JSM: [300, 800], JR: [250, 600], JRM: [300, 800] };
  const SETLAB = { J: '일본어', JS: '일본어+종합', JSM: '일본어+종합+수학1', JR: '일본어+이과2', JRM: '일본어+이과2+수학2' };
  const ORDER = { 문과: ['JSM', 'JS', 'J'], 이과: ['JRM', 'JR', 'J'], 일본어만: ['J'] };
  const PERLAB = () => SC ? { r: `최근 5년 (${SC.years.r[0]}~${SC.years.r[1]})`, a: `전체 (${SC.years.a[0]}~${SC.years.a[1]})` } : {};
  const UNIV = new Map((SC ? SC.univ : []).map(u => [u.u, u]));
  const ALIAS = KO.alias || {};
  const nameU = u => KO.univ[u] || u;
  const nameF = f => KO.fac[f] || f;
  const hrefSchool = (u, f) => '#school/' + encodeURIComponent(u) + (f ? '/' + encodeURIComponent(f) : '');
  const schoolHtml = (u, f, link) => {
    const inner = `<b>${esc(nameU(u))}${f ? ' ' + esc(nameF(f)) : ''}</b><span class="ig-jp" lang="ja">${esc(u)}${f ? ' ' + esc(f) : ''}</span>`;
    return link ? `<a class="ig-school sh-schoollink" href="${hrefSchool(u, f)}">${inner}</a>` : `<div class="ig-school">${inner}</div>`;
  };
  const norm = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[\s·・()（）\-_.]/g, '');
  const strip = s => norm(s).replace(/(대학교|대학|大学|학부|学部)$/, '');
  const IDX = [];
  (() => {
    const seen = new Set();
    const addU = (u, n, type) => {
      if (seen.has(u)) return; seen.add(u);
      const keys = [norm(u), strip(u), norm(nameU(u)), strip(nameU(u)), ...(ALIAS[u] || []).map(norm)].filter(Boolean);
      IDX.push({ t: 'u', u, n: n || 0, type, keys });
    };
    (SC ? SC.univ : []).forEach(u => { addU(u.u, u.n, u.type); u.fac.forEach(f => IDX.push({ t: 'f', u: u.u, f: f.f, n: f.n, fkeys: [norm(f.f), strip(nameF(f.f)), norm(nameF(f.f))] })); });
    C.units.forEach(c => addU(c.s, c.n));
    if (Y) Y.docs.forEach(d => addU(d.univ.ja, 0, d.univ.type));
    if (Y) Y.docs.forEach(d => { const e = IDX.find(x => x.t === 'u' && x.u === d.univ.ja); if (e) e.keys.push(...[d.univ.ko, ...(d.univ.aliases || [])].map(norm)); });
  })();
  const UKEYS = new Map(IDX.filter(x => x.t === 'u').map(x => [x.u, x.keys]));
  function searchSchools(q, limit = 12) {
    const toks = String(q || '').trim().split(/\s+/).map(norm).filter(Boolean);
    if (!toks.length) return [];
    const hitU = (keys, t) => keys.some(k => k.includes(t));
    const sc = (keys, t) => keys.some(k => k === t) ? 3 : keys.some(k => k.startsWith(t)) ? 2 : 1;
    const out = [];
    for (const e of IDX) {
      if (e.t === 'u') {
        if (toks.length === 1 && hitU(e.keys, toks[0])) out.push({ ...e, s: sc(e.keys, toks[0]) * 10 + Math.log10(1 + e.n) });
      } else {
        const uk = UKEYS.get(e.u) || [];
        let ok = true, s = 0, facHit = false;
        for (const t of toks) {
          if (hitU(e.fkeys, t)) { s += sc(e.fkeys, t); facHit = true; }
          else if (hitU(uk, t)) s += sc(uk, t);
          else { ok = false; break; }
        }
        if (ok && facHit && (toks.length > 1 || e.fkeys.some(k => k.startsWith(toks[0])))) out.push({ ...e, s: s * 8 + Math.log10(1 + e.n) - (toks.length === 1 ? 6 : 0) });
      }
    }
    out.sort((a, b) => b.s - a.s);
    return out.slice(0, limit);
  }
  /* 검색창 + 제안 목록 (앱 바·홈 공용) */
  function bindSearch(input, box, onPick) {
    let act = -1, hits = [];
    const run = () => {
      hits = searchSchools(input.value, 10); act = -1;
      if (!input.value.trim()) { box.innerHTML = ''; box.hidden = true; return; }
      box.hidden = false;
      box.innerHTML = hits.length ? hits.map((h, i) => `<a href="${hrefSchool(h.u, h.f)}" data-i="${i}" role="option">
          <span>${h.t === 'u' ? `<b>${esc(nameU(h.u))}</b> <span class="ig-jp ig-muted" lang="ja">${esc(h.u)}</span>` : `<b>${esc(nameU(h.u))} ${esc(nameF(h.f))}</b> <span class="ig-jp ig-muted" lang="ja">${esc(h.u)} ${esc(h.f)}</span>`}</span>
          <small>${h.t === 'u' ? (h.n ? `지원 ${h.n.toLocaleString()}명` : '모집요강') : `학부 · 지원 ${h.n.toLocaleString()}명`}</small></a>`).join('')
        : '<p class="ig-muted" style="margin:8px 12px;font-size:13px">맞는 학교가 없어요. 한국어·일본어 모두 됩니다 (예: 호세이 경제, 法政, 早稲田 商)</p>';
      box.querySelectorAll('a').forEach(a => a.onclick = () => { box.hidden = true; input.value = ''; if (onPick) onPick(); });
    };
    input.addEventListener('input', run);
    input.addEventListener('focus', run);
    input.addEventListener('keydown', e => {
      const items = [...box.querySelectorAll('a')];
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((a, i) => a.setAttribute('aria-current', i === act)); }
      if (e.key === 'Enter' && items.length) { e.preventDefault(); location.hash = items[Math.max(0, act)].getAttribute('href'); box.hidden = true; input.value = ''; input.blur(); }
      if (e.key === 'Escape') { input.value = ''; run(); input.blur(); }
    });
    document.addEventListener('click', e => { if (!box.contains(e.target) && e.target !== input) box.hidden = true; });
  }

  /* ---------- 학생 EJU 점수 ---------- */
  const val = v => v !== '' && v != null && !isNaN(+v) ? +v : null;
  function ejuSes() { const S = SH.S, has = id => Object.values(S.rows[id] || {}).some(v => val(v) != null); return store.get('findSes', null) || (has('e11') ? 'e11' : 'e6'); }
  function hasMock() { const S = SH.S; return ['m1', 'm2', 'm3', 'm4'].some(id => Object.values(S.rows[id] || {}).some(v => val(v) != null)); }
  /* 실제 EJU 점수가 비어 있는데 모의고사가 있으면(채점시트로 만든 학생은 6월·11월 EJU 점수가 없음) 모의고사 반영 예측으로 비교한다 */
  function findMode() {
    const m = store.get('findMode', null);   // 사용자가 직접 고른 값이 있으면 그대로
    if (m) return m;
    return hasMock() && !Object.values(SH.S.rows[ejuSes()] || {}).some(v => val(v) != null) ? 'pred' : 'actual';
  }
  /* mode: actual(실제 EJU) | pred(모의고사까지 넣은 예측) */
  function student() {
    const S = SH.S, mode = findMode();
    if (mode === 'pred' && hasMock()) {
      const P = SH.predict();
      if (P.total != null) return { mode, S, kind: S.kind, vec: P.vec, P, sd: P.sd, label: { e6: '6월 EJU 예측', e11: '11월 EJU 예측', a11: '11월 EJU 실제' }[P.target] };
    }
    const ses = ejuSes(), r = S.rows[ses] || {};
    const k = S.kind, sci = S.sci;
    const vec = { jp: val(r.jp), so: k === '문과' ? val(r.so) : null, m1: k === '문과' ? val(r.math) : null,
      r: k === '이과' && val(r[sci[0]]) != null && val(r[sci[1]]) != null ? val(r[sci[0]]) + val(r[sci[1]]) : null, m2: k === '이과' ? val(r.math) : null };
    return { mode: 'actual', S, kind: k, vec, P: { vec, sd: 0, fullVar: 1, total: null }, sd: 0, ses, label: ses === 'e11' ? '11월 EJU' : '6월 EJU' };
  }
  const SETP = { J: ['jp'], JS: ['jp', 'so'], JSM: ['jp', 'so', 'm1'], JR: ['jp', 'r'], JRM: ['jp', 'r', 'm2'] };
  const setScore = (vec, set) => { let t = 0; for (const c of SETP[set]) { if (vec[c] == null) return null; t += vec[c]; } return t; };

  /* 합격자 분포 안의 위치 (0=최저, .25=하위 25%, .5=중앙, .75, 1=최고) */
  function position(q, x) {
    const [, mn, q1, q2, q3, mx] = q, pts = [[mn, 0], [q1, .25], [q2, .5], [q3, .75], [mx, 1]];
    if (x <= mn) return x < mn ? -0.01 : 0; if (x >= mx) return x > mx ? 1.01 : 1;
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, pa] = pts[i - 1], [b, pb] = pts[i]; return b === a ? pb : pa + (pb - pa) * (x - a) / (b - a); }
    return 1;
  }
  function verdict(q, x) {
    if (!q || x == null) return null;
    const [, mn, q1, q2, , mx] = q;
    if (x < mn) return { k: 0, t: '합격자 최저 미만', cls: '' };
    if (x < q1) return { k: 1, t: '합격자 하위 25% 안', cls: 'warning' };
    if (x < q2) return { k: 2, t: '합격자 중간 아래', cls: 'info' };
    if (x <= mx) return { k: 3, t: '합격자 중앙값 이상', cls: 'success' };
    return { k: 4, t: '합격자 최고 이상', cls: 'success' };
  }
  const vBadge = v => v ? `<span class="ig-badge ${v.cls ? 'ig-badge--' + v.cls : ''}">${v.t}</span>` : '<span class="ig-muted">—</span>';
  const curveOf = (u, f, kind) => C.units.find(c => c.s === u && c.f === f && c.k === kind) || null;

  /* 학교 찾기 표의 「영어 성적」 칸: 모집요강(정리된 것)에서 이 학부가 요구하는 영어 시험 */
  /* 같은 학부 안에서 학과마다 영어 요건이 다르면 학과별로 묶어 보여 준다 (학부 표에 첫 학과 기준만 나오지 않게) */
  function enDepts(y) {
    const groups = new Map();
    y.tr.units.filter(x => x.fac_ja === y.unit.fac_ja).forEach(x => {
      const j = SH.engJudge(y.doc, y.tr, x), sig = [x.en, j.req || '', j.st, j.why || ''].join('|');
      if (!groups.has(sig)) groups.set(sig, { un: x, j, depts: [] });
      groups.get(sig).depts.push(x.dept || '');
    });
    return groups.size > 1 ? [...groups.values()] : null;
  }
  function enCell(y) {
    if (!y) return '<span class="ig-muted" style="font-size:12px">요강 미등록</span>';
    const G = enDepts(y);
    if (G) {
      const tally = {}; G.forEach(g => { const t = g.un.en === 'N' ? '불필요' : g.un.en === 'U' ? '언급 없음' : g.j.t; tally[t] = (tally[t] || 0) + g.depts.length; });
      return `<details class="sh-en sh-en--depts"><summary><span class="ig-badge">학과별 다름</span> <small>${Object.entries(tally).map(([t, n]) => `${esc(t)} ${n}`).join(' · ')}</small></summary>${G.map(g => {
        const BG = { ok: 'success', ng: 'warning', no: '', check: '' }[g.j.st];
        const lab = g.un.en === 'N' ? '<span class="ig-muted">불필요</span>' : g.un.en === 'U' ? '<span class="ig-muted">요강에 언급 없음</span>' : `<span class="ig-badge ig-badge--${g.un.en === 'R' ? 'warning' : 'info'}">${g.un.en === 'R' ? '필요' : '선택'}</span> ${esc(g.j.req || '')}`;
        const res = g.un.en === 'N' || g.un.en === 'U' ? '' : ` <span class="ig-badge${BG ? ' ig-badge--' + BG : ''}">${esc(g.j.t)}</span>${g.j.why ? ` <small>${esc(g.j.why)}</small>` : ''}`;
        return `<div class="sh-en__dept"><small><b>${esc(g.depts.join('·'))}</b></small><br>${lab}${res}</div>`;
      }).join('')}</details>`;
    }
    const un = y.unit, en = y.tr.english || {}, j = SH.engJudge(y.doc, y.tr, un);
    if (un.en === 'N') return '<span class="ig-muted">불필요</span>';
    if (un.en === 'U') return '<span class="ig-muted" style="font-size:12px">요강에 언급 없음</span>';
    const B = { ok: 'success', ng: 'warning', no: '', check: '' }[j.st];
    const full = [en.tests, en.min].filter(Boolean).join(' — ');   // 요강 원문 정리: 마우스를 올리면 보인다
    return `<div class="sh-en" title="${esc(full)}"><span><span class="ig-badge ig-badge--${un.en === 'R' ? 'warning' : 'info'}">${un.en === 'R' ? '필요' : '선택'}</span> <span>${esc(j.req || en.tests || '')}</span></span>${!j.req && en.min ? `<small>${esc(en.min)}</small>` : ''}
      <span class="sh-en__j"><span class="ig-badge${B ? ' ig-badge--' + B : ''}">${esc(j.t)}</span>${j.why ? `<small>${esc(j.why)}</small>` : ''}</span>${j.note && !/기준점|제출 필수/.test(j.note) ? `<small>${esc(j.note)}</small>` : ''}</div>`;
  }

  /* 학교·학부 하나를 학생 점수로 평가 */
  function evalFac(uo, fo, kind, per, E) {
    const k = fo.k[kind]; if (!k) return null;
    const st = k[per] || null; if (!st) return null;
    const cu = curveOf(uo.u, fo.f, kind);
    let set = cu ? cu.set : st.set; if (!set) return null;
    let x = E ? setScore(E.vec, set) : null, fb = false;
    if (E && x == null) {
      const o = ORDER[kind] || ['J'];
      for (const s of o.slice(o.indexOf(set) + 1)) { const xs = setScore(E.vec, s); if (xs != null && st.sets[s] && st.sets[s].p && st.sets[s].p[0] >= 3) { set = s; x = xs; fb = true; break; } }
    }
    const sp = st.sets[set] || {}, q = sp.p, qf = sp.f;
    const ch = cu && !fb && x != null ? SH.evalUnit(cu, E.P) : null;
    return { uo, fo, kind, st, set, x, fb, q, qf, pos: q && x != null ? position(q, x) : null, v: verdict(q, x), cu, ch, y: yokoOf(uo.u, fo.f) };
  }
  function yokoOf(u, f) {
    if (!Y) return null;
    const doc = Y.docs.find(d => d.univ.ja === u); if (!doc) return null;
    const fk = v => String(v || '').replace(/・/g, '').replace(/探究/g, '探求').replace(/糧/g, '料').replace(/(学部|学群)$/, '');
    const cf = fk(String(f || '').split('-')[0]);
    for (const tr of doc.tracks) {
      const i = tr.units.findIndex(x => { const yf = fk(x.fac_ja); return yf && (yf === cf || cf.startsWith(yf) || yf.startsWith(cf)); });
      if (i >= 0) return { doc, tr, unit: tr.units[i], i, key: `${doc.id}/${tr.id}/${i}`, link: `#yoko/s/${doc.id}/${tr.id}/${i}` };
    }
    return null;
  }
  const yokoDoc = u => Y ? Y.docs.find(d => d.univ.ja === u) : null;

  /* 합격자 점수대 막대: 수염=최저~최고, 상자=하위25~상위25, 굵은 선=중앙, 점=학생 */
  function rangeBar(q, x, set, small) {
    if (!q) return '<span class="ig-muted" style="font-size:12px">합격자 점수 없음</span>';
    const [lo, hi] = AXIS[set], P = v => Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100)).toFixed(1) + '%';
    const [n, mn, q1, q2, q3, mx] = q;
    return `<div class="sh-range ${small ? 'sh-range--sm' : ''}" role="img" aria-label="합격자 ${n}명 점수 ${mn}~${mx}, 중앙 ${q2}${x != null ? `, 학생 ${x}` : ''}">
      <span class="sh-range__wh" style="left:${P(mn)};width:calc(${P(mx)} - ${P(mn)})"></span><span class="sh-range__box" style="left:${P(q1)};width:calc(${P(q3)} - ${P(q1)})"></span>
      <span class="sh-range__med" style="left:${P(q2)}"></span>${x != null ? `<span class="sh-range__me" style="left:${P(x)}"></span>` : ''}</div>
      <div class="sh-range__lab ig-num"><span>${mn}</span><span>중앙 ${q2}</span><span>${mx}</span></div>`;
  }

  /* ============================================================
   * 홈 (2026-11-06 개편): 왼쪽 검색칸 하나(학교·학부·학과·전공·학생) → 오른쪽에 그 대상에 맞는 바로가기
   *   아래: 데이터 현황 · 다가오는 출원 일정 · 학생 1지망
   *   처음 열면 학생이 비어 있다 (학생은 세션에만 저장)
   * ============================================================ */
  let homeSel = null;   // null | {t:'u',u} | {t:'f',u,f} | {t:'kw',q}
  const GO = [
    { n: 1, h: '#find', t: '학교 찾기', d: '학교·학부·학과·전공 키워드 → 합격 기록과 전형' },
    { n: 2, h: '#pred', t: '예측·추천', d: '학생 성적 → 다음 EJU 예측 → 안정·적정·도전' },
    { n: 3, h: '#yoko', t: '모집요강', d: '전형·일정·과목·서류 (원문 쪽수와 함께)' }];   // ④ 비교·⑤ 모의고사 분석은 위 메뉴로만 (2026-11-06)
  const goBtn = (h, no, t, d, extra) => `<a class="sh-gobtn" href="${h}"${extra || ''}>${no != null ? `<span class="sh-navno">${no}</span>` : `<span>${icon('chevron-right')}</span>`}<span><b>${t}</b>${d ? `<small>${d}</small>` : ''}</span>${icon('chevron-right')}</a>`;

  function homeGo() {
    const box = document.getElementById('hgo'); if (!box) return;
    const S = SH.S, sel = homeSel;
    if (sel && sel.t === 'u') {
      const doc = yokoDoc(sel.u), uo = UNIV.get(sel.u);
      box.innerHTML = `<h2>선택한 학교</h2><p class="sh-sel"><b>${esc(nameU(sel.u))}</b> <span lang="ja">${esc(sel.u)}</span>${uo ? ` · 학부 ${uo.fac.length} · 지원 기록 ${uo.n.toLocaleString()}건` : ''}</p>
        ${goBtn(hrefSchool(sel.u), 1, '학교 상세', '학부별 합격 기록·점수대·합격 곡선')}
        ${doc ? goBtn(`#yoko/s/${doc.id}/${doc.tracks[0].id}/0`, 3, '모집요강', `2027 · 전형 ${doc.tracks.length}개`) : `<p class="ig-muted" style="margin:0;font-size:13px">2027 모집요강은 아직 정리 전입니다.</p>`}
        ${goBtn('#find?q=' + encodeURIComponent(nameU(sel.u)), null, '이 학교 학부를 학교 찾기 목록으로', '점수를 넣어 학부끼리 비교')}
        <button type="button" class="ig-btn ig-btn--ghost ig-btn--sm" id="hclr">선택 지우기</button>`;
    } else if (sel && sel.t === 'f') {
      const y = yokoOf(sel.u, sel.f), cu = curveOf(sel.u, sel.f, S.kind) || C.units.find(c => c.s === sel.u && c.f === sel.f);
      const key = cu ? SH.ukey(cu) : y ? SH.cmpKeyForYoko(SH.yokoByKey(y.key)) : `s:${sel.u}|${sel.f}|${S.kind}`;
      box.innerHTML = `<h2>선택한 학부</h2><p class="sh-sel"><b>${esc(nameU(sel.u))} ${esc(nameF(sel.f))}</b> <span lang="ja">${esc(sel.u)} ${esc(sel.f)}</span></p>
        ${goBtn(hrefSchool(sel.u, sel.f), 1, '학부 상세 · 입시 결과', `합격·불합격 점수${cu ? ' · 합격 곡선' : ''}`)}
        ${y ? goBtn(y.link, 3, '모집요강', esc(y.tr.name_ko)) : '<p class="ig-muted" style="margin:0;font-size:13px">2027 모집요강에서 이 학부를 찾지 못했습니다.</p>'}
        <button type="button" class="ig-btn" id="hcmp">${icon('plus')}<span>${SH.cmp.includes(key) ? '④ 비교에서 빼기' : '④ 비교에 담기'}</span></button>
        <button type="button" class="ig-btn ig-btn--ghost ig-btn--sm" id="hclr">선택 지우기</button>`;
      document.getElementById('hcmp').onclick = () => SH.toggleCmp(key, homeGo);
    } else if (sel && sel.t === 'kw') {
      box.innerHTML = `<h2>키워드</h2><p class="sh-sel"><b>「${esc(sel.q)}」</b> 학교·학부·학과·전공 이름에서 찾기</p>
        ${goBtn('#find?q=' + encodeURIComponent(sel.q), 1, `「${esc(sel.q)}」 학교 찾기`, '맞는 학교·학부·전형 목록 → 점수로 다시 정렬')}
        <button type="button" class="ig-btn ig-btn--ghost ig-btn--sm" id="hclr">선택 지우기</button>`;
    } else if (SH.hasStudent()) {
      const P = SH.predict();
      box.innerHTML = `<h2>선택한 학생</h2><p class="sh-sel"><b>${esc(S.name || '이름 없음')}</b> ${S.kind}${S.campus ? ' · ' + esc(S.campus) : ''}${P.total != null ? ` · ${{ e6: '6월 예측', e11: '11월 예측', a11: '11월 실제' }[P.target]} ${Math.round(P.total)}점` : ''}</p>
        ${goBtn('#pred', 2, '예측·추천', '다음 EJU 예측 → 안정·적정·도전 학교')}
        ${goBtn('#find', 1, '이 점수로 학교 찾기', '키워드로 거르고 내 점수 위치로 정렬')}
        ${goBtn('#report', null, '상담 리포트 (PDF)', 'A4 한 장')}
        <button type="button" class="ig-btn ig-btn--ghost ig-btn--sm" id="hstu">학생 비우기</button>`;
      document.getElementById('hstu').onclick = () => { SH.clearStudent(); homeGo(); IG.toast('학생을 비웠습니다'); };
    } else {
      box.innerHTML = `<h2>바로 가기</h2>${GO.map(g => goBtn(g.h, g.n, g.t, g.d)).join('')}`;
    }
    const c = document.getElementById('hclr'); if (c) c.onclick = () => { homeSel = null; const q = document.getElementById('hq'); if (q) q.value = ''; homeGo(); };
  }

  function viewHome() {
    const nyoko = Y ? Y.docs.length : 0;
    // 다가오는 출원: 출원 기간(apply)만, 오늘~30일 안에 마감되는 것, 마감 순
    const lim = (() => { const d = new Date(SH.TODAY); d.setDate(d.getDate() + 30); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const ev = [], seen = new Set();
    if (Y) Y.docs.forEach(doc => doc.tracks.forEach(tr => tr.schedule.forEach(s => {
      const end = s.end || s.start; if (s.k !== 'apply' || end < ISO || end > lim) return;
      const k = doc.id + '|' + s.start + '|' + end; if (seen.has(k)) return; seen.add(k); ev.push({ doc, tr, s, end });
    })));
    ev.sort((a, b) => a.end.localeCompare(b.end));
    const MK = window.MOCK, lastR = MK ? MK.rounds[MK.rounds.length - 1] : null;
    const wish = lastR && lastR.wish1 ? lastR.wish1.slice(0, 10) : [];
    const krToJa = (() => { const m = {}; Object.entries(KO.univ).forEach(([ja, ko]) => { m[norm(ko)] = ja; }); Object.entries(ALIAS).forEach(([ja, al]) => al.forEach(a => { m[norm(a)] = m[norm(a)] || ja; })); return m; })();
    const ex = ['와세다 상', '경영', '情報', '심리', '츄오 법'];
    app.innerHTML = `
      <section class="sh-home">
        <div class="sh-home__q">
          <p class="ig-pagehead__eyebrow">진학 상담 · ${SH.fmt(ISO)}</p>
          <h1>무엇을 찾을까요?</h1>
          <p class="ig-pagehead__desc">학교 · 학부 · 학과 · 전공 키워드${SH.hasStudents ? ' · 학생 이름' : ''}을 넣으면 오른쪽에 바로 갈 곳이 나옵니다.</p>
          <div class="sh-bigsearch">
            <label class="ig-field"><span class="ig-sr">검색</span><span class="ig-field__control">${icon('search', '')}<input class="ig-input" id="hq" type="search" placeholder="예: 와세다 상, 경영, 情報${SH.hasStudents ? ', 학생 이름' : ''}" autocomplete="off"></span></label>
            <div class="sh-sugg sh-pop" id="hsugg" role="listbox" hidden></div>
          </div>
          <div class="sh-home__kinds">${ex.map(t => `<button type="button" class="ig-btn ig-btn--sm ig-btn--ghost" data-ex="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        </div>
        <aside class="sh-home__go" id="hgo" aria-live="polite"></aside>
      </section>
      <div class="ig-grid ig-grid--4">
        <div class="ig-stat"><span class="ig-stat__label">${icon('users')}입시 결과</span><span class="ig-stat__value">${SC ? (SC.rows / 10000).toFixed(1) : '—'}<small>만 건</small></span><span class="ig-stat__foot">${SC ? `${SC.years.a[0]}~${SC.years.a[1]} · 학교 ${SC.univ.length} · 학부 ${SC.univ.reduce((t, u) => t + u.fac.length, 0).toLocaleString()} · ${esc(SC.built)} 기준` : '데이터 없음'}</span></div>
        <div class="ig-stat"><span class="ig-stat__label">${icon('trend')}합격 곡선</span><span class="ig-stat__value">${C.units.length}<small>개 학부·계열</small></span><span class="ig-stat__foot">${C.years[0]}~${C.years[1]} · 합격·불합격 각 10명 이상 · ${esc(C.built || '')} 기준</span></div>
        <div class="ig-stat"><span class="ig-stat__label">${icon('book')}모집요강</span><span class="ig-stat__value">${nyoko}<small>개 대학</small></span><span class="ig-stat__foot">2027 · 전형 ${Y ? Y.docs.reduce((t, d) => t + d.tracks.length, 0) : 0}개 · 검수 전 · ${Y ? esc(Y.built) : ''} 기준</span></div>
        <div class="ig-stat"><span class="ig-stat__label">${icon('file')}모의고사</span><span class="ig-stat__value">${lastR ? lastR.takers : '—'}<small>명</small></span><span class="ig-stat__foot">${MK ? `${MK.year} 전국모의고사 ${lastR.n}회 응시 · ${esc(MK.built)} 기준` : '모의고사 집계 없음'}</span></div>
      </div>
      <div class="ig-grid ig-grid--main">
        <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">다가오는 출원 일정</h3><p class="ig-card__sub">앞으로 30일 안에 출원이 마감되는 전형 · 마감 순 · 정리된 모집요강 ${nyoko}개 대학 기준</p></div><a class="ig-btn ig-btn--sm ig-btn--ghost" href="#yoko">③ 모집요강</a></div>
          ${ev.length ? `<ol class="ig-tl">${ev.slice(0, 8).map((e, i) => `<li class="${i === 0 ? 'is-next' : ''}"><div class="ig-tl__date">${SH.md(e.end)}<small>마감</small></div><span class="ig-tl__dot"></span>
            <div class="ig-tl__what"><b><a href="${hrefSchool(e.doc.univ.ja)}">${esc(nameU(e.doc.univ.ja))}</a> · ${esc(e.tr.name_ko)}</b><span>${SH.range(e.s)}</span><div>${SH.dday(e.s)}</div></div></li>`).join('')}</ol>${ev.length > 8 ? `<p class="ig-muted" style="font-size:12px;margin:8px 0 0">외 ${ev.length - 8}개 전형</p>` : ''}` : `<div class="ig-empty"><p>30일 안에 마감되는 출원이 없습니다.</p></div>`}</section>
        <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">학생들이 많이 쓰는 1지망</h3><p class="ig-card__sub">${lastR ? `${MK.year} 모의고사 ${lastR.n}회 지망 조사 · 누르면 학교 상세` : ''}</p></div></div>
          ${wish.length ? `<ol class="sh-hbars">${wish.map(([k, v], i) => { const ja = krToJa[norm(k)]; const mx = wish[0][1]; return `<li><span class="sh-hbars__k"><b class="ig-num">${i + 1}</b> ${ja ? `<a href="${hrefSchool(ja)}">${esc(k)}</a>` : esc(k)}</span><span class="ig-progress__track"><i style="width:${v / mx * 100}%"></i></span><span class="ig-num">${v}</span></li>`; }).join('')}</ol>` : '<div class="ig-empty"><p>모의고사 데이터가 없습니다.</p></div>'}</section>
      </div>
      ${SH.DISC}`;
    homeSel = null; homeGo();
    const q = document.getElementById('hq'), box = document.getElementById('hsugg');
    let hits = [], act = -1;
    const pick = h => {
      box.hidden = true;
      if (h.t === 'stu') { SH.loadStudent(h.st, 'home'); return; }
      homeSel = h.t === 'u' ? { t: 'u', u: h.u } : h.t === 'f' ? { t: 'f', u: h.u, f: h.f } : { t: 'kw', q: h.q };
      q.value = h.t === 'u' ? nameU(h.u) : h.t === 'f' ? `${nameU(h.u)} ${nameF(h.f)}` : h.q;
      homeGo();
    };
    const run = () => {
      const t = q.value.trim(); act = -1;
      if (!t) { box.hidden = true; box.innerHTML = ''; hits = []; return; }
      const nt = t.replace(/\s/g, '');
      const stu = SH.hasStudents ? SH.students.filter(x => x.n.replace(/\s/g, '').includes(nt)).slice(0, 5).map(st => ({ t: 'stu', st })) : [];
      const sch = searchSchools(t, 8);
      hits = [...stu, ...sch, { t: 'kw', q: t }];
      let html = '';
      if (stu.length) html += `<p class="sh-sugg__h">학생</p>` + stu.map((h, i) => `<a href="#" data-i="${i}" role="option"><span><b>${esc(h.st.n)}</b> <span class="ig-muted">${esc(h.st.c)} · ${h.st.k}</span></span><small>예측·추천</small></a>`).join('');
      if (sch.length) html += `<p class="sh-sugg__h">학교 · 학부</p>` + sch.map((h, j) => `<a href="#" data-i="${stu.length + j}" role="option"><span>${h.t === 'u' ? `<b>${esc(nameU(h.u))}</b> <span class="ig-jp ig-muted" lang="ja">${esc(h.u)}</span>` : `<b>${esc(nameU(h.u))} ${esc(nameF(h.f))}</b> <span class="ig-jp ig-muted" lang="ja">${esc(h.u)} ${esc(h.f)}</span>`}</span><small>${h.t === 'u' ? (h.n ? `지원 ${h.n.toLocaleString()}` : '모집요강') : `학부 · 지원 ${h.n.toLocaleString()}`}</small></a>`).join('');
      html += `<p class="sh-sugg__h">키워드</p><a href="#" data-i="${hits.length - 1}" role="option"><span>${icon('search')} 「<b>${esc(t)}</b>」 학교·학부·학과·전공 이름에서 찾기</span><small>① 학교 찾기</small></a>`;
      box.innerHTML = html; box.hidden = false;
      box.querySelectorAll('a').forEach(a => a.onclick = e => { e.preventDefault(); pick(hits[+a.dataset.i]); });
    };
    q.addEventListener('input', run);
    q.addEventListener('focus', () => { if (q.value.trim() && !homeSel) run(); });
    q.addEventListener('keydown', e => {
      const items = [...box.querySelectorAll('a')];
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length && !box.hidden) { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((a, i) => a.setAttribute('aria-current', i === act)); }
      if (e.key === 'Enter' && hits.length) { e.preventDefault(); pick(hits[act >= 0 ? +items[act].dataset.i : 0]); }
      if (e.key === 'Escape') { box.hidden = true; }
    });
    document.addEventListener('click', e => { if (!box.contains(e.target) && e.target !== q) box.hidden = true; });
    app.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => { q.value = b.dataset.ex; q.focus(); run(); });
  }

  /* ============================================================
   * ① 학교 찾기 (2026-11-06 개편): 키워드(학교·학부·학과·전공, 한/日) → 학교·학부·전형 목록
   *   점수는 접어 둔 칸에서 따로 넣고, 넣으면 같은 목록이 내 점수 위치 순으로 다시 정렬된다
   *   줄을 누르면 학교·학부 상세(입시 결과·합격 곡선·모집요강)
   * ============================================================ */
  /* 이 학교·학부를 모집 단위로 가진 2027 전형들 */
  function tracksOf(u, f) {
    const doc = yokoDoc(u); if (!doc) return [];
    const fk = v => String(v || '').replace(/・/g, '').replace(/(学部|学群)$/, '');
    const cf = fk(String(f || '').split('-')[0]), out = [];
    doc.tracks.forEach(tr => { const i = tr.units.findIndex(x => { const yf = fk(x.fac_ja); return yf && (yf === cf || cf.startsWith(yf) || yf.startsWith(cf)); }); if (i >= 0) out.push({ doc, tr, i, unit: tr.units[i] }); });
    return out;
  }
  /* 키워드 비교용 글자들: 학교 / 학부 / 학과·전공(입시 결과 학과 + 요강 학과) */
  const FKEYS = new Map();
  function facKeys(u, fo, trs) {
    const id = u + '|' + fo.f; if (FKEYS.has(id)) return FKEYS.get(id);
    const uk = UKEYS.get(u) || [norm(u), norm(nameU(u))];
    const fk = [norm(fo.f), norm(nameF(fo.f)), strip(nameF(fo.f))].filter(Boolean);
    const dk = [];
    (fo.dept || []).forEach(d => { dk.push({ k: norm(d) + '|' + norm(KO.fac[d] || ''), d: KO.fac[d] ? `${KO.fac[d]}` : d }); });
    trs.forEach(t => t.tr.units.forEach(x => { if (x.fac_ja === t.unit.fac_ja && x.dept) dk.push({ k: norm(x.dept), d: x.dept }); }));
    const v = { uk, fk, dk, tr: trs.map(t => norm(t.tr.name_ko) + norm(t.tr.name_ja || '')) };
    FKEYS.set(id, v); return v;
  }
  /* 전공 동의어 (예전 「전공 찾기」 view-major.js에서 옮김) */
  /* 흔한 전공 이름: 한국어 ↔ 일본어 (요강 한국어 번역과 원문 표기가 달라도 찾히게) */
  const SYN = [['경영', '経営', '비즈니스', 'business', '商'], ['경제', '経済'], ['법', '法'], ['정치', '政治'], ['사회', '社会'], ['심리', '心理'], ['교육', '教育'],
    ['문학', '文学'], ['외국어', '外国語'], ['국제', '国際', 'global', '글로벌'], ['문화', '文化'], ['인문', '人文'], ['정보', '情報', '컴퓨터', 'computer'], ['공학', '工学'], ['이공', '理工'],
    ['이학', '理学', '자연과학'], ['수학', '数学'], ['물리', '物理'], ['화학', '化学'], ['생명', '生命', '생물', '生物'], ['환경', '環境'], ['농학', '農学', '농'], ['수의', '獣医'],
    ['의학', '医学', '의과'], ['치의', '歯学', '치학'], ['약학', '薬学'], ['간호', '看護'], ['보건', '保健'], ['건축', '建築'], ['토목', '土木'], ['기계', '機械'], ['전기', '電気'], ['전자', '電子'],
    ['디자인', 'デザイン'], ['예술', '芸術', '미술', '美術'], ['음악', '音楽'], ['체육', 'スポーツ', '스포츠'], ['관광', '観光'], ['복지', '福祉'], ['미디어', 'メディア', '커뮤니케이션', 'コミュニケーション'],
    ['종합정책', '総合政策'], ['상학', '商学'], ['회계', '会計'], ['역사', '史学', '歴史'], ['철학', '哲学'], ['언어', '言語'], ['영문', '英文', '영어', '英語'], ['지리', '地理'], ['신학', '神学']];
  const synOf = t => { const n = norm(t), out = new Set([n]); SYN.forEach(g => { const ns = g.map(norm); if (ns.some(x => x === n || (n.length >= 2 && x.includes(n)) || (x.length >= 2 && n.includes(x) && n.length <= x.length + 1))) ns.forEach(x => out.add(x)); }); return [...out]; };
  /* 키워드 점수: 모든 낱말이 어딘가에 맞아야 함. 학교 3 · 학부 2 · 학과·전공 1.5 · 전형 1 */
  function kwScore(K, toks) {
    let s = 0; const depts = [];
    for (const t0 of toks) {
      const syn = [...synOf(t0)], has = k => syn.some(t => k.includes(t)), t = t0;
      const inU = K.uk.some(k => k.includes(t)), inF = K.fk.some(has);
      const dh = K.dk.filter(x => has(x.k)), inT = K.tr.some(has);
      const su = inU ? (K.uk.some(k => k === t || k.startsWith(t)) ? 3.5 : 3) : 0;
      const sf = inF ? (K.fk.some(k => k === t || k.startsWith(t)) ? 3.5 : 3) : 0;   // 전공 낱말이 학교 이름에도 있으면(예: ○○경영대학) 학부 쪽을 같은 무게로
      const best = Math.max(su, sf, dh.length ? 1.5 : 0, inT ? 1 : 0);
      if (!best) return null;
      s += best; if (!sf && !su && dh.length) dh.forEach(x => depts.includes(x.d) || depts.push(x.d));
    }
    return { s, depts };
  }

  function viewFind(parts, params) {
    const S = SH.S;
    if (!SC) { app.innerHTML = pagehead('진학 상담 · ① 학교 찾기', '학교 찾기', '') + `<div class="ig-card ig-empty">${icon('school', '')}<b>합격 데이터가 없어요</b><p><code>python3 tools/schools_export.py</code>로 assets/schools.js를 만드세요.</p></div>`; return; }
    const qp = params && params.get ? params.get('q') : null;
    if (qp != null) store.set('findKw', qp);
    const ses = ejuSes(), mode = findMode(), per = store.get('findPer', 'r');
    const subs = S.kind === '문과' ? ['jp', 'so', 'math', 'ki'] : ['jp', S.sci[0], S.sci[1], 'math', 'ki'];
    const seg = (id, items, on, label) => `<div class="ig-seg" role="group" aria-label="${label}" id="${id}">${items.map(([v, l]) => `<button type="button" value="${v}" aria-pressed="${on(v)}">${l}</button>`).join('')}</div>`;
    const E0 = student(), hasScore0 = E0.vec.jp != null;
    const open = store.get('findOpen', null) ?? hasScore0;
    app.innerHTML = `
      ${pagehead('진학 상담 · ① 학교 찾기', '학교 찾기', `학교·학부·학과·전공 키워드로 찾고, 점수가 있으면 그 기준으로 다시 정렬합니다 · ${SC.years.a[0]}~${SC.years.a[1]} 지원 기록 ${SC.rows.toLocaleString()}건`,
        `<a class="ig-btn" href="#pred">${icon('trend')}② 예측·추천</a>`)}
      <section class="ig-card">
        <div class="sh-kw"><label class="ig-field"><span class="ig-sr">키워드</span><span class="ig-field__control">${icon('search', '')}<input class="ig-input" id="kw" type="search" placeholder="학교 · 학부 · 학과 · 전공 (한국어·日本語) — 예: 와세다 상, 경영, 情報, 심리" autocomplete="off" value="${esc(store.get('findKw', ''))}"></span></label></div>
        <div class="sh-filters" style="margin-top:12px">
          ${seg('ftype', [['', '전체'], ['국공립', '국공립'], ['사립', '사립']], v => v === store.get('ftype', ''), '설립')}
          ${seg('fper', [['r', '최근 5년'], ['a', '10년 전체']], v => v === per, '기간')}
          <label class="sh-check"><input type="checkbox" id="fyk" ${store.get('fyk', false) ? 'checked' : ''}>2027 요강 있는 곳만</label>
          <label class="sh-check"><input type="checkbox" id="fsmall" ${store.get('fsmall', false) ? 'checked' : ''}>합격자 3명 미만도</label>
        </div>
      </section>
      <details class="ig-card sh-scorebox" id="fbox" ${open ? 'open' : ''}>
        <summary>${icon('edit')} 점수로 다시 정렬 <span class="ig-muted" style="font-weight:400;font-size:13px" id="fboxsub"></span></summary>
        <div class="sh-findin">
          <div class="sh-findin__form">
            <div class="sh-row">
              <div class="ig-field"><span class="ig-field__label">어느 EJU 점수인가요</span>${seg('fses', [['e6', '6월 EJU'], ['e11', '11월 EJU']], v => v === ses, 'EJU 회차')}</div>
              <div class="ig-field"><span class="ig-field__label">계열</span>${seg('fkind', [['문과', '문과'], ['이과', '이과']], v => v === S.kind, '계열')}</div>
              ${S.kind === '이과' ? `<div class="ig-field"><span class="ig-field__label">이과 과목 2개</span>${seg('fsci', [['phy', '물리'], ['chem', '화학'], ['bio', '생물']], v => S.sci.includes(v), '이과 과목')}</div>` : ''}
            </div>
            <div class="sh-ejuin">${subs.map(s => `<label class="ig-field"><span class="ig-field__label">${SH.SUBJ[s]} <span class="ig-muted">/${SH.MAXS[s]}</span></span><input class="ig-input" inputmode="numeric" data-s="${s}" value="${esc((S.rows[ses] || {})[s] ?? '')}"></label>`).join('')}</div>
            ${SH.engInputsHtml()}
            ${hasMock() ? `<div class="sh-row" style="margin-top:12px"><span class="ig-field__label">비교할 점수</span>${seg('fmode', [['actual', '실제 EJU 점수'], ['pred', '모의고사 반영 예측']], v => v === mode, '비교 점수')}</div>` : ''}
            <div class="sh-row" style="margin-top:12px"><button type="button" class="ig-btn ig-btn--sm ig-btn--ghost" id="fclr">점수 지우기</button></div>
          </div>
          <div class="sh-findin__sum" id="fsum"></div>
        </div>
      </details>
      <div class="ig-grid ig-grid--4" id="fstats"></div>
      <section>
        <div class="ig-section-h"><h2 id="fh">학교 · 학부</h2><span class="ig-muted sh-sec-meta" id="fmeta"></span></div>
        <div class="sh-filters" id="fsortrow"></div>
        <div class="ig-card ig-card--flush"><div class="ig-table-wrap sh-scroll"><table class="ig-table ig-table--sticky sh-findtab">
          <thead id="fthead"></thead><tbody id="frows"></tbody></table></div>
          <div class="ig-card__foot sh-row" style="justify-content:space-between"><span class="ig-muted" id="fcount" style="font-size:12px"></span><button type="button" class="ig-btn ig-btn--sm" id="fmore">더 보기</button></div></div>
        <p class="ig-disclaimer" style="margin-top:12px">${icon('info')}<span>합격 / 지원 = 학원·제보 지원자 기록. 합격자 점수대 막대: 가는 선 최저~최고, 상자 하위 25%~상위 25%, 굵은 선 중앙값, 점 = 넣은 점수. 줄을 누르면 그 학부의 입시 결과(과목별 점수·연도별)·합격 곡선·모집요강. 참고용 · 합격을 보장하지 않음.</span></p>
      </section>
      <section id="ftracks"></section>`;
    const segOn = (id, fn) => app.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => fn(b.value));
    const press = id => app.querySelectorAll(`#${id} button`).forEach(b => b.addEventListener('click', () => app.querySelectorAll(`#${id} button`).forEach(x => x.setAttribute('aria-pressed', x === b))));
    segOn('fses', v => { store.set('findSes', v); viewFind(); });
    segOn('fkind', v => { S.kind = v; SH.save(); viewFind(); });
    segOn('fsci', v => { if (!S.sci.includes(v)) { S.sci = [S.sci[1], v]; SH.save(); } viewFind(); });
    segOn('fmode', v => { store.set('findMode', v); viewFind(); });
    segOn('ftype', v => { store.set('ftype', v); drawRows(true); }); press('ftype');
    segOn('fper', v => { store.set('findPer', v); compute(); drawSum(); drawRows(true); }); press('fper');
    document.getElementById('fbox').addEventListener('toggle', e => store.set('findOpen', e.target.open));
    document.getElementById('fsmall').onchange = e => { store.set('fsmall', e.target.checked); drawRows(true); };
    document.getElementById('fyk').onchange = e => { store.set('fyk', e.target.checked); drawRows(true); };
    const kw = document.getElementById('kw');
    kw.oninput = () => { store.set('findKw', kw.value); clearTimeout(viewFind.k); viewFind.k = setTimeout(() => { drawRows(true); drawTracks(); }, 120); };
    if (!hasScore0) kw.focus();
    document.getElementById('fclr').onclick = () => { S.rows[ses] = {}; SH.save(); store.set('findMode', 'actual'); viewFind(); };
    app.querySelectorAll('.sh-ejuin input').forEach(inp => inp.oninput = () => {
      const s = inp.dataset.s; S.rows[ses] = S.rows[ses] || {}; const v = inp.value.trim();
      if (v === '') delete S.rows[ses][s]; else S.rows[ses][s] = +v; SH.save();
      if (store.get('findMode', null) !== 'actual') store.set('findMode', 'actual');   // 점수를 직접 넣으면 실제 점수로 비교
      clearTimeout(viewFind.t); viewFind.t = setTimeout(() => drawAll(), 150);
    });
    SH.bindEngInputs(() => { clearTimeout(viewFind.te); viewFind.te = setTimeout(() => { drawRows(false); drawTracks(); }, 150); });   // 영어 점수를 바꾸면 영어 칸 판정만 다시 그린다
    let shown = 60;
    document.getElementById('fmore').onclick = () => { shown += 60; drawRows(false); };
    let rows = [];
    function drawAll() { compute(); drawSum(); drawRows(true); drawTracks(); }
    /* 모든 학부를 한 줄씩: 합격 기록(SCHOOLS) + 요강에만 있는 학부 */
    function compute() {
      const E = student(), perv = store.get('findPer', 'r');
      rows = [];
      const seenF = new Set();
      for (const u of SC.univ) for (const f of u.fac) {
        const r = evalFac(u, f, S.kind, perv, E) || { uo: u, fo: f, kind: S.kind, st: null, q: null, x: null, pos: null, v: null, ch: null, y: yokoOf(u.u, f.f) };
        r.trs = tracksOf(u.u, f.f); r.trs.forEach(t => seenF.add(t.doc.id + '|' + t.unit.fac_ja));
        rows.push(r);
      }
      if (Y) Y.docs.forEach(doc => { const fs = new Set(); doc.tracks.forEach(tr => tr.units.forEach(x => { if (x.fac_ja && !seenF.has(doc.id + '|' + x.fac_ja)) fs.add(x.fac_ja); }));
        fs.forEach(fj => { const f = fj.replace(/(学部|学群)$/, ''); const fo = { f, n: 0, k: {}, dept: [] }; const uo = UNIV.get(doc.univ.ja) || { u: doc.univ.ja, type: doc.univ.type, n: 0, fac: [] };
          rows.push({ uo, fo, kind: S.kind, st: null, q: null, x: null, pos: null, v: null, ch: null, y: yokoOf(doc.univ.ja, f), trs: tracksOf(doc.univ.ja, f), yonly: true }); }); });
      compute.E = E; compute.per = perv;
    }
    function drawSum() {
      const E = compute.E, tot = Object.fromEntries(Object.keys(SETP).map(s => [s, setScore(E.vec, s)]));
      const has = E.vec.jp != null;
      document.getElementById('fboxsub').textContent = has ? `· ${E.mode === 'pred' ? E.label + ' (모의고사 반영)' : E.label + ' 실제 점수'}${S.name ? ' · ' + S.name : ''}` : '· 넣으면 내 점수 위치 순으로 정렬됩니다 (선택)';
      document.getElementById('fsum').innerHTML = `<p class="ig-pred__label">${has ? (E.mode === 'pred' ? esc(E.label) + ' (모의고사 반영)' : esc(E.label) + ' 실제 점수') : '점수 없음'}</p>
        <dl class="sh-totals">${(ORDER[S.kind] || ['J']).slice().reverse().map(s => `<div><dt>${SETLAB[s]}</dt><dd class="ig-num">${tot[s] != null ? Math.round(tot[s]) : '—'}<small>/${SETMAX[s]}</small></dd></div>`).join('')}</dl>
        ${E.mode === 'pred' && E.sd ? `<p class="sh-note">예측이라 보통 ±${Math.round(E.sd)}점 벌어집니다. 표의 점은 가운데 값입니다.</p>` : ''}`;
      const ok = rows.filter(r => r.q && r.q[0] >= 3);
      const a = ok.filter(r => r.v && r.v.k >= 3).length, b = ok.filter(r => r.v && r.v.k >= 1 && r.v.k < 3).length;
      const cz = { 안정: 0, 적정: 0, 도전: 0 }; ok.forEach(r => { if (r.ch && r.ch.z) cz[r.ch.z]++; });
      document.getElementById('fstats').innerHTML = !has ? '' : `
        <div class="ig-stat"><span class="ig-stat__label">합격자 중앙값 이상</span><span class="ig-stat__value">${a}<small>개 학부</small></span><span class="ig-stat__foot">내 점수가 합격자의 절반보다 높음</span></div>
        <div class="ig-stat"><span class="ig-stat__label">합격자 범위 안</span><span class="ig-stat__value">${b}<small>개 학부</small></span><span class="ig-stat__foot">합격자 최저 ~ 중앙값 사이</span></div>
        <div class="ig-stat"><span class="ig-stat__label">합격 곡선 안정 · 적정</span><span class="ig-stat__value">${cz.안정}<small>· ${cz.적정}</small></span><span class="ig-stat__foot">곡선 있는 학부만 · 도전 ${cz.도전}</span></div>
        <div class="ig-stat"><span class="ig-stat__label">비교한 학부</span><span class="ig-stat__value">${ok.length.toLocaleString()}<small>개</small></span><span class="ig-stat__foot">${S.kind} · 합격자 3명 이상 · ${PERLAB()[store.get('findPer', 'r')]}</span></div>`;
    }
    function drawRows(reset) {
      if (reset) shown = 60;
      const E = compute.E, has = E.vec.jp != null;
      const toks = String(store.get('findKw', '') || '').trim().split(/\s+/).map(norm).filter(Boolean);
      const ty = store.get('ftype', ''), small = store.get('fsmall', false), yk = store.get('fyk', false);
      const sorts = has ? [['near', '내 점수대 먼저'], ['pos', '여유 있는 순'], ['n', '합격자 많은 순'], ['med', '합격 점수 높은 순']] : [['rel', toks.length ? '관련 순' : '지원 많은 순'], ['n', '합격자 많은 순'], ['med', '합격 점수 높은 순']];
      let sort = store.get(has ? 'fsort' : 'fsort0', has ? 'near' : 'rel'); if (!sorts.some(x => x[0] === sort)) sort = sorts[0][0];
      const sr = document.getElementById('fsortrow');
      sr.innerHTML = `<div class="ig-field"><span class="ig-field__label">정렬</span>${seg('fsort', sorts, v => v === sort, '정렬')}</div>`;
      sr.querySelectorAll('button').forEach(b => b.onclick = () => { store.set(has ? 'fsort' : 'fsort0', b.value); drawRows(true); });
      let L = [];
      for (const r of rows) {
        if (ty && !(ty === '국공립' ? /국립|공립/.test(r.uo.type) : r.uo.type === '사립')) continue;
        if (yk && !r.trs.length) continue;
        if (!toks.length && !small && !(r.q && r.q[0] >= 3)) continue;   // 키워드 없이 볼 때는 합격자 3명 이상만 (키워드로 찾을 땐 기록이 적어도 보여 준다)
        let m = { s: 0, depts: [] };
        if (toks.length) { m = kwScore(facKeys(r.uo.u, r.fo, r.trs), toks); if (!m) continue; }
        L.push({ r, m });
      }
      const nOf = x => x.r.st ? x.r.st.ap : 0, pOf = x => x.r.q ? x.r.q[0] : 0;
      const key = x => { const r = x.r;
        if (sort === 'n') return pOf(x); if (sort === 'med') return r.q ? r.q[3] : -1;
        if (sort === 'rel') return x.m.s * 4 + Math.log10(1 + nOf(x)) * 2 + (r.trs.length ? 1 : 0);   // 키워드가 잘 맞고 기록이 많고 요강이 있는 곳부터
        if (sort === 'near') return r.pos == null ? -9 : -Math.abs(r.pos - .45) + Math.log10(1 + pOf(x)) * .04 + x.m.s * .02;
        return (r.ch ? r.ch.p * 1.02 : 0) + (r.pos ?? -1); };
      L.sort((a, b) => key(b) - key(a) || pOf(b) - pOf(a));
      document.getElementById('fh').textContent = toks.length ? `「${store.get('findKw', '').trim()}」 학교 · 학부 · 전형` : '학교 · 학부';
      document.getElementById('fmeta').textContent = `${S.kind} · ${PERLAB()[store.get('findPer', 'r')]}${has ? ' · 비교 점수는 학부마다 합격자가 주로 낸 과목 조합' : ' · 점수를 넣으면 내 위치·합격 가능성 칸이 생깁니다'}`;
      document.getElementById('fcount').textContent = `${L.length.toLocaleString()}개 학부 중 ${Math.min(shown, L.length)}개 표시`;
      document.getElementById('fmore').hidden = shown >= L.length;
      document.getElementById('fthead').innerHTML = `<tr><th>학교 · 학부</th><th class="num">합격 / 지원</th><th style="min-width:200px">합격자 점수대${has ? ' <span class="ig-muted">(점 = 내 점수)</span>' : ''}</th>${has ? '<th>내 위치</th><th>합격 가능성</th>' : ''}<th>2027 전형</th><th>영어 <span class="ig-muted">(요강)</span></th><th></th></tr>`;
      const cols = has ? 8 : 6;
      document.getElementById('frows').innerHTML = L.slice(0, shown).map(({ r, m }) => {
        const k = r.cu ? SH.ukey(r.cu) : r.y ? SH.cmpKeyForYoko(SH.yokoByKey(r.y.key)) : `s:${r.uo.u}|${r.fo.f}|${r.kind}`, inC = SH.cmp.includes(k);
        return `<tr>
          <td>${schoolHtml(r.uo.u, r.fo.f, true)}<span class="sh-sub">${esc(r.uo.type || '')}${r.set ? `${r.uo.type ? ' · ' : ''}${SETLAB[r.set]}` : ''}${r.fb ? ' <span class="ig-badge" title="학생에게 없는 과목이 있어 작은 조합으로 비교">조합 축소</span>' : ''}</span>${m.depts.length ? `<span class="sh-hit">학과 · ${m.depts.slice(0, 3).map(d => `<mark>${esc(d)}</mark>`).join(', ')}${m.depts.length > 3 ? ` 외 ${m.depts.length - 3}` : ''}</span>` : ''}</td>
          <td class="num">${r.st ? `<b>${r.st.ps}</b> / ${r.st.ap}` : '<span class="ig-muted" style="font-size:12px">기록 없음</span>'}</td>
          <td>${r.q ? rangeBar(r.q, r.x != null ? Math.round(r.x) : null, r.set, true) : '<span class="ig-muted" style="font-size:12px">합격자 점수 없음</span>'}</td>
          ${has ? `<td>${vBadge(r.v)}</td><td>${r.ch ? `<div class="ig-chance ig-chance--${SH.ZK[r.ch.z] || 'try'}" style="min-width:110px"><span class="ig-chance__bar"><i style="width:${Math.round(r.ch.p * 100)}%"></i></span><span class="ig-chance__pct">${SH.pct(r.ch.p)}</span></div>` : '<span class="ig-muted" style="font-size:12px">곡선 없음</span>'}</td>` : ''}
          <td>${r.trs.length ? `<div class="sh-trk">${r.trs.slice(0, 3).map(t => `<a href="#yoko/s/${t.doc.id}/${t.tr.id}/${t.i}" title="${esc(t.tr.name_ja || '')}">${esc(t.tr.name_ko)}</a>`).join('')}${r.trs.length > 3 ? `<span class="ig-muted" style="font-size:12px">+${r.trs.length - 3}</span>` : ''}</div>` : '<span class="ig-muted" style="font-size:12px">요강 미등록</span>'}</td>
          <td>${enCell(r.y)}</td>
          <td>${SH.addBtn(k, inC)}</td></tr>`;
      }).join('') || `<tr><td colspan="${cols}"><div class="ig-empty"><p>${toks.length ? '맞는 학교·학부가 없습니다. 낱말을 줄이거나 일본어로 넣어 보세요 (예: 経営, 情報).' : '조건에 맞는 학부가 없습니다.'}</p></div></td></tr>`;
      document.querySelectorAll('#frows [data-add]').forEach(b => b.onclick = () => SH.toggleCmp(b.dataset.add, () => drawRows(false)));
    }
    /* 이 성적 조합으로 낼 수 있는 전형 (점수가 있을 때만, 키워드로 거름) */
    function drawTracks() {
      const box = document.getElementById('ftracks'); const E = compute.E, v = E.vec;
      if (!Y || v.jp == null) { box.innerHTML = ''; return; }
      const toks = String(store.get('findKw', '') || '').trim().split(/\s+/).map(norm).filter(Boolean);
      const has = { jp: v.jp != null, so: v.so != null, m1: v.m1 != null, m2: v.m2 != null, ri: v.r != null, ki: val((S.rows[ejuSes()] || {}).ki) != null };
      const LAB = { jp: '일본어', so: '종합', m1: '수학1', m2: '수학2', ri: '이과', ki: '기술' };
      const L = [];
      Y.docs.forEach(doc => doc.tracks.forEach(tr => tr.units.forEach((un, i) => {
        if (toks.length) { const hay = [norm(doc.univ.ja), norm(nameU(doc.univ.ja)), norm(doc.univ.ko), ...(doc.univ.aliases || []).map(norm), norm(un.fac), norm(un.fac_ja), norm(un.dept), norm(tr.name_ko)].join('|'); if (!toks.every(t => hay.includes(t))) return; }
        const e = un.eju || {}, need = Object.keys(LAB).filter(k => e[k] === 'R'), choice = Object.keys(LAB).filter(k => e[k] === 'C');
        const miss = need.filter(k => k !== 'ki' && !has[k]);
        const chOk = !choice.filter(k => k !== 'ki').length || choice.filter(k => k !== 'ki').some(k => has[k]);
        let st, why = '';
        if (miss.length || !chOk) { st = 1; why = `과목 부족: ${miss.map(k => LAB[k]).join('·') || choice.map(k => LAB[k]).join('/') + ' 중 하나'}`; }
        else if (e.jp_min && v.jp < e.jp_min) { st = 1; why = `일본어 ${e.jp_min}점 이상 필요 (지금 ${Math.round(v.jp)})`; }
        else {
          const m = String(e.combo || '').match(/(\d{3,4})\s*점\s*이상/);
          if (m) {
            let sum = v.jp;
            need.filter(k => k !== 'jp' && k !== 'ki').forEach(k => { sum += k === 'ri' ? v.r : v[k]; });
            const cs = choice.filter(k => k !== 'ki' && has[k]).map(k => k === 'ri' ? v.r : v[k]); if (cs.length) sum += Math.max(...cs);
            if (/기술/.test(e.combo) && has.ki) sum += val((S.rows[ejuSes()] || {}).ki);
            st = sum >= +m[1] ? 3 : 1; why = `${e.combo} → 계산 ${Math.round(sum)}점`;
          } else { st = 2; why = e.combo || '공개 기준점 없음'; }
        }
        const apply = tr.schedule.find(s => s.k === 'apply'); if (!apply) return;
        L.push({ doc, tr, un, i, st, why, apply });
      })));
      L.sort((a, b) => b.st - a.st || (a.apply.end || a.apply.start).localeCompare(b.apply.end || b.apply.start));
      const B = { 3: '<span class="ig-badge ig-badge--success">조건 충족</span>', 2: '<span class="ig-badge ig-badge--info">과목 충족 · 기준점 없음</span>', 1: '<span class="ig-badge ig-badge--warning">조건 미달</span>' };
      const lim = store.get('ftrN', 40);
      box.innerHTML = `<details class="ig-card ig-card--flush sh-scorebox" ${store.get('ftrOpen', false) ? 'open' : ''} id="ftrbox"><summary style="padding:16px 20px">이 성적 조합으로 낼 수 있는 2027 전형 <span class="ig-muted" style="font-weight:400;font-size:13px">${L.length.toLocaleString()}개 모집 단위${toks.length ? ' · 키워드로 거름' : ''} · EJU 과목·기준점만 판정 (영어·서류는 요강에서 확인)</span></summary>
        <div class="ig-table-wrap sh-scroll"><table class="ig-table ig-table--sticky">
          <thead><tr><th>학교 · 학부</th><th>전형</th><th>EJU 조건</th><th>영어 조건</th><th>판정</th><th>출원</th></tr></thead>
          <tbody>${L.slice(0, lim).map(x => `<tr><td><a class="ig-school sh-schoollink" href="#yoko/s/${x.doc.id}/${x.tr.id}/${x.i}"><b>${esc(nameU(x.doc.univ.ja))} ${esc(x.un.fac)}</b><span class="ig-jp" lang="ja">${esc(x.doc.univ.ja)} ${esc(x.un.fac_ja || '')}${x.un.dept ? ' · ' + esc(x.un.dept) : ''}</span></a></td>
            <td style="font-size:13px">${esc(x.tr.name_ko)}</td>
            <td><div class="ig-eju">${Object.keys(LAB).filter(k => ['R', 'C'].includes((x.un.eju || {})[k])).map(k => `<span class="${x.un.eju[k] === 'R' ? 'r' : 'c'}">${LAB[k]}${x.un.eju[k] === 'C' ? '(선택)' : ''}</span>`).join('')}</div></td>
            <td>${enCell({ doc: x.doc, unit: x.un, tr: x.tr })}</td>
            <td>${B[x.st]}<span class="sh-sub">${esc(x.why)}</span></td><td style="white-space:nowrap">${SH.md(x.apply.end || x.apply.start)} ${SH.dday(x.apply)}</td></tr>`).join('')}</tbody></table></div>
        ${L.length > lim ? `<div class="ig-card__foot"><button type="button" class="ig-btn ig-btn--sm" id="ftrmore">더 보기 (${L.length - lim}개 남음)</button></div>` : ''}</details>`;
      document.getElementById('ftrbox').addEventListener('toggle', e => store.set('ftrOpen', e.target.open));
      const mb = document.getElementById('ftrmore'); if (mb) mb.onclick = () => { store.set('ftrN', lim + 80); drawTracks(); };
    }
    drawAll();
  }

  /* ============================================================
   * 학교 상세: 합격생 점수대 · 합격 가능성 · 모집요강과 출원 흐름
   * ============================================================ */
  function viewSchool(parts) {
    const u = decodeURIComponent(parts[0] || ''), f = parts[1] ? decodeURIComponent(parts[1]) : null, d = parts[2] ? decodeURIComponent(parts[2]) : null;
    const uo = UNIV.get(u), doc = yokoDoc(u), S = SH.S, E = student(), per = store.get('schPer', 'r');
    if (!uo && !doc && !C.units.some(c => c.s === u)) { app.innerHTML = pagehead('진학 상담 · 학교', esc(u), '') + `<div class="ig-card ig-empty">${icon('school', '')}<b>이 학교의 데이터가 없어요</b><p>합격 데이터·곡선·모집요강 어디에도 없습니다.</p></div>`; return; }
    const facs = uo ? uo.fac : [];
    const fo = f ? facs.find(x => x.f === f) : null;
    const badges = [uo ? `<span class="ig-badge">지원 기록 ${uo.n.toLocaleString()}건</span>` : '', C.units.some(c => c.s === u) ? '<span class="ig-badge ig-badge--info">합격 곡선</span>' : '', doc ? '<span class="ig-badge ig-badge--success">모집요강 정리됨</span>' : ''].join(' ');
    app.innerHTML = `
      ${pagehead(`진학 상담 · 학교 · <a href="${hrefSchool(u)}">${esc(nameU(u))}</a>${f ? '' : ''}`, `${esc(nameU(u))}${f ? ` <span class="sh-h-sub">${esc(nameF(f))}</span>` : ''}`,
        `<span class="ig-jp" lang="ja">${esc(u)}${f ? ' ' + esc(f) : ''}</span>${uo && uo.type ? ' · ' + esc(uo.type) : ''} · ${badges}`,
        `${doc ? `<a class="ig-btn" href="#yoko/s/${doc.id}/${doc.tracks[0].id}/0">${icon('book')}③ 모집요강</a>` : ''}<a class="ig-btn ig-btn--ghost" href="#find">${icon('search')}① 학교 찾기로</a>`)}
      <div class="sh-school">
        <aside class="ig-card sh-picker" aria-label="학부 고르기">
          <a class="sh-allfac" href="${hrefSchool(u)}" aria-current="${!f}">${icon('school')} 학부 한눈에 보기</a>
          <p class="ig-field__label" style="margin:12px 0 4px">학부 (${facs.length})</p>
          <div class="sh-list">${facs.map(x => { const r = evalFac(uo, x, S.kind, per, E); return `<a href="${hrefSchool(u, x.f)}" aria-current="${x.f === f}"><span>${esc(nameF(x.f))}<small class="ig-jp ig-muted" lang="ja"> ${esc(x.f)}</small></span>${r && r.v ? `<i class="sh-dot sh-dot--${r.v.k}" title="${r.v.t}"></i>` : ''}</a>`; }).join('') || '<p class="ig-muted" style="padding:8px">합격 데이터 없음</p>'}</div>
        </aside>
        <div class="sh-school__main" id="smain"></div>
      </div>`;
    const main = document.getElementById('smain');
    if (!f) return univOverview(main, u, uo, doc, E, per);
    facDetail(main, u, uo, fo, f, doc, E, per, d);
  }

  function univOverview(main, u, uo, doc, E, per) {
    const S = SH.S, kinds = ['문과', '이과', '일본어만'];
    const list = uo ? uo.fac.map(fo => ({ fo, r: evalFac(uo, fo, S.kind, per, E), any: kinds.map(k => fo.k[k] && fo.k[k][per]).find(Boolean) })) : [];
    main.innerHTML = `
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">학부 한눈에</h3><p class="ig-card__sub">${S.kind} 기준 · ${PERLAB()[per]} · 학부를 누르면 합격생 점수대·곡선·모집요강</p></div>
        <div class="ig-seg" role="group" aria-label="기간" id="sper">${[['r', '최근 5년'], ['a', '10년 전체']].map(([v, l]) => `<button type="button" value="${v}" aria-pressed="${v === per}">${l}</button>`).join('')}</div></div>
        <div class="ig-table-wrap"><table class="ig-table ig-table--sticky"><thead><tr><th>학부</th><th class="num">합격 / 지원</th><th style="min-width:220px">합격자 점수대</th><th>내 위치</th><th>합격 가능성</th><th>모집요강</th></tr></thead>
        <tbody>${list.map(({ fo, r, any }) => `<tr><td><a class="ig-school sh-schoollink" href="${hrefSchool(u, fo.f)}"><b>${esc(nameF(fo.f))}</b><span class="ig-jp" lang="ja">${esc(fo.f)}</span></a>${r ? `<span class="sh-sub">${SETLAB[r.set]}</span>` : ''}<span class="sh-sub ${fo.yk ? '' : 'ig-muted'}">${fo.yk ? '2027 모집요강 기준' : '요강 미등록'}</span></td>
          <td class="num">${r ? `<b>${r.st.ps}</b> / ${r.st.ap}` : any ? `<span class="ig-muted">${S.kind} 기록 없음</span>` : '—'}</td>
          <td>${r ? rangeBar(r.q, r.x != null ? Math.round(r.x) : null, r.set, true) : ''}</td><td>${r ? vBadge(r.v) : ''}</td>
          <td>${r && r.ch ? `${SH.zoneChip(r.ch.z)} <b class="ig-num">${SH.pct(r.ch.p)}</b>` : '<span class="ig-muted" style="font-size:12px">곡선 없음</span>'}</td>
          <td>${yokoOf(u, fo.f) ? `<a class="ig-src" href="${yokoOf(u, fo.f).link}">요강</a>` : ''}</td></tr>`).join('') || `<tr><td colspan="6"><div class="ig-empty"><p>이 학교는 합격 데이터가 없습니다.</p></div></td></tr>`}</tbody></table></div></section>
      ${resSection(u, null, null, false)}
      ${doc ? flowCard(doc, null) : noYoko(u)}
      ${SH.DISC}`;
    resFill(main, u, null, null);
    main.querySelectorAll('#sper button').forEach(b => b.onclick = () => { store.set('schPer', b.value); SH.views.school([encodeURIComponent(u)]); });
  }

  /* 입시 결과 (예전 「입시 결과」 탭): 연도·회차를 골라 합격·불합격 과목별 점수, 최고·최저 총점자, 연도별, 학과별 */
  function resSection(u, f, d, open) {
    const ok = SH.resultsPanel && SH.resultsHas(u, f);
    return `<details class="ig-card sh-scorebox" id="sres" ${open ? 'open' : ''}><summary>${icon('chart')} 입시 결과 <span class="ig-muted" style="font-weight:400;font-size:13px">${f ? '이 학부' : '학교 전체'} 지원자 기록 · 연도·회차별 합격/불합격 과목 점수 · ${f ? '학과별' : '학부별'}</span></summary>
      ${ok ? '<div id="sresin"></div>' : `<p class="ig-muted" style="margin:0;font-size:13px">${SH.resultsPanel ? '입시 결과 기록에서 이 이름을 찾지 못했습니다.' : '입시 결과 상세 데이터(results.js)가 이 화면에 없습니다. 드라이브 「진학상담_데이터」 폴더에 올리면 나옵니다.'}</p>`}</details>`;
  }
  function resFill(main, u, f, d) {
    const el = main.querySelector('#sresin'); if (!el) return;
    const box = main.querySelector('#sres'), draw = () => { if (!el.dataset.on) { el.dataset.on = 1; SH.resultsPanel(el, u, f, d); } };
    if (box.open) draw(); else box.addEventListener('toggle', draw, { once: true });
  }

  function facDetail(main, u, uo, fo, f, doc, E, per, d) {
    const S = SH.S;
    const kinds = fo ? ['문과', '이과', '일본어만'].filter(k => fo.k[k]) : [];
    let kind = store.get('schKind', null); if (!kinds.includes(kind)) kind = kinds.includes(S.kind) ? S.kind : kinds[0];
    const r = fo && kind ? evalFac(uo, fo, kind, per, kind === S.kind ? E : null) : null;
    const st = r ? r.st : null;
    let set = store.get('schSet', null); if (!st || !st.sets[set]) set = r ? r.set : null;
    const sp = st && set ? st.sets[set] : null;
    const x = r && kind === S.kind ? (set === r.set ? r.x : setScore(E.vec, set)) : null;
    const y = yokoOf(u, f), cu = curveOf(u, f, kind) || curveOf(u, f, S.kind);
    const key = cu ? SH.ukey(cu) : y ? SH.cmpKeyForYoko(SH.yokoByKey(y.key)) : `s:${u}|${f}|${kind || S.kind}`;
    const segH = (id, items, on, label) => `<div class="ig-seg" role="group" aria-label="${label}" id="${id}">${items.map(([v, l]) => `<button type="button" value="${v}" aria-pressed="${on(v)}">${l}</button>`).join('')}</div>`;
    const SUB = [['jp', '일본어'], ['ki', '기술'], ['so', '종합'], ['m1', '수학1'], ['phy', '물리'], ['chem', '화학'], ['bio', '생물'], ['m2', '수학2']];
    const myRow = (() => { const rr = SH.S.rows[ejuSes()] || {}; return { jp: val(rr.jp), ki: val(rr.ki), so: S.kind === '문과' ? val(rr.so) : null, m1: S.kind === '문과' ? val(rr.math) : null, phy: val(rr.phy), chem: val(rr.chem), bio: val(rr.bio), m2: S.kind === '이과' ? val(rr.math) : null }; })();
    const subs = st && st.mean ? SUB.filter(([k]) => st.mean[k] != null) : [];
    main.innerHTML = `
      <section class="ig-card">
        <div class="ig-card__head"><div><p class="ig-pagehead__eyebrow">합격생 점수대</p><h3 class="ig-card__title">${esc(nameU(u))} ${esc(nameF(f))}에 합격한 사람들의 EJU</h3>
          <p class="ig-card__sub">${PERLAB()[per]} · ${kind || ''} · 6월·11월 중 높은 쪽 · 학원·제보 지원자 기준${fo && fo.yk ? ` · <b>2027 모집요강 기준</b>(요강 계열만${fo.x ? `, 다른 계열 ${fo.x}명 제외` : ''})` : ' · 요강 미등록(지원자 데이터로 추정)'}</p></div>
          <div class="ig-card__actions">${SH.addBtn(key, SH.cmp.includes(key), 'scmp')}</div></div>
        ${st ? `<div class="sh-row" style="margin-bottom:16px">${segH('skind', kinds.map(k => [k, k]), v => v === kind, '계열')}${segH('sset', Object.keys(st.sets).filter(s => st.sets[s].p).map(s => [s, SETLAB[s]]), v => v === set, '과목 조합')}${segH('sper2', [['r', '최근 5년'], ['a', '10년 전체']], v => v === per, '기간')}</div>
        <div class="ig-grid ig-grid--4 sh-mini">
          <div class="ig-stat"><span class="ig-stat__label">합격 / 지원</span><span class="ig-stat__value">${st.ps}<small>/ ${st.ap}명</small></span><span class="ig-stat__foot">합격률 ${st.ap ? Math.round(st.ps / st.ap * 100) : 0}% (기록된 지원자 기준)</span></div>
          <div class="ig-stat"><span class="ig-stat__label">합격자 중앙값</span><span class="ig-stat__value">${sp && sp.p ? sp.p[3] : '—'}<small>점</small></span><span class="ig-stat__foot">${SETLAB[set] || ''} · 평균 ${sp && sp.p ? sp.p[6] : '—'}</span></div>
          <div class="ig-stat"><span class="ig-stat__label">합격자 가운데 절반</span><span class="ig-stat__value">${sp && sp.p ? `${sp.p[2]}<small>~ ${sp.p[4]}</small>` : '—'}</span><span class="ig-stat__foot">하위 25% ~ 상위 25% · 최저 ${sp && sp.p ? sp.p[1] : '—'}</span></div>
          <div class="ig-stat"><span class="ig-stat__label">${x != null ? '내 점수 · 위치' : '불합격자 중앙값'}</span><span class="ig-stat__value">${x != null ? `${Math.round(x)}<small>점</small>` : sp && sp.f ? `${sp.f[3]}<small>점</small>` : '—'}</span><span class="ig-stat__foot">${x != null && sp && sp.p ? verdict(sp.p, x).t : sp && sp.f ? `불합격 ${sp.f[0]}명` : ''}</span></div>
        </div>
        <div class="ig-chart" id="sbox" style="margin-top:16px"></div>
        <ul class="ig-legend"><li><i class="range"></i>상자 = 하위 25%~상위 25%</li><li><i></i>굵은 선 = 중앙값 · 가는 선 = 최저~최고</li>${x != null ? `<li><i class="bin"></i>${esc(S.name)} ${Math.round(x)}점</li>` : ''}</ul>
        ${subs.length ? `<div class="ig-table-wrap" style="margin-top:16px"><table class="ig-table"><thead><tr><th>과목</th><th class="num">합격 평균</th><th class="num">최고총점 합격자</th><th class="num">최저총점 합격자</th>${kind === S.kind ? `<th class="num">${esc(S.name)} (${E.label})</th>` : ''}</tr></thead>
          <tbody>${subs.map(([k, l]) => `<tr><td><b>${l}</b></td><td class="num">${st.mean[k] ?? '—'}</td><td class="num">${st.top && st.top[k] != null ? st.top[k] : '—'}</td><td class="num">${st.low && st.low[k] != null ? st.low[k] : '—'}</td>${kind === S.kind ? `<td class="num"><b>${myRow[k] ?? '—'}</b></td>` : ''}</tr>`).join('')}
          <tr><td><b>${SETLAB[st.set]}</b></td><td class="num">${st.sets[st.set] && st.sets[st.set].p ? st.sets[st.set].p[6] : '—'}</td><td class="num"><b>${st.top ? st.top.t : '—'}</b><span class="sh-sub">${st.top ? `${st.top.y} ${st.top.se}` : ''}</span></td><td class="num"><b>${st.low ? st.low.t : '—'}</b><span class="sh-sub">${st.low ? `${st.low.y} ${st.low.se}` : ''}</span></td>${kind === S.kind ? `<td class="num"><b>${r && r.x != null && set === r.set ? Math.round(r.x) : setScore(E.vec, st.set) ?? '—'}</b></td>` : ''}</tr></tbody></table></div>
          <p class="sh-note">엑셀 「EJU통합_성적분석」 조회 시트와 같은 항목입니다 (최고·최저총점 합격자 = 그 조건에서 총점이 가장 높은/낮은 합격자 한 명의 과목별 점수, 이름 없음).</p>` : ''}
        <div class="ig-grid ig-grid--2" style="margin-top:16px"><div><p class="ig-pred__label">연도별 지원·합격</p><div id="syr"></div></div><div><p class="ig-pred__label">연도별 합격자 중앙값 (${SETLAB[st.set] || ''})</p><div class="ig-chart" id="smed"></div></div></div>`
        : `<div class="ig-empty">${icon('chart', '')}<b>이 학부는 합격 기록이 없어요</b><p>점수대는 없지만, 모집요강이 있으면 아래에서 조건과 일정을 볼 수 있어요.</p></div>`}
      </section>
      ${resSection(u, f, d, true)}
      ${cu ? `<section class="ig-card"><div class="ig-card__head"><div><p class="ig-pagehead__eyebrow">합격 가능성 (합격 곡선)</p><h3 class="ig-card__title">점수별 합격 가능성 <span class="ig-muted" style="font-size:14px">${cu.k} · ${SETLAB[cu.set]} · ${cu.r === '최고' ? '6월·11월 중 높은 쪽' : cu.r}</span></h3></div>
          <div class="ig-card__actions"><a class="ig-btn ig-btn--sm" href="#curve/${encodeURIComponent(SH.ukey(cu))}">${icon('chart')}크게 보기 · 계산 설명</a>${(() => { const P = E.mode === 'pred' ? E.P : SH.predict(); const rr = SH.evalUnit(cu, E.mode === 'actual' && E.vec.jp != null ? E.P : P); return rr ? `${SH.zoneChip(rr.z)} <b class="ig-num">${SH.pct(rr.p)}</b>` : ''; })()}</div></div>
        <div class="ig-chart" id="scurve"></div>
        <ul class="ig-legend"><li><i></i>합격 가능성 곡선 (올해 수준 보정)</li><li><i class="bin"></i>20점 구간 실제 합격 비율</li></ul></section>`
        : `<section class="ig-card"><p class="ig-pagehead__eyebrow">합격 가능성</p><p class="ig-muted" style="margin:4px 0 0">이 학부는 최근 5년 합격·불합격이 각각 10명이 안 돼 곡선을 만들지 않았습니다. 위 합격생 점수대로 판단하세요.</p></section>`}
      ${y ? flowCard(y.doc, y) : doc ? flowCard(doc, null, f) : noYoko(u)}
      ${SH.DISC}`;
    const on = (id, fn) => main.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => fn(b.value));
    const again = () => SH.views.school([encodeURIComponent(u), encodeURIComponent(f)]);
    on('skind', v => { store.set('schKind', v); store.set('schSet', null); again(); });
    on('sset', v => { store.set('schSet', v); again(); });
    on('sper2', v => { store.set('schPer', v); again(); });
    const sc = document.getElementById('scmp'); if (sc) sc.onclick = () => SH.toggleCmp(key, again);
    resFill(main, u, f, d);
    if (sp) boxPlot(document.getElementById('sbox'), sp, set, x != null ? Math.round(x) : null);
    if (st) { yearBars(document.getElementById('syr'), st.yr); medChart(document.getElementById('smed'), st.yr); }
    if (cu) {
      const P = E.mode === 'actual' && E.vec.jp != null ? E.P : SH.predict();
      const xx = setScore(P.vec, cu.set), sd = P.sd ? SH.setSd(P, cu.set) : 0;
      const xs = cu.bins.map(b => b[0]).concat(xx != null ? [xx - sd, xx + sd] : []);
      const lo = Math.max(0, Math.floor((Math.min(...xs) - 40) / 50) * 50), hi = Math.min(cu.max, Math.ceil((Math.max(...xs) + 40) / 50) * 50);
      IG.passCurve(document.getElementById('scurve'), { lo, hi, a: cu.a, b: cu.b, shift: C.shift, bins: cu.bins,
        you: xx != null ? { score: Math.round(xx), lo: Math.max(lo, Math.round(xx - sd)), hi: Math.min(hi, Math.round(xx + sd)), p: SH.pAt(cu, xx, sd) } : null,
        label: `${nameU(u)} ${nameF(f)} 합격 가능성 곡선` });
    }
  }

  /* 합격 vs 불합격 분포 (가로 상자 그림) */
  function boxPlot(el, sp, set, x) {
    const W = Math.max(300, Math.min(960, el.clientWidth || 640)), H = 150, L = 64, R = 20, T = 18, B = 26;
    const vals = [sp.p, sp.f].filter(Boolean).flatMap(q => [q[1], q[5]]).concat(x != null ? [x] : []);
    const lo = Math.max(0, Math.floor((Math.min(...vals) - 20) / 50) * 50), hi = Math.min(SETMAX[set], Math.ceil((Math.max(...vals) + 20) / 50) * 50);
    const X = v => L + (W - L - R) * (v - lo) / (hi - lo);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="합격자와 불합격자의 ${SETLAB[set]} 점수 분포${x != null ? `, 학생 ${x}점` : ''}">`;
    for (let v = Math.ceil(lo / 50) * 50; v <= hi; v += 50) s += `<line class="grid" x1="${X(v)}" x2="${X(v)}" y1="${T}" y2="${H - B}"/><text x="${X(v)}" y="${H - 8}" text-anchor="middle">${v}</text>`;
    [[sp.p, '합격', T + 22, 'sh-bx--p'], [sp.f, '불합격', T + 70, 'sh-bx--f']].forEach(([q, lab, cy, cls]) => {
      if (!q) return;
      s += `<text x="${L - 10}" y="${cy + 4}" text-anchor="end" class="${cls === 'sh-bx--p' ? 'you-label' : ''}">${lab} ${q[0]}</text>
        <line class="sh-bx-wh" x1="${X(q[1])}" x2="${X(q[5])}" y1="${cy}" y2="${cy}"/><line class="sh-bx-wh" x1="${X(q[1])}" x2="${X(q[1])}" y1="${cy - 6}" y2="${cy + 6}"/><line class="sh-bx-wh" x1="${X(q[5])}" x2="${X(q[5])}" y1="${cy - 6}" y2="${cy + 6}"/>
        <rect class="${cls}" x="${X(q[2])}" y="${cy - 13}" width="${Math.max(2, X(q[4]) - X(q[2]))}" height="26" rx="5"/><line class="sh-bx-med" x1="${X(q[3])}" x2="${X(q[3])}" y1="${cy - 13}" y2="${cy + 13}"/>`;
    });
    if (x != null) s += `<line class="you" x1="${X(x)}" x2="${X(x)}" y1="${T - 6}" y2="${H - B}"/><circle class="you-dot" cx="${X(x)}" cy="${T - 6}" r="5"/><text class="you-label" x="${X(x) + (X(x) > W - 120 ? -8 : 8)}" y="${T - 2}" text-anchor="${X(x) > W - 120 ? 'end' : 'start'}">나 ${x}</text>`;
    el.innerHTML = s + '</svg>';
  }
  function yearBars(el, yr) {
    const mx = Math.max(...yr.map(r => r[1]), 1);
    el.innerHTML = `<ol class="sh-years">${yr.map(([y, a, p]) => `<li><span class="ig-num">${y}</span><span class="sh-years__bar"><i class="a" style="width:${a / mx * 100}%"></i><i class="p" style="width:${p / mx * 100}%"></i></span><span class="ig-num"><b>${p}</b>/${a}</span></li>`).join('')}</ol>
      <ul class="ig-legend" style="margin-top:6px"><li><i class="sh-lg-p"></i>합격</li><li><i class="sh-lg-a"></i>지원</li></ul>`;
  }
  function medChart(el, yr) {
    const pts = yr.filter(r => r[3] != null);
    if (pts.length < 2) { el.innerHTML = '<p class="ig-muted" style="font-size:13px">연도별로 비교할 만큼 합격자가 없어요.</p>'; return; }
    const v = pts.map(r => r[3]), lo = Math.floor((Math.min(...v) - 20) / 20) * 20, hi = Math.ceil((Math.max(...v) + 20) / 20) * 20;
    IG.trendChart(el, { labels: pts.map(r => String(r[0]).slice(2) + '년'), me: v, min: lo, max: hi, height: 200, label: `연도별 합격자 중앙값: ${pts.map(r => r[0] + '년 ' + r[3]).join(', ')}` });
  }

  /* 모집요강 → 출원까지의 흐름 */
  function flowCard(doc, y, f) {
    const tr = y ? y.tr : doc.tracks[0], un = y ? y.unit : null;
    const S = (k) => tr.schedule.filter(s => s.k === k);
    const steps = [
      { k: 'prep', t: '서류 준비', d: `필수 ${tr.documents.filter(d => d.req === '필수').length}개 · 해당자 ${tr.documents.filter(d => d.req !== '필수').length}개` },
      { k: 'apply', t: '출원', s: S('apply')[0] },
      { k: 'result1', t: '1차 발표', s: S('result1')[0] },
      { k: 'exam', t: '시험·면접', s: S('exam')[0] },
      { k: 'result', t: '최종 발표', s: S('result')[0] },
      { k: 'enroll', t: '입학 수속', s: S('enroll')[0] }
    ].filter(x => x.s || x.k === 'prep');
    let now = steps.findIndex(x => x.s && (x.s.end || x.s.start) >= ISO); if (now < 0) now = steps.length;
    const firstDated = steps.findIndex(x => x.s);
    if (now === firstDated && steps[0].k === 'prep') now = 0;   // 아직 출원 전이면 지금 할 일은 서류 준비
    const LAB = { jp: '일본어', ki: '기술', so: '종합', m1: '수학1', m2: '수학2', ri: '이과' };
    return `<section class="ig-card"><div class="ig-card__head"><div><p class="ig-pagehead__eyebrow">모집요강 · 출원까지의 흐름</p><h3 class="ig-card__title">${esc(nameU(doc.univ.ja))} ${un ? esc(un.fac) : ''} <span class="ig-muted" style="font-size:14px">${esc(tr.name_ko)}</span></h3>
        <p class="ig-card__sub">${esc(tr.one_liner || '')}</p></div>
        <div class="ig-card__actions"><a class="ig-btn ig-btn--sm" href="${y ? y.link : `#yoko/s/${doc.id}/${tr.id}/0`}">${icon('file')}지원 요약 전체</a><a class="ig-btn ig-btn--sm ig-btn--ghost" href="#yoko/d/${doc.id}">${icon('translate')}요강 원문·번역</a></div></div>
      ${!y && f ? `<p class="ig-verify" style="margin-bottom:12px">이 학부(${esc(f)})는 이 요강의 모집 단위에서 찾지 못했어요 — 학교 공통 일정만 보여 줍니다</p>` : ''}
      <ol class="sh-steps">${steps.map((x, i) => `<li class="${i < now ? 'is-done' : i === now ? 'is-current' : ''}"><span class="sh-steps__dot"></span><b>${x.t}</b><span class="ig-num">${x.s ? SH.range(x.s) : ''}</span>${x.s ? SH.dday(x.s) : ''}${x.d ? `<small>${x.d}</small>` : x.s && x.s.time ? `<small>${esc(x.s.time)}</small>` : ''}</li>`).join('')}</ol>
      ${un ? `<dl class="ig-kv" style="margin-top:16px">
        <div><dt>EJU 과목</dt><dd><div class="ig-eju">${Object.keys(LAB).filter(k => ['R', 'C'].includes((un.eju || {})[k])).map(k => `<span class="${un.eju[k] === 'R' ? 'r' : 'c'}">${LAB[k]}${un.eju[k] === 'C' ? '(선택)' : ''}</span>`).join('') || '—'}</div><small>${esc(un.eju.combo || (un.eju.jp_min ? `일본어 ${un.eju.jp_min}점 이상` : '기준점 공개 없음'))}</small></dd></div>
        <div><dt>영어</dt><dd>${un.en === 'N' ? '불필요' : esc(tr.english.tests)}<small>${un.en === 'N' ? '' : esc(tr.english.min)}</small></dd></div>
        <div><dt>모집 인원</dt><dd>${esc(un.quota)}</dd></div>
        <div><dt>검정료</dt><dd>${SH.yen(tr.fees.exam)}</dd></div></dl>` : ''}
      ${tr.cautions.filter(c => c.kr).slice(0, 2).map(c => `<p class="ig-krnote"><b>한국 학생</b>${esc(c.t)}</p>`).join('')}
      ${doc.tracks.length > 1 ? `<p class="sh-note">이 학교는 전형이 ${doc.tracks.length}개입니다: ${doc.tracks.map(t => `<a href="#yoko/s/${doc.id}/${t.id}/0">${esc(t.name_ko)}</a>`).join(' · ')}</p>` : ''}
    </section>`;
  }
  function noYoko(u) {
    const files = (window.YOKO_FILES || []).filter(n => { const ko = nameU(u).replace(/대학$/, ''); return ko && n.includes(ko); });
    return `<section class="ig-card"><p class="ig-pagehead__eyebrow">모집요강 · 출원까지의 흐름</p>
      <p class="ig-muted" style="margin:4px 0 0">${files.length ? `모집요강 PDF는 있지만 아직 정리하지 않았어요: ${files.slice(0, 3).map(esc).join(', ')}` : '이 학교의 2027 모집요강은 아직 정리되지 않았어요.'}</p></section>`;
  }

  /* 등록 · 다른 화면에서 쓰는 것 */
  SH.views.home = viewHome;
  SH.views.find = (parts, params) => viewFind(parts, params);
  SH.views.major = (parts, params) => location.replace('#find' + (params && params.get && params.get('q') ? '?q=' + encodeURIComponent(params.get('q')) : ''));   // 예전 「전공 찾기」는 ① 학교 찾기 키워드로 합침
  SH.views.school = parts => viewSchool(parts);
  Object.assign(SH, { student, searchSchools, bindSearch, hrefSchool, schoolHtml, nameU, nameF, evalFac, UNIV, rangeBar, verdict, SETLAB2: SETLAB });
  // 앱 바 검색
  const aq = document.getElementById('aq'), asg = document.getElementById('asugg');
  if (aq && asg) bindSearch(aq, asg);
})();
