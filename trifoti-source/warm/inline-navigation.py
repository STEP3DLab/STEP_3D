"""Inline the small header controller before first content paint, from one source."""
from pathlib import Path
import re

MARKER = '<!-- warm-header-navigation:start -->'
END = '<!-- warm-header-navigation:end -->'

def render(controller):
    # Keep the standalone ES module as the canonical implementation.
    expected = 'export function initializeHeaderNavigation'
    if controller.count(expected) != 1 or '</script' in controller.lower():
        raise ValueError('Unexpected header navigation source')
    classic = controller.replace(expected, 'function initializeHeaderNavigation', 1)
    if re.search(r'^\s*(?:import|export)\b', classic, re.M):
        raise ValueError('Unsupported module syntax in header navigation')
    return MARKER + '\n<script>\n(() => {\n"use strict";\n' + classic.rstrip() + '\n})();\n</script>\n' + END

def apply(target):
    target = Path(target)
    page = target / 'index.html'
    html = page.read_text()
    if html.count(MARKER) > 1 or html.count(MARKER) != html.count(END):
        raise ValueError('Unexpected inline navigation markers')
    if MARKER in html and html.index(MARKER) > html.index(END):
        raise ValueError('Reversed inline navigation markers')
    block = render((target / 'header-navigation.js').read_text())
    html = re.sub(r'\n?' + re.escape(MARKER) + r'[\s\S]*?' + re.escape(END), '', html)
    html, removed = re.subn(r'''<script\b[^>]*\bsrc\s*=\s*(["'])(?:\./)?header-navigation\.js(?:\?[^"']*)?\1[^>]*>\s*</script>\n?''', '', html)
    if re.search(r'<script\b[^>]*\bsrc\s*=\s*[^>]*header-navigation\.js', html):
        raise ValueError('Unrecognized external header navigation script')
    if removed > 1 or html.count('<header class="header">') != 1:
        raise ValueError('Unexpected homepage header structure')
    # Synchronous, after its DOM exists and before main content is parsed.
    start = html.index('<header class="header">')
    end = html.index('</header>', start) + len('</header>')
    if html.count('<main id="main">') != 1 or html.index('<main id="main">') < end:
        raise ValueError('Expected main content after the header')
    html = html[:end] + '\n' + block + html[end:]
    if html.count(MARKER) != 1 or html.count(END) != 1:
        raise ValueError('Expected exactly one generated controller')
    page.write_text(html)

if __name__ == '__main__':
    import shutil
    root = Path(__file__).resolve().parents[2]
    apply(root / 'trifoti/warm')
    shutil.copyfile(root / 'trifoti/warm/index.html', root / 'docs/trifoti/warm/index.html')
