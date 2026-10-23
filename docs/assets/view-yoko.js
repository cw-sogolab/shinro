/* 진학 상담 — 「모집요강」 탭 (예전 要項ノート). 데이터: window.YOKO_DATA (tools/build_yoko.py가 만든 assets/yoko.js)
 * 주소: #yoko · #yoko/s/<대학>/<전형>/<번호> (지원 요약) · #yoko/d · #yoko/d/<대학>?p=<쪽> (번역) · #yoko/g (용어집) */
(function () {
  "use strict";
  const SH = window.SH, D = window.YOKO_DATA, IG = window.Ilgong;
  if (!SH) return;
  const { esc, icon, store, ISO, parse, WD, md: mdDate, fmt, range, dday, yen, pagehead } = SH;
  const app = document.getElementById('app');

  const norm = s => String(s || '').toLowerCase().replace(/[\s·・()（）\-]/g, '');
  const EJU = [['jp', '일본어'], ['ki', '기술'], ['so', '종합과목'], ['m1', '수학 코스1'], ['m2', '수학 코스2'], ['ri', '이과']];
  const REQ = { R: '필수', C: '선택', N: '불필요', U: '언급 없음' };
  const EJUCLS = { R: 'r', C: 'c', N: 'n', U: 'n' };
  const DOCREQ = { '필수': 'must', '일부 필수': 'partial', '해당자': 'cond', '임의': 'opt' };
  const src = (doc, p) => p ? `<a class="ig-src" href="#yoko/d/${doc.id}?p=${p}">원문 ${p}쪽</a>` : '';
  const uniKo = doc => (SH.KO.univ[doc.univ.ja] || doc.univ.ko);
  const sub = (y) => `<div class="ig-seg sh-subnav" role="group" aria-label="모집요강 보기">${[['', '학교 찾기'], ['s', '지원 요약'], ['d', '요강 번역'], ['g', '용어집']].map(([k, l]) => `<a href="#yoko${k ? '/' + k : ''}" role="button" aria-pressed="${y === k}">${l}</a>`).join('')}</div>`;

  if (!D) {
    SH.views.yoko = () => { app.innerHTML = pagehead('진학 상담 · 모집요강', '모집요강', '') + `<div class="ig-card ig-empty">${icon('book', '')}<b>모집요강 데이터가 없어요</b><p><code>python3 tools/build_yoko.py</code>를 먼저 실행하세요.</p></div>`; };
    return;
  }

  const UNITS = [];
  D.docs.forEach(doc => doc.tracks.forEach(tr => tr.units.forEach((u, i) => {
    UNITS.push({ doc, tr, u, i, key: `${doc.id}/${tr.id}/${i}`,
      hay: norm([doc.univ.ko, uniKo(doc), doc.univ.ja, ...(doc.univ.aliases || []), u.fac, u.fac_ja, u.dept, tr.name_ko].join(' ')) });
  })));
  const findUnit = key => UNITS.find(x => x.key === key);
  const applyOf = tr => tr.schedule.find(s => s.k === 'apply');

  /* 작은 마크다운: 문단·굵게·목록(들여쓰기 1단)·표 */
  function mdown(srcText) {
    const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const lines = srcText.split('\n'); let out = '', i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      if (/^\|/.test(l)) {
        const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
        const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const head = cells(rows[0]), body = rows.slice(2).map(cells), isNum = c => /^[\d,]+$/.test(c);
        out += '<div class="ig-table-wrap sh-mdtable"><table class="ig-table"><thead><tr>' + head.map(h => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>' +
          body.map(r => '<tr>' + r.map(c => `<td class="${isNum(c) ? 'num' : ''}">${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
        continue;
      }
      const m = l.match(/^(\s*)(- |\d+\. )/);
      if (m && !m[1]) {
        const ordered = /\d/.test(m[2]); let html = '', open = false;
        while (i < lines.length && /^(\s*)(- |\d+\. )/.test(lines[i])) {
          const mm = lines[i].match(/^(\s*)(- |\d+\. )(.*)$/);
          if (mm[1].length >= 2) { if (!open) { html = html.replace(/<\/li>$/, '') + '<ul>'; open = true; } html += `<li>${inline(mm[3])}</li>`; }
          else { if (open) { html += '</ul></li>'; open = false; } html += `<li>${inline(mm[3])}</li>`; }
          i++;
        }
        if (open) html += '</ul></li>';
        out += ordered ? `<ol>${html}</ol>` : `<ul>${html}</ul>`;
        continue;
      }
      const para = []; while (i < lines.length && lines[i].trim() && !/^\|/.test(lines[i]) && !/^(- |\d+\. )/.test(lines[i])) para.push(lines[i++]);
      out += `<p>${para.map(inline).join('<br>')}</p>`;
    }
    return out;
  }

  /* ---------- 학교 찾기 (홈) ---------- */
  function viewHome() {
    const showPast = store.get('yokoPast', false);
    const ev = [];
    D.docs.forEach(doc => doc.tracks.forEach(tr => tr.schedule.forEach(s => {
      if (!['apply', 'exam', 'result', 'result1', 'enroll', 'info'].includes(s.k)) return;
      ev.push({ doc, tr, s, end: s.end || s.start });
    })));
    ev.sort((a, b) => a.s.start.localeCompare(b.s.start));
    const list = showPast ? ev : ev.filter(e => e.end >= ISO);
    const nextIdx = list.findIndex(e => e.end >= ISO);
    app.innerHTML = pagehead('진학 상담 · 모집요강', '모집요강', `2027학년도 외국인유학생 입시 · ${D.docs.length}건 정리 · 일정·EJU 기준·영어·서류·비용을 원문 쪽수와 함께`, sub('')) + `
      <section class="ig-card sh-search">
        <label class="ig-field"><span class="ig-field__label">대학·학부 찾기</span><span class="ig-field__control">${icon('search', '')}<input class="ig-input" id="q" type="search" placeholder="예: 호세이 경영, 一橋, 도쿄대 이과" autocomplete="off"></span></label>
        <div class="sh-sugg" id="sugg" role="listbox" aria-label="찾은 학부"></div>
        <p class="sh-note">예시: ${['호세이 경영', '도쿄대 이과', '一橋'].map(q => `<button type="button" class="sh-linkbtn" data-q="${q}">${q}</button>`).join(' · ')}</p>
      </section>
      <div class="ig-grid ig-grid--main">
        <section>
          <div class="ig-section-h"><h2>다가오는 일정</h2><span class="ig-muted sh-sec-meta">오늘 ${fmt(ISO)}</span>
            <label class="sh-check" style="margin-left:auto;min-height:0"><input type="checkbox" id="past" ${showPast ? 'checked' : ''}>지난 일정도</label></div>
          <div class="ig-card">${list.length ? `<ol class="ig-tl">${list.map((e, i) => `
            <li class="${e.end < ISO ? 'is-past' : ''} ${i === nextIdx ? 'is-next' : ''}">
              <div class="ig-tl__date">${mdDate(e.s.start)}<small>(${WD[parse(e.s.start).getDay()]})${e.s.end && e.s.end !== e.s.start ? ' ~ ' + mdDate(e.s.end) : ''}</small></div><span class="ig-tl__dot"></span>
              <div class="ig-tl__what"><b><a href="#yoko/s/${e.doc.id}/${e.tr.id}/0">${esc(uniKo(e.doc))}</a> · ${esc(e.s.label)}</b><span>${esc(e.tr.name_ko)}${e.s.time ? ' · ' + esc(e.s.time) : ''}</span><div>${dday(e.s)}</div></div></li>`).join('')}</ol>`
            : `<div class="ig-empty">${icon('calendar', '')}<p>남은 일정이 없습니다.</p></div>`}</div>
        </section>
        <section>
          <div class="ig-section-h"><h2>정리된 모집요강</h2><span class="ig-muted sh-sec-meta">${D.docs.length}건</span></div>
          <div class="sh-stack">${D.docs.map(doc => doc.tracks.map(tr => { const a = applyOf(tr); return `
            <a class="ig-card sh-doccard" href="#yoko/s/${doc.id}/${tr.id}/0">
              <div class="ig-school"><b>${esc(uniKo(doc))}</b><span class="ig-jp" lang="ja">${esc(doc.univ.ja)}</span></div>
              <span class="ig-muted" style="font-size:13px">${esc(tr.name_ko)}</span>
              <div class="sh-row"><span class="ig-badge">${esc(doc.univ.type)}</span><span class="ig-badge">${tr.units.length}개 모집 단위</span>${doc.status === 'draft' ? '<span class="ig-verify">검수 전</span>' : ''}</div>
              <div class="sh-row"><span class="ig-muted" style="font-size:12px">출원 ${range(a)}</span>${dday(a)}</div>
            </a>`; }).join('')).join('')}</div>
        </section>
      </div>`;
    document.getElementById('past').onchange = e => { store.set('yokoPast', e.target.checked); viewHome(); };
    bindSearch(document.getElementById('q'), document.getElementById('sugg'));
    app.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const q = document.getElementById('q'); q.value = b.dataset.q; q.dispatchEvent(new Event('input')); q.focus(); });
  }
  function bindSearch(input, box) {
    let act = -1;
    const run = () => {
      const terms = input.value.trim().split(/\s+/).map(norm).filter(Boolean);
      if (!terms.length) { box.innerHTML = ''; return; }
      const hits = UNITS.filter(x => terms.every(t => x.hay.includes(t))).slice(0, 12); act = -1;
      box.innerHTML = hits.length ? hits.map(x => `<a href="#yoko/s/${x.key}"><span><b>${esc(uniKo(x.doc))}</b> ${esc(x.u.fac)}${x.u.dept ? `<span class="ig-muted"> · ${esc(x.u.dept)}</span>` : ''}</span><small>${esc(x.tr.name_ko)}</small></a>`).join('')
        : '<p class="ig-muted" style="margin:8px 0 0;font-size:13px">맞는 학부가 없습니다. 아직 정리하지 않은 모집요강일 수 있어요.</p>';
    };
    input.addEventListener('input', run);
    input.addEventListener('keydown', e => {
      const items = [...box.querySelectorAll('a')]; if (!items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((a, i) => a.setAttribute('aria-current', i === act)); }
      if (e.key === 'Enter') { e.preventDefault(); location.hash = (items[act] || items[0]).getAttribute('href'); }
    });
  }

  /* ---------- 지원 요약 ---------- */
  function viewSummary(key) {
    const x = (key && findUnit(key)) || UNITS[0];
    const { doc, tr, u } = x;
    const ap = applyOf(tr), y = SH.yokoByKey(x.key), ck = store.get('chk.' + doc.id + '/' + tr.id, {});
    const cu = SH.curveFor(y), ckey = SH.cmpKeyForYoko(y), inC = SH.cmp.includes(ckey);
    const P = SH.predict(), r = cu ? SH.evalUnit(cu, P) : null;
    const byFac = []; tr.units.forEach((uu, i) => { const g = byFac.find(f => f.fac === uu.fac); g ? g.items.push([uu, i]) : byFac.push({ fac: uu.fac, items: [[uu, i]] }); });
    const multi = byFac.some(f => f.items.length > 1);
    const rc = tr.results, res = u.res;
    const done = tr.documents.filter((d, i) => ck[i]).length;
    const unitTitle = `${u.fac}${u.dept ? ' · ' + u.dept : ''}`;
    const kr = t => /한국|검정고시|수능/.test(t);

    app.innerHTML = pagehead('진학 상담 · 모집요강 · 지원 요약', `${esc(uniKo(doc))} <span class="sh-h-sub">${esc(unitTitle)}</span>`,
      `<span class="ig-jp" lang="ja">${esc(doc.univ.ja)} ${esc(u.fac_ja || '')}</span> · ${esc(tr.name_ko)} · ${esc(tr.intake)} 입학${doc.status === 'draft' ? ' · <span class="ig-verify">검수 전 데이터</span>' : ''}`, sub('s')) + `
      <div class="sh-yoko">
        <aside class="ig-card sh-picker" aria-label="대학·전형·학부 고르기">
          <label class="ig-field"><span class="ig-field__label">대학 · 전형</span>
            <select class="ig-input" id="selU">${D.docs.map(d => d.tracks.map(t => `<option value="${d.id}/${t.id}/0" ${d === doc && t === tr ? 'selected' : ''}>${esc(uniKo(d))} — ${esc(t.name_ko)}</option>`).join('')).join('')}</select></label>
          <p class="ig-field__label" style="margin:16px 0 0">학부 · 학과 (${tr.units.length})</p>
          <div class="sh-list">${byFac.map(f => (multi && f.items.length > 1 ? `<p class="sh-list__group">${esc(f.fac)}</p>` : '') + f.items.map(([uu, i]) =>
            `<a href="#yoko/s/${doc.id}/${tr.id}/${i}" aria-current="${i === x.i}"><span>${multi && f.items.length > 1 ? esc(uu.dept) : esc(uu.fac)}${!(multi && f.items.length > 1) && uu.dept ? `<small class="ig-muted"> ${esc(uu.dept)}</small>` : ''}</span></a>`).join('')).join('')}</div>
        </aside>
        <article class="sh-yoko__main">
          <section class="ig-card">
            <div class="ig-card__head"><div><p class="ig-pagehead__eyebrow">지원에 필요한 것 한 장</p><h2 class="ig-card__title">${esc(tr.one_liner || tr.name_ko)}</h2></div>
              <div class="ig-card__actions"><a class="ig-btn ig-btn--sm" href="#yoko/d/${doc.id}">${icon('translate')}번역 보기</a><a class="ig-btn ig-btn--sm ig-btn--ghost" href="${esc(doc.doc.official_url)}" target="_blank" rel="noopener">${icon('external')}공식 페이지</a>${SH.addBtn(ckey, inC, 'ycmp')}</div></div>
            <dl class="ig-kv">
              <div><dt>출원 기간 ${src(doc, ap.p)}</dt><dd>${range(ap)} ${dday(ap)}<small>${esc(ap.time || '')}${ap.note ? ' · ' + esc(ap.note) : ''}</small></dd></div>
              <div><dt>모집 인원 ${src(doc, tr.units_p)}</dt><dd>${esc(u.quota)}${typeof u.quota === 'number' ? '명' : ''}<small>${rc && res ? `작년 지원 ${res[0]}명` : ''}</small></dd></div>
              <div><dt>EJU 일본어</dt><dd>${u.eju.jp_min ? u.eju.jp_min + '점 이상' : u.eju.combo ? '합계 기준' : '기준점 비공개'}<small>${esc(u.eju.combo || '독해·청해·청독해 400점 만점')}</small></dd></div>
              <div><dt>영어 시험 ${u.en !== 'N' ? src(doc, tr.english.p) : ''}</dt><dd>${u.en === 'R' ? '필요' : u.en === 'C' ? '선택' : '불필요'}<small>${u.en === 'N' ? '이 학과는 영어 성적을 내지 않음' : esc(tr.english.tests)}</small></dd></div>
            </dl>
            ${cu ? `<div class="sh-chance">
              <div><p class="ig-pred__label">${esc(SH.S.name)}의 합격 가능성 <span class="ig-muted">· ${SH.S.kind} · ${r ? `비교 점수 ${r.x}점` : '점수 없음'}</span></p>
                ${r ? `<div class="ig-chance ig-chance--${SH.ZK[r.z] || 'try'}"><span class="ig-chance__bar"><i style="width:${Math.round(r.p * 100)}%"></i></span><span class="ig-chance__pct">${SH.pct(r.p)}</span></div>` : ''}</div>
              <div class="sh-row">${r ? SH.zoneChip(r.z) : ''}<a class="ig-src" href="#curve" data-curve="${SH.C.units.indexOf(cu)}">학부 곡선 보기</a></div></div>` : ''}
            ${tr.cautions.filter(c => c.kr).map(c => `<p class="ig-krnote"><b>한국 학생</b>${esc(c.t)} ${src(doc, c.p)}</p>`).join('')}
          </section>

          <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">EJU 과목</h3><p class="ig-card__sub">응시 회차 ${tr.eju_sessions.map(s => s.replace('-', '년 ') + '월').join(' · ')}</p></div>${src(doc, tr.units_p)}</div>
            <div class="ig-eju">${EJU.map(([k, l]) => { const v = u.eju[k]; return `<span class="${EJUCLS[v]}">${l} ${REQ[v]}${k === 'jp' && u.eju.jp_min ? ` · ${u.eju.jp_min}점↑` : ''}</span>`; }).join('')}</div>
            ${u.eju.ri_note && u.eju.ri !== 'N' ? `<p class="sh-note">이과: ${esc(u.eju.ri_note)}</p>` : ''}
            ${u.eju.combo ? `<p class="sh-note"><b>점수 조건</b> · ${esc(u.eju.combo)}</p>` : ''}
            ${EJU.some(([k]) => u.eju[k] === 'C') ? '<p class="sh-note">「선택」 과목은 둘 중 하나를 응시합니다. 둘 다 보면 대학 규칙에 따라 판정합니다 (원문 확인).</p>' : ''}
            ${tr.eju_note ? `<p class="sh-note">${esc(tr.eju_note)}</p>` : ''}
          </section>

          ${u.en !== 'N' ? `<section class="ig-card"><div class="ig-card__head"><h3 class="ig-card__title">영어 시험</h3>${src(doc, tr.english.p)}</div>
            <dl class="ig-kv"><div><dt>시험</dt><dd>${esc(tr.english.tests)}</dd></div><div><dt>기준</dt><dd>${esc(tr.english.min)}</dd></div><div><dt>유효 기간</dt><dd>${esc(tr.english.valid)}</dd></div><div><dt>제출 방법</dt><dd>${esc(tr.english.how)}</dd></div></dl>
            ${tr.english.not_allowed?.length ? `<p class="sh-note"><b>인정 안 됨</b> · ${tr.english.not_allowed.map(esc).join(', ')}${tr.english.allowed_note ? ' · ' + esc(tr.english.allowed_note) : ''}</p>` : ''}
            ${u.en_note ? `<p class="sh-note"><b>이 학과</b> · ${esc(u.en_note)}</p>` : ''}</section>` : ''}

          <section class="ig-card"><div class="ig-card__head"><h3 class="ig-card__title">일정</h3><span class="ig-muted" style="font-size:12px">오늘 ${fmt(ISO)}</span></div>
            <ol class="ig-tl">${(() => { const ni = tr.schedule.findIndex(s => (s.end || s.start) >= ISO); return tr.schedule.map((s, i) => `
              <li class="${(s.end || s.start) < ISO ? 'is-past' : ''} ${i === ni ? 'is-next' : ''}"><div class="ig-tl__date">${mdDate(s.start)}<small>(${WD[parse(s.start).getDay()]})${s.end && s.end !== s.start ? ' ~ ' + mdDate(s.end) : ''}</small></div><span class="ig-tl__dot"></span>
                <div class="ig-tl__what"><b>${esc(s.label)}</b><span>${s.time ? esc(s.time) + ' · ' : ''}${esc(s.note || '')} ${src(doc, s.p)}</span><div>${dday(s)}</div></div></li>`).join(''); })()}</ol></section>

          <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">출원 자격</h3><p class="ig-card__sub">모두 충족해야 합니다</p></div></div>
            <ul class="sh-lines2">${tr.eligibility.map(e => `<li>${kr(e.t) ? '<span class="ig-kr">한국 학생</span>' : ''}<span>${esc(e.t)}</span>${src(doc, e.p)}</li>`).join('')}</ul></section>

          <section class="ig-card"><div class="ig-card__head"><h3 class="ig-card__title">선발 방법</h3></div>
            <ul class="sh-lines2">${tr.selection.map(s => `<li><span class="ig-badge">${esc(s.stage)}</span><span><b>${esc(s.method)}</b>${s.detail ? `<small class="sh-sub">${esc(s.detail)}</small>` : ''}</span>${src(doc, s.p)}</li>`).join('')}
              ${u.note ? `<li><span class="ig-badge ig-badge--info">이 학과</span><span><b>${esc(u.note)}</b></span></li>` : ''}</ul>
            ${tr.scoring ? `<div class="ig-table-wrap" style="margin-top:12px"><table class="ig-table"><thead><tr>${tr.scoring.cols.map((c, i) => `<th class="${i ? 'num' : ''}">${esc(c)}</th>`).join('')}</tr></thead><tbody>${tr.scoring.rows.map(rw => `<tr>${rw.map((c, i) => `<td class="${i ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}</section>

          <section class="ig-card"><div class="ig-card__head"><div><h3 class="ig-card__title">서류 체크리스트</h3><p class="ig-card__sub">체크는 이 기기에만 저장됩니다</p></div></div>
            <div class="ig-progress" id="dp"><div class="ig-progress__row"><span>서류 준비</span><span data-count>${done} / ${tr.documents.length}</span></div><div class="ig-progress__track"><i style="width:${done / tr.documents.length * 100}%"></i></div></div>
            <ul class="ig-checklist" id="docs">${tr.documents.map((d, i) => `
              <li class="${ck[i] ? 'is-done' : ''}"><label for="dc${i}"><input type="checkbox" id="dc${i}" data-i="${i}" ${ck[i] ? 'checked' : ''}><span class="ig-sr">${esc(d.n)} 준비됨</span></label>
                <span class="ig-check__name">${esc(d.n)}${d.note ? `<small class="sh-sub">${esc(d.note)}</small>` : ''}${d.kr ? `<small class="sh-sub" style="color:var(--kr)">한국 학생 · ${esc(d.kr)}</small>` : ''}</span>
                <span class="ig-check__meta"><span class="ig-req ig-req--${DOCREQ[d.req] || 'opt'}">${esc(d.req)}</span>${d.kr ? '<span class="ig-kr">한국 학생</span>' : ''}${src(doc, d.p)}</span></li>`).join('')}</ul></section>

          <section class="ig-card"><div class="ig-card__head"><h3 class="ig-card__title">비용</h3><div class="sh-row">${tr.fees.confidence === 'medium' ? '<span class="ig-verify">원문 표 확인 필요</span>' : ''}${src(doc, tr.fees.p)}</div></div>
            <dl class="ig-kv"><div><dt>입학검정료</dt><dd>${yen(tr.fees.exam)}<small>${esc(tr.fees.exam_note || '')}</small></dd></div>
              ${tr.fees.tuition.map(t => `<div><dt>${esc(t.label)}</dt><dd>1년차 ${yen(t.first_year)}<small>입학 수속 때 ${yen(t.at_enroll)}${t.detail ? ' · ' + esc(t.detail) : ''}</small></dd></div>`).join('')}</dl>
            ${tr.fees.tuition_note ? `<p class="sh-note">${esc(tr.fees.tuition_note)}</p>` : ''}</section>

          ${rc && res ? `<section class="ig-card ig-card--flush"><div class="ig-card__head"><h3 class="ig-card__title">${esc(rc.title)}</h3>${src(doc, rc.p)}</div>
            <div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>모집 단위</th>${rc.cols.map(c => `<th class="num">${esc(c)}</th>`).join('')}<th class="num">지원÷합격</th></tr></thead><tbody>
              ${tr.units.filter(uu => uu.res).map(uu => { const last = uu.res[uu.res.length - (rc.cols.length === 4 && rc.cols[3] === '입학자' ? 2 : 1)]; return `<tr class="${uu === u ? 'sh-hl' : ''}"><td>${esc(uu.fac)}${uu.dept && tr.units.filter(z => z.fac === uu.fac).length > 1 ? ' · ' + esc(uu.dept) : ''}</td>${uu.res.map(n => `<td class="num">${n}</td>`).join('')}<td class="num">${last ? (uu.res[0] / last).toFixed(1) + ' : 1' : '—'}</td></tr>`; }).join('')}
            </tbody></table></div>
            <div class="ig-card__foot">${rc.extra ? `<p class="sh-note" style="margin:0">${esc(rc.extra)}</p>` : ''}${u.score ? `<p class="sh-note"><b>이 학부</b> · ${esc(u.score)}</p>` : ''}</div></section>` : ''}

          <section class="ig-card"><div class="ig-card__head"><h3 class="ig-card__title">주의 사항</h3></div>
            <ul class="sh-lines2">${tr.cautions.map(c => `<li>${c.kr ? '<span class="ig-kr">한국 학생</span>' : `<span class="ig-ring ig-ring--sm" aria-hidden="true" style="margin-top:4px"></span>`}<span>${esc(c.t)}</span>${src(doc, c.p)}</li>`).join('')}</ul></section>

          <section class="ig-card sh-row" style="justify-content:space-between">
            <div><b>원문 확인</b><p class="ig-muted" style="margin:2px 0 0;font-size:13px"><span class="ig-jp" lang="ja">${esc(doc.doc.title_ja)}</span> · ${doc.doc.pages}쪽</p></div>
            <div class="sh-row"><a class="ig-btn" href="#yoko/d/${doc.id}">${icon('translate')}한국어 번역 보기</a><a class="ig-btn ig-btn--primary" href="${esc(doc.doc.official_url)}" target="_blank" rel="noopener">${icon('external')}공식 입시 페이지</a></div>
          </section>
          <p class="ig-disclaimer">${icon('info')}<span>요약은 참고용 · 최종 기준은 공식 모집요강과 입시 홈페이지 · 마감 7일 전에 담당 강사가 공식 페이지에서 날짜를 다시 확인합니다.</span></p>
        </article>
      </div>`;

    document.getElementById('selU').onchange = e => SH.go('yoko/s/' + e.target.value);
    document.getElementById('ycmp').onclick = () => SH.toggleCmp(ckey, () => viewSummary(x.key));
    app.querySelectorAll('[data-curve]').forEach(a => a.onclick = e => { e.preventDefault(); SH.showCurve(+a.dataset.curve); });
    document.getElementById('docs').addEventListener('change', e => {
      const i = e.target.dataset.i; if (i == null) return;
      ck[i] = e.target.checked; if (!ck[i]) delete ck[i];
      store.set('chk.' + doc.id + '/' + tr.id, ck);
      e.target.closest('li').classList.toggle('is-done', e.target.checked);
      const n = Object.keys(ck).length, dp = document.getElementById('dp');
      dp.querySelector('[data-count]').textContent = `${n} / ${tr.documents.length}`;
      dp.querySelector('i').style.width = n / tr.documents.length * 100 + '%';
      dp.classList.toggle('ig-progress--done', n === tr.documents.length);
    });
  }

  /* ---------- 요강 번역 ---------- */
  function viewDocList() {
    app.innerHTML = pagehead('진학 상담 · 모집요강 · 요강 번역', '모집요강 한국어 · 일본어', '원문 순서대로 주요 장을 옮겼습니다. 장마다 원문 쪽수와 일본어 원문을 붙였습니다 (한국어 / 日本語 / 나란히).', sub('d')) +
      `<div class="ig-grid ig-grid--3">${D.docs.map(d => `<a class="ig-card sh-doccard" href="#yoko/d/${d.id}"><div class="ig-school"><b>${esc(uniKo(d))}</b><span class="ig-jp" lang="ja">${esc(d.doc.title_ja)}</span></div>
        <div class="sh-row"><span class="ig-badge">${d.translation.length}개 장 번역</span><span class="ig-badge">원문 ${d.doc.pages}쪽</span></div></a>`).join('')}</div>`;
  }
  function viewDoc(id, p) {
    const doc = D.docs.find(d => d.id === id); if (!doc) return viewDocList();
    const tr = doc.tracks[0];
    const tableFor = kind => {
      if (kind === 'results' && tr.results) return `<div class="ig-table-wrap sh-mdtable"><table class="ig-table"><thead><tr><th>학부</th><th>학과</th>${tr.results.cols.map(c => `<th class="num">${esc(c)}</th>`).join('')}</tr></thead><tbody>${tr.units.map(u => `<tr><td>${esc(u.fac)}</td><td>${esc(u.dept)}</td>${(u.res || []).map(n => `<td class="num">${n}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      if (kind === 'units') return `<div class="ig-table-wrap sh-mdtable"><table class="ig-table"><thead><tr><th>학부</th><th>학과</th><th>캠퍼스</th><th class="num">모집</th>${EJU.map(([, l]) => `<th>${l}</th>`).join('')}<th>영어</th></tr></thead><tbody>${tr.units.map(u => `<tr><td>${esc(u.fac)}</td><td>${esc(u.dept)}</td><td>${esc(u.campus || '')}</td><td class="num">${esc(u.quota)}</td>${EJU.map(([k]) => `<td>${u.eju[k] === 'R' ? '◎' : u.eju[k] === 'C' ? '○' : u.eju[k] === 'U' ? '–' : '×'}${k === 'jp' && u.eju.jp_min ? ' ' + u.eju.jp_min + '↑' : ''}</td>`).join('')}<td>${u.en === 'R' ? '◎' : '×'}</td></tr>`).join('')}</tbody></table></div>`;
      return '';
    };
    const target = p ? (doc.translation.slice().reverse().find(s => s.p <= p) || doc.translation[0]) : null;
    const JA = (window.YOKO_JA || {})[doc.id] || null;
    const lang = JA ? store.get('yokoLang', 'ko') : 'ko';
    const langSeg = JA ? `<div class="ig-seg" role="group" aria-label="언어" id="ylang">${[['ko', '한국어'], ['ja', '日本語'], ['both', '나란히']].map(([v, l]) => `<button type="button" value="${v}" aria-pressed="${v === lang}">${l}</button>`).join('')}</div>` : '';
    const jaBlock = s => JA && JA[s.id] ? `<div class="sh-ja" lang="ja"><p class="sh-ja__src">原文 · ${esc(JA[s.id].pages || '')}</p>${JA[s.id].note ? `<p class="sh-ja__src" style="color:var(--warning)">${esc(JA[s.id].note)}</p>` : ''}${esc(JA[s.id].text)}</div>` : '<p class="ig-muted" style="font-size:13px">이 장의 일본어 원문은 아직 붙이지 않았습니다.</p>';
    app.innerHTML = pagehead('진학 상담 · 모집요강 · 요강 번역', esc(doc.doc.title_ko), `<span class="ig-jp" lang="ja">${esc(doc.doc.title_ja)}</span> · 참고용 번역${JA ? ' · 일본어 원문 포함' : ''}`,
      `${langSeg}<a class="ig-btn" href="#yoko/s/${doc.id}/${tr.id}/0">${icon('file')}지원 요약 보기</a><a class="ig-btn ig-btn--ghost" href="${esc(doc.doc.official_url)}" target="_blank" rel="noopener">${icon('external')}공식 페이지</a>`) + `
      <div class="ig-trans">
        <nav class="ig-card ig-trans__toc" aria-label="목차">${doc.translation.map(s => `<a href="#yoko/d/${doc.id}?p=${s.p}" aria-current="${!!(target && target.id === s.id)}">${esc(s.title)}<span>${s.p}쪽</span></a>`).join('')}</nav>
        <article class="ig-card">
          <p class="ig-pagehead__eyebrow">요강 번역 · 참고용 · 원문 파일 ${esc(doc.doc.file)}</p>
          ${doc.translation.map(s => `<section class="ig-trans__sec" id="sec-${s.id}"><div class="ig-trans__h"><h3>${esc(s.title)}</h3><span class="ig-jp" lang="ja">${esc(s.title_ja)}</span><span class="ig-src">원문 ${s.p}쪽</span></div>
            ${lang === 'ja' ? jaBlock(s) : lang === 'both' ? `<div class="sh-bi"><div class="sh-md">${mdown(s.body)}${s.table ? tableFor(s.table) : ''}</div>${jaBlock(s)}</div>` : `<div class="sh-md">${mdown(s.body)}${s.table ? tableFor(s.table) : ''}</div>`}</section>`).join('')}
        </article>
      </div>`;
    app.querySelectorAll('#ylang button').forEach(b => b.onclick = () => { store.set('yokoLang', b.value); viewDoc(id, p); });
    if (target) { const el = document.getElementById('sec-' + target.id); if (el) requestAnimationFrame(() => { const y0 = el.getBoundingClientRect().top + scrollY - 76; scrollTo(0, y0); }); return 'keep'; }
  }

  /* ---------- 용어집 ---------- */
  function viewGlossary() {
    app.innerHTML = pagehead('진학 상담 · 모집요강 · 용어집', '모집요강 용어집', '번역은 이 표의 용어로 통일합니다. 새 용어는 data/yoko/glossary.json에 먼저 넣습니다.', sub('g')) + `
      <label class="ig-field" style="max-width:420px"><span class="ig-sr">용어 찾기</span><span class="ig-field__control">${icon('search', '')}<input class="ig-input" id="gq" type="search" placeholder="일본어 또는 한국어로 찾기"></span></label>
      <section class="ig-card ig-card--flush"><div class="ig-table-wrap"><table class="ig-table"><thead><tr><th>일본어</th><th>한국어</th><th>설명</th></tr></thead><tbody id="gl"></tbody></table></div></section>`;
    const draw = q => { const n = norm(q); document.getElementById('gl').innerHTML = D.glossary.filter(t => !n || norm(t.ja + t.ko + (t.desc || '')).includes(n)).map(t => `<tr><td class="ig-jp" lang="ja">${esc(t.ja)}</td><td><b>${esc(t.ko)}</b></td><td class="ig-muted">${esc(t.desc || '')}</td></tr>`).join(''); };
    draw(''); document.getElementById('gq').oninput = e => draw(e.target.value);
  }

  SH.views.yoko = (parts, qs) => {
    const k = parts[0];
    if (k === 's') return viewSummary(parts.slice(1).join('/'));
    if (k === 'd') return parts[1] ? viewDoc(parts[1], Number(qs.get('p')) || null) : viewDocList();
    if (k === 'g') return viewGlossary();
    return viewHome();
  };
})();
