# 일공 진학 상담 (shinro)

원장님·담당 강사 전용 내부 도구. 화면(`docs/`)만 이 저장소에 있고, **데이터는 저장소에 없다.**
데이터는 선생님 구글 드라이브의 「진학상담_데이터」 폴더에 두고, 접속 코드를 맞게 입력하면 Apps Script 웹앱이 읽어서 화면에 보낸다 (성적노트와 같은 방식).

- `docs/` 화면 (GitHub Pages) · `design/` 디자인 시스템 · `apps-script/` 서버 코드 · `tools/` 데이터 만드는 스크립트 · `tests/` 서버 코드 테스트
- 접속 코드·코드 해시·데이터는 저장소에 올리지 않는다 (`.gitignore`).
- 설치 순서: `python3 tools/gas_setup.py --export <폴더>` → 폴더를 드라이브에 올림 → `.secret/설치용_Code.gs` 를 Apps Script 에 붙여넣고 `setup`·`selfTest` 실행 → 웹앱으로 배포 → 주소를 `docs/assets/config.js` 의 `API_URL` 에 넣음.
- **개발판·본판 (2026-11-06)**: 본판 = main 브랜치 화면 `…/shinro/docs/` + 드라이브 「진학상담_데이터」 (원장님 주소). 개발판 = dev 브랜치 화면 `…/shinro/dev/docs/` + 「진학상담_데이터_dev」. 배포는 `.github/workflows/pages.yml` 이 두 브랜치를 한 사이트로 묶어 올린다.
- 처음 한 번: Settings → Pages → Source 「GitHub Actions」, Settings → Environments → github-pages 의 배포 허용 브랜치에 `dev` 추가, 드라이브에 「진학상담_데이터_dev」 폴더(본판 파일 복사), 새 `.secret/설치용_Code.gs` 를 Apps Script 에 붙여넣고 새 버전으로 배포(주소 그대로).
- 고치는 순서: dev 브랜치에서 화면 수정 → 개발판 주소에서 확인 → PR 로 main 병합. 데이터는 `python3 tools/gas_setup.py --export <폴더>`(기본 dev) → 개발판 폴더에 덮어쓰기 → 확인 후 Apps Script 편집기에서 `promoteDevToProd()` 실행(본판의 이전 파일은 「_이전」 폴더에 보관).
- **캐시 미리 데우기**: 데이터를 처음 묶을 때 1분 반쯤 걸린다(그다음은 약 7초). Apps Script 에서 `installWarmTrigger()` 를 한 번 실행하면 1시간마다 `warmCache()` 가 본판·개발판 캐시를 미리 만든다. 드라이브에 파일을 올린 직후에는 `warmCache()` 를 직접 한 번 실행한다 (`promoteDevToProd()` 는 끝에 자동 실행).
- 학생 데이터(모의고사 점수 + 토플·토익·IELTS): `python3 tools/students_export.py --mock 2026_1회….xlsx … 2026_4회….xlsx` (전국모의고사 채점시트) → `docs/assets/students.js` 를 드라이브 폴더에 덮어쓴다.
- 「입시 결과」 탭 데이터: `python3 tools/results_export.py` → `docs/assets/results.js` 를 드라이브 폴더에 올린다 (없어도 다른 화면은 동작). 새로 쓰려면 Apps Script 코드를 `.secret/설치용_Code.gs` 로 다시 붙여 넣고 새 버전으로 배포한다.
