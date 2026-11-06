// node tests/gas.test.js — Code.gs 를 가짜 구글 서비스 위에서 돌려 봄 (코드 확인·잠금·데이터 내려주기)
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto'), zlib = require('zlib');
let passed = 0;
function t(name, fn) { try { fn(); passed++; console.log('  ok  ' + name); } catch (e) { console.error('  FAIL ' + name + '\n       ' + (e.stack || e.message)); process.exitCode = 1; } }
const norm = s => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
const H = c => crypto.createHash('sha256').update('shinro|' + norm(c)).digest('hex');
const CODE_A = 'ABCD-EFGH-JKLM', CODE_B = 'WXYZ-2345-6789';
const reads = { n: 0 };
function load(files, devFiles) {
  const props = { DATA_FOLDER_ID: 'F1', DATA_FOLDER_ID_DEV: 'F2', CODE_HASHES: [H(CODE_A), H(CODE_B)].join(',') }, cache = {};
  const sb = {
    console,
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null }) },
    CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => { cache[k] = v; } }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, sleep() {},
      computeDigest: (a, s) => Array.from(crypto.createHash('sha256').update(s).digest()).map(x => (x > 127 ? x - 256 : x)),
      newBlob: s => ({ bytes: Buffer.from(s) }), gzip: b => ({ getBytes: () => zlib.gzipSync(b.bytes) }), base64Encode: b => Buffer.from(b).toString('base64'),
    },
    DriveApp: (() => {
      const mkFolder = (name, fs_) => ({ getName: () => name, getFilesByName: n => { const has = n in fs_; let u = false; return { hasNext: () => has && !u, next: () => { u = true; return { getBlob: () => { reads.n++; return { getDataAsString: () => fs_[n] }; }, getSize: () => fs_[n].length, getLastUpdated: () => ({ getTime: () => 1 }) }; } }; } });
      const folder = mkFolder('진학상담_데이터', files), dev = devFiles ? mkFolder('진학상담_데이터_dev', devFiles) : null;
      return { getFolderById: id => { if (id === 'F2' && dev) return dev; assert.strictEqual(id, 'F1'); return folder; },
        getFoldersByName: nm => { let u = false; const f = nm === '진학상담_데이터' && !props.DATA_FOLDER_ID ? folder : nm === '진학상담_데이터_dev' && !props.DATA_FOLDER_ID_DEV ? dev : null; return { hasNext: () => !!f && !u, next: () => { u = true; return f; } }; } }; })(),
    Logger: { log() {} },
  };
  vm.createContext(sb); vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8'), sb);
  const call = (action, payload) => JSON.parse(sb.doPost({ postData: { contents: JSON.stringify({ action, payload }) } }).s);
  return { call, cache, props, sb };
}
const NAMES = ['model', 'curves', 'names_ko', 'yoko', 'yoko_ja', 'yoko_files', 'schools', 'mock', 'scoring'];
const FILES = Object.fromEntries(NAMES.map(n => [n + '.js', 'window.' + n + '=' + JSON.stringify({ n, 한글: '가나다' }) + ';']));
const FILES2 = Object.fromEntries(NAMES.map(n => [n, FILES[n + '.js']]));
// 가짜 폴더 이름은 파일 이름(n.js) 기준
function mk() { const files = {}; NAMES.forEach(n => files[n + '.js'] = FILES[n + '.js']); return load(files); }

t('ping 은 코드 없이 응답', () => { const g = mk(); assert.strictEqual(g.call('ping', {}).ok, true); });
t('코드 없으면 데이터를 안 줌', () => { const g = mk(); const r = g.call('data', {}); assert.strictEqual(r.ok, false); assert.strictEqual(r.error, 'bad'); assert.ok(!r.gz); });
t('틀린 코드(한 글자 다름)는 거부', () => { const g = mk(); assert.strictEqual(g.call('data', { code: 'ABCD-EFGH-JKLN' }).error, 'bad'); });
t('두 코드 모두 열림 — 소문자·하이픈 없이도', () => {
  const g = mk();
  for (const c of [CODE_A, CODE_B.toLowerCase().replace(/-/g, ' ')]) {
    const r = g.call('data', { code: c }); assert.strictEqual(r.ok, true);
    const P = JSON.parse(zlib.gunzipSync(Buffer.from(r.gz, 'base64')).toString('utf8'));
    assert.deepStrictEqual(P.order, NAMES); assert.strictEqual(P.files.schools, FILES['schools.js']);
  }
});
t('틀린 코드 10번이면 잠기고, 맞는 코드도 잠금 동안은 거부', () => {
  const g = mk();
  for (let i = 0; i < 10; i++) g.call('data', { code: 'AAAA-AAAA-AAAA' });
  assert.strictEqual(g.call('data', { code: CODE_A }).error, 'locked');
  delete g.cache.fail;   // 5분 지남
  assert.strictEqual(g.call('data', { code: CODE_A }).ok, true);
});
t('폴더에 파일이 빠지면 서버 오류로 알려 줌(코드는 맞음)', () => {
  const files = {}; NAMES.slice(1).forEach(n => files[n + '.js'] = 'x');
  const g = load(files); const r = g.call('data', { code: CODE_A }); assert.strictEqual(r.ok, false); assert.strictEqual(r.error, 'server'); assert.ok(/model\.js/.test(r.msg));
});
t('폴더 ID 속성이 없으면 이름(진학상담_데이터)으로 찾음', () => { const g = mk(); delete g.props.DATA_FOLDER_ID; assert.strictEqual(g.call('data', { code: CODE_A }).ok, true); });
t('두 번째 요청은 드라이브 내용을 다시 읽지 않고 캐시로 답함 ', () => {
  const g = mk(); reads.n = 0;
  const a = g.call('data', { code: CODE_A }); const first = reads.n; assert.strictEqual(first, 9);
  const b = g.call('data', { code: CODE_A }); assert.strictEqual(reads.n, first, '캐시'); assert.strictEqual(b.gz, a.gz);
  assert.ok(Object.keys(g.cache).length > 1);
});
t('students.js 가 폴더에 있으면 같이 내려오고, 없어도 오류 아님', () => {
  const zlib2 = require('zlib');
  const files = {}; NAMES.forEach(n => files[n + '.js'] = FILES[n + '.js']); files['students.js'] = 'window.STUDENTS={list:[]};';
  const g = load(files); const r = g.call('data', { code: CODE_A }); assert.ok(r.ok);
  const d = JSON.parse(zlib2.gunzipSync(Buffer.from(r.gz, 'base64')).toString()); assert.ok(d.order.includes('students'));
  const g2 = mk(); const d2 = JSON.parse(zlib2.gunzipSync(Buffer.from(g2.call('data', { code: CODE_A }).gz, 'base64')).toString()); assert.ok(!d2.order.includes('students'));
});
t('results.js(입시 결과)도 폴더에 있을 때만 같이 내려옴', () => {
  const zlib2 = require('zlib');
  const files = {}; NAMES.forEach(n => files[n + '.js'] = FILES[n + '.js']); files['results.js'] = 'window.RESULTS={};';
  const d = JSON.parse(zlib2.gunzipSync(Buffer.from(load(files).call('data', { code: CODE_A }).gz, 'base64')).toString());
  assert.ok(d.order.includes('results')); assert.strictEqual(d.order[d.order.length - 1], 'results');
});
t('모르는 action·깨진 요청', () => { const g = mk(); assert.strictEqual(g.call('dump', { code: CODE_A }).error, 'unknown'); assert.strictEqual(JSON.parse(g.sb.doPost({ postData: { contents: '{' } }).s).error, 'bad_request'); });
t('속성이 비어 있으면(CODE_HASHES 없음) 아무 코드도 안 열림', () => { const g = mk(); g.props.CODE_HASHES = ''; assert.strictEqual(g.call('check', { code: CODE_A }).error, 'bad'); });
t('env=dev 이면 개발판 폴더를 읽고, 없으면 본판(기본)을 읽음', () => {
  const dev = {}; NAMES.forEach(n => dev[n + '.js'] = 'DEV ' + n);
  const g = load(Object.fromEntries(NAMES.map(n => [n + '.js', FILES[n + '.js']])), dev);
  const unz = r => JSON.parse(zlib.gunzipSync(Buffer.from(r.gz, 'base64')).toString('utf8'));
  const rd = g.call('data', { code: CODE_A, env: 'dev' }); assert.strictEqual(rd.env, 'dev'); assert.strictEqual(unz(rd).files.model, 'DEV model');
  const rp = g.call('data', { code: CODE_A }); assert.strictEqual(rp.env, 'prod'); assert.strictEqual(unz(rp).files.model, FILES['model.js']);   // 캐시가 판끼리 섞이지 않음
  const rx = g.call('data', { code: CODE_A, env: 'weird' }); assert.strictEqual(rx.env, 'prod');
});
t('개발판 폴더가 없으면 개발판 요청만 서버 오류(본판은 그대로)', () => {
  const g = mk(); delete g.props.DATA_FOLDER_ID_DEV;
  const r = g.call('data', { code: CODE_A, env: 'dev' }); assert.strictEqual(r.ok, false); assert.ok(/진학상담_데이터_dev/.test(r.msg));
  assert.strictEqual(g.call('data', { code: CODE_A }).ok, true);
});
t('warmCache: 캐시가 새것이면 다시 안 만들고, 4.5시간 넘었으면 새로 만듦 (본판·개발판 둘 다)', () => {
  const dev = {}; NAMES.forEach(n => dev[n + '.js'] = 'DEV ' + n);
  const g = load(Object.fromEntries(NAMES.map(n => [n + '.js', FILES[n + '.js']])), dev);
  reads.n = 0; g.sb.warmCache(); assert.strictEqual(reads.n, 18);   // 처음: 둘 다 만듦
  reads.n = 0; g.sb.warmCache(); assert.strictEqual(reads.n, 0);    // 바로 다시: 그대로
  Object.keys(g.cache).filter(k => k.endsWith('_t')).forEach(k => { g.cache[k] = String(Date.now() - 5 * 3600 * 1000); });
  reads.n = 0; g.sb.warmCache(); assert.strictEqual(reads.n, 18);   // 오래됨: 새로 만듦
  reads.n = 0; assert.strictEqual(g.call('data', { code: CODE_A, env: 'dev' }).ok, true); assert.strictEqual(reads.n, 0);   // 화면 요청은 캐시로
});
console.log(passed + '개 통과');
