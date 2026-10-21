import * as THREE from 'three';
import {RoomEnvironment} from './assets/vendor/RoomEnvironment.js';

const stage=document.getElementById('bear-stage');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
renderer.domElement.setAttribute('aria-label','3D-медведь — перетащите мышью или используйте стрелки для вращения');renderer.domElement.setAttribute('tabindex','0');
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(32,1,.1,60);
camera.position.set(0,2.3,8.8);camera.lookAt(0,1.88,0);
const env=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(env,.045).texture;env.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xffffff,0xb6a58e,2));
const key=new THREE.DirectionalLight(0xffffff,3.5);key.position.set(-3,5,5);scene.add(key);
const rim=new THREE.DirectionalLight(0xffffff,2.5);rim.position.set(4,4,-3);scene.add(rim);
const red=new THREE.MeshPhysicalMaterial({color:0xde0826,metalness:.26,roughness:.18,clearcoat:1,clearcoatRoughness:.13,envMapIntensity:1.15});
const ivory=new THREE.MeshPhysicalMaterial({color:0xf5f0e5,metalness:.04,roughness:.21,clearcoat:1,clearcoatRoughness:.16,envMapIntensity:.9});
const black=new THREE.MeshPhysicalMaterial({color:0x11110f,metalness:.1,roughness:.13,clearcoat:1});
const bear=new THREE.Group();scene.add(bear);bear.rotation.y=-.38;
const sphere=new THREE.SphereGeometry(1,64,48);
function oval(position,scale,material){const mesh=new THREE.Mesh(sphere,material);mesh.position.set(...position);mesh.scale.set(...scale);bear.add(mesh);return mesh}
oval([0,1.28,0],[.94,1.03,.69],red);
oval([0,1.24,.31],[.79,.93,.49],ivory);
for(const x of [-1,1]){const arm=oval([x*.815,1.39,.015],[.175,.70,.26],red);arm.rotation.z=x*.11;oval([x*.44,.25,.12],[.37,.235,.46],red);}
// A smooth shoulder panel follows the original cape-like division of materials.
const capePositions=[],capeIndices=[];const segments=96,rings=20;
for(let j=0;j<=rings;j++){const t=j/rings;const radius=.44+.47*Math.sin(t*Math.PI/2);for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;const y=2.34-.39*t+.07*Math.cos(a*2)*t;capePositions.push(Math.cos(a)*radius,y,Math.sin(a)*radius*.77);if(j<rings&&i<segments){const n=j*(segments+1)+i;capeIndices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2)}}}
const capeGeo=new THREE.BufferGeometry();capeGeo.setAttribute('position',new THREE.Float32BufferAttribute(capePositions,3));capeGeo.setIndex(capeIndices);capeGeo.computeVertexNormals();const cape=new THREE.Mesh(capeGeo,ivory);cape.material=ivory.clone();cape.material.side=THREE.DoubleSide;bear.add(cape);
const response=await fetch('./assets/bear-head.bin');if(!response.ok)throw new Error('Bear geometry missing');const data=new Float32Array(await response.arrayBuffer());const half=data.length/2;const headGeo=new THREE.BufferGeometry();headGeo.setAttribute('position',new THREE.BufferAttribute(data.subarray(0,half),3));headGeo.setAttribute('normal',new THREE.BufferAttribute(data.subarray(half),3));const head=new THREE.Mesh(headGeo,red);bear.add(head);
const nose=oval([0,2.69,.815],[.135,.095,.09],black);nose.rotation.x=-.12;
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const context=shadowCanvas.getContext('2d');const gradient=context.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'rgba(50,38,27,.32)');gradient.addColorStop(.4,'rgba(50,38,27,.18)');gradient.addColorStop(1,'rgba(50,38,27,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;scene.add(shadow);
stage.append(renderer.domElement);document.getElementById('bear-fallback').classList.add('loaded');stage.dataset.renderer='webgl';
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=w/h<.8?10:8.8;camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(stage);resize();
let spin=!matchMedia('(prefers-reduced-motion: reduce)').matches,dragging=false,lastX=0,hasDragged=false,visible=true,lastTime=0;
const toggle=document.getElementById('rotate-toggle');function updateSpin(){toggle.textContent=spin?'Ⅱ':'▷';toggle.setAttribute('aria-label',spin?'Приостановить вращение':'Включить вращение');toggle.setAttribute('aria-pressed',String(spin))}updateSpin();
toggle.addEventListener('click',()=>{spin=!spin;updateSpin()});
document.getElementById('bear-reset').addEventListener('click',()=>{bear.rotation.set(0,-.38,0);spin=false;updateSpin()});
stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.isPrimary){lastX=e.clientX;dragging=true;hasDragged=false;stage.setPointerCapture(e.pointerId);stage.classList.add('dragging')}});
stage.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX;if(Math.abs(dx)>2)hasDragged=true;if(hasDragged){spin=false;updateSpin();bear.rotation.y+=dx*.009}lastX=e.clientX});
function end(){dragging=false;stage.classList.remove('dragging')}stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
renderer.domElement.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();bear.rotation.y+=e.key==='ArrowLeft'?-.15:.15;spin=false;updateSpin()}});
document.querySelectorAll('[data-palette]').forEach(button=>button.addEventListener('click',()=>{const palette=button.dataset.palette;const color={red:0xde0826,white:0xf5f0e5,dark:0x30302f}[palette];red.color.setHex(color);ivory.color.setHex(palette==='white'?0xe1122d:0xf5f0e5);cape.material.color.copy(ivory.color);document.querySelectorAll('[data-palette]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))})}));
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{rootMargin:'100px'}).observe(stage);
function render(time){requestAnimationFrame(render);const dt=Math.min((time-lastTime)/1000,.04);lastTime=time;if(document.hidden||!visible)return;if(spin&&!dragging)bear.rotation.y+=dt*.22;renderer.render(scene,camera)}requestAnimationFrame(render);
renderer.domElement.addEventListener('webglcontextlost',()=>{document.getElementById('bear-fallback').classList.remove('loaded');renderer.domElement.style.display='none';stage.dataset.renderer='fallback';document.querySelector('.model-note').textContent='Изображение маскота';toggle.disabled=true;document.getElementById('bear-reset').disabled=true;document.querySelectorAll('[data-palette]').forEach(b=>b.disabled=true)},false);
