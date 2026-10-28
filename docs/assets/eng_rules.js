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
  'apu-2027/other_sep': { all: { accept: ['ibt', 'ielts'], min: { ibt: 75, band: 4.0, ielts: 6.0 }, note: '일본어 기준(JLPT·EJU)으로 대신 충족 가능. IELTS는 각 영역 5.5 이상도 필요' } },
  /* nishogakusha — 규칙 없음 */
  /* zokei — 규칙 없음 */
  /* aichiken */
// 아이치현립대학 (aichiken) — 정보과학부 전형은 영어 스코어(TOEIC L&R 공개테스트·TOEFL iBT·IELTS 중 하나)를 점수화, 기준점 없음. 정보 외 학부는 영어 외부시험 불필요
  'aichiken-2027/joho': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 점수 제출만 필수(영어 100점 배점). 출원 마감일 기준 2년 이내 응시분, TOEIC은 공개테스트(L&R)' } },
  'aichiken-2027/other': { all: { accept: [], note: '영어 외부시험 불필요(본학 영어 필기 시험이 있음, 역사문화학과는 영어 없음)' } },
  /* aichikyoiku */
'aichikyoiku-2027/sogo': { all: { accept: [], note: '외부 영어시험 점수 요건 없음 (영어전수는 학력검사·영어 면접, 일본어지원·영어전수는 영어 소논문 가능)' } },
  /* azabu */
'azabu-2027/gaikokujin': { all: { accept: [], note: '외부 영어시험 점수 요건 없음 (수의학과는 본학 필기시험에 영어 포함)' } },
  /* chibakogyo */
// 치바공업대학 (chibakogyo)
  'chibakogyo-2027/ryugakusei': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* ehime */
// 愛媛大学 (ehime) — 의학부 간호학과만 TOEFL iBT 제출(기준점 없음). 그 외 영어 요건 없음(요강에 언급 없음)
  'ehime-2027/dojon': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 언급 없음)' } },
  'ehime-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 언급 없음). 단 의학부 간호학과는 TOEFL iBT 응시·제출 필수' }, by_fac: { '医学部': { accept: ['ibt'], note: '간호학과만 TOEFL iBT Test Taker Score Report 제출 필수(기준점 명시 없음, 100점 배점). 의학과는 영어 요건 없음' } } },
  /* fukui */
// 福井大学 (fukui) — 국제지역학부: TOEFL iBT·IELTS·DET 중 하나 제출(기준점 없음). 공학부: TOEFL 제출 필수(기준점 없음)
  'fukui-2027/kokusai': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 — TOEFL iBT(Home Edition 포함)·IELTS 아카데믹·DET 중 하나 제출 필수(2025-01 이후 응시). DET는 판정 대상 외, TOEIC 불가. 점수표 인쇄본 + 대학 직송(TOEFL DI 코드 0184)' } },
  'fukui-2027/kogaku': { all: { accept: ['ibt'], note: '기준점 없음 — TOEFL 제출 필수(Home Edition 인정). Test Taker Score Report 인쇄본 + Official Score Report 직송(DI 코드 0184), 2024-10 이후 실시분만. IELTS·TOEIC 불가(요강에 규정 없음)' } },
  /* fukuiken */
// 후쿠이현립대학 (fukuiken) — 영어 외부시험(TOEFL·TOEIC L&R·IELTS Academic·영검) 공식 성적 제출이 출원 자격, 기준점 없음
  'fukuiken-2027/shihi': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 2024-12 이후 응시한 공식 성적 제출이 출원 자격(영검도 인정). TOEFL ITP·TOEIC IP·IELTS General 등은 불가' } },
  /* fukuokajoshi */
// 福岡女子大学 (fukuokajoshi) — 기준점 없음, 영어 자격·검정 8종 중 하나 제출(환산 100점 배점). TOEIC은 L&R+S&W 합계 요구라 판정 제외
  'fukuokajoshi-2027/ippan': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 — 점수 제출 필수(100점 배점으로 환산). TOEFL iBT·IELTS·GTEC(4기능)·TEAP·TEAP CBT·케임브리지 영검·실용영어기능검정·TOEIC L&R+S&W 중 하나(출원 접수 개시일 2년 이내). TOEIC L&R 단독 불가. 2026-01-21 이후 TOEFL은 ETS 직송(DI 코드 7208) + Score Report 인쇄본. 학비 감면 기준: 전액 iBT 72·IELTS 5.5, 반액 iBT 57·IELTS 4.5' } },
  /* fukuokaken */
// 후쿠오카현립대학 (fukuokaken)
  'fukuokaken-2027/ryugakusei': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 영어 점수 제출 항목 없음)' } },
  /* fukuyama */
// 福山市立大学 (fukuyama) — TOEFL iBT 또는 TOEIC 공개테스트 점수 제출 필수(2025-02-01 이후), 기준점 없음. 영어 모어 화자는 제출 불요
  'fukuyama-2027/shihi': { all: { accept: ['ibt', 'toeic'], note: '기준점 없음 — TOEFL iBT 또는 TOEIC(공개테스트) 점수 제출 필수(2025-02-01 이후 응시). 영어를 모어로 하지 않는 사람만. TOEIC은 공개테스트(L&R) 공식인정증' } },
  /* gunma */
// 군마대학 (gunma) — 이공학부만 TOEFL·TOEIC·IELTS 중 하나 제출 필수(기준점 없음), 나머지 학부는 영어 외부시험 없음(정보·의학부는 본학 영어 필기)
  'gunma-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음 (정보학부·보건학과는 본학 영어 필기시험이 있음)' }, by_fac: { '理工学部': { accept: ['ibt', 'ielts', 'toeic'], note: 'TOEFL iBT·TOEFL ITP(본학 실시분)·TOEIC L&R·TOEIC IP(본학 실시분)·IELTS 중 하나 제출 필수 · 기준점 없음 · 2025-01 이후 응시분' } } },
  /* gunmajoshi */
// 群馬県立女子大学 (gunmajoshi) — 외부 영어시험 요건 없음
  'gunmajoshi-2027/bun': { all: { accept: [], note: '영어 외부시험 요건 없음 (영미문화학과는 자체 전문과목 시험에서 영어)' } },
  'gunmajoshi-2027/kokusai': { all: { accept: [], note: '영어 외부시험 요건 없음 (면접을 일본어·영어로 실시)' } },
  /* hannan */
// 한난대학 (hannan)
  'hannan-2027/zenki': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'hannan-2027/koki': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* hirokei */
// 히로시마경제대학 (hirokei) — 영어 외부시험 요건 없음
  'hirokei-2027/dojon': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* hirosaki — 규칙 없음 */
  /* hiroshima */
'hiroshima-2027/feb': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 — 영어 민간시험 성적증명서 제출은 필수. TOEFL은 Test Date 점수만(Home Edition·MyBest 불가), IELTS One Skill Retake 불가, 2025-04 이후 시행분. TOEIC은 L&R+S&W 합산이라 제외' }, by_fac: { '文学部': { accept: ['ibt', 'ielts'], min: { ibt: 44, band: 3.0, ielts: 4.0 }, note: 'CEFR B1 이상 필수. TOEIC은 L&R+S&W 합산 1150 이상(판정 제외)' }, '医学部': { accept: ['ibt', 'ielts'], min: { ibt: 44, band: 3.0, ielts: 4.0 }, note: 'CEFR B1 이상 필수(의학과·보건학과)' }, '歯学部': { accept: ['ibt', 'ielts'], min: { ibt: 44, band: 3.0, ielts: 4.0 }, note: 'CEFR B1 이상 필수' } } },
  'hiroshima-2027/mar': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 — 영어 민간시험 성적증명서 제출은 필수. TOEFL은 Test Date 점수만(Home Edition·MyBest 불가), 2025-04 이후 시행분' }, by_fac: { '文学部': { accept: ['ibt', 'ielts'], min: { ibt: 44, band: 3.0, ielts: 4.0 }, note: 'CEFR B1 이상 필수' } } },
  /* hyogo — 규칙 없음 */
  /* icu */
'icu-2027/eju': { all: { accept: ['ibt', 'ielts'], note: '합격 최저점 없음 — 점수 제출은 필수 (TOEFL iBT 또는 IELTS Academic, 2025-01-01 이후 응시, 기관 직송). IELTS 6.5 / TOEFL iBT 79(2026-01-20 이전)·4.5(2026-01-21 이후) 이상이면 필수 어학과목으로 JLP 선택 가능' } },
  /* isct */
// 東京科学大学 (isct) 2027 — 외부 영어시험은 제출 임의(면접 참고). 기준점 없음. 의치계열(ika)은 대학 학력검사 영어만, 점수 요건 없음 — 규칙 없음
  'isct-2027/riko': { all: { accept: ['ibt', 'ielts'], note: 'TOEFL iBT·IELTS Academic 제출은 임의(면접 참고, 제출 권장). 2025-04-01 이후 응시분, 기준점 없음. 학력검사에 영어 시험 있음' } },
  'isct-2027/riko_pre': { all: { accept: ['ibt', 'ielts'], note: 'TOEFL iBT·IELTS Academic 제출은 임의(면접 참고, 제출 권장). 2025-04-01 이후 응시분, 기준점 없음' } },
  /* ishikawa */
'ishikawa-2027/tokubetsu': { all: { accept: ['toeic'], note: 'TOEIC L&R 공개 테스트 필수(2025-04-01 이후 응시), 기준점 없음 — 점수 제출만 필수. IP·S&W·Bridge 불가. iBT·IELTS 불가' } },
  /* iuhw */
'iuhw-2027/ryugakusei': { all: { accept: [], note: '영어 외부시험 요건 없음(요강에 영어 시험 언급 없음)' } },
  /* iwateken */
// 이와테현립대학 (iwateken) — 종합정책학부의 영어 비모어자만 TOEFL(iBT·ITP) 또는 TOEIC(Bridge 제외) 제출 필수(기준점 없음, 2024-11-02 이후 응시분)
  'iwateken-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음' }, by_fac: { '総合政策学部': { accept: ['ibt', 'toeic'], note: '영어를 모어로 하지 않는 사람만 TOEFL(iBT·ITP) 또는 TOEIC(Bridge 제외) 별도 수험·제출 필수(2024-11-02 이후 응시분). 기준점 없음. IELTS 불가. ITP는 판정 불가' } } },
  /* juntendo */
// 준텐도대학 (juntendo) — 의학부 외국인 선발·IB 선발 모두 출원 자격에 영어 외부시험 필수(TOEFL iBT 새 4.0=band / 구 72, IELTS 5.5). TOEIC 불가
  'juntendo-2027/gaikokujin': { all: { accept: ['ibt', 'ielts'], min: { ibt: 72, band: 4.0, ielts: 5.5 }, note: '영검 CSE 2304·TEAP 309·GTEC CBT 1180·케임브리지 160도 가능(판정 제외). TOEIC 불가. 출원 접수 개시일에서 2년 이내 응시분, MyBest·Home Edition 불가' } },
  'juntendo-2027/ib': { all: { accept: ['ibt', 'ielts'], min: { ibt: 72, band: 4.0, ielts: 5.5 }, note: '영검 CSE 2304·TEAP 309·GTEC CBT 1180·케임브리지 160도 가능(판정 제외). TOEIC 불가. 출원 접수 개시일에서 2년 이내 응시분, MyBest·Home Edition 불가' } },
  /* kagawa */
// 카가와대학 (kagawa) — 법·경제 영어 없음 / 의학과 TOEFL 제출 필수(기준점 없음) / 창조공 TOEFL·TOEIC 제출 필수(기준점 없음) / 농학부 iBT 32·TOEIC L&R 300·IELTS 3.5
  'kagawa-2027/hokei': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'kagawa-2027/igaku': { all: { accept: ['ibt'], note: 'TOEFL 성적 제출 필수 · 기준점 명시 없음 · 2025-01-31 이후 응시분. 별도로 본학 영어 필기시험(외국어)도 있음' } },
  'kagawa-2027/kogyo_nogaku': { all: { accept: ['ibt', 'toeic'], note: '창조공학부: TOEFL·TOEIC 중 하나 제출 필수(기준점 없음)' }, by_fac: { '農学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 32, toeic: 300, ielts: 3.5 }, note: 'TOEFL iBT 32 / TOEIC L&R 300 / IELTS Academic 3.5 이상 중 하나. 12점 만점으로 환산해 배점에 포함. 2026-01-21 이후 iBT는 밴드 기준이 없어 구 점수(0~120)로만 확인' } } },
  /* kanagawashika — 규칙 없음 */
  /* kanoya */
// 鹿屋体育大学 (kanoya) — 영어 점수 요건 없음
  'kanoya-2027/shihi': { all: { accept: [], note: '영어 점수 요건 없음' } },
  /* kit */
// 쿄토공예섬유대학 (kit) — TOEFL iBT 응시 필수(기준점 없음), iBT만 인정
  'kit-2027/shihi': { all: { accept: ['ibt'], note: 'TOEFL iBT만(Home Edition 포함, ITP·My Best 불가) · 2024-08~2026-06 응시분 · 기준점 명시 없음(응시 필수)' } },
  /* kitami */
// 北見工業大学 (kitami) — 영어 외부시험 요건 없음(요강에 언급 없음)
  'kitami-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 언급 없음)' } },
  /* kobe */
// 코베대학 (kobe) — 경제학부·법학부 모두 TOEFL iBT 제출 필수, 기준점 없음
  'kobe-2027/econ': { all: { accept: ['ibt'], note: 'TOEFL iBT 필수(Home Edition 포함, 입학시험 실시일로부터 2년 이내 응시분) · 기준점 없음. IELTS·TOEIC 불가' } },
  'kobe-2027/law': { all: { accept: ['ibt'], note: 'TOEFL iBT 필수(Home Edition 가능, 응시일로부터 2년 이내, Test Date 스코어만 채택) · 기준점 없음. IELTS·TOEIC 불가' } },
  /* kobegakuin */
// 코베학원대학 (kobegakuin) — 외부 영어시험 요건 없음 (인문·GC·약학부는 본교 영어 필기시험)
  'kobegakuin-2027/ippan': { all: { accept: [], note: '외부 영어시험 요건 없음 (인문·GC·약학부는 본교 영어 필기시험)' } },
  /* kochi */
// 코치대학 (kochi) — A선발 인문사회과학부 인문과학·국제사회 코스만 TOEFL 또는 IELTS(Academic) 필수, 기준점 없음. B선발·그 밖의 단위는 영어 외부시험 불요
  'kochi-2027/a': { all: { accept: ['ibt', 'ielts'], note: '인문사회과학부 인문과학·국제사회 코스만 TOEFL 또는 IELTS(Academic, 2025-04-01 이후 응시) 제출 필수 · 기준점 없음. 사회과학 코스와 이공·의·농림해양은 불요. TOEFL 종류(iBT 외)는 요강에 명시 없음' } },
  /* kochiken */
// 코치현립대학 (kochiken)
  'kochiken-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 영어 점수 제출 항목 없음)' } },
  /* kokugakuin */
'kokugakuin-2027/ippan_keizai': { all: { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3, ielts: 4.0 }, note: '경제학부 출원 요건: 외부 영어시험 CEFR A2 이상(4기능 종합 CEFR 판정이 있는 것). TOEFL iBT·IELTS는 B1 이상만 인정(iBT 42 / 밴드 3, IELTS 4.0, 자택 수험형 불가). TOEIC은 L&R+S&W 합계 385 이상이라 판정 제외, 영검·GTEC·TEAP·케임브리지는 점수 판정 불가. 2024-04-01 이후 취득분' } },
  'kokugakuin-2027/ippan': { all: { accept: [], note: '관광마을만들기학부 외에는 영어 요건 없음' }, by_fac: { '観光まちづくり学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 3, ielts: 4.0 }, note: 'CEFR A2 이상 영어시험 또는 EJU 수학(코스1·2) 응시 중 택일(영어는 필수가 아님). TOEFL iBT·IELTS는 B1 이상만 인정(자택 수험형 불가). TOEIC은 L&R+S&W 합계 385 이상이라 판정 제외. 2024-04-01 이후 취득분' } } },
  /* konan */
// 코난대학 (konan) — 영어 외부시험 점수 또는 고교 영어 교육 성적증명서 제출(기준점 없음)
  'konan-2027/ryugaku': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 — 영어 외부시험(케임브리지·TOEFL iBT·IELTS·TOEIC L&R·GTEC·TEAP·에이켄) 점수·합격증명서 또는 고교 영어 교육 성적증명서 중 하나 제출. 영어 모어 화자·영어 공용어 국가 거주자는 고교 영어 수료 증명서로 면제' } },
  /* kuas — 규칙 없음 */
  /* kumamotoken */
// 熊本県立大学 (kumamotoken) — 외부 영어시험 요건 없음. 영어는 대학 자체 필기시험
  'kumamotoken-2027/shihi': { all: { accept: [], note: '외부 영어시험 요건 없음 (대학 자체 영어 필기시험)' } },
  /* kyotogaigo */
// 쿄토외국어대학 (kyotogaigo) — 국제공헌학부 글로벌스터디즈학과만 영어 자격(또는 영어 교수 언어 3년 과정). 일본어학과·글로벌관광학과는 영어 요건 없음
  // 기준: iBT 구 62 / 신 4.0(band) / IELTS 5.0 / TOEIC L&R 710 (영검 CSE 2150·GTEC 1099·TEAP 282 등은 판정 제외). by_fac 는 학부 단위라 글로벌관광학과도 같은 기준이 표시됨(실제 요건 없음)
  'kyotogaigo-2027/kokunai': { all: { accept: [], note: '영어 요건 없음 (일본어학과)' }, by_fac: { '国際貢献学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 62, band: 4.0, ielts: 5.0, toeic: 710 }, note: '글로벌스터디즈학과만 해당 — 영어 검정 기준 또는 영어 교수 언어 3년 과정(Certificate of English as Medium of Instruction)으로도 가능. 글로벌관광학과는 영어 요건 없음. TOEIC L&R 710 (L&R+S&W는 1430)' } } },
  'kyotogaigo-2027/kokugai': { all: { accept: [], note: '영어 요건 없음 (일본어학과)' }, by_fac: { '国際貢献学部': { accept: ['ibt', 'ielts', 'toeic'], min: { ibt: 62, band: 4.0, ielts: 5.0, toeic: 710 }, note: '글로벌스터디즈학과만 해당 — 영어 검정 기준 또는 영어 교수 언어 3년 과정(Certificate of English as Medium of Instruction)으로도 가능. 글로벌관광학과는 영어 요건 없음. TOEIC L&R 710 (L&R+S&W는 1430)' } } },
  /* kyushushika */
'kyushushika-2027/shihi': { all: { accept: [], note: '외부 영어시험 점수 요건 없음 (본학 개별 시험의 외국어(영어)를 치름)' } },
  /* maebashi */
// 前橋工科大学 (maebashi) — TOEFL iBT 또는 TOEIC L&R 공개테스트 필수(2025-04-01 이후), 기준점 없음 — 점수 제출만. IELTS 불가
  'maebashi-2027/shihi': { all: { accept: ['ibt', 'toeic'], note: '기준점 없음 — TOEFL iBT 또는 TOEIC L&R 공개테스트(2025-04-01 이후 응시) 점수 제출 필수. IELTS 불가' } },
  /* matsumoto */
// 마츠모토치과대학 (matsumoto)
  'matsumoto-2027/ryugakuE': { all: { accept: [], note: '영어 점수 제출은 필수 아님 — TOEFL·TOEIC·IELTS 등 검정 합격자는 평가에 포함될 수 있음(기준점·배점 요강에 없음)' } },
  'matsumoto-2027/ryugakuF': { all: { accept: [], note: '영어 점수 제출은 필수 아님 — TOEFL·TOEIC·IELTS 등 검정 합격자는 평가에 포함될 수 있음(기준점·배점 요강에 없음)' } },
  /* mie */
// 미에대학 (mie)
  'mie-2027/jinbun': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'mie-2027/seibutsu': { all: { accept: ['ibt'], min: { ibt: 39 }, note: 'TOEFL iBT만. 39점 이상(과거 2년 이내 응시분, 구 0~120 점수 기준 — 2026-01-21 이후 밴드 기준은 요강에 없음). ETS에서 대학 코드 7926으로 공식 스코어 직송 필수' } },
  /* miyazaki */
/* miyazaki — 공학부·지역자원창성학부: 영어 성적 요건 없음(키 생략) */
  'miyazaki-2027/nogaku': { all: { accept: ['ibt'], note: 'TOEFL 성적증명서 제출이 출원 조건(농학과 응용생명화학코스만 불필요) · 기준점 명시 없음 · 출원 이전 2년 이내 응시분 · iBT Home Edition 포함' } },
  /* miyazakikoritsu */
// 宮崎公立大学 (miyazakikoritsu) — 사비 외국인유학생 선발은 영어 점수 요건 없음(영어 조건은 귀국생·사회인 선발만)
  'miyazakikoritsu-2027/shihi': { all: { accept: [], note: '영어 점수 요건 없음 (영어 조건은 귀국생·사회인 선발에만 있음)' } },
  /* muroran */
// 무로란공업대학 (muroran) — TOEFL iBT 32점(구 점수 환산) 이상 필수, iBT만 인정
  'muroran-2027/sogo': { all: { accept: ['ibt'], min: { ibt: 32, band: 2.5 }, note: 'TOEFL iBT만(Home Edition 가능, My Best Scores 불가) · 2024-12~2026-12 응시분 · 32점(구 점수 환산) 이상 — 100점으로 환산해 합계 1000점에 가산' } },
  /* musashi — 규칙 없음 */
  /* nagaoka */
// 나가오카기술과학대학 (nagaoka) — TOEIC L&R(SP 공개 테스트) 또는 TOEFL iBT(Home Edition 포함) 점수 제출, 기준점 명시 없음
  'nagaoka-2027/shihi': { all: { accept: ['ibt', 'toeic'], note: '기준점 없음 — 2025-01 이후 응시한 TOEIC L&R(SP 공개 테스트) 또는 TOEFL iBT(Home Edition 포함, MyBest 불가) 점수 제출 필수. IELTS 불가' } },
  /* nagasakiken — 규칙 없음 */
  /* nagoyageijutsu */
// 나고야예술대학 (nagoyageijutsu) — 외국인유학생 입시는 영어 외부시험 요건 없음
  'nagoyageijutsu-2027/ki1': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'nagoyageijutsu-2027/ki2': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* nagoyashi */
// 나고야시립대학 (nagoyashi) — TOEIC 공개테스트(L&R) 공식 스코어 필수, 기준점 요강에 없음
  'nagoyashi-2027/shihi': { all: { accept: ['toeic'], note: 'TOEIC 공개테스트(L&R)만 인정(IP·인쇄 성적표 불가). 점수 제출 필수이나 기준점은 요강에 없음' } },
  /* nanzan */
// 난잔대학 (nanzan) — EJU 이용형은 TOEFL iBT 또는 IELTS Academic 필수(TOEIC 불가). 영미학과만 기준이 높고(iBT 72/밴드 4/IELTS 5.5), 그 외 학과는 iBT 61/밴드 3.5/IELTS 5.0. iBT는 각 기능 기준(12·15 / 3.5)도 요구
  'nanzan-2027/eju': { all: { accept: ['ibt', 'ielts'], min: { ibt: 61, band: 3.5, ielts: 5.0 }, note: 'TOEFL iBT는 각 기능 기준(2026-01-20 이전 12 이상, 2026-01-21 이후 3.5 이상)도 1회 응시로 충족 필요. Home Edition·IELTS Online 불가. 외국어학부 영미학과만 iBT 72(밴드 4)·IELTS 5.5(각 기능 15 / 3.5 이상)' }, by_fac: { '外国語学部': { accept: ['ibt', 'ielts'], min: { ibt: 61, band: 3.5, ielts: 5.0 }, note: '영미학과만 iBT 72 / 밴드 4 / IELTS 5.5 로 더 높음(스페인·프랑스·독일·아시아학과는 iBT 61 / 3.5 / 5.0). 각 기능 기준 별도' } } },
  /* narajoshi */
// 나라여자대학 (narajoshi) — 문·이·공학부는 TOEIC 또는 TOEFL, 생활환경학부는 TOEFL만. 기준점 명시 없음(총점 환산 반영)
  'narajoshi-2027/shihi': { all: { accept: ['ibt', 'toeic'], note: '기준점 명시 없음 — 점수 제출 필수(총점에 환산 반영). TOEIC-IP·TOEFL-ITP 불가' }, by_fac: { '生活環境学部': { accept: ['ibt'], note: 'TOEFL만 인정(TOEIC 불가) · 기준점 명시 없음 · ITP 불가' } } },
  /* nihon */
'nihon-2027/shogaku': { all: { accept: ['ibt', 'toeic'], note: '상학부만 외부 영어시험 필수(TOEIC L&R·TOEFL iBT 공식 스코어, IELTS 불가). 기준점 비공개(학부 환산표로 EJU와 합산, 합격 최저 기준 있음). 출원 마감일 2년 이내 응시분. 그 외 학부는 외부 영어시험 불필요(치·생물자원은 본교 시험에서 영어 출제)' } },
  /* nihonjoshi */
// 일본여자대학 (nihonjoshi) — 영문학과만 기준점(IELTS 5.0 / iBT 60(~2026-01-20)·밴드 3.5(2026-01-21~) / TOEIC L&R 600). 학부 단위 구분 불가라 note 로 안내
  'nihonjoshi-2027/gaikokujin': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '영문학과만 기준점 있음: IELTS 5.0 · TOEFL iBT 60(2026-01-20 이전)/밴드 3.5(2026-01-21 이후) · TOEIC L&R 600. 그 외 학과는 TOEFL 또는 TOEIC 점수 보유만 필수(IELTS는 영문학과만 인정)' }, by_fac: { '文学部': { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 600, ibt: 60, band: 3.5, ielts: 5.0 }, note: '영문학과 기준(일본어일본문·역사문화학과는 기준점 없음, 점수 보유만 필수)' } } },
  /* niigataken */
// 니이가타현립대학 (niigataken) — 국제경제학부만 TOEFL iBT 또는 TOEIC L&R 성적 제출 필수(기준점 없음)
  'niigataken-2027/ryugakusei': { all: { accept: [], note: '영어 외부시험 요건 없음' }, by_fac: { '国際経済学部': { accept: ['ibt', 'toeic'], note: 'TOEFL iBT 또는 TOEIC L&R 성적 제출 필수(출원 개시일 전 2년 이내 응시). 기준점 없음 — 제출만 필수. IELTS 불가' } } },
  /* nucba */
// 나고야상과대학 (nucba) — 영어 외부시험 요건 없음(서류 + 에세이 + 면접). 일본어 능력만 증명
  'nucba-2027/apr': { all: { accept: [], note: '영어 시험 요건 없음 — 일본어 능력 증명(EJU 200 / JLPT N2 등)만 요구' } },
  'nucba-2027/sep': { all: { accept: [], note: '영어 시험 요건 없음 — 일본어 능력 증명(EJU 200 / JLPT N2 등)만 요구' } },
  /* obihiro */
'obihiro-2027/shihi': { all: { accept: ['ibt', 'ielts'], note: 'TOEFL 또는 IELTS(Academic) 필수(2024-04-01 이후 응시), 기준점 없음 — 점수 제출만 필수' } },
  /* ochanomizu */
// 오차노미즈여자대학 (ochanomizu) — TOEFL iBT는 이학부 물리학과·생활과학부 식물영양학과만 필수(기준점 없음). by_fac는 학부 단위라 note로 학과를 구분
  'ochanomizu-2027/tokubetsu': { by_fac: {
    '文教育学部': { accept: [], note: '영어 외부시험 불필요(본학 영어 필기 시험은 있음)' },
    '理学部': { accept: ['ibt'], note: '물리학과만 TOEFL iBT 필수(기준점 없음, 시험 첫날 기준 2년 이내, ITP 불가). 수학·화학·생물·정보과학과는 불필요' },
    '生活科学部': { accept: ['ibt'], note: '식물영양학과만 TOEFL iBT 필수(기준점 없음, 시험 첫날 기준 2년 이내, ITP 불가). 인간생활·심리학과는 불필요' },
    '共創工学部': { accept: [], note: '영어 외부시험 불필요(본학 영어 필기 시험은 있음)' } } },
  /* oit */
// 오사카공업대학 (oit) — 영어 외부시험 요구 없음
  'oit-2027/gaikoku': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* okayamaken */
// 岡山県立大学 (okayamaken) — 전 학부 TOEFL iBT 필수(기준점 없음, 배점 반영). Home Edition 불가
  'okayamaken-2027/hoken': { all: { accept: ['ibt'], note: 'TOEFL iBT 필수(기준점 명시 없음, 200점 배점). Home Edition 불가. 시험일 2년 전~출원 사이 응시분, DI 6812' } },
  'okayamaken-2027/joho': { all: { accept: ['ibt'], note: 'TOEFL iBT 필수(기준점 명시 없음, 200점 배점). Home Edition 불가. 시험일 2년 전~출원 사이 응시분, DI 6812' } },
  'okayamaken-2027/design': { all: { accept: ['ibt'], note: 'TOEFL iBT 필수(기준점 명시 없음, 배점 비주얼·공예 50점 / 건축 100점). Home Edition 불가. DI 6812' } },
  /* okigei */
// 오키나와현립예술대학 (okigei) — 사비 외국인유학생 선발은 대학입학공통테스트(외국어 포함) 면제, 영어 외부시험 요건 없음
  'okigei-2027/bijutsu': { all: { accept: [], note: '영어 외부시험 요건 없음 (공통테스트 면제, EJU 일본어·종합과목 + 실기·면접)' } },
  'okigei-2027/ongaku': { all: { accept: [], note: '영어 외부시험 요건 없음 (공통테스트 면제, EJU 일본어·종합과목 + 전공시험·면접)' } },
  /* onomichi */
// 오노미치시립대학 (onomichi)
  'onomichi-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음 (입학 후 전 학과 영어 필수 — 일본 고교 졸업 수준 영어력 필요)' } },
  /* osakakoritsu */
// 오사카공립대학 (osakakoritsu) — TOEFL iBT만, 2025-04-01 이후 응시, Test Date 점수만(MyBest·Special Home Edition 불가). 2026-01-20 이전은 0~120, 2026-01-21 이후는 밴드
  'osakakoritsu-2027/early': { all: { accept: ['ibt'], note: 'TOEFL iBT 제출 필수' }, by_fac: {
    '現代システム科学域': { accept: ['ibt'], min: { ibt: 61, band: 3.5 }, note: '환경사회시스템·교육복지·심리학류 iBT 61 / 밴드 3.5 (지식정보시스템학류는 iBT 45 / 밴드 3) — 출원 요건' },
    '獣医学部': { accept: ['ibt'], note: 'TOEFL iBT 제출 필수 · 기준점 없음 · 120점 만점으로 배점 반영' } } },
  'osakakoritsu-2027/main': { all: { accept: [], note: '영어 외부시험 요건 없음 (개별학력검사 영어 필기)' }, by_fac: {
    '農学部': { accept: ['ibt'], min: { ibt: 61, band: 3.5 }, note: '녹지환경과학과 iBT 61 / 밴드 3.5, 응용생물과학과 iBT 71 / 밴드 4, 생명기능화학과 기준 없음(제출 필수) — 출원 요건, 합·부 판정' },
    '看護学部': { accept: ['ibt'], min: { ibt: 45, band: 3.0 }, note: 'TOEFL iBT 45 / 밴드 3 — 출원 요건' } } },
  /* osakashika — 규칙 없음 */
  /* otaru — 규칙 없음 */
  /* ryukyu — 규칙 없음 */
  /* saga */
// 사가대학 (saga)
  'saga-2027/shihi': { by_fac: {
    '教育学部': { accept: ['ibt'], note: 'TOEFL iBT 필수(시험장 응시분만, Home Edition 불가). 기준점 명시 없음. 2025-01 이후 응시분' },
    '芸術地域デザイン学部': { accept: ['ibt'], note: 'TOEFL iBT 필수. 기준점 명시 없음. 2025-01 이후 응시분' },
    '経済学部': { accept: [], note: 'TOEFL 불필요(영어 요건 없음)' },
    '医学部': { accept: ['ibt'], note: 'TOEFL iBT 필수(시험장 응시분만, Home Edition 불가). 기준점 명시 없음. 2025-01 이후 응시분' },
    '理工学部': { accept: ['ibt'], note: 'TOEFL iBT 필수. 기준점 명시 없음. 2025-01 이후 응시분' },
    '農学部': { accept: ['ibt'], note: 'TOEFL iBT 필수(시험장 응시분만, Home Edition 불가). 기준점 명시 없음. 2025-01 이후 응시분' } } },
  /* sapporoshi */
// 札幌市立大学 (sapporoshi) — 영어 외부시험 요건 없음(요강에 언급 없음)
  'sapporoshi-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 언급 없음)' } },
  /* seian */
// 세이안조형대학 (seian) — 외국인유학생 입시 영어 외부시험 요건 없음
  'seian-2027/ki1': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'seian-2027/ki2': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'seian-2027/ki3': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* seikei */
// 세이케이대학 (seikei)
  'seikei-2027/gaikokujin': { by_fac: {
    '経済学部': { accept: ['ibt', 'ielts', 'toeic'], note: '출원 요건: 영검·TOEFL iBT·TOEIC L&R·IELTS(Academic)·GTEC·TEAP·케임브리지 중 하나 + JLPT N1. 기준점 없음 — 점수 제출만 필수. 출원 개시일 시점 유효 기간 안의 점수만, TOEFL ITP·TOEIC IP 불가' },
    '経営学部': { accept: [], note: '영어 점수 요건 없음 (활동 보고서에 검정·자격 점수를 적는 것은 임의)' },
    '法学部': { accept: [], note: '영어 점수 요건 없음 (어학 시험 증명서는 있으면 제출)' },
    '文学部': { accept: ['ibt', 'ielts'], min: { ibt: 72, band: 4.0, ielts: 5.5 }, note: '영어영미문학과만 해당 (일본문학·국제문화·현대사회학과는 영어 불필요). 영검 2300 / 케임브리지 160 / GTEC 1180 / TEAP 309도 인정(판정 불가), TOEIC L&R+S&W 합계 1095는 판정 제외. TOEFL iBT 72는 2026-01-20 이전 응시, 2026-01-21 이후는 밴드 4.0. 출원 개시일 시점 유효 기간 안의 점수만' },
    '国際共創学部': { accept: [], note: '영어 점수 요건 없음 (영어 외부 검정 성적을 내면 1차 서류 심사에서 평가)' },
    '理工学部': { accept: [], note: '영어 점수 요건 없음 (영어 검정 증명서는 임의 제출)' } } },
  /* shiga */
// 시가대학 (shiga) — 경제학부 사비 외국인유학생 선발: TOEIC L&R 공개테스트 공식인정증 제출 필수(400점 배점), 기준점 없음
  'shiga-2027/shihi': { by_fac: { '経済学部': { accept: ['toeic'], note: '기준점 없음 — TOEIC 공개테스트(L&R) 공식인정증 제출 필수(출원 개시일부터 2년 이내 응시, IP 불가, 일본 국외 응시분 가능). TOEFL·IELTS 불가' } } },
  /* shigaken — 규칙 없음 */
  /* shimaneken */
// 시마네현립대학 (shimaneken) — 사비 외국인유학생 특별선발에 영어 외부시험 요건 없음 (국제관계·지역정책은 소논문에서 영어력도 평가)
  'shimaneken-2027/kokusai': { all: { accept: [], note: '영어 외부시험 요건 없음 (소논문에서 국어력·영어력을 함께 평가)' } },
  'shimaneken-2027/ningen': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* shimonoseki — 규칙 없음 */
  /* shobi */
// 쇼비학원대학 (shobi) — 영어 성적 요건 없음 (서류·소논문·면접)
  'shobi-2027/doil': { all: { accept: [], note: '영어 외부시험 요건 없음 (서류·소논문·면접)' } },
  'shobi-2027/dojeon': { all: { accept: [], note: '영어 외부시험 요건 없음 (서류·소논문·면접, 온라인)' } },
  /* showajoshi */
'showajoshi-2027/ippan': { all: { accept: ['ibt', 'ielts'], note: '출원 요건 아님(기준점 없음). 국제학과·국제일본학과만 영어 4기능 점수로 적성테스트(영어) 면제·환산: iBT 53/61/79 이상, IELTS 5.0/5.5/6.0 이상 = 80/90/100점. 2026-01 이후 iBT 새 점수 기준은 본학 HP 확인' } },
  /* soka */
// 소카대학 (soka)
  'soka-2027/dojon': { by_fac: {
    '国際教養学部': { accept: ['ibt', 'ielts'], min: { band: 4.0, ielts: 6.0 }, note: 'TOEFL iBT 4.0(구 70) / IELTS Academic 6.0 / Duolingo 105(판정 제외) 중 하나. 출원 마감 2년 이내. 영미권 6년 영어 수학자는 성적증명서로 대체 가능' },
    '理工学部': { accept: [], note: '그린테크놀로지학과만, 일본어 N2 증명이 없을 때 TOEFL iBT 3.5(구 61)·IELTS 5.5·Duolingo 95 이상 중 하나(N5 이상 병행). 그 외 학과는 영어 요건 없음' },
    '経済経営学部': { accept: [], note: '영어 요건 없음' }, '法学部': { accept: [], note: '영어 요건 없음' }, '文学部': { accept: [], note: '영어 요건 없음' }, '教育学部': { accept: [], note: '영어 요건 없음' } } },
  'soka-2027/honko': { all: { accept: [], note: '영어 요건 없음' } },
  /* spuc */
// 시즈오카현립대학 (spuc) — TOEFL iBT 또는 TOEIC L&R 중 택일(약학·식품영양과학·경영정보), 국제관계학부는 불필요
  'spuc-2027/shihi': { by_fac: {
    '薬学部': { accept: ['ibt', 'toeic'], note: '득점 조건 없음 — TOEFL iBT 또는 TOEIC L&R 제출만 필수(2025-04-01 이후 응시, TOEIC은 일본 국내 응시분). 영어 모어 화자는 사전 신청으로 면제 가능' },
    '食品栄養科学部': { accept: ['ibt', 'toeic'], min: { ibt: 39, band: 3.0, toeic: 385 }, note: 'TOEFL iBT 39(2026-01-20 이전) / 밴드 3(2026-01-21 이후, 또는 참고값 39) · TOEIC L&R 385 중 1종. TOEIC은 일본 국내 응시분' },
    '経営情報学部': { accept: ['ibt', 'toeic'], min: { ibt: 39, band: 3.0, toeic: 385 }, note: 'TOEFL iBT 39(2026-01-20 이전) / 밴드 3(2026-01-21 이후, 또는 참고값 39) · TOEIC L&R 385 중 1종. TOEIC은 일본 국내 응시분' },
    '国際関係学部': { accept: [], note: '영어 시험 불필요(본교 영어 학력검사만)' },
  } },
  /* tgu — 규칙 없음 */
  /* tohokugeiko — 규칙 없음 */
  /* tokyoongaku */
'tokyoongaku-2027/haru': { all: { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 2.5, ielts: 4.0 }, note: '본학 영어시험(60분)으로 대체 가능. 영어 모어자·영어 교육 3년 이상이면 면제. TOEIC은 L&R+S&W 합산 625 요구라 제외' } },
  'tokyoongaku-2027/haru_mbt': { all: { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 2.5, ielts: 4.0 }, note: '영어·수학 중 본학 시험 1과목으로 대체 가능(영어 필수 아님). TOEIC은 L&R+S&W 합산 요구라 제외' } },
  'tokyoongaku-2027/haru_mla': { all: { accept: ['ibt', 'ielts'], min: { ibt: 52, band: 3.5, ielts: 4.5 }, note: '본학 영어시험으로 대체 가능. TOEIC은 L&R+S&W 합산 1150 요구라 제외' } },
  'tokyoongaku-2027/aki_a': { all: { accept: ['ibt', 'ielts'], min: { ibt: 52, band: 3.5, ielts: 4.5 }, note: '본학 영어시험으로 대체 가능. TOEIC은 L&R+S&W 합산 1150 요구라 제외' } },
  'tokyoongaku-2027/aki_b': { all: { accept: ['ibt', 'ielts'], min: { ibt: 52, band: 3.5, ielts: 4.5 }, note: '본학 영어시험으로 대체 가능. TOEIC은 L&R+S&W 합산 1150 요구라 제외' } },
  /* tottori */
// 톳토리대학 (tottori) — 영어 자격은 의학부 생명과학과·공학부만 필수. 영검 2급 이상도 인정하나 판정 불가(accept에서 제외)
  'tottori-2027/shihi': { by_fac: {
    '地域学部': { accept: [], note: '영어 외부시험 불필요' },
    '医学部': { accept: ['ibt', 'toeic'], min: { toeic: 500, ibt: 38, band: 3.0 }, note: '생명과학과만 해당(의학과·보건학과는 불필요). TOEIC 500 / iBT 2026-01-21 이후 밴드 3 이상, 이전 38(Reading 14·Listening 13 이상) / 영검 2급 이상(점수 판정 불가). 선고기일(2027-02-25) 기준 2년 이내' },
    '工学部': { accept: ['ibt', 'toeic'], min: { toeic: 500, ibt: 38, band: 3.0 }, note: 'TOEIC 500 / iBT 2026-01-21 이후 밴드 3 이상, 이전 38(Reading 14·Listening 13 이상) / 영검 2급 이상(점수 판정 불가). 선고기일(2027-02-25) 기준 2년 이내' },
    '農学部': { accept: [], note: '영어 외부시험 불필요' } } },
  /* toyamaken */
'toyamaken-2027/sogo': { all: { accept: ['ibt'], note: 'TOEFL iBT 응시 필수(출원 마감 전 2년 이내, ITP 불가), 기준점 없음 — 점수 제출만 필수. 면접에서 영어 능력도 시문' } },
  /* toyohashi */
'toyohashi-2027/gakusai': { all: { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 550, ibt: 42, ielts: 4.0 }, note: '출원 요건 · 2025-01 이후 응시 · TOEIC L&R 공개 테스트 · IELTS Academic(General Training 불가) · 2026-01-21 이후 iBT는 병기된 0~120 점수 참고값 기준(새 밴드 기준점 요강에 없음)' } },
  /* tsuda */
// 츠다쥬쿠대학 (tsuda)
  'tsuda-2027/sogo': { all: { accept: ['ibt', 'ielts'], note: '영어 능력 증명 서류 1개 이상 필수(기준점 없음). TOEFL iBT·IELTS(Academic)·GTEC·TEAP·영검(CSE 4기능) 인정, TOEIC은 L&R+S&W 양쪽(4기능) 필수라 판정 제외. 영검 이외는 2024-04-01 이후 응시분, TOEFL Home Edition 포함·MyBest 불가' } },
  'tsuda-2027/gakugei': { all: { accept: ['ibt', 'ielts'], note: '영어 능력 증명 서류 1개 이상 필수(기준점 없음). TOEFL iBT·IELTS(Academic)·GTEC·TEAP·영검(CSE 4기능) 인정, TOEIC은 L&R+S&W 양쪽(4기능) 필수라 판정 제외. 영검 이외는 2024-04-01 이후 응시분, TOEFL Home Edition 포함·MyBest 불가' } },
  /* tsuru */
// 츠루문과대학 (tsuru) — 영어 외부시험 요구 없음
  'tsuru-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* tsurumi */
// 츠루미대학 (tsurumi)
  'tsurumi-2027/ryugakusei': { all: { accept: [], note: '영어 외부시험 요건 없음 (요강에 영어 점수 제출 항목 없음)' } },
  /* tuat */
// 東京農工大学 (tuat) — 農・工 모두 TOEIC L&R 500 또는 TOEFL iBT 52 이상이 출원 요건(IELTS 불가). 2026-01-21 이후 iBT는 요강 환산표로 구점수로 바꿔 합산
  'tuat-2027/shihi': { all: { accept: ['ibt', 'toeic'], min: { ibt: 52, toeic: 500 }, note: 'TOEIC L&R(공개 테스트 성적증명서 원본) 500 이상 또는 TOEFL iBT 52 이상(Test Date 스코어, ETS 직송 DI C754). IELTS·TOEIC IP 불가. 2026-01-21 이후 iBT 밴드는 요강 환산표(섹션별 구점수 합산)로 52 이상인지 확인 — 밴드 기준 자체는 요강에 없음' } },
  /* utsunomiya */
// 우츠노미야대학 (utsunomiya) — 국제학부는 TOEFL iBT·TOEIC L&R·IELTS·GTEC·TEAP 중 1점, 그 외는 TOEFL iBT. 기준점 명시 없음
  'utsunomiya-2027/a': { all: { accept: ['ibt'], note: '농학부: TOEFL iBT(Home Edition 포함) 공식 스코어만 · 기준점 명시 없음 · My Best 점수 불가' }, by_fac: { '国際学部': { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 명시 없음 — TOEFL iBT·TOEIC L&R(공개 테스트, 과거 3년 이내)·IELTS(과거 2년)·GTEC·TEAP(4기능) 중 1점. GTEC·TEAP는 판정 제외' } } },
  'utsunomiya-2027/b': { all: { accept: ['ibt'], note: 'TOEFL iBT(Home Edition 포함) 공식 스코어만 · 기준점 명시 없음 · My Best 점수 불가' } },
  /* wakayama */
// 와카야마대학 (wakayama) — TOEIC L&R 또는 TOEFL iBT 중 하나가 출원 요건
  'wakayama-2027/shihi': { by_fac: {
    '経済学部': { accept: ['ibt', 'toeic'], min: { toeic: 450, ibt: 42, band: 3.0 }, note: 'TOEIC L&R 450 또는 iBT(2026-01-21 이후 밴드 3 이상, 이전 42) 중 하나. 2년 이내 응시분, ITP·IP·My Best 불가' },
    'システム工学部': { accept: ['ibt', 'toeic'], min: { toeic: 410, ibt: 42, band: 3.0 }, note: 'TOEIC L&R 410 또는 iBT(2026-01-21 이후 밴드 3 이상, 이전 42) 중 하나. 2년 이내 응시분, ITP·IP·My Best 불가' },
    '観光学部': { accept: ['ibt', 'toeic'], min: { toeic: 450, ibt: 42, band: 3.0 }, note: 'TOEIC L&R 450 또는 iBT(2026-01-21 이후 밴드 3 이상, 이전 42) 중 하나. 2년 이내 응시분, ITP·IP·My Best 불가' } } },
  /* yokohamabijutsu */
// 요코하마미술대학 (yokohamabijutsu) — 외국인유학생 입시는 영어 외부시험 요건 없음
  'yokohamabijutsu-2027/1ki': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'yokohamabijutsu-2027/2ki': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* aomori */
// 아오모리공립대학 (aomori) — 종합형선발Ⅱ 외국인유학생 특별선발: TOEFL 또는 TOEIC L&R 점수 제출 필수, 기준점 없음
  'aomori-2027/gaikokujin': { all: { accept: ['ibt', 'toeic'], note: 'TOEFL 또는 TOEIC L&R 점수 제출 필수 · 기준점 요강에 없음(면접 참고 자료). TOEFL 종류(iBT 외 가능 여부)와 유효 기간은 요강에 명시 없음' } },
  /* dokkyo */
// 독쿄대학 (dokkyo) — 출원 자격 기준표(학과별). TOEIC은 L&R+S&W 합계 요구라 판정 제외. by_fac는 학부 단위라 외국어학부는 가장 낮은 기준(독·불어학과) 사용
  'dokkyo-2027/global': { all: { accept: [], note: '영어 기준 없음(경제학부 경제·경영학과, 법학부)' }, by_fac: {
    '外国語学部': { accept: ['ibt', 'ielts'], min: { ibt: 42, band: 2.5, ielts: 4.0 }, note: '학과별 상이: 독일어·프랑스어학과 iBT 2.5(구 42)·IELTS 4.0, 영어학과·교류문화학과 iBT 3.5(구 58)·IELTS 4.5(영어·교류문화는 이 기준이 필요). TOEIC L&R+S&W 합계(790/950)는 판정 제외' },
    '国際教養学部': { accept: ['ibt', 'ielts'], min: { ibt: 47, band: 3.0, ielts: 4.0 }, note: '언어문화학과. TOEIC L&R+S&W 800 합계는 판정 제외' },
    '経済学部': { accept: ['ibt', 'ielts'], min: { ibt: 57, band: 3.0, ielts: 4.5 }, note: '국제환경경제학과만 해당(경제·경영학과는 기준 없음). TOEIC L&R+S&W 790 합계는 판정 제외. 요강 표의 iBT 구 점수 57은 원문 그대로' } } },
  /* ehimeken */
// 에히메현립의료기술대학 (ehimeken) — 영어 외부시험 요건 없음 (소논문에 영문 독해 출제)
  'ehimeken-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음 (소논문에 영문 독해 출제, 영작문 아님)' } },
  /* hamamatsu — 규칙 없음 */
  /* osakakeizai */
// 오사카경제대학 (osakakeizai) — 영어 외부시험 요건 없음
  'osakakeizai-2027/kokusai': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* takeo */
// 타케오아시아대학 (takeo) — 영어 외부시험 요건 없음
  'takeo-2027/r1': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'takeo-2027/r2': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'takeo-2027/r3': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'takeo-2027/r4': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  'takeo-2027/r5': { all: { accept: [], note: '영어 외부시험 요건 없음' } },
  /* tokushima */
// 토쿠시마대학 (tokushima) — 사비외국인유학생 선발(일본 내 시험). 도일전 전형(dojonzen)은 영어 외부시험 요건이 요강에 없어 규칙 없음
  'tokushima-2027/kokunai': { by_fac: {
    '総合科学部': { accept: ['ibt', 'ielts', 'toeic'], min: { toeic: 350, ibt: 39, band: 2.5, ielts: 3.5 }, note: '영검 1,700 / 케임브리지 120도 인정(판정 불가). 5종 중 하나 충족. TOEFL iBT는 2025-01 이후 응시분, 그 밖은 출원 최종일에 유효한 것' },
    '医学部': { accept: ['ibt'], min: { ibt: 80, band: 4.5 }, note: '医学科 기준(TOEFL iBT 총합 4.5 / 2026-01-20 이전 응시 80점). 保健学科 看護学専攻는 TOEFL 제출만 필수(기준점 없음), 放射線技術科学·検査技術科学 전공은 TOEFL 불요. 2025-01 이후 응시분' },
    '歯学部': { accept: ['ibt'], min: { ibt: 80, band: 4.5 }, note: 'TOEFL iBT 총합 4.5 / 2026-01-20 이전 응시 80점. 2025-01 이후 응시분' },
    '薬学部': { accept: ['ibt'], min: { ibt: 80, band: 4.5 }, note: 'TOEFL iBT 총합 4.5 / 2026-01-20 이전 응시 80점. 2025-01 이후 응시분' },
    '理工学部': { accept: ['ibt'], note: 'TOEFL iBT 제출 필수 · 성적 기준 지정 없음. 2025-01 이후 응시분' },
    '生物資源産業学部': { accept: ['ibt'], note: 'TOEFL iBT 제출 필수 · 성적 기준 지정 없음. 2025-01 이후 응시분' } } },
  /* tottorikankyo */
// 톳토리환경대학 (tottorikankyo) — 영어 외부시험 요건 없음 (JLPT CEFR B2 이상이 출원 자격)
  'tottorikankyo-2027/shihi': { all: { accept: [], note: '영어 외부시험 요건 없음 (일본어 JLPT CEFR B2 이상 필요)' } },
  /* keio_add */
// 케이오 의학부 추가 전형 (keio) — TOEFL iBT 또는 IELTS Academic 필수, 기준점 없음
  'keio-2027/igaku': { all: { accept: ['ibt', 'ielts'], note: '기준점 없음 · 구·신 TOEFL 모두 제출 가능. 2024-09-01 ~ 2026-06-30 응시, Official Score 직송 필수 (TOEFL 기관코드 0773)' } }
};
