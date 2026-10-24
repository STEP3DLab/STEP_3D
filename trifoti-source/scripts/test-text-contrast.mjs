import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const variables=Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*(#[\da-f]{3,6})\b/gi)].map(m=>[m[1],m[2]]));
function declarations(selector,{last=false}={}) {
 const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const matches=[...css.matchAll(new RegExp(`(?:^|[{}\\s])${escaped}\\{([^{}]*)\\}`,'g'))];
 assert(matches.length,`Missing CSS rule: ${selector}`);
 return Object.fromEntries((last?matches.at(-1):matches[0])[1].split(';').filter(Boolean).map(x=>{const i=x.indexOf(':');return [x.slice(0,i).trim(),x.slice(i+1).trim()];}));
}
function resolve(value) {
 return value.replace(/var\((--[\w-]+)\)/g,(_,key)=>{assert(variables[key],key);return variables[key];});
}
function luminance(hex) {
 const full=hex.length===4?'#'+[...hex.slice(1)].map(c=>c+c).join(''):hex;
 assert.match(full,/^#[\da-f]{6}$/i);
 const linear=[1,3,5].map(i=>parseInt(full.slice(i,i+2),16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
 return linear.reduce((n,c,i)=>n+c*[0.2126,0.7152,0.0722][i],0);
}
function ratio(foreground,background) {
 const values=[luminance(resolve(foreground)),luminance(resolve(background))].sort((a,b)=>a-b);
 return (values[1]+0.05)/(values[0]+0.05);
}
function ordinary(foreground,background,label) {
 const actual=ratio(foreground,background);
 assert(actual>=4.5,`${label}: ${actual}:1 is below 4.5:1`);
}
const paper='var(--paper)';
const card=declarations('.publication-card').background;
const footer=declarations('footer.site-footer').background;

test('Contrast calculations use linearized sRGB and unrounded thresholds',()=>{
 assert.equal(ratio('#000','#fff'),21);assert.equal(ratio('#777','#777'),1);
 assert(ratio('#777773','#ffffff')<4.5); // 4.497… must not round to a pass.
});
for(const [label,background] of [['paper',paper],['editorial card',card],['footer',footer],['hero gradient','#f0ebe4']]) {
 test(`Secondary text exceeds 4.5:1 on ${label}`,()=>ordinary('var(--muted)',background,label));
}
test('Placeholders and the real-sculpture caption use the readable secondary color',()=>{
 const placeholder=declarations('input::placeholder,textarea::placeholder');
 assert.equal(placeholder.color,'var(--muted)');assert.equal(placeholder.opacity,'1');
 assert.equal(declarations('.model-note').color,'var(--muted)');
 ordinary(placeholder.color,paper,'placeholder');
});
test('Small red publication labels pass on their actual card background',()=>{
 const color=declarations('.publication-kind').color;
 assert.equal(color,'var(--red-text)');ordinary(color,card,'publication label');
});
test('Text-link hover colors pass on paper and cards without changing the decorative border',()=>{
 const link=declarations('.text-link:hover');
 assert.equal(link.color,'var(--red-text)');assert.equal(link['border-color'],'var(--red)');
 ordinary(link.color,paper,'text link');ordinary(link.color,card,'card text link');
});
test('Footer and catalogue hover text pass on their actual backgrounds',()=>{
 ordinary(declarations('.site-footer a:hover').color,footer,'footer hover');
 ordinary(declarations('.publication-entry h4 a:hover').color,paper,'catalogue hover');
});
test('Ordinary-size mobile service headings use readable red; large desktop headings retain brand red',()=>{
 assert.equal(declarations('.service-list details[open] h3').color,'var(--red)');
 const mobile=declarations('.service-list details[open] h3',{last:true});
 assert.equal(mobile.color,'var(--red-text)');ordinary(mobile.color,paper,'mobile service heading');
 assert(css.includes('@media(max-width:800px){.service-list details[open] h3{color:var(--red-text)}}'));
});
test('Existing dark panels, success and error feedback already retain sufficient text contrast',()=>{
 const ink='var(--ink)';
 ordinary(declarations('.process .section-aside').color,ink,'process aside');
 ordinary(declarations('.process-grid p').color,ink,'process copy');
 ordinary(declarations('#brief-status').color,paper,'success');
 ordinary(declarations('#brief-draft-status[data-state="error"],#brief-status[data-state="error"]').color,paper,'error');
});
test('Brand red, white button text, large headings and decorative team numerals are unchanged',()=>{
 assert.equal(variables['--red'],'#e71931');assert.equal(variables['--paper'],'#f5f3ee');
 assert.equal(variables['--ink'],'#20201e');assert.equal(variables['--line'],'#d8d6d0');
 assert.equal(declarations('.red').color,'var(--red)');
 assert.equal(declarations('.button').background,'var(--red)');
 assert.equal(declarations('.button').color,'white');
 ordinary('#fff','var(--red)','white button text');
 assert.equal(declarations('.team-index').opacity,'.65');
 assert.equal((html.match(/class="team-index" aria-hidden="true"/g)||[]).length,4);
});
test('Stylesheet and application retain explicit cache version URLs',()=>{
 assert.match(html,/style\.css\?v=[^\"]+/);
 assert.match(html,/app\.js\?v=[^\"]+/);
});

test('Original photo action passes in normal, visited, hover, focus and active states',()=>{
 const normal=declarations('.gallery-photo-link').color;
 assert.equal(normal,'var(--red-text)');ordinary(normal,paper,'photo action');
 const states=declarations('.gallery-photo-link:hover,.gallery-photo-link:focus-visible,.gallery-photo-link:active,.gallery-photo-link:visited').color;
 assert.equal(states,normal);ordinary(states,paper,'photo action states');
 ordinary(declarations('.gallery-photo-link span').color,paper,'new tab hint');
});

test('Fedor role inherits accessible white on its actual red accent card',()=>{
 const accent=declarations('.team-card-accent');
 assert.equal(declarations('.team-card-accent .team-person p').color,'inherit');
 assert.equal(accent.color,'white');
 ordinary('#ffffff',accent.background,'Fedor small role text');
 ordinary('#ffffff',accent.background,'Fedor source link');
 assert(ratio('#ffffff',accent.background)>4.58);
 assert.match(html,/<h3>Фёдор<\/h3><p>Скульптор<\/p>/);
});
