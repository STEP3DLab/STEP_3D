import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repository = path.dirname(source);
if (!fs.existsSync(path.join(repository, '.git')) || !fs.existsSync(path.join(repository, 'docs'))) {
  throw new Error('Run this script from the root trifoti-blue folder of the STEP_3D checkout.');
}
const destination = path.join(repository, 'docs', 'trifoti-blue');
fs.cpSync(source, destination, {recursive:true});
console.log('Synced trifoti-blue to docs/trifoti-blue for GitHub Pages.');
