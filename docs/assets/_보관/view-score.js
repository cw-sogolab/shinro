/* 진학 상담 — 「채점 비교」 탭. 데이터: window.SCORING (tools/mock_scoring.py가 만든 집계, 이름·수험번호 없음)
 * 학원 자체 채점 vs 정답수 비례 vs 득점등화 1·2·3모수, 그리고 적용한 보정 세 가지.
 * 주소: #score · #score/<table|dist|pred|fix> */
(function () {
  "use strict";
  const SH = window.SH, D = window.SCORING;
  if (!SH) return;
  const { esc, icon, store, pagehead } = SH;
  const app = document.getElementById('app');

  const SUBS = [['sum', '요약'], ['table', '틀린 문항 수별 점수'], ['dist', '점수 분포'], ['pred', '예측 비교'], ['fix', '보정 내용']];
  const SCH = ['A', 'B', 'C', 'D', 'E'];
  const f1 = v => v == null ? '—' : (Math.round(v * 10) / 10).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const sgn = v => v == null ? '' : (v > 0 ? '+' : v < 0 ? '−' : '±') + f1(Math.abs(v));

  if (!D) {
    SH.views.score = () => { app.innerHTML = pagehead('진학 상담 · 채점 비교', '채점 방식 비교', '') + `<div class="ig-card ig-empty">${icon('chart', '')}<b>채점 비교 데이터가 없어요</b><p><code>python3 tools/mock_scoring.py --js docs/assets/scoring.js</code></p></div>`; };
    return;
  }
  const NM = Object.fromEntries(D.schemes.map(s => [s.id, s.name]));
  const SUBJ = D.subjects;
  const hidden = new Set();

  /* ---------- 선 그래프 (SVG, 담는 칸 폭으로) ---------- */
  function lines(el, o) {   // o: {xs:[라벨], series:[{id, ys}], xTitle, yTitle, yMax, xEvery}
    const W = Math.max(320, Math.min(980, el.clientWidth || 700)), H = 280, Lm = 42, Rm = 12, T = 14, B = 40;
    const n = o.xs.length;
    const all = o.series.filter(s => !hidden.has(s.id)).flatMap(s => s.ys).filter(v => v != null);
    const yMax = o.yMax || (o.int ? Math.max(20, Math.ceil(Math.max(...all, 1) / 20) * 20) : Math.max(10, Math.ceil(Math.max(...all, 1) / 10) * 10));
    const X = i => Lm + (n === 1 ? 0 : i * (W - Lm - Rm) / (n - 1)), Y = v => T + (H - T - B) * (1 - v / yMax);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">`;
    for (let k = 0; k <= 4; k++) { const v = yMax * k / 4; s += `<line class="grid" x1="${Lm}" x2="${W - Rm}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${Lm - 6}" y="${Y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`; }
    const every = o.xEvery || Math.ceil(n / (W < 480 ? 6 : 12));
    o.xs.forEach((l, i) => { if (i % every === 0) s += `<text x="${X(i)}" y="${H - B + 16}" text-anchor="middle">${esc(l)}</text>`; });
    s += `<text x="${(Lm + W - Rm) / 2}" y="${H - 6}" text-anchor="middle">${esc(o.xTitle || '')}</text>`;
    o.series.forEach(se => {
      if (hidden.has(se.id)) return;
      let seg = [];
      const flush = () => { if (seg.length > 1) s += `<polyline class="sc-line sc-${se.id}" points="${seg.join(' ')}"/>`; seg = []; };
      se.ys.forEach((v, i) => { if (v == null) flush(); else seg.push(`${X(i).toFixed(1)},${Y(v).toFixed(1)}`); });
      flush();
      se.ys.forEach((v, i) => { if (v != null) s += `<circle class="sc-dot sc-${se.id}" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="${n > 30 ? 2 : 3}"><title>${esc(NM[se.id])} · ${esc(o.xs[i])}${o.tip ? '' : ''}: ${o.int ? Math.round(v) + '명' : f1(v) + '점'}</title></circle>`; });
    });
    el.innerHTML = s + '</svg>';
  }
  const legend = redraw => `<div class="sc-legend" role="group" aria-label="방식 선택">${SCH.map(k => `<button type="button" class="sc-leg sc-${k}" data-k="${k}" aria-pressed="${!hidden.has(k)}"><i></i>${k} ${esc(NM[k])}</button>`).join('')}</div>`;
  function wireLegend(redraw) {
    app.querySelectorAll('.sc-leg').forEach(b => b.onclick = () => { const k = b.dataset.k; hidden.has(k) ? hidden.delete(k) : hidden.add(k); b.setAttribute('aria-pressed', !hidden.has(k)); redraw(); });
  }

  function frame(sub) {
    return pagehead('진학 상담 · 채점 비교', '모의고사 채점 방식 비교',
      `학원 자체 채점과 보정한 방식을 같은 학생·같은 시험으로 비교합니다 · ${esc(D.asof)} 기준 · 집계만 (학생 이름 없음)`) +
      `<div class="ig-tabs" role="tablist" aria-label="채점 비교 화면">${SUBS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === sub}" data-sub="${k}">${l}</button>`).join('')}</div>`;
  }
  const wireFrame = () => app.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => SH.go('score/' + b.dataset.sub));
  const subjSeg = cur => `<div class="ig-seg" role="group" aria-label="과목" id="ssel">${SUBJ.map(s => `<button type="button" value="${s.key}" aria-pressed="${s.key === cur}">${esc(s.name)}</button>`).join('')}</div>`;
  const getSubj = () => { const k = store.get('scSubj', 'jr'); return SUBJ.some(s => s.key === k) ? k : 'jr'; };

  /* ---------- 요약 ---------- */
  function vSum() {
    const pj = D.pred.jp, ps = D.pred.so;
    const best = g => SCH.reduce((a, b) => g.schemes[a].mae <= g.schemes[b].mae ? a : b);
    const stat = (lab, g) => { const b = best(g), v = g.schemes[b]; const sp = Math.max(...SCH.map(s => g.schemes[s].mae)) - Math.min(...SCH.map(s => g.schemes[s].mae)); return `<div class="ig-stat"><span class="ig-stat__label">${lab} · 6월 EJU 예측 오차</span><span class="ig-stat__value">${f1(v.mae)}<small>점 (${esc(NM[b])})</small></span><span class="ig-stat__foot">다섯 방식 차이 ${f1(sp)}점 이내 · n=${g.n}</span></div>`; };
    return `
      <div class="ig-grid ig-grid--4">${stat('일본어', pj)}${stat('종합', ps)}
        <div class="ig-stat"><span class="ig-stat__label">비교한 방식</span><span class="ig-stat__value">5<small>가지</small></span><span class="ig-stat__foot">학원 · 정답수 · 득점등화 1·2·3모수</span></div>
        <div class="ig-stat"><span class="ig-stat__label">모의고사 데이터</span><span class="ig-stat__value">${D.subj.jr.stats.all.A.n}<small>건 응시</small></span><span class="ig-stat__foot">1~4회 · 독해 기준 학생×회차</span></div></div>
      <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">결론</h3><p class="ig-card__sub">숫자는 「예측 비교」 탭에 있습니다</p></div></div>
        <ul class="sc-concl">${D.conclusion.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">비교한 다섯 방식</h3></div></div>
        <div class="ig-table-wrap"><table class="ig-table"><tbody>${D.schemes.map(s => `<tr><td class="sc-key"><span class="sc-leg sc-${s.id}"><i></i>${s.id}</span></td><td><b>${esc(s.name)}</b></td><td>${esc(s.desc)}</td></tr>`).join('')}</tbody></table></div></section>
      <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">읽을 때 주의</h3></div></div>
        <ul class="sc-concl">${D.notes.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>`;
  }

  /* ---------- 틀린 문항 수별 점수 ---------- */
  function vTable() {
    const k = getSubj(), meta = D.meta[k], rounds = meta.rounds;
    let rn = store.get('scRound', rounds[rounds.length - 1]); if (!rounds.includes(rn)) rn = rounds[rounds.length - 1];
    const T = D.subj[k].tables[String(rn)], cap = SUBJ.find(s => s.key === k).cap;
    const cell = (s, i) => {
      const v = T[s][i]; if (v == null) return '<span class="ig-muted">—</span>';
      const lo = T[s + 'lo'][i], hi = T[s + 'hi'][i];
      return `<b>${f1(v)}</b>${lo != null && hi != null && lo !== hi ? `<small class="sc-rng">${Math.round(lo)}~${Math.round(hi)}</small>` : ''}`;
    };
    const rows = T.w.map(w => `<tr class="${T.n[w] ? '' : 'sc-empty'}"><td class="num"><b>${w}</b></td><td class="num">${T.n[w] || '—'}</td>${SCH.map(s => `<td class="num">${cell(s, w)}</td>`).join('')}</tr>`).join('');
    return `
      <div class="sh-row" style="justify-content:space-between">${subjSeg(k)}
        <div class="ig-seg" role="group" aria-label="회차" id="rsel">${rounds.map(n => `<button type="button" value="${n}" aria-pressed="${n === rn}">${n}회</button>`).join('')}</div></div>
      <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">틀린 문항 수에 따른 점수 — ${esc(SUBJ.find(s => s.key === k).name)} ${rn}회 (${T.w.length - 1}문항, 만점 ${cap})</h3>
        <p class="ig-card__sub">선이 가파를수록 틀릴 때 감점이 큼 · A·D·E는 같은 틀린 수라도 학생마다 달라 평균을 그림 (응시자가 없는 칸은 비어 있음) · 점마다 마우스를 올리면 값</p></div></div>
        ${legend()}<div class="ig-chart" id="ch"></div></section>
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">표</h3><p class="ig-card__sub">작은 숫자 = 같은 틀린 수에서 학생 점수의 최소~최대 · B·C는 틀린 수만 같으면 점수가 같음</p></div></div>
        <div class="ig-table-wrap"><table class="ig-table ig-table--sticky"><thead><tr><th class="num">틀린 수</th><th class="num">응시</th>${SCH.map(s => `<th class="num">${s} ${esc(NM[s])}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }
  function afterTable() {
    const k = getSubj(), rounds = D.meta[k].rounds;
    let rn = store.get('scRound', rounds[rounds.length - 1]); if (!rounds.includes(rn)) rn = rounds[rounds.length - 1];
    const T = D.subj[k].tables[String(rn)];
    const draw = () => lines(document.getElementById('ch'), { xs: T.w.map(String), series: SCH.map(s => ({ id: s, ys: T[s] })), xTitle: '틀린 문항 수', aria: `${rn}회 틀린 문항 수별 점수`, yMax: SUBJ.find(s => s.key === k).cap });
    app.querySelectorAll('#ssel button').forEach(b => b.onclick = () => { store.set('scSubj', b.value); SH.views.score(['table']); });
    app.querySelectorAll('#rsel button').forEach(b => b.onclick = () => { store.set('scRound', +b.value); SH.views.score(['table']); });
    wireLegend(draw); draw();
  }

  /* ---------- 점수 분포 ---------- */
  function vDist() {
    const k = getSubj(), meta = D.meta[k], rounds = ['all'].concat(meta.rounds.map(String));
    let rn = store.get('scDist', 'all'); if (!rounds.includes(String(rn))) rn = 'all';
    const st = D.subj[k].stats[String(rn)];
    return `
      <div class="sh-row" style="justify-content:space-between">${subjSeg(k)}
        <div class="ig-seg" role="group" aria-label="회차" id="rsel">${rounds.map(n => `<button type="button" value="${n}" aria-pressed="${n === String(rn)}">${n === 'all' ? '전체' : n + '회'}</button>`).join('')}</div></div>
      <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">점수 분포 — ${esc(SUBJ.find(s => s.key === k).name)} ${rn === 'all' ? '1~4회 전체' : rn + '회'}</h3>
        <p class="ig-card__sub">가로 = 점수 구간(만점의 5%씩), 세로 = 인원 · 방식마다 같은 학생들의 점수를 다르게 환산한 분포</p></div></div>
        ${legend()}<div class="ig-chart" id="ch"></div></section>
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">요약 통계</h3></div></div>
        <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>방식</th><th class="num">인원</th><th class="num">평균</th><th class="num">표준편차</th><th class="num">최저</th><th class="num">최고</th></tr></thead>
        <tbody>${SCH.map(s => `<tr><td><span class="sc-leg sc-${s}"><i></i>${s}</span> <b>${esc(NM[s])}</b></td><td class="num">${st[s].n}</td><td class="num"><b>${f1(st[s].mean)}</b></td><td class="num">${f1(st[s].sd)}</td><td class="num">${f1(st[s].min)}</td><td class="num">${f1(st[s].max)}</td></tr>`).join('')}</tbody></table></div></section>
      <p class="ig-disclaimer">${icon('info')}<span>종합은 모의고사가 EJU보다 어려워 득점률 환산(B~E)이 학원 환산(A)보다 낮게 나옵니다. 학원 환산은 EJU 평균에 맞춘 점수입니다. 점수 수준보다 분포 모양과 순위를 비교하세요. 정답수 비례(B)는 점수가 띄엄띄엄 나와서 구간에 따라 들쭉날쭉해 보입니다.</span></p>`;
  }
  function afterDist() {
    const k = getSubj(), meta = D.meta[k], rounds = ['all'].concat(meta.rounds.map(String));
    let rn = store.get('scDist', 'all'); if (!rounds.includes(String(rn))) rn = 'all';
    const H = D.subj[k].hist[String(rn)];
    const draw = () => lines(document.getElementById('ch'), { xs: D.subj[k].bins, series: SCH.map(s => ({ id: s, ys: H[s] })), xTitle: '점수 구간', aria: '점수 분포', int: true, xEvery: 2 });
    app.querySelectorAll('#ssel button').forEach(b => b.onclick = () => { store.set('scSubj', b.value); SH.views.score(['dist']); });
    app.querySelectorAll('#rsel button').forEach(b => b.onclick = () => { store.set('scDist', b.value); SH.views.score(['dist']); });
    wireLegend(draw); draw();
  }

  /* ---------- 예측 비교 ---------- */
  function vPred() {
    const block = gk => {
      const g = D.pred[gk], best = Math.min(...SCH.map(s => g.schemes[s].mae));
      const nv = g.nov;
      return `
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">${esc(g.name)} — 6월 EJU 예측 오차 (n=${g.n})</h3>
        <p class="ig-card__sub">모의고사 1·2회 점수 → 6월 EJU 실제 점수에 회귀 · 학생 한 명씩 빼고 검증 · MAE는 작을수록 좋음 (초록 = 최저)</p></div></div>
        <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>방식</th><th class="num">MAE</th><th class="num">RMSE</th><th class="num">상관 r</th><th class="num">상위 20% 편향</th><th class="num">하위 20% 편향</th><th class="num">정답수 비례와 MAE 차이</th></tr></thead>
        <tbody>${SCH.map(s => { const v = g.schemes[s]; return `<tr><td><span class="sc-leg sc-${s}"><i></i>${s}</span> <b>${esc(NM[s])}</b></td><td class="num ${v.mae === best ? 'sc-best' : ''}"><b>${f1(v.mae)}</b></td><td class="num">${f1(v.rmse)}</td><td class="num">${v.r.toFixed(2)}</td><td class="num">${sgn(v.top)}</td><td class="num">${sgn(v.bot)}</td><td class="num">${s === 'B' ? '기준' : `${sgn(v.dmae)} <small class="sc-rng">${sgn(v.ci[0])} ~ ${sgn(v.ci[1])}</small>`}</td></tr>`; }).join('')}</tbody></table></div></section>
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">${esc(g.name)} — 11월 EJU 예측 (3·4회 응시 ${nv.n}명)</h3>
        <p class="ig-card__sub">같은 보정식으로 3·4회 점수를 11월 EJU 점수로 바꾼 값 · 일본어는 374, 종합은 200을 넘지 않게 자름</p></div></div>
        <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>방식</th><th class="num">예측 평균</th><th class="num">표준편차</th><th class="num">상위 10% 경계</th><th class="num">최고</th><th class="num">정답수 비례와 평균 차이</th><th class="num">최대 차이</th><th class="num">상관</th></tr></thead>
        <tbody>${SCH.map(s => { const v = nv.schemes[s]; return `<tr><td><span class="sc-leg sc-${s}"><i></i>${s}</span> <b>${esc(NM[s])}</b></td><td class="num"><b>${f1(v.mean)}</b></td><td class="num">${f1(v.sd)}</td><td class="num">${f1(v.p90)}</td><td class="num">${f1(v.max)}</td><td class="num">${s === 'B' ? '기준' : f1(v.vsB)}</td><td class="num">${s === 'B' ? '—' : f1(v.maxdiff)}</td><td class="num">${v.corr.toFixed(3)}</td></tr>`; }).join('')}</tbody></table></div></section>`;
    };
    return `<p class="ig-disclaimer">${icon('info')}<span>${esc(D.pred_note)} MAE 차이의 작은 숫자는 95% 구간 — 0을 걸치면 차이가 없다고 봅니다.</span></p>${block('jp')}${block('so')}
      <p class="ig-disclaimer">${icon('info')}<span>모든 방식에서 상위권은 과소 예측(−), 하위권은 과대 예측(+)됩니다. 모델의 문제가 아니라 평균 쪽으로 당겨지는 성질입니다. 11월 결과가 나오면 같은 비교를 다시 할 수 있습니다.</span></p>`;
  }

  /* ---------- 보정 내용 ---------- */
  function vFix() {
    const c6 = D.cohort6, J = D.jasso, cap = { jr: 199, jl: 175, jp: 374, so: 200 };
    const order = ['jr', 'jl', 'jp', 'so', 'm1', 'm2', 'phy', 'chem', 'bio'];
    return `
      <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">적용한 보정 세 가지</h3></div></div>
        <ul class="sc-concl">${D.corrections.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>
      <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">예측·추천 화면에 이미 반영된 것</h3><p class="ig-card__sub">「예측·추천」과 「학교 찾기」의 점수·범위·합격 확률</p></div></div>
        <ul class="sc-concl">
          <li>일본어는 독해 199 + 청해·청독해 175 = <b>374</b>을 넘지 않습니다. 일본어만 보는 학부는 374, +종합 574, +종합+수학 774처럼 조합별 상한도 같이 걸립니다.</li>
          <li>예측 범위(±표준편차)의 위쪽 끝, 합격 확률 계산, 홈 카드의 범위도 이 상한에 맞춰 잘립니다.</li>
          <li>종합·수학·이과 과목은 6월 한 회차의 최고점일 뿐이라 구조적 상한으로 보지 않고 만점 그대로 둡니다.</li></ul></section>
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">EJU 2026년 제1회 결과(JASSO)와 대조</h3>
        <p class="ig-card__sub">전국 응시생과 우리 학생은 수준이 달라 분포를 억지로 맞추지 않고 참고만 합니다 · 표는 결과 개요에서 옮긴 것이라 원문 대조 필요</p></div></div>
        <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>과목</th><th class="num">전국 평균</th><th class="num">전국 표준편차</th><th class="num">전국 최고</th><th class="num">우리 학생 평균</th><th class="num">우리 SD</th><th class="num">우리 최고</th><th class="num">우리 n</th><th class="num">모의 만점(보정 후)</th></tr></thead>
        <tbody>${order.map(k => { const j = J[k], c = c6[k]; return `<tr><td><b>${esc(j.name)}</b></td><td class="num">${f1(j.mean)}</td><td class="num">${f1(j.sd)}</td><td class="num">${j.max}</td><td class="num">${c ? f1(c.mean) : '—'}</td><td class="num">${c ? f1(c.sd) : '—'}</td><td class="num">${c ? c.max : '—'}</td><td class="num">${c ? c.n : '—'}</td><td class="num">${cap[k] || '—'}</td></tr>`; }).join('')}</tbody></table></div></section>
      <p class="ig-disclaimer">${icon('info')}<span>출처: JASSO 「2026年度第1回 日本留学試験 結果の概要」 (${esc(D.jasso_url)}). 우리 학생 열은 학원 학생의 6월 EJU 실제 점수 집계입니다.</span></p>`;
  }

  /* ---------- 진입 ---------- */
  SH.views.score = function (parts) {
    let sub = (parts && parts[0]) || 'sum'; if (!SUBS.some(s => s[0] === sub)) sub = 'sum';
    const body = { sum: vSum, table: vTable, dist: vDist, pred: vPred, fix: vFix }[sub]();
    app.innerHTML = frame(sub) + `<div class="sh-stack">${body}</div>`;
    wireFrame();
    if (sub === 'table') afterTable();
    if (sub === 'dist') afterDist();
  };
})();
