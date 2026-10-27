/* 영어 출원 기준 (모집요강 2027 → 숫자). 키 = "<모집요강 id>/<전형 id>".
 * 학생의 토플·토익·IELTS 와 비교해 「충족 / 미달」을 판정하는 데 쓴다 (app.js engJudge). 대학이 공개한 기준점이며 학생·합격 데이터는 아니다.
 *
 * accept : 판정에 쓸 수 있는 시험 — ibt(TOEFL iBT) · ielts · toeic(TOEIC L&R).
 *          요강이 인정하더라도 학원에 점수가 없는 시험(영검·케임브리지·GTEC 등)과, 점수를 합쳐 내야 하는 TOEIC(L&R+S&W)은 뺐다.
 * min    : 시험별 최저 기준. 없으면 「기준점 없음 — 점수 제출만 필수」.
 *          ibt = 2026-01-20 이전 시험의 0~120 점수 기준, band = 2026-01-21 이후 새 1~6 밴드 기준.
 * by_fac : 학부(fac_ja)마다 기준이 다를 때. 없는 학부는 all.
 * note   : 화면에 작게 덧붙이는 말.
 * 요강이 바뀌면 이 파일을 고친다 (build_yoko 의 영어 칸 문장과 같은 내용이어야 함). */
window.ENG_RULES = {
  'chuo-2027/law': { all: { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 480, ibt: 42, band: 3.0, ielts: 4.5 } } },
  'chuo-2027/shoa': { all: { accept: ['ibt', 'ielts', 'toeic'] } },
  'chuo-2027/shob': { all: { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 470, ibt: 39, band: 2.5, ielts: 4.5 }, note: 'EJU를 영어로 응시했으면 영어 요건 불필요' } },
  'chuo-2027/riko': { all: { accept: ['ibt', 'ielts', 'toeic'] } },
  'chuo-2027/bun': { all: { accept: ['ibt', 'ielts', 'toeic'] } },
  'chuo-2027/sogo': { all: { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 550, ibt: 56, band: 3.0, ielts: 4.5 } } },
  'chuo-2027/gma': { all: { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.0, ielts: 4.0 }, note: 'TOEIC은 L&R 550 + S&W 240 이상 (S&W 점수 필요)' } },

  'hitotsu-2027/shihi': { all: { accept: ['ibt'], min: { ibt: 48, band: 3.0 }, note: 'TOEFL iBT만 인정' } },

  'hosei-2027/ryugakusei': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 비공개 — 점수 제출은 필수' } },

  'kansai-2027/sep': { by_fac: {
    '文学部': { accept: ['ibt', 'ielts', 'toeic'] },
    '経済学部': { accept: ['ibt', 'toeic'] },
    '社会学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 37, band: 2.5, ielts: 3.5, toeic: 420 } } } },
  'kansai-2027/nov': { by_fac: {
    '文学部': { accept: ['ibt', 'ielts', 'toeic'] },
    '経済学部': { accept: ['ibt', 'toeic'] },
    '商学部': { accept: ['ibt', 'toeic'] },
    '人間健康学部': { accept: ['ibt', 'toeic'] },
    'ビジネスデータサイエンス学部': { accept: ['ibt', 'toeic'] } } },

  'keio-2027/shorui': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 · 구·신 TOEFL 모두 제출 가능' } },
  'keio-2027/bun': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 · 구·신 TOEFL 모두 제출 가능' } },
  'keio-2027/sho': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 · 구·신 TOEFL 모두 제출 가능' } },

  'kyoto-2027/law': { all: { accept: ['ibt'], note: 'TOEFL iBT만 · 기준점 명시 없음' } },
  'kyoto-2027/econ': { all: { accept: ['ibt'], note: 'TOEFL iBT만 · 기준점 명시 없음' } },

  'osaka-2027/shihi': { by_fac: {
    '文学部': { accept: ['ibt'], min: { ibt: 48, band: 3.0 } },
    '人間科学部': { accept: ['ibt'], min: { ibt: 79, band: 4.0 } },
    '法学部': { accept: ['ibt'], min: { ibt: 61, band: 3.5 } },
    '理学部': { accept: ['ibt'], min: { ibt: 61, band: 3.5 } },
    '薬学部': { accept: ['ibt'], min: { ibt: 61, band: 3.5 } },
    '経済学部': { accept: ['ibt'] }, '医学部': { accept: ['ibt'] }, '工学部': { accept: ['ibt'] }, '基礎工学部': { accept: ['ibt'] } } },

  'rikkyo-2027/tonichimae': { by_fac: {
    '文学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.0, ielts: 4.0 } },
    '社会学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.0, ielts: 4.0 } },
    'コミュニティ福祉学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.0, ielts: 4.0 } },
    'スポーツウエルネス学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.0, ielts: 4.0 } },
    '経営学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.5, ielts: 4.0 }, note: 'TOEIC은 L&R+S&W 합계 1,150 (S&W 점수 필요)' },
    '経済学部': { accept: ['ibt', 'ielts'] }, '観光学部': { accept: ['ibt', 'ielts'] }, '現代心理学部': { accept: ['ibt', 'ielts'] },
    '理学部': { accept: ['ibt', 'ielts'] }, '法学部': { accept: ['ibt', 'ielts'] }, '環境学部': { accept: ['ibt', 'ielts'] } } },

  'todai-2027/type1': { all: { accept: ['ibt', 'ielts'], note: '기준점 명시 없음' } },

  /* doshisha */
'doshisha-2027/term1': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 점수 제출만 필수. TOEIC은 L&R(공개 시험)만, IP 불가. 스포츠건강과학부·글로벌커뮤니케이션학부는 TOEFL 2026-01-21 이후 시험을 1~6 밴드로 취급' } },
  'doshisha-2027/term2': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 점수 제출만 필수. TOEIC은 L&R(공개 시험)만, IP 불가. 스포츠건강과학부·글로벌커뮤니케이션학부는 TOEFL 2026-01-21 이후 시험을 1~6 밴드로 취급' } },

  /* kwansei */
// 칸세이학원대학 (kwansei) — 기준점 없음, 점수 제출만
  'kwansei-2027/ki1': { by_fac: {
    '経済学部': { accept: ['ibt', 'ielts', 'toeic'], note: '영어시험은 있으면 바람직(필수 아님) · 기준점 없음' },
    '商学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수 · TOEIC IP 인정, 자택 응시형(TOEIC IP 제외)은 불가' },
    '理学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 영어 모국어자 등은 면제 가능' },
    '工学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 영어 모국어자 등은 면제 가능' },
    '生命環境学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 영어 모국어자 등은 면제 가능' },
    '建築学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 영어 모국어자 등은 면제 가능' } } },
  'kwansei-2027/ki2': { by_fac: {
    '経済学部': { accept: ['ibt', 'ielts', 'toeic'], note: '영어시험은 있으면 바람직(필수 아님) · 기준점 없음' },
    '商学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수 · TOEIC IP 인정, 자택 응시형(TOEIC IP 제외)은 불가' },
    '理学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 영어 모국어자 등은 면제 가능' },
    '工学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 영어 모국어자 등은 면제 가능' },
    '生命環境学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 영어 모국어자 등은 면제 가능' },
    '建築学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 영어 모국어자 등은 면제 가능' } } },

  /* meiji */
'meiji-2027/type1': { by_fac: {
    '法学部': { accept: ['ibt'], min: { ibt: 45, band: 3.0 }, note: 'TOEFL iBT만 (표에 TOEIC·IELTS 기재 없음)' },
    '商学部': { accept: ['ibt', 'toeic'], min: { ibt: 48, band: 3.0, toeic: 600 } },
    '政治経済学部': { accept: ['ibt', 'ielts', 'toeic'], note: '출원 기준점 없음 — 점수 제출은 필수' },
    '理工学部': { accept: ['ibt', 'toeic'], note: '출원 기준점 없음 — 점수 제출은 필수 (IELTS 불가)' },
    '農学部': { accept: ['ibt', 'ielts', 'toeic'], note: '출원 기준점 없음 — 점수 제출은 필수' },
    '経営学部': { accept: ['ibt'], min: { ibt: 41, band: 3.0 }, note: 'TOEFL iBT만' },
    '情報コミュニケーション学部': { accept: ['ibt', 'toeic'], min: { ibt: 42, band: 3.0, toeic: 550 } },
    '国際日本学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 44, band: 3.0, ielts: 4.0, toeic: 565 } },
    '総合数理学部': { accept: ['ibt', 'ielts', 'toeic'], note: '출원 기준점 없음 — 점수 제출은 필수' } } },
  'meiji-2027/type2_com': { all: { accept: ['ibt', 'toeic'], min: { ibt: 48, band: 3.0, toeic: 600 } } },
  'meiji-2027/type2_intl': { all: { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 48, band: 3.0, ielts: 4.0, toeic: 600 }, note: '영어 모어 화자는 제출 면제 가능성 — 학부에 사전 문의' } },

  /* musashino */
'musashino-2027/ki1': { by_fac: { 'グローバル学部': { accept: ['ibt', 'ielts', 'toeic'], note: '글로벌비즈니스학과만 필수(TOEFL iBT 61·IELTS 5.5·TOEIC L&R 700 중 하나). 글로벌커뮤니케이션·일본어커뮤니케이션학과는 임의 제출 — 학과별 기준이라 min 생략' } } },
  'musashino-2027/ki2': { by_fac: { 'グローバル学部': { accept: ['ibt', 'ielts', 'toeic'], note: '글로벌비즈니스학과만 필수(TOEFL iBT 61·IELTS 5.5·TOEIC L&R 700 중 하나). 글로벌커뮤니케이션·일본어커뮤니케이션학과는 임의 제출 — 학과별 기준이라 min 생략' } } },
  'musashino-2027/ki3': { by_fac: { 'グローバル学部': { accept: ['ibt', 'ielts', 'toeic'], note: '글로벌비즈니스학과만 필수(TOEFL iBT 61·IELTS 5.5·TOEIC L&R 700 중 하나). 글로벌커뮤니케이션·일본어커뮤니케이션학과는 임의 제출 — 학과별 기준이라 min 생략' } } },

  /* ritsumeikan */
'ritsumeikan-2027/zenki': { by_fac: {
    '国際関係学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 2차 선고에서 영어 성적 평가' },
    '経営学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수' },
    '生命科学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 2차 선고에서 영어 성적 평가' },
    '薬学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 2차 선고에서 영어 성적 평가' },
    '経済学部': { accept: ['ibt', 'ielts', 'toeic'], note: '국제전공만 영어 필수(iBT 58점·3.5밴드 / IELTS 4.5 / TOEIC L&R 550). 경제전공은 불필요' } } },
  'ritsumeikan-2027/koki': { by_fac: {
    '国際関係学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 2차 선고에서 영어 성적 평가' },
    '経営学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수' },
    '生命科学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 2차 선고에서 영어 성적 평가' },
    '薬学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 2차 선고에서 영어 성적 평가' },
    '経済学部': { accept: ['ibt', 'ielts', 'toeic'], note: '국제전공만 영어 필수(iBT 58점·3.5밴드 / IELTS 4.5 / TOEIC L&R 550). 경제전공은 불필요' } } },

  /* takushoku */
'takushoku-2027/b1': { by_fac: { '外国語学部': { accept: ['toeic'], min: { toeic: 450 }, note: '영미어학과만 TOEIC L&R 450점 이상 필요 (중국어·스페인어·국제일본어학과는 불필요)' } } },
  'takushoku-2027/b2': { by_fac: { '外国語学部': { accept: ['toeic'], min: { toeic: 450 }, note: '영미어학과만 TOEIC L&R 450점 이상 필요 (중국어·스페인어·국제일본어학과는 불필요)' } } },

  /* teikyo */
'teikyo-2027/p1': { all: { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 550, ibt: 44, band: 3.0, ielts: 4.0 }, note: '필수 아님 — 기준 이상이면 우대 가점 10점' } },
  'teikyo-2027/p2': { all: { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 550, ibt: 44, band: 3.0, ielts: 4.0 }, note: '필수 아님 — 기준 이상이면 우대 가점 10점' } },

  /* tokai */
'tokai-2027/ippan1': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 영어 점수 제출 항목 없음)' } },
  'tokai-2027/ippan2': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 영어 점수 제출 항목 없음)' } },

  /* tus */
'tus-2027/ki1': { all: { accept: ['ibt', 'toeic'], note: '기준점 없음 — 점수 제출은 필수. TOEFL iBT Total(0-120) 입력, 밴드 점수 불가 · TOEIC은 L&R(공개테스트)만 · 2025-01 이후 응시' } },
  'tus-2027/ki2': { all: { accept: ['ibt', 'toeic'], note: '기준점 없음 — 점수 제출은 필수. TOEFL iBT Total(0-120) 입력, 밴드 점수 불가 · TOEIC은 L&R(공개테스트)만 · 2025-01 이후 응시' } },

  /* waseda */
'waseda-2027/gakubu': { all: { accept: ['ibt'] }, by_fac: {
    '政治経済学部': { accept: ['ibt', 'ielts'], note: '기준점 없음 — TOEFL iBT 또는 IELTS 제출 필수. 응시 2025-10-01~2026-05-31' },
    '法学部': { accept: ['ibt', 'ielts'], note: '기준점 없음 — TOEFL·IELTS·독일어·프랑스어 중 제출 필수. 응시 2025-10-01~2026-05-31' },
    '教育学部': { accept: ['ibt', 'ielts'], note: '교육학·생애교육학전수만 해당(영어영문학과는 영어 불필요, JLPT N1). 기준점 없음' },
    '商学部': { accept: ['ibt'], note: 'TOEFL iBT만 인정. 기준점 없음. 응시 2025-10-01~2026-05-31' },
    '社会科学部': { accept: ['ibt'], note: 'TOEFL iBT만 인정. 기준점 없음' },
    '文化構想学部': { accept: ['ibt'], note: 'TOEFL iBT만 인정. 기준점 없음' },
    '文学部': { accept: ['ibt'], note: 'TOEFL iBT만 인정. 기준점 없음' },
    '基幹理工学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 셋 중 하나 제출 필수(TOEIC은 L&R만)' },
    '創造理工学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 셋 중 하나 제출 필수(TOEIC은 L&R만)' },
    '先進理工学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 셋 중 하나 제출 필수(TOEIC은 L&R만)' },
    '人間科学部': { accept: ['ibt', 'ielts'], note: '기준점 없음 — TOEFL iBT 또는 IELTS 제출 필수' },
    'スポーツ科学部': { accept: ['ibt'], note: 'TOEFL iBT만 인정. 기준점 없음' } } },

  /* toyo */
'toyo-2027/honko': { by_fac: {
    '国際学部': { accept: ['ibt', 'ielts', 'toeic'], note: '영어면접형만 해당(EJU 이용형 국제지역학과는 영어 외부시험 불필요). 영검·TEAP·GTEC도 인정(점수 판정 불가). 기준점 요강에 없음 · TOEFL은 Home Edition 포함, MyBest·ITP·Essentials·IELTS One Skill Retake·TOEIC IP 불가. 10월 방식 2024-11 이후, 12월 방식 2025-01 이후 응시분' },
    '情報連携学部': { accept: ['ibt', 'toeic'], note: 'TOEIC L&R(IP 제외) 또는 TOEFL iBT(Home Edition 포함)만. 기준점 요강에 없음(점수를 100점으로 환산) · 10월 방식 2024-11 이후, 12월 방식 2025-01 이후 응시분 · INIAD 사전적성심사도 필요' } } },
  'toyo-2027/dojon_a': { all: { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 780, ibt: 79, band: 4.5, ielts: 6.0 }, note: '2024-11-01 이후 응시분. TOEFL iBT Home Edition 포함, MyBest·ITP 불가. 앰배서더 희망자는 TOEFL 94(밴드 5.0)·IELTS 6.5·TOEIC L&R 780+S&W 310 이상' } },
  'toyo-2027/dojon_b': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 2024-11-01 이후 응시분 점수 제출만 필수. TOEFL iBT Home Edition 포함, MyBest·ITP·TOEIC IP 불가' } },
  /* jochi */
// 죠치대학 (jochi) — 학과별 기준이 달라 학부 단위로는 가장 낮은 기준을 min으로 두고 note에 상세. TOEIC은 L&R+S&W 합계 요구라 제외
  'jochi-2027/gaikokujin': { by_fac: {
    '文学部': { accept: ['ibt', 'ielts'], min: { ibt: 72, band: 4.0, ielts: 5.5 }, note: '영문학과만 필요(영검 준1급·iBT 72·IELTS 5.5·TOEIC L&R785+S&W310). 다른 학과는 지정 없음' },
    '総合人間科学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.0, ielts: 4.0 }, note: '심리학과·사회학과만 필요(영검 2급·iBT 42·IELTS 4.0·TOEIC L&R550+S&W240). 교육·사회복지·간호는 지정 없음' },
    '経済学部': { accept: ['ibt', 'ielts'], min: { ibt: 55, band: 3.5, ielts: 4.5 }, note: '경영학과만 필요(영검 2급A·iBT 55·IELTS 4.5·TOEIC L&R650+S&W250). 경제학과는 지정 없음' },
    '外国語学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.0, ielts: 4.0 }, note: '영어학과는 iBT 72(밴드 4)·IELTS 5.5, 그 외 5개 학과는 iBT 42·IELTS 4.0' },
    '総合グローバル学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.0, ielts: 4.0 } },
    '理工学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.0, ielts: 4.0 }, note: '전 학과 필요(영검 2급·iBT 42·IELTS 4.0·TOEIC L&R550+S&W240)' } } },
  /* kindai */
// 킨키대학 (kindai) — 정보·농학부(전기·후기·도일전), 이공·건축·문예 영어영미문학전공(도일전)만 영어 성적 제출. 기준점 없음
  'kindai-2027/zenki': { by_fac: {
    '情報学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 출원 개시일부터 2년 이내, TOEFL ITP·TOEIC IP 불가' },
    '農学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 출원 개시일부터 2년 이내, TOEFL ITP·TOEIC IP 불가' } } },
  'kindai-2027/koki': { by_fac: {
    '情報学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 출원 개시일부터 2년 이내, TOEFL ITP·TOEIC IP 불가' },
    '農学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 출원 개시일부터 2년 이내, TOEFL ITP·TOEIC IP 불가' } } },
  'kindai-2027/dojozen': { by_fac: {
    '理工学部': { accept: ['ibt'], note: 'TOEFL 성적 제출 필수(기준점 없음). 출원 개시일부터 2년 이내' },
    '建築学部': { accept: ['ibt'], note: 'TOEFL 성적 제출 필수(기준점 없음). 출원 개시일부터 2년 이내' },
    '文芸学部': { accept: ['ibt'], note: '문학과 영어영미문학전공만 TOEFL 성적 제출(기준점 없음)' },
    '情報学部': { accept: ['ibt'], note: 'TOEFL 성적 제출 필수(기준점 없음). 출원 개시일부터 2년 이내' },
    '農学部': { accept: ['ibt'], note: 'TOEFL 성적 제출 필수(기준점 없음). 출원 개시일부터 2년 이내' } } },
  /* kokushikan — 규칙 없음 */
  /* senshu */
'senshu-2027/abroad': { by_fac: { '文学部': { accept: ['ibt'], min: { ibt: 61, band: 3.5 }, note: '영어영미문학과만 필수(TOEFL iBT, Home Edition 제외). 다른 학과는 영어 요건 없음' }, 'ネットワーク情報学部': { accept: ['ibt'], note: 'EJU를 영어로 응시하지 않은 경우 TOEFL iBT(Home Edition 제외) 점수 제출 필요. 기준점 표기 없음' } } },
  'senshu-2027/domestic': { by_fac: { '文学部': { accept: ['ibt'], min: { ibt: 61, band: 3.5 }, note: '영어영미문학과만 필수(TOEFL iBT, Home Edition 제외). 다른 학과는 영어 요건 없음' }, 'ネットワーク情報学部': { accept: ['ibt'], note: 'EJU를 영어로 응시하지 않은 경우 TOEFL iBT(Home Edition 제외) 점수 제출 필요. 기준점 표기 없음' } } },
  /* kanagawa */
'kanagawa-2027/gairyu': { by_fac: { '外国語学部': { accept: ['ibt'], note: '영어영문학과 IES 프로그램만 TOEFL 스코어 제출(기준점 표기 없음). 스페인어학과·중국어학과는 영어 요건 없음' }, '国際日本学部': { accept: ['ibt'], min: { ibt: 32 }, note: '국제문화교류학과만 iBT 32점 이상 필수(출원 시, 1년 이내 응시). 일본문화학과·역사민속학과는 영어 요건 없음' } } },
  /* seinan */
'seinan-2027/gaikokujin': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '영어 성적 요건 없음 — 출원 자격은 EJU 일본어 또는 JLPT N1' } },
  /* aoyama */
// 아오야마가쿠인대학 (aoyama)
  'aoyama-2027/eibun': { all: { accept: ['ibt', 'ielts'], min: { ibt: 80, band: 4.0, ielts: 6.0 }, note: 'SAT/ACT 병행 필수. TOEFL iBT 80(2026-01-20 이전) / 밴드 4.0(2026-01-21 이후) · IELTS 6.0 · TOEIC는 L&R 830+S150+W160 합계 요구라 제외 · 영검 1급도 인정 · 영어 주언어 교육 5년 이상이면 면제' } },
  'aoyama-2027/niden': { by_fac: {
    '国際政治経済学部': { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 590, ibt: 61, band: 3.5, ielts: 5.0 }, note: 'TOEFL iBT 61(2026-01-20 이전) / 밴드 3.5(2026-01-21 이후) · TOEIC L&R 590 · IELTS 5.0 중 1종' },
    '総合文化政策学部': { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 550, ibt: 44, band: 3.0, ielts: 4.0 }, note: 'TOEFL iBT 44(2026-01-20 이전) / 밴드 3.0(2026-01-21 이후) · TOEIC L&R 550 · IELTS 4.0 중 1종' },
    '社会情報学部': { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 500, ibt: 50, band: 3.0, ielts: 4.5 }, note: 'TOEFL iBT 50(2026-01-20 이전) / 밴드 3.0(2026-01-21 이후) · TOEIC L&R 500 · IELTS 4.5 중 1종' },
    '文学部': { accept: [], note: '영어 외부시험 요건 없음 (일부 학과는 2차 필기에 영어)' },
    '教育人間科学部': { accept: [], note: '영어 외부시험 요건 없음 (2차 필기에 영어)' },
    '経済学部': { accept: [], note: '영어 외부시험 요건 없음' },
    '法学部': { accept: [], note: '영어 외부시험 요건 없음' },
    '経営学部': { accept: [], note: '영어 외부시험 요건 없음' } } },
  'aoyama-2027/riko': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 — TOEFL iBT 또는 IELTS 점수 제출(합부 판정에 사용). TOEIC 불가' } },
  /* chukyo */
// 츄쿄대학 (chukyo) — 영어 외부시험 요건 없음
  'chukyo-2027/zenki': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 영어 점수 제출 항목 없음)' } },
  'chukyo-2027/koki': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 영어 점수 제출 항목 없음)' } },
  /* kyotoseika */
// 京都精華大学 (kyotoseika) — 영어 자격은 임의(학력시험 영어 점수 환산용). 기준점 없음
  'kyotoseika-2027/ki1': { all: { accept: ['ibt', 'ielts'], note: '필수 아님 · 영어 자격은 학력시험 영어 점수 환산용(80점 환산 하한 iBT 42·IELTS 4.0). 자격을 써도 대학 영어 시험은 응시 필요. TOEIC은 L&R+S&W 합산이라 판정 제외' } },
  'kyotoseika-2027/ki2': { all: { accept: ['ibt', 'ielts'], note: '필수 아님 · 영어 자격은 학력시험 영어 점수 환산용(80점 환산 하한 iBT 42·IELTS 4.0). 자격을 써도 대학 영어 시험은 응시 필요. TOEIC은 L&R+S&W 합산이라 판정 제외' } },
  /* tokyojoshi */
// 東京女子大学 (tokyojoshi) — 4기능 영어 자격 기준 충족이 출원 조건. TOEIC은 L&R+S&W 합계(585)라 판정에서 제외
  'tokyojoshi-2027/ryu': { all: { accept: ['ibt', 'ielts'], min: { ibt: 30, ielts: 3.0 }, note: '4기능 기준 충족이 출원 조건(1기능이라도 점수 없으면 불가). TOEIC은 L&R+S&W 합계 585 이상 필요(판정 제외). TOEFL은 2026-01-21 이후 응시분도 0-120 점수 기준. iBT Home Edition·Essentials·MyBest·IELTS Online 불가' } },
  /* obirin */
// 오비린대학 (obirin) — 영어는 글로벌·커뮤니케이션학군 E방식(편입은 영어 트랙)만
  'obirin-2027/kokusai1': { by_fac: { 'グローバル・コミュニケーション学群': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 61, ielts: 5.5, toeic: 600 }, note: 'E방식만 해당(J방식은 일본어). 장학생 선발은 iBT 67 · IELTS 6.0 · TOEIC 710. 새 TOEFL는 성적표 병기 구 점수(0~120)로 판정' } } },
  'obirin-2027/kokusai2': { by_fac: { 'グローバル・コミュニケーション学群': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 61, ielts: 5.5, toeic: 600 }, note: 'E방식만 해당(J방식은 일본어). 장학생 선발은 iBT 67 · IELTS 6.0 · TOEIC 710. 새 TOEFL는 성적표 병기 구 점수(0~120)로 판정' } } },
  'obirin-2027/hennyu1': { by_fac: { 'グローバル・コミュニケーション学群': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 65, ielts: 5.5, toeic: 650 }, note: '영어 트랙 3학년 편입만 해당' } } },
  'obirin-2027/hennyu2': { by_fac: { 'グローバル・コミュニケーション学群': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 65, ielts: 5.5, toeic: 650 }, note: '영어 트랙 3학년 편입만 해당' } } },
  /* daito */
// 다이토분카대학 (daito) — 도일전 영어학과만 공적 영어시험 점수 제출(기준 없음)
  'daito-2027/dojp': { by_fac: { '外国語学部': { accept: ['ibt', 'ielts', 'toeic'], note: '영어학과만 해당 · 기준점 없음, 점수 제출만 필수' } } },
  /* ryukoku */
'ryukoku-2027/zenki': { by_fac: {
    '国際学部': { accept: ['ibt', 'ielts', 'toeic'], note: 'グローバルスタディーズ学科만 출원 자격으로 필수(英検2級·iBT 55·TOEIC L&R 600·GTEC 920·国連英検B級·IELTS 5.0 중 1개, 2024-04-01 이후 응시). 国際文化学科는 영어 불필요 — 학과별 기준이라 min 생략' },
    '情報学部': { accept: ['ibt', 'toeic'], note: 'TOEFL 또는 TOEIC 성적 제출 필수(2026-04 이후 응시분, 기준점 없음). TOEIC IP 불가' },
    '理工学部': { accept: ['ibt', 'toeic'], note: 'TOEFL 또는 TOEIC 성적 제출 필수(2026-04 이후 응시분, 기준점 없음). TOEIC IP 불가' } } },
  /* meijigakuin */
'meijigakuin-2027/apr': { all: { accept: ['ibt', 'ielts'], note: '제출 필수(기준점 없음). TOEIC은 L&R+S&W 합계 제출이라 판정 제외. TOEFL Home Edition·IELTS Online 불가' } },
  'meijigakuin-2027/sep': { all: { accept: ['ibt', 'ielts'], note: '제출 필수(기준점 없음). TOEIC은 L&R+S&W 합계 제출이라 판정 제외. TOEFL Home Edition·IELTS Online 불가' } },
  /* kyotogeijutsu — 규칙 없음 */
  /* musabi — 규칙 없음 */
  /* komazawa — 규칙 없음 */
  /* meikai */
'meikai-2027/ippan': { all: { accept: [], note: '영어 성적 요건 없음. 영미어학과·관광전공은 면접 뒤 영어 운용력 진단(자체 시험)' } },
  'meikai-2027/ippan_gm': { all: { accept: [], note: '영어 성적 요건 없음 (강의 이해력 판정 테스트+면접)' } },
  'meikai-2027/suisen': { all: { accept: [], note: '영어 성적 요건 없음' } },
  'meikai-2027/shigaku': { all: { accept: [], note: '영어 성적 요건 없음 (소논문·수학적 사고력 테스트·면접)' } },
  /* ryutsukeizai */
'ryutsukeizai-2027/suisen': { all: { accept: [], note: '영어 성적 요건 없음 (서류+면접)' } },
  'ryutsukeizai-2027/gaibu': { all: { accept: [], note: '영어 성적 요건 없음 (서류+면접)' } },
  'ryutsukeizai-2027/ippan': { all: { accept: [], note: '영어 성적 요건 없음 (자체 일본어 시험+서류+면접)' } },
  /* nagoya */
'nagoya-2027/shihi': { by_fac: {
    '文学部': { accept: ['ibt', 'ielts'], min: { ibt: 61, ielts: 5.5 }, note: '구 0-120 스케일 기준 (새 1-6 밴드 아님) · 2025-02-01 이후 응시' },
    '法学部': { accept: ['ibt', 'ielts'], min: { ibt: 61, ielts: 5.5 }, note: '구 0-120 스케일 기준 (새 1-6 밴드 아님) · 2025-02-01 이후 응시' },
    '教育学部': { accept: ['ibt'], min: { ibt: 61 }, note: '구 0-120 스케일 기준 · IELTS 기준 표기 없음' },
    '情報学部': { accept: ['ibt'], min: { ibt: 61 }, note: '구 0-120 스케일 기준 · IELTS 기준 표기 없음' },
    '経済学部': { accept: ['ibt'], min: { ibt: 71 }, note: '구 0-120 스케일 기준 · IELTS 기준 표기 없음' },
    '理学部': { accept: ['ibt', 'ielts'], min: { ibt: 71, ielts: 6.0 }, note: '구 0-120 스케일 기준 (새 1-6 밴드 아님)' },
    '医学部': { accept: ['ibt'], min: { ibt: 61 }, note: '보건학과 iBT 61, 의학과 iBT 90 (구 0-120 스케일) · IELTS 기준 표기 없음' },
    '農学部': { accept: ['ibt', 'ielts'], min: { ibt: 61, ielts: 6.0 }, note: '구 0-120 스케일 기준 · 농학부는 TOEFL MyBest 불가' } } },
  /* gakushuin */
'gakushuin-2027/kokusai': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음. EJU 일본어+종합과목(일본어)로 출원할 때만 필수 (종합과목 영어 응시·본교 시험·일본어학교 추천이면 불필요) · TOEFL MyBest·IELTS One Skill Retake 불가, TOEIC은 L&R(공개)만 · 취득 후 2년 이내(2024-08 이후)' } },
  /* osakakeihou */
'osakakeihou-2027/y1a': { by_fac: { '国際学部': { accept: ['ibt', 'ielts', 'toeic'], note: '영어 점수는 필수 아님 — 제출하면 채점에 반영(기준점 없음)' } } },
  'osakakeihou-2027/y1b': { by_fac: { '国際学部': { accept: ['ibt', 'ielts', 'toeic'], note: '영어 점수는 필수 아님 — 제출하면 채점에 반영(기준점 없음)' } } },
  'osakakeihou-2027/y1c': { by_fac: { '国際学部': { accept: ['ibt', 'ielts', 'toeic'], note: '영어 점수는 필수 아님 — 제출하면 채점에 반영(기준점 없음)' } } },
  'osakakeihou-2027/y3a': { by_fac: { '国際学部': { accept: ['ibt', 'ielts', 'toeic'], note: '영어 점수는 필수 아님 — 제출하면 채점에 반영(기준점 없음)' } } },
  'osakakeihou-2027/y3b': { by_fac: { '国際学部': { accept: ['ibt', 'ielts', 'toeic'], note: '영어 점수는 필수 아님 — 제출하면 채점에 반영(기준점 없음)' } } },
  /* tokyokogei — 규칙 없음 */
};
