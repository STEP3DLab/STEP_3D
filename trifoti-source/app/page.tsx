"use client";

import { SiteFooter } from "./components/SiteFooter";
import { StudioProcess } from "./components/StudioProcess";
import { ObjectBrief } from "./components/ObjectBrief";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Brand } from "./components/Brand";
import { caseStudies } from "./case-data";
import { getProjectRoute, portfolioOrder, projectFilters, sortPortfolio, STAGE_REQUEST_TYPE } from "./project-routing";
import { DirectBrief } from "./components/DirectBrief";
import { STATIC_EXPORT, siteUrl } from "./site-config";



import { materialLinkError, requestDetails, responseHours, responseNextStep } from "./request-copy";
import { company } from "./legal-data";
import { RequestReceipt } from "./components/RequestReceipt";
import { readAcquisition } from "./acquisition";

const MANAGER_URL = "https://t.me/step_3d_mngr";
const FILE_ACCEPT = ".stl,.step,.stp,.obj,.3mf,.dxf,.dwg,.pdf,.png,.jpg,.jpeg,.webp,.zip";
const FILE_EXTENSIONS = new Set(FILE_ACCEPT.split(",").map((extension) => extension.slice(1)));
const FILE_FORMATS_LABEL = "STL, STEP, STP, OBJ, 3MF, DXF, DWG, PDF, PNG, JPG, WEBP или ZIP";
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const contactFields = {
  Telegram: { label: "Telegram", type: "text", inputMode: "text", autoComplete: "off", placeholder: "Например, @username" },
  Телефон: { label: "Номер телефона", type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+7 999 000-00-00" },
  "E-mail": { label: "E-mail", type: "email", inputMode: "email", autoComplete: "email", placeholder: "name@company.ru" },
} as const;

type ContactMethod = keyof typeof contactFields;

const contactMethods = Object.keys(contactFields) as ContactMethod[];
const emptyContactValues: Record<ContactMethod, string> = {
  Telegram: "",
  Телефон: "",
  "E-mail": "",
};

const creativeChoices = [
  { value: "Скульптура / арт-объект", short: "Скульптура" },
  { value: "Декор / инсталляция", short: "Интерьерный объект" },
  { value: "Кубок / награда", short: "Кубок или награда" },
  { value: STAGE_REQUEST_TYPE, short: "Сцена и костюм" },
  { value: "Другое", short: "Помогите с идеей" },
];
const technicalChoices = [
  { value: "Реплика / миниатюра", short: "Реплика или макет" },
  { value: "3D-моделирование / подготовка модели", short: "3D-моделирование" },
  { value: "3D-печать по готовой модели", short: "3D-печать" },
  { value: "Промышленный дизайн / прототип", short: "Прототип изделия" },
  { value: "3D-сканирование / реверсивный инжиниринг", short: "3D-сканирование" },
  { value: "AR/VR-приложение", short: "AR/VR" },
];
const projectChoices = [...creativeChoices, ...technicalChoices];
const projectPrompts: Record<string, readonly string[]> = {
  "Скульптура / арт-объект": ["Образ и настроение", "Размер и место установки", "Материал или желаемая фактура"],
  "Декор / инсталляция": ["Фото или план пространства", "Размер и способ крепления", "Цвет, свет и фактура"],
  "Кубок / награда": ["Повод и характер награды", "Количество и персонализация", "Дата церемонии и упаковка"],
  [STAGE_REQUEST_TYPE]: ["Образ, движение и примерка", "Габариты, вес и крепления", "Дата события и перевозка"],
  "Другое": ["Для кого и зачем нужен объект", "Что уже придумано", "Какой результат хотите получить"],
};
const projectExamples: Record<string, string> = {
  [STAGE_REQUEST_TYPE]: "Например: нужен сценический объект к премьере, есть эскиз и размеры; важны небольшой вес и удобное крепление",
  "3D-моделирование / подготовка модели": "Например: нужна производственная 3D-модель корпуса по эскизу и ключевым размерам",
  "3D-печать по готовой модели": "Например: есть STEP-модель корпуса, нужен один образец с обработкой поверхности",
  "Скульптура / арт-объект": "Например: нужна скульптура высотой 80 см по эскизу для выставочного пространства",
  "Кубок / награда": "Например: нужна серия из 10 наград высотой 30 см для корпоративной премии",
  "Декор / инсталляция": "Например: нужно интерьерное панно по фирменной графике с монтажом на объекте",
  "Реплика / миниатюра": "Например: нужно оцифровать предмет и изготовить уменьшенную серию копий",
  "Промышленный дизайн / прототип": "Например: нужен прототип корпуса устройства для проверки компоновки и эргономики",
  "3D-сканирование / реверсивный инжиниринг": "Например: нужно отсканировать деталь и восстановить редактируемую CAD-модель",
  "AR/VR-приложение": "Например: нужен интерактивный 3D-прототип для демонстрации проекта на планшете",
  "Другое": "Коротко опишите задачу, назначение результата, размеры, количество и желаемый срок",
};
const caseFilters = projectFilters;

const signatureServices = [
  { index: "01", slug: "sculptures", title: "Скульптура и арт-объекты", text: "Авторская пластика, анималистические формы и рельефы. Развиваем художественный образ, готовим модель и продумываем изготовление в нужном масштабе.", tags: ["Авторская форма", "Малая и крупная пластика"], type: "Скульптура / арт-объект" },
  { index: "02", slug: "decor-installations", title: "Объекты для интерьера", text: "Панно, пространственные композиции и акцентные объекты. Работаем с архитектурой места, масштабом, фактурой и способом крепления.", tags: ["Панно и рельефы", "Инсталляции"], type: "Декор / инсталляция" },
  { index: "03", slug: "awards", title: "Награды с характером", text: "Индивидуальная форма для события, бренда или человека. От идеи и образца до серии с персонализацией.", tags: ["Кубки", "Авторские статуэтки"], type: "Кубок / награда" },
  { index: "04", slug: "stage-objects", title: "Сцена и костюм", text: "Сложные формы для сценических образов, выставок и бренд-пространств. Соединяем выразительность с продуманной конструкцией.", tags: ["Реквизит", "Сценические объекты"], type: STAGE_REQUEST_TYPE },
];
const heroProjects = [
  { image: "/images/cases/sakharov-art/ring-installed.webp", slug: "sakharov-art", name: "Ритм в пространстве", category: "Интерьерные панно", alt: "Реальное синее рельефное панно, установленное в общественном интерьере на проспекте Сахарова", position: "center 46%" },
  { image: "/images/pletneva-costume.webp", slug: "pletneva-costume", name: "Форма для сцены", category: "Костюм Анны Плетнёвой", alt: "Сценический костюм Анны Плетнёвой, проект команды Step3D", position: "center 42%" },
  { image: "/images/cases/parshin-sculptures/animal-finished.webp", slug: "parshin-sculptures", name: "Живая пластика", category: "Скульптуры Фёдора Паршина", alt: "Фёдор Паршин рядом с готовой скульптурой оленя", position: "center 50%" },
];
const cases = sortPortfolio(caseStudies).map(item => {
  const route = getProjectRoute(item.slug);
  return {
    slug: item.slug, title: item.title, image: item.image,
    width: item.imageWidth, height: item.imageHeight, alt: item.imageAlt,
    position: item.imagePosition, category: route.filter, type: route.requestType,
    badge: item.slug === "red7-art" ? "Проектная разработка" : undefined,
  };
});

const formats = [
  { number: "A", title: "Единичный объект", text: "Для подарка, интерьера, сцены или выставки. Поможем пройти путь от образа до полностью готового изделия.", points: ["дизайн и 3D-модель", "печать и сборка", "ручная отделка"] },
  { number: "B", title: "Серия или тираж", text: "Для наград, сувениров и коллекций. Сначала утверждаем образец, затем обеспечиваем повторяемость серии.", points: ["пробный образец", "оптимизация себестоимости", "персонализация и упаковка"] },
  { number: "C", title: "Для организаций", text: "Работаем с агентствами, музеями, архитекторами и компаниями. Готовим КП, договор и закрывающие документы.", points: ["КП и договор", "поэтапное согласование", "закрывающие документы"] },
];

const faqs = [
  ["Можно прийти только с идеей?", "Да. Расскажите, для чего нужен объект и какое впечатление он должен создавать. Референс, фотография пространства или эскиз помогут начать разговор. Готовая 3D-модель не нужна."],
  ["Вы делаете дизайн или изготовление?", "Можем пройти весь путь от художественной идеи до готового объекта или подключиться на отдельном этапе. Состав работ фиксируем после обсуждения задачи."],
  ["Как формируется стоимость?", "Учитываем сложность формы, масштаб, технологию, материал, отделку и количество. Доставку и монтаж обсуждаем отдельно. После знакомства с задачей готовим предложение и согласуем стоимость до начала работ."],
  ["Работаете с архитекторами и дизайнерами?", "Да. Можем разработать объект для вашего проекта или помочь воплотить готовую концепцию. Обсуждаем пространство, габариты, крепления и требования к поверхности."],
  ["Можно сделать объект для улицы?", "Уличное размещение обсуждаем на этапе задания: условия среды, устойчивость, крепления и уход влияют на конструкцию и выбор материалов. Возможность реализации оцениваем для конкретного объекта."],
  ["Как добавить материалы к запросу?", STATIC_EXPORT ? "В брифе оставьте ссылку на папку. Эскизы, фотографии, модели и PDF можно приложить к сообщению в Telegram или письму. Конфиденциальные материалы передавайте после согласования порядка работы и NDA." : "В брифе можно прикрепить эскизы, фотографии, модели и PDF или оставить ссылку на папку. Если материалы конфиденциальные, сначала обсудим порядок передачи и NDA."],
];

const origin = "https://trifoti.step3d.chatgpt.site";
const structuredData = [
  { "@context": "https://schema.org", "@type": "ProfessionalService", "@id": `${origin}/#studio`, name: "ТРИФОТИ", url: origin, description: "Креативная студия Фёдора Паршина и Владимира Ганьшина. Скульптуры, арт-объекты, интерьерные решения и авторские награды.", telephone: "+7-995-900-91-41", email: company.email, logo: `${origin}/favicon.svg`, areaServed: "Россия", serviceType: ["Авторская скульптура", "Интерьерные арт-объекты", "Рельефные панно", "Награды и кубки", "Цифровое моделирование и производство"] },
  { "@context": "https://schema.org", "@type": "WebSite", name: "ТРИФОТИ", url: origin, inLanguage: "ru-RU" },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
];

function projectWord(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "проектов";
  if (last === 1) return "проект";
  if (last >= 2 && last <= 4) return "проекта";
  return "проектов";
}

function validateContact(method: ContactMethod, value: string) {
  const contact = value.trim();
  if (contact.length < 3) return `Укажите контакт для связи через ${method.toLowerCase()}.`;
  if (method === "E-mail" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(contact)) return "Проверьте адрес электронной почты.";
  if (method === "Телефон" && (contact.match(/\d/g)?.length ?? 0) < 10) return "Проверьте номер телефона — нужно не менее 10 цифр.";
  return "";
}

function trackEvent(event: string, details: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const analyticsWindow = window as typeof window & { dataLayer?: Array<Record<string, unknown>> };
  analyticsWindow.dataLayer?.push({ event, ...details });
  window.dispatchEvent(new CustomEvent("step3d:conversion", { detail: { event, ...details } }));
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [managerNotified, setManagerNotified] = useState(false);
  const [sending, setSending] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [leadToken, setLeadToken] = useState("");
  const [objectSetup, setObjectSetup] = useState("");
  const [projectReferences, setProjectReferences] = useState<string[]>([]);
  const [preparedMessage, setPreparedMessage] = useState("");
  const [projectType, setProjectType] = useState("Скульптура / арт-объект");
  const [heroIndex, setHeroIndex] = useState(0);
  const heroProject = heroProjects[heroIndex];
  const [budget, setBudget] = useState("Пока не определён");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("Telegram");
  const [contactValues, setContactValues] = useState<Record<ContactMethod, string>>(emptyContactValues);
  const [selectedFormat, setSelectedFormat] = useState("Единичный объект");
  const [caseFilter, setCaseFilter] = useState("Все");
  const [showAllCases, setShowAllCases] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [formStep, setFormStep] = useState(1);
  const [quickRequest, setQuickRequest] = useState(false);
  const [materialsUrl, setMaterialsUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [followUpUrl, setFollowUpUrl] = useState(MANAGER_URL);
  const [emailFollowUpUrl, setEmailFollowUpUrl] = useState("mailto:projects.step3d@gmail.com");
  const [brief, setBrief] = useState({ name: "", details: "", deadline: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0, percent: 0, name: "" });
  const [acquisition, setAcquisition] = useState({ source: "website", utmSource: "", utmMedium: "", utmCampaign: "", referrer: "" });
  const formStartedAt = useRef(0);
  const scrollProgressRef = useRef<HTMLSpanElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const telegramHref = useMemo(() => `${MANAGER_URL}?text=${encodeURIComponent("Здравствуйте! Хочу обсудить проект со студией ТРИФОТИ.")}`, []);
  const filteredCases = useMemo(() => caseFilter === "Все" ? cases : cases.filter((item) => item.category === caseFilter), [caseFilter]);
  const displayedCases = useMemo(() => caseFilter === "Все" && !showAllCases ? filteredCases.slice(0, 4) : filteredCases, [caseFilter, filteredCases, showAllCases]);
  const selectedFilesSize = useMemo(() => files.reduce((total, file) => total + file.size, 0), [files]);
  const contactField = contactFields[contactMethod];
  const contactValue = contactValues[contactMethod];
  const referenceProjects = projectReferences.map(slug => caseStudies.find(item => item.slug === slug)).filter((item): item is (typeof caseStudies)[number] => Boolean(item));
  const referenceLine = referenceProjects.length ? ["Мне близки эти работы из портфолио:", ...referenceProjects.map(item => `${item.title} — ${siteUrl(`/cases/${item.slug}`)}`)].join("\n") : "";
  const projectDescription = [objectSetup, brief.details.trim()].filter(Boolean).join("\n\n");
  const fullDetails = [referenceLine, projectDescription].filter(Boolean).join("\n\n");
  const descriptionLimit = Math.max(800, 1690 - referenceLine.length - objectSetup.length);
  const briefPrompts = projectPrompts[projectType] ?? ["Исходные материалы", "Размеры и количество", "Задача и желаемый срок"];

  useEffect(() => {
    formStartedAt.current = Date.now();
    const params = new URLSearchParams(window.location.search);
    const requestedType = params.get("type");
    const requestedQuick = params.get("mode") === "file";
    const requestedStep = params.get("step");
    const requestedFormat = params.get("format");
    const requestedSlugs = [...new Set((params.get("refs") || params.get("case") || "").split(","))].filter(slug => caseStudies.some(item => item.slug === slug)).slice(0, 3);
    const querySetup = window.setTimeout(() => {
      if (requestedQuick) { setQuickRequest(true); setProjectType("3D-печать по готовой модели"); }
      if (!requestedQuick && requestedType && projectChoices.some((choice) => choice.value === requestedType)) {
        setProjectType(requestedType);
        if (requestedStep === "2") setFormStep(2);
      }
      if (requestedFormat && (requestedFormat === "Уточним вместе" || formats.some((format) => format.title === requestedFormat))) setSelectedFormat(requestedFormat);
      if (requestedSlugs.length && !requestedQuick) {
        setProjectReferences(requestedSlugs);
        setProjectType(getProjectRoute(requestedSlugs[0]).requestType);
        setFormStep(2);
      }
      setAcquisition({ source: params.get("source") || "website", ...readAcquisition() });
    }, 0);
    const onScroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const progress = available > 0 ? Math.min(100, (window.scrollY / available) * 100) : 0;
      if (scrollProgressRef.current) scrollProgressRef.current.style.width = `${progress}%`;
    };
    const sections = ["services", "works", "about", "process", "calculator", "faq", "request"];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id);
    }, { rootMargin: "-25% 0px -60%", threshold: [0, 0.2, 0.5] });
    sections.forEach((id) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.clearTimeout(querySetup); observer.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const navigation = document.getElementById("primary-navigation");
    navigation?.querySelector<HTMLAnchorElement>("a")?.focus();
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
      if (event.key === "Tab") {
        const controls = [...(navigation?.querySelectorAll<HTMLElement>("a[href]") ?? []), menuButtonRef.current].filter((item): item is HTMLElement => Boolean(item));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const desktop = window.matchMedia("(min-width: 1001px)");
    const onDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", onDesktop);
    window.addEventListener("keydown", closeMenu);
    return () => { window.removeEventListener("keydown", closeMenu); desktop.removeEventListener("change", onDesktop); };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [menuOpen]);

  function resetSuccess() {
    if (sending || uploading) return;
    setSent(false); setLeadId(""); setLeadToken(""); setFiles([]); setUploadedFiles([]); setFileError("");
    setMaterialsUrl(""); setObjectSetup(""); setProjectReferences([]); setPreparedMessage(""); setBudget("Пока не определён"); setBrief({ name: "", details: "", deadline: "" });
    formStartedAt.current = Date.now();
  }

  function changeProjectType(type: string) {
    if (type !== projectType) { setObjectSetup(""); setProjectReferences([]); }
    setProjectType(type);
  }

  function startProject(type: string, source: string, skipTypeStep = false, referenceSlug?: string) {
    if (sending || uploading) return;
    if (sent) resetSuccess();
    setMenuOpen(false);
    setQuickRequest(type === "3D-печать по готовой модели" && skipTypeStep);
    changeProjectType(type);
    if (referenceSlug) setProjectReferences([referenceSlug]);
    goToFormStep(skipTypeStep ? 2 : 1);
    setFormError("");
    setAcquisition(current => ({ ...current, source }));
    trackEvent("cta_click", { source, project_type: type });
    scrollToRequest();
  }

  function scrollToRequest() {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("request")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  function chooseFormat(format: string, source: string) {
    setSelectedFormat(format);
    trackEvent("format_select", { source, format });
  }

  function selectFiles(fileList: FileList | null) {
    const incoming = Array.from(fileList ?? []);
    if (!incoming.length) return;
    const availableSlots = Math.max(0, 5 - uploadedFiles.length);
    if (availableSlots === 0) {
      setFiles([]);
      setFileError("К заявке уже прикреплено 5 файлов.");
      return;
    }
    const unsupported = incoming.filter((file) => {
      const extension = file.name.toLowerCase().split(".").pop() ?? "";
      return !FILE_EXTENSIONS.has(extension);
    });
    const oversized = incoming.filter((file) => file.size > MAX_FILE_BYTES);
    const validIncoming = incoming.filter((file) => {
      const extension = file.name.toLowerCase().split(".").pop() ?? "";
      return FILE_EXTENSIONS.has(extension) && file.size > 0 && file.size <= MAX_FILE_BYTES;
    });
    const combined = [...files];
    for (const file of validIncoming) {
      if (!combined.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) combined.push(file);
    }
    setFiles(combined.slice(0, availableSlots));
    const errors: string[] = [];
    if (unsupported.length > 0) errors.push(`Формат файла «${unsupported[0].name}» не поддерживается.`);
    if (oversized.length > 0) errors.push(`Файл «${oversized[0].name}» больше 25 МБ.`);
    if (incoming.some((file) => file.size === 0)) errors.push("Пустой файл загрузить нельзя.");
    const fileWord = availableSlots === 1 ? "файл" : availableSlots < 5 ? "файла" : "файлов";
    if (combined.length > availableSlots) errors.push(`К заявке можно приложить ${availableSlots} ${fileWord}. Ранее выбранные файлы сохранены.`);
    setFileError(errors.join(" "));
  }

  function removeFile(index: number) {
    setFiles((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setFileError("");
  }

  function updateContactValue(value: string) {
    setContactValues((current) => ({ ...current, [contactMethod]: value }));
  }

  function goToFormStep(step: number) {
    const nextStep = Math.max(1, Math.min(3, step));
    setFormError("");
    setFormStep(nextStep);
    window.requestAnimationFrame(() => {
      const targetId = nextStep === 1 ? "project-type-current" : nextStep === 2 ? "project-details" : "contact-name";
      document.getElementById(targetId)?.focus();
    });
  }

  function nextFormStep() {
    if (formStep === 2 && materialLinkError(materialsUrl)) { setFormError(materialLinkError(materialsUrl)); return; }
    if (formStep === 2 && projectDescription.trim().length < 12) {
      setFormError("Добавьте короткое описание задачи — хотя бы 12 символов.");
      window.requestAnimationFrame(() => document.getElementById("project-details")?.focus());
      return;
    }
    goToFormStep(formStep + 1);
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || sent) return;
    if (!quickRequest && formStep !== 3) { nextFormStep(); return; }
    const linkError = materialLinkError(materialsUrl);
    if (linkError) { setFormError(linkError); return; }
    if (quickRequest && !files.length && !materialsUrl.trim()) { setFormError(STATIC_EXPORT ? "Добавьте ссылку на готовую модель. Если хотите приложить файл в переписке, выберите «Описать проект» и укажите это в комментарии." : "Прикрепите модель или добавьте ссылку на файл. Если модели пока нет, выберите «Описать проект»."); return; }
    const submittedName = brief.name.trim() || "Имя не указано";
    const submittedDetails = requestDetails(fullDetails, materialsUrl, files.map(file => file.name), quickRequest);
    const contactError = validateContact(contactMethod, contactValue);
    if (contactError) {
      setFormError(contactError);
      window.requestAnimationFrame(() => document.getElementById("contact-value")?.focus());
      return;
    }
    const message = [
      "Здравствуйте! Хочу получить расчёт проекта ТРИФОТИ.", "", `Тип проекта: ${projectType}`,
      `Формат: ${selectedFormat}`, `Имя / компания: ${submittedName}`, `Контакт: ${contactValue}`, `Удобнее ответить: ${contactMethod}`,
      `Бюджет: ${budget}`, `Желаемый срок: ${brief.deadline || "не указан"}`, `Задача: ${submittedDetails}`, "",
      "Прошу обсудить состав работ и возможность реализации. Стоимость и сроки согласуем отдельно.",
    ].join("\n");
    if (STATIC_EXPORT) {
      setFormError("");
      setPreparedMessage(message);
      setSent(true);
      window.requestAnimationFrame(() => document.getElementById("request-success")?.focus());
      return;
    }
    setSending(true);
    setFormError("");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: submittedName, contact: contactValue, contactMethod, projectType,
          projectFormat: selectedFormat, budget, deadline: brief.deadline,
          details: submittedDetails, source: acquisition.source, companyWebsite,
          utmSource: acquisition.utmSource, utmMedium: acquisition.utmMedium, utmCampaign: acquisition.utmCampaign, referrer: acquisition.referrer,
          startedAt: formStartedAt.current, consent: new FormData(event.currentTarget).get("consent") === "on",
        }),
      });
      const data = await response.json() as { leadId?: string; leadToken?: string; managerNotified?: boolean; error?: string };
      if (!response.ok || !data.leadId || !data.leadToken) throw new Error(data.error || "Не удалось сохранить заявку.");
      setLeadId(data.leadId);
      setLeadToken(data.leadToken);
      setSent(true);
      setManagerNotified(data.managerNotified === true);
      setFollowUpUrl(`${MANAGER_URL}?text=${encodeURIComponent(`${message}\n\nНомер заявки: ${data.leadId}`)}`);
      setEmailFollowUpUrl(`mailto:${company.email}?subject=${encodeURIComponent(`Заявка ${data.leadId} — ТРИФОТИ`)}&body=${encodeURIComponent(`${message}\n\nНомер заявки: ${data.leadId}\nФайлы можно приложить к этому письму.`)}`);
      window.requestAnimationFrame(() => document.getElementById("request-success")?.focus());
      let uploadedNames: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        const uploadResult = await uploadFilesForLead(data.leadId, data.leadToken, files);
        uploadedNames = uploadResult.names;
        setUploadedFiles(uploadResult.names);
        setFiles(uploadResult.failedFiles);
        setFileError(uploadResult.error);
        setUploading(false);
      }
      trackEvent("lead_submit", { project_type: projectType, format: selectedFormat, budget, contact_method: contactMethod });
      if (uploadedNames.length > 0) trackEvent("lead_files_uploaded", { lead_id: data.leadId, file_count: uploadedNames.length });
    } catch (requestError) {
      setFormError(requestError instanceof Error && requestError.name === "TimeoutError" ? "Сервер не ответил вовремя. Проверьте подключение или свяжитесь с менеджером." : requestError instanceof Error && requestError.name === "TypeError" ? "Нет связи с сервером. Данные остаются в форме — проверьте подключение и повторите отправку." : requestError instanceof Error ? requestError.message : "Не удалось сохранить заявку.");
    } finally {
      setSending(false);
    }
  }

  async function uploadFilesForLead(targetLeadId: string, targetToken: string, targetFiles: File[]) {
    const names: string[] = [];
    const failedFiles: File[] = [];
    let error = "";
    let completed = 0;
    setUploadProgress({ completed: 0, total: targetFiles.length, percent: 0, name: "" });
    for (const file of targetFiles) {
      setUploadProgress({ completed, total: targetFiles.length, percent: 0, name: file.name });
      try {
        const formData = new FormData();
        formData.set("leadId", targetLeadId);
        formData.set("token", targetToken);
        formData.set("file", file);
        const data = await new Promise<{ file: { name: string } }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/uploads");
          xhr.timeout = 90000;
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) setUploadProgress({ completed, total: targetFiles.length, percent: Math.round(event.loaded / event.total * 100), name: file.name });
          };
          xhr.onload = () => {
            try {
              const result = JSON.parse(xhr.responseText);
              if (xhr.status < 200 || xhr.status >= 300 || !result.file) throw new Error(result.error || `Не удалось загрузить «${file.name}»`);
              resolve(result);
            } catch (error) { reject(error instanceof Error ? error : new Error("Некорректный ответ сервера.")); }
          };
          xhr.onerror = () => reject(new Error("Соединение прервалось. Заявка сохранена; повторите загрузку файлов."));
          xhr.ontimeout = () => reject(new Error("Загрузка заняла слишком много времени. Заявка сохранена; повторите загрузку файлов."));
          xhr.send(formData);
        });
        names.push(data.file.name);
      } catch (uploadError) {
        failedFiles.push(file);
        if (!error) error = uploadError instanceof Error ? uploadError.message : `Не удалось загрузить «${file.name}»`;
      }
      completed += 1;
      setUploadProgress({ completed, total: targetFiles.length, percent: 0, name: "" });
    }
    if (failedFiles.length > 0 && names.length > 0) error += " Остальные файлы загружены.";
    return { names, failedFiles, error };
  }

  async function uploadFiles() {
    if (!leadId || !leadToken || files.length === 0 || uploading) return;
    setUploading(true); setFileError("");
    try {
      const uploadResult = await uploadFilesForLead(leadId, leadToken, files);
      setUploadedFiles((items) => [...items, ...uploadResult.names]);
      setFiles(uploadResult.failedFiles);
      setFileError(uploadResult.error);
      if (uploadResult.names.length > 0) trackEvent("lead_files_uploaded", { lead_id: leadId, file_count: uploadResult.names.length });
    } catch (uploadError) { setFileError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить файлы."); }
    finally { setUploading(false); }
  }

  return (
    <div id="top" className="tri-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <a className="skip-link" href="#content">Перейти к содержанию</a>
      <header className="topbar tri-topbar">
        <div className="scroll-progress" aria-hidden="true"><span ref={scrollProgressRef} /></div>
        <Brand href="#top" />
        <nav id="primary-navigation" className={menuOpen ? "nav open" : "nav"} aria-label="Основная навигация">
          {[{ id: "works", text: "Проекты" }, { id: "about", text: "Студия" }, { id: "services", text: "Направления" }, { id: "process", text: "Подход" }].map(link => <a key={link.id} className={activeSection === link.id ? "active" : ""} href={`#${link.id}`} aria-current={activeSection === link.id ? "location" : undefined} onClick={() => setMenuOpen(false)}>{link.text}</a>)}
          <a className="tri-nav-mobile" href="#request" onClick={() => setMenuOpen(false)}>Обсудить идею ↗</a>
        </nav>
        <button className="header-cta" type="button" onClick={() => startProject(projectType, "header")}>Обсудить идею <span>↗</span></button>
        <button ref={menuButtonRef} className={menuOpen ? "menu-button open" : "menu-button"} type="button" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-controls="primary-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><span /><span /></button>
      </header>
      {menuOpen && <button className="menu-scrim" type="button" aria-label="Закрыть меню" onClick={() => { setMenuOpen(false); menuButtonRef.current?.focus(); }} />}
      <main id="content" tabIndex={-1}>
        <section className="tri-hero" aria-labelledby="hero-title">
          <div className="tri-hero-copy">
            <p className="tri-eyebrow"><span className="tri-dot" /> Креативная студия · Москва</p>
            <h1 id="hero-title">Форма.<br /><span>С характером.</span></h1>
            <p className="tri-hero-lead">Скульптура, арт-объекты и интерьерные решения. Авторский взгляд и точное производство — в одной студии.</p>
            <div className="tri-hero-actions"><a className="tri-button" href="#works">Смотреть проекты <span>↘</span></a><button className="tri-text-link" type="button" onClick={() => startProject(projectType, "hero")}>Обсудить идею <span>↗</span></button></div>
            <div className="tri-hero-signature"><span>Фёдор Паршин<br />Владимир Ганьшин</span><span>Искусство ×<br />технологии</span></div>
          </div>
          <div className="tri-hero-visual">
            <Link className="tri-hero-image" href={`/cases/${heroProject.slug}`} aria-label={`Открыть проект: ${heroProject.category}`}><img key={heroProject.image} src={heroProject.image} alt={heroProject.alt} width={1152} height={1536} decoding="async" fetchPriority="high" style={{objectPosition: heroProject.position}} /><span className="tri-image-open" aria-hidden="true">↗</span></Link>
            <div className="tri-hero-caption"><div aria-live="polite"><span>{heroProject.category}</span><strong>{heroProject.name}</strong></div><div className="tri-hero-controls"><span>0{heroIndex + 1}<i> / 03</i></span><button type="button" aria-label="Предыдущий проект" onClick={() => setHeroIndex((heroIndex + 2) % 3)}>←</button><button type="button" aria-label="Следующий проект" onClick={() => setHeroIndex((heroIndex + 1) % 3)}>→</button></div></div>
          </div>
        </section>
        <div className="tri-disciplines" aria-label="Направления студии"><span>Скульптура</span><i>✳</i><span>Предмет</span><i>✳</i><span>Пространство</span><i>✳</i><span>Цифровое производство</span></div>

        <section className="tri-works" id="works" aria-labelledby="works-title">
          <div className="tri-section-top"><p className="tri-eyebrow">01 / Избранные работы</p><Link className="tri-text-link" href="/projects">Все проекты <span>↗</span></Link></div>
          <div className="tri-section-heading"><h2 id="works-title">Идеи становятся<br /><em>осязаемыми.</em></h2><p>Проекты Фёдора Паршина и команды Step3D — опыт, из которого выросла ТРИФОТИ. От авторской пластики до объектов, которые живут в пространстве.</p></div>
          <div className="tri-filter-row"><div className="tri-filters" role="group" aria-label="Фильтр портфолио">{caseFilters.map(filter => <button key={filter} type="button" className={caseFilter === filter ? "active" : ""} aria-pressed={caseFilter === filter} onClick={() => { setCaseFilter(filter); setShowAllCases(false); }}>{filter}</button>)}</div><span className="tri-count" aria-live="polite">{displayedCases.length} {projectWord(displayedCases.length)}</span></div>
          <div id="portfolio-grid" className={`tri-project-grid ${caseFilter !== "Все" ? "tri-project-filtered" : ""}`}>{displayedCases.map((item, index) => <article className={`tri-project tri-project-${index + 1}`} key={item.slug}>
            <Link className="tri-project-image" href={`/cases/${item.slug}`} onClick={() => trackEvent("case_open", {case: item.title})}><img src={item.image} alt={item.alt} width={item.width} height={item.height} loading="lazy" decoding="async" style={{objectPosition: item.position}} /><span className="tri-project-number">{String(portfolioOrder.indexOf(item.slug) + 1).padStart(2, "0")}</span><span className="tri-project-arrow" aria-hidden="true">↗</span>{item.badge && <span className="tri-project-badge">{item.badge}</span>}</Link>
            <div className="tri-project-info"><div><p>{item.category}</p><h3><Link href={`/cases/${item.slug}`}>{item.title}</Link></h3></div><button type="button" onClick={() => startProject(item.type, `case_${item.slug}`, true, item.slug)} aria-label={`Обсудить проект по направлению ${item.category}`}>Обсудить похожее <span>↗</span></button></div>
          </article>)}</div>
          {caseFilter === "Все" && <div className="tri-portfolio-bottom"><p>От камерного объекта до формы,<br />которая меняет пространство.</p><button className="tri-button outline" type="button" aria-expanded={showAllCases} aria-controls="portfolio-grid" onClick={() => setShowAllCases(value => !value)}>{showAllCases ? "Свернуть подборку" : "Больше проектов"}<span>{showAllCases ? "↑" : "+"}</span></button></div>}
        </section>

        <section className="tri-studio" id="about" aria-labelledby="studio-title">
          <div className="tri-studio-art"><img src="/images/cases/parshin-sculptures/relief-finished.webp" alt="Скульптор Фёдор Паршин рядом со своей рельефной композицией" width={1152} height={1536} loading="lazy" decoding="async" /><span>Фёдор Паршин / авторская скульптура</span></div>
          <div className="tri-studio-copy"><p className="tri-eyebrow">02 / Люди и замысел</p><h2 id="studio-title">Художник.<br />Инженер.<br /><em>Одна студия.</em></h2><p className="tri-studio-lead">ТРИФОТИ объединяет художественную практику Фёдора Паршина и инженерный опыт Владимира Ганьшина.</p><p>Нам интересны объекты, в которых выразительная форма встречается с продуманной конструкцией. Мы развиваем идею и находим способ сделать её реальной.</p><div className="tri-founders-inline"><div><h3>Фёдор Паршин</h3><span>Скульптура и художественный образ</span></div><div><h3>Владимир Ганьшин</h3><span>Инженерия и цифровое производство</span></div></div><Link className="tri-text-link" href="/about">Познакомиться со студией <span>↗</span></Link></div>
        </section>

        <section className="tri-services" id="services" aria-labelledby="services-title"><div className="tri-section-top"><p className="tri-eyebrow">03 / Что создаём</p><span>Единичные объекты и серии</span></div><div className="tri-section-heading"><h2 id="services-title">Ваша идея.<br /><em>Наши возможности.</em></h2><p>Работаем с частными заказчиками, архитекторами, дизайнерами, культурными институциями и брендами.</p></div><div className="tri-service-list">{signatureServices.map((service, index) => <details key={service.slug} name="studio-services" open={index === 0}><summary><span>{service.index}</span><h3>{service.title}</h3><i aria-hidden="true">+</i></summary><div className="tri-service-body"><p>{service.text}</p><div><div className="tri-service-tags">{service.tags.map(tag => <span key={tag}>{tag}</span>)}</div><Link className="tri-text-link" href={`/services/${service.slug}`}>Подробнее <span>↗</span></Link><button className="tri-text-link" type="button" onClick={() => startProject(service.type, `service_${service.index}`, true)}>Обсудить задачу <span>→</span></button></div></div></details>)}</div><div className="tri-service-foot"><span>3D-моделирование · сканирование · печать · ручная отделка</span><Link className="tri-text-link" href="/services">Все возможности <span>↗</span></Link></div></section>

        <StudioProcess />
        <ObjectBrief onApply={(type, summary, format) => { startProject(type, "object_configurator", true); setSelectedFormat(format ?? "Уточним вместе"); setObjectSetup(summary); }} />

        <section className="tri-partners"><p className="tri-eyebrow">Для архитекторов и команд</p><h2>У вашего пространства<br />может быть свой <em>характер.</em></h2><div><p>Поможем воплотить авторский объект в интерьере, экспозиции или проекте бренда — от концепции до согласованного результата.</p><Link className="tri-button" href="/business">Обсудить сотрудничество <span>↗</span></Link></div></section>

        <section className="section faq tri-faq" id="faq"><div className="faq-heading"><p className="tri-eyebrow">Перед первым разговором</p><h2>Несколько<br /><em>ответов.</em></h2></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary><span>{question}</span><i aria-hidden="true">+</i></summary><p>{answer}</p></details>)}</div></section>
        <section className="request" id="request" aria-labelledby="request-title">
          <div className="request-intro"><p className="kicker light">06 / Начнём разговор</p><h2 id="request-title">{quickRequest ? <>Есть модель?<br /><em>Рассчитаем печать.</em></> : <>Дадим форму<br /><em>вашей идее.</em></>}</h2><p>{quickRequest ? (STATIC_EXPORT ? "Добавьте ссылку на модель и оставьте контакт. Подготовим сообщение, которое можно отправить студии." : "Прикрепите модель или дайте ссылку на файл и оставьте контакт. Проверим возможность печати и уточним детали для расчёта.") : "Расскажите, что вы задумали. Можно начать с нескольких слов, эскиза или фотографии пространства."}</p><div className="response-expectation"><strong>{responseHours}</strong><p>{responseNextStep}</p><p>Срочная задача? Позвоните или напишите в Telegram и укажите нужную дату.</p></div><div className="contact-list"><span className="contact-list-caption">Удобнее обсудить напрямую?</span><a href="mailto:projects.step3d@gmail.com">projects.step3d@gmail.com <span>↗</span></a><a href="tel:+79959009141">+7 995 900-91-41 <span>↗</span></a><a href={MANAGER_URL} target="_blank" rel="noreferrer">@step_3d_mngr <span>↗</span></a></div></div>
          <form className="request-form" onSubmit={submitRequest}>
            {!sent && <div className="request-mode" role="group" aria-label="Способ отправить запрос"><button type="button" aria-pressed={!quickRequest} disabled={sending || uploading} onClick={() => { setQuickRequest(false); goToFormStep(1); }}>Описать проект</button><button type="button" aria-pressed={quickRequest} disabled={sending || uploading} onClick={() => { setQuickRequest(true); changeProjectType("3D-печать по готовой модели"); setFormError(""); }}>Печать по файлу</button></div>}
            {!sent && !quickRequest && <div className="form-progress" aria-label={`Шаг ${formStep} из 3`}><div><span>0{formStep}</span><b>из 03</b></div><div className="form-progress-line"><span style={{ width: `${(formStep / 3) * 100}%` }} /></div><p>{formStep === 1 ? "Выбираем задачу" : formStep === 2 ? "Уточняем параметры" : "Оставляем контакт"}</p></div>}
            <label className="website-field" aria-hidden="true">Ваш сайт<input tabIndex={-1} autoComplete="off" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} /></label>
            {sent && STATIC_EXPORT && <DirectBrief message={preparedMessage} onEdit={() => { setSent(false); goToFormStep(2); }} onReset={() => { resetSuccess(); setFormStep(1); }} />}
            {sent && !STATIC_EXPORT && <div className="request-success" id="request-success" tabIndex={-1} role="status"><span>Заявка принята</span><h3>{leadId}</h3><p>{uploading && "Передаём файлы — дождитесь окончания загрузки. "}Заявка сохранена в студии ТРИФОТИ. {managerNotified ? "Менеджеру отправлено уведомление." : "Для оперативного ответа отправьте подготовленное сообщение менеджеру — повторно заполнять данные не нужно."} {uploadedFiles.length > 0 ? "Материалы прикреплены к заявке." : "Модели и референсы можно добавить ниже."}</p><div className="receipt-contact"><a className="button primary" href={followUpUrl} target="_blank" rel="noopener noreferrer">Продолжить в Telegram</a><a href={emailFollowUpUrl}>Отправить запрос по почте</a></div>{!uploading && <RequestReceipt leadId={leadId} leadToken={leadToken} />}<div className="upload-panel">{uploading && <div className="upload-progress" role="status"><span>Файл {Math.min(uploadProgress.completed + 1, uploadProgress.total)} из {uploadProgress.total}: {uploadProgress.name}</span><progress max={100} value={uploadProgress.percent} aria-label="Передача текущего файла" /><small>{uploadProgress.percent === 100 ? "Проверяем и сохраняем файл…" : `Передано ${uploadProgress.percent}%`}</small></div>}<label><span>Дополнительные файлы · {FILE_FORMATS_LABEL}</span><input type="file" multiple disabled={uploading || sending || uploadedFiles.length >= 5} accept={FILE_ACCEPT} onChange={(event) => { selectFiles(event.currentTarget.files); event.currentTarget.value = ""; }} /></label><p>Прикреплено: {uploadedFiles.length} из 5. Можно добавить: {Math.max(0, 5 - uploadedFiles.length)}. До 25 МБ на файл.</p>{files.length > 0 && <><ul>{files.map((file, index) => <li key={`${file.name}-${file.size}`}><span>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} МБ</span><button type="button" disabled={uploading || sending} onClick={() => removeFile(index)} aria-label={`Убрать файл ${file.name}`}>Убрать</button></li>)}</ul><p className="file-total">Выбрано: {files.length} · {(selectedFilesSize / 1024 / 1024).toFixed(1)} МБ</p></>}<button type="button" disabled={files.length === 0 || uploading} onClick={() => void uploadFiles()}>{uploading ? "Загружаем…" : `Загрузить ${files.length || "файлы"}`}</button>{uploadedFiles.length > 0 && <p className="upload-ok">✓ Загружено: {uploadedFiles.join(", ")}</p>}{fileError && <p className="form-error" role="alert">{fileError}</p>}</div><div>{!uploading && <a href={`/status?id=${encodeURIComponent(leadId)}&token=${encodeURIComponent(leadToken)}`}>Следить за статусом заявки</a>}</div><button type="button" disabled={sending || uploading} onClick={() => { setSent(false); setLeadId(""); setLeadToken(""); setFiles([]); setUploadedFiles([]); setFileError(""); setObjectSetup(""); setProjectReferences([]); setPreparedMessage(""); setBudget("Пока не определён"); setProjectType("Скульптура / арт-объект"); setSelectedFormat("Единичный объект"); setContactMethod("Telegram"); setContactValues(emptyContactValues); setCompanyWebsite(""); setFollowUpUrl(MANAGER_URL); setEmailFollowUpUrl("mailto:projects.step3d@gmail.com"); setFormStep(1); setQuickRequest(false); setMaterialsUrl(""); setBrief({ name: "", details: "", deadline: "" }); formStartedAt.current = Date.now(); }}>Создать ещё одну заявку</button></div>}

            {!sent && !quickRequest && formStep === 1 && <div className="form-panel" key="step-1"><fieldset><legend>Что будем создавать?</legend><div className="choice-grid">{creativeChoices.map((choice) => <label className={projectType === choice.value ? "choice selected" : "choice"} key={choice.value}><input id={projectType === choice.value ? "project-type-current" : undefined} type="radio" name="type" value={choice.value} checked={projectType === choice.value} onChange={() => changeProjectType(choice.value)} /><span>{choice.short}</span><i>{projectType === choice.value ? "●" : "+"}</i></label>)}</div><details className="tri-technical-choices" open={technicalChoices.some(choice => choice.value === projectType) || undefined}><summary>Нужен отдельный этап производства?</summary><div className="choice-grid">{technicalChoices.map(choice => <label className={projectType === choice.value ? "choice selected" : "choice"} key={choice.value}><input id={projectType === choice.value ? "project-type-current" : undefined} type="radio" name="type" value={choice.value} checked={projectType === choice.value} onChange={() => changeProjectType(choice.value)} /><span>{choice.short}</span><i>{projectType === choice.value ? "●" : "+"}</i></label>)}</div></details></fieldset><fieldset className="format-choice"><legend>Какой формат ближе?</legend><div>{[...formats, { number: "D", title: "Уточним вместе" }].map((format) => <label className={selectedFormat === format.title ? "method selected" : "method"} key={format.number}><input type="radio" name="format" value={format.title} checked={selectedFormat === format.title} onChange={() => chooseFormat(format.title, "brief_step_1")} />{format.title}</label>)}</div></fieldset><button className="submit-button" type="button" onClick={nextFormStep}><span>Далее — параметры</span><i>→</i></button></div>}

            {!sent && (quickRequest || formStep === 2) && <div className="form-panel" key="step-2">{referenceProjects.length > 0 && <div className="tri-brief-references"><p className="tri-reference-heading">{referenceProjects.length > 1 ? "Ваши художественные ориентиры" : "Референс из портфолио"}</p>{referenceProjects.map(item => <div className="tri-brief-reference" key={item.slug}><img src={item.image} alt={item.imageAlt} width={96} height={96} /><div><strong>{item.title}</strong><button type="button" aria-label={`Убрать референс: ${item.title}`} onClick={() => setProjectReferences(items => items.filter(slug => slug !== item.slug))}>Убрать референс</button></div></div>)}</div>}{objectSetup && <div className="tri-object-summary"><span>Параметры из конфигуратора</span><p>{objectSetup}</p><button type="button" onClick={() => setObjectSetup("")}>Убрать параметры</button></div>}{!quickRequest && <div className="tri-brief-prompts"><p>{selectedFormat === "Для организаций" ? "Добавьте контекст проекта и кто участвует в согласовании." : "Можно начать с того, что уже известно:"}</p><ul>{briefPrompts.map(prompt => <li key={prompt}>{prompt}</li>)}</ul></div>}<label className="field field-first"><span>{quickRequest ? "Комментарий к печати · необязательно" : "Коротко о проекте"}</span><textarea id="project-details" name="details" required={!quickRequest && !objectSetup} rows={quickRequest ? 2 : 4} maxLength={descriptionLimit} value={brief.details} onChange={(event) => setBrief({ ...brief, details: event.target.value })} placeholder={projectExamples[projectType] ?? projectExamples.Другое} aria-invalid={Boolean(formError)} aria-describedby={formError ? "project-details-error" : undefined} /></label>{!quickRequest && <div className="field-row"><label className="field"><span>Ориентир бюджета</span><select value={budget} onChange={(event) => setBudget(event.target.value)}><option>Пока не определён</option><option>До 30 000 ₽</option><option>30 000–100 000 ₽</option><option>100 000–300 000 ₽</option><option>Более 300 000 ₽</option></select></label><label className="field"><span>Желаемый срок <i>необязательно</i></span><input name="deadline" maxLength={100} value={brief.deadline} onChange={(event) => setBrief({ ...brief, deadline: event.target.value })} placeholder="Например, к открытию выставки" /></label></div>}{!STATIC_EXPORT && <div className="upload-panel pre-submit-files"><label><span>{quickRequest ? "Готовая модель для расчёта" : "Модели, чертежи или референсы · необязательно"}</span><input type="file" multiple disabled={uploading || sending || uploadedFiles.length >= 5} accept={FILE_ACCEPT} onChange={(event) => { selectFiles(event.currentTarget.files); event.currentTarget.value = ""; }} /></label><p>{quickRequest ? "STL, STEP, OBJ, 3MF и другие 3D-форматы." : FILE_FORMATS_LABEL + "."} До 5 файлов по 25 МБ. Для больших файлов добавьте ссылку ниже.</p>{files.length > 0 && <><ul>{files.map((file, index) => <li key={`${file.name}-${file.size}`}><span>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} МБ</span><button type="button" disabled={uploading || sending} onClick={() => removeFile(index)} aria-label={`Убрать файл ${file.name}`}>Убрать</button></li>)}</ul><p className="file-total">Выбрано: {files.length} · {(selectedFilesSize / 1024 / 1024).toFixed(1)} МБ</p></>}{fileError && <p className="form-error" role="alert">{fileError}</p>}</div>}{STATIC_EXPORT && <p className="tri-direct-materials">Файлы приложите к сообщению в Telegram или письму. Здесь можно оставить ссылку на папку.</p>}<label className="field materials-link"><span>Ссылка на материалы <i>{STATIC_EXPORT ? "необязательно" : "вместо загрузки или дополнительно"}</i></span><input type="url" maxLength={450} value={materialsUrl} onChange={event => setMaterialsUrl(event.target.value)} placeholder="https://…" aria-describedby="materials-link-hint" /><small id="materials-link-hint">Проверьте доступ по ссылке. Конфиденциальные материалы передавайте после согласования NDA.</small></label>{!quickRequest && formError && <p className="form-error" id="project-details-error" role="alert">{formError}</p>}{!quickRequest && <div className="form-nav"><button className="back-button" type="button" onClick={() => goToFormStep(1)}>Назад</button><button className="submit-button" type="button" onClick={nextFormStep}><span>Далее — контакты</span></button></div>}</div>}

            {!sent && (quickRequest || formStep === 3) && <div className="form-panel" key="step-3">{!quickRequest && <div className="brief-summary" aria-label="Краткое резюме заявки"><span>Ваш запрос</span><div><p><b>Объект</b>{projectType}</p><p><b>Формат</b>{selectedFormat}</p><p><b>Бюджет</b>{budget}</p><p><b>Материалы</b>{materialsUrl ? "Добавлена ссылка" : files.length > 0 ? `${files.length} файлов` : STATIC_EXPORT ? "Можно приложить к сообщению" : "Пока не приложены"}</p>{referenceProjects.length > 0 && <p className="tri-summary-wide"><b>Ориентиры</b>{referenceProjects.map(item => item.title).join("; ")}</p>}{objectSetup && <p className="tri-summary-wide"><b>Параметры</b>{objectSetup}</p>}</div><button type="button" onClick={() => goToFormStep(1)}>Изменить</button></div>}<fieldset className="contact-method"><legend>Как удобнее ответить?</legend><div>{contactMethods.map((method) => <label key={method} className={contactMethod === method ? "method selected" : "method"}><input type="radio" name="method" value={method} checked={contactMethod === method} onChange={() => { setContactMethod(method); setFormError(""); }} />{method}</label>)}</div></fieldset><div className="field-row"><label className="field"><span>Как к вам обращаться? {quickRequest && <i>необязательно</i>}</span><input id="contact-name" name="name" required={!quickRequest} minLength={2} maxLength={120} autoComplete="name" value={brief.name} onChange={(event) => setBrief({ ...brief, name: event.target.value })} placeholder="Имя или компания" /></label><label className="field"><span>{contactField.label}</span><input id="contact-value" name="contact" required minLength={3} maxLength={160} type={contactField.type} inputMode={contactField.inputMode} autoComplete={contactField.autoComplete} value={contactValue} onInput={(event) => updateContactValue(event.currentTarget.value)} placeholder={contactField.placeholder} aria-invalid={Boolean(formError)} aria-describedby={formError ? "contact-step-error" : undefined} /></label></div><label className="consent"><input type="checkbox" name="consent" required /><span>Я даю <a href="/consent" target="_blank" rel="noopener noreferrer">согласие на обработку персональных данных</a> и ознакомлен с <a href="/privacy" target="_blank" rel="noopener noreferrer">Политикой</a>.</span></label>{formError && <p className="form-error" id="contact-step-error" role="alert">{formError}</p>}<div className="form-nav">{!quickRequest && <button className="back-button" type="button" onClick={() => goToFormStep(2)}>Назад</button>}<button className="submit-button" type="submit" disabled={sending || uploading}><span>{uploading ? "Загружаем файлы…" : sending ? "Сохраняем заявку…" : STATIC_EXPORT ? "Подготовить сообщение" : "Отправить заявку"}</span><i>{sending || uploading ? "…" : "↗"}</i></button></div><p className="form-note" aria-live="polite">{STATIC_EXPORT ? "После подготовки выберите Telegram или почту и отправьте сообщение. Условия и цена согласуются отдельно." : "Отправка формы — запрос на расчёт, а не заказ. Условия и цена фиксируются до оплаты."}</p></div>}
          </form>
        </section>
      </main>
      <SiteFooter />
      <div className={`mobile-cta ${activeSection === "request" ? "is-hidden" : ""}`} aria-label="Быстрая заявка" inert={activeSection === "request"} aria-hidden={activeSection === "request"}><button type="button" onClick={() => startProject(projectType, "mobile_sticky")}>Обсудить идею <span>↗</span></button><a href={telegramHref} target="_blank" rel="noreferrer" aria-label="Написать команде ТРИФОТИ в Telegram">Telegram ↗</a></div>
    </div>
  );
}
