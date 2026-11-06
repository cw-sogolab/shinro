/* Apps Script 웹앱 주소 (접속 코드를 보내 데이터를 받는 곳). 비워 두면 같은 폴더의 평문 데이터로 열림(개발용)
 * ENV: 주소에 /dev/ 가 있으면 개발판(dev 브랜치 화면 + 드라이브 「진학상담_데이터_dev」), 아니면 본판(원장님 주소) */
window.SHINRO_CONFIG = { API_URL: 'https://script.google.com/macros/s/AKfycbwhAlfCXtsMX1GIGATWQb4BLF5711ksK4oW4VJYYzxZg7ivSoUfh8ZYzSoMH6DYdzsF/exec', ENV: /\/dev\//.test(location.pathname) ? 'dev' : 'prod' };
