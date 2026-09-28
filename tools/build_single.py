"""Bouwt één los HTML-bestand (alles inline) uit index.html, css/ en js/.
Gebruik:  python3 tools/build_single.py [uitvoer.html] [--fragment]
--fragment laat doctype/html/head/body weg (voor platforms die zelf een pagina-skelet toevoegen)."""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'css/style.css').read_text(encoding='utf-8')
src = src.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')
def inline(m):
    return '<script>\n' + (root / m.group(1)).read_text(encoding='utf-8') + '\n</script>'
src = re.sub(r'<script src="(js/[^"]+)"></script>', inline, src)
args = [a for a in sys.argv[1:] if not a.startswith('--')]
out = pathlib.Path(args[0]) if args else root / 'dist/marinier-selectietrainer.html'
if '--fragment' in sys.argv:
    head = re.search(r'<head>(.*)</head>', src, re.S).group(1)
    head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', '', head)
    body = re.search(r'<body>(.*)</body>', src, re.S).group(1)
    src = head.strip() + '\n' + body.strip() + '\n'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(src, encoding='utf-8')
print(f'Geschreven: {out} ({len(src)//1024} KB)')
