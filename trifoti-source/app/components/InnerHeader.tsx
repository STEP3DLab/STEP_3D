"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { Brand } from "./Brand";

type InnerHeaderProps = {
  backHref: string;
  backLabel: string;
  activeHref?: string;
  requestHref?: string;
};

const mainRoutes = [
  { href: "/services", label: "Направления" },
  { href: "/projects", label: "Проекты" },
  { href: "/business", label: "Сотрудничество" },
  { href: "/about", label: "Студия" },
] as const;

export function InnerHeader({
  backHref,
  backLabel,
  activeHref,
  requestHref = "/?source=inner_header#request",
}: InnerHeaderProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  const closeMenu = useCallback(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.open && !menuRef.current.contains(event.target as Node)) closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !menuRef.current?.open) return;
      closeMenu();
      menuRef.current.querySelector("summary")?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu]);

  return (
    <>
      <a className="skip-link" href="#content">Перейти к содержанию</a>
      <header className="inner-header">
        <Brand href="/" />

        <nav className="inner-header-nav" aria-label="Основная навигация">
          {mainRoutes.map((route) => <Link className={activeHref === route.href ? "active" : undefined} aria-current={activeHref === route.href ? "page" : undefined} href={route.href} key={route.href}>{route.label}</Link>)}
        </nav>

        <div className="inner-header-actions">
          <Link className="inner-back" href={backHref}>← {backLabel}</Link>
          <Link className="inner-request" href={requestHref}>Обсудить идею <span>↗</span></Link>
        </div>

        <details className="inner-menu" ref={menuRef}>
          <summary><span>Меню</span><i aria-hidden="true"><b /><b /></i></summary>
          <div>
            <Link className="inner-menu-back" href={backHref} onClick={closeMenu}>← {backLabel}</Link>
            <nav aria-label="Навигация по сайту">
              {mainRoutes.map((route) => <Link className={activeHref === route.href ? "active" : undefined} aria-current={activeHref === route.href ? "page" : undefined} href={route.href} key={route.href} onClick={closeMenu}>{route.label}<span>→</span></Link>)}
            </nav>
            <Link className="inner-menu-request" href={requestHref} onClick={closeMenu}>Обсудить идею <span>↗</span></Link>
          </div>
        </details>
      </header>
    </>
  );
}
