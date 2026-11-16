import re, os, json

SRC = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = SRC + '../'

def rd(p):
    return open(SRC + p, encoding='utf-8').read()

AS = json.load(open(SRC + 'assets.json'))
BASE = AS['base']

def u(k):
    return BASE + AS[k]

# ---- LQIP 内联（极小，直接进 assets.json 占位） ----
for i in range(1, 5):
    AS[f'g{i}lq'] = 'data:image/webp;base64,' + rd(f'lq/g{i}-lq.b64').strip()

old = rd('poster-src.html')
css = re.search(r'<style>(.*?)</style>', old, re.S).group(1)
poster = re.search(r'(<section class="poster">.*?</section>)', old, re.S).group(1)
poster = re.sub(r'<div class="topbar">.*?</div>\s*(?=<div class="poster-body">)', '', poster, flags=re.S)
marquee = re.search(r'(<div class="marquee".*?</div>\s*</div>\s*</div>)', old, re.S).group(1)
main = re.search(r'<main id="main">(.*?)</main>', old, re.S).group(1)
home = ('<section class="page on" data-page="home">\n' + poster + '\n' + marquee + '\n'
        + main + '\n' + rd('spark.html') + '\n</section>')

shell = rd('shell.html')

def strip_tags(h):
    return re.sub(r'<[^>]+>', ' ', h).replace('&quot;', '"').replace('&mdash;', '—').replace('&amp;', '&')

def squeeze(t):
    return ' '.join(t.split())

sidx = []
for m in re.finditer(r'<article class="post" data-slug="([^"]+)" data-tags="[^"]*">(.*?)</article>', shell, re.S):
    slug, blk = m.group(1), m.group(2)
    tt = re.search(r'class="post-tt">(.*?)</h2>', blk, re.S)
    bd = re.search(r'class="post-bd-in">(.*?)<div class="post-tags">', blk, re.S)
    sidx.append({'k': '笔记', 'p': 'journal', 's': slug,
                 't': squeeze(strip_tags(tt.group(1))) if tt else '',
                 'b': squeeze(strip_tags(bd.group(1))) if bd else ''})
for m in re.finditer(r'<article class="talk"[^>]*>(.*?)</article>', shell, re.S):
    sidx.append({'k': '说说', 'p': 'talks', 's': '', 't': '说说', 'b': squeeze(strip_tags(m.group(1)))})
for m in re.finditer(r'<li data-rv>(?:<span class="bdg[^"]*">[^<]*</span>)?<span class="vno">([^<]*)</span><p>(.*?)</p></li>', shell, re.S):
    sidx.append({'k': '日志', 'p': 'log', 's': '', 't': '日志 ' + squeeze(strip_tags(m.group(1))),
                 'b': squeeze(strip_tags(m.group(2)))})

giscus = json.load(open(SRC + 'giscus.json'))
shell = (shell.replace('__SINDEX__', json.dumps(sidx, ensure_ascii=False))
              .replace('__GISCUS__', json.dumps(giscus, ensure_ascii=False))
              .replace('__CSS_BASE__', css)
              .replace('__LENIS__', rd('lenis.min.js'))
              .replace('__HOME__', home)
              .replace('__SHOTS__', 'https://liu233jh.github.io/nebula-site/shots')
              .replace('__JS__', rd('app.js')))

for i in range(1, 5):
    shell = shell.replace(f'__G{i}__', u(f'g{i}'))
    shell = shell.replace(f'__G{i}LQ__', AS[f'g{i}lq'])
shell = (shell.replace('data:audio/mp3;base64,__MUSIC2__', u('music2'))
              .replace('data:audio/mp3;base64,__MUSIC__', u('music')))

figA = ('<figure class="art" aria-hidden="true"><div class="fbody">'
        f'<img class="fbase" src="{u("full")}" alt="">'
        f'<img class="eopen" src="{u("eopen")}" alt="">'
        f'<img class="eclosed" src="{u("eclosed")}" alt="">'
        '</div></figure>')

ART = '<figure class="art" aria-hidden="true"><img src="__ART__" alt="" decoding="async"></figure>'

figB = ('<div class="pup" aria-hidden="true"><div class="pbody">'
        f'<img class="pbase" src="{u("pbase")}" alt="">'
        f'<img class="eopen" src="{u("eopen")}" alt="">'
        f'<img class="eclosed" src="{u("eclosed")}" alt="">'
        f'<div class="pbangs"><img src="{u("bangs")}" alt=""></div>'
        f'<img class="pleft" src="{u("pleft")}" alt="">'
        f'<div class="rtop"><img src="{u("rtop")}" alt="">'
        f'<img class="rbot" src="{u("rbot")}" alt=""></div>'
        '</div></div>')

A = shell.replace(ART, figA)
B = shell.replace(ART, figB)
assert '__ART__' not in B, 'B版人物未替换'

os.makedirs(OUT + 'a', exist_ok=True)
os.makedirs(OUT + 'b', exist_ok=True)
open(OUT + 'a/index.html', 'w', encoding='utf-8').write(A)
open(OUT + 'b/index.html', 'w', encoding='utf-8').write(B)

# 据点页截图：src/shots/*.b64 -> 仓库根 shots/*.webp
import base64, glob
os.makedirs(OUT + 'shots', exist_ok=True)
for b64 in sorted(glob.glob(SRC + 'shots/*.b64')):
    name = os.path.basename(b64)[:-4]
    open(OUT + 'shots/' + name, 'wb').write(base64.b64decode(open(b64, encoding='ascii').read()))
    print('shot', name)

print('A', os.path.getsize(OUT + 'a/index.html') // 1024, 'KB')
print('B', os.path.getsize(OUT + 'b/index.html') // 1024, 'KB')
