# 일공 진학 상담 (shinro)

원장님·담당 강사 전용 내부 도구. 화면(`docs/`)만 이 저장소에 있고, **데이터는 저장소에 없다.**
데이터는 선생님 구글 드라이브의 「진학상담_데이터」 폴더에 두고, 접속 코드를 맞게 입력하면 Apps Script 웹앱이 읽어서 화면에 보낸다 (성적노트와 같은 방식).

- `docs/` 화면 (GitHub Pages) · `design/` 디자인 시스템 · `apps-script/` 서버 코드 · `tools/` 데이터 만드는 스크립트 · `tests/` 서버 코드 테스트
- 접속 코드·코드 해시·데이터는 저장소에 올리지 않는다 (`.gitignore`).
- 설치 순서: `python3 tools/gas_setup.py --export <폴더>` → 폴더를 드라이브에 올림 → `.secret/설치용_Code.gs` 를 Apps Script 에 붙여넣고 `setup`·`selfTest` 실행 → 웹앱으로 배포 → 주소를 `docs/assets/config.js` 의 `API_URL` 에 넣음.
- 데이터를 새로 만들면 같은 이름으로 드라이브 폴더에 덮어쓴다.
