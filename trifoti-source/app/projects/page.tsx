import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "../components/Breadcrumbs";
import { DetailContactBar, SiteFooter } from "../components/SiteFooter";
import { InnerHeader } from "../components/InnerHeader";
import { ProjectExplorer } from "../components/ProjectExplorer";
import { caseStudies } from "../case-data";

const origin = "https://trifoti.step3d.chatgpt.site";

export const metadata: Metadata = {
  title: "Проекты и кейсы",
  description: "Опыт команды ТРИФОТИ и Step3D: скульптуры, награды, интерьерные объекты, сценический костюм, макеты и изделия с применением 3D-технологий.",
  alternates: { canonical: `${origin}/projects` },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    title: "Проекты команды — ТРИФОТИ",
    description: "Задача, технологии, процесс и готовый результат — в подробных кейсах Step3D.",
    url: `${origin}/projects`,
    images: [{ url: `${origin}/images/cases/std-award/award-series.webp`, width: 1536, height: 1152, alt: "Реализованные проекты Step3D" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Проекты команды — ТРИФОТИ",
    description: "Скульптуры, награды, интерьерные и сценические объекты — с реальным процессом и результатом.",
    images: [`${origin}/images/cases/std-award/award-series.webp`],
  },
};

export default function ProjectsPage() {
  const pageUrl = `${origin}/projects`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Проекты команды — ТРИФОТИ",
      description: "Проекты Фёдора Паршина и команды Step3D: реализованные работы и проектные разработки.",
      url: pageUrl,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: caseStudies.length,
        itemListElement: caseStudies.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          url: `${origin}/cases/${item.slug}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: origin },
        { "@type": "ListItem", position: 2, name: "Проекты", item: pageUrl },
      ],
    },
  ];
  const requestHref = "/?source=projects_hub#request";

  return (
    <>
      <InnerHeader backHref="/" backLabel="На главную" activeHref="/projects" requestHref={requestHref} />
      <main className="projects-page" id="content" tabIndex={-1}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Проекты" }]} />

      <section className="projects-hero" aria-labelledby="projects-title">
        <div>
          <p className="kicker light">Избранное / опыт команды</p>
          <h1 id="projects-title">Проекты.<br /><em>В деталях.</em></h1>
        </div>
        <div className="projects-hero-aside">
          <p className="kicker light">{caseStudies.length} проектов · одна команда</p>
          <p>Скульптура, сцена, интерьер, награды и макеты. В каждом кейсе — исходные данные, технологии, процесс и результат.</p>
        </div>
      </section>

      <p className="tri-projects-attribution">Проекты Фёдора Паршина и команды Step3D. Указываем подтверждённое авторство, роль команды и статус проекта.</p>
      <ProjectExplorer />

      <section className="projects-route" aria-labelledby="projects-route-title">
        <div><p className="kicker light">Обсудить новую задачу</p><h2 id="projects-route-title">Нужен похожий<br /><em>результат?</em></h2></div>
        <div><p>Пришлите короткое описание, референс или готовую модель. Для первой оценки достаточно назначения, размера, количества и желаемого срока.</p><div><Link className="button primary" href="/services">Выбрать услугу <span>→</span></Link><Link className="button ghost" href={requestHref}>Обсудить проект <span>↗</span></Link></div></div>
      </section>

        <SiteFooter />
        <DetailContactBar requestHref={requestHref} context="похожий проект для ТРИФОТИ" />
      </main>
    </>
  );
}
