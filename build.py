#!/usr/bin/env python3
"""Tiny static build: injects shared head/footer and responsive <img> tags into src/*.html -> site/."""
import re, time, pathlib
from PIL import Image
ROOT = pathlib.Path(__file__).parent; SRC = ROOT/'src'; OUT = ROOT/'site'
head = (SRC/'_head.html').read_text(); foot = (SRC/'_foot.html').read_text()
V = time.strftime('%Y%m%d%H%M')
def img(m):
    name, alt, sizes, *rest = m.group(1).split('|')
    eager = rest and rest[0] == 'eager'
    w, h = Image.open(OUT/f'img/{name}-720.webp').size
    w2 = Image.open(OUT/f'img/{name}-1400.webp').size[0]
    attrs = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return (f'<img src="img/{name}-720.webp" srcset="img/{name}-720.webp {w}w, img/{name}-1400.webp {w2}w" '
            f'sizes="{sizes}" width="{w}" height="{h}" alt="{alt}" {attrs}>')
for f in SRC.glob('[!_]*.html'):
    txt = f.read_text()
    fm, body = re.match(r'---\n(.*?)\n---\n(.*)', txt, re.S).groups()
    meta = dict(l.split(': ', 1) for l in fm.splitlines())
    h = head.replace('{{title}}', meta['title']).replace('{{desc}}', meta['desc']).replace('{{v}}', V)
    for k in ('story', 'shop', 'business', 'order'):
        h = h.replace('{{cur_%s}}' % k, 'aria-current="page"' if meta.get('cur') == k else '')
    body = re.sub(r'\{\{img:(.*?)\}\}', img, body)
    (OUT/f.name).write_text(h + body + foot.replace('{{v}}', V))
    print('built', f.name)
