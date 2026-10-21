/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { DetailContactBar, SiteFooter } from "../../components/SiteFooter";
import { InnerHeader } from "../../components/InnerHeader";
import { ProjectGallery, type ProjectGalleryImage } from "../../components/ProjectGallery";
import { caseStudies } from "../../case-data";
import { getProjectBriefHref, getProjectRoute, sortPortfolio } from "../../project-routing";

const origin = "https://trifoti.step3d.chatgpt.site";

export function generateStaticParams() {
  return caseStudies.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = caseStudies.find((entry) => entry.slug === slug);
  if (!item) return {};
  const title = `${item.title} — кейс`;
  const socialTitle = `${item.title} — проект команды | ТРИФОТИ`;
  const imageUrl = new URL(item.image, origin).toString();
  const pageUrl = new URL(`/cases/${item.slug}`, origin).toString();
  return {
    title,
    description: item.task,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "article",
      locale: "ru_RU",
      title: socialTitle,
      description: item.task,
      url: pageUrl,
      images: [{ url: imageUrl, width: item.imageWidth, height: item.imageHeight, alt: item.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: item.task,
      images: [imageUrl],
    },
  };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = caseStudies.find((entry) => entry.slug === slug);
  if (!item) notFound();
  const orderedProjects = sortPortfolio(caseStudies);
  const currentIndex = orderedProjects.findIndex((entry) => entry.slug === slug);
  const previousCase = orderedProjects[(currentIndex - 1 + orderedProjects.length) % orderedProjects.length];
  const nextCase = orderedProjects[(currentIndex + 1) % orderedProjects.length];
  const pageUrl = new URL(`/cases/${item.slug}`, origin).toString();
  const galleryCandidates: ProjectGalleryImage[] = [
    { src: item.image, width: item.imageWidth, height: item.imageHeight, alt: item.imageAlt, caption: item.imageAlt },
    ...(item.resultImage ? [{
      src: item.resultImage,
      width: item.resultImageWidth ?? item.imageWidth,
      height: item.resultImageHeight ?? item.imageHeight,
      alt: item.resultImageAlt ?? `Дополнительный кадр проекта «${item.title}»`,
      caption: item.resultImageAlt ?? "Материалы проекта",
    }] : []),
    ...(item.gallery ?? []),
  ];
  const seenImages = new Set<string>();
  const galleryImages = galleryCandidates.filter((media) => {
    if (seenImages.has(media.src)) return false;
    seenImages.add(media.src);
    return true;
  });
  const projectImages = [...new Set([
    ...galleryImages.map((media) => media.src),
    ...(item.videos?.map((media) => media.poster) ?? []),
  ])].filter((path): path is string => Boolean(path)).map((path) => new URL(path, origin).toString());
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: item.title,
      description: item.task,
      url: pageUrl,
      image: projectImages,
      about: item.category,
      keywords: item.technology.join(", "),
      inLanguage: "ru-RU",
      creator: item.slug === "parshin-sculptures"
        ? { "@type": "Person", name: "Фёдор Паршин" }
        : undefined,
      contributor: { "@type": "Organization", name: "Step3D", url: "https://step3d.tech/" },
      isPartOf: { "@type": "CollectionPage", name: "Проекты команды — ТРИФОТИ", url: `${origin}/projects` },
      mainEntityOfPage: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: origin },
        { "@type": "ListItem", position: 2, name: "Проекты", item: `${origin}/projects` },
        { "@type": "ListItem", position: 3, name: item.title, item: pageUrl },
      ],
    },
  ];

  const route = getProjectRoute(slug);
  const projectLabel = slug === "red7-art"
    ? "Проектная разработка"
    : "Реализованный проект";
  const requestHref = getProjectBriefHref(slug);
  const mediaCount = galleryImages.length + (item.videos?.length ?? 0);
  const mediaWord = mediaCount % 10 === 1 && mediaCount % 100 !== 11
    ? "материал"
    : mediaCount % 10 >= 2 && mediaCount % 10 <= 4 && (mediaCount % 100 < 12 || mediaCount % 100 > 14)
      ? "материала"
      : "материалов";
  const technologySummary = `${item.technology.slice(0, 2).join(" · ")}${item.technology.length > 2 ? ` · ещё ${item.technology.length - 2}` : ""}`;
  const summaryItems = item.highlights ?? [
    { label: "Статус", value: projectLabel },
    { label: slug === "red7-art" ? "Контекст" : "Материалы", value: slug === "red7-art" ? "Архитектура RED7" : item.source ? "Публикация проекта" : item.sourceLabel ?? "Материалы Step3D" },
    { label: slug === "red7-art" ? "Предложенные технологии" : "Основные технологии", value: technologySummary },
    { label: "Фото и видео", value: `${mediaCount} ${mediaWord}` },
  ];

  return (
    <>
      <InnerHeader backHref="/projects" backLabel="Все проекты" activeHref="/projects" requestHref={requestHref} />
      <main className="case-page" id="content" tabIndex={-1}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Проекты", href: "/projects" }, { label: item.title }]} />
      <section className="case-hero">
        <div>
          <p className="kicker">{projectLabel} · {item.category}</p><p className="tri-case-credit">{item.slug === "parshin-sculptures" ? "Автор: Фёдор Паршин · изготовление с командой Step3D" : "Из портфолио команды Step3D"}</p>
          <h1>{item.title}</h1>
          <p>{item.task}</p>
          <div className="case-hero-actions">
            <Link className="button primary" href={requestHref}>Обсудить похожий проект <span>↗</span></Link>
            {item.source
              ? <a className="button ghost" href={item.source} target="_blank" rel="noopener noreferrer">{slug === "red7-art" ? "Архитектурный контекст" : "Публикация проекта"} ↗</a>
              : <span className="case-source-note">{item.sourceLabel ?? "Материалы Step3D"}</span>}
          </div>
        </div>
        <img src={item.image} alt={item.imageAlt} width={item.imageWidth} height={item.imageHeight} sizes="(max-width: 900px) 100vw, 50vw" decoding="async" fetchPriority="high" style={{ objectPosition: item.imagePosition }} />
      </section>
      <section className="case-summary" aria-label="Кратко о проекте">
        {summaryItems.map((summary) => <div key={summary.label}><span>{summary.label}</span><strong>{summary.value}</strong></div>)}
      </section>
      {item.contribution && <section className="case-contribution"><p className="kicker">Работа команды</p><h2>Авторство и вклад команды</h2><p>{item.contribution}</p></section>}
      <section className="case-details tri-case-details">
        <article><span>01</span><h2>Исходные данные</h2><p>{item.input}</p></article>
        <article><span>02</span><h2>{slug === "red7-art" ? "Предусмотрено проектом" : "Технологии"}</h2><ul>{item.technology.map((technology) => <li key={technology}>{technology}</li>)}</ul></article>
        <article>
          <span>03</span><h2>Результат</h2><p>{item.result}</p>
          {slug === "std-award" && <p><strong>Срок этого проекта:</strong> {item.timing}. График нового заказа согласуем после оценки задачи.</p>}
          {(slug === "pletneva-costume" || slug === "red7-art") && (
            <details className="tri-case-archive">
              <summary>Архивные условия проекта</summary>
              {slug === "red7-art" && <p>{item.timing}</p>}
              <p>{item.budget}</p>
              <p>Для нового проекта рассчитываем смету и срок по его составу работ.</p>
            </details>
          )}
        </article>
      </section>
      <ProjectGallery images={galleryImages} title={item.title} />
      {item.videos && item.videos.length > 0 && (
        <section className="case-videos" aria-labelledby="case-videos-title">
          <div className="case-video-heading">
            <p className="kicker">Видео проекта</p>
            <h2 id="case-videos-title">Процесс в движении.</h2>
          </div>
          <div className="case-video-grid">
            {item.videos.map((media, index) => (
              <figure className={`case-video-card ${media.height > media.width ? "case-video-card-portrait" : "case-video-card-landscape"}`} key={media.src}>
                <video
                  controls
                  muted
                  playsInline
                  preload="none"
                  poster={media.poster}
                  width={media.width}
                  height={media.height}
                  aria-label={media.title}
                >
                  <source src={media.src} type="video/mp4" />
                </video>
                <figcaption>
                  <span>0{index + 1}</span>
                  <div><strong>{media.title}</strong><p>{media.caption}</p></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
      {item.slug === "pletneva-costume" && <section className="case-engineering" id="engineering" aria-labelledby="case-engineering-title"><p className="kicker">Инженерный разбор</p><h2 id="case-engineering-title">Посадка. Соединения. Движение.</h2><p>Техническая задача этого проекта — перенести сценический образ в модульную конструкцию, которую можно собрать и примерить.</p><dl><div><dt>Что было на входе</dt><dd>Концепция образа, 3D-скан фигуры и требования к посадке и подвижности.</dd></div><div><dt>Что подготовила команда</dt><dd>Цифровую геометрию и отдельные печатные модули для корпуса и плечевых накладок.</dd></div><div><dt>Как проверяли</dt><dd>Собирали детали, проводили примерки и подгоняли взаимное положение элементов.</dd></div><div><dt>Что получили</dt><dd>Собранный сценический костюм. Фотографии и видео выше показывают промежуточные этапы и готовый образ.</dd></div></dl><p className="evidence-note">Параметры нового костюма уточняем с учётом движений, примерок и даты выступления.</p></section>}
      <section className="case-next-step" aria-labelledby="case-next-step-title">
        <div className="case-next-step-heading">
          <div><p className="kicker">Похожая задача</p><h2 id="case-next-step-title">Хотите похожий<br /><em>результат?</em></h2></div>
          <p>Полное техническое задание не обязательно. Для первой оценки достаточно исходных материалов и нескольких ключевых параметров.</p>
        </div>
        <div className="case-next-step-grid">
          <article><span>01</span><h3>Что прислать</h3><p>{route.materials}</p></article>
          <article><span>02</span><h3>Что проверим</h3><p>{route.serviceHref === "/services/stage-objects"
            ? "Посадку, вес, движения, соединения, этапы примерки и готовность к дате события."
            : "Размеры, способ производства, поверхность, сборку, срок и требуемый тираж."}</p></article>
          <article><span>03</span><h3>Что получите</h3><p>Предложение по реализации, ориентир бюджета и список данных для точной сметы.</p></article>
        </div>
        <div className="case-next-step-actions"><Link className="button ghost" href={route.serviceHref}>Подробнее: {route.serviceLabel} <span>↗</span></Link><Link className="button primary" href={requestHref}>Обсудить похожий проект <span>↗</span></Link></div>
      </section>
      <nav className="case-pagination" aria-label="Другие проекты Step3D">
        <Link href={`/cases/${previousCase.slug}`}><span>← Предыдущий проект</span><strong>{previousCase.title}</strong></Link>
        <Link href={`/cases/${nextCase.slug}`}><span>Следующий проект →</span><strong>{nextCase.title}</strong></Link>
      </nav>
      <section className="case-cta">
        <p className="kicker">Ваш проект</p>
        <h2>Начнём с того,<br /><em>что уже есть.</em></h2>
        <Link className="button primary" href={requestHref}>Обсудить проект <span>↗</span></Link>
      </section>
      <SiteFooter />
        <DetailContactBar requestHref={requestHref} context={`проект, похожий на «${item.title}»`} />
      </main>
    </>
  );
}
