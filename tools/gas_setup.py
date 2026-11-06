#!/usr/bin/env python3
"""진학 상담 서버(Apps Script) 설치 준비 — 내 맥에서 한 번 실행. 표준 라이브러리만 씀.

 1. 접속 코드 둘(원장님·본인)을 만든다 → .secret/codes.json  (이미 있으면 그대로 씀, --new 로 새로 만들기. 코드는 레포·메신저 금지)
 2. 코드의 해시와 Code.gs 를 합쳐 붙여넣기용 .secret/설치용_Code.gs 를 만든다 (해시가 들어 있으니 레포에 올리지 말 것)
 3. --export <폴더> [--env dev|prod] : docs/assets 의 데이터 js 9개(+있으면 results.js)를 그 폴더 아래 「진학상담_데이터_dev」(기본) 또는 「진학상담_데이터」에 복사
    → 구글 드라이브 내 드라이브에 올린다. 개발판에서 확인한 뒤 Apps Script 편집기에서 promoteDevToProd() 를 실행하면 본판으로 복사된다
설치 순서와 확인 방법은 README.md.
"""
import argparse, hashlib, json, re, secrets, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAMES = ['model', 'curves', 'names_ko', 'yoko', 'yoko_ja', 'yoko_files', 'schools', 'mock', 'scoring']
OPTIONAL = ['results']   # 있으면 같이 복사 (tools/results_export.py 로 만듦)
ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'   # 헷갈리는 글자(0 O 1 I) 뺌 — 12자 = 60비트


def norm(s):
    return re.sub(r'[^A-Z0-9]', '', str(s).upper())


def h(code):   # Code.gs 의 hash_ 와 같아야 함 (tests/gas.test.js 가 확인)
    return hashlib.sha256(('shinro|' + norm(code)).encode()).hexdigest()


def new_code():
    s = ''.join(secrets.choice(ALPHA) for _ in range(12))
    return f'{s[:4]}-{s[4:8]}-{s[8:]}'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--new', action='store_true', help='접속 코드를 새로 만든다 (옛 코드는 못 씀)')
    ap.add_argument('--export', metavar='DIR', help='데이터 js 를 DIR/진학상담_데이터_dev (개발판, 기본) 또는 DIR/진학상담_데이터 (--env prod) 로 복사')
    ap.add_argument('--env', choices=['dev', 'prod'], default='dev', help='데이터를 어느 판 폴더로 내보낼지. 기본 dev — 개발판에서 확인한 뒤 Apps Script 의 promoteDevToProd() 로 본판에 올린다')
    a = ap.parse_args()
    sec = ROOT / '.secret'
    sec.mkdir(exist_ok=True)
    cf = sec / 'codes.json'
    if a.new or not cf.exists():
        codes = {'원장님': new_code(), '본인': new_code()}
        cf.write_text(json.dumps(codes, ensure_ascii=False, indent=2), encoding='utf-8')
        cf.chmod(0o600)
        print('새 접속 코드를 만들었습니다:', cf)
    else:
        codes = json.loads(cf.read_text(encoding='utf-8'))
    code_gs = (ROOT / 'apps-script' / 'Code.gs').read_text(encoding='utf-8')
    setup = ("\n\n/** 처음 한 번만 실행: 허용하는 접속 코드의 해시를 스크립트 속성에 저장 (코드 자체는 저장하지 않음) */\n"
             "function setup() {\n  PropertiesService.getScriptProperties().setProperty('CODE_HASHES', '" + ','.join(h(c) for c in codes.values()) + "');\n"
             "  Logger.log('접속 코드 " + str(len(codes)) + "개 등록 완료. 이어서 selfTest 를 실행해 폴더·파일을 확인하세요.');\n}\n")
    out = sec / '설치용_Code.gs'
    out.write_text(code_gs + setup, encoding='utf-8')
    print('붙여넣기용 파일:', out)
    if a.export:
        dst = Path(a.export).expanduser() / ('진학상담_데이터_dev' if a.env == 'dev' else '진학상담_데이터')
        dst.mkdir(parents=True, exist_ok=True)
        for n in NAMES:
            src = ROOT / 'docs' / 'assets' / f'{n}.js'
            if not src.exists():
                sys.exit(f'없음: {src}')
            shutil.copy2(src, dst / f'{n}.js')
        for n in OPTIONAL:
            src = ROOT / 'docs' / 'assets' / f'{n}.js'
            if src.exists():
                shutil.copy2(src, dst / f'{n}.js')
        print('데이터 폴더:', dst, f'({sum((dst / (n + ".js")).stat().st_size for n in NAMES) / 1e6:.1f}MB)')
    print(f'접속 코드 {len(codes)}개: {cf} 에서 확인 (화면에는 찍지 않음)')


if __name__ == '__main__':
    main()
