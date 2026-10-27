#!/usr/bin/env python3
"""모집요강 PDF 폴더 → 텍스트 파일 (맥에서 한 번 돌린다).

폴더 안(하위 폴더 포함)의 모든 PDF 를 읽어, PDF 하나당 텍스트 파일 하나로 저장한다.
  <출력>/<PDF 상대 경로>.txt   쪽마다 「=== p.N ===」 표시가 들어간다 (N = PDF 쪽 번호)
  <출력>/_목록.txt             파일별 쪽 수·글자 수, 글자가 거의 없는 쪽(스캔 이미지라 OCR 이 필요한 쪽) 요약

- 글자 추출은 pypdfium2. 줄은 PDF 글자 순서대로 읽는다 (yoko_ja.py 와 같은 기본 방식).
  글자 순서가 뒤섞인 PDF 면 --pos 로 글자 좌표를 보고 줄을 다시 짠다.
- 글자가 거의 없는 쪽(그림으로만 된 표·스캔)은 텍스트가 비므로 목록에 따로 적는다. 그런 쪽은 이미지로 읽어야 한다.
- 이름·점수 같은 개인 정보는 없지만 모집요강은 학원 정리 자료이므로 저장소에 올리지 않는다(출력은 저장소 밖에 둔다).

사용: python3 tools/pdf_to_text.py <PDF 폴더> [<출력 폴더>] [--pos] [--min 30]
  출력 폴더를 안 주면 <PDF 폴더 이름>_텍스트 로 현재 폴더에 만든다.
  필요: pip install pypdfium2
"""
import argparse
import re
import sys
import unicodedata
from pathlib import Path

import pypdfium2 as pdfium


def nfc(s):
    return unicodedata.normalize("NFC", str(s))


def lines_stream(page):
    """PDF 글자 순서대로 (pdfium 이 줄바꿈을 넣어 준다)"""
    tp = page.get_textpage()
    txt = tp.get_text_range()
    return [re.sub(r'[-]', '・', ln.rstrip()) for ln in txt.replace('\r', '').split('\n')]


def lines_pos(page):
    """글자 좌표로 같은 높이의 글자를 한 줄로 묶어 위→아래로 (순서가 뒤섞인 PDF 용). 줄 안에서는 PDF 글자 순서를 따른다."""
    tp = page.get_textpage()
    chars = []
    for i in range(tp.count_chars()):
        c = tp.get_text_range(i, 1)
        if not c or c.isspace() or c in '￾\x00':
            continue
        l, b, r, t = tp.get_charbox(i, loose=True)
        if r - l <= 0 and t - b <= 0:
            continue
        chars.append((i, c, l, b, r, t))
    chars.sort(key=lambda x: (-(x[3] + x[5]) / 2, x[2]))
    lines = []
    for ch in chars:
        cy, h = (ch[3] + ch[5]) / 2, max(ch[5] - ch[3], 1)
        for ln in lines[-8:]:
            if abs(ln['cy'] - cy) < 0.5 * max(ln['h'], h):
                ln['ch'].append(ch)
                break
        else:
            lines.append({'cy': cy, 'h': h, 'ch': [ch]})
    lines.sort(key=lambda L: -L['cy'])
    out = []
    for L in lines:
        H, runs = L['h'], []
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
        out.append(re.sub(r'[-]', '・', s.rstrip()))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src', help='PDF 가 든 폴더 (하위 폴더 포함)')
    ap.add_argument('out', nargs='?', help='텍스트를 저장할 폴더')
    ap.add_argument('--pos', action='store_true', help='글자 좌표로 줄을 다시 짠다 (순서가 뒤섞인 PDF)')
    ap.add_argument('--min', type=int, default=30, help='이 글자 수보다 적은 쪽은 「글자 거의 없음(스캔·그림일 수 있음)」으로 적는다')
    a = ap.parse_args()
    src = Path(a.src).expanduser()
    if not src.is_dir():
        sys.exit(f'폴더가 없습니다: {src}')
    out = Path(a.out).expanduser() if a.out else Path.cwd() / f'{nfc(src.name)}_텍스트'
    out.mkdir(parents=True, exist_ok=True)
    pdfs = sorted(p for p in src.rglob('*') if p.suffix.lower() == '.pdf' and not p.name.startswith('.'))
    if not pdfs:
        sys.exit(f'PDF 가 없습니다: {src}')
    summary = []
    for n, p in enumerate(pdfs, 1):
        rel = nfc(p.relative_to(src).with_suffix(''))
        dst = out / (rel + '.txt')
        dst.parent.mkdir(parents=True, exist_ok=True)
        try:
            pdf = pdfium.PdfDocument(str(p))
        except Exception as e:   # 암호화·손상
            print(f'[{n}/{len(pdfs)}] 열 수 없음: {rel} ({e})')
            summary.append(f'{rel}\t열 수 없음 ({e})')
            continue
        parts, empty, total = [], [], 0
        for i in range(len(pdf)):
            try:
                lines = (lines_pos if a.pos else lines_stream)(pdf[i])
            except Exception as e:
                lines = []
                print(f'   {rel} p.{i + 1}: 읽기 실패 ({e})')
            body = '\n'.join(lines).strip()
            cnt = len(re.sub(r'\s', '', body))
            total += cnt
            if cnt < a.min:
                empty.append(i + 1)
            parts.append(f'=== p.{i + 1} ===\n{body}\n')
        dst.write_text('\n'.join(parts), encoding='utf-8')
        note = f'  글자 거의 없는 쪽(스캔·그림일 수 있음) {len(empty)}개: {",".join(map(str, empty[:30]))}{"…" if len(empty) > 30 else ""}' if empty else ''
        print(f'[{n}/{len(pdfs)}] {rel}: {len(pdf)}쪽 · {total:,}자{note}')
        summary.append(f'{rel}\t{len(pdf)}쪽\t{total}자' + (f'\t글자 거의 없는 쪽: {",".join(map(str, empty))}' if empty else ''))
    (out / '_목록.txt').write_text('\n'.join(summary) + '\n', encoding='utf-8')
    print(f'\n완료: PDF {len(pdfs)}개 → {out}')
    print('이 폴더(또는 압축한 zip)를 Claude 대화에 첨부해 주세요.')


if __name__ == '__main__':
    main()
