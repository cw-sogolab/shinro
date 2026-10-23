#!/usr/bin/env python3
"""모집요강 PDF → 장별 일본어 원문(yoko_ja.js) 생성.

- 번역 데이터(data/yoko/2027/*.json)는 읽기만 한다.
- 글자 추출은 pypdfium2. 글자 상자 좌표로 줄을 다시 짜서(같은 높이 = 한 줄, 위→아래)
  레이아웃이 뒤섞인 PDF(간사이 등)에서도 읽는 순서를 맞춘다. 줄 안에서는 PDF의 글자 순서를 유지한다.
- 장 범위: 각 장의 시작 제목 문자열(title_ja 또는 원문에 인쇄된 제목)이 있는 줄부터
  다음 경계 제목 직전까지. 경계는 아래 CONFIG에 PDF 쪽 번호와 함께 적는다
  (p는 인쇄 쪽 번호라 PDF 쪽과 어긋나는 문서가 있으므로 실제 제목 문자열로 찾는다).
- 정리: 쪽 머리말·꼬리말(여러 쪽에 반복되는 첫·끝 줄, 쪽 번호) 제거, 문장 중간 줄바꿈 이음.
  내용은 고치지 않는다. 1만 자를 넘으면 앞 1만 자만 두고 「…(이하 원문 ○쪽)」.
- 그림으로만 실린 표(텍스트 없음)는 IMAGE_PAGES에 눈으로 옮겨 적은 텍스트를 쓴다(note로 표시).

실행: python3 tools/yoko_ja.py --src <폴더> [--debug]
  <폴더>에는 iCloud 모집요강 PDF를 문서 id 이름으로 복사해 둔다 (chuo.pdf, keio.pdf, kyoto_law.pdf, kyoto_econ.pdf … — 아래 CONFIG의 첫 칸).
  필요: pip install pypdfium2
"""
import json, os, re, sys, unicodedata
from collections import Counter
from pathlib import Path
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parent.parent
SRC = os.path.expanduser(sys.argv[sys.argv.index('--src') + 1]).rstrip('/') + '/' if '--src' in sys.argv else str(ROOT / '.work' / 'yoko_pdf') + '/'
DATA = str(ROOT / 'data' / 'yoko' / '2027') + '/'
OUT = str(ROOT / 'docs' / 'assets' / 'yoko_ja.js')
LIMIT = 10000
DEBUG = '--debug' in sys.argv

# PDF별 추출 옵션.
# - 기본은 PDF 글자 흐름 순서(pdfium이 줄 단위로 묶어 줌).
# - mode 'pos': 글자 흐름이 뒤섞인 PDF(간사이)는 글자 좌표로 줄을 다시 짠다.
# - xmax: 오른쪽 가장자리의 세로 색인 탭(게이오·릿쿄)을 잘라낸다.
PDF_OPTS = {'kansai': {'mode': 'pos'}, 'keio': {'mode': 'pos', 'xmax': 560}, 'rikkyo': {'xmax': 560}}

# 장 범위. seg = (pdf, 시작쪽, 시작 제목, 끝쪽, 끝 경계 제목 | None=그 쪽 끝까지)
# 시작/끝 제목은 그 쪽에서 해당 문자열이 들어 있는 첫 줄(공백·전각/반각 무시)을 찾는다.
CONFIG = {
 'chuo': {
  's1': [('chuo', 3, '〚1〛募集学部・学科・専攻(プログラム)・コース・募集人員', 4, '〚2〛出願資格')],
  's2': [('chuo', 4, '〚2〛出願資格', 5, '〚3〛入試関連日程')],
  's3': [('chuo', 5, '〚3〛入試関連日程', 5, None)],
  # 「出願要件一覧」 표 위의 ◆영어검정·EJU·JLPT 안내까지 번역 장에 들어 있어 쪽 첫머리부터
  's4': [('chuo', 6, '◆英語検定試験について', 6, None)],
  's5': [('chuo', 20, '〚5〛選考のながれ', 23, '〚6〛入学手続')],
  's6': [('chuo', 23, '〚6〛入学手続', 25, '〚8〛入学後の履修')],
  's7': [('chuo', 29, '2.過年度試験結果', 29, None)],
 },
 'hitotsu': {
  's1': [('hitotsu', 7, '２募集学部及び募集人員等', 7, '３出願資格')],
  's2': [('hitotsu', 7, '３出願資格', 9, '４出願手続')],
  's3': [('hitotsu', 16, '６選抜方法等', 17, '８合格者発表')],
 },
 'hosei': {
  's1': [('hosei', 3, '１.入学試験制度の趣旨', 3, '２.重要事項')],
  's2': [('hosei', 3, '２.重要事項', 3, None)],
  's3': [('hosei', 4, '３.前年度入試結果', 4, None)],
  's4': [('hosei', 7, '１.科目等一覧表', 7, None)],
  's5': [('hosei', 8, '２．出願資格', 8, None)],
  's6': [('hosei', 9, 'Ⅲ出願', 22, 'Ⅳ入学試験・合格発表')],
  's7': [('hosei', 22, 'Ⅳ入学試験・合格発表', 24, 'Ⅴ入学手続')],
  's8': [('hosei', 24, 'Ⅴ入学手続', 25, '２.入学手続時の納入金等')],
 },
 'kansai': {
  's1': [('kansai', 3, '1募集学部・学科（専攻・専修）・募集人員', 3, '2入試日程')],
  's2': [('kansai', 3, '2入試日程', 4, '4出願資格')],
  's3': [('kansai', 4, '4出願資格', 5, '5選考方法・試験科目・配点・時間')],
  's4': [('kansai', 5, '5選考方法・試験科目・配点・時間', 9, '6出願手続・入学検定料')],
  's5': [('kansai', 9, '6出願手続・入学検定料', 14, '7必要書類記入上の注意')],
  's6': [('kansai', 20, '12合格者発表', 21, '学費・諸費')],
  's7': [('kansai', 21, '学費・諸費', 23, '15奨学金')],
 },
 'keio': {
  's1': [('keio', 6, '1-1募集人員・日程一覧', 7, '1-2各学部の入学試験概要')],
  's2': [('keio', 7, '1-2各学部の入学試験概要', 9, '2出願までの流れ')],
  's3': [('keio', 10, '出願資格', 11, '出願期間・出願方法')],
  's4': [('keio', 11, '出願期間・出願方法', 17, '2-5出願に必要な書類の準備')],
  's5': [('keio', 17, '2-5出願に必要な書類の準備', 22, 'H日本留学試験結果')],
  's6': [('keio', 22, 'H日本留学試験結果', 25, '○該当する学部のみ必要な出願書類')],
  's7': [('keio', 28, '3合格発表・受験票の発行・第2次選考', 34, '5入学に必要な費用・奨学制度など')],
 },
 'kyoto': {
  's1': [('kyoto_law', 1, 'Ⅰ募集人員', 2, 'Ⅲ出願資格審査')],
  's2': [('kyoto_law', 2, 'Ⅲ出願資格審査', 3, 'Ⅴ出願手続')],
  's3': [('kyoto_law', 4, 'Ⅵ選考方法', 5, 'Ⅸ入学手続・授業料等')],
  's4': [('kyoto_law', 5, 'Ⅸ入学手続・授業料等', 5, 'Ⅹ入試情報開示'),
         ('kyoto_law', 5, 'Ⅺ出願・受験に関する注意', 5, 'Ⅻ個人情報の取扱いについて')],
  's5': [('kyoto_econ', 1, 'Ⅰ募集人員', 2, 'Ⅲ出願資格審査')],
  's6': [('kyoto_econ', 3, 'Ⅳ出願書類受理期間', 5, '２．統一試験制度等による試験成績評価証明書等について')],
  's7': [('kyoto_econ', 5, '２．統一試験制度等による試験成績評価証明書等について', 6, 'Ⅵ選考方法')],
  's8': [('kyoto_econ', 6, 'Ⅵ選考方法', 7, 'Ⅸ入学手続・授業料等')],
  's9': [('kyoto_econ', 7, 'Ⅸ入学手続・授業料等', 7, 'XI個人情報の取扱いについて')],
 },
 'osaka': {
  's1': [('osaka', 5, '１．募集人員', 6, '２．出願資格')],
  's2': [('osaka', 6, '２．出願資格', 8, '出願基準点表')],
  's3': [('osaka', 8, '【日本留学試験】及び【TOEFL】出願基準点表', 11, '３．選抜方法')],
  's4': [('osaka', 11, '３．選抜方法', 14, '５．試験場')],
  's5': [('osaka', 15, '６．出願手続', 26, '７．受験票・受験者注意事項')],
  's6': [('osaka', 26, '７．受験票・受験者注意事項', 29, '10．２年次又は３年次からの分属について')],
  's7': [('osaka', 30, '2026年度私費外国人留学生特別入試実施状況', 30, None)],
 },
 'rikkyo': {
  's1': [('rikkyo', 4, '1募集学部・学科（専修）および募集人員', 5, '2入試関連日程')],
  's2': [('rikkyo', 5, '2入試関連日程', 6, '3出願資格')],
  's3': [('rikkyo', 6, '3出願資格', 11, '4出願手続')],
  's4': [('rikkyo', 14, '2出願書類', 14, None)],
  's5': [('rikkyo', 32, '8出願書類の郵送', 33, '5受験票の取得')],
  's6': [('rikkyo', 33, '5受験票の取得', 34, '8入学手続')],
  's7': [('rikkyo', 34, '8入学手続', 35, '9入学後の言語系科目について')],
 },
 'todai': {
  's1': [('todai', 5, '１募集人員', 7, '３出願期間')],
  's2': [('todai', 13, '５選抜方法', 14, '６合格者発表')],
  's3': [('todai', 14, '６合格者発表', 16, 'Ⅱ第2種（帰国生徒）の特別選考')],
 },
}

# 그림으로만 실린 표(텍스트 층 없음) — 그림을 보고 옮겨 적음(합계 대조함).
IMAGE_PAGES = {
 ('hosei', 4): """３.前年度入試結果
学部 学科 志願者 一次合格者 二次受験者 二次合格者
法 法律 49 11 7 6
政治 6 2 1 1
国際政治 28 12 3 3
法 計 83 25 11 10
文 哲 3 2 1 1
日本文 8 6 2 2
英文 0 0 0 0
史 6 3 2 0
地理 12 5 4 3
心理 5 2 2 2
文 計 34 18 11 8
経済 経済 116 19 14 13
国際経済 23 3 3 3
現代ビジネス 23 3 3 3
経済 計 162 25 20 19
社会 社会政策科 15 3 3 0
社会 99 16 11 9
メディア社会 53 15 10 9
社会 計 167 34 24 18
経営 経営 36 5 3 3
経営戦略 23 3 2 2
市場経営 16 5 2 2
経営 計 75 13 7 7
国際文化 国際文化 56 16 12 5
国際文化 計 56 16 12 5
人間環境 人間環境 58 15 12 6
人間環境 計 58 15 12 6
現代福祉 福祉コミュニティ 14 10 10 6
臨床心理 13 8 4 2
現代福祉 計 27 18 14 8
キャリアデザイン キャリアデザイン 58 10 8 3
キャリアデザイン 計 58 10 8 3
スポーツ健康 スポーツ健康 12 8 7 6
スポーツ健康 計 12 8 7 6
情報科 コンピュータ科 11 1 1 1
ディジタルメディア 17 1 1 1
情報科 計 28 2 2 2
デザイン工 建築 14 7 4 2
都市環境デザイン工 6 3 2 2
システムデザイン 11 4 3 3
デザイン工 計 31 14 9 7
理工 機械工 機械工 18 10 8 8
電気電子工 32 18 15 14
応用情報工 12 7 4 3
経営システム工 25 11 7 7
創生科 6 2 1 1
理工 計 93 48 35 33
生命科 生命機能 28 9 5 5
環境応用化 10 2 1 1
応用植物科 11 4 3 3
生命科 計 49 15 9 9
方式・制度・計 933 261 181 141""",
 ('hosei', 7): """Ⅱ 募集学部・出願資格
１.科目等一覧表
出願条件 （◎：必須、○：選択、×：不要） ※合格基準点は非公開
【日本留学試験（ＥＪＵ）】 対象試験：2025年6月，11月 2026年6月
【英語外部試験】 TOEFL iBT®，IELTS，TOEIC®L&R のいずれか ＊7 ※出願開始日より遡って2年以内に受験したもの
キャンパス 学部 学科 募集人員 ／ 日本語（読解、聴解・聴読解） 日本語記述 総合科目 数学コース1 数学コース2 理科 ／ 英語外部試験
市ケ谷 法学部 法律学科・政治学科・国際政治学科 15 ／ ◎250点以上 ◎ × × × × ／ ◎
文学部 哲学科 10＊5 ／ ◎ ◎ ○＊1 ○＊1 × × ／ ×
日本文学科 5 ／ ×
英文学科 10＊5 ／ ◎
史学科 10＊5 ／ ×
地理学科 10＊5 ／ ×
心理学科 10＊5 ／ ◎
（文学部）日本語(読解、聴解・聴読解)＋日本語記述＋総合科目または数学コース1の合計得点550点(日本文のみ530点)以上
経営学部 経営学科 7 ／ 経営戦略学科 4 ／ 市場経営学科 4 ／ ◎270点以上 ◎ × × × × ／ ◎ 【注意】TOEIC®で出願する場合：TOEIC®L&R及びTOEIC®S&Wのスコア提出も必要
国際文化学部 国際文化学科 5 ／ ◎260点以上 ◎ ○＊1 ○＊1 × × ／ ◎ 【注意】TOEIC®で出願する場合：TOEIC®L&R及びTOEIC®S&Wのスコア提出も必要
人間環境学部 人間環境学科 5 ／ ◎270点以上 ◎ × × × × ／ ×
キャリアデザイン学部 キャリアデザイン学科 10 ／ ◎270点以上 ◎ × × × × ／ ×
多摩 経済学部 経済学科・国際経済学科・現代ビジネス学科 28 ／ ◎270点以上 ◎ × × × × ／ 経済学科 × 国際経済学科 ◎ 現代ビジネス学科 ×
社会学部 社会政策科学科 3 ／ 社会学科 5 ／ メディア社会学科 3 ／ ◎280点以上 ◎ ○＊1 ○＊1 × × ／ ×
現代福祉学部 福祉コミュニティ学科・臨床心理学科 9 ／ ◎280点以上 ◎ ○＊1 ○＊1 × × ／ ×
スポーツ健康学部 スポーツ健康学科 5 ／ ◎270点以上 ◎ ○＊1 ○＊1 × × ／ ◎
市ケ谷 デザイン工学部 建築学科 7 ／ 都市環境デザイン工学科 2 ／ システムデザイン学科 2 ／ ◎280点以上 ◎ × × ◎ × ／ ◎
小金井 情報科学部＊2 コンピュータ科学科 1 ／ ディジタルメディア学科 1 ／ ◎270点以上 ◎ × × ◎ × ／ ◎
理工学部＊3 ◎280点以上 ◎ × × ◎ ／ ◎
機械工学科 1 理科 ◎＊4
電気電子工学科 1 理科 ◎＊4
応用情報工学科 1 理科 ◎＊4
経営システム工学科 1 理科 ×
創生科学科 1 理科 ◎＊4
生命科学部 生命機能学科 2 ／ 環境応用化学科 2 ／ 応用植物科学科 1 ／ ◎260点以上 ◎ × × ◎ ◎＊6 ／ ◎
「＊」の注釈
＊1 「総合科目」と「数学コース１」の2科目とも受験した場合、得点の高い1科目のみを合否判定に使用します。
＊2 面接には数学・英語など基礎学力の確認を含みます。
＊3 面接には数学・理科・英語などの基礎学力の確認を含みます。
＊4 「物理」を含んだ2科目を受験してください。
＊5 哲学科、英文学科、史学科、地理学科、心理学科の5学科を合わせて計10名。
＊6 「物理」「化学」「生物」の3科目から2科目を受験してください。
＊7 TOEFLはiBT® Home Edition、ITP（団体受験）、MyBest™scoresは利用できません。IELTSはIELTS Online、Indicator、One Skill Retakeは利用できません。TOEIC®IP（団体受験）は利用できません。""",
 ('osaka', 30): """（付） 2026年度私費外国人留学生特別入試実施状況
大阪大学
学部 学科・専攻 募集人員 志願者数 受験者数 合格者数 入学者数
文学部 人文学科 若干名 27(14) 19(11) 3(2) 3(2)
人間科学部 人間科学科 若干名 16(9) 9(6) 2(2) 1(1)
外国語学部 外国語学科 中国語専攻 若干名 0(0) 0(0) 0(0) 0(0)
朝鮮語専攻 0(0) 0(0) 0(0) 0(0)
モンゴル語専攻 1(1) 1(1) 1(1) 1(1)
インドネシア語専攻 0(0) 0(0) 0(0) 0(0)
フィリピン語専攻 0(0) 0(0) 0(0) 0(0)
タイ語専攻 0(0) 0(0) 0(0) 0(0)
ベトナム語専攻 0(0) 0(0) 0(0) 0(0)
ビルマ語専攻 0(0) 0(0) 0(0) 0(0)
ヒンディー語専攻 0(0) 0(0) 0(0) 0(0)
ウルドゥー語専攻 0(0) 0(0) 0(0) 0(0)
アラビア語専攻 0(0) 0(0) 0(0) 0(0)
ペルシア語専攻 0(0) 0(0) 0(0) 0(0)
トルコ語専攻 0(0) 0(0) 0(0) 0(0)
スワヒリ語専攻 0(0) 0(0) 0(0) 0(0)
ロシア語専攻 0(0) 0(0) 0(0) 0(0)
ハンガリー語専攻 0(0) 0(0) 0(0) 0(0)
デンマーク語専攻 0(0) 0(0) 0(0) 0(0)
スウェーデン語専攻 0(0) 0(0) 0(0) 0(0)
ドイツ語専攻 0(0) 0(0) 0(0) 0(0)
英語専攻 2(0) 2(0) 0(0) 0(0)
フランス語専攻 0(0) 0(0) 0(0) 0(0)
イタリア語専攻 0(0) 0(0) 0(0) 0(0)
スペイン語専攻 0(0) 0(0) 0(0) 0(0)
ポルトガル語専攻 0(0) 0(0) 0(0) 0(0)
日本語専攻 8 24(14) 14(9) 8(6) 6(5)
小計 27(15) 17(10) 9(7) 7(6)
法学部 法学科 若干名 10(7) 7(6) 1(1) 1(1)
国際公共政策学科 30(10) 18(5) 4(0) 2(0)
小計 40(17) 25(11) 5(1) 3(1)
経済学部 経済・経営学科 若干名 29(7) 18(5) 4(1) 4(1)
理学部 生物科学科 生命理学コース 若干名 1(1) 0(0) 0(0) 0(0)
小計 1(1) 0(0) 0(0) 0(0)
医学部 医学科 若干名 1(1) 1(1) 0(0) 0(0)
保健学科 看護学専攻 0(0) 0(0) 0(0) 0(0)
放射線技術科学専攻 1(1) 1(1) 0(0) 0(0)
検査技術科学専攻 0(0) 0(0) 0(0) 0(0)
小計 2(2) 2(2) 0(0) 0(0)
歯学部 歯学科 若干名 2(1) 1(0) 0(0) 0(0)
薬学部 薬学科 若干名 1(0) 1(0) 1(0) 1(0)
工学部 応用自然科学科 若干名 4(1) 4(1) 0(0) 0(0)
応用理工学科 8(1) 6(0) 1(0) 1(0)
電子情報工学科 7(0) 4(0) 1(0) 1(0)
環境・エネルギー工学科 1(1) 1(1) 0(0) 0(0)
地球総合工学科 4(1) 2(1) 1(0) 1(0)
小計 24(4) 17(3) 3(0) 3(0)
基礎工学部 電子物理科学科 若干名 1(0) 1(0) 0(0) 0(0)
化学応用科学科 0(0) 0(0) 0(0) 0(0)
システム科学科 5(4) 2(2) 1(1) 0(0)
情報科学科 6(1) 3(0) 0(0) 0(0)
小計 12(5) 6(2) 1(1) 0(0)
合計 181(75) 115(50) 28(14) 22(11)
（注） 女子の数を（ ）に内数で示す。""",
}
IMAGE_NOTE = '이 쪽의 표는 PDF에 글자 층이 없는 그림이라, 그림을 보고 줄 단위로 옮겨 적었습니다(합계는 대조함). 원본 PDF와 대조 필요.'


# ---------------------------------------------------------------- 추출
def page_lines(page, xmax=None):
    tp = page.get_textpage()
    chars = []
    for i in range(tp.count_chars()):
        c = tp.get_text_range(i, 1)
        if not c or c.isspace() or c in '￾\x00':
            continue
        l, b, r, t = tp.get_charbox(i, loose=True)
        if r - l <= 0 and t - b <= 0:
            continue
        if xmax is not None and l > xmax:
            continue
        chars.append((i, c, l, b, r, t))
    # 같은 높이의 글자를 한 줄로 묶는다
    chars.sort(key=lambda x: (-(x[3] + x[5]) / 2, x[2]))
    lines = []
    for ch in chars:
        cy = (ch[3] + ch[5]) / 2
        h = max(ch[5] - ch[3], 1)
        for ln in lines[-8:]:
            if abs(ln['cy'] - cy) < 0.5 * max(ln['h'], h):
                ln['ch'].append(ch)
                break
        else:
            lines.append({'cy': cy, 'h': h, 'ch': [ch]})
    lines.sort(key=lambda L: -L['cy'])
    out = []
    for L in lines:
        H = L['h']
        runs = []  # PDF 글자 순서가 이어지는 덩어리 → 덩어리끼리만 왼쪽부터 정렬
        for ch in sorted(L['ch']):
            if runs:
                p = runs[-1][-1]
                if ch[0] - p[0] <= 3 and -1.5 * H < ch[2] - p[4] < 2.5 * H:
                    runs[-1].append(ch)
                    continue
            runs.append([ch])
        runs.sort(key=lambda R: min(x[2] for x in R))
        s, prev = '', None
        for R in runs:
            for k, (i, c, l, b, r, t) in enumerate(R):
                if prev is not None:
                    gap = l - prev
                    asc = s[-1:].isascii() and c.isascii()
                    if gap > 3 * H:
                        s += '  '
                    elif gap > (0.2 if asc else 0.8) * H:
                        s += ' '
                s += c
                prev = max(r, prev) if (prev is not None and k > 0) else r
        # 기호 글꼴(Wingdings 등)의 사설 영역 글머리표는 「・」로
        out.append(re.sub(r'[\ue000-\uf8ff]', '・', s.rstrip()))
    return out


def page_lines_stream(page, xmax=None):
    tp = page.get_textpage()
    if xmax is not None:
        W, H = page.get_size()
        t = tp.get_text_bounded(left=0, bottom=0, right=xmax, top=H)
    else:
        t = tp.get_text_range()
    out = []
    for s in re.split(r'\r\n|\r|\n', t):
        s = re.sub(r'[-]', '・', s).strip()
        if s:
            out.append(s)
    return out


def tidy(s):
    # 조판용 공백만 정리: 탭 → 공백, 「2026 年 12 月」→「2026年12月」
    s = re.sub(r'[ \t]*\t[ \t]*', ' ', s)
    s = re.sub(r'(?<=[0-9０-９]) (?=[年月日時分名点歳回校通部人円])', '', s)
    s = re.sub(r'(?<=[年月第約計全各]) (?=[0-9０-９])', '', s)
    return s


def norm(s):
    return re.sub(r'[\s　.．,，]', '', unicodedata.normalize('NFKC', s))


PAGENO = re.compile(r'^[\s\-－‐―ー–—]*[0-9０-９]{1,3}[\s\-－‐―ー–—]*$')


def load_pdf(name):
    pdf = pdfium.PdfDocument(SRC + name + '.pdf')
    o = PDF_OPTS.get(name, {})
    fn = page_lines if o.get('mode') == 'pos' else page_lines_stream
    pages = [[tidy(x) for x in fn(pdf[i], xmax=o.get('xmax'))] for i in range(len(pdf))]
    # 반복 머리말·꼬리말: 쪽의 첫·끝 2줄 중, 숫자를 지운 모양이 여러 쪽에 반복되는 줄
    key = lambda s: re.sub(r'[0-9０-９]+', '#', norm(s))
    cnt = Counter()
    for L in pages:
        for s in set(key(x) for x in L[:2] + L[-2:]):
            cnt[s] += 1
    n = len(pages)
    rep = {k for k, v in cnt.items() if k and v >= max(3, n * 0.25)}
    cleaned = []
    for L in pages:
        keep = []
        for j, s in enumerate(L):
            edge = j < 2 or j >= len(L) - 2
            if edge and (key(s) in rep or PAGENO.match(s)):
                continue
            keep.append(s)
        cleaned.append(keep)
    return cleaned, {k for k in rep}


# ---------------------------------------------------------------- 줄 이음
LIST_START = re.compile(
    r'^([※・●○◎■□◆◇▶►▷➢\-－＊*✓☑]|[①-⑳⑴-⒇❶-❿㈠-㈩]|[（(][0-9０-９一二三四五六七八九十a-zａ-ｚA-ZＡ-Ｚｱ-ﾝア-ンイロハニ]{1,3}[）)]'
    r'|[0-9０-９]{1,2}[．.、)）]|[A-ZＡ-Ｚa-zａ-ｚ][．.)）]|[ア-ンｱ-ﾝ][ 　]|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ]|【|〈|＜|<|〔|［|注[0-9０-９:：]|\|)')


LABEL_ONLY = re.compile(r'^([①-⑳⑴-⒇➀-➉➂]|[0-9０-９]{1,2}[.．]|[（(][0-9０-９]{1,2}[）)])$')


def looks_row(s):
    # 표의 한 행으로 보이는 줄(일본어 칸 사이에 공백이 둘 이상) — 잇지 않는다
    return len(re.findall(r'[^\x00-\x7f] [^\x00-\x7f]', s)) >= 2


def width(s):
    return sum(1 if unicodedata.east_asian_width(c) in 'WFA' else 0.5 for c in s)


def join_lines(lines):
    """문장 중간에서 끊긴 줄만 잇는다(표·목록 줄은 그대로).
    - 본문 폭(긴 줄들의 80% 지점)에 거의 닿은 줄이 。로 끝나지 않고, 다음 줄이 목록 머리가 아니면 잇는다.
    - 번호만 있는 줄(「④」「3.」)은 다음 줄 앞에 붙인다."""
    if not lines:
        return ''
    long_ws = sorted(w for w in (width(s) for s in lines) if w >= 15)
    W = long_ws[int(len(long_ws) * 0.8)] if long_ws else 0
    out = []
    pending_label = None
    for s in lines:
        if LABEL_ONLY.match(s):
            if pending_label is not None:
                out.append(pending_label)
            pending_label = s
            continue
        if pending_label is not None:
            s = pending_label + ' ' + s
            pending_label = None
            out.append(s)
            continue
        if out:
            p = out[-1]
            if (W >= 20 and width(p) >= 0.92 * W and '  ' not in p and '  ' not in s
                    and not looks_row(p) and not looks_row(s)
                    and not re.search(r'[。｡：:]$', p) and s and not LIST_START.match(s)):
                sep = ' ' if (p[-1:].isascii() and p[-1:].isalnum() and s[:1].isascii() and s[:1].isalnum()) else ''
                out[-1] = p + sep + s
                continue
        out.append(s)
    if pending_label is not None:
        out.append(pending_label)
    return '\n'.join(out)


# ---------------------------------------------------------------- 본체
def find_line(lines, anchor, start=0):
    """제목 줄 찾기: 줄 머리가 제목으로 시작하는 줄을 먼저, 없으면 제목을 포함한 줄."""
    na = norm(anchor)
    for j in range(start, len(lines)):
        if norm(lines[j]).startswith(na):
            return j
    for j in range(start, len(lines)):
        if na in norm(lines[j]):
            return j
    return None


def main():
    pdfs, reps = {}, {}
    for name in ['chuo', 'hitotsu', 'hosei', 'kansai', 'keio', 'osaka', 'rikkyo', 'todai', 'kyoto_law', 'kyoto_econ']:
        pdfs[name], reps[name] = load_pdf(name)
    result, report = {}, []
    for doc, chap in CONFIG.items():
        d = json.load(open(DATA + doc + '.json'))
        did = d['id']
        result[did] = {}
        tr = {c['id']: c for c in d['translation']}
        assert set(tr) == set(chap), (doc, set(tr) ^ set(chap))
        for sid in [c['id'] for c in d['translation']]:
            c = tr[sid]
            parts, pages_used, notes, problems = [], [], [], []
            for (pdf, sp, sa, ep, ea) in chap[sid]:
                P = pdfs[pdf]
                if (pdf, sp) in IMAGE_PAGES:
                    parts.append(IMAGE_PAGES[(pdf, sp)])
                    pages_used.append((pdf, sp))
                    notes.append(IMAGE_NOTE)
                    continue
                j0 = find_line(P[sp - 1], sa)
                if j0 is None:
                    problems.append(f'시작 제목 못 찾음: PDF{sp} 「{sa}」 → 쪽 전체 사용')
                    j0 = 0
                seg = []
                for pg in range(sp, ep + 1):
                    L = P[pg - 1]
                    a = j0 if pg == sp else 0
                    b = len(L)
                    if pg == ep and ea:
                        jb = find_line(L, ea, a + (1 if pg == sp else 0))
                        if jb is None:
                            problems.append(f'끝 경계 못 찾음: PDF{ep} 「{ea}」 → 쪽 끝까지')
                        else:
                            b = jb
                    if b > a:
                        seg.extend(L[a:b])
                        pages_used.append((pdf, pg))
                    if (pdf, pg) in IMAGE_PAGES and pg != sp:
                        problems.append(f'그림 쪽 PDF{pg} 포함')
                parts.append(join_lines(seg))
            text = '\n\n'.join(p for p in parts if p.strip())
            # 쪽 표시
            pg_nums = sorted({p for _, p in pages_used})
            pdfnames = sorted({n for n, _ in pages_used})
            label = f'PDF {pg_nums[0]}쪽' if len(pg_nums) == 1 else f'PDF {pg_nums[0]}~{pg_nums[-1]}쪽'
            if doc == 'kyoto':
                label = ('법학부 요강 ' if pdfnames == ['kyoto_law'] else '경제학부 요강 ') + label
            if len(text) > LIMIT:
                cut = text[:LIMIT]
                if '\n' in cut[-400:]:  # 줄 중간에서 끊기지 않게 마지막 줄바꿈까지
                    cut = cut[:cut.rindex('\n')]
                # 잘린 지점이 몇 쪽인지: 잘린 끝부분 문자열이 들어 있는 쪽을 찾는다
                tail = norm(cut[-25:])
                cut_pg = None
                for (n, pg) in pages_used:
                    if tail and tail in norm(''.join(pdfs[n][pg - 1])):
                        cut_pg = pg
                if cut_pg is None:  # 못 찾으면 쪽별 누적 길이로 근사
                    acc, cut_pg = 0, pg_nums[-1]
                    for (n, pg) in pages_used:
                        acc += sum(len(x) + 1 for x in pdfs[n][pg - 1])
                        if acc >= LIMIT:
                            cut_pg = pg
                            break
                rest = f'{cut_pg}쪽' if cut_pg == pg_nums[-1] else f'{cut_pg}~{pg_nums[-1]}쪽'
                text = cut.rstrip() + f'\n…(이하 원문 PDF {rest})'
                problems.append(f'1만 자 넘어 자름(이하 PDF {rest})')
            entry = {'pages': label, 'text': text}
            if notes:
                entry['note'] = notes[0]
            result[did][sid] = entry
            # 제목 일치 여부(보고용)
            na = norm(chap[sid][0][2])
            tparts = [norm(x) for x in re.split(r'[・／/]', c['title_ja']) if len(x) >= 2]
            title_hit = any(t in na or na in norm(c['title_ja']) for t in tparts) or norm(c['title_ja']) in na
            if not title_hit:  # 시작 줄은 아니지만 장 안에 제목이 있으면 '제목 위치 다름'
                ntext = norm(text)
                title_hit = 'inside' if any(t in ntext for t in tparts) else False
            report.append((did, sid, c['p'], label, len(text), title_hit, problems, bool(notes)))
            if DEBUG:
                print(f'===== {did} {sid} p{c["p"]} {label} {len(text)}자 title_hit={title_hit} {problems}')
                print(text[:300].replace('\n', ' ⏎ '))
                print('   ...', text[-200:].replace('\n', ' ⏎ '))
    js = ('/* 자동 생성 — 모집요강 일본어 원문(장별). 원문 재배포 금지 · 학원 내부용 */\n'
          '/* 생성: tools/yoko_ja.py — 모집요강 일본어 원문. 학원 밖 공개 금지 */\n'
          'window.YOKO_JA = ' + json.dumps(result, ensure_ascii=False, indent=1) + ';\n')
    open(OUT, 'w', encoding='utf-8').write(js)
    print(f'wrote {OUT} ({len(js):,}자)')
    for r in report:
        did, sid, p, label, n, hit, probs, img = r
        flag = '' if hit is True else (' [제목이 장 첫머리가 아님]' if hit == 'inside' else ' [제목 못 찾음]')
        print(f'{did:12} {sid} p={p:<3} {label:22} {n:6}자{flag}{" [그림 표 옮겨 적음]" if img else ""} {"; ".join(probs)}')
    if DEBUG:
        for k, v in reps.items():
            print('repeated', k, sorted(v)[:10])


if __name__ == '__main__':
    main()
