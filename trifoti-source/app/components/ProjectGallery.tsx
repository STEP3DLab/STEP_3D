"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./ProjectGallery.module.css";

export type ProjectGalleryImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
};

type ProjectGalleryProps = {
  images: readonly ProjectGalleryImage[];
  title: string;
};

function imageWord(count: number) {
  const tail = count % 10;
  if (count % 100 >= 11 && count % 100 <= 14) return "изображений";
  if (tail === 1) return "изображение";
  if (tail >= 2 && tail <= 4) return "изображения";
  return "изображений";
}

function Arrow({ direction }: { direction: "previous" | "next" }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={direction === "previous" ? "M20 12H4m7-7-7 7 7 7" : "M4 12h16m-7-7 7 7-7 7"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function GalleryImage({ image }: { image: ProjectGalleryImage }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  return <figure className={styles.work} aria-busy={status === "loading"}>
    {status !== "ready" && <div className={styles.imageStatus} role="status"><span aria-hidden="true">{status === "loading" ? "◌" : "↻"}</span><p>{status === "loading" ? "Загружаем изображение…" : "Изображение не загрузилось. Закройте галерею и попробуйте ещё раз."}</p></div>}
    <img src={image.src} alt={image.alt} width={image.width} height={image.height} decoding="async" draggable={false} data-ready={status === "ready"} onLoad={() => setStatus("ready")} onError={() => setStatus("error")} />
  </figure>;
}

export function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const id = useId();
  const headingId = `${id}-heading`;
  const dialogTitleId = `${id}-title`;
  const instructionsId = `${id}-instructions`;
  const isOpen = activeIndex !== null;
  const activeImage = activeIndex === null ? null : images[activeIndex];
  const previewImages = images.slice(0, 4);
  const canNavigate = images.length > 1;

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = triggerRef.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex === null) return;
    thumbnailRefs.current[activeIndex]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "instant" });
    if (images.length < 2) return;
    const adjacentIndexes = new Set([(activeIndex + 1) % images.length, (activeIndex - 1 + images.length) % images.length]);
    adjacentIndexes.forEach(index => {
      const image = new Image();
      image.decoding = "async";
      image.src = images[index].src;
    });
  }, [activeIndex, images]);

  function openImage(index: number, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setActiveIndex(index);
  }

  function moveImage(direction: number) {
    if (!canNavigate) return;
    setActiveIndex(current => current === null ? null : (current + direction + images.length) % images.length);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setActiveIndex(null);
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      moveImage(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : images.length - 1);
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" && event.isPrimary) touchStart.current = { x: event.clientX, y: event.clientY };
    else touchStart.current = null;
  }

  function finishSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || event.pointerType !== "touch") return;
    const horizontal = event.clientX - start.x;
    const vertical = event.clientY - start.y;
    if (Math.abs(horizontal) > 55 && Math.abs(horizontal) > Math.abs(vertical) * 1.4) moveImage(horizontal > 0 ? -1 : 1);
  }

  if (images.length === 0) return null;

  return <section className={styles.gallery} aria-labelledby={headingId}>
    <div className={styles.heading}>
      <div><p className={styles.eyebrow}>Материалы проекта</p><h2 id={headingId}>Рассмотреть <em>ближе.</em></h2></div>
      <button className={styles.openGallery} type="button" onClick={event => openImage(0, event.currentTarget)}><span>{images.length} {imageWord(images.length)}<small>Открыть галерею</small></span><span aria-hidden="true">↗</span></button>
    </div>
    <div className={`${styles.grid} ${images.length === 1 ? styles.single : ""}`}>
      {previewImages.map((image, index) => <figure className={styles.preview} key={`${image.src}-${index}`}>
        <button className={styles.previewButton} type="button" onClick={event => openImage(index, event.currentTarget)} aria-label={`Рассмотреть изображение ${index + 1} из ${images.length}: ${image.caption || image.alt}`}>
          <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
          <span className={styles.expand} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          {index === previewImages.length - 1 && images.length > previewImages.length && <span className={styles.remaining} aria-hidden="true">Ещё {images.length - previewImages.length}<span>в галерее ↗</span></span>}
        </button>
        <figcaption><span>{String(index + 1).padStart(2, "0")}</span><p>{image.caption || image.alt}</p></figcaption>
      </figure>)}
    </div>

    <dialog className={styles.lightbox} ref={dialogRef} aria-labelledby={dialogTitleId} aria-describedby={instructionsId} onKeyDown={handleKeyDown} onCancel={event => { event.preventDefault(); setActiveIndex(null); }} onClose={() => setActiveIndex(null)} onClick={event => { if (event.target === event.currentTarget) setActiveIndex(null); }}>
      {activeImage && <>
        <header className={styles.lightboxHeader}>
          <div><p>ТРИФОТИ / Материалы проекта</p><h3 id={dialogTitleId}>{title}</h3></div>
          <button className={styles.close} ref={closeRef} type="button" onClick={() => setActiveIndex(null)} aria-label="Закрыть галерею"><span>Закрыть</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
        </header>
        <div className={`${styles.stage} ${!canNavigate ? styles.stageSingle : ""}`} onPointerDown={startSwipe} onPointerUp={finishSwipe} onPointerCancel={() => { touchStart.current = null; }}>
          {canNavigate && <button className={`${styles.arrow} ${styles.previous}`} type="button" onClick={() => moveImage(-1)} aria-label="Предыдущее изображение"><Arrow direction="previous" /></button>}
          <GalleryImage key={activeImage.src} image={activeImage} />
          {canNavigate && <button className={`${styles.arrow} ${styles.next}`} type="button" onClick={() => moveImage(1)} aria-label="Следующее изображение"><Arrow direction="next" /></button>}
        </div>
        <div className={styles.description} aria-live="polite" aria-atomic="true"><span>{String((activeIndex ?? 0) + 1).padStart(2, "0")} <i>/ {String(images.length).padStart(2, "0")}</i></span><p>{activeImage.caption || activeImage.alt}</p></div>
        <div className={styles.lightboxBottom}>
          {canNavigate && <div className={styles.thumbnails} role="group" aria-label="Все изображения проекта">{images.map((image, index) => <button key={`${image.src}-${index}`} ref={element => { thumbnailRefs.current[index] = element; }} type="button" aria-label={`Изображение ${index + 1}: ${image.caption || image.alt}`} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)}><img src={image.src} alt="" width={image.width} height={image.height} loading="lazy" decoding="async" /><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span></button>)}</div>}
          <p className={styles.instructions} id={instructionsId}>{canNavigate && <span>Стрелки ← → — листать <i>·</i> </span>}Esc — закрыть</p>
        </div>
      </>}
    </dialog>
  </section>;
}
