"""Rebuild small portfolio previews. Requires Python Pillow and Node; no network."""
from pathlib import Path
import json
import subprocess
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
projects = json.loads(subprocess.check_output(
    ['node', '--input-type=module', '-e', "import {projects} from './dist/project-data.js'; console.log(JSON.stringify(projects))"],
    cwd=ROOT, text=True))
source_bytes = preview_bytes = count = 0
for project in projects.values():
    for item in project['media']:
        source = item.get('poster', item['src'])
        target = source.replace('assets/projects/', 'assets/previews/').rsplit('.', 1)[0] + '-thumb.webp'
        path = ROOT / 'dist' / target
        path.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(ROOT / 'dist' / source) as original:
            # Single-frame lightweight posters and new photos retain the whole frame.
            # Existing multi-frame WebP thumbnails keep their established rendering.
            preview = (ImageOps.pad(original.convert('RGB'), (180, 200), Image.Resampling.LANCZOS, color='black') if len(project['media']) < 2 or source.endswith('.jpg') else ImageOps.fit(original.convert('RGB'), (180, 200), Image.Resampling.LANCZOS))
            preview.save(path, 'WEBP', quality=82, method=6)
        source_bytes += (ROOT / 'dist' / source).stat().st_size
        preview_bytes += path.stat().st_size
        count += 1
print(f'{count} previews: {source_bytes:,} → {preview_bytes:,} bytes; originals unchanged.')
