/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { InnerHeader } from "../components/InnerHeader";
import { DetailContactBar, SiteFooter } from "../components/SiteFooter";
import { caseStudies } from "../case-data";

const origin = "https://trifoti.step3d.chatgpt.site";
const requestHref = "/?source=b2b&format=%D0%94%D0%BB%D1%8F%20%D0%BE%D1%80%D0%B3%D0%B0%D0%BD%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D0%B9#request";
const description = "ТРИФОТИ для архитекторов, дизайнеров, девелоперов и культурных команд. Скульптуры, интерьерные объекты, сценические элементы и награды под задачу проекта.";

export const metadata: Metadata = {
  title: "ТРИФОТИ для бизнеса — искусство в вашем проекте", description,
  alternates: { canonical: `${origin}/business` },
  openGraph: {
    type: "website", locale: "ru_RU", title: "ТРИФОТИ — объекты для пространств, брендов и событий", description,
    url: `${origin}/business`,
    images: [{ url: `${origin}/images/cases/sakharov-art/ring-installed.webp`, width: 1152, height: 1536, alt: "Радиальное панно в общественном интерьере" }],
  },
  twitter: { card: "summary_large_image", title: "ТРИФОТИ для бизнеса", description, images: [`${origin}/images/cases/sakharov-art/ring-installed.webp`] },
};

const audiences = [
  { title: "Архитекторы и дизайнеры", text: "Авторская скульптура, рельефные панно и предметные акценты для интерьера. Разрабатываем форму в контексте вашей концепции, продумываем габариты, поверхность и крепления." },
  { title: "Девелоперы и пространства", text: "Арт-объекты для общественных зон жилых проектов, отелей и ресторанов. Учитываем архитектуру, сценарии восприятия, условия размещения и доступ к месту установки." },
  { title: "Культура, бренды и события", text: "Сценические элементы, авторские награды и объекты для выставок и мероприятий. Переводим идею события или визуальный язык бренда в физическую форму." },
];

const businessCases = ["sakharov-art", "parshin-sculptures", "std-award"]
  .map((slug) => caseStudies.find((item) => item.slug === slug))
  .filter((item): item is (typeof caseStudies)[number] => Boolean(item));

const structuredData = [
  {
    "@context": "https://schema.org", "@type": "WebPage", "@id": `${origin}/business#page`,
    name: "ТРИФОТИ для бизнеса", url: `${origin}/business`, description, inLanguage: "ru-RU",
    about: { "@type": "Organization", "@id": `${origin}/#studio`, name: "ТРИФОТИ", url: origin },
  },
  {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: origin },
      { "@type": "ListItem", position: 2, name: "Для бизнеса", item: `${origin}/business` },
    ],
  },
];

export default function BusinessPage() {
  return (
    <>
      <InnerHeader backHref="/" backLabel="На главную" activeHref="/business" requestHref={requestHref} />
      <main className="business-page" id="content" tabIndex={-1}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Для бизнеса" }]} />
        <section className="business-hero">
          <div className="business-copy">
            <p className="kicker">ТРИФОТИ / сотрудничество</p>
            <h1>Искусство<br /><em>в вашем проекте.</em></h1>
            <p>Создаём объекты для архитектуры, интерьеров, сцены и событий. Работаем с авторами концепций и командами заказчиков — от обсуждения образа до согласования изготовления.</p>
            <p>Можно прийти с готовой художественной моделью, архитектурной концепцией или задачей, для которой ещё предстоит найти форму.</p>
            <div className="business-actions"><Link className="button primary" href={requestHref}>Обсудить сотрудничество <span aria-hidden="true">↗</span></Link><a className="button ghost" href="#brief">Что включить в бриф <span aria-hidden="true">↓</span></a></div>
          </div>
          <figure className="tri-inner-visual">
            <img src="/images/cases/sakharov-art/ring-installed.webp" alt="Объёмная радиальная композиция на стене общественного интерьера" width={1152} height={1536} fetchPriority="high" decoding="async" />
            <figcaption>Объект в пространстве / опыт команды Step3D</figcaption>
          </figure>
        </section>
        <section className="business-grid" aria-label="Для кого работает студия ТРИФОТИ">
          {audiences.map((audience, index) => <article key={audience.title}><div className="metric-top"><span>0{index + 1}</span></div><h2>{audience.title}</h2><p>{audience.text}</p></article>)}
        </section>
        <section className="business-steps" aria-labelledby="business-steps-title">
          <div><p className="kicker">Как строим работу</p><h2 id="business-steps-title">Идея — ваша.<br /><em>Решение — совместное.</em></h2><p>Подключаемся на нужном этапе: разрабатываем концепцию, готовим модель к производству или берём на себя изготовление. Состав работ и границы ответственности определяем до старта.</p></div>
          <ol>
            <li><span>01</span><div><h3>Понимаем контекст</h3><p>Изучаем пространство, назначение объекта, референсы и ограничения. Обсуждаем, какой результат должен получить заказчик.</p></div></li>
            <li><span>02</span><div><h3>Согласуем форму и технологию</h3><p>Определяем необходимые эскизы, модели, образцы и контрольные точки. Уточняем отделку, крепления и условия установки.</p></div></li>
            <li><span>03</span><div><h3>Фиксируем предложение</h3><p>Готовим состав работ, смету и график под конкретный проект. Порядок согласования, приёмки и документы обсуждаем вместе с вашей командой.</p></div></li>
          </ol>
          <Link className="button primary" href={requestHref}>Перейти к брифу <span aria-hidden="true">↗</span></Link>
        </section>
        <section className="service-related business-cases" aria-labelledby="business-cases-title">
          <div className="service-related-heading"><p className="kicker">Опыт команды</p><h2 id="business-cases-title">От авторской работы<br /><em>до серии объектов.</em></h2><p>Проекты участников студии и Step3D. В кейсах показаны реальные работы, этапы производства и вклад команды; авторство сохраняется за создателями.</p></div>
          <div className="service-related-grid">{businessCases.map((item) => <article key={item.slug}><Link href={`/cases/${item.slug}`} className="service-related-image"><img src={item.image} alt={item.imageAlt} width={item.imageWidth} height={item.imageHeight} loading="lazy" decoding="async" style={{ objectPosition: item.imagePosition }} /></Link><p>{item.category}</p><h3><Link href={`/cases/${item.slug}`}>{item.title}</Link></h3><Link className="service-related-link" href={`/cases/${item.slug}`}>Смотреть проект <span aria-hidden="true">↗</span></Link></article>)}</div>
        </section>
        <section className="procurement" id="brief" aria-labelledby="brief-title">
          <div><p className="kicker">Бриф для первого разговора</p><h2 id="brief-title">Несколько деталей<br />о вашей задаче.</h2><p>Не обязательно знать все ответы. Отметьте, что уже определено, а что нужно разработать вместе.</p></div>
          <dl>
            <div><dt>Контекст</dt><dd>Для какого пространства, бренда или события нужен объект. Кто принимает художественные и технические решения.</dd></div>
            <div><dt>Форма и масштаб</dt><dd>Референсы, эскизы или модель; примерные размеры, количество и пожелания к фактуре и цвету.</dd></div>
            <div><dt>Условия</dt><dd>Интерьер или улица, особенности крепления, доступ к месту установки, условия эксплуатации.</dd></div>
            <div><dt>Рамки проекта</dt><dd>Желаемая дата готовности, ориентир бюджета и этап, на котором находится проект.</dd></div>
          </dl>
          <div className="procurement-links"><Link href={requestHref}>Заполнить бриф <span aria-hidden="true">↗</span></Link><Link href="/services">Направления студии <span aria-hidden="true">↗</span></Link></div>
        </section>
        <SiteFooter />
        <DetailContactBar requestHref={requestHref} context="сотрудничество со студией ТРИФОТИ" />
      </main>
    </>
  );
}
