import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const app=read('app.js'),html=read('index.html');
test('Integrated exploration retains a single progressive menu and portfolio controller',()=>{
 assert.equal((html.match(/src="header-navigation\.js/g)||[]).length,1);
 assert.equal((app.match(/initializePortfolioFilters\(\{document,window\}\)/g)||[]).length,1);
 assert.doesNotMatch(app,/function setMenuOpen|function selectProjectFilter/);
 assert.match(app,/initializeBriefExperience\(\{form,document,window/);
 assert.match(app,/initializeBackToTop\(\{document,window\}\)/);
});
test('Integrated gallery preserves dataset links, fixed context and reference-to-brief flow',()=>{
 assert.match(app,/caseNavigation\.open\(link\.dataset\.caseLink\)/);
 assert.match(app,/projectOpener\?\.dataset\.caseLink===galleryProject/);
 assert.match(app,/projectOpener\?\.closest\('\.exploration-panel'\)/);
 assert.match(app,/project-dialog-context/);
 assert.match(app,/caseNavigation\.visit\('#brief-form'\)/);
 assert.match(app,/button\.append\(label,title\)/);
 assert.match(app,/shareURL\.value!==value/);
});
test('Restoration teaser does not invent before-after chronology',()=>{
 assert.match(html,/Сохранившийся объект, детали утраты и ракурсы скульптурной модели\./);
 assert.doesNotMatch(html,/Состояние до работ, цифровая модель и результат восстановления\./);
});

test('Actual frame-share handler copies current frame and ignores a superseded clipboard result',async()=>{
 const {default:vm}=await import('node:vm');
 const {copyProjectLink}=await import('../dist/project-navigation.js');
 const handler=app.split('\n').find(line=>line.trim().startsWith("shareButton.addEventListener('click'"));
 let click,resolveCopy;const copied=[];
 const shareButton={isConnected:true,addEventListener(_,fn){click=fn}};
 const shareURL={value:'https://step3dlab.github.io/STEP_3D/trifoti/#project/mascot/media/red-head',focus(){},select(){}};
 const shareStatus={textContent:''},shareFallback={hidden:true},projectDialog={open:true};
 const navigator={clipboard:{writeText(value){copied.push(value);return new Promise(resolve=>resolveCopy=resolve)}}};
 vm.runInNewContext(handler,{shareButton,shareURL,shareStatus,shareFallback,projectDialog,navigator,copyProjectLink});
 const first=click();assert.equal(copied[0],shareURL.value);resolveCopy();await first;assert.equal(shareStatus.textContent,'Ссылка скопирована.');
 shareStatus.textContent='';const second=click();shareURL.value=shareURL.value.replace('red-head','white-side');resolveCopy();await second;assert.equal(shareStatus.textContent,'');
 const third=click();assert.equal(copied[2],shareURL.value);resolveCopy();await third;assert.equal(shareStatus.textContent,'Ссылка скопирована.');
});
