/* 진학 상담 — 입시 결과 (2026-11-06부터 별도 탭이 아니라 ① 학교 찾기 → 학교·학부 상세 안의 한 칸: SH.resultsPanel)
 * 엑셀 「조회」 시트처럼 합격·불합격 인원, 과목별 평균, 최고·최저 총점자의 성적표, TOEFL/TOEIC 를 보여 준다.
 * 데이터: window.RESULTS (tools/results_export.py — 엑셀 「데이터」 시트의 지원자 한 줄씩, 이름 없음) + 학교·학부 한국어 이름(names_ko.js)
 * 예전 주소 #results/<학교>[/<학부>[/<학과>]] 는 #school/… 로 넘긴다 */
(function () {
  "use strict";
  const SH = window.SH, R = window.RESULTS;
  if (!SH) return;
  const { esc, icon, store, KO } = SH;

  /* 예전 「입시 결과」 탭 주소는 학교 상세로 */
  SH.views.results = parts => { const p = (parts || []).filter(Boolean); location.replace(p.length ? '#school/' + p.join('/') : '#find'); };
  if (!R) { SH.resultsPanel = null; return; }

  /* ---------- 이름 · 검색 열쇠 ---------- */
  const SUBJ = ['일본어', '記述', '물리', '화학', '생물', '종합', '수학1', '수학2', '총점'];
  const koU = i => KO.univ[R.univ[i]] || '';
  const koF = i => KO.fac[R.fac[i]] || R.fack[i] || '';
  const koD = i => KO.fac[R.dept[i]] || R.deptk[i] || '';
  const nameU = i => koU(i) || R.univ[i];
  const nameF = i => koF(i) || R.fac[i];
  const nameD = i => koD(i) || R.dept[i];
  const G1 = { '学部': '학부', '大学院': '대학원' };
  const g1Name = i => G1[R.g1[i]] || R.g1[i];

  /* ---------- 행(지원자 한 줄) ---------- */
  const ROWS = R.rows.split(';');
  /* 한 회차의 과목(일본어·記述·물리·화학·생물·종합·수학1·수학2·총점)으로 본 계열: 1 문과 · 2 이과 · 3 일본어만 · 0 판정 불가 (schools_export 와 같은 규칙) */
  function roundKind(s) {
    const sci = (s[2] != null) + (s[3] != null) + (s[4] != null);
    if (s[0] != null && s[5] != null && sci === 0) return 1;
    if (s[0] != null && sci >= 2 && s[5] == null) return 2;
    if (s[0] != null && s[5] == null && sci === 0 && s[6] == null && s[7] == null) return 3;
    return 0;
  }
  /* 점수가 하나도 없는 회차는 건드릴 것이 없고, 있으면 그 회차의 계열이 요강이 인정하는 계열(mask)이어야 한다 */
  const roundOk = (s, mask) => s.every(x => x == null) || ((k) => k > 0 && (mask & (1 << (k - 1))) !== 0)(roundKind(s));

  /* 조건(학교·학부·학과·구분)에 맞는 지원자 한 줄씩 */
  function collect(scope, from, to, g1) {
    const out = [];
    for (let ui = 0; ui < R.units.length; ui++) {
      const [u, f, d, g, st, n, mask] = R.units[ui];
      if (u !== scope.u || (scope.f != null && f !== scope.f) || (scope.d != null && d !== scope.d) || (g1 != null && g !== g1)) continue;
      for (let k = st; k < st + n; k++) {
        const c = ROWS[k].split(','), y = 2000 + +c[0];
        if (y < from || y > to) continue;
        const v = c.map(x => x === '' ? null : +x);
        // 2027 모집요강이 있는 학부(mask>0)는 요강이 인정하는 계열의 지원자만 (1 문과·2 이과·4 일본어만)
        if (mask) { out.yk = true; const kc = v[22]; if (!kc || !(mask & (1 << (kc - 1)))) { out.skipped = (out.skipped || 0) + 1; continue; } }
        let s6 = v.slice(2, 11), s11 = v.slice(11, 20);
        // 회차마다 응시한 과목으로 계열을 따로 봐서, 요강이 인정하지 않는 계열로 본 회차(예: 문과 학부인데 6월에 이과 과목)는 과목 점수에서 뺀다
        if (mask) { if (!roundOk(s6, mask)) s6 = s6.map(() => null); if (!roundOk(s11, mask)) s11 = s11.map(() => null); }
        out.push({ ui, f, d, y, p: v[1] === 1, s6, s11, toefl: v[20], toeic: v[21] });
      }
    }
    return out;
  }

  const href = (u, f, d) => '#school/' + [u, f, d].map(x => x == null ? '' : encodeURIComponent(x)).join('/').replace(/\/+$/, '');

  /* ---------- 집계 (엑셀 「조회」와 같은 규칙) ---------- */
  const mean = (a, n) => n ? a / n : null;
  const fmt = v => v == null ? '—' : (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(1));
  /* ses: 전체 | 6월 | 11월. 인원은 회차와 상관없이 한 줄이 1명, 과목 평균은 고른 회차의 점수를 모두 모아 평균, 최고·최저는 총점이 가장 높은/낮은 한 명(회차 전체면 회차마다 총점을 따로 봄) */
  function aggregate(rows, ses) {
    const mk = () => ({ cnt: 0, sum: Array(9).fill(0), n: Array(9).fill(0), toefl: [0, 0], toeic: [0, 0], top: null, low: null });
    const G = { pass: mk(), fail: mk() };
    for (const r of rows) {
      const g = r.p ? G.pass : G.fail;
      g.cnt++;
      for (const [se, s] of [['6월', r.s6], ['11월', r.s11]]) {
        if (ses !== '전체' && ses !== se) continue;
        s.forEach((v, j) => { if (v != null) { g.sum[j] += v; g.n[j]++; } });
        const t = s[8];
        if (t != null) {
          const rec = { r, se, s };
          if (!g.top || t > g.top.s[8]) g.top = rec;
          if (!g.low || t < g.low.s[8]) g.low = rec;
        }
      }
      if (r.toefl != null) { g.toefl[0] += r.toefl; g.toefl[1]++; }
      if (r.toeic != null) { g.toeic[0] += r.toeic; g.toeic[1]++; }
    }
    return G;
  }

  /* ---------- 화면 ---------- */
  /* el 안에 입시 결과(연도·회차 고르기 + 집계)를 그린다. 학교·학부·학과가 입시 결과에 없으면 false */
  function panel(el, uj, fj, dj) {
    const u = R.univ.indexOf(uj);
    const f = fj != null ? R.fac.indexOf(fj) : null, d = dj != null ? R.dept.indexOf(dj) : null;
    if (u < 0 || f === -1 || d === -1) return false;
    const scope = { u, f, d };
    const [y0, y1] = R.years, ses0 = store.get('resSes', '전체');
    let from = Math.max(y0, Math.min(y1, store.get('resFrom', y0))), to = Math.max(y0, Math.min(y1, store.get('resTo', y1))), ses = ses0, g1 = store.get('resG1', null);
    const inScope = R.units.filter(x => x[0] === u && (f == null || x[1] === f) && (d == null || x[2] === d));
    const g1s = [...new Set(inScope.map(x => x[3]))];
    if (g1 != null && !g1s.includes(g1)) g1 = null;
    const years = Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i);
    el.innerHTML = `${d != null ? `<p class="ig-muted" style="margin:0 0 8px">학과 · <b>${esc(nameD(d))}</b> <span class="ig-jp" lang="ja">${esc(dj)}</span> <a class="ig-src" href="${href(uj, fj)}">학부 전체로</a></p>` : ''}
      <section class="ig-card sh-rs-filter">
        <label class="ig-field"><span class="ig-field__label">시작 연도</span><select class="ig-input" id="rfrom">${years.map(y => `<option ${y === from ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
        <label class="ig-field"><span class="ig-field__label">종료 연도</span><select class="ig-input" id="rto">${years.map(y => `<option ${y === to ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
        <div class="ig-field"><span class="ig-field__label">회차 (과목 점수)</span><div class="ig-seg" id="rses" role="group" aria-label="회차">${['전체', '6월', '11월'].map(v => `<button type="button" value="${v}" aria-pressed="${v === ses}">${v}</button>`).join('')}</div></div>
        ${g1s.length > 1 ? `<div class="ig-field"><span class="ig-field__label">구분</span><div class="ig-seg" id="rg1" role="group" aria-label="구분">${[[null, '전체'], ...g1s.map(g => [g, g1Name(g)])].map(([v, l]) => `<button type="button" value="${v == null ? '' : v}" aria-pressed="${v === g1}">${esc(l)}</button>`).join('')}</div></div>` : ''}
      </section>
      <div id="rbody"></div>`;
    const reset = () => { store.set('resFrom', from); store.set('resTo', to); store.set('resSes', ses); store.set('resG1', g1); draw(); };
    el.querySelector('#rfrom').onchange = e => { from = +e.target.value; if (to < from) { to = from; el.querySelector('#rto').value = to; } reset(); };
    el.querySelector('#rto').onchange = e => { to = +e.target.value; if (from > to) { from = to; el.querySelector('#rfrom').value = from; } reset(); };
    const seg = (id, fn) => el.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => { fn(b.value); el.querySelectorAll(`#${id} button`).forEach(x => x.setAttribute('aria-pressed', x === b)); reset(); });
    seg('rses', v => { ses = v; });
    if (g1s.length > 1) seg('rg1', v => { g1 = v === '' ? null : +v; });

    function draw() {
      const rows = collect(scope, from, to, g1), G = aggregate(rows, ses), P = G.pass, F = G.fail;
      const body = el.querySelector('#rbody');
      const ykNote = rows.yk ? `<p class="ig-muted sh-yk"><span class="ig-badge ig-badge--success">2027 모집요강 기준</span> 요강이 인정하는 계열의 지원자만 집계${rows.skipped ? ` (다른 계열 ${rows.skipped}명 제외)` : ''}. 요강이 일본어만 보는 학부는 모든 계열 포함.</p>` : (R.yoko && R.yoko.includes(R.univ[u]) ? '<p class="ig-muted sh-yk">이 학부는 2027 요강과 맞는 항목을 못 찾아 전체 지원자를 집계합니다.</p>' : '<p class="ig-muted sh-yk"><span class="ig-badge">요강 미등록</span> 지원자 데이터 그대로 집계합니다.</p>');
      if (!rows.length) { body.innerHTML = `<div class="ig-card ig-empty">${icon('school', '')}<b>이 조건의 지원자가 없어요</b><p>연도 범위나 구분을 바꿔 보세요.</p></div>` + ykNote; return; }
      const cell = (g, which) => { const rec = which === 'top' ? g.top : g.low; return rec ? rec.s : null; };
      const who = (g, which) => { const rec = which === 'top' ? g.top : g.low; if (!rec) return ''; const r = rec.r, [uu, ff, dd] = R.units[r.ui], dn = R.dept[dd];
        return `${r.y}년 ${rec.se} · ${esc(nameU(uu))} ${esc(nameF(ff))}${dn !== '(미기재)' && dn !== R.fac[ff] ? ' ' + esc(nameD(dd)) : ''}`; };
      const sj = j => [mean(P.sum[j], P.n[j]), cell(P, 'top') && cell(P, 'top')[j], cell(P, 'low') && cell(P, 'low')[j], P.n[j], mean(F.sum[j], F.n[j]), cell(F, 'top') && cell(F, 'top')[j], cell(F, 'low') && cell(F, 'low')[j], F.n[j]];
      const lines = SUBJ.map((name, j) => [name, ...sj(j)]).filter(l => l[4] || l[8]);
      const en = (key) => [mean(P[key][0], P[key][1]), P.top ? P.top.r[key] : null, P.low ? P.low.r[key] : null, P[key][1], mean(F[key][0], F[key][1]), F.top ? F.top.r[key] : null, F.low ? F.low.r[key] : null, F[key][1]];
      lines.push(['TOEFL(iBT)', ...en('toefl')], ['TOEIC', ...en('toeic')]);
      const shown = lines.filter(l => l[4] || l[8]);
      const rate = P.cnt + F.cnt ? Math.round(P.cnt / (P.cnt + F.cnt) * 100) : 0;
      const yr = years.filter(y => y >= from && y <= to).map(y => { const a = rows.filter(r => r.y === y); return [y, a.length, a.filter(r => r.p).length]; });
      const mx = Math.max(1, ...yr.map(x => x[1]));
      // 하위 단위 (학교→학부, 학부→학과)
      const kids = f == null ? { key: r => r.f, label: x => nameF(x), sub: x => R.fac[x], go: x => href(R.univ[u], R.fac[x]), t: '학부' }
        : d == null ? { key: r => r.d, label: x => nameD(x), sub: x => R.dept[x], go: x => href(R.univ[u], fj, R.dept[x]), t: '학과' } : null;
      let kidsHtml = '';
      if (kids && !(f != null && d == null && rows.every(r => R.dept[r.d] === '(미기재)' || R.dept[r.d] === R.fac[r.f]))) {
        const m = new Map(); rows.forEach(r => { const k = kids.key(r), e = m.get(k) || { n: 0, p: 0, ts: 0, tn: 0 }; e.n++; if (r.p) { e.p++; for (const s of ses === '6월' ? [r.s6] : ses === '11월' ? [r.s11] : [r.s6, r.s11]) if (s[8] != null) { e.ts += s[8]; e.tn++; } } m.set(k, e); });
        const L = [...m.entries()].sort((a, b) => b[1].n - a[1].n);
        kidsHtml = `<section><div class="ig-section-h"><h2>${kids.t}별 결과</h2><span class="ig-muted sh-sec-meta">${L.length}곳 · 누르면 그 ${kids.t}만 봅니다</span></div><div class="ig-card ig-card--flush"><div class="ig-table-wrap"><table class="ig-table ig-table--sticky"><thead><tr><th>${kids.t}</th><th class="num">합격 / 지원</th><th class="num">합격률</th><th class="num">합격자 총점 평균</th></tr></thead><tbody>${L.map(([k, e]) =>
          `<tr><td><a class="sh-schoollink" href="${kids.go(k)}"><b>${esc(kids.label(k))}</b> <span class="ig-jp ig-muted" lang="ja">${esc(kids.sub(k))}</span></a></td><td class="num"><b>${e.p}</b> / ${e.n}</td><td class="num">${Math.round(e.p / e.n * 100)}%</td><td class="num">${e.tn ? fmt(e.ts / e.tn) : '—'}</td></tr>`).join('')}</tbody></table></div></div></section>`;
      }
      body.innerHTML = ykNote + `
        <div class="ig-grid ig-grid--4">
          <div class="ig-stat"><span class="ig-stat__label">합격 인원</span><span class="ig-stat__value">${P.cnt}<small>명</small></span><span class="ig-stat__foot">${from}~${to}</span></div>
          <div class="ig-stat"><span class="ig-stat__label">불합격 인원</span><span class="ig-stat__value">${F.cnt}<small>명</small></span><span class="ig-stat__foot">기록된 지원자 기준</span></div>
          <div class="ig-stat"><span class="ig-stat__label">합격률</span><span class="ig-stat__value">${rate}<small>%</small></span><span class="ig-stat__foot">합격 ÷ (합격+불합격)</span></div>
          <div class="ig-stat"><span class="ig-stat__label">합격자 총점 평균</span><span class="ig-stat__value">${fmt(mean(P.sum[8], P.n[8]))}<small>점</small></span><span class="ig-stat__foot">${ses === '전체' ? '6월·11월 점수를 모아서' : ses + ' 점수'}</span></div>
        </div>
        <section><div class="ig-section-h"><h2>점수 조회</h2><span class="ig-muted sh-sec-meta">최고·최저총점자 = 그 조건에서 총점이 가장 높은/낮은 지원자 한 명의 성적표</span></div>
          <div class="ig-card ig-card--flush"><div class="ig-table-wrap"><table class="ig-table ig-table--sticky sh-rs-tab">
            <thead><tr><th rowspan="2">항목</th><th colspan="4" class="sh-rs-g sh-rs-g--p">합격</th><th colspan="4" class="sh-rs-g">불합격</th></tr>
              <tr><th class="num">평균</th><th class="num">최고총점자</th><th class="num">최저총점자</th><th class="num">n</th><th class="num">평균</th><th class="num">최고총점자</th><th class="num">최저총점자</th><th class="num">n</th></tr></thead>
            <tbody>${shown.map(l => `<tr><td><b>${l[0]}</b></td>${l.slice(1).map((v, i) => `<td class="num${i === 3 || i === 7 ? ' ig-muted' : ''}">${i === 0 || i === 4 ? fmt(v) : i === 3 || i === 7 ? v : (v == null ? '—' : v)}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="9"><div class="ig-empty"><p>점수가 기록된 지원자가 없어요.</p></div></td></tr>'}</tbody></table></div>
            <div class="ig-card__foot sh-rs-who"><div><b>합격 최고</b> ${who(P, 'top') || '—'}</div><div><b>합격 최저</b> ${who(P, 'low') || '—'}</div><div><b>불합격 최고</b> ${who(F, 'top') || '—'}</div><div><b>불합격 최저</b> ${who(F, 'low') || '—'}</div></div></div></section>
        <section><div class="ig-section-h"><h2>연도별 지원·합격</h2></div><div class="ig-card"><ol class="sh-years">${yr.map(([y, a, p]) => `<li><span class="ig-num">${y}</span><span class="sh-years__bar"><i class="a" style="width:${a / mx * 100}%"></i><i class="p" style="width:${p / mx * 100}%"></i></span><span class="ig-num"><b>${p}</b>/${a}</span></li>`).join('')}</ol></div></section>
        ${kidsHtml}
        <p class="ig-disclaimer">${icon('info')}<span>엑셀 「EJU 성적 조회」와 같은 규칙입니다. 인원은 지원자 한 줄이 1명, 과목 평균은 고른 회차의 점수를 모두 모아 평균을 냅니다. 학원·제보 지원자 기록이라 전체와 다를 수 있습니다. 참고용 · 합격을 보장하지 않음.</span></p>`;
    }
    draw();
    return true;
  }

  SH.resultsPanel = panel;
  SH.resultsHas = (uj, fj) => R.univ.indexOf(uj) >= 0 && (fj == null || R.fac.indexOf(fj) >= 0);
})();
