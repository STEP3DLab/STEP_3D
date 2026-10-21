"use client";

import Image from "next/image";
import { useRef, useState, useSyncExternalStore } from "react";

function track(event: string, source: string) {
  window.dispatchEvent(new CustomEvent("step3d:conversion", { detail: { event, source } }));
}

function subscribeToScreen(onChange: () => void) {
  const screen = window.matchMedia("(max-width: 600px)");
  screen.addEventListener("change", onChange);
  return () => screen.removeEventListener("change", onChange);
}
const mobileScreen = () => window.matchMedia("(max-width: 600px)").matches;
const serverScreen = () => false;

export function PortfolioDownload({ source = "portfolio", className = "button ghost" }: { source?: string; className?: string }) {
  return <a className={className} href="/downloads/step3d-portfolio.pdf" download="Step3D-Portfolio.pdf" onClick={() => track("portfolio_download", source)}>Скачать презентацию <span aria-hidden="true">↓</span><small>PDF · 10 страниц</small></a>;
}

export function ProjectMaterials({ compact: isCompact = false }: { compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const tracked = useRef(false);
  const player = useRef<HTMLVideoElement>(null);
  const compact = useSyncExternalStore(subscribeToScreen, mobileScreen, serverScreen);
  const [format, setFormat] = useState<boolean | null>(null);
  const vertical = format ?? compact;
  const chooseFormat = (value: boolean) => { player.current?.pause(); setFormat(value); };
  return <section id="materials" className={`project-materials${isCompact ? " materials-compact" : ""}`} aria-labelledby="materials-title">
    <header className="materials-heading">
      <div><p className="kicker">Step3D в движении</p><h2 id="materials-title">Увидеть форму.<br /><em>Почувствовать масштаб.</em></h2></div>
      <p>42 секунды внутри наших проектов — от цифровой модели и печати до объектов в пространстве.</p>
    </header>
    {isCompact && <div className="materials-quick-actions"><button type="button" className="button primary" aria-expanded={expanded} aria-controls="materials-content" onClick={() => { player.current?.pause(); setExpanded(value => !value); }}>{expanded ? "Скрыть ролик" : "Смотреть ролик · 42 секунды"}</button><PortfolioDownload source="home_compact" /></div>}
    {(!isCompact || expanded) && <div id="materials-content"><div className="materials-toolbar"><span>Избранные проекты / 00:42</span><div className="materials-formats" role="group" aria-label="Формат ролика"><button type="button" aria-pressed={!vertical} onClick={() => chooseFormat(false)}>Широкий экран</button><button type="button" aria-pressed={vertical} onClick={() => chooseFormat(true)}>Для телефона</button></div></div>
    <div className={`project-materials-media${vertical ? " is-vertical" : ""}`}>
      <video ref={player} key={String(vertical)} controls playsInline preload="none" poster={vertical ? "/images/step3d-showreel-vertical-poster.webp" : "/images/step3d-showreel-poster.webp"} width={vertical ? 1080 : 1920} height={vertical ? 1920 : 1080} aria-label="Избранные проекты Step3D, 42 секунды, с музыкой и подписями" onPlay={() => { if (!tracked.current) { track("showreel_play", "home_materials"); tracked.current = true; } }}>
        <source src={vertical ? "/videos/step3d-showreel-vertical.mp4" : "/videos/step3d-showreel.mp4"} type="video/mp4" />
        Ваш браузер не поддерживает видео. <a href="/videos/step3d-showreel.mp4">Скачать ролик</a>
      </video>
    </div>
    <div className="materials-caption"><p>Реальные объекты. Кадры из мастерской. Крупные планы деталей.</p><details><summary>Проекты в ролике</summary><p>Костюм Анны Плетнёвой: модель, печать, соединения, примерка и готовый образ. Интерьерные панно на проспекте Академика Сахарова, 7. Скульптура Фёдора Паршина, изготовленная при участии Step3D. Награды для премии СТД России и переходящий кубок Спартакиады РТО. Музыка без речи; смысл передают подписи.</p></details></div>
    </div>}
    {!isCompact && <div className="materials-presentation">
      <a className="materials-cover" href="/downloads/step3d-portfolio.pdf" target="_blank" rel="noopener noreferrer" aria-label="Открыть презентацию Step3D в PDF" onClick={() => track("portfolio_download", "home_cover")}><Image unoptimized src="/images/step3d-presentation-cover.webp" alt="Обложка презентации Step3D со сценическим костюмом Анны Плетнёвой" width={1280} height={720} sizes="(max-width: 800px) 100vw, 45vw" /></a>
      <div><p className="kicker">Для вашей команды</p><h3>Пять проектов.<br />Одна мастерская.</h3><p>Сценические образы, интерьерный арт, скульптура и награды. Наш вклад, процесс и результат — в презентации, которую удобно переслать коллегам.</p><PortfolioDownload source="home_materials" className="button primary" /></div>
    </div>
    }
  </section>;
}
