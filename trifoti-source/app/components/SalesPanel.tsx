"use client";

import { useEffect, useState } from "react";
import { salesStages, type SalesFields, type SalesStage } from "../sales-data";

const money = (value: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value);
type MetricRow = { label: string; leads: number; orders: number; quoted: number; paid: number; quoteCount: number; paymentCount: number };
type Report = {
  days: number; totals: MetricRow; stages: { label: string; count: number }[];
  sources: MetricRow[]; services: MetricRow[]; calibration: { compared: number; withinRange: number | null };
};

export function SalesEditor({ lead, adminKey, onSaved }: {
  lead: SalesFields & { id: number; publicId: string }; adminKey: string; onSaved: (id: number, sales: SalesFields) => void;
}) {
  const [stage, setStage] = useState<SalesStage>(lead.salesStage);
  const [quote, setQuote] = useState(lead.quoteAmount?.toString() ?? "");
  const [paid, setPaid] = useState(lead.paidAmount?.toString() ?? "");
  const [reason, setReason] = useState(lead.lostReason);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage(""); setFailed(false);
    try {
      const response = await fetch("/api/sales", {
        method: "PATCH", headers: { "content-type": "application/json", ...(adminKey ? { "x-trifoti-admin-key": adminKey } : {}) },
        body: JSON.stringify({ id: lead.id, salesRevision: lead.salesRevision, salesStage: stage, quoteAmount: quote === "" ? null : Number(quote), paidAmount: paid === "" ? null : Number(paid), lostReason: stage === "Отказ" ? reason : "" }),
      });
      const data = await response.json() as SalesFields & { error?: string };
      if (!response.ok) throw new Error(data.error || "Не удалось сохранить результат.");
      onSaved(lead.id, data); setMessage("Результат сохранён.");
    } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Нет связи с сервером."); }
    finally { setPending(false); }
  }
  return <form className="sales-editor" onSubmit={(event) => void save(event)} aria-label={`Результат продажи ${lead.publicId}`}>
    <h3>Результат продажи</h3>
    <div className="sales-fields">
      <label><span>Этап продажи</span><select value={stage} onChange={(event) => setStage(event.target.value as SalesStage)} disabled={pending}>{salesStages.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label><span>Сумма КП, ₽</span><input type="number" min="0" max="100000000" step="1" inputMode="numeric" value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="Не указана" disabled={pending} /></label>
      <label><span>Всего получено от клиента, ₽</span><input type="number" min="0" max="100000000" step="1" inputMode="numeric" value={paid} onChange={(event) => setPaid(event.target.value)} placeholder="Не указано" disabled={pending} /></label>
    </div>
    {stage === "Отказ" && <label className="sales-reason"><span>Причина отказа</span><input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Например: бюджет, срок, задача отменена" disabled={pending} /></label>}
    <p className="sales-hint">Суммы за весь проект, в целых рублях. Пустое поле — данных нет; 0 — сумма подтверждена как нулевая. Оплата вводится нарастающим итогом.</p>
    <div className="sales-save"><button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить результат"}</button><span role={failed ? "alert" : "status"}>{message}</span></div>
  </form>;
}

export function SalesPanel({ adminKey, refresh }: { adminKey: string; refresh: number }) {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const response = await fetch(`/api/sales?days=${days}`, { headers: adminKey ? { "x-trifoti-admin-key": adminKey } : {}, signal: controller.signal });
        if (!response.ok) throw new Error("Не удалось загрузить результаты продаж. Обновите реестр.");
        const data = await response.json() as Report;
        if (!controller.signal.aborted) setReport(data);
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Нет связи с сервером."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [adminKey, days, refresh]);
  function table(rows: MetricRow[], label: string) {
    return <div className="sales-table-wrap"><h3>{label}</h3><table><thead><tr><th scope="col">{label === "По направлениям" ? "Направление" : "UTM source"}</th><th scope="col">Заявки</th><th scope="col">Заказы</th><th scope="col">КП, ₽</th><th scope="col">Получено, ₽</th></tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.leads}</td><td>{row.orders}</td><td>{row.quoteCount ? money(row.quoted) : "Нет данных"}</td><td>{row.paymentCount ? money(row.paid) : "Нет данных"}</td></tr>)}</tbody></table></div>;
  }
  return <section className="sales-panel" aria-labelledby="sales-title" aria-busy={loading}>
    <header><div><p className="kicker">От обращения к заказу</p><h2 id="sales-title">Результаты продаж</h2></div><label><span>Заявки за</span><select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={7}>7 дней</option><option value={30}>30 дней</option><option value={90}>90 дней</option></select></label></header>
    <p>Текущий результат заявок, созданных за выбранный период. Оплаты относятся к этим заявкам и могли поступить в другие даты.</p>
    {error && <p role="alert" className="admin-error">{error}</p>}
    {loading && <p role="status">Обновляем результаты…</p>}
    {report && !error && !loading && <>
      <div className="sales-totals"><article><span>Заявки</span><strong>{report.totals.leads}</strong></article><article><span>Подтверждённые заказы</span><strong>{report.totals.orders || 0}</strong></article><article><span>Сумма КП</span><strong>{report.totals.quoteCount ? money(report.totals.quoted) : "Нет данных"}</strong><small>Указана у {report.totals.quoteCount || 0} заявок</small></article><article><span>Получено</span><strong>{report.totals.paymentCount ? money(report.totals.paid) : "Нет данных"}</strong><small>Указано у {report.totals.paymentCount || 0} заявок</small></article></div>
      {report.totals.leads > 0 ? <><div className="sales-stages" aria-label="Текущие этапы продажи">{report.stages.map((s) => <span key={s.label}>{s.label} <b>{s.count}</b></span>)}</div>{table(report.sources, "По источникам")}{table(report.services, "По направлениям")}</> : <p>За этот период обращений пока нет.</p>}
      <p className="sales-hint">Заказ учитывается при этапе «Заказ». Старые обращения не получают результат автоматически. Источник берётся из UTM; показаны первые 20 источников по заказам и заявкам.</p>
      <div className="sales-calibration"><h3>Проверка калькулятора по фактическим КП</h3><p>{report.calibration.compared ? `У ${report.calibration.compared} заявок есть оценка калькулятора и сумма КП. В предварительный диапазон попали ${report.calibration.withinRange || 0}. Перед сравнением проверьте, что состав работ в заявке не менялся.` : "Пока нет заявок одновременно с оценкой калькулятора и фактической суммой КП. Заполняйте суммы в карточках — здесь появится сравнение."}</p></div>
    </>}
  </section>;
}
