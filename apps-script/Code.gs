/**
 * 진학 상담 — 구글 쪽 서버 (Apps Script 웹앱). 성적노트와 같은 방식.
 *
 * 데이터(합격 집계·모집요강·모의고사 등 js 파일 9개)는 선생님 구글 드라이브 폴더에 평문으로 있고,
 * 이 웹앱이 「접속 코드」를 확인한 뒤에만 읽어서 화면(GitHub Pages)에 내려 줍니다. 저장소에는 데이터가 없습니다.
 *
 * 스크립트 속성(설치용 setup() 이 넣음 — 저장소에 올리지 말 것):
 *   DATA_FOLDER_ID  (선택) 데이터 js 가 들어 있는 드라이브 폴더 ID. 없으면 「진학상담_데이터」라는 이름의 폴더를 찾음
 *   CODE_HASHES     허용하는 접속 코드의 해시(쉼표로 구분). 코드 자체는 저장하지 않음
 * 실행 사용자는 「나」(선생님)이라 접속하는 사람이 구글 계정이 없어도 됨. 폴더를 공유할 필요 없음.
 */
var VER = 'shinro-1';
var DATA_NAMES = ['model', 'curves', 'names_ko', 'yoko', 'yoko_ja', 'yoko_files', 'schools', 'mock', 'scoring'];   // 화면이 읽는 순서
var OPTIONAL = ['students', 'results'];   // 폴더에 있으면 같이 내려 줌(실제 학생 성적 · 입시 결과 지원자 기록). 없어도 오류 아님
var MAX_FAIL = 10, FAIL_SEC = 300;   // 5분 안에 틀린 코드 10번이면 5분 동안 잠금

function doGet() { return json_({ ok: true, app: '진학 상담', ver: VER }); }

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  var action = String(body.action || ''), p = body.payload || {};
  try {
    if (action === 'ping') return json_({ ok: true, ver: VER });
    if (action !== 'check' && action !== 'data') return json_({ ok: false, error: 'unknown' });
    var cache = CacheService.getScriptCache();
    if (Number(cache.get('fail') || 0) >= MAX_FAIL) return json_({ ok: false, error: 'locked' });
    if (!codeOk_(p.code)) {
      cache.put('fail', String(Number(cache.get('fail') || 0) + 1), FAIL_SEC);
      Utilities.sleep(1500);   // 연달아 시도하는 것을 늦춤
      return json_({ ok: false, error: 'bad' });
    }
    if (action === 'check') return json_({ ok: true, ver: VER });
    return json_(readAll_());
  } catch (err) {
    return json_({ ok: false, error: 'server', msg: String(err && err.message || err) });
  }
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function norm_(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function hash_(code) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'shinro|' + norm_(code), Utilities.Charset.UTF_8);
  return b.map(function (x) { return ('0' + (x & 0xff).toString(16)).slice(-2); }).join('');
}
function codeOk_(code) {
  if (norm_(code).length < 12) return false;
  var list = String(PropertiesService.getScriptProperties().getProperty('CODE_HASHES') || '').split(',').filter(String);
  return list.indexOf(hash_(code)) >= 0;
}

var FOLDER_NAME = '진학상담_데이터';
function folder_() {
  var id = PropertiesService.getScriptProperties().getProperty('DATA_FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  var it = DriveApp.getFoldersByName(FOLDER_NAME);
  if (!it.hasNext()) throw new Error('드라이브에 「' + FOLDER_NAME + '」 폴더가 없습니다');
  return it.next();
}

/** 폴더의 데이터 js 를 읽어 gzip+base64 문자열로 만든다. 만든 결과는 6시간 캐시 (파일이 바뀌면 키가 달라져 새로 만듦) */
var CHUNK = 90000, TTL = 21600;
function readAll_() {
  var folder = folder_(), blobs = {}, sig = [], names = [];
  DATA_NAMES.concat(OPTIONAL).forEach(function (n) {
    var it = folder.getFilesByName(n + '.js');
    if (!it.hasNext()) { if (OPTIONAL.indexOf(n) >= 0) return; throw new Error(n + '.js 가 폴더에 없습니다'); }
    var f = it.next();
    names.push(n);
    blobs[n] = f;
    sig.push(n + ':' + f.getLastUpdated().getTime() + ':' + f.getSize());
  });
  var cache = CacheService.getScriptCache();
  var key = 'bd_' + Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sig.join('|'), Utilities.Charset.UTF_8)
    .map(function (x) { return ('0' + (x & 0xff).toString(16)).slice(-2); }).join('').slice(0, 20);
  var gz = fromCache_(cache, key);
  if (!gz) {
    var files = {};
    names.forEach(function (n) { files[n] = blobs[n].getBlob().getDataAsString('UTF-8'); });
    var blob = Utilities.gzip(Utilities.newBlob(JSON.stringify({ order: names, files: files }), 'application/json', 'd.json'));
    gz = Utilities.base64Encode(blob.getBytes());
    toCache_(cache, key, gz);
  }
  return { ok: true, ver: VER, gz: gz };
}
function fromCache_(cache, key) {
  try {
    var n = Number(cache.get(key + '_n') || 0);
    if (!n) return null;
    var parts = [];
    for (var i = 0; i < n; i++) { var v = cache.get(key + '_' + i); if (v == null) return null; parts.push(v); }
    return parts.join('');
  } catch (e) { return null; }
}
function toCache_(cache, key, text) {
  try {
    var n = Math.ceil(text.length / CHUNK);
    for (var i = 0; i < n; i++) cache.put(key + '_' + i, text.substr(i * CHUNK, CHUNK), TTL);
    cache.put(key + '_n', String(n), TTL);
  } catch (e) { /* 캐시가 안 되어도 응답은 나감 */ }
}

/** 편집기에서 직접 실행해 보는 점검: 폴더·파일·코드 개수 */
function selfTest() {
  var P = PropertiesService.getScriptProperties();
  Logger.log('코드 ' + String(P.getProperty('CODE_HASHES') || '').split(',').filter(String).length + '개 등록');
  var folder = folder_();
  Logger.log('폴더: ' + folder.getName());
  DATA_NAMES.forEach(function (n) {
    var it = folder.getFilesByName(n + '.js');
    Logger.log(n + '.js: ' + (it.hasNext() ? Math.round(it.next().getSize() / 1024) + ' KB' : '없음 ← 폴더에 올려 주세요'));
  });
}
