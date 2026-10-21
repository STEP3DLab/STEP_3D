/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { DetailContactBar, SiteFooter } from "../../components/SiteFooter";
import { InnerHeader } from "../../components/InnerHeader";
import { caseStudies } from "../../case-data";
import { serviceGuides, servicePages } from "../../service-data";

const origin = "https://trifoti.step3d.chatgpt.site";

const awardFaqs = [
  ["Можно заказать одну награду?", "Да. Изготавливаем как единичные авторские объекты, так и серии с персонализацией каждого экземпляра."],
  ["Можно начать только с идеи?", "Да. Поможем найти образ, соберём референсы, разработаем концепцию и переведём её в производственную 3D-модель."],
  ["Как определить срок изготовления?", "Сообщите дату события и количество наград. Проверим объём дизайна, этапы согласования, производство и отделку, затем предложим реалистичный график."],
  ["Сначала можно увидеть образец?", "Да. Перед серией согласуем цифровую модель, визуализацию или физический прототип — в зависимости от проекта и срока."],
  ["Делаете шильды, имена и разные номинации?", "Да. Персонализируем основания, таблички, надписи, цвета и упаковку по согласованному списку получателей."],
  ["Работаете с организациями?", "Да. Готовим коммерческое предложение, договор, поэтапное согласование и закрывающие документы."],
] as const;

export function generateStaticParams() {
  return servicePages.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = servicePages.find((item) => item.slug === slug);
  if (!service) return {};
  const pageUrl = new URL(`/services/${service.slug}`, origin).toString();
  const relatedCase = service.relatedCaseSlugs
    .map((caseSlug) => caseStudies.find((item) => item.slug === caseSlug))
    .find(Boolean);
  const imageUrl = new URL(relatedCase?.image ?? "/images/cases/sakharov-art/ring-installed.webp", origin).toString();
  const metadataTitle = service.seoTitle ?? service.title;
  const keywords = service.slug === "awards"
    ? ["кубки на заказ", "награды на заказ", "авторские статуэтки", "корпоративные награды", "переходящий кубок", "изготовление наград Москва"]
    : service.slug === "stage-objects"
      ? ["сценические костюмы на заказ", "сценические маски", "короны на заказ", "сценический реквизит", "3D-печать костюма"]
    : service.slug === "3d-modeling"
      ? ["3D-моделирование на заказ", "CAD-моделирование", "создание 3D-модели", "подготовка модели к 3D-печати", "3D-моделирование Москва"]
      : undefined;

  return {
    title: metadataTitle,
    description: service.description,
    keywords,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      title: `${metadataTitle} — ТРИФОТИ`,
      description: service.description,
      url: pageUrl,
      images: [{
        url: imageUrl,
        width: relatedCase?.imageWidth ?? 1152,
        height: relatedCase?.imageHeight ?? 1536,
        alt: relatedCase?.imageAlt ?? "Интерьерная композиция из портфолио команды ТРИФОТИ",
      }],
    },
    twitter: { card: "summary_large_image", title: `${metadataTitle} — ТРИФОТИ`, description: service.description, images: [imageUrl] },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = servicePages.find((item) => item.slug === slug);
  if (!service) notFound();
  const relatedCases = service.relatedCaseSlugs
    .map((caseSlug) => caseStudies.find((item) => item.slug === caseSlug))
    .filter((item): item is (typeof caseStudies)[number] => Boolean(item));
  const requestHref = `/?type=${encodeURIComponent(service.requestType)}&step=2&source=${encodeURIComponent(`service_${service.slug}`)}#request`;
  const guide = serviceGuides[service.slug];
  const pageFaqs = service.slug === "awards" ? awardFaqs : guide?.faqs ?? [];
  const pageUrl = new URL(`/services/${service.slug}`, origin).toString();
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.title,
      serviceType: service.shortTitle,
      description: service.description,
      url: pageUrl,
      areaServed: "Россия",
      provider: { "@type": "ProfessionalService", "@id": `${origin}/#studio`, name: "ТРИФОТИ", url: origin },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: origin },
        { "@type": "ListItem", position: 2, name: "Услуги", item: `${origin}/services` },
        { "@type": "ListItem", position: 3, name: service.title, item: pageUrl },
      ],
    },
    ...(pageFaqs.length > 0 ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: pageFaqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    }] : []),
  ];

  if (service.slug === "awards") {
    return (
      <>
        <InnerHeader backHref="/services" backLabel="Все услуги" activeHref="/services" requestHref={requestHref} />
        <main className="award-page" id="content" tabIndex={-1}>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Услуги", href: "/services" }, { label: service.shortTitle }]} />
          <nav className="award-subnav" aria-label="Разделы страницы наград"><a href="#award-budget">Стоимость</a><a href="#award-formats">Форматы</a><a href="#award-process">Процесс</a><a href="#award-projects">Проекты</a><a href="#award-faq">Вопросы</a></nav>

        <section className="award-hero" aria-labelledby="award-title">
          <div className="award-hero-copy">
            <p className="kicker light">ТРИФОТИ / Авторские награды</p>
            <h1 id="award-title">Кубки и награды <em>с характером.</em></h1>
            <p>Создаём авторские кубки, статуэтки и награды — от идеи и 3D-модели до готового изделия, персонализации и серии.</p>
            <div className="award-hero-actions">
              <Link className="button primary" href={requestHref}>Обсудить награду <span>↗</span></Link>
              <a className="button ghost" href="#award-projects">Смотреть проекты <span>↓</span></a>
            </div>
            <ul className="award-hero-facts" aria-label="Ключевые возможности">
              <li><strong>Образ</strong><span>в характере события</span></li>
              <li><strong>Образец</strong><span>перед выпуском серии</span></li>
              <li><strong>Детали</strong><span>имена, номинации, отделка</span></li>
            </ul>
          </div>
          <figure className="award-hero-visual">
            <img src="/images/cases/std-award/award-series.webp" alt="Серия авторских наград для премии Союза театральных деятелей России" width="1536" height="1152" fetchPriority="high" decoding="async" />
            <figcaption><span>Опыт команды Step3D</span><strong>Награды для премии СТД России</strong><Link href="/cases/std-award">Смотреть кейс ↗</Link></figcaption>
          </figure>
        </section>

        <section className="award-proof-line" aria-label="Подтверждённый опыт">
          <p>В портфолио команды Step3D — серия наград для премии Союза театральных деятелей России. В кейсе показаны разработка, изготовленные объекты и вручение на церемонии.</p>
          <Link href="/cases/std-award">Посмотреть проект по этапам <span>↗</span></Link>
        </section>

        <section className="award-calc-section" id="award-budget" aria-labelledby="award-budget-title">
          <div className="award-section-heading">
            <div><p className="kicker">Стоимость</p><h2 id="award-budget-title">Рассчитаем<br /><em>по проекту.</em></h2></div>
            <p>Смета зависит от формы, размера, тиража, отделки, персонализации и даты события. Сначала уточним задачу и согласуем состав работ.</p>
          </div>
          <div className="service-brief-columns">
            <article><span>01</span><h3>Что влияет на стоимость</h3><ul><li>Разработка художественного образа и модели</li><li>Габариты, конструкция и технология изготовления</li><li>Количество экземпляров и уровень отделки</li><li>Персонализация, упаковка и срок</li></ul></article>
            <article><span>02</span><h3>Что прислать для оценки</h3><ul><li>Название и характер события</li><li>Дату церемонии и количество наград</li><li>Примерный размер и референсы</li><li>Пожелания по номинациям и персонализации</li></ul></article>
          </div>
          <Link className="button primary" href={requestHref}>Передать задачу на оценку <span>↗</span></Link>
        </section>

        <section className="award-story" aria-labelledby="award-story-title">
          <figure><img src="/images/cases/std-award/award-ceremony.webp" alt="Награда Step3D на церемонии премии СТД России с Владимиром Машковым" width="1536" height="1024" loading="lazy" decoding="async" /></figure>
          <div>
            <p className="kicker light">Награда для сцены и кадра</p>
            <h2 id="award-story-title">От доски с идеями — <em>до сцены.</em></h2>
            <p>Форма должна работать в руках лауреата, в кадре и рядом с айдентикой события. Поэтому мы проектируем не только силуэт, но и основание, устойчивость, вес, табличку, поверхность и повторяемость серии.</p>
            <dl><div><dt>Концепция</dt><dd>Образ, связанный с событием и брендом</dd></div><div><dt>Производство</dt><dd>3D-модель, печать, сборка и ручная отделка</dd></div><div><dt>Передача</dt><dd>Персонализация, упаковка и готовность к церемонии</dd></div></dl>
          </div>
        </section>

        <section className="award-formats" id="award-formats" aria-labelledby="award-formats-title">
          <div className="award-section-heading"><div><p className="kicker">Форматы заказа</p><h2 id="award-formats-title">Один образ.<br /><em>От экземпляра до серии.</em></h2></div><p>Выберите близкий формат — детали и состав работ уточним после короткого брифа.</p></div>
          <div className="award-format-grid">
            <article><span>01</span><h3>Единичная награда</h3><p>Авторский объект для специального события, юбилея, победителя или памятного подарка.</p><ul><li>уникальная форма</li><li>один экземпляр</li><li>индивидуальная отделка</li></ul></article>
            <article><span>02</span><h3>Серия для премии</h3><p>Единая форма с именами, номинациями, цветами или табличками для каждого лауреата.</p><ul><li>эталонный образец</li><li>повторяемость серии</li><li>персонализация</li></ul></article>
            <article><span>03</span><h3>Переходящий кубок</h3><p>Выразительный и долговечный объект с возможностью ежегодного обновления данных победителя.</p><ul><li>устойчивая конструкция</li><li>сменные шильды</li><li>транспортная упаковка</li></ul></article>
          </div>
        </section>

        <section className="service-process award-process" id="award-process" aria-labelledby="award-process-title">
          <div className="service-process-heading"><p className="kicker light">Рабочий процесс</p><h2 id="award-process-title">От идеи<br /><em>к готовой серии.</em></h2><p>Согласуем результат каждого этапа: образ, модель, физический образец и тираж.</p></div>
          <ol>{service.process.map((step, index) => <li key={step.title}><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
        </section>

        <section className="service-related award-related" id="award-projects" aria-labelledby="award-related-title">
          <div className="service-related-heading"><p className="kicker">Опыт команды</p><h2 id="award-related-title">Уже вручены.</h2><p>Проекты Step3D: готовые награды, материалы производства и кадры с церемоний.</p></div>
          <div className="service-related-grid">{relatedCases.map((item) => <article key={item.slug}><Link href={`/cases/${item.slug}`} className="service-related-image"><img src={item.image} alt={item.imageAlt} width={item.imageWidth} height={item.imageHeight} loading="lazy" decoding="async" style={{ objectPosition: item.imagePosition }} /></Link><p>{item.category}</p><h3><Link href={`/cases/${item.slug}`}>{item.title}</Link></h3><Link className="service-related-link" href={`/cases/${item.slug}`}>Смотреть кейс →</Link></article>)}</div>
        </section>

        <section className="award-faq" id="award-faq" aria-labelledby="award-faq-title">
          <div><p className="kicker">До начала проекта</p><h2 id="award-faq-title">Что обычно<br /><em>спрашивают.</em></h2></div>
          <div>{awardFaqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="service-cta award-cta">
          <p className="kicker light">Ваше событие</p>
          <h2>Расскажите о событии<br /><em>и будущей награде.</em></h2>
          <p>Достаточно даты церемонии, количества, примерного размера и референсов. Если дизайна ещё нет — начнём с идеи.</p>
          <Link className="button primary" href={requestHref}>Запросить смету <span>↗</span></Link>
        </section>

        <nav className="service-directory" aria-label="Другие направления ТРИФОТИ">{servicePages.filter((item) => item.slug !== service.slug).map((item) => <Link href={`/services/${item.slug}`} key={item.slug}>{item.shortTitle}<span>↗</span></Link>)}</nav>
        <SiteFooter />
          <DetailContactBar requestHref={requestHref} context="награду или кубок на заказ" />
        </main>
      </>
    );
  }

  return (
    <>
      <InnerHeader backHref="/services" backLabel="Все услуги" activeHref="/services" requestHref={requestHref} />
      <main className="service-page" id="content" tabIndex={-1}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Услуги", href: "/services" }, { label: service.shortTitle }]} />

      <section className="service-hero">
        <div className="service-hero-copy">
          <p className="kicker">ТРИФОТИ / Направление студии</p>
          <h1>{service.title}</h1>
          <p>{service.lead}</p>
          <div className="service-hero-actions">
            <Link className="button primary" href={requestHref}>Обсудить проект <span>↗</span></Link>
            {service.slug === "stage-objects"
              ? <a className="button ghost" href="#service-related">Смотреть проекты для сцены <span>↓</span></a>
              : <Link className="button ghost" href="/projects">Смотреть проекты <span>→</span></Link>}
          </div>
        </div>
        {service.slug === "stage-objects" ? (
          <figure className="tri-inner-visual">
            <img src="/images/pletneva-costume.webp" alt="Серебристый сценический костюм Анны Плетнёвой из портфолио команды Step3D" width="1080" height="1456" fetchPriority="high" decoding="async" />
            <figcaption>Сценический костюм Анны Плетнёвой · опыт команды Step3D. <Link href="/cases/pletneva-costume">Смотреть разработку и примерки ↗</Link></figcaption>
          </figure>
        ) : <aside className="service-proof" aria-label="Принцип работы ТРИФОТИ">
          <span>Перед стартом</span>
          <h2>Проверяем задачу до старта.</h2>
          <ul>
            <li>фиксируем назначение и критерии результата;</li>
            <li>оцениваем исходные данные и ограничения;</li>
            <li>предлагаем состав работ и этапы проверки;</li>
            <li>согласовываем смету до производства.</li>
          </ul>
          <p>Итоговую технологию выбираем после инженерной оценки.</p>
        </aside>}
      </section>

      <section className="service-blocks" aria-label="Состав услуги">
        <article>
          <span>01</span>
          <h2>Подходит для</h2>
          <ul>{service.suitableFor.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article>
          <span>02</span>
          <h2>Что получаете</h2>
          <ul>{service.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </section>

      {guide && (
        <section className="service-brief-guide" aria-labelledby="service-brief-guide-title">
          <div className="service-brief-heading">
            <p className="kicker">До расчёта</p>
            <h2 id="service-brief-guide-title">Рассчитаем<br /><em>по проекту.</em></h2>
            <p>{service.slug === "stage-objects"
              ? "Начнём с образа и условий использования. Эскиз, мерки, движения и дата события помогут определить конструкцию, объём примерок и порядок изготовления."
              : "Для оценки нужны назначение объекта, исходные материалы, габариты, количество и желаемый срок. Состав работ и смету согласуем до начала производства."}</p>
          </div>
          <div className="service-brief-columns">
            <article><span>01</span><h3>Влияет на оценку</h3><ul>{guide.pricingFactors.map((item) => <li key={item}>{item}</li>)}</ul></article>
            <article><span>02</span><h3>Что прислать</h3><ul>{guide.projectBrief.map((item) => <li key={item}>{item}</li>)}</ul></article>
          </div>
        </section>
      )}

      <section className="service-process" aria-labelledby="service-process-title">
        <div className="service-process-heading">
          <p className="kicker light">Рабочий процесс</p>
          <h2 id="service-process-title">От задачи<br /><em>к результату.</em></h2>
          <p>{service.slug === "stage-objects"
            ? "Проверяем не только силуэт. На согласованных этапах уточняем посадку, соединения и движения, затем доводим поверхность и финальную сборку."
            : "Состав этапов зависит от задачи. Сначала фиксируем требования, затем согласуем модель и запускаем производство."}</p>
        </div>
        <ol>
          {service.process.map((step, index) => (
            <li key={step.title}>
              <span>0{index + 1}</span>
              <div><h3>{step.title}</h3><p>{step.text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      {relatedCases.length > 0 && (
        <section className="service-related" id="service-related" aria-labelledby="service-related-title">
          <div className="service-related-heading">
            <p className="kicker">Опыт участников студии</p>
            <h2 id="service-related-title">Избранные проекты.</h2>
            <p>{service.slug === "stage-objects"
              ? "Костюм, сценическая маска и корона из портфолио команды Step3D. В кейсах — исходная задача, цифровая подготовка и реальные изделия."
              : "Работы участников студии и команды Step3D: задача, подтверждённое авторство, роль команды и результат. Проектные визуализации отмечены отдельно."}</p>
          </div>
          <div className="service-related-grid">
            {relatedCases.map((item) => (
              <article key={item.slug}>
                <Link href={`/cases/${item.slug}`} className="service-related-image">
                  <img src={item.image} alt={item.imageAlt} width={item.imageWidth} height={item.imageHeight} loading="lazy" decoding="async" style={{ objectPosition: item.imagePosition }} />
                </Link>
                <p>{item.slug === "red7-art" ? "Проектная визуализация" : item.category}</p>
                <h3><Link href={`/cases/${item.slug}`}>{item.title}</Link></h3>
                <Link className="service-related-link" href={`/cases/${item.slug}`}>Открыть кейс →</Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {pageFaqs.length > 0 && (
        <section className="service-faq" aria-labelledby="service-faq-title">
          <div><p className="kicker">Перед стартом</p><h2 id="service-faq-title">Коротко о<br /><em>главном.</em></h2></div>
          <div>{pageFaqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
        </section>
      )}

      <section className="service-cta">
        <p className="kicker light">Ваш проект</p>
        <h2>Пришлите то, что уже есть.<br /><em>Предложим план работ.</em></h2>
        <p>{service.slug === "stage-objects"
          ? "Пришлите эскиз или референсы, дату события и коротко опишите, как объект будет использоваться. Остальные данные уточним вместе."
          : "Подойдут идея, фотография, чертёж, 3D-модель или короткое описание задачи."}</p>
        <Link className="button primary" href={requestHref}>Передать задачу на оценку <span>↗</span></Link>
      </section>

      <nav className="service-directory" aria-label="Другие направления ТРИФОТИ">
        {servicePages.filter((item) => item.slug !== service.slug).map((item) => <Link href={`/services/${item.slug}`} key={item.slug}>{item.shortTitle}<span>↗</span></Link>)}
      </nav>
      <SiteFooter />
        <DetailContactBar requestHref={requestHref} context={`услугу «${service.shortTitle}»`} />
      </main>
    </>
  );
}
