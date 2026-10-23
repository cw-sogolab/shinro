/* 진학 상담 — 「모의고사 분석」 탭. 데이터: window.MOCK (tools/mock_export.py가 채점시트에서 만든 집계, 이름·수험번호 없음)
 * 주소: #mock · #mock/<sum|items|diff|growth|wish|report> */
(function () {
  "use strict";
  const SH = window.SH, MK = window.MOCK, IG = window.Ilgong;
  if (!SH) return;
  const { esc, icon, store, pagehead } = SH;
  const app = document.getElementById('app');
  const NS = 'http://www.w3.org/2000/svg';

  const SUBS = [['sum', '회차 요약'], ['items', '문항 분석'], ['diff', '난이도 점검'], ['growth', '성장 추이'], ['wish', '지망대학'], ['report', '개인 성적표']];
  const LAB = { jp: '일본어', jr: '독해', jl: '청해·청독해', ki: '기술', so: '종합과목', m1: '수학 코스1', m2: '수학 코스2', phy: '물리', chem: '화학', bio: '생물', bunka: '문과 총점', rika: '이과 총점' };
  const SUBORDER = ['jp', 'jr', 'jl', 'ki', 'so', 'm1', 'm2', 'phy', 'chem', 'bio', 'bunka', 'rika'];
  const f1 = v => v == null ? '—' : (Math.round(v * 10) / 10).toLocaleString('ko-KR');
  const sgn = v => v == null ? '' : (v > 0 ? '+' : v < 0 ? '−' : '±') + f1(Math.abs(v));
  const pctS = p => p == null ? '—' : Math.round(p * 100) + '%';

  if (!MK) {
    SH.views.mock = () => { app.innerHTML = pagehead('진학 상담 · 모의고사 분석', '모의고사 분석', '') + `<div class="ig-card ig-empty">${icon('chart', '')}<b>모의고사 집계가 없어요</b><p><code>python3 tools/mock_export.py</code>로 채점시트에서 assets/mock.js를 만드세요.</p></div>`; };
    return;
  }
  const RN = MK.rounds.map(r => r.n);
  const getRound = () => { const n = store.get('mockRound', RN[RN.length - 1]); return MK.rounds.find(r => r.n === n) || MK.rounds[MK.rounds.length - 1]; };
  const prevOf = R => MK.rounds.find(r => r.n === R.n - 1);

  /* 분포 막대 (SVG, 담는 칸 폭으로) */
  function histo(el, st, mark, label) {
    const W = Math.max(300, Math.min(960, el.clientWidth || 640)), H = 200, L = 34, Rr = 8, T = 12, B = 26;
    const h = st.hist, n = h.length, mx = Math.max(...h, 1);
    const bw = (W - L - Rr) / n, Y = v => T + (H - T - B) * (1 - v / mx);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`;
    [0, .5, 1].forEach(t => { const v = Math.round(mx * t); s += `<line class="grid" x1="${L}" x2="${W - Rr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`; });
    const mi = mark == null ? -1 : Math.min(n - 1, Math.floor(mark / st.step));
    h.forEach((v, i) => { if (v) s += `<rect class="${i === mi ? 'sh-hbar sh-hbar--me' : 'sh-hbar'}" x="${(L + i * bw + 1).toFixed(1)}" y="${Y(v).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${(H - B - Y(v)).toFixed(1)}" rx="2"><title>${i * st.step}~${(i + 1) * st.step - 1}점: ${v}명</title></rect>`; });
    const every = Math.ceil(n / (W < 480 ? 5 : 10));
    for (let i = 0; i <= n; i += every) s += `<text x="${L + i * bw}" y="${H - 8}" text-anchor="middle">${i * st.step}</text>`;
    const mxX = L + (st.mean / st.step) * bw;
    s += `<line class="sh-meanline" x1="${mxX}" x2="${mxX}" y1="${T}" y2="${H - B}"/><text x="${mxX + 4}" y="${T + 10}" class="you-label">평균 ${f1(st.mean)}</text>`;
    el.innerHTML = s + '</svg>';
  }
  function bars(el, rows, label) {   // 가로 막대 목록 [이름, 값]
    const mx = Math.max(...rows.map(r => r[1]), 1);
    el.innerHTML = `<ol class="sh-hbars" aria-label="${esc(label)}">${rows.map(([k, v], i) => `<li><span class="sh-hbars__k"><b class="ig-num">${i + 1}</b> ${esc(k)}</span><span class="ig-progress__track"><i style="width:${v / mx * 100}%"></i></span><span class="ig-num">${v}</span></li>`).join('')}</ol>`;
  }
  const topPct = (sorted, x) => { if (!sorted || !sorted.length || x == null) return null; let gt = 0, eq = 0; for (const v of sorted) { if (v > x) gt++; else if (v === x) eq++; } return (gt + eq / 2) / sorted.length; };

  function frame(sub, R) {
    const camps = Object.entries(R.camps).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${esc(k)} ${v}`).join(' · ');
    return pagehead('진학 상담 · 모의고사 분석', `${MK.year} 전국모의고사 ${R.n}회`, `응시 ${R.takers}명 (${camps}) · 채점시트 집계 · 학생 이름은 들어 있지 않습니다`,
      `<div class="ig-seg" role="group" aria-label="회차" id="rsel">${RN.map(n => `<button type="button" value="${n}" aria-pressed="${n === R.n}">${n}회</button>`).join('')}</div>`) +
      `<div class="ig-tabs" role="tablist" aria-label="모의고사 분석 화면">${SUBS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === sub}" data-sub="${k}">${l}</button>`).join('')}</div>`;
  }
  function wireFrame(sub) {
    app.querySelectorAll('#rsel button').forEach(b => b.onclick = () => { store.set('mockRound', +b.value); SH.views.mock([sub]); });
    app.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => SH.go('mock/' + b.dataset.sub));
  }

  /* ---------- 회차 요약 ---------- */
  function vSum(R) {
    const P = prevOf(R), S = R.subj, PS = P ? P.subj : {};
    const stat = (lab, k, foot) => S[k] ? `<div class="ig-stat"><span class="ig-stat__label">${lab}</span><span class="ig-stat__value">${f1(S[k].mean)}<small>점</small></span><span class="ig-stat__foot">${S[k].n}명 · ${P && PS[k] ? `${P.n}회보다 ${sgn(S[k].mean - PS[k].mean)}` : foot || '첫 회차'}</span></div>` : '';
    const keys = SUBORDER.filter(k => S[k]);
    let cur = store.get('mockSubj', 'jp'); if (!S[cur]) cur = 'jp';
    const camps = Object.keys(R.bycamp).sort((a, b) => R.bycamp[b].n - R.bycamp[a].n);
    return `
      <div class="ig-grid ig-grid--4">
        <div class="ig-stat"><span class="ig-stat__label">응시 인원</span><span class="ig-stat__value">${R.takers}<small>명</small></span><span class="ig-stat__foot">${Object.entries(R.kinds).map(([k, v]) => `${esc(k)} ${v}`).join(' · ')}</span></div>
        ${stat('일본어 평균', 'jp')}${stat('문과 총점 평균', 'bunka')}${stat('이과 총점 평균', 'rika')}
      </div>
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">과목별 성적</h3><p class="ig-card__sub">변환점수 · 총점은 해당 과목을 모두 본 학생만 · 범위 밖 값은 뺌</p></div></div>
        <div class="ig-table-wrap"><table class="ig-table ig-table--sticky"><thead><tr><th>과목</th><th class="num">응시</th><th class="num">평균</th><th class="num">표준편차</th><th class="num">하위 25%</th><th class="num">중앙값</th><th class="num">상위 25%</th><th class="num">상위 10%</th><th class="num">${P ? P.n + '회 대비' : '지난 회차 대비'}</th></tr></thead>
        <tbody>${keys.map(k => { const s = S[k]; return `<tr><td><b>${LAB[k]}</b> <span class="ig-muted">/${s.max}</span></td><td class="num">${s.n}</td><td class="num"><b>${f1(s.mean)}</b></td><td class="num">${f1(s.sd)}</td><td class="num">${s.q[1]}</td><td class="num">${s.q[2]}</td><td class="num">${s.q[3]}</td><td class="num">${s.q[4]}</td><td class="num">${PS[k] ? sgn(s.mean - PS[k].mean) : '—'}</td></tr>`; }).join('')}</tbody></table></div></section>
      <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">점수 분포</h3><p class="ig-card__sub">막대 = 점수 구간별 인원 · 세로선 = 평균</p></div>
          <div class="ig-seg" role="group" aria-label="과목" id="hsel">${keys.map(k => `<button type="button" value="${k}" aria-pressed="${k === cur}">${LAB[k]}</button>`).join('')}</div></div>
        <div class="ig-chart" id="hist"></div></section>
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">캠퍼스별 평균</h3><p class="ig-card__sub">외부 = 외부 응시생 (통계에만 포함, 상담 카드는 동의 범위가 정해진 뒤에)</p></div></div>
        <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>캠퍼스</th><th class="num">인원</th><th class="num">일본어</th><th class="num">종합</th><th class="num">수학1</th><th class="num">문과 총점</th><th class="num">이과 총점</th></tr></thead>
        <tbody>${camps.map(c => { const b = R.bycamp[c]; return `<tr><td><b>${esc(c)}</b></td><td class="num">${b.n}</td>${['jp', 'so', 'm1', 'bunka', 'rika'].map(k => `<td class="num">${f1(b[k])}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div></section>
      <p class="ig-disclaimer">${icon('info')}<span>작년 같은 회차와의 비교는 ${MK.year - 1}년 채점시트를 같은 방식으로 넣으면 나옵니다.</span></p>`;
  }
  function afterSum(R) {
    const draw = () => { const k = store.get('mockSubj', 'jp'); const st = R.subj[k] || R.subj.jp; histo(document.getElementById('hist'), st, null, `${R.n}회 ${LAB[k] || '일본어'} 점수 분포, 평균 ${f1(st.mean)}점`); };
    app.querySelectorAll('#hsel button').forEach(b => b.onclick = () => { store.set('mockSubj', b.value); app.querySelectorAll('#hsel button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
    draw();
  }

  /* ---------- 문항 분석 ---------- */
  function vItems(R) {
    const keys = Object.keys(R.items);
    let k = store.get('mockItemSubj', keys[0]); if (!R.items[k]) k = keys[0];
    const sort = store.get('mockItemSort', 'q');
    const it = R.items[k]; if (!it) return `<div class="ig-card ig-empty"><b>문항 데이터가 없어요</b></div>`;
    const list = it.items.slice().sort((a, b) => sort === 'p' ? (a.p ?? 1) - (b.p ?? 1) : sort === 'd' ? a.d - b.d : a.q - b.q);
    const flag = x => [x.d < 0 ? '<span class="ig-badge ig-badge--danger">검토 · 변별도 음수</span>' : x.d < .2 ? '<span class="ig-badge ig-badge--warning">변별도 낮음</span>' : '',
      x.p != null && x.p < .3 ? '<span class="ig-badge">어려움</span>' : x.p != null && x.p > .9 ? '<span class="ig-badge">쉬움</span>' : ''].join(' ');
    const dLab = d => d >= .4 ? '좋음' : d >= .3 ? '괜찮음' : d >= .2 ? '보통' : '낮음';
    const avgP = it.items.reduce((t, x) => t + (x.p || 0), 0) / it.items.length;
    const review = it.items.filter(x => x.d < .2).length;
    const opts = x => { const tot = Object.values(x.opts).reduce((a, b) => a + b, 0); return Object.keys(x.opts).filter(o => o !== '무응답').sort((a, b) => a - b).map(o => `<span class="${String(x.key) === o ? 'sh-opt sh-opt--key' : 'sh-opt'}">${o}<small>${Math.round(x.opts[o] / tot * 100)}%</small></span>`).join('') + (x.opts['무응답'] ? `<span class="sh-opt sh-opt--blank">무응답<small>${Math.round(x.opts['무응답'] / tot * 100)}%</small></span>` : ''); };
    return `
      <div class="sh-row" style="justify-content:space-between">
        <div class="ig-seg" role="group" aria-label="과목" id="isel">${keys.map(x => `<button type="button" value="${x}" aria-pressed="${x === k}">${R.items[x].label}</button>`).join('')}</div>
        <div class="ig-seg" role="group" aria-label="정렬" id="isort">${[['q', '문항순'], ['p', '정답률 낮은 순'], ['d', '변별도 낮은 순']].map(([v, l]) => `<button type="button" value="${v}" aria-pressed="${v === sort}">${l}</button>`).join('')}</div>
      </div>
      <div class="ig-grid ig-grid--4">
        <div class="ig-stat"><span class="ig-stat__label">${it.label} 응시</span><span class="ig-stat__value">${it.n}<small>명</small></span><span class="ig-stat__foot">${it.items.length}문항</span></div>
        <div class="ig-stat"><span class="ig-stat__label">평균 정답률</span><span class="ig-stat__value">${Math.round(avgP * 100)}<small>%</small></span><span class="ig-stat__foot">문항 정답률의 평균</span></div>
        <div class="ig-stat"><span class="ig-stat__label">변별도 낮은 문항</span><span class="ig-stat__value">${review}<small>개</small></span><span class="ig-stat__foot">상위·하위 27% 정답률 차 0.2 미만</span></div>
        <div class="ig-stat"><span class="ig-stat__label">가장 어려운 문항</span><span class="ig-stat__value">${(() => { const h = it.items.slice().sort((a, b) => (a.p ?? 1) - (b.p ?? 1))[0]; return `${h.q}<small>번 · ${pctS(h.p)}</small>`; })()}</span><span class="ig-stat__foot">정답률 기준</span></div>
      </div>
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">${it.label} 문항별</h3><p class="ig-card__sub">정답률 · 변별도(잘하는 학생과 못하는 학생을 가르는 정도) · 선지별 선택 비율 — 굵은 선지가 정답</p></div></div>
        <div class="ig-table-wrap"><table class="ig-table ig-table--sticky sh-items"><thead><tr><th>문항</th><th class="num">정답</th><th>정답률</th><th class="num">변별도</th><th>많이 고른 오답</th><th>선지별 선택</th><th></th></tr></thead>
        <tbody>${list.map(x => `<tr><td><b>${x.q}번</b></td><td class="num">${x.key ?? '—'}</td>
          <td><div class="sh-pbar"><span class="ig-progress__track"><i style="width:${Math.round((x.p || 0) * 100)}%"></i></span><span class="ig-num">${pctS(x.p)}</span></div></td>
          <td class="num">${x.d.toFixed(2)} <span class="ig-muted" style="font-size:12px">${dLab(x.d)}</span></td>
          <td>${x.lure ? `${x.lure}번 <span class="ig-muted">${pctS(x.lureP)}</span>` : '—'}</td><td><div class="sh-opts">${opts(x)}</div></td><td>${flag(x)}</td></tr>`).join('')}</tbody></table></div></section>
      <p class="ig-disclaimer">${icon('info')}<span>수학은 채점 형식(빈칸 숫자)이 달라 문항 분석에서 빠져 있습니다. 단원별 정답률은 「문항 → 단원」 대응표를 만들면 나옵니다. 문항 분석 화면에는 학생 이름을 띄우지 않습니다.</span></p>`;
  }
  function afterItems(R) {
    app.querySelectorAll('#isel button').forEach(b => b.onclick = () => { store.set('mockItemSubj', b.value); SH.views.mock(['items']); });
    app.querySelectorAll('#isort button').forEach(b => b.onclick = () => { store.set('mockItemSort', b.value); SH.views.mock(['items']); });
  }

  /* ---------- 난이도 점검 ---------- */
  function vDiff(R) {
    const rows = MK.difficulty.filter(d => d.y === MK.year && d.r === R.n + '회');
    const last = MK.difficulty.filter(d => d.y === MK.year - 1 && d.r === R.n + '회');
    const jb = j => /어려움/.test(j) ? `<span class="ig-badge ig-badge--warning">${esc(j)}</span>` : /쉬움/.test(j) ? `<span class="ig-badge ig-badge--info">${esc(j)}</span>` : `<span class="ig-badge">${esc(j)}</span>`;
    const table = (k) => { const rs = rows.filter(d => d.k === k); if (!rs.length) return ''; return `
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">${k}</h3><p class="ig-card__sub">같은 학생의 ${R.n}회 모의 점수와 실제 EJU 점수 비교</p></div></div>
        <div class="ig-table-wrap"><table class="ig-table ig-table--sticky"><thead><tr><th>과목</th><th>비교 EJU</th><th class="num">짝 인원</th><th class="num">모의 평균</th><th class="num">EJU 평균</th><th class="num">차이 (모의−EJU)</th><th>판정</th><th class="num">${MK.year - 1}년 같은 회차 차이</th><th class="num">작년 대비 δ</th></tr></thead>
        <tbody>${rs.map(d => { const l = last.find(x => x.k === d.k && x.s === d.s && x.vs === d.vs); return `<tr><td><b>${esc(d.s)}</b></td><td>${esc(d.vs)}</td><td class="num">${d.n}</td><td class="num">${f1(d.mock)}</td><td class="num">${f1(d.eju)}</td><td class="num"><b>${sgn(d.diff)}</b></td><td>${jb(d.j)}</td><td class="num">${l ? sgn(l.diff) : '—'}</td><td class="num">${d.delta != null ? sgn(d.delta) : '—'}<span class="sh-sub">${esc(d.dj || '')}</span></td></tr>`; }).join('')}</tbody></table></div></section>`; };
    return rows.length ? `
      <section class="ig-card"><p style="margin:0">「차이」가 음수면 모의고사가 실제 EJU보다 <b>어려웠던</b> 것(같은 학생이 모의에서 더 낮게 받음)입니다. 작년 같은 회차 대비 난이도 차(δ)는 다음 EJU 예측의 「난이도 보정」으로 들어갑니다 — 예측·추천 탭의 계산이 이 값을 씁니다.</p></section>
      ${table('문과')}${table('이과')}
      <p class="ig-disclaimer">${icon('info')}<span>출처: EJU_점수예측_분석 「난이도분석」 시트. 1·2회는 6월 EJU 3~4개월 전이라 차이에 실력 향상분이 섞여 있습니다. 생물은 인원이 적어 참고만.</span></p>`
      : `<div class="ig-card ig-empty">${icon('clock', '')}<b>${R.n}회는 아직 비교할 EJU 점수가 없어요</b><p>${MK.year}년 ${R.n >= 3 ? '11월' : '6월'} EJU 결과가 들어오면 같은 학생끼리 비교해 계산합니다.</p>
          <div class="sh-row" style="justify-content:center">${RN.filter(n => MK.difficulty.some(d => d.y === MK.year && d.r === n + '회')).map(n => `<button type="button" class="ig-btn ig-btn--sm" data-dr="${n}">${n}회 난이도 보기</button>`).join('')}</div></div>`;
  }

  /* ---------- 성장 추이 ---------- */
  function vGrowth() {
    const G = MK.growth, keys = Object.keys(G); let k = store.get('mockGrowth', 'jp'); if (!G[k]) k = keys[0];
    if (!k) return `<div class="ig-card ig-empty"><b>짝지을 수 있는 학생이 없어요</b></div>`;
    const g = G[k], rr = MK.growthRounds, f = rr[0], l = rr[rr.length - 1];
    return `
      <div class="sh-row" style="justify-content:space-between"><p class="ig-muted" style="margin:0;font-size:13px">같은 학생을 학원 아이디로 짝지어 집계 (회차 선택과 상관없이 ${f}~${l}회)</p>
        <div class="ig-seg" role="group" aria-label="과목" id="gsel">${keys.map(x => `<button type="button" value="${x}" aria-pressed="${x === k}">${LAB[x]}</button>`).join('')}</div></div>
      <div class="ig-grid ig-grid--4">
        <div class="ig-stat"><span class="ig-stat__label">${f}회·${l}회 모두 본 학생</span><span class="ig-stat__value">${g.pairs}<small>명</small></span><span class="ig-stat__foot">${rr.length}회 모두: ${g.all.n}명</span></div>
        <div class="ig-stat"><span class="ig-stat__label">평균 변화 (${f}→${l}회)</span><span class="ig-stat__value">${sgn(g.meanChange)}<small>점</small></span><span class="ig-stat__foot">${LAB[k]}</span></div>
        <div class="ig-stat"><span class="ig-stat__label">오른 학생</span><span class="ig-stat__value">${g.up}<small>명</small></span><span class="ig-stat__foot">${Math.round(g.up / g.pairs * 100)}%</span></div>
        <div class="ig-stat"><span class="ig-stat__label">내린 학생</span><span class="ig-stat__value">${g.down}<small>명</small></span><span class="ig-stat__foot">${Math.round(g.down / g.pairs * 100)}%</span></div>
      </div>
      <div class="ig-grid ig-grid--main">
        <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">${rr.length}회 모두 본 학생 평균</h3><p class="ig-card__sub">${g.all.n}명 · ${LAB[k]}</p></div><ul class="ig-legend" style="margin:0"><li><i></i>전체</li><li><i class="avg"></i>${esc(Object.keys(g.cohort)[0] || '')}</li></ul></div><div class="ig-chart" id="gchart"></div></section>
        <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">변화 분포</h3><p class="ig-card__sub">${f}회 → ${l}회 점수 변화별 인원</p></div></div><div id="gh"></div></section>
      </div>
      <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">캠퍼스별</h3><p class="ig-card__sub">${rr.length}회 모두 본 학생 · 5명 미만 캠퍼스는 숨김</p></div></div>
        <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>캠퍼스</th><th class="num">인원</th>${rr.map(n => `<th class="num">${n}회</th>`).join('')}<th class="num">변화</th></tr></thead>
        <tbody><tr><td><b>전체</b></td><td class="num">${g.all.n}</td>${g.all.mean.map(v => `<td class="num">${f1(v)}</td>`).join('')}<td class="num"><b>${sgn(g.all.mean[g.all.mean.length - 1] - g.all.mean[0])}</b></td></tr>
          ${Object.entries(g.cohort).map(([c, v]) => `<tr><td>${esc(c)}</td><td class="num">${v.n}</td>${v.mean.map(x => `<td class="num">${f1(x)}</td>`).join('')}<td class="num">${sgn(v.mean[v.mean.length - 1] - v.mean[0])}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  function afterGrowth() {
    app.querySelectorAll('#gsel button').forEach(b => b.onclick = () => { store.set('mockGrowth', b.value); SH.views.mock(['growth']); });
    const G = MK.growth, k = G[store.get('mockGrowth', 'jp')] ? store.get('mockGrowth', 'jp') : Object.keys(G)[0]; if (!k) return;
    const g = G[k], c0 = Object.values(g.cohort)[0];
    const vals = g.all.mean.concat(c0 ? c0.mean : []);
    const lo = Math.floor((Math.min(...vals) - 10) / 10) * 10, hi = Math.ceil((Math.max(...vals) + 10) / 10) * 10;
    IG.trendChart(document.getElementById('gchart'), { labels: MK.growthRounds.map(n => n + '회'), me: g.all.mean.map(v => Math.round(v)), avg: c0 ? c0.mean.map(v => Math.round(v)) : null, min: lo, max: hi,
      label: `${LAB[k]} 평균 추이: ${g.all.mean.map((v, i) => MK.growthRounds[i] + '회 ' + f1(v)).join(', ')}` });
    const hs = g.hist, mx = Math.max(...hs.map(h => h[1]), 1);
    document.getElementById('gh').innerHTML = `<ol class="sh-hbars sh-hbars--tight" aria-label="점수 변화 분포">${hs.map(([b, v]) => `<li><span class="sh-hbars__k ig-num">${b >= 0 ? '+' : ''}${b} ~ ${b >= 0 ? '+' : ''}${b + g.step - 1}</span><span class="ig-progress__track"><i style="width:${v / mx * 100}%"></i></span><span class="ig-num">${v}</span></li>`).join('')}</ol>`;
  }

  /* ---------- 지망대학 ---------- */
  function vWish(R) {
    const w = R.wishInRec;
    return `
      <div class="ig-grid ig-grid--2">
        <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">1지망 대학</h3><p class="ig-card__sub">${R.n}회 · 학생이 적어 낸 이름 그대로 (표기 통일 전)</p></div></div><div id="w1"></div></section>
        <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">1~3지망 합계</h3><p class="ig-card__sub">세 칸 중 어디든 적힌 횟수</p></div></div><div id="wa"></div></section>
      </div>
      <div class="ig-grid ig-grid--main">
        <section class="ig-card ig-card--flush"><div class="ig-card__head"><div><h3 class="ig-card__title">1지망 대학·학부</h3><p class="ig-card__sub">상위 20</p></div></div>
          <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th class="num">순위</th><th>대학·학부</th><th class="num">학생</th></tr></thead><tbody>${R.wishFac.map(([k, v], i) => `<tr><td class="num">${i + 1}</td><td>${esc(k)}</td><td class="num">${v}</td></tr>`).join('')}</tbody></table></div></section>
        <section class="ig-stat"><span class="ig-stat__label">1지망이 추천 3곳 안에 든 학생</span>
          <span class="ig-stat__value">${w.n >= 50 ? Math.round(w.hit / w.n * 100) : '—'}<small>${w.n >= 50 ? '%' : ''}</small></span>
          <span class="ig-stat__foot">${w.n >= 50 ? `추천을 받은 ${w.n}명 중 ${w.hit}명 · 채점시트 「추천학교1~3」 기준` : w.n ? `이 회차는 추천이 ${w.n}명에게만 적혀 있어 비율을 내지 않습니다` : '이 회차는 채점시트에 추천학교가 없습니다'}</span>
          <p class="sh-note">지망과 추천의 차이가 큰 학생은 상담에서 먼저 볼 대상입니다. 학교 이름 표기를 통일하면(예: 츄오대학 ↔ 中央大学) 추천·합격 곡선과 바로 이어집니다.</p></section>
      </div>`;
  }
  function afterWish(R) { bars(document.getElementById('w1'), R.wish1.slice(0, 15), '1지망 대학 상위'); bars(document.getElementById('wa'), R.wishAll.slice(0, 15), '1~3지망 합계 상위'); }

  /* ---------- 개인 성적표 ---------- */
  function vReport() {
    const S = SH.S, kind = S.kind, sci = S.sci;
    const cols = kind === '문과' ? [['jp', 'jp', '일본어'], ['so', 'so', '종합'], ['math', 'm1', '수학1']] : [['jp', 'jp', '일본어'], [sci[0], sci[0], LAB[sci[0]]], [sci[1], sci[1], LAB[sci[1]]], ['math', 'm2', '수학2']];
    const rows = MK.rounds.map(R => {
      const r = S.rows['m' + R.n] || {};
      const cells = cols.map(([sk, mk]) => { const v = r[sk] != null && r[sk] !== '' ? +r[sk] : null; return { v, p: v == null ? null : topPct(R.subj[mk]?.sorted, v), mean: R.subj[mk]?.mean }; });
      const tot = cells.every(c => c.v != null) ? cells.reduce((t, c) => t + c.v, 0) : null;
      const tk = kind === '문과' ? 'bunka' : 'rika';
      return { R, cells, tot, tp: tot == null ? null : topPct(R.subj[tk]?.sorted, tot), tmean: R.subj[tk]?.mean, has: cells.some(c => c.v != null) };
    });
    const P = SH.predict(), lo = P.total != null ? Math.max(0, Math.round(P.total - P.sd)) : null, hi = P.total != null ? Math.round(P.total + P.sd) : null;
    const cell = c => c.v == null ? '<td class="num ig-muted">—</td>' : `<td class="num"><b>${c.v}</b><span class="sh-sub">상위 ${Math.max(1, Math.round(c.p * 100))}% · 평균 ${f1(c.mean)}</span></td>`;
    return `
      <section class="ig-card"><div class="ig-card__head"><div><p class="ig-pagehead__eyebrow">${MK.year} 전국모의고사 · 개인 성적표</p><h3 class="ig-card__title">${esc(S.name)} <span class="ig-muted" style="font-size:14px;font-weight:600">${kind}</span></h3>
          <p class="ig-card__sub">예측·추천 탭에 넣은 학생의 모의고사 점수를 그 회차 전체 응시자와 비교 · 상위 %는 전체 응시자 기준</p></div>
          <div class="ig-card__actions"><a class="ig-btn ig-btn--sm" href="#pred">${icon('edit')}점수 고치기</a><button type="button" class="ig-btn ig-btn--sm ig-btn--primary" id="prt">${icon('print')}성적표 인쇄</button></div></div>
        <div class="ig-table-wrap"><table class="ig-table ig-table--sticky"><thead><tr><th>회차</th>${cols.map(c => `<th class="num">${c[2]}</th>`).join('')}<th class="num">총점</th></tr></thead>
          <tbody>${rows.map(x => `<tr><td><b>${x.R.n}회</b> <span class="ig-muted" style="font-size:12px">${x.R.takers}명 응시</span></td>${x.cells.map(cell).join('')}<td class="num">${x.tot == null ? '<span class="ig-muted">—</span>' : `<b>${x.tot}</b><span class="sh-sub">상위 ${Math.max(1, Math.round(x.tp * 100))}% · 평균 ${f1(x.tmean)}</span>`}</td></tr>`).join('')}</tbody></table></div>
        ${P.total != null ? `<div class="ig-grid ig-grid--main" style="margin-top:20px"><div class="ig-pred"><span class="ig-pred__label">${P.target === 'a11' ? '11월 EJU 실제 총점' : P.target === 'e6' ? '6월 EJU 예상 총점' : '11월 EJU 예상 총점'}</span><div class="ig-pred__value"><b>${Math.round(P.total)}</b><span>${P.sd ? `보통 ${lo}~${hi}점` : '점'}</span></div></div>
          <p class="sh-note" style="margin:0">틀린 문항 목록은 학생 카드(로그인 뒤)에서 채점시트와 연결되면 함께 나옵니다. 지금은 집계 데이터만 있어 점수·위치만 보여 줍니다.</p></div>` : ''}
        <p class="ig-disclaimer" style="margin-top:16px">${icon('info')}<span>참고용 · 합격을 보장하지 않음 · 최종 판단은 상담 강사와 함께. 학생에게 줄 때는 강사가 확인한 뒤 출력합니다.</span></p>
      </section>`;
  }

  SH.views.mock = (parts) => {
    const sub = SUBS.some(s => s[0] === parts[0]) ? parts[0] : 'sum', R = getRound();
    const body = { sum: vSum, items: vItems, diff: vDiff, growth: vGrowth, wish: vWish, report: vReport }[sub](R);
    app.innerHTML = frame(sub, R) + body;
    wireFrame(sub);
    ({ sum: afterSum, items: afterItems, growth: afterGrowth, wish: afterWish }[sub] || (() => {}))(R);
    const prt = document.getElementById('prt'); if (prt) prt.onclick = () => window.print();
    app.querySelectorAll('[data-dr]').forEach(x => x.onclick = () => { store.set('mockRound', +x.dataset.dr); SH.views.mock(['diff']); });
  };
})();
