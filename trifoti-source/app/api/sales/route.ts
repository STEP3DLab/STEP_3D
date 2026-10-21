import { getRawDb, getRuntimeEnv } from "../../../db";
import { parseSalesUpdate } from "../../sales-data";
import { adminAuthorization } from "../../admin-auth";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}
export async function PATCH(request: Request) {
  if (!adminAuthorization(request, getRuntimeEnv())) return json({ error: "Доступ к результатам продаж не подтверждён." }, 401);
  if (Number(request.headers.get("content-length") || 0) > 4000) return json({ error: "Слишком большой запрос." }, 413);
  const update = parseSalesUpdate(await request.json().catch(() => null));
  if (!update) return json({ error: "Проверьте этап и суммы: целые рубли от 0 до 100 000 000, либо пустое поле." }, 400);
  const { id, salesStage, quoteAmount, paidAmount, lostReason, salesRevision } = update;
  const db = getRawDb();
  const result = await db.prepare("UPDATE leads SET sales_stage = ?, quote_amount = ?, paid_amount = ?, lost_reason = ?, sales_revision = sales_revision + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND sales_revision = ?")
    .bind(salesStage, quoteAmount, paidAmount, lostReason, id, salesRevision).run();
  if (!result.meta.changes) {
    const existing = await db.prepare("SELECT id FROM leads WHERE id = ?").bind(id).first();
    return existing ? json({ error: "Заявка уже изменена. Обновите реестр и повторите правку." }, 409) : json({ error: "Заявка не найдена." }, 404);
  }
  return json({ ...update, salesRevision: salesRevision + 1 });
}

export async function GET(request: Request) {
  if (!adminAuthorization(request, getRuntimeEnv())) return json({ error: "Доступ к результатам продаж не подтверждён." }, 401);
  const requestedDays = Number(new URL(request.url).searchParams.get("days") || 30);
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const since = `-${days} days`;
  const db = getRawDb();
  const metrics = `COUNT(*) AS leads,
    SUM(CASE WHEN sales_stage = 'Заказ' THEN 1 ELSE 0 END) AS orders,
    SUM(CASE WHEN quote_amount IS NOT NULL THEN 1 ELSE 0 END) AS quoteCount,
    SUM(CASE WHEN paid_amount IS NOT NULL THEN 1 ELSE 0 END) AS paymentCount,
    COALESCE(SUM(quote_amount), 0) AS quoted, COALESCE(SUM(paid_amount), 0) AS paid`;
  const where = "FROM leads WHERE created_at >= datetime('now', ?)";
  const [totals, stages, sources, services, calibration] = await Promise.all([
    db.prepare(`SELECT ${metrics} ${where}`).bind(since).first(),
    db.prepare(`SELECT sales_stage AS label, COUNT(*) AS count ${where} GROUP BY sales_stage ORDER BY count DESC`).bind(since).all(),
    db.prepare(`SELECT COALESCE(NULLIF(TRIM(utm_source), ''), 'Без UTM') AS label, ${metrics} ${where} GROUP BY label ORDER BY orders DESC, leads DESC LIMIT 20`).bind(since).all(),
    db.prepare(`SELECT project_type AS label, ${metrics} ${where} GROUP BY project_type ORDER BY orders DESC, leads DESC`).bind(since).all(),
    db.prepare(`SELECT COUNT(*) AS compared, SUM(CASE WHEN quote_amount BETWEEN estimate_min AND estimate_max THEN 1 ELSE 0 END) AS withinRange ${where} AND quote_amount IS NOT NULL AND estimate_min IS NOT NULL AND estimate_max IS NOT NULL`).bind(since).first(),
  ]);
  return json({ days, totals, stages: stages.results, sources: sources.results, services: services.results, calibration });
}
