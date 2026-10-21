"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { analyticsUrl, isPrivatePath } from "../analytics-privacy";
import { readAcquisition } from "../acquisition";
import { STATIC_EXPORT } from "../site-config";

type GoalDetails = Record<string, unknown> & { event: string };
type MetrikaFunction = {
  (...args: unknown[]): void;
  a?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    ym?: MetrikaFunction;
  }
}

function installMetrika(counterId: number) {
  if (!window.ym) {
    const queued: MetrikaFunction = (...args: unknown[]) => {
      queued.a = queued.a ?? [];
      queued.a.push(args);
    };
    queued.l = Date.now();
    window.ym = queued;
  }

  if (!document.getElementById("step3d-yandex-metrika")) {
    const script = document.createElement("script");
    script.id = "step3d-yandex-metrika";
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    document.head.appendChild(script);
  }

  window.ym(counterId, "init", {
    accurateTrackBounce: true,
    clickmap: false,
    defer: true,
    trackLinks: false,
    webvisor: false,
  });
}

function linkGoal(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href") ?? "";
  if (href.startsWith("tel:")) return "phone_click";
  if (href.startsWith("mailto:")) return "email_click";
  if (/^https:\/\/(?:t\.me|telegram\.me)\//i.test(anchor.href)) return "telegram_click";
  return null;
}

function linkSource(anchor: HTMLAnchorElement) {
  if (anchor.dataset.analyticsSource) return anchor.dataset.analyticsSource;
  if (anchor.closest(".hero")) return "hero";
  if (anchor.closest(".request")) return "request";
  if (anchor.closest(".business-page")) return "business";
  if (anchor.closest("footer")) return "footer";
  if (anchor.closest(".mobile-cta")) return "mobile_sticky";
  return "site";
}

let memorySessionId = "";

function sessionId() {
  const key = "step3d-analytics-session";
  try {
    const current = sessionStorage.getItem(key);
    if (current) return current;
  } catch {
    if (memorySessionId) return memorySessionId;
  }
  const created = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replaceAll("-", "")
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  memorySessionId = created;
  try { sessionStorage.setItem(key, created); } catch { /* Browser storage can be disabled. */ }
  return created;
}

function isPrivatePage() { return isPrivatePath(window.location.pathname); }

function acquisitionSource(details: GoalDetails) {
  if (typeof details.source === "string" && details.source) return details.source;
  try {
    return document.referrer ? new URL(document.referrer).hostname : "Прямой переход";
  } catch {
    return "Прямой переход";
  }
}

function recordInternal(details: GoalDetails) {
  if (STATIC_EXPORT || isPrivatePage()) return;
  const acquisition = readAcquisition();
  const { event, ...eventDetails } = details;
  void fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      event,
      path: window.location.pathname,
      source: acquisitionSource(details),
      sessionId: sessionId(),
      ...acquisition,
      details: eventDetails,
    }),
  }).catch(() => undefined);
}

export function AnalyticsBridge() {
  const pathname = usePathname();
  const counterId = useRef<number | null>(null);
  const pendingGoals = useRef<GoalDetails[]>([]);
  const pendingPageUrl = useRef<string | null>(null);

  useEffect(() => {
    if (STATIC_EXPORT) return;
    const sendYandexGoal = (details: GoalDetails) => {
      if (isPrivatePage()) return;
      if (!counterId.current || !window.ym) {
        if (pendingGoals.current.length < 50) pendingGoals.current.push(details);
        return;
      }
      const { event, ...params } = details;
      window.ym(counterId.current, "reachGoal", event, params);
    };

    const sendGoal = (details: GoalDetails) => {
      recordInternal(details);
      sendYandexGoal(details);
    };

    const onConversion = (event: Event) => {
      const details = (event as CustomEvent<GoalDetails>).detail;
      if (details?.event) sendGoal(details);
    };

    const onLinkClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!target) return;
      const goal = linkGoal(target);
      if (goal) sendGoal({ event: goal, source: linkSource(target) });
    };

    window.addEventListener("step3d:conversion", onConversion);
    document.addEventListener("click", onLinkClick);

    const controller = new AbortController();
    void fetch("/api/analytics", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ yandexMetrikaId: string | null }> : null)
      .then((config) => {
        if (!config?.yandexMetrikaId) return;
        const id = Number(config.yandexMetrikaId);
        if (!Number.isSafeInteger(id) || id <= 0) return;
        counterId.current = id;
        if (isPrivatePage()) return;
        installMetrika(id);
        const pageUrl = pendingPageUrl.current ?? analyticsUrl(window.location.href);
        window.ym?.(id, "hit", pageUrl, { title: document.title, referer: analyticsUrl(document.referrer) });
        pendingPageUrl.current = null;
        const queued = pendingGoals.current.splice(0);
        queued.forEach(sendYandexGoal);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => {
      controller.abort();
      window.removeEventListener("step3d:conversion", onConversion);
      document.removeEventListener("click", onLinkClick);
    };
  }, []);

  useEffect(() => {
    if (STATIC_EXPORT || isPrivatePage()) return;
    const pageUrl = analyticsUrl(window.location.href);
    recordInternal({ event: "page_view", source: acquisitionSource({ event: "page_view" }) });
    if (counterId.current && !window.ym) installMetrika(counterId.current);
    if (!counterId.current || !window.ym) {
      pendingPageUrl.current = pageUrl;
      return;
    }
    window.ym(counterId.current, "hit", pageUrl, { title: document.title });
  }, [pathname]);

  return null;
}
