import { getRawDb, getRuntimeEnv } from "../../../db";
import { adminAuthorization } from "../../admin-auth";

export const runtime = "edge";

const allowedEvents = new Set([
  "page_view",
  "cta_click",
  "estimate_complete",
  "format_select",
  "lead_submit",
  "lead_files_uploaded",
  "hero_type_select",
  "case_open",
  "portfolio_filter",
  "portfolio_expand",
  "portfolio_collapse",
  "phone_click",
  "email_click",
  "telegram_click",
  "business_open",
  "portfolio_download",
  "showreel_play",
]);

function text(value: unknown, max: number, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, max) : fallback;
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(data, { ...init, headers });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 12_000) return json({ error: "Событие слишком большое." }, { status: 413 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Некорректные данные." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Некорректные данные." }, { status: 400 });
  const event = text(body.event, 64);
  const sessionId = text(body.sessionId, 80);
  if (!allowedEvents.has(event) || !/^[a-zA-Z0-9_-]{12,80}$/.test(sessionId)) {
    return json({ error: "Некорректное событие." }, { status: 400 });
  }

  const db = getRawDb();
  const recent = await db.prepare(
    "SELECT COUNT(*) AS count FROM analytics_events WHERE session_id = ? AND created_at >= datetime('now', '-15 minutes')"
  ).bind(sessionId).first<{ count: number }>();
  if (Number(recent?.count || 0) >= 100) return json({ accepted: false }, { status: 429 });

  const rawDetails = body.details && typeof body.details === "object" ? body.details : {};
  const details = JSON.stringify(rawDetails).slice(0, 4_000);
  await db.prepare(
    "INSERT INTO analytics_events (event, path, source, session_id, utm_source, utm_medium, utm_campaign, referrer, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    event,
    text(body.path, 240, "/") || "/",
    text(body.source, 100, "site") || "site",
    sessionId,
    text(body.utmSource, 160),
    text(body.utmMedium, 160),
    text(body.utmCampaign, 160),
    text(body.referrer, 500),
    details,
  ).run();

  return json({ accepted: true }, { status: 201 });
}

type CountRow = { event: string; count: number; sessions: number };
type DailyRow = { day: string; views: number; sessions: number; leads: number };
type RankingRow = { label: string; value: number };

export async function GET(request: Request) {
  if (!adminAuthorization(request, getRuntimeEnv())) return json({ error: "Доступ запрещён." }, { status: 401 });
  const requestedDays = Number(new URL(request.url).searchParams.get("days") || "30");
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const modifier = `-${days} days`;
  const db = getRawDb();

  const [summaryResult, dailyResult, sourceResult, pageResult] = await Promise.all([
    db.prepare(
      "SELECT event, COUNT(*) AS count, COUNT(DISTINCT session_id) AS sessions FROM analytics_events WHERE created_at >= datetime('now', ?) GROUP BY event"
    ).bind(modifier).all<CountRow>(),
    db.prepare(
      "SELECT substr(created_at, 1, 10) AS day, SUM(CASE WHEN event = 'page_view' THEN 1 ELSE 0 END) AS views, COUNT(DISTINCT CASE WHEN event = 'page_view' THEN session_id END) AS sessions, SUM(CASE WHEN event = 'lead_submit' THEN 1 ELSE 0 END) AS leads FROM analytics_events WHERE created_at >= datetime('now', ?) GROUP BY substr(created_at, 1, 10) ORDER BY day"
    ).bind(modifier).all<DailyRow>(),
    db.prepare(
      "SELECT CASE WHEN utm_source <> '' THEN utm_source WHEN source <> '' THEN source ELSE 'Прямой переход' END AS label, COUNT(*) AS value FROM analytics_events WHERE event = 'page_view' AND created_at >= datetime('now', ?) GROUP BY label ORDER BY value DESC LIMIT 8"
    ).bind(modifier).all<RankingRow>(),
    db.prepare(
      "SELECT path AS label, COUNT(*) AS value FROM analytics_events WHERE event = 'page_view' AND created_at >= datetime('now', ?) GROUP BY path ORDER BY value DESC LIMIT 8"
    ).bind(modifier).all<RankingRow>(),
  ]);

  const summaryRows = (summaryResult.results ?? []) as CountRow[];
  const counts = new Map<string, CountRow>(summaryRows.map((row) => [row.event, row]));
  const count = (event: string) => Number(counts.get(event)?.count || 0);
  const pageViews = count("page_view");
  const sessions = Number(counts.get("page_view")?.sessions || 0);
  const leads = count("lead_submit");

  return json({
    days,
    totals: {
      pageViews,
      sessions,
      ctaClicks: count("cta_click"),
      estimates: count("estimate_complete"),
      leads,
      telegramClicks: count("telegram_click"),
      phoneClicks: count("phone_click"),
      emailClicks: count("email_click"),
      caseViews: count("case_open"),
      fileUploads: count("lead_files_uploaded"),
      portfolioDownloads: count("portfolio_download"),
      showreelPlays: count("showreel_play"),
      conversion: sessions ? Number(((leads / sessions) * 100).toFixed(1)) : 0,
    },
    daily: dailyResult.results ?? [],
    sources: sourceResult.results ?? [],
    pages: pageResult.results ?? [],
  });
}
