from pathlib import Path
import re,shutil

def apply(target):
    source=Path(__file__).parent
    p=target/'index.html';h=p.read_text()
    a=h.index('<div class="contact-layout">');b=h.index('<form id="brief-form"',a)
    h=h[:a]+(source/'contact.html').read_text()+h[b:]
    h=re.sub(r'<div class="brief-intro">.*?</div>',lambda m:(source/'intro.html').read_text(),h,count=1,flags=re.S)
    h=re.sub(r'<div class="brief-next-step".*?</div>','',h,flags=re.S)
    h=h.replace('<p id="brief-status"',(source/'brief-next.html').read_text()+'<p id="brief-status"',1)
    css='<link rel="stylesheet" href="customer-start.css?v=20261118-start">'
    if css not in h:h=h.replace('</head>',css+'\n</head>')
    h=h.replace('style.css?v=20261104-red7','style.css?v=20261118-modal-scroll')
    p.write_text(h)
    for p in (target/'cases').glob('*.html'):
        h=p.read_text();block=(source/'case-next.html').read_text().replace('{key}',p.stem)
        if 'class="case-next-step"' in h:h=re.sub(r'<section class="case-next-step".*?</section>',lambda m:block,h,flags=re.S)
        else:h=re.sub(r'<div class="resource-actions case-enquiry-action">.*?</div>',lambda m:block,h,count=1,flags=re.S)
        css='<link rel="stylesheet" href="../case-next-step.css?v=20261118">'
        if css not in h:h=h.replace('</head>',css+'\n</head>')
        p.write_text(h)
    for name in ['customer-start.css','case-next-step.css']:shutil.copyfile(source/name,target/name)
