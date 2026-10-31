/* 진학 상담 — 전공 찾기: 전공·학과 이름(한국어·日本語)을 넣으면 그 전공이 있는 대학·학부·학과를 학교별로 보여 준다.
 * 데이터: window.YOKO_DATA (2027 모집요강 구조화 데이터, 대학 171곳). 입시 데이터가 없는 학교도 요강에 있으면 나온다.
 * 주소: #major */
(function () {
  "use strict";
  const SH = window.SH, D = window.YOKO_DATA;
  if (!SH) return;
  const { esc, icon, store, pagehead } = SH;
  const app = document.getElementById('app');
  if (!D) {
    SH.views.major = () => { app.innerHTML = pagehead('진학 상담 · 전공 찾기', '전공 찾기', '') + `<div class="ig-card ig-empty">${icon('book', '')}<b>모집요강 데이터가 없어요</b></div>`; };
    return;
  }

  const norm = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[\s·・()（）\-_.,/]/g, '');
  const uniKo = doc => (SH.KO && SH.KO.univ[doc.univ.ja]) || doc.univ.ko;
  /* 흔한 전공 이름: 한국어 ↔ 일본어 (요강 한국어 번역과 원문 표기가 달라도 찾히게) */
  const SYN = [['경영', '経営', '비즈니스', 'business', '商'], ['경제', '経済'], ['법', '法'], ['정치', '政治'], ['사회', '社会'], ['심리', '心理'], ['교육', '教育'],
    ['문학', '文学'], ['외국어', '外国語'], ['국제', '国際', 'global', '글로벌'], ['문화', '文化'], ['인문', '人文'], ['정보', '情報', '컴퓨터', 'computer'], ['공학', '工学'], ['이공', '理工'],
    ['이학', '理学', '자연과학'], ['수학', '数学'], ['물리', '物理'], ['화학', '化学'], ['생명', '生命', '생물', '生物'], ['환경', '環境'], ['농학', '農学', '농'], ['수의', '獣医'],
    ['의학', '医学', '의과'], ['치의', '歯学', '치학'], ['약학', '薬学'], ['간호', '看護'], ['보건', '保健'], ['건축', '建築'], ['토목', '土木'], ['기계', '機械'], ['전기', '電気'], ['전자', '電子'],
    ['디자인', 'デザイン'], ['예술', '芸術', '미술', '美術'], ['음악', '音楽'], ['체육', 'スポーツ', '스포츠'], ['관광', '観光'], ['복지', '福祉'], ['미디어', 'メディア', '커뮤니케이션', 'コミュニケーション'],
    ['종합정책', '総合政策'], ['상학', '商学'], ['회계', '会計'], ['역사', '史学', '歴史'], ['철학', '哲学'], ['언어', '言語'], ['영문', '英文', '영어', '英語'], ['지리', '地理'], ['신학', '神学']];
  const synOf = t => { const n = norm(t), out = new Set([n]); SYN.forEach(g => { const ns = g.map(norm); if (ns.some(x => x === n || (n.length >= 2 && x.includes(n)) || (x.length >= 2 && n.includes(x) && n.length <= x.length + 1))) ns.forEach(x => out.add(x)); }); return [...out]; };

  const UNITS = [];
  D.docs.forEach(doc => doc.tracks.forEach(tr => tr.units.forEach((u, i) => {
    UNITS.push({ doc, tr, u, i, key: `${doc.id}/${tr.id}/${i}`,
      major: norm([u.fac, u.fac_ja, u.dept].join(' ')),
      all: norm([doc.univ.ko, uniKo(doc), doc.univ.ja, ...(doc.univ.aliases || []), u.fac, u.fac_ja, u.dept, doc.univ.region].join(' ')) });
  })));
  const need = (x, k) => x.u.eju && (x.u.eju[k] === 'R' || x.u.eju[k] === 'C');
  const kindOk = (x, k) => k === 'all' || (k === '이과' ? need(x, 'ri') : (need(x, 'so') || need(x, 'm1') || !need(x, 'ri')));
  const EJU = [['jp', '일본어'], ['so', '종합'], ['m1', '수1'], ['m2', '수2'], ['ri', '이과']];
  const chip = x => EJU.filter(([k]) => x.u.eju && x.u.eju[k] === 'R').map(([, l]) => `<span class="ig-badge">${l}</span>`).join(' ') + EJU.filter(([k]) => x.u.eju && x.u.eju[k] === 'C').map(([, l]) => `<span class="ig-badge ig-badge--soft">${l} 선택</span>`).join(' ');
  const TYPES = ['전체', '국립', '공립', '사립'];

  function search(q, type, kind) {
    const toks = String(q).normalize('NFKC').trim().split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    const alts = toks.map(synOf);
    return UNITS.filter(x => (type === '전체' || x.doc.univ.type === type) && kindOk(x, kind) &&
      alts.every(a => a.some(t => x.major.includes(t) || (t.length >= 2 && x.all.includes(t)))));
  }

  SH.views.major = () => {
    let q = store.get('majorQ', ''), type = store.get('majorType', '전체'), kind = store.get('majorKind', 'all');
    app.innerHTML = pagehead('진학 상담 · 전공 찾기', '전공 찾기', '전공·학과 이름을 넣으면 그 전공이 있는 대학을 학교별로 모아 보여 줍니다 (2027 모집요강 기준). 학교 이름을 같이 넣어 좁힐 수도 있어요.') + `
      <section class="ig-card sh-major">
        <div class="sh-bigsearch"><label class="ig-field"><span class="ig-sr">전공·학과 검색</span><span class="ig-field__control">${icon('search', '')}<input class="ig-input" id="mq" type="search" placeholder="전공·학과 (한국어·日本語) — 예: 경영, 심리, 情報, 건축, 와세다 법" autocomplete="off" value="${esc(q)}"></span></label></div>
        <div class="sh-row" style="gap:16px;flex-wrap:wrap;margin-top:8px">
          <div class="ig-seg" role="group" aria-label="설립 구분" id="mtype">${TYPES.map(t => `<button type="button" value="${t}" aria-pressed="${t === type}">${t}</button>`).join('')}</div>
          <div class="ig-seg" role="group" aria-label="계열" id="mkind">${[['all', '계열 전체'], ['문과', '문과 가능'], ['이과', '이과 가능']].map(([v, l]) => `<button type="button" value="${v}" aria-pressed="${v === kind}">${l}</button>`).join('')}</div>
        </div></section>
      <div id="mres"></div>`;
    const res = document.getElementById('mres');
    const draw = () => {
      if (!q.trim()) { res.innerHTML = `<div class="ig-card ig-empty">${icon('search', '')}<b>전공이나 학과를 입력하세요</b><p>예: 경영 · 심리 · 情報 · 건축 · 국제 · 간호</p></div>`; return; }
      const hits = search(q, type, kind), by = new Map();
      hits.forEach(x => { if (!by.has(x.doc.id)) by.set(x.doc.id, []); by.get(x.doc.id).push(x); });
      const docs = [...by.values()];
      if (!docs.length) { res.innerHTML = `<div class="ig-card ig-empty">${icon('school', '')}<b>찾는 전공이 요강에 없어요</b><p>다른 표현(한국어·일본어)으로 다시 찾아보세요.</p></div>`; return; }
      res.innerHTML = `<p class="ig-muted" style="margin:8px 2px">${docs.length}개 대학 · ${hits.length}개 학부·학과</p>` + docs.slice(0, 80).map(list => {
        const doc = list[0].doc;
        return `<section class="ig-card ig-card--flush sh-major__univ"><div class="ig-card__head"><div><h3 class="ig-card__title"><a href="${SH.hrefSchool(doc.univ.ja)}">${esc(uniKo(doc))}</a> <span class="ig-jp ig-muted" lang="ja">${esc(doc.univ.ja)}</span></h3><p class="ig-card__sub">${esc(doc.univ.type || '')}${doc.univ.region ? ' · ' + esc(doc.univ.region) : ''}</p></div></div>
          <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>학부 · 학과</th><th>전형</th><th>EJU 과목</th><th></th></tr></thead><tbody>
          ${list.slice(0, 40).map(x => `<tr><td><b>${esc(x.u.fac)}</b>${x.u.dept ? `<div class="ig-muted">${esc(x.u.dept)}</div>` : ''}<span class="ig-jp ig-muted" lang="ja">${esc(x.u.fac_ja || '')}</span></td><td>${esc(x.tr.name_ko)}</td><td>${chip(x) || '<span class="ig-muted">—</span>'}</td><td><a class="ig-btn ig-btn--ghost" href="#yoko/s/${x.key}">지원 요약</a></td></tr>`).join('')}
          </tbody></table></div>${list.length > 40 ? `<p class="ig-muted" style="padding:6px 12px">… 외 ${list.length - 40}곳 (검색어를 더 좁혀 보세요)</p>` : ''}</section>`;
      }).join('') + (docs.length > 80 ? `<p class="ig-muted">상위 80개 대학만 보여요. 검색어를 더 좁혀 보세요.</p>` : '');
    };
    let t; const mq = document.getElementById('mq');
    mq.oninput = () => { q = mq.value; store.set('majorQ', q); clearTimeout(t); t = setTimeout(draw, 120); };
    app.querySelectorAll('#mtype button').forEach(b => b.onclick = () => { type = b.value; store.set('majorType', type); app.querySelectorAll('#mtype button').forEach(c => c.setAttribute('aria-pressed', c === b)); draw(); });
    app.querySelectorAll('#mkind button').forEach(b => b.onclick = () => { kind = b.value; store.set('majorKind', kind); app.querySelectorAll('#mkind button').forEach(c => c.setAttribute('aria-pressed', c === b)); draw(); });
    draw();
  };
})();
