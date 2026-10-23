/* @ds-bundle: {"format":4,"namespace":"Ilgong","components":[{"name":"AppBar"},{"name":"EnvBand"},{"name":"Button"},{"name":"TextField"},{"name":"Select"},{"name":"Segmented"},{"name":"Tabs"},{"name":"Badge"},{"name":"ZoneChip"},{"name":"DdayBadge"},{"name":"SourceMarks"},{"name":"Ring"},{"name":"Icon"},{"name":"Card"},{"name":"DataTable"},{"name":"EmptyState"},{"name":"Toast"},{"name":"ConfirmDialog"},{"name":"Disclaimer"},{"name":"StatTile"},{"name":"PredictionRange"},{"name":"ChanceBar"},{"name":"ProgressBar"},{"name":"TrendChart"},{"name":"PassCurve"},{"name":"RecommendTable"},{"name":"Stepper"},{"name":"DeadlineBoard"},{"name":"Timeline"},{"name":"DocChecklist"},{"name":"YokoSummary"},{"name":"TranslationView"},{"name":"SchoolCompare"},{"name":"PageHeader"}]} */
/* 일공학원 진학 상담 — ilgong.js
 * 빌드 없이 <script src>로 붙이는 classic script. window.Ilgong 하나만 만든다.
 * 하는 일: 아이콘·무늬 스프라이트 넣기, 세그먼트·탭·체크리스트 자동 연결,
 * 차트 2종(성적 추이, 합격 곡선) SVG 그리기, 토스트, 확인 대화상자, D-day·% 표기 규칙. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- 아이콘: 24 격자, 1.75 선, 둥근 끝 ---------- */
  var ICONS = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v10.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.3c2.1.7 3.5 2.8 3.5 5.7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    check: '<path d="M5 12.5 10 17.5 19 7"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 21h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chart: '<path d="M3.5 20.5h17M7 16.5v-5M12 16.5V6.5M17 16.5v-8"/>',
    trend: '<path d="M3.5 17l5-5 4 3 7-8"/><path d="M15 7h4.5v4.5"/>',
    book: '<path d="M4.5 19V5.5A2.5 2.5 0 0 1 7 3h12.5v14H7a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 7 22h12.5"/>',
    school: '<path d="M2.5 9.5 12 4.5l9.5 5-9.5 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M21.5 9.5v5"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    'chevron-right': '<path d="M9.5 6l6 6-6 6"/>',
    'chevron-down': '<path d="M6 9.5l6 6 6-6"/>',
    filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
    more: '<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
    message: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    print: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.5v.01"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13"/><path d="M12 16.5v.01"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    translate: '<path d="M4 5h9M8.5 3v2M6 5c.5 3 2.5 5.5 5.5 7"/><path d="M11 5c-.7 3.3-3 6-6.5 7.5"/><path d="M13 21l4-9 4 9M14.3 18h5.4"/>'
  };
  var NAMES = Object.keys(ICONS);

  function sprite() {
    if (document.getElementById('ig-sprite')) return;
    var s = '<svg xmlns="' + NS + '" id="ig-sprite" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>';
    NAMES.forEach(function (n) { s += '<symbol id="ig-' + n + '" viewBox="0 0 24 24">' + ICONS[n] + '</symbol>'; });
    /* 흑백 인쇄용 무늬: 빗금(적정·예측 범위), 점(도전) */
    s += '<pattern id="ig-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#8a8a85" stroke-width="2"/></pattern>';
    s += '<pattern id="ig-dots" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#ffffff"/><circle cx="3" cy="3" r="1.1" fill="#6b6b66"/></pattern>';
    s += '</defs></svg>';
    document.body.insertAdjacentHTML('afterbegin', s);
  }
  function icon(name, cls) { return '<svg class="ig-icon' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#ig-' + name + '"/></svg>'; }

  /* ---------- 표기 규칙 ---------- */
  function pct(p) { return p >= 0.9 ? '90%+' : Math.round(p * 100) + '%'; }   // 검증상 90% 이상 예측도 실제는 80% 안팎
  function zoneOf(p) { return p >= 0.7 ? 'safe' : p >= 0.4 ? 'fit' : p >= 0.15 ? 'try' : null; }
  var ZONE_LABEL = { safe: '안정', fit: '적정', try: '도전', ref: '참고' };
  function toDate(s) { var d = new Date(s + 'T00:00:00'); return d; }
  /* D-day 긴급도: 지남 / 진행 중(접수 기간 안) / 7일 이내 / 30일 이내 / 그 이후 */
  function dday(end, today, start) {
    var t = toDate(today), e = toDate(end), days = Math.round((e - t) / 864e5);
    if (days < 0) return { cls: 'past', label: '지남', days: days };
    if (start && toDate(start) <= t && days > 7) return { cls: 'open', label: '접수 중', days: days };
    if (days === 0) return { cls: 'd7', label: 'D-day', days: 0 };
    if (days <= 7) return { cls: 'd7', label: 'D-' + days, days: days };
    if (days <= 30) return { cls: 'd30', label: 'D-' + days, days: days };
    return { cls: 'later', label: 'D-' + days, days: days };
  }

  /* ---------- SVG 도우미 ---------- */
  function el(tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  /* 차트는 담는 칸의 실제 폭으로 그린다 — 휴대폰에서도 글자가 11px로 유지된다 */
  function fitWidth(target) { var w = target.clientWidth || 640; return Math.max(300, Math.min(960, w)); }
  function keepFitted(target, draw, o) {
    if (o.width || typeof ResizeObserver === 'undefined' || target.__igRO) return;
    var last = target.clientWidth;
    target.__igRO = new ResizeObserver(function () { var w = target.clientWidth; if (Math.abs(w - last) > 40) { last = w; draw(target, o); } });
    target.__igRO.observe(target);
  }
  function svgRoot(w, h, label) { return el('svg', { viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-label': label }); }
  function niceTicks(lo, hi, step) {
    if (!step) { var raw = (hi - lo) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag; step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag; }
    var out = []; for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(v); return out;
  }

  /* ---------- 성적 추이 차트 ----------
   * opts: { labels:[…], me:[…|null], avg:[…|null], pred:{ i, point, lo, hi }?, min, max, unit, label } */
  function trendChart(target, o) {
    var W = o.width || fitWidth(target), H = o.height || 240, L = 40, R = o.pred ? 84 : 24, T = 22, B = 30, IN = W < 480 ? 14 : 22;
    var n = o.labels.length, min = o.min, max = o.max;
    var X = function (i) { return L + IN + (W - L - IN - R) * (n === 1 ? 0.5 : i / (n - 1)); };
    var Y = function (v) { return T + (H - T - B) * (1 - (v - min) / (max - min)); };
    var s = svgRoot(W, H, o.label || '회차별 성적 추이');
    niceTicks(min, max, o.step).forEach(function (v) {
      s.appendChild(el('line', { class: 'grid', x1: L, x2: W - R, y1: Y(v), y2: Y(v) }));
      s.appendChild(el('text', { x: L - 8, y: Y(v) + 4, 'text-anchor': 'end' }, Math.round(v)));
    });
    o.labels.forEach(function (lab, i) { s.appendChild(el('text', { x: X(i), y: H - 8, 'text-anchor': 'middle' }, lab)); });
    function line(vals, cls) {
      var d = '';
      vals.forEach(function (v, i) { if (v == null) return; d += (d ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); });
      if (d) s.appendChild(el('path', { class: cls, d: d }));
    }
    if (o.pred) {
      var p = o.pred, bw = 26;
      s.appendChild(el('rect', { class: 'pred-band', x: X(p.i) - bw / 2, y: Y(p.hi), width: bw, height: Y(p.lo) - Y(p.hi), rx: 6 }));
      s.appendChild(el('line', { class: 'pred-whisker', x1: X(p.i), x2: X(p.i), y1: Y(p.hi), y2: Y(p.lo) }));
      var last = -1; o.me.forEach(function (v, i) { if (v != null && i < p.i) last = i; });
      if (last >= 0) s.appendChild(el('path', { class: 'pred-line', d: 'M' + X(last) + ',' + Y(o.me[last]) + 'L' + X(p.i) + ',' + Y(p.point) }));
      s.appendChild(el('circle', { class: 'pred-dot', cx: X(p.i), cy: Y(p.point), r: 6 }));
      s.appendChild(el('text', { x: X(p.i) + 18, y: Y(p.point) + 4, class: 'you-label' }, p.point));
      s.appendChild(el('text', { x: X(p.i) + 18, y: Y(p.point) + 18 }, '보통 ' + p.lo + '~' + p.hi));
    }
    if (o.avg) { line(o.avg, 'avg'); o.avg.forEach(function (v, i) { if (v != null) s.appendChild(el('circle', { class: 'avg-dot', cx: X(i), cy: Y(v), r: 3.5 })); }); }
    line(o.me, 'me');
    o.me.forEach(function (v, i) {
      if (v == null) return;
      s.appendChild(el('circle', { class: 'me-dot', cx: X(i), cy: Y(v), r: 5 }));
      s.appendChild(el('text', { x: X(i), y: Y(v) - 10, 'text-anchor': 'middle', class: 'you-label' }, v));
    });
    target.innerHTML = '';
    target.appendChild(s);
    keepFitted(target, trendChart, o);
    return s;
  }

  /* ---------- 합격 곡선 ----------
   * opts: { lo, hi, a, b, shift, bins:[[구간중심, 인원, 합격]], you:{ score, lo, hi }, label } */
  function sig(t) { return 1 / (1 + Math.exp(-t)); }
  function passCurve(target, o) {
    var W = o.width || fitWidth(target), H = o.height || 280, L = 44, R = 20, T = 14, B = 32;
    var X = function (v) { return L + (W - L - R) * (v - o.lo) / (o.hi - o.lo); };
    var Y = function (p) { return T + (H - T - B) * (1 - p); };
    var f = function (x) { return sig(o.a + o.b * x + (o.shift || 0)); };
    var s = svgRoot(W, H, o.label || '점수별 합격 가능성 곡선');
    [[0.7, 1, 'safe'], [0.4, 0.7, 'fit'], [0.15, 0.4, 'try']].forEach(function (z) {
      s.appendChild(el('rect', { class: 'band-' + z[2], x: L, y: Y(z[1]), width: W - L - R, height: Y(z[0]) - Y(z[1]) }));
      s.appendChild(el('text', { class: 'band-label ' + z[2], x: W - R - 8, y: Y(z[1]) + 15, 'text-anchor': 'end' }, ZONE_LABEL[z[2]] + ' ' + Math.round(z[0] * 100) + '%+'));
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (p) {
      s.appendChild(el('line', { class: 'grid', x1: L, x2: W - R, y1: Y(p), y2: Y(p) }));
      s.appendChild(el('text', { x: L - 8, y: Y(p) + 4, 'text-anchor': 'end' }, Math.round(p * 100) + '%'));
    });
    var step = o.xstep || (W < 480 ? 100 : 50);
    for (var v = Math.ceil(o.lo / step) * step; v <= o.hi; v += step) s.appendChild(el('text', { x: X(v), y: H - 10, 'text-anchor': 'middle' }, v));
    if (o.you && o.you.lo != null) s.appendChild(el('rect', { class: 'you-range', x: X(o.you.lo), y: T, width: X(o.you.hi) - X(o.you.lo), height: H - T - B }));
    var maxN = Math.max.apply(null, (o.bins || []).map(function (b) { return b[1]; }).concat([1]));
    (o.bins || []).forEach(function (b) {
      var c = el('circle', { class: 'bin', cx: X(b[0]), cy: Y(b[2] / b[1]), r: (3 + 7 * Math.sqrt(b[1] / maxN)).toFixed(1) });
      c.appendChild(el('title', {}, (b[0] - 10) + '~' + (b[0] + 9) + '점: ' + b[1] + '명 중 ' + b[2] + '명 합격'));
      s.appendChild(c);
    });
    var d = '';
    for (var x = o.lo; x <= o.hi; x += (o.hi - o.lo) / 120) d += (d ? 'L' : 'M') + X(x).toFixed(1) + ',' + Y(f(x)).toFixed(1);
    s.appendChild(el('path', { class: 'curve', d: d }));
    if (o.you) {
      var sc = o.you.score, p = o.you.p != null ? o.you.p : f(sc);
      s.appendChild(el('line', { class: 'you', x1: X(sc), x2: X(sc), y1: T, y2: H - B }));
      s.appendChild(el('circle', { class: 'you-dot', cx: X(sc), cy: Y(p), r: 6 }));
      var right = X(sc) < W - 180;
      s.appendChild(el('text', { class: 'you-label', x: X(sc) + (right ? 10 : -10), y: T + 14, 'text-anchor': right ? 'start' : 'end' }, '예측 ' + sc + '점 · ' + pct(p)));
    }
    target.innerHTML = '';
    target.appendChild(s);
    keepFitted(target, passCurve, o);
    return s;
  }

  /* ---------- 토스트 ---------- */
  function toast(msg, opt) {
    opt = opt || {};
    var region = document.querySelector('.ig-toasts');
    if (!region) { region = document.createElement('div'); region.className = 'ig-toasts'; region.setAttribute('role', 'status'); region.setAttribute('aria-live', 'polite'); document.body.appendChild(region); }
    var t = document.createElement('div');
    t.className = 'ig-toast' + (opt.tone === 'error' ? ' ig-toast--error' : '');
    t.innerHTML = icon(opt.tone === 'error' ? 'alert' : 'check-circle') + '<span></span>' + (opt.action ? '<button type="button" class="ig-btn"></button>' : '');
    t.querySelector('span').textContent = msg;
    if (opt.action) { var b = t.querySelector('button'); b.textContent = opt.action; b.onclick = function () { if (opt.onAction) opt.onAction(); t.remove(); }; }
    region.appendChild(t);
    if (opt.duration !== 0) setTimeout(function () { t.remove(); }, opt.duration || 4000);
    return t;
  }

  /* ---------- 확인 대화상자 (native <dialog>) ---------- */
  function confirmBox(o) {
    return new Promise(function (resolve) {
      var d = document.createElement('dialog');
      d.className = 'ig-dialog';
      d.innerHTML = '<h2></h2><p></p><div class="ig-dialog__actions"><button type="button" class="ig-btn" value="no"></button><button type="button" class="ig-btn ' + (o.danger ? 'ig-btn--danger' : 'ig-btn--primary') + '" value="yes"></button></div>';
      d.querySelector('h2').textContent = o.title;
      d.querySelector('p').textContent = o.body || '';
      var bs = d.querySelectorAll('button');
      bs[0].textContent = o.cancel || '취소'; bs[1].textContent = o.ok || '확인';
      bs[0].onclick = function () { d.close(); }; bs[1].onclick = function () { d.returnValue = 'yes'; d.close(); };
      d.addEventListener('close', function () { resolve(d.returnValue === 'yes'); d.remove(); });
      document.body.appendChild(d);
      d.showModal();
      bs[0].focus();
    });
  }

  /* ---------- 자동 연결: 세그먼트, 탭, 체크리스트 ---------- */
  function wire(root) {
    root = root || document;
    root.querySelectorAll('.ig-seg').forEach(function (g) {
      if (g.__ig) return; g.__ig = 1;
      g.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b || !g.contains(b)) return;
        g.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        g.dispatchEvent(new CustomEvent('ig-change', { detail: b.value || b.textContent, bubbles: true }));
      });
    });
    root.querySelectorAll('.ig-tabs').forEach(function (g) {
      if (g.__ig) return; g.__ig = 1;
      var tabs = Array.prototype.slice.call(g.querySelectorAll('[role="tab"]'));
      function sel(t) {
        tabs.forEach(function (x) {
          var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
          var p = x.getAttribute('aria-controls') && document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
        });
      }
      g.addEventListener('click', function (e) { var t = e.target.closest('[role="tab"]'); if (t) sel(t); });
      g.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(document.activeElement); if (i < 0) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var t = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; sel(t); t.focus(); e.preventDefault(); }
      });
    });
    root.querySelectorAll('[data-ig-checklist]').forEach(function (list) {
      if (list.__ig) return; list.__ig = 1;
      var out = document.getElementById(list.getAttribute('data-ig-checklist'));
      function upd() {
        var boxes = list.querySelectorAll('input[type=checkbox]'), done = 0;
        boxes.forEach(function (b) { b.closest('li').classList.toggle('is-done', b.checked); if (b.checked) done++; });
        if (out) {
          var pctv = boxes.length ? Math.round(done / boxes.length * 100) : 0;
          out.querySelector('i').style.width = pctv + '%';
          var lab = out.querySelector('[data-count]'); if (lab) lab.textContent = done + ' / ' + boxes.length;
          out.classList.toggle('ig-progress--done', done === boxes.length);
        }
      }
      list.addEventListener('change', upd); upd();
    });
  }

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function () { sprite(); wire(document); });

  window.Ilgong = Object.assign(window.Ilgong || {}, {
    icons: NAMES, icon: icon, pct: pct, zoneOf: zoneOf, zoneLabel: ZONE_LABEL, dday: dday,
    trendChart: trendChart, passCurve: passCurve, toast: toast, confirm: confirmBox, wire: wire, sprite: sprite
  });
})();
