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
  /* kyushu */
// 九州大学 (kyushu) — 기준점 없음, TOEFL iBT·IELTS·케임브리지 영검 중 출원 전 2년 이내 성적 제출(합부 판정용 점수 기준 없음)
  'kyushu-2027/shihi': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 — TOEFL iBT·IELTS 아카데믹 또는 케임브리지 영검(FCE·CAE·CPE) 제출 필수(2025-01 이후 응시). 공창학부는 Home Edition 등 자택 수험형 불가, 농학부는 IELTS Online 불가. TOEIC 불가' } },
  /* hokkaido */
// 北海道大学 (hokkaido) — 의학부 의학과만 기준점(TOEFL iBT 79 / TOEIC L&R 750). 문학부는 TOEFL iBT 제출. 그 외 기준점 없음
  'hokkaido-2027/shihi': { by_fac: {
    '文学部': { accept: ['ibt'], note: '기준점 없음 — TOEFL iBT(Home Edition 가) 성적 제출 필수' },
    '医学部': { accept: ['ibt', 'ielts', 'toeic'], note: '의학과만 TOEFL iBT 79 이상(Home Edition 가, Test Date 스코어) 또는 TOEIC L&R 750 이상(IELTS 불가). 보건학과는 기준점 없음(TOEFL·TOEIC·IELTS 등 제출)' },
    '教育学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — TOEFL·TOEIC L&R·IELTS·영검 등 영어 자격 성적 제출' },
    '法学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — TOEFL·TOEIC L&R·IELTS·영검 등 영어 자격 성적 제출' },
    '経済学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — TOEFL·TOEIC L&R·IELTS·영검 등 영어 자격 성적 제출' },
    '理学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — TOEFL·TOEIC L&R·IELTS·영검 등 영어 자격 성적 제출' },
    '歯学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — TOEFL·TOEIC L&R·IELTS·영검 등 영어 자격 성적 제출' },
    '薬学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — TOEFL·TOEIC L&R·IELTS·영검 등 영어 자격 성적 제출' },
    '工学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — TOEFL·TOEIC L&R·IELTS·영검 등 영어 자격 성적 제출' },
    '農学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — TOEFL·TOEIC L&R·IELTS·영검 등 영어 자격 성적 제출' },
    '獣医学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — TOEFL·TOEIC L&R·IELTS·영검 등 영어 자격 성적 제출' },
    '水産学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — TOEFL·TOEIC L&R·IELTS·영검 등 영어 자격 성적 제출' } } },
  /* tohoku */
// 東北大学 (tohoku) — 전 학부 TOEFL iBT 72 이상(2026-01 이후 시험은 밴드 4.0 이상). Test Date 스코어만
  'tohoku-2027/shihi': { all: { accept: ['ibt'], min: { ibt: 72, band: 4.0 }, note: 'TOEFL iBT만(IELTS·TOEIC 불가). 72점 이상, 2026-01 이후 시험은 밴드 4.0 이상. 2025-03-01 이후 응시, Test Date 스코어만(MyBest 불가), ETS 직송(코드 8806)' } },
  /* tsukuba */
// 츠쿠바대학 (tsukuba) — 외국학교경험자특별입시 제1종 (10월·1월 모집)
  'tsukuba-2027/oct': { by_fac: {
    '人文・文化学群': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 69, band: 3.5, ielts: 5.5, toeic: 650 }, note: 'TOEFL iBT 69(2026-01-20 이전) / 밴드 3.5(2026-01-21 이후) · TOEIC L&R 650 · IELTS Academic 5.5 중 1종 · 2024-11 이후 응시분 · 교육 주언어 영어 3년 이상이면 제출 면제' },
    '生命環境学群': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 61, band: 3.5, ielts: 5.0, toeic: 600 }, note: '생물자원학류: TOEFL iBT 61(2026-01-20 이전) / 밴드 3.5(2026-01-21 이후) · TOEIC L&R 600 · IELTS Academic 5.0 중 1종 · 2024-11 이후 응시분 · 교육 주언어 영어 3년 이상이면 제출 면제' },
    '理工学群': { accept: ['ibt', 'ielts', 'toeic'], note: '레벨 불문 — 기준점 없음, 점수 제출만(TOEFL iBT·TOEIC L&R·IELTS Academic 외 영검·GTEC·TEAP·케임브리지 영어검정도 가능) · 2024-11 이후 응시분' },
    '情報学群': { accept: ['ibt', 'ielts', 'toeic'], note: '레벨 불문 — 기준점 없음, 점수 제출만(영검·GTEC·TEAP·케임브리지 영어검정도 가능) · 2024-11 이후 응시분' },
    '医学群': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 61, band: 3.5, ielts: 5.0, toeic: 600 }, note: '의료과학학류: TOEFL iBT 61(2026-01-20 이전) / 밴드 3.5(2026-01-21 이후) · TOEIC L&R 600 · IELTS Academic 5.0 중 1종 · 2024-11 이후 응시분' },
    '体育専門学群': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 61, band: 3.5, ielts: 5.0, toeic: 600 }, note: 'TOEFL iBT 61(2026-01-20 이전) / 밴드 3.5(2026-01-21 이후) · TOEIC L&R 600 · IELTS Academic 5.0 중 1종 · 2024-11 이후 응시분' },
    '芸術専門学群': { accept: ['ibt', 'ielts', 'toeic'], note: '레벨 불문 — 기준점 없음, 점수 제출만 · 2024-11 이후 응시분' } } },
  'tsukuba-2027/jan': { by_fac: {
    '人間学群': { accept: ['ibt', 'ielts', 'toeic'], note: '레벨 불문 — 기준점 없음, 점수 제출만(영검·GTEC·TEAP·케임브리지 영어검정도 가능) · 2025-02 이후 응시분 · 교육 주언어 영어 3년 이상이면 제출 면제' },
    '生命環境学群': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 61, band: 3.5, ielts: 5.0, toeic: 600 }, note: '생물학류: TOEFL iBT 61(2026-01-20 이전) / 밴드 3.5(2026-01-21 이후) · TOEIC L&R 600 · IELTS Academic 5.0 중 1종 · 2025-02 이후 응시분 · 교육 주언어 영어 3년 이상이면 제출 면제' },
    '情報学群': { accept: ['ibt', 'ielts', 'toeic'], note: '레벨 불문 — 기준점 없음, 점수 제출만(영검·GTEC·TEAP·케임브리지 영어검정도 가능) · 2025-02 이후 응시분' } } },
  /* ibaraki */
// 이바라키대학 (ibaraki) — 영어 외부시험 요건 없음
  'ibaraki-2027/gaikokujin': { all: { accept: [], note: '영어 외부시험 요건 없음 (출원 요건 (1)~(4)에 영어 점수 없음). 교육학부 영어선수·이학부는 면접 구술시험에서 영어 기초학력을 봄' } },
  /* yokokoku */
/* yokokoku */
  'yokokoku-2027/toshi': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수. 2024-11 이후 응시분. TOEFL iBT Home Edition 포함·Test Date 점수, TOEFL-ITP·TOEIC IP 불가, IELTS Academic(Online 포함)' } },
  'yokokoku-2027/rikou': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수(1종·1회분만). 2024-09 이후 응시분. TOEFL iBT Home Edition 포함·Test Date 점수(MyBest 불가), TOEIC S&W·Bridge·IP 불가, IELTS Academic(Online 포함)' } },
  /* shizuoka */
/* shizuoka — 인문사회과학부 전형(jinbun)은 영어 시험 불필요라 규칙 없음 */
  'shizuoka-2027/gakubu': { by_fac: {
    '教育学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 39, ielts: 4.0, toeic: 385 }, note: '출원 요건만(배점 없음). 구 0-120 스케일 기준 · 2025-02 이후 응시분 · TOEFL iBT는 Test Date 점수만(MyBest 불가)' },
    '情報学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 39, ielts: 4.0, toeic: 385 }, note: '출원 요건만(배점 없음). 구 0-120 스케일 기준 · 2025-02 이후 응시분 · TOEFL iBT는 Test Date 점수만(MyBest 불가)' },
    '理学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 39, ielts: 4.0, toeic: 385 }, note: '출원 요건만(배점 없음). 구 0-120 스케일 기준 · 2025-02 이후 응시분 · TOEFL iBT는 Test Date 점수만(MyBest 불가)' },
    '工学部': { accept: ['ibt', 'toeic'], min: { ibt: 39, toeic: 385 }, note: 'IELTS 불가(TOEFL iBT·TOEIC L&R만). 출원 요건이자 배점 100점 반영. 구 0-120 스케일 기준 · 2025-02 이후 응시분 · TOEFL iBT는 Test Date 점수만' },
    '農学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 39, ielts: 4.0, toeic: 385 }, note: '출원 요건만(배점 없음). 구 0-120 스케일 기준 · 2025-02 이후 응시분 · TOEFL iBT는 Test Date 점수만(MyBest 불가)' },
    'グローバル共創科学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 39, ielts: 4.0, toeic: 385 }, note: '출원 요건이자 배점 100점 반영. 구 0-120 스케일 기준 · 2025-02 이후 응시분 · TOEFL iBT는 Test Date 점수만(MyBest 불가)' } } },
  /* chiba */
// 치바대학 (chiba) — 문학부·법정경학부·간호학부는 영어 성적 요건 없음 (항목 없음)
  'chiba-2027/ri': { all: { accept: ['ibt', 'toeic'], note: 'TOEFL 또는 TOEIC L&R 응시·제출 필수 · 기준점 명시 없음 · 2024-11 이후 응시 · TOEFL은 Test Date 점수만' } },
  'chiba-2027/joho': { all: { accept: ['ibt', 'toeic'], note: 'TOEFL iBT 또는 TOEIC L&R 응시·제출 필수 · 기준점 명시 없음 · 2024-11 이후 응시 · iBT Home Edition·ITP·TOEIC IP 불인정' } },
  'chiba-2027/engei': { all: { accept: ['ibt', 'toeic'], note: 'TOEFL iBT 또는 TOEIC L&R 응시·제출 필수 · 기준점 명시 없음 · 2024-11 이후 응시 · iBT Home Edition·TOEIC IP 불인정' } },
  /* nagoyakogyo */
// 나고야공업대학 (nagoyakogyo)
  'nagoyakogyo-2027/shihi': { all: { accept: ['ibt', 'toeic'], note: 'TOEFL iBT 또는 TOEIC L&R 응시·제출 필수 · 기준점 명시 없음(면접·EJU와 종합 판정에 가미) · 구 0-120 스케일 기준 · 출원 기간 전 2년 이내 응시 · TOEIC S&W·ITP·IP 불인정' } },
  /* akita */
'akita-2027/dolljonzen': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수 (2025-12 이후 응시, TOEIC은 L&R 한정)' } },
  'akita-2027/shihi': { by_fac: { '国際資源学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수 (2025-01 이후 응시, EJU 불사용)' } } },
  /* yamagata */
'yamagata-2027/ri': { by_fac: { '理学部': { accept: ['ibt', 'toeic'], min: { ibt: 40, band: 3.0, toeic: 400 }, note: 'TOEFL iBT(Home Edition·MyBest 불가) 또는 TOEIC L&R만(IELTS 불인정) · TOEIC은 2024-04 이후 응시' } } },
  'yamagata-2027/igaku': { by_fac: { '医学部': { accept: ['ibt', 'toeic'], min: { ibt: 76, band: 4.0, toeic: 700 }, note: '의학과 기준. TOEFL iBT(Home Edition·MyBest 불가) 또는 TOEIC L&R만(IELTS 불인정) · TOEIC은 2024-04 이후 응시' } } },
  'yamagata-2027/kango': { by_fac: { '医学部': { accept: ['ibt', 'toeic'], min: { ibt: 70, band: 3.5, toeic: 650 }, note: '간호학과 기준. TOEFL iBT(Home Edition·MyBest 불가) 또는 TOEIC L&R만(IELTS 불인정) · TOEIC은 2024-04 이후 응시' } } },
  'yamagata-2027/kou': { by_fac: { '工学部': { accept: ['ibt', 'toeic'], min: { ibt: 44, band: 3.0, toeic: 566 }, note: 'TOEFL iBT(Home Edition·MyBest 불가) 또는 TOEIC L&R만(IELTS 불인정) · TOEIC은 2024-01 이후 응시' } } },
  'yamagata-2027/nou': { by_fac: { '農学部': { accept: ['ibt', 'toeic'], min: { ibt: 34, band: 2.5, toeic: 330 }, note: 'TOEFL iBT(Home Edition·MyBest 불가) 또는 TOEIC L&R만(IELTS 불인정) · TOEIC은 2024-04 이후 응시' } } },
  /* kagoshima */
'kagoshima-2027/hobun_ri_ko': { by_fac: {
    '法文学部': { accept: ['ibt', 'toeic'], min: { ibt: 36, toeic: 360 }, note: '출원 요건. 심리학코스만 TOEIC L&R 420 · TOEFL은 0-120 스케일 (새 1-6 밴드 환산 없음) · MyBest 불가 · 2025·2026년 응시분' },
    '理学部': { accept: ['ibt', 'toeic'], min: { ibt: 36, toeic: 420 }, note: '출원 요건 · TOEFL 0-120 스케일 · MyBest 불가 · 2025·2026년 응시분' },
    '工学部': { accept: ['ibt', 'toeic'], min: { ibt: 36, toeic: 420 }, note: '출원 요건 · TOEFL 0-120 스케일 · MyBest 불가 · 2025·2026년 응시분' } } },
  'kagoshima-2027/kyoiku_igaku_ta': { by_fac: {
    '教育学部': { accept: ['ibt'], min: { ibt: 36 }, note: '출원 요건 · TOEIC 불가 · TOEFL 0-120 스케일 · 2025·2026년 응시분' },
    '医学部': { accept: ['ibt', 'toeic'], min: { ibt: 42, toeic: 550 }, note: '보건학과 기준(iBT 42/TOEIC 550). 의학과는 iBT 90 이상·TOEIC 불가 · 0-120 스케일' },
    '歯学部': { accept: ['ibt', 'toeic'], min: { ibt: 61, toeic: 600 }, note: '출원 요건 · 0-120 스케일' },
    '農学部': { accept: ['ibt', 'toeic'], min: { ibt: 36, toeic: 420 }, note: '출원 요건 · 0-120 스케일' },
    '水産学部': { accept: ['ibt', 'toeic'], min: { ibt: 36, toeic: 420 }, note: '출원 요건 · 0-120 스케일' },
    '共同獣医学部': { accept: ['ibt', 'toeic'], min: { ibt: 36, toeic: 420 }, note: '축산학과 기준(iBT 36/TOEIC 420). 공동수의학과는 iBT 61·TOEIC 600 · 0-120 스케일' } } },
  /* osakakyoiku */
'osakakyoiku-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 영어 점수 제출 항목 없음; 국제협동영어 코스만 본교 영어 필기·구술)' } },
  /* nagasaki */
'nagasaki-2027/tabunka': { by_fac: {
    '多文化社会学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 61, band: 3.5, ielts: 5.5, toeic: 730 }, note: '출원 자격 · 2024-11 이후 응시 · iBT는 Test Date 점수만(Home Edition 포함 가능) · TOEIC IP·IELTS One Skill Retake 불가' } } },
  'nagasaki-2027/mid': { by_fac: {
    '経済学部': { accept: ['ibt', 'toeic'], min: { ibt: 39, band: 2.5, toeic: 385 }, note: '출원 자격 · 출원 마감일 기준 과거 2년 이내 · iBT는 Test Date 점수만(Home Edition 불가)' },
    '工学部': { accept: ['ibt', 'toeic'], note: '기준 점수 없음 — 응시만 필요(과거 2년 이내, Test Date 점수만)' },
    '水産学部': { accept: ['ibt', 'toeic'], note: '기준 점수 없음 — 응시만 필요(과거 2년 이내, Test Date 점수만)' },
    '情報データ科学部': { accept: [], note: '영어 외부시험 요건 없음 (면접에서 영어 능력 평가)' },
    '環境科学部': { accept: [], note: '영어 외부시험 요건 없음 (면접에서 영어 능력 평가)' } } },
  'nagasaki-2027/late': { by_fac: {
    '教育学部': { accept: ['ibt', 'toeic'], min: { ibt: 41, band: 2.5, toeic: 400 }, note: '소학교·유아·특별지원·중학교 문계(사회 선택)만. 영어 선택은 응시만, 중학교 이계·실기계는 요건 없음 · 과거 2년 이내 · Test Date 점수만' },
    '医学部': { accept: [], note: '영어 외부시험 요건 없음 (본교 시험에 영어 필기)' },
    '歯学部': { accept: [], note: '영어 외부시험 요건 없음 (본교 시험에 영어 필기)' },
    '薬学部': { accept: [], note: '영어 외부시험 요건 없음 (본교 시험에 영어 필기)' } } },
  /* yamaguchi */
// 야마구치대학 (yamaguchi) — TOEIC 또는 TOEFL iBT 제출 필수
  'yamaguchi-2027/keizai_ko_joho': { all: { accept: ['ibt', 'toeic'], min: { ibt: 40, toeic: 400 }, note: '출원 요건: TOEIC 400 이상 또는 TOEFL iBT 40 이상(2024-09-02 이후 응시). 공학부·정보학부가 TOEIC을 쓰면 일본·한국 공개 테스트만 유효. IELTS 불가. 2026-01-21 이후 TOEFL 밴드 기준은 요강에 없음' } },
  'yamaguchi-2027/jinbun_hoka': { all: { accept: ['ibt', 'toeic'], note: 'TOEIC 또는 TOEFL iBT 점수 제출 필수(2025-02-04 이후 응시), 기준점 없음. 의학과·농학부·공동수의학부가 TOEIC을 쓰면 일본·한국 공개 테스트만 유효. TOEFL은 DI 코드 G412로 점수 송부. IELTS 불가' } },
  /* tufs */
// 동경외국어대학 (tufs) — 영어 4기능 스코어 제출 필수(기준점 없음). TOEIC은 L&R+S&W 두 점수 제출이라 제외
  'tufs-2027/intl_japan': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 — 영어 4기능 스코어 1종 제출 필수(케임브리지·영검·GTEC·IELTS·TEAP·TOEFL iBT·TOEIC L&R+S&W 중). TOEIC은 L&R+S&W 두 점수가 필요해 제외. 면접에서는 영어를 묻지 않음' } },
  'tufs-2027/shihi': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 — 영어 4기능 스코어 1종 제출 필수(케임브리지·영검·GTEC·IELTS·TEAP·TOEFL iBT·TOEIC L&R+S&W 중). TOEIC은 L&R+S&W 두 점수가 필요해 제외' } },
  /* okayama */
// 오카야마대학 (okayama) — 경제·공학부·농학부만 영어 4기능 성적 제출(기준점 없음, CEFR 대조표로 점수화). TOEIC은 L&R+S&W 합산이라 제외
  'okayama-2027/shihi': { by_fac: {
    '文学部': { accept: [], note: '영어 외부시험 요건 없음' },
    '法学部': { accept: [], note: '영어 외부시험 요건 없음' },
    '経済学部': { accept: ['ibt', 'ielts'], note: '기준점 없음 — 영어 4기능 성적증명서 제출 필수(2025-04 이후 응시, CEFR 대조표로 점수화해 면접·서류 평가). TOEFL iBT Home Edition·MyBest·IELTS General 불가. TOEIC은 L&R+S&W 합산 필요라 제외' },
    '理学部': { accept: [], note: '영어 외부시험 요건 없음 (본학 영어 필기시험 실시)' },
    '医学部': { accept: [], note: '영어 외부시험 요건 없음 (본학 영어 필기시험 실시)' },
    '歯学部': { accept: [], note: '영어 외부시험 요건 없음 (본학 영어 필기시험 실시)' },
    '薬学部': { accept: [], note: '영어 외부시험 요건 없음 (본학 영어 필기시험 실시)' },
    '工学部': { accept: ['ibt', 'ielts'], note: '기준점 없음 — 영어 4기능 성적증명서 제출 필수(2025-04 이후 응시, CEFR 대조표로 점수화해 면접 평가). TOEFL iBT Home Edition·MyBest·IELTS General 불가. TOEIC은 L&R+S&W 합산 필요라 제외' } } },
  'okayama-2027/nogaku_global': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 — 영어 4기능 성적증명서 제출 필수(2025-04 이후 응시, CEFR 대조표로 점수화). TOEFL iBT Home Edition·MyBest·IELTS General 불가. TOEIC은 L&R+S&W 합산 필요라 제외' } },
  /* shimane */
// 시마네대학 (shimane)
  'shimane-2027/shihi': { by_fac: {
    '法文学部': { accept: [], note: '영어 요건 없음' },
    '人間科学部': { accept: [], note: '영어 요건 없음' },
    '総合理工学部': { accept: ['ibt'], min: { ibt: 42, band: 3.0 }, note: 'TOEFL 필수. 2026-01-20 이전 iBT 42 / 2026-01-21 이후 밴드 3 이상. 2024-09 이후 응시분' },
    '材料エネルギー学部': { accept: ['ibt'], note: 'TOEFL 응시·점수 제출 필수이나 기준점 명시 없음(요강 (5)는 종합이공학부 한정)' },
    '生物資源科学部': { accept: [], note: '영어 요건 없음' } } },
  /* tmu */
// 동경도립대학 (tmu)
  'tmu-2027/tokubetsu_a': { by_fac: {
    '人文社会学部': { accept: ['ibt'], note: 'TOEFL iBT 필수. 기준점 없음(점수 환산 반영). 1차 선고에도 TOEFL 사용' },
    '法学部': { accept: ['ibt'], note: 'TOEFL iBT 필수. 기준점 없음' },
    '理学部': { accept: ['ibt', 'ielts'], note: 'TOEFL iBT 또는 IELTS. 기준점 없음' },
    '都市環境学部': { accept: ['ibt', 'ielts'], note: 'TOEFL iBT 또는 IELTS(도시기반환경학과는 TOEFL iBT만). 기준점 없음' },
    'システムデザイン学部': { accept: ['ibt', 'ielts'], note: 'TOEIC L&R+S&W·TOEFL iBT·IELTS 중 택1 (TOEIC은 L&R·S&W 합산 요구라 판정 제외). 기준점 없음' } } },
  'tmu-2027/tokubetsu_keizai': { all: { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3.0, ielts: 4.0 }, note: 'TOEFL iBT 42(2026-01-20 이전) / 밴드 3.0(2026-01-21 이후) 또는 IELTS 아카데믹 4.0 이상 중 1종' } },
  /* kanazawa */
// 카나자와대학 (kanazawa)
  'kanazawa-2027/shihi_yugo_ningen_riko': { by_fac: {
    '融合学域': { accept: ['ibt', 'ielts'], note: '케임브리지·IELTS·TOEFL iBT 중 택1, 기준점 없음(배점 반영). 케임브리지는 판정 제외' },
    '人間社会学域': { accept: ['ibt'], note: '법·경제·학교교육·지역창조학류는 TOEFL iBT 필수(법·경제는 득점률 60% 초과가 출원 조건, 만점 기준 요강에 없음), 인문·국제학류는 케임브리지·IELTS·TOEFL 중 택1(기준점 없음)' },
    '理工学域': { accept: ['ibt', 'ielts'], note: 'IELTS 또는 TOEFL iBT. 기계공학류 IELTS 5.5 이상/iBT 득점률 50% 초과, 프런티어공학류 IELTS 5.0 이상/iBT 50% 이상, 전자정보통신학류 IELTS 4.5 초과/iBT 50% 초과가 출원 조건, 나머지 학류는 기준점 없음' } } },
  'kanazawa-2027/shihi_iyaku': { all: { accept: ['ibt'], note: 'TOEFL iBT 필수(Home Edition 가능). 의료검사기술학전공은 득점률 60% 초과가 출원 조건(만점 기준 요강에 없음), 그 외는 점수 제출만' } },
  /* takasakikeizai */
// 타카사키경제대학 (takasakikeizai)
  'takasakikeizai-2027/keizai': { all: { accept: [], note: '영어 시험 요건 없음(TOEFL·TOEIC·IELTS 사본은 임의 제출)' } },
  'takasakikeizai-2027/chiiki': { all: { accept: [], note: '영어 시험 요건 없음' } },
  /* asia */
// 아시아대학 (asia) — A·B방식은 외부 영어 성적 불필요(본교 영어 시험). C방식만 TOEFL iBT 또는 IELTS 제출(기준점 명시 없음)
  'asia-2027/c': { all: { accept: ['ibt', 'ielts'], note: '기준점 명시 없음 · 점수 제출만 필수 · TOEFL iBT 또는 IELTS 중 택1(2024-04 이후 시험) · 일본 국외 거주자 전용' } },
  /* joshibi — 규칙 없음 */
  /* aichi */
// 아이치대학 (aichi) — 영어 외부시험 제출 요건은 없고, 국제커뮤니케이션학부(영어학과·국제교양학과)만 「입학 시 취득 見込み」 조건
  'aichi-2027/suisen': { all: { accept: [], note: '영어 외부시험 요건 없음 (현대중국학부만 모집)' } },
  'aichi-2027/ippan': { all: { accept: [], note: '영어 외부시험 요건 없음' }, by_fac: { '国際コミュニケーション学部': { accept: ['ibt', 'toeic'], min: { ibt: 48, toeic: 500 }, note: '영어학과만. 출원 서류에는 영어 성적 없음 — 입학 시 TOEFL iBT 48 / TOEIC L&R 500 / DET 85(판정 제외) 중 하나 취득 見込み. 2026-01-21 이후 iBT는 성적표 병기 구 점수(0~120)로 확인(밴드 기준 없음)' } } },
  'aichi-2027/dojon': { all: { accept: [], note: '영어 외부시험 요건 없음' }, by_fac: { '国際コミュニケーション学部': { accept: ['ibt', 'toeic'], min: { ibt: 48, toeic: 500 }, note: '국제교양학과. 출원 서류에는 영어 성적 없음 — 입학 시 TOEFL iBT 48 / TOEIC L&R 500 / DET 85(판정 제외) 중 하나 취득 見込み. 2026-01-21 이후 iBT는 성적표 병기 구 점수(0~120)로 확인(밴드 기준 없음)' } } },
  /* rissho */
'rissho-2027/nov': { all: { accept: [], note: '영어 외부시험 요건 없음 (문학부 영어영미문학전공 코스만 대학 시행 영어 필기·구두시문)' } },
  'rissho-2027/feb': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* tokyonogyo */
'tokyonogyo-2027/gaikokujin': { all: { accept: [], note: '영어 점수 요건 없음 (서류+면접, 일본어 EJU 독해+청해 합계 200점 이상이 출원자격)' } },
  /* kobegeiko */
'kobegeiko-2027/ryu1': { all: { accept: [], note: '영어 점수 요건 없음 (작품 지참형, 일본어는 JLPT N2 또는 EJU 일본어 220점)' } },
  'kobegeiko-2027/ryu2': { all: { accept: [], note: '영어 점수 요건 없음 (작품 지참형, 일본어는 JLPT N2 또는 EJU 일본어 220점)' } },
  'kobegeiko-2027/ryu3': { all: { accept: [], note: '영어 점수 요건 없음 (과목 선택형, 일본어는 JLPT N2 또는 EJU 일본어 220점)' } },
  'kobegeiko-2027/ryu4': { all: { accept: [], note: '영어 점수 요건 없음 (작품 지참형, 국내 거주자 한정)' } },
  /* apu */
// APU 2027: 일본어 기준(JLPT·EJU)과 영어 기준 중 택1. TOEIC은 L&R+S&W×2.5 합산 요구라 accept 제외. 영어 쪽을 택할 때의 기준.
  'apu-2027/kor_apr': { all: { accept: ['ibt', 'ielts'], min: { ibt: 75, band: 4.0, ielts: 6.0 }, note: '일본어 기준(JLPT·EJU)으로 대신 충족 가능. IELTS는 각 영역 5.5 이상도 필요' } },
  'apu-2027/kor_sep': { all: { accept: ['ibt', 'ielts'], min: { ibt: 75, band: 4.0, ielts: 6.0 }, note: '일본어 기준(JLPT·EJU)으로 대신 충족 가능. IELTS는 각 영역 5.5 이상도 필요' } },
  'apu-2027/jpn_apr': { all: { accept: ['ibt', 'ielts'], min: { ibt: 75, band: 4.0, ielts: 6.0 }, note: '일본어 기준(JLPT·EJU)으로 대신 충족 가능. IELTS는 각 영역 5.5 이상도 필요' } },
  'apu-2027/jpn_sep': { all: { accept: ['ibt', 'ielts'], min: { ibt: 75, band: 4.0, ielts: 6.0 }, note: '일본어 기준(JLPT·EJU)으로 대신 충족 가능. IELTS는 각 영역 5.5 이상도 필요' } },
  'apu-2027/other_apr': { all: { accept: ['ibt', 'ielts'], min: { ibt: 75, band: 4.0, ielts: 6.0 }, note: '일본어 기준(JLPT·EJU)으로 대신 충족 가능. IELTS는 각 영역 5.5 이상도 필요' } },
  'apu-2027/other_sep': { all: { accept: ['ibt', 'ielts'], min: { ibt: 75, band: 4.0, ielts: 6.0 }, note: '일본어 기준(JLPT·EJU)으로 대신 충족 가능. IELTS는 각 영역 5.5 이상도 필요' } }
  /* nishogakusha — 규칙 없음 */
  /* zokei — 규칙 없음 */
};
