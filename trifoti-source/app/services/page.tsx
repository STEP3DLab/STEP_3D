/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { DetailContactBar, SiteFooter } from "../components/SiteFooter";
import { InnerHeader } from "../components/InnerHeader";
import { MotionIcon, type MotionIconName } from "../components/MotionIcon";
import { caseStudies } from "../case-data";
import { servicePages } from "../service-data";

const origin = "https://trifoti.step3d.chatgpt.site";

export const metadata: Metadata = {
  title: "Скульптуры, арт-объекты и интерьерные решения",
  description: "Направления ТРИФОТИ: авторские скульптуры, интерьерные объекты, сценические костюмы, награды и предметный дизайн. От художественного замысла до изготовления.",
  alternates: { canonical: `${origin}/services` },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    title: "Скульптура. Объекты. Пространство. — ТРИФОТИ",
    description: "Авторские объекты и цифровые технологии для их создания.",
    url: `${origin}/services`,
    images: [{ url: `${origin}/images/cases/sakharov-art/ring-installed.webp`, width: 1152, height: 1536, alt: "Рельефная композиция для интерьера из портфолио команды" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Направления ТРИФОТИ",
    description: "Скульптуры, интерьерные объекты, сцена и костюм, авторские награды.",
    images: [`${origin}/images/cases/sakharov-art/ring-installed.webp`],
  },
};

const serviceCatalog: readonly {
  slug: string;
  index: string;
  icon: MotionIconName;
  group: "Авторские объекты" | "Цифровые инструменты";
  note: string;
}[] = [
  { slug: "sculptures", index: "01", icon: "sculpture", group: "Авторские объекты", note: "Пластика, масштаб и характер — от эскиза до готовой скульптуры" },
  { slug: "decor-installations", index: "02", icon: "installation", group: "Авторские объекты", note: "Панно, рельефы и инсталляции в диалоге с архитектурой" },
  { slug: "awards", index: "03", icon: "award", group: "Авторские объекты", note: "Узнаваемый образ события, персонализация и серия" },
  { slug: "stage-objects", index: "04", icon: "creator", group: "Авторские объекты", note: "Маски, короны, костюмы и реквизит — образ, посадка и движение" },
  { slug: "industrial-design", index: "05", icon: "prototype", group: "Авторские объекты", note: "Предметы, в которых выразительная форма сочетается с конструкцией" },
  { slug: "3d-modeling", index: "06", icon: "geometry", group: "Цифровые инструменты", note: "Художественная геометрия, цифровая скульптура и подготовка модели" },
  { slug: "3d-printing", index: "07", icon: "product", group: "Цифровые инструменты", note: "Печать деталей, сборка и ручная доводка поверхности" },
  { slug: "3d-scanning", index: "08", icon: "scan", group: "Цифровые инструменты", note: "Оцифровка существующей формы для реплики или нового масштаба" },
  { slug: "ar-vr", index: "09", icon: "xr", group: "Цифровые инструменты", note: "Интерактивный показ объекта и пространственной композиции" },
] as const;

const entryRoutes = [
  {
    index: "A",
    title: "Идея для скульптуры",
    text: "Найдём художественный образ, проработаем форму и предложим способ изготовления.",
    href: "/services/sculptures",
    label: "Скульптуры и арт-объекты",
  },
  {
    index: "B",
    title: "Пространство для искусства",
    text: "Создадим объект под архитектуру, свет и характер вашего интерьера.",
    href: "/services/decor-installations",
    label: "Объекты для пространства",
  },
  {
    index: "C",
    title: "Событие с характером",
    text: "Разработаем авторскую награду, которая передаёт идею премии или бренда.",
    href: "/services/awards",
    label: "Награды и кубки",
  },
  {
    index: "D",
    title: "Сценический образ",
    text: "Переведём эскиз в костюм, маску или реквизит с учётом посадки, веса и движения.",
    href: "/services/stage-objects",
    label: "Сцена и костюм",
  },
] as const;

const featuredCaseSlugs = ["parshin-sculptures", "sakharov-art", "std-award"] as const;

function requestHref(type: string, source: string) {
  return `/?type=${encodeURIComponent(type)}&step=2&source=${encodeURIComponent(source)}#request`;
}

export default function ServicesPage() {
  const catalog = serviceCatalog.map((item) => {
    const service = servicePages.find((entry) => entry.slug === item.slug);
    if (!service) throw new Error(`Unknown service: ${item.slug}`);
    return { ...item, service };
  });
  const featuredCases = featuredCaseSlugs
    .map((slug) => caseStudies.find((item) => item.slug === slug))
    .filter((item): item is (typeof caseStudies)[number] => Boolean(item));
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Направления ТРИФОТИ",
      itemListElement: catalog.map(({ service }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: service.title,
        url: `${origin}/services/${service.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: origin },
        { "@type": "ListItem", position: 2, name: "Услуги", item: `${origin}/services` },
      ],
    },
  ];
  const generalRequestHref = "/?source=services_hub#request";

  return (
    <>
      <InnerHeader backHref="/" backLabel="На главную" activeHref="/services" requestHref={generalRequestHref} />
      <main className="services-hub" id="content" tabIndex={-1}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Услуги" }]} />

      <section className="services-hub-hero" aria-labelledby="services-hub-title">
        <div className="services-hub-copy">
          <p className="kicker light">ТРИФОТИ / Направления студии</p>
          <h1 id="services-hub-title">Скульптура.<br />Объекты.<br /><em>Пространство.</em></h1>
          <p>Находим художественный образ и воплощаем его в материале. Создаём скульптуры, интерьерные композиции, сценические объекты и авторские награды — от первого эскиза до готовой формы.</p>
          <div className="services-hub-actions">
            <a className="button primary" href="#service-map">Выбрать направление <span>↓</span></a>
            <Link className="button ghost" href={generalRequestHref}>Описать задачу <span>↗</span></Link>
          </div>
        </div>
        <aside className="services-hub-facts" aria-label="Как работает ТРИФОТИ">
          <div><span>01 / Образ</span><strong>Авторский подход</strong><p>Начинаем с идеи, назначения и места будущего объекта.</p></div>
          <div><span>02 / Форма</span><strong>Искусство и технология</strong><p>Соединяем скульптурную пластику с цифровым моделированием и производством.</p></div>
          <div><span>03 / Воплощение</span><strong>Стоимость по проекту</strong><p>Состав работ, материалы, смету и срок согласуем после знакомства с задачей.</p></div>
        </aside>
      </section>

      <section className="services-entry" aria-labelledby="services-entry-title">
        <div className="services-entry-heading">
          <p className="kicker">Быстрый выбор</p>
          <h2 id="services-entry-title">Что вы хотите<br /><em>создать?</em></h2>
          <p>Достаточно идеи, фотографии места или нескольких референсов. Подробное техническое задание можно сформировать вместе.</p>
        </div>
        <div className="services-entry-grid">
          {entryRoutes.map((route) => (
            <article key={route.index}>
              <span>{route.index}</span>
              <h3>{route.title}</h3>
              <p>{route.text}</p>
              <Link href={route.href}>{route.label} <b>→</b></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="services-map" id="service-map" aria-labelledby="services-map-title">
        <div className="services-map-heading">
          <div><p className="kicker light">От замысла до объекта</p><h2 id="services-map-title">Художественная идея.<br /><em>Точное воплощение.</em></h2></div>
          <p>Ведём проект целиком или подключаемся на отдельном этапе. Технологию выбираем под замысел, масштаб и условия использования.</p>
        </div>
        {(["Авторские объекты", "Цифровые инструменты"] as const).map((group) => (
          <div className="services-map-group" key={group}>
            <p>{group}</p>
            <div className="services-map-grid">
              {catalog.filter((item) => item.group === group).map(({ index, icon, note, service }) => (
                <article className={service.slug === "sculptures" ? "is-featured" : ""} key={service.slug}>
                  <div className="services-map-top"><span>{index}</span><MotionIcon name={icon} /></div>
                  <h3>{service.shortTitle}</h3>
                  <p>{note}</p>
                  <div className="services-map-links">
                    <Link href={`/services/${service.slug}`}>Подробнее <span>→</span></Link>
                    <Link href={requestHref(service.requestType, `services_hub_${service.slug}`)}>Обсудить проект <span>↗</span></Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="services-cases" aria-labelledby="services-cases-title">
        <div className="services-cases-heading">
          <div><p className="kicker">Опыт команды</p><h2 id="services-cases-title">Форма становится<br /><em>реальностью.</em></h2></div>
          <p>Избранные проекты участников студии и Step3D. Указываем подтверждённое авторство и роль команды, показываем этапы изготовления.</p>
        </div>
        <div className="services-cases-grid">
          {featuredCases.map((item, index) => (
            <article key={item.slug}>
              <Link href={`/cases/${item.slug}`} className="services-case-image">
                <img src={item.image} alt={item.imageAlt} width={item.imageWidth} height={item.imageHeight} loading="lazy" decoding="async" style={{ objectPosition: item.imagePosition }} />
                <span>0{index + 1}</span>
              </Link>
              <p>{item.category}</p>
              <h3><Link href={`/cases/${item.slug}`}>{item.title}</Link></h3>
              <Link className="services-case-link" href={`/cases/${item.slug}`}>Открыть кейс →</Link>
            </article>
          ))}
        </div>
        <Link className="services-cases-all" href="/projects">Смотреть все проекты <span>→</span></Link>
      </section>

      <section className="services-business" aria-labelledby="services-business-title">
        <div><p className="kicker light">Архитекторам, дизайнерам и брендам</p><h2 id="services-business-title">Объект как часть<br /><em>большого замысла.</em></h2></div>
        <div><p>Включимся в проект на этапе концепции или по готовому заданию. Согласуем художественное решение, конструкцию, состав работ и порядок передачи результата.</p><div><Link className="button primary" href="/business">Для профессиональных команд <span>→</span></Link><Link className="button ghost" href={generalRequestHref}>Обсудить задачу <span>↗</span></Link></div></div>
      </section>

        <SiteFooter />
        <DetailContactBar requestHref={generalRequestHref} context="проект для студии ТРИФОТИ" />
      </main>
    </>
  );
}
