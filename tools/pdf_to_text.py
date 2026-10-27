#!/usr/bin/env python3
"""모집요강 PDF 전체 → 쪽별 일본어 텍스트 (.work/yoko_txt/).

- 폴더(하위 폴더 포함)의 모든 PDF를 읽어 파일마다 <이름>.txt 로 저장한다. 쪽 머리는 「=== p.N ===」.
- 글자 층이 거의 없는 쪽(스캔·그림 표)은 「[글자 없음 — 눈으로 옮겨야 함]」으로 표시하고 index.json 의 image_pages 에 모은다.
- PNG/JPG 는 글자를 뽑을 수 없으므로 index.json 의 images 에만 적는다.
- 글자 순서가 뒤섞이는 PDF 는 --pos (글자 좌표로 줄을 다시 짬; yoko_ja.page_lines).
- 한글 파일명은 NFD 라서 NFC 로 바꿔 저장한다.

실행: python3 tools/pdf_to_text.py --src <모집요강 폴더> [--out .work/yoko_txt] [--pos] [--only 부분문자열]
  필요: pip install pypdfium2
"""
import argparse, json, os, sys, unicodedata
from pathlib import Path
import pypdfium2 as pdfium

sys.path.insert(0, str(Path(__file__).resolve().parent))
ROOT = Path(__file__).resolve().parent.parent
MIN_CHARS = 30  # 이보다 적으면 글자 층이 없는 쪽으로 본다


def lines_of(page, pos):
    # yoko_ja 는 import 때 sys.argv 를 읽으므로 필요할 때만 가져온다
    import re
    if pos:
        import yoko_ja
        return yoko_ja.page_lines(page)
    t = page.get_textpage().get_text_range()
    out = []
    for s in re.split(r'\r\n|\r|\n', t):
        s = re.sub(r'[-]', '・', s).strip()
        if s:
            out.append(s)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True)
    ap.add_argument('--out', default=str(ROOT / '.work' / 'yoko_txt'))
    ap.add_argument('--pos', action='store_true')
    ap.add_argument('--only')
    a = ap.parse_args()
    src, out = Path(os.path.expanduser(a.src)), Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    index = {'files': [], 'images': []}
    for r, _, fs in sorted(os.walk(src)):
        for f in sorted(fs):
            if f.startswith('.'):
                continue
            nf = unicodedata.normalize('NFC', f)
            rel = unicodedata.normalize('NFC', os.path.relpath(os.path.join(r, f), src))
            if a.only and a.only not in rel:
                continue
            p = os.path.join(r, f)
            if not f.lower().endswith('.pdf'):
                index['images'].append(rel)
                continue
            try:
                pdf = pdfium.PdfDocument(p)
            except Exception as e:  # iCloud 미다운로드·손상
                index['files'].append({'file': rel, 'error': str(e)})
                print('실패', rel, e)
                continue
            body, img_pages, nchar = [], [], 0
            for i in range(len(pdf)):
                ls = lines_of(pdf[i], a.pos)
                n = sum(len(x) for x in ls)
                nchar += n
                if n < MIN_CHARS:
                    img_pages.append(i + 1)
                    ls = (ls or []) + ['[글자 없음 — 눈으로 옮겨야 함]']
                body.append(f'=== p.{i + 1} ===\n' + '\n'.join(ls))
            name = nf[:-4] + '.txt'
            (out / name.replace('/', '__')).write_text(f'# {rel}\n' + '\n\n'.join(body) + '\n', encoding='utf-8')
            index['files'].append({'file': rel, 'txt': name, 'pages': len(pdf), 'chars': nchar, 'image_pages': img_pages})
            print(f'{len(pdf):4d}쪽 {nchar:7d}자 글자없음 {len(img_pages):3d}쪽  {rel}')
    (out / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"완료: PDF {len(index['files'])}건, 이미지 {len(index['images'])}건 → {out}")


if __name__ == '__main__':
    main()
