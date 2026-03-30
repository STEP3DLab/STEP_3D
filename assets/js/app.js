const REQUIRED_DATA_FIELDS = ['id', 'title', 'description', 'tags', 'cta', 'chip', 'hero-text'];

function validateDataStructure(data, name) {
  if (!Array.isArray(data)) {
    console.error(`[${name}] ожидается массив данных.`);
    return false;
  }

  const ids = new Set();
  let isValid = true;

  data.forEach((item, index) => {
    const missing = REQUIRED_DATA_FIELDS.filter((field) => item[field] === undefined || item[field] === null || item[field] === '');
    if (missing.length) {
      console.error(`[${name}] элемент #${index} пропущены поля: ${missing.join(', ')}`, item);
      isValid = false;
    }

    if (ids.has(item.id)) {
      console.error(`[${name}] найден дублирующийся id: "${item.id}"`, item);
      isValid = false;
    }
    ids.add(item.id);
  });

  return isValid;
}

const services = Object.fromEntries((window.servicesData || []).map((item) => [item.id, item]));
const faqItems = window.faqData || [];
const cases = window.casesData || [];

const caseFilters = [
  { id: 'all', label: 'Все' },
  { id: 'print', label: '3D-печать' },
  { id: 'modeling', label: 'Моделирование' },
  { id: 'scan', label: 'Сканирование' },
  { id: 'reverse', label: 'Реверс' }
];

let selectedService = 'print';
let selectedProject = 'case1';
let selectedFilter = 'all';

function createPills(items) {
  return items.map(item => `<span class="px-3 py-2 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white/70">${item}</span>`).join('');
}

function renderServices(data, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = data.map((service, index) => `
    <button class="service-card glass p-7 sm:p-8 rounded-[30px] bento-card reveal ${service.id === selectedService ? 'active' : ''} text-left" data-service="${service.id}" ${index ? `style="transition-delay:${(index * 0.06).toFixed(2)}s"` : ''}>
      <div class="service-active-badge mb-5 inline-flex rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">Выбрано</div>
      <div class="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 mb-6">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${service.icon || ''}</svg>
      </div>
      <h3 class="text-2xl font-bold mb-3">${service.title}</h3>
      <p class="text-slate-300 text-sm leading-relaxed mb-4">${service.description}</p>
      <div class="flex flex-wrap gap-2 text-xs font-bold text-slate-100">${createPills(service.tags)}</div>
    </button>
  `).join('');
}

function renderFaq(data, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = data.map((item, index) => `
    <details class="glass rounded-[28px] p-6 sm:p-8 reveal group cursor-pointer" ${index ? `style="transition-delay:${(index * 0.05).toFixed(2)}s"` : ''}>
      <summary class="flex justify-between items-center gap-4 font-bold text-lg sm:text-xl list-none">
        ${item.title}
        <svg class="w-6 h-6 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </summary>
      <p class="mt-5 text-slate-200 leading-relaxed">${item.description}</p>
    </details>
  `).join('');
}

function renderQuickServiceButtons(data, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML = data.map((service) => `
    <button class="chip service-quick rounded-2xl border border-white/12 px-4 py-4 text-left ${service.id === selectedService ? 'active' : ''}" data-service="${service.id}">
      <span class="block font-bold">${service.title}</span>
      <span class="text-slate-200 text-xs">${service.description}</span>
    </button>
  `).join('');
}

function renderServiceContent(key) {
  const data = services[key];
  if (!data) return;
  document.getElementById('service-panel-title').textContent = data.title;
  document.getElementById('service-panel-badge').textContent = data.badge;
  document.getElementById('service-panel-text').textContent = data.text;
  document.getElementById('service-panel-list').innerHTML = (data.points || []).map(point => `<div class="rounded-2xl border border-white/12 bg-white/[0.02] p-4 text-sm font-medium">${point}</div>`).join('');
  document.getElementById('service-panel-inputs').innerHTML = createPills(data.panelInputs || []);
  document.getElementById('hero-card-title').textContent = data.title;
  document.getElementById('hero-card-text').textContent = data['hero-text'];
  document.getElementById('hero-card-chip').textContent = data.chip;
  document.getElementById('hero-card-points').innerHTML = createPills(data.inputs || []);
  document.querySelectorAll('.service-card').forEach(card => card.classList.toggle('active', card.dataset.service === key));
  document.querySelectorAll('.service-quick').forEach(btn => btn.classList.toggle('active', btn.dataset.service === key));
  document.querySelectorAll('.brief-service-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.service === key));
}

function renderBriefServices() {
  const container = document.getElementById('brief-services');
  container.innerHTML = Object.entries(services).map(([key, value]) => `
    <button type="button" class="brief-service-btn text-left rounded-2xl border border-white/12 px-4 py-4 transition ${key === selectedService ? 'active bg-white text-black' : 'glass hover:bg-white/12'}" data-service="${key}">
      <span class="block font-bold">${value.title}</span>
      <span class="text-sm ${key === selectedService ? 'text-black/70' : 'text-slate-200'}">${value.points[0]}</span>
    </button>
  `).join('');
  container.querySelectorAll('.brief-service-btn').forEach(btn => btn.addEventListener('click', () => {
    selectedService = btn.dataset.service;
    renderBriefServices();
    renderServiceContent(selectedService);
  }));
}

function renderCaseFilters() { /* unchanged */
  const container = document.getElementById('case-filters');
  container.innerHTML = caseFilters.map(filter => `
    <button type="button" class="case-filter px-4 py-2 rounded-full border text-xs font-bold transition ${selectedFilter === filter.id ? 'bg-white text-black border-white' : 'glass text-slate-100 border-white/12 hover:bg-white/12'}" data-filter="${filter.id}">${filter.label}</button>
  `).join('');
  container.querySelectorAll('.case-filter').forEach(btn => btn.addEventListener('click', () => {
    selectedFilter = btn.dataset.filter;
    renderCaseFilters();
    renderCases();
  }));
}

function renderCaseDetail() {
  const item = cases.find(c => c.id === selectedProject) || cases[0];
  document.getElementById('case-detail').innerHTML = `
    <div class="text-[10px] mono text-blue-400 mb-3 uppercase tracking-[0.32em]">${item.categoryLabel}</div>
    <h3 class="text-3xl font-black mb-4 tracking-tight">${item.title}</h3>
    <p class="text-slate-200 leading-relaxed mb-6">${item.detail}</p>
    <div class="flex flex-wrap gap-2 mb-8">${createPills(item.chips)}</div>
    <a href="#brief" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold transition">Перейти к заявке <span aria-hidden="true">→</span></a>
  `;
}

function renderCases() {
  const grid = document.getElementById('case-grid');
  const filtered = selectedFilter === 'all' ? cases : cases.filter(item => item.category === selectedFilter);
  if (!filtered.some(item => item.id === selectedProject)) selectedProject = filtered[0]?.id || cases[0].id;
  grid.innerHTML = filtered.map((item) => `
    <button type="button" class="case-card text-left glass rounded-[30px] p-6 sm:p-7 bento-card ${selectedProject === item.id ? 'border-blue-500/40 bg-blue-500/[0.05]' : ''}" data-case="${item.id}">
      <div class="text-[10px] mono text-blue-400 mb-3 uppercase tracking-[0.3em]">${item.categoryLabel}</div>
      <h3 class="text-2xl font-bold mb-3">${item.title}</h3>
      <p class="text-slate-300 text-sm leading-relaxed mb-5">${item.excerpt}</p>
      <div class="flex flex-wrap gap-2">${createPills(item.chips)}</div>
    </button>
  `).join('');
  grid.querySelectorAll('.case-card').forEach(card => card.addEventListener('click', () => {
    selectedProject = card.dataset.case;
    renderCases();
  }));
  renderCaseDetail();
}

function updateScrollProgress() { const winScroll = document.body.scrollTop || document.documentElement.scrollTop; const height = document.documentElement.scrollHeight - document.documentElement.clientHeight; const scrolled = height > 0 ? (winScroll / height) * 100 : 0; document.getElementById('scroll-progress').style.width = `${scrolled}%`; }
function revealOnScroll() { document.querySelectorAll('.reveal').forEach(el => { if (el.getBoundingClientRect().top < window.innerHeight - 50) el.classList.add('active'); }); }
function initMobileMenu() { const nav = document.getElementById('mobile-nav'); document.getElementById('menu-open').onclick = () => nav.classList.remove('translate-x-full'); document.getElementById('menu-close').onclick = () => nav.classList.add('translate-x-full'); document.querySelectorAll('.mob-link').forEach(link => link.onclick = () => nav.classList.add('translate-x-full')); }

function initServiceInteractions() {
  document.querySelectorAll('.service-card, .service-quick').forEach(item => {
    item.addEventListener('click', () => {
      selectedService = item.dataset.service;
      renderServiceContent(selectedService);
      renderBriefServices();
    });
  });
}

function updateBriefSummary() { const wrap = document.getElementById('brief-summary'); if (!wrap) return; const deadline = document.getElementById('brief-deadline')?.value || 'Обычный'; const quantity = document.getElementById('brief-quantity')?.value || '1-3'; const files = document.getElementById('brief-file')?.files?.length || 0; wrap.innerHTML = [services[selectedService].title, `Срок: ${deadline}`, `Количество: ${quantity}`, files ? `Файлов: ${files}` : 'Без файлов'].map(item => `<span class="summary-chip inline-flex rounded-full px-3 py-2 text-sm font-semibold">${item}</span>`).join(''); }
function showToast(message) { const toast = document.getElementById('toast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast._t); showToast._t = setTimeout(() => toast.classList.remove('show'), 2400); }

function initForms() {
  const step1 = document.getElementById('brief-step-1'); const step2 = document.getElementById('brief-step-2'); const stepIndicator1 = document.getElementById('step-indicator-1'); const stepIndicator2 = document.getElementById('step-indicator-2');
  document.getElementById('to-step-2').addEventListener('click', () => { updateBriefSummary(); step1.classList.add('hidden'); step2.classList.remove('hidden'); stepIndicator1.className = 'px-3 py-2 rounded-full glass'; stepIndicator2.className = 'px-3 py-2 rounded-full bg-white text-black'; step2.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  document.getElementById('back-step-1').addEventListener('click', () => { step2.classList.add('hidden'); step1.classList.remove('hidden'); stepIndicator1.className = 'px-3 py-2 rounded-full bg-white text-black'; stepIndicator2.className = 'px-3 py-2 rounded-full glass'; });
  const fileInput = document.getElementById('brief-file'); const dropZone = document.getElementById('drop-zone'); const fileList = document.getElementById('file-list');
  function updateFileList(files) { if (!files || !files.length) { fileList.textContent = ''; updateBriefSummary(); return; } fileList.innerHTML = Array.from(files).map(file => `<div>${file.name}</div>`).join(''); updateBriefSummary(); }
  fileInput.addEventListener('change', () => updateFileList(fileInput.files)); ['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.add('dragover'); })); ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.remove('dragover'); }));
  dropZone.addEventListener('drop', e => { const files = e.dataTransfer.files; if (files && files.length) { fileInput.files = files; updateFileList(files); } });
  document.getElementById('brief-form').addEventListener('submit', e => { e.preventDefault(); updateBriefSummary(); const name = document.getElementById('brief-name').value.trim(); const contact = document.getElementById('brief-contact').value.trim(); const comment = document.getElementById('brief-comment').value.trim(); const deadline = document.getElementById('brief-deadline').value; const quantity = document.getElementById('brief-quantity').value; const files = Array.from(fileInput.files || []).map(f => f.name).join(', ') || 'Файлы будут приложены отдельно'; const subject = encodeURIComponent(`Задача на расчет Step3D — ${services[selectedService].title}`); const body = encodeURIComponent([`Направление: ${services[selectedService].title}`, `Срок: ${deadline}`, `Количество: ${quantity}`, `Имя: ${name}`, `Контакт: ${contact}`, `Комментарий: ${comment || 'Без комментария'}`, `Файлы: ${files}`, '', 'Файлы можно приложить к письму вручную или отправить в Telegram: @step_3d_mngr'].join('\n')); showToast('Открываем письмо для отправки'); window.location.href = `mailto:projects.step3d@gmail.com?subject=${subject}&body=${body}`; });
  document.getElementById('contact-form').addEventListener('submit', e => { e.preventDefault(); const name = document.getElementById('contact-name').value.trim(); const contact = document.getElementById('contact-value').value.trim(); const msg = document.getElementById('contact-message').value.trim(); const subject = encodeURIComponent('Быстрый запрос Step3D'); const body = encodeURIComponent([`Имя: ${name}`, `Контакт: ${contact}`, `Комментарий: ${msg || 'Без комментария'}`].join('\n')); showToast('Открываем письмо для отправки'); window.location.href = `mailto:projects.step3d@gmail.com?subject=${subject}&body=${body}`; });
  ['brief-deadline', 'brief-quantity', 'brief-name', 'brief-contact'].forEach(id => document.getElementById(id)?.addEventListener('change', updateBriefSummary));
}

function initGallery() { /* unchanged */
  const track = document.getElementById('gallery-track'); const prev = document.getElementById('gallery-prev'); const next = document.getElementById('gallery-next'); const dotsWrap = document.getElementById('gallery-dots'); if (!track || !prev || !next || !dotsWrap) return;
  const slides = Array.from(track.children); const perPage = () => (window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1);
  const slideStep = () => { const first = slides[0]; if (!first) return track.clientWidth; const styles = getComputedStyle(track); const gap = parseFloat(styles.gap || styles.columnGap || 16); return first.getBoundingClientRect().width + gap; };
  function updateDots() { const dots = Array.from(dotsWrap.children); const index = Math.min(dots.length - 1, Math.round(track.scrollLeft / (slideStep() * perPage()))); dots.forEach((dot, i) => dot.classList.toggle('active', i === index)); }
  function buildDots() { const count = Math.max(1, Math.ceil(slides.length / perPage())); dotsWrap.innerHTML = ''; for (let i = 0; i < count; i += 1) { const dot = document.createElement('button'); dot.type = 'button'; dot.className = 'gallery-dot rounded-full border border-white/12 px-3 py-1.5 text-xs font-bold transition'; dot.textContent = i + 1; dot.addEventListener('click', () => { track.scrollTo({ left: i * slideStep() * perPage(), behavior: 'smooth' }); }); dotsWrap.appendChild(dot); } updateDots(); }
  prev.addEventListener('click', () => track.scrollBy({ left: -(slideStep() * perPage()), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: slideStep() * perPage(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateDots, { passive: true }); window.addEventListener('resize', buildDots); buildDots();
}

function initHeroScene() { const container = document.getElementById('hero-canvas'); if (!container || typeof THREE === 'undefined') return; let mouseX = 0; let mouseY = 0; document.addEventListener('mousemove', e => { mouseX = (e.clientX - window.innerWidth / 2) / 100; mouseY = (e.clientY - window.innerHeight / 2) / 100; }); const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000); const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); renderer.setSize(container.clientWidth, container.clientHeight); container.appendChild(renderer.domElement); const group = new THREE.Group(); scene.add(group); const geo = new THREE.IcosahedronGeometry(10, 1); const mat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.06 }); group.add(new THREE.Mesh(geo, mat)); const pGeo = new THREE.BufferGeometry(); const count = 1600; const pos = new Float32Array(count * 3); for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 60; pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const pMat = new THREE.PointsMaterial({ size: 0.06, color: 0x3b82f6, transparent: true, opacity: 0.35 }); group.add(new THREE.Points(pGeo, pMat)); camera.position.z = 25; function animate() { requestAnimationFrame(animate); group.rotation.y += 0.0012; group.rotation.x += (mouseY * 0.004 - group.rotation.x) * 0.08; group.rotation.y += (mouseX * 0.004 - group.rotation.y) * 0.08; renderer.render(scene, camera); } animate(); window.addEventListener('resize', () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); }); }

function initHeaderUX() { const header = document.getElementById('site-header'); const toTop = document.getElementById('to-top'); const sections = Array.from(document.querySelectorAll('section[id]')); const links = Array.from(document.querySelectorAll('.nav-link')); function onScroll() { const y = window.scrollY || document.documentElement.scrollTop; header?.classList.toggle('scrolled', y > 16); toTop?.classList.toggle('show', y > 700); let current = sections[0]?.id; sections.forEach(section => { const top = section.offsetTop - 140; if (y >= top) current = section.id; }); links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`)); } window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })); }

window.addEventListener('scroll', () => { updateScrollProgress(); revealOnScroll(); });
window.addEventListener('load', () => {
  const servicesValid = validateDataStructure(window.servicesData, 'servicesData');
  const faqValid = validateDataStructure(window.faqData, 'faqData');
  if (!servicesValid || !faqValid) {
    console.error('Инициализация остановлена: исправьте структуру данных в assets/data/*.js');
    return;
  }

  renderQuickServiceButtons(window.servicesData, '#quick-services');
  renderServices(window.servicesData, '#services-list');
  renderFaq(window.faqData, '#faq-list');
  renderBriefServices();
  renderServiceContent(selectedService);
  renderCaseFilters();
  renderCases();
  initMobileMenu();
  initServiceInteractions();
  initForms();
  initGallery();
  initHeaderUX();
  updateBriefSummary();
  updateScrollProgress();
  revealOnScroll();
  initHeroScene();
});
