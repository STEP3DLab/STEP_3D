from pathlib import Path
import re,shutil
root=Path(__file__).resolve().parents[2]
preview=root/'trifoti-source/preview';dist=preview/'dist';dist.mkdir(parents=True,exist_ok=True)
(preview/'.openai').mkdir(exist_ok=True);(preview/'.openai/hosting.json').write_text('{"static":{"directory":"dist"}}')
scripts=root/'trifoti-source/scripts'
for source,target in [('warm-navigation-qa.html','index.html'),('warm-navigation-qa-worker.js','worker.js'),('warm-navigation-qa-observer.js','observer.js')]:shutil.copyfile(scripts/source,dist/target)
shutil.copyfile(root/'trifoti/warm/header-navigation.js',dist/'header-source.js')
original=(root/'trifoti/warm/index.html').read_text()
for version in ('current','fixed'):
    source=preview/'index-original.html' if version=='current' else root/'trifoti/warm/index.html'
    html=source.read_text() if source.exists() else original
    for mode in ('delay','block','normal','nojs','inline-blocked'):
        page=html.replace('<head>','<head><base href="https://step3dlab.github.io/STEP_3D/trifoti/warm/">')
        page=page.replace('src="header-navigation.js?v=20261104-red7"', 'src="http://127.0.0.1:4173/header-navigation.js?'+{'delay':'delay=3500','block':'block=1','normal':'delay=0','nojs':'block=1','inline-blocked':'delay=3500'}[mode]+'"')
        if mode=='nojs':page=re.sub(r'<script\b[^>]*>[\s\S]*?</script>','',page)
        # In the failure case, fail every external page script; the QA observer
        # is inserted afterward so that it can still measure the native fallback.
        if mode=='block':page=re.sub(r'(<script\b[^>]*\bsrc=)"[^"]+"',r'\1"http://127.0.0.1:4173/header-navigation.js?block=1"',page)
        if mode=='inline-blocked':page=page.replace('<head>', '<head><meta http-equiv="Content-Security-Policy" content="script-src \'self\' https://step3dlab.github.io">')
        page=page.replace('<head>','<head><script src="http://127.0.0.1:4173/observer.js"></script>')
        (dist/f'{version}-{mode}.html').write_text(page)
