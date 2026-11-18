import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {projects} from '../../trifoti/warm/project-data.js';
import {thumbnailSource} from '../../trifoti/warm/media-utils.js';
test('Every warm gallery frame resolves to an existing preview or original photo',()=>{
 for(const project of Object.values(projects).filter(p=>p.media.length>1))for(const item of project.media){
  const source=thumbnailSource(item);assert(source.startsWith('/STEP_3D/trifoti/'));
  assert(existsSync(new URL('../../'+source.slice('/STEP_3D/'.length),import.meta.url)),source);
  if(item.type==='video')assert.notEqual(source,item.src);
 }
});
test('RED7 uses its real photos rather than nonexistent derivatives',()=>{
 for(const item of projects['red7-panels'].media)assert.equal(thumbnailSource(item),item.poster||item.src);
});
test('Published mirrors retain the same thumbnail resolver',()=>{
 assert.deepEqual(readFileSync(new URL('../../trifoti/warm/media-utils.js',import.meta.url)),readFileSync(new URL('../../docs/trifoti/warm/media-utils.js',import.meta.url)));
});
