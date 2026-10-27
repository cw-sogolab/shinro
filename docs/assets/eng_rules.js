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

  'todai-2027/type1': { all: { accept: ['ibt', 'ielts'], note: '기준점 명시 없음' } }
};
