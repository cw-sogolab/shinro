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
  'toyo-2027/dojon_b': { all: { accept: ['ibt', 'ielts', 'toeic'], note: '기준점 없음 · 2024-11-01 이후 응시분 점수 제출만 필수. TOEFL iBT Home Edition 포함, MyBest·ITP·TOEIC IP 불가' } }
};
