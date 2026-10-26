"""Optional regeneration: Pillow + ffprobe. Does not modify the original assets."""
from pathlib import Path
from PIL import Image
import hashlib, json, subprocess
root = Path(__file__).resolve().parents[1]
items = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {projects} from './dist/project-data.js';console.log(JSON.stringify(Object.values(projects).flatMap(p=>p.media)))"
], cwd=root, text=True))
entries = {}
for item in items:
    for src in [item['src']] + ([item['poster']] if 'poster' in item else []):
        path = root / 'dist' / src
        if path.suffix == '.mp4':
            data = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', str(path)], text=True))['streams'][0]
            width, height = data['width'], data['height']
        else:
            with Image.open(path) as image:
                width, height = image.size
        entries[src] = {'width': width, 'height': height, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
(root / 'scripts/media-dimensions.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n')
print(f'Measured {len(entries)} original media assets.')
