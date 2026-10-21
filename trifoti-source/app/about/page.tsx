/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { InnerHeader } from "../components/InnerHeader";
import { DetailContactBar, SiteFooter } from "../components/SiteFooter";
import { TeamSection } from "../components/TeamSection";
import { caseStudies } from "../case-data";

const origin = "https://trifoti.step3d.chatgpt.site";
const requestHref = "/?source=about#request";
const description = "ТРИФОТИ — креативная студия Фёдора Паршина и Владимира Ганьшина. Скульптура, интерьерные арт-объекты, сценические элементы и авторские награды.";

export const metadata: Metadata = {
  title: "О студии ТРИФОТИ — Фёдор Паршин и Владимир Ганьшин",
  description,
  alternates: { canonical: `${origin}/about` },
  openGraph: {
    type: "website", locale: "ru_RU",
    title: "ТРИФОТИ — авторская форма и цифровое производство", description,
    url: `${origin}/about`,
    images: [{ url: `${origin}/images/cases/parshin-sculptures/relief-finished.webp`, width: 1152, height: 1536, alt: "Фёдор Паршин рядом с авторской рельефной композицией" }],
  },
  twitter: { card: "summary_large_image", title: "О студии ТРИФОТИ", description, images: [`${origin}/images/cases/parshin-sculptures/relief-finished.webp`] },
};

const principles = [
  { title: "Форма и контекст", text: "Начинаем с идеи и места, для которого создаётся объект. Учитываем масштаб пространства, свет, окружение и то, как человек увидит работу." },
  { title: "Конструкция и масштаб", text: "Переводим художественную форму в цифровую модель. Продумываем членение, соединения и сборку; проверяем решения на макете или прототипе." },
  { title: "Поверхность и детали", text: "Согласуем фактуру и цвет, подбираем способ изготовления и отделки. Уделяем внимание стыкам, креплениям и восприятию объекта вблизи." },
];

const featuredCases = ["parshin-sculptures", "sakharov-art", "pletneva-costume"]
  .map((slug) => caseStudies.find((item) => item.slug === slug))
  .filter((item): item is (typeof caseStudies)[number] => Boolean(item));

const structuredData = [
  {
    "@context": "https://schema.org", "@type": "AboutPage", "@id": `${origin}/about#page`,
    url: `${origin}/about`, name: "О студии ТРИФОТИ", description, inLanguage: "ru-RU",
    mainEntity: {
      "@type": "Organization", "@id": `${origin}/#studio`, name: "ТРИФОТИ", url: origin,
      founder: [{ "@type": "Person", name: "Фёдор Паршин" }, { "@type": "Person", name: "Владимир Ганьшин" }],
      knowsAbout: ["Скульптура", "Интерьерные арт-объекты", "Сценические объекты", "Авторские награды", "Цифровое производство"],
    },
  },
  {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: origin },
      { "@type": "ListItem", position: 2, name: "О студии", item: `${origin}/about` },
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      <InnerHeader backHref="/" backLabel="На главную" activeHref="/about" requestHref={requestHref} />
      <main className="business-page about-page" id="content" tabIndex={-1}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "О студии" }]} />
        <section className="business-hero">
          <div className="business-copy">
            <p className="kicker">ТРИФОТИ / о студии</p>
            <h1>Художественная форма.<br /><em>Точное воплощение.</em></h1>
            <p>Креативная студия Фёдора Паршина и Владимира Ганьшина. Создаём скульптуры, интерьерные арт-объекты, сценические элементы и авторские награды.</p>
            <p>Соединяем работу художника с инженерным проектированием, 3D-технологиями и ручной отделкой. Помогаем пройти путь от первого эскиза до физического объекта.</p>
            <div className="business-actions"><Link className="button primary" href={requestHref}>Обсудить идею <span aria-hidden="true">↗</span></Link><Link className="button ghost" href="/projects">Смотреть работы <span aria-hidden="true">→</span></Link></div>
          </div>
          <figure className="tri-inner-visual">
            <img src="/images/cases/sakharov-art/copper-detail.webp" alt="Рельефное панно с медным оттенком в общественном интерьере" width={1152} height={1536} fetchPriority="high" decoding="async" />
            <figcaption>Интерьерное панно / опыт команды Step3D</figcaption>
          </figure>
        </section>

        <TeamSection />

        <section className="business-grid" aria-label="Подход студии ТРИФОТИ">
          {principles.map((principle, index) => <article key={principle.title}><div className="metric-top"><span>0{index + 1}</span></div><h2>{principle.title}</h2><p>{principle.text}</p></article>)}
        </section>

        <section className="service-related business-cases" aria-labelledby="about-cases-title">
          <div className="service-related-heading"><p className="kicker">Избранные проекты</p><h2 id="about-cases-title">Опыт,<br /><em>который нас объединяет.</em></h2><p>Работы участников студии и Step3D. В описаниях сохраняем художественное авторство и указываем вклад команды в изготовление.</p></div>
          <div className="service-related-grid">{featuredCases.map((item) => <article key={item.slug}><Link href={`/cases/${item.slug}`} className="service-related-image"><img src={item.image} alt={item.imageAlt} width={item.imageWidth} height={item.imageHeight} loading="lazy" decoding="async" style={{ objectPosition: item.imagePosition }} /></Link><p>{item.category}</p><h3><Link href={`/cases/${item.slug}`}>{item.title}</Link></h3><Link className="service-related-link" href={`/cases/${item.slug}`}>История проекта <span aria-hidden="true">↗</span></Link></article>)}</div>
        </section>

        <section className="business-steps" aria-labelledby="about-process-title">
          <div><p className="kicker">С чего начать</p><h2 id="about-process-title">Расскажите,<br /><em>что хотите создать.</em></h2><p>На старте достаточно идеи, эскиза или нескольких референсов. Вместе определим, что нужно разработать и какие решения проверить до изготовления.</p></div>
          <ol>
            <li><span>01</span><div><h3>Замысел</h3><p>Обсудим образ, назначение объекта и место, где он будет находиться.</p></div></li>
            <li><span>02</span><div><h3>План реализации</h3><p>Уточним масштаб, материалы, способ изготовления, отделку и необходимые согласования.</p></div></li>
            <li><span>03</span><div><h3>Предложение</h3><p>Определим состав работ, этапы, стоимость и сроки под вашу задачу.</p></div></li>
          </ol>
          <Link className="button primary" href={requestHref}>Начать диалог <span aria-hidden="true">↗</span></Link>
        </section>
        <SiteFooter />
        <DetailContactBar requestHref={requestHref} context="проект со студией ТРИФОТИ" />
      </main>
    </>
  );
}
