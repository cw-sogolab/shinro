/* 접속 코드 잠금 (성적노트와 같은 방식). 데이터(합격 집계·모집요강·모의고사 등)는 저장소에 없고 선생님 구글 드라이브에 있다.
 * 이 파일이 접속 코드를 Apps Script 웹앱(config.js 의 API_URL)에 보내고, 맞으면 받은 데이터를 실행해 화면을 연다.
 * 코드·데이터는 구글 서버와 이 브라우저 사이로만 오간다. 개발할 때(API_URL 이 비어 있거나 주소 뒤에 ?dev)는 같은 폴더의 평문 데이터로 바로 연다. */
(function () {
  "use strict";
  const DATA = ['model', 'curves', 'names_ko', 'yoko', 'yoko_ja', 'yoko_files', 'schools', 'mock', 'scoring'];
  const APP = ['eng_rules', 'app', 'view-yoko', 'view-mock', 'view-score', 'view-school', 'view-results'];
  const A = 'assets/';
  const URL_ = (window.SHINRO_CONFIG || {}).API_URL || '';
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const load = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error(src)); document.body.appendChild(s); });
  const run = text => { const s = document.createElement('script'); s.text = text; document.body.appendChild(s); };
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* 막힌 환경 */ } }, del: k => { try { sessionStorage.removeItem(k); } catch (e) { /* */ } } };

  async function startApp() {
    if (location.protocol === 'file:' || location.hostname === 'localhost') for (const n of ['students', 'results']) { if (!window[n.toUpperCase()]) { try { await load(A + n + '.js'); } catch (e) { /* 개발용 — 없으면 무시 */ } } }
    for (const n of APP) await load(A + n + '.js');
    document.body.classList.remove('sh-locked');
    window.dispatchEvent(new HashChangeEvent('hashchange'));   // 모든 화면이 등록된 뒤 첫 화면 시작
    const g = document.getElementById('gate'); if (g) g.remove();
  }
  async function gunzip(buf) { return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text(); }
  /** 서버에 코드를 보내 데이터를 받는다. 실패하면 Error('bad'|'locked'|'net'|'server') */
  async function fetchData(code) {
    let r;
    try {
      // text/plain 으로 보내야 브라우저가 사전 확인(CORS preflight) 없이 Apps Script 로 보냄
      const res = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'data', payload: { code } }) });
      r = res.ok ? await res.json() : { ok: false, error: 'server' };
    } catch (e) { throw new Error('net'); }
    if (!r.ok) throw new Error(r.error || 'server');
    return JSON.parse(await gunzip(unb64(r.gz)));
  }
  async function unlock(code, say) {
    const P = await fetchData(code);
    if (say) say('화면을 여는 중…');
    P.order.forEach(n => run(P.files[n]));
    await startApp();
  }
  const MSG = { bad: '코드가 맞지 않습니다. 다시 확인해 주세요.', locked: '잠시 막혔습니다. 5분 뒤에 다시 시도해 주세요.', net: '인터넷 연결을 확인하고 다시 시도해 주세요.', server: '서버에서 데이터를 읽지 못했습니다. 잠시 뒤 다시 시도하고, 계속되면 담당자에게 알려 주세요.' };

  function gate() {
    document.body.classList.add('sh-locked');
    const d = document.createElement('div');
    d.id = 'gate'; d.className = 'sh-gate';
    d.innerHTML = `<form class="ig-card sh-gate__card" autocomplete="off">
      <img class="ig-logo ig-logo--light" src="../design/assets/ilgong-logo.png" alt="일공학원"><img class="ig-logo ig-logo--dark" src="../design/assets/ilgong-logo-reverse.png" alt="일공학원">
      <h1 class="sh-gate__title">진학 상담</h1>
      <p class="sh-gate__desc">원장님·담당 강사 전용입니다. 접속 코드를 입력하세요.</p>
      <label class="ig-field"><span class="ig-sr">접속 코드</span><span class="ig-field__control"><input class="ig-input" id="gcode" type="password" inputmode="text" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX" required></span></label>
      <button class="ig-btn ig-btn--primary" id="gbtn" type="submit">열기</button>
      <p class="ig-disclaimer" id="gmsg" role="alert" aria-live="polite"></p>
    </form>`;
    document.body.appendChild(d);
    const f = d.querySelector('form'), inp = d.querySelector('#gcode'), btn = d.querySelector('#gbtn'), msg = d.querySelector('#gmsg');
    inp.focus();
    f.onsubmit = async e => {
      e.preventDefault();
      btn.disabled = true; btn.textContent = '확인 중…'; msg.textContent = '';
      try {
        await unlock(inp.value, t => { btn.textContent = t; });
        ss.set('shc', inp.value);   // 이 탭을 닫을 때까지만 기억 (새로고침해도 다시 안 물음)
      } catch (err) {
        msg.textContent = MSG[err.message] || MSG.server;
        btn.disabled = false; btn.textContent = '열기'; inp.select();
      }
    };
  }
  /** 화면을 열자마자 서버를 미리 깨움 (코드를 치는 동안) */
  function warm() { try { fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: '{"action":"ping"}' }).catch(() => {}); } catch (e) { /* 무시 */ } }

  async function boot() {
    const dev = /[?&]dev\b/.test(location.search);
    if (dev || !URL_) {   // 평문 데이터로 바로 열기 (개발용)
      try { for (const n of DATA) await load(A + n + '.js'); await startApp(); } catch (e) { document.body.insertAdjacentHTML('beforeend', '<p style="padding:24px">데이터 파일을 찾지 못했습니다: ' + String(e.message).replace(/[<>&]/g, '') + '</p>'); }
      return;
    }
    const saved = ss.get('shc');
    if (saved) { try { document.body.classList.add('sh-locked'); await unlock(saved); return; } catch (e) { ss.del('shc'); } }
    gate(); warm();
  }
  boot();
})();
