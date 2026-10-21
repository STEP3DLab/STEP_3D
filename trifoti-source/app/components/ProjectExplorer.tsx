"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { caseStudies } from "../case-data";
import { getProjectRoute, portfolioOrder, projectFilters, sortPortfolio, type ProjectFilter } from "../project-routing";
import "./project-shortlist.css";

const SHORTLIST_LIMIT = 3;

type ProjectShortlist = {
  slugs: string[];
  notice: string;
  limitSlug: string | null;
};

function projectWord(count: number) {
  const tail = count % 10;
  const teens = count % 100 >= 11 && count % 100 <= 14;
  if (tail === 1 && !teens) return "проект";
  if (tail >= 2 && tail <= 4 && !teens) return "проекта";
  return "проектов";
}

function frameWord(count: number) {
  const tail = count % 10;
  const teens = count % 100 >= 11 && count % 100 <= 14;
  if (tail === 1 && !teens) return "кадр";
  if (tail >= 2 && tail <= 4 && !teens) return "кадра";
  return "кадров";
}

export function ProjectExplorer() {
  const [filter, setFilter] = useState<ProjectFilter>("Все");
  const [query, setQuery] = useState("");
  const [shortlist, setShortlist] = useState<ProjectShortlist>({ slugs: [], notice: "", limitSlug: null });
  const searchRef = useRef<HTMLInputElement>(null);
  const normalize = (value: string) => value.toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/\s+/g, " ").trim();
  const queryWords = normalize(query).split(" ").filter(Boolean);
  const normalizedQuery = queryWords.join(" ");
  const projects = useMemo(() => sortPortfolio(caseStudies.filter((item) => {
    const route = getProjectRoute(item.slug);
    const matchesFilter = filter === "Все" || route.filter === filter;
    const searchText = normalize([item.title, item.category, route.filter, route.serviceLabel, item.task, item.result, ...item.technology].join(" "));
    return matchesFilter && normalizedQuery.split(" ").every((word) => searchText.includes(word));
  })), [filter, normalizedQuery]);
  const shortlistedProjects = shortlist.slugs
    .map((slug) => caseStudies.find((item) => item.slug === slug))
    .filter((item): item is (typeof caseStudies)[number] => Boolean(item));
  const shortlistHref = `/?refs=${encodeURIComponent(shortlist.slugs.join(","))}&step=2&source=portfolio_shortlist#request`;

  function toggleShortlist(slug: string) {
    const project = caseStudies.find((item) => item.slug === slug);
    if (!project) return;
    setShortlist((current) => {
      if (current.slugs.includes(slug)) {
        return {
          slugs: current.slugs.filter((item) => item !== slug),
          notice: `Работа «${project.title}» убрана из подборки.`,
          limitSlug: null,
        };
      }
      if (current.slugs.length >= SHORTLIST_LIMIT) {
        return {
          ...current,
          notice: "В подборке уже три работы. Уберите одну, чтобы добавить другую.",
          limitSlug: slug,
        };
      }
      const slugs = [...current.slugs, slug];
      return {
        slugs,
        notice: `Работа «${project.title}» добавлена. Выбрано ${slugs.length} из ${SHORTLIST_LIMIT}.`,
        limitSlug: null,
      };
    });
  }

  function reset() {
    setFilter("Все");
    setQuery("");
    searchRef.current?.focus();
  }

  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }

  const hasSelection = filter !== "Все" || Boolean(normalizedQuery);

  return (
    <section className="projects-explorer" aria-labelledby="projects-explorer-title">
      <h2 className="sr-only" id="projects-explorer-title">Каталог проектов команды ТРИФОТИ</h2>
      <div className="projects-toolbar">
        <div className="projects-search">
          <label htmlFor="project-search">Поиск по проектам</label>
          <div>
            <input ref={searchRef} id="project-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Награда, скульптура, интерьер" />
            {query && <button type="button" onClick={clearSearch} aria-label="Очистить поиск">×</button>}
          </div>
        </div>
        <div className="projects-filters" role="group" aria-label="Фильтр проектов">
          {projectFilters.map((item) => <button type="button" className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)} key={item}>{item}</button>)}
        </div>
        <div className="projects-toolbar-meta">
          <p aria-live="polite"><strong>{projects.length}</strong> {projectWord(projects.length)}</p>
          {hasSelection && <button type="button" onClick={reset}>Сбросить</button>}
        </div>
      </div>

      <section className="tri-shortlist" id="project-shortlist" aria-labelledby="project-shortlist-title">
        <div className="tri-shortlist-heading">
          <div>
            <p className="tri-shortlist-eyebrow">Художественные ориентиры</p>
            <h3 id="project-shortlist-title">Подборка для вашей идеи</h3>
            <p id="project-shortlist-hint">Выберите до трёх работ, близких вашей идее.</p>
          </div>
          <span className="tri-shortlist-count" aria-label={`Выбрано ${shortlistedProjects.length} из ${SHORTLIST_LIMIT}`}>
            {shortlistedProjects.length}<small> / {SHORTLIST_LIMIT}</small>
          </span>
        </div>
        {shortlistedProjects.length > 0 && (
          <ul className="tri-shortlist-items" aria-label="Выбранные работы">
            {shortlistedProjects.map((item) => (
              <li key={item.slug}>
                <img src={item.image} alt="" width={64} height={76} loading="lazy" decoding="async" style={{ objectPosition: item.imagePosition }} />
                <span>{item.title}</span>
                <button type="button" onClick={() => toggleShortlist(item.slug)} aria-label={`Убрать «${item.title}» из подборки`} title="Убрать из подборки">×</button>
              </li>
            ))}
          </ul>
        )}
        <div className="tri-shortlist-footer">
          <p className="tri-shortlist-notice" role="status" aria-live="polite" aria-atomic="true">
            {shortlist.notice || "Можно сочетать форму, фактуру и настроение разных работ."}
          </p>
          {shortlistedProjects.length > 0
            ? <Link className="tri-shortlist-transfer" href={shortlistHref}>Перенести в бриф <span aria-hidden="true">↗</span></Link>
            : <button className="tri-shortlist-transfer" type="button" disabled>Перенести в бриф <span aria-hidden="true">↗</span></button>}
        </div>
      </section>

      {projects.length > 0 ? (
        <div className="projects-index-grid">
          {projects.map((item, index) => {
            const route = getProjectRoute(item.slug);
            const ratio = item.imageWidth / item.imageHeight;
            const format = ratio > 1.2 ? "wide" : ratio > .9 ? "square" : "portrait";
            const status = item.slug === "red7-art" ? "Проектная разработка" : "Реализовано";
            const imageCount = new Set([item.image, item.resultImage, ...(item.gallery?.map(media => media.src) ?? [])].filter(Boolean)).size;
            const videoCount = item.videos?.length ?? 0;
            const isShortlisted = shortlist.slugs.includes(item.slug);
            return (
              <article className={`projects-index-card projects-index-card-${format}`} key={item.slug}>
                <Link className="projects-index-image" href={`/cases/${item.slug}`}>
                  <img src={item.image} alt={item.imageAlt} width={item.imageWidth} height={item.imageHeight} loading={index < 2 ? "eager" : "lazy"} decoding="async" style={{ objectPosition: item.imagePosition }} />
                  <span>{status}</span>
                  <i aria-hidden="true">{String(portfolioOrder.indexOf(item.slug) + 1).padStart(2, "0")}</i>
                </Link>
                <div className="projects-index-copy">
                  <p>{route.filter}</p>
                  <h3><Link href={`/cases/${item.slug}`}>{item.title}</Link></h3>
                  <strong>{item.result}</strong>
                  <ul className="projects-index-evidence" aria-label="Фотографии и видео проекта">
                    <li>{item.slug === "red7-art" ? "Проектная визуализация" : `${imageCount} ${frameWord(imageCount)} проекта`}</li>
                    {videoCount > 0 && <li>{videoCount} видео</li>}
                  </ul>
                  <div>
                    <Link href={`/cases/${item.slug}`}>Открыть кейс <span>→</span></Link>
                    <button className={`tri-shortlist-toggle${isShortlisted ? " is-selected" : ""}`} type="button" aria-pressed={isShortlisted} aria-describedby="project-shortlist-hint" onClick={() => toggleShortlist(item.slug)}>
                      {isShortlisted ? "В подборке" : "В подборку"}<span aria-hidden="true">{isShortlisted ? "✓" : "+"}</span>
                    </button>
                  </div>
                  {(isShortlisted || shortlist.limitSlug === item.slug) && (
                    <p className="tri-shortlist-card-note">
                      {shortlist.limitSlug === item.slug && <span>Уже выбраны три работы. Уберите одну, чтобы добавить эту.</span>}
                      <a href="#project-shortlist">К подборке · {shortlist.slugs.length}/{SHORTLIST_LIMIT} <span aria-hidden="true">↑</span></a>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="projects-empty" role="status">
          <span>Ничего не найдено</span>
          <h3>Измените запрос или покажите все проекты.</h3>
          <button type="button" onClick={reset}>Показать все проекты</button>
        </div>
      )}
    </section>
  );
}
