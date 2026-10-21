import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { csvCell } from "../../csv";
import { getDb, getRuntimeEnv } from "../../../db";
import { leadFiles, leads } from "../../../db/schema";
import { adminAuthorization } from "../../admin-auth";

const PROJECT_TYPES = new Set([
  "3D-моделирование / подготовка модели",
  "3D-печать по готовой модели",
  "Скульптура / арт-объект",
  "Кубок / награда",
  "Декор / инсталляция",
  "Сцена / костюм / экспозиция",
  "Реплика / миниатюра",
  "Промышленный дизайн / прототип",
  "3D-сканирование / реверсивный инжиниринг",
  "AR/VR-приложение",
  "Другое",
]);
const CONTACT_METHODS = new Set(["Telegram", "Телефон", "E-mail"]);
const STATUSES = new Set([
  "Новая", "Оценка", "Согласование", "Моделирование", "Производство", "Контроль", "Готово",
  "В работе", "Ожидает клиента", "Расчёт отправлен", "Заказ", "Закрыта",
]);

type LeadPayload = {
  consent?: unknown;
  name?: unknown;
  contact?: unknown;
  contactMethod?: unknown;
  projectType?: unknown;
  projectFormat?: unknown;
  budget?: unknown;
  deadline?: unknown;
  details?: unknown;
  source?: unknown;
  companyWebsite?: unknown;
  startedAt?: unknown;
  estimateMin?: unknown;
  estimateMax?: unknown;
  estimateSummary?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  referrer?: unknown;
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

async function hashClient(request: Request) {
  const raw = [
    request.headers.get("cf-connecting-ip") ?? "unknown",
    request.headers.get("user-agent") ?? "unknown",
  ].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}


function cleanAmount(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100_000_000 ? Math.round(number) : null;
}

function validContact(method: string, contact: string) {
  if (contact.length < 3) return false;
  if (method === "E-mail") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(contact);
  if (method === "Телефон") return (contact.match(/\d/g)?.length ?? 0) >= 10;
  return true;
}

function telegramHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function telegramMessage(payload: Record<string, unknown>) {
  const estimate = payload.estimateMin && payload.estimateMax
    ? `${new Intl.NumberFormat("ru-RU").format(Number(payload.estimateMin))}–${new Intl.NumberFormat("ru-RU").format(Number(payload.estimateMax))} ₽`
    : "не рассчитана";
  const source = [payload.source, payload.utmSource, payload.utmMedium, payload.utmCampaign]
    .filter(Boolean).join(" · ") || "сайт";
  return [
    "<b>Новая заявка ТРИФОТИ</b>",
    `<b>№:</b> <code>${telegramHtml(payload.publicId)}</code>`,
    `<b>Имя / компания:</b> ${telegramHtml(payload.name)}`,
    `<b>Контакт:</b> ${telegramHtml(payload.contact)} (${telegramHtml(payload.contactMethod)})`,
    `<b>Проект:</b> ${telegramHtml(payload.projectType)}`,
    `<b>Формат:</b> ${telegramHtml(payload.projectFormat || "не указан")}`,
    `<b>Бюджет:</b> ${telegramHtml(payload.budget || "не указан")}`,
    `<b>Оценка калькулятора:</b> ${telegramHtml(estimate)}`,
    `<b>Желаемый срок:</b> ${telegramHtml(payload.deadline || "не указан")}`,
    `<b>Источник:</b> ${telegramHtml(source)}`,
    "",
    `<b>Задача:</b>\n${telegramHtml(payload.details)}`,
  ].join("\n");
}

function telegramConfig() {
  const env = getRuntimeEnv();
  const token = env?.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const chatId = env?.TELEGRAM_CHAT_ID?.trim() ?? "";
  return /^\d+:[A-Za-z0-9_-]{20,}$/.test(token) && /^-?\d+$/.test(chatId) ? { token, chatId } : null;
}

function webhookUrl() {
  const value = getRuntimeEnv()?.LEAD_WEBHOOK_URL?.trim() ?? "";
  return value.startsWith("https://") ? value : null;
}

function notificationChannel() {
  if (telegramConfig()) return "telegram" as const;
  if (webhookUrl()) return "webhook" as const;
  return "none" as const;
}

async function notifyTelegram(payload: Record<string, unknown>) {
  const config = telegramConfig();
  if (!config) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: telegramMessage(payload),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: "Открыть реестр заявок", url: "https://trifoti.step3d.chatgpt.site/leads" }]] },
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`Telegram API returned ${response.status}`);
    const result = await response.json() as { ok?: boolean };
    if (result.ok !== true) throw new Error("Telegram rejected notification");
    return true;
  } catch (error) {
    console.error("telegram_notification_failed", error);
    return false;
  }
}

async function notifyManager(payload: Record<string, unknown>) {
  if (await notifyTelegram(payload)) return true;
  const destination = webhookUrl();
  if (!destination) return false;
  try {
    const response = await fetch(destination, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "trifoti.lead.created", ...payload }),
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
    return true;
  } catch (error) {
    console.error("lead_webhook_failed", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 24_000) return Response.json({ error: "Слишком большой запрос." }, { status: 413 });

    const payload = (await request.json().catch(() => null)) as LeadPayload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return Response.json({ error: "Некорректные данные." }, { status: 400 });
    if (clean(payload.companyWebsite, 200)) {
      return Response.json({ ok: true, leadId: "TFT-ACCEPTED" }, { status: 201 });
    }

    if (payload.consent !== true) return Response.json({ error: "Для отправки заявки необходимо согласие на обработку персональных данных." }, { status: 400 });

    const startedAt = typeof payload.startedAt === "number" ? payload.startedAt : 0;
    if (startedAt && Date.now() - startedAt < 600) {
      return Response.json({ error: "Пожалуйста, проверьте данные и отправьте заявку ещё раз." }, { status: 429 });
    }

    const name = clean(payload.name, 120);
    const contact = clean(payload.contact, 160);
    const contactMethod = clean(payload.contactMethod, 30);
    const projectType = clean(payload.projectType, 80);
    const projectFormat = clean(payload.projectFormat, 80);
    const budget = clean(payload.budget, 60);
    const deadline = clean(payload.deadline, 100);
    const details = clean(payload.details, 2500);
    const source = clean(payload.source, 80) || "website";
    const estimateMin = cleanAmount(payload.estimateMin);
    const estimateMax = cleanAmount(payload.estimateMax);
    const estimateSummary = clean(payload.estimateSummary, 500);
    const utmSource = clean(payload.utmSource, 120);
    const utmMedium = clean(payload.utmMedium, 120);
    const utmCampaign = clean(payload.utmCampaign, 160);
    const referrer = clean(payload.referrer, 500);

    if (name.length < 2 || contact.length < 3 || details.length < 12) {
      return Response.json({ error: "Заполните имя, контакт и описание задачи." }, { status: 400 });
    }
    if (!PROJECT_TYPES.has(projectType) || !CONTACT_METHODS.has(contactMethod)) {
      return Response.json({ error: "Проверьте тип проекта и способ связи." }, { status: 400 });
    }
    if (!validContact(contactMethod, contact)) {
      return Response.json({ error: "Проверьте контакт для выбранного способа связи." }, { status: 400 });
    }

    const ipHash = await hashClient(request);
    const db = getDb();
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
    const recent = await db.select({ id: leads.id }).from(leads)
      .where(and(eq(leads.ipHash, ipHash), gte(leads.createdAt, since))).limit(6);
    if (recent.length >= 5) {
      return Response.json({ error: "Слишком много заявок. Напишите нам на projects.step3d@gmail.com." }, { status: 429 });
    }

    const date = new Date();
    const datePart = date.toISOString().slice(2, 10).replace(/-/g, "");
    const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
    const publicId = `TFT-${datePart}-${suffix}`;
    const publicToken = crypto.randomUUID().replace(/-/g, "");
    await db.insert(leads).values({
      publicId, publicToken, salesStage: "Новая", name, contact, contactMethod, projectType, projectFormat, budget,
      deadline, details, source, estimateMin, estimateMax, estimateSummary,
      utmSource, utmMedium, utmCampaign, referrer, ipHash,
      userAgent: clean(request.headers.get("user-agent"), 300),
    });

    const managerNotified = await notifyManager({ publicId, name, contact, contactMethod, projectType, projectFormat, budget, deadline, details, source, estimateMin, estimateMax, utmSource, utmMedium, utmCampaign });
    return Response.json({ ok: true, leadId: publicId, leadToken: publicToken, managerNotified }, { status: 201 });
  } catch (error) {
    console.error("lead_submit_failed", error);
    return Response.json({ error: "Не удалось сохранить заявку. Напишите нам на projects.step3d@gmail.com." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const authorization = adminAuthorization(request, getRuntimeEnv());
  if (!authorization) return Response.json({ error: "Войдите как владелец сайта или укажите действующий код менеджера." }, { status: 401 });
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(requestedLimit) ? Math.min(500, Math.max(1, Math.floor(requestedLimit))) : 200;
  const db = getDb();
  const rows = await db.select({
    id: leads.id, publicId: leads.publicId, createdAt: leads.createdAt, status: leads.status,
    name: leads.name, contact: leads.contact, contactMethod: leads.contactMethod,
    projectType: leads.projectType, projectFormat: leads.projectFormat, budget: leads.budget,
    deadline: leads.deadline, details: leads.details, source: leads.source,
    estimateMin: leads.estimateMin, estimateMax: leads.estimateMax, estimateSummary: leads.estimateSummary,
    utmSource: leads.utmSource, utmMedium: leads.utmMedium, utmCampaign: leads.utmCampaign,
    salesStage: leads.salesStage, quoteAmount: leads.quoteAmount, paidAmount: leads.paidAmount,
    lostReason: leads.lostReason, salesRevision: leads.salesRevision,
    updatedAt: leads.updatedAt,
  }).from(leads).orderBy(desc(leads.createdAt), desc(leads.id)).limit(limit);
  const files = rows.length ? await db.select({ id: leadFiles.id, leadId: leadFiles.leadId, fileName: leadFiles.fileName, size: leadFiles.size }).from(leadFiles).where(inArray(leadFiles.leadId, rows.map((row) => row.id))) : [];
  const enrichedRows = rows.map((row) => ({ ...row, files: files.filter((file) => file.leadId === row.id).map(({ id, fileName, size }) => ({ id, fileName, size })) }));

  if (url.searchParams.get("format") === "csv") {
    const headers = ["№ заявки", "Дата", "Статус", "Имя / компания", "Контакт", "Канал связи", "Тип проекта", "Формат", "Бюджет", "Оценка от", "Оценка до", "Параметры оценки", "Срок", "Описание", "Источник", "UTM source", "UTM medium", "UTM campaign"];
    headers.push("Файлы", "Этап продажи", "Сумма КП, ₽", "Получено, ₽", "Причина отказа");
    const lines = [headers, ...enrichedRows.map((row) => [row.publicId, row.createdAt, row.status, row.name, row.contact, row.contactMethod, row.projectType, row.projectFormat, row.budget, row.estimateMin, row.estimateMax, row.estimateSummary, row.deadline, row.details, row.source, row.utmSource, row.utmMedium, row.utmCampaign, row.files.map((file) => file.fileName).join("; "), row.salesStage, row.quoteAmount, row.paidAmount, row.lostReason])]
      .map((row) => row.map(csvCell).join(","));
    return new Response(`\uFEFF${lines.join("\r\n")}`, {
      headers: { "cache-control": "no-store", "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=trifoti-leads.csv" },
    });
  }
  return Response.json({ leads: enrichedRows, authorization, notification: { channel: notificationChannel() } }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!adminAuthorization(request, getRuntimeEnv())) return Response.json({ error: "Доступ к заявкам не подтверждён." }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as { id?: unknown; status?: unknown };
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return Response.json({ error: "Некорректные данные." }, { status: 400 });
  const id = typeof payload.id === "number" ? payload.id : Number(payload.id);
  const status = clean(payload.status, 40);
  if (!Number.isInteger(id) || id < 1 || !STATUSES.has(status)) {
    return Response.json({ error: "Некорректный статус." }, { status: 400 });
  }
  await getDb().update(leads).set({ status, updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19) }).where(eq(leads.id, id));
  return Response.json({ ok: true });
}
