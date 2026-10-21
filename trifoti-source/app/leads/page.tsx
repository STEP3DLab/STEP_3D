"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brand } from "../components/Brand";
import { SalesEditor, SalesPanel } from "../components/SalesPanel";
import type { SalesFields } from "../sales-data";

type Lead = SalesFields & {
  id: number; publicId: string; createdAt: string; status: string; name: string; contact: string;
  contactMethod: string; projectType: string; projectFormat: string; budget: string;
  deadline: string; details: string; source: string; estimateMin: number | null; estimateMax: number | null;
  estimateSummary: string; utmSource: string; utmMedium: string; utmCampaign: string; updatedAt: string;
  files: Array<{ id: number; fileName: string; size: number }>;
};

type Analytics = {
  days: number;
  totals: {
    pageViews: number; sessions: number; ctaClicks: number; estimates: number; leads: number;
    telegramClicks: number; phoneClicks: number; emailClicks: number; caseViews: number;
    fileUploads: number; conversion: number; portfolioDownloads: number; showreelPlays: number;
  };
  daily: Array<{ day: string; views: number; sessions: number; leads: number }>;
  sources: Array<{ label: string; value: number }>;
  pages: Array<{ label: string; value: number }>;
};

type NotificationChannel = "telegram" | "webhook" | "none";
type AccessMode = "owner" | "key";

function adminHeaders(key: string): Record<string, string> {
  return key ? { "x-trifoti-admin-key": key } : {};
}

const statuses = ["Новая", "Оценка", "Согласование", "Ожидает клиента", "Моделирование", "Производство", "Контроль", "Готово", "Закрыта"];

function normalizeStatus(status: string) {
  return ({ "В работе": "Оценка", "Расчёт отправлен": "Согласование", "Заказ": "Производство", "Закрыта": "Закрыта" } as Record<string, string>)[status] ?? status;
}

function moscowDate(value: string) {
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short", timeStyle: "short", timeZone: "Europe/Moscow",
  }).format(date);
}

function needsReply(lead: Lead) {
  const createdAt = new Date(`${lead.createdAt.replace(" ", "T")}Z`).getTime();
  return lead.status === "Новая" && Number.isFinite(createdAt) && Date.now() - createdAt > 4 * 3_600_000;
}

function contactHref(lead: Lead) {
  const contact = lead.contact.trim();
  if (lead.contactMethod === "E-mail" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(contact)) return `mailto:${contact}`;
  if (lead.contactMethod === "Телефон") {
    const phone = `${contact.startsWith("+") ? "+" : ""}${contact.replace(/\D/g, "")}`;
    return phone.replace(/\D/g, "").length >= 10 ? `tel:${phone}` : null;
  }
  if (lead.contactMethod === "Telegram") {
    if (/^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}\/?$/i.test(contact)) return contact;
    const handle = contact.replace(/^@/, "");
    return /^[A-Za-z0-9_]{5,32}$/.test(handle) ? `https://t.me/${handle}` : null;
  }
  return null;
}

function AnalyticsPanel({ analytics, days, loading, onDaysChange }: {
  analytics: Analytics | null;
  days: number;
  loading: boolean;
  onDaysChange: (days: number) => void;
}) {
  const totals = analytics?.totals;
  const dailyMaximum = Math.max(1, ...(analytics?.daily.map((item) => Number(item.views)) ?? []));
  const sourceMaximum = Math.max(1, ...(analytics?.sources.map((item) => Number(item.value)) ?? []));
  const pageMaximum = Math.max(1, ...(analytics?.pages.map((item) => Number(item.value)) ?? []));
  const metrics = [
    ["Просмотры", totals?.pageViews ?? 0],
    ["Сессии", totals?.sessions ?? 0],
    ["Переходы к заявке", totals?.ctaClicks ?? 0],
    ["Расчёты", totals?.estimates ?? 0],
    ["Заявки", totals?.leads ?? 0],
    ["Конверсия", `${totals?.conversion ?? 0}%`],
  ];

  return (
    <section className="analytics-panel" aria-labelledby="analytics-title">
      <div className="analytics-heading">
        <div><p className="kicker">Собственная аналитика</p><h2 id="analytics-title">Воронка сайта</h2></div>
        <label><span>Период</span><select value={days} disabled={loading} onChange={(event) => onDaysChange(Number(event.target.value))}><option value={7}>7 дней</option><option value={30}>30 дней</option><option value={90}>90 дней</option></select></label>
      </div>
      <div className="analytics-metrics">
        {metrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{loading ? "…" : value}</strong></article>)}
      </div>
      {!loading && !analytics?.daily.length && <div className="analytics-empty">Статистика начнёт собираться после публикации этой версии сайта.</div>}
      {Boolean(analytics?.daily.length) && (
        <div className="analytics-grid">
          <article className="analytics-trend">
            <header><h3>Посещаемость</h3><span>просмотры по дням</span></header>
            <div className="analytics-bars" aria-label="График просмотров по дням">
              {analytics?.daily.map((item) => (
                <div key={item.day} title={`${item.day}: ${item.views} просмотров, ${item.sessions} сессий`}>
                  <i style={{ height: `${Math.max(6, (Number(item.views) / dailyMaximum) * 100)}%` }} />
                  <span>{new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(new Date(`${item.day}T12:00:00Z`))}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="analytics-ranking">
            <header><h3>Источники</h3><span>по просмотрам</span></header>
            {(analytics?.sources ?? []).map((item) => <div className="analytics-rank" key={item.label}><p><span>{item.label}</span><strong>{item.value}</strong></p><i><b style={{ width: `${(Number(item.value) / sourceMaximum) * 100}%` }} /></i></div>)}
          </article>
          <article className="analytics-ranking">
            <header><h3>Страницы</h3><span>по просмотрам</span></header>
            {(analytics?.pages ?? []).map((item) => <div className="analytics-rank" key={item.label}><p><span>{item.label || "/"}</span><strong>{item.value}</strong></p><i><b style={{ width: `${(Number(item.value) / pageMaximum) * 100}%` }} /></i></div>)}
          </article>
        </div>
      )}
      {totals && <p className="analytics-note">Дополнительно: кейсы — {totals.caseViews}, Telegram — {totals.telegramClicks}, телефон — {totals.phoneClicks}, почта — {totals.emailClicks}, загрузки файлов — {totals.fileUploads}, скачивания портфолио — {totals.portfolioDownloads}, запуски ролика — {totals.showreelPlays}.</p>}
    </section>
  );
}

export default function LeadsPage() {
  const [key, setKey] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [accessMode, setAccessMode] = useState<AccessMode | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [salesRefresh, setSalesRefresh] = useState(0);
  const [leadsGeneration, setLeadsGeneration] = useState(0);
  const [statusFilter, setStatusFilter] = useState("Все статусы");
  const [notificationChannel, setNotificationChannel] = useState<NotificationChannel | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await loadLeads("", true);
      if (cancelled || result !== "unauthorized") return;
      let saved = "";
      try { saved = sessionStorage.getItem("trifoti-admin-key") || ""; } catch { /* A manager can still enter a key when storage is unavailable. */ }
      if (saved) { setKey(saved); void loadLeads(saved); }
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((lead) => lead.status === "Новая").length,
    attention: leads.filter(needsReply).length,
    active: leads.filter((lead) => ["Оценка", "Согласование", "Ожидает клиента", "Моделирование"].includes(lead.status)).length,
    orders: leads.filter((lead) => ["Производство", "Контроль", "Готово"].includes(lead.status)).length,
  }), [leads]);

  const visibleLeads = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ru-RU");
    return leads.filter((lead) => {
      const statusMatches = statusFilter === "Все статусы" || lead.status === statusFilter;
      const textMatches = !needle || [lead.publicId, lead.name, lead.contact, lead.projectType, lead.details]
        .some((value) => value.toLocaleLowerCase("ru-RU").includes(needle));
      return statusMatches && textMatches;
    });
  }, [leads, query, statusFilter]);

  async function loadLeads(candidate = key, silentUnauthorized = false): Promise<"ok" | "unauthorized" | "error"> {
    setLoading(true); setError("");
    try {
      const headers = adminHeaders(candidate);
      const [response, analyticsResponse] = await Promise.all([
        fetch("/api/leads?limit=200", { headers, credentials: "same-origin" }),
        fetch(`/api/events?days=${analyticsDays}`, { headers, credentials: "same-origin" }),
      ]);
      const data = await response.json() as { leads?: Lead[]; authorization?: AccessMode; notification?: { channel?: NotificationChannel }; error?: string };
      if (response.status === 401) {
        setAuthorized(false); setAccessMode(null); setLeads([]); setAnalytics(null); setNotificationChannel(null);
        if (!silentUnauthorized) setError(data.error || "Войдите как владелец или введите код менеджера.");
        return "unauthorized";
      }
      if (!response.ok) throw new Error(data.error || "Не удалось загрузить заявки.");
      if (data.authorization !== "owner" && data.authorization !== "key") throw new Error("Сервер не подтвердил доступ к кабинету.");
      try {
        if (data.authorization === "key") sessionStorage.setItem("trifoti-admin-key", candidate);
        else sessionStorage.removeItem("trifoti-admin-key");
      } catch { /* Keep the verified access for this page when browser storage is unavailable. */ }
      setKey(data.authorization === "key" ? candidate : "");
      setAccessMode(data.authorization);
      setLeads((data.leads ?? []).map((lead) => ({ ...lead, status: normalizeStatus(lead.status) })));
      setNotificationChannel(data.notification?.channel ?? "none");
      setAuthorized(true);
      setSalesRefresh((value) => value + 1);
      setLeadsGeneration((value) => value + 1);
      setAnalytics(analyticsResponse.ok ? await analyticsResponse.json() as Analytics : null);
      return "ok";
    } catch (requestError) {
      setAuthorized(false); setAccessMode(null); setLeads([]); setAnalytics(null);
      setNotificationChannel(null);
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить заявки.");
      return "error";
    } finally { setLoading(false); setSessionChecked(true); }
  }

  async function loadAnalytics(days: number) {
    setAnalyticsDays(days);
    if (!authorized) return;
    setAnalyticsLoading(true);
    try {
      const response = await fetch(`/api/events?days=${days}`, { headers: adminHeaders(key) });
      if (!response.ok) throw new Error("Не удалось обновить статистику.");
      setAnalytics(await response.json() as Analytics);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось обновить статистику.");
    } finally { setAnalyticsLoading(false); }
  }

  function closeAccess() {
    try { sessionStorage.removeItem("trifoti-admin-key"); } catch { /* No retained browser key. */ }
    setKey(""); setLeads([]); setAnalytics(null); setAuthorized(false); setAccessMode(null); setQuery(""); setStatusFilter("Все статусы"); setNotificationChannel(null); setError("");
  }

  async function changeStatus(id: number, status: string) {
    try {
    const response = await fetch("/api/leads", { method: "PATCH", headers: { "content-type": "application/json", ...adminHeaders(key) }, body: JSON.stringify({ id, status }) });
    if (!response.ok) { setError("Не удалось изменить статус."); return; }
    setLeads((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    } catch { setError("Нет связи с сервером. Проверьте подключение и повторите действие."); }
  }

  async function downloadCsv() {
    try {
    const response = await fetch("/api/leads?limit=500&format=csv", { headers: adminHeaders(key) });
    if (!response.ok) { setError("Не удалось подготовить выгрузку."); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a"); link.href = url; link.download = "trifoti-leads.csv"; link.click(); URL.revokeObjectURL(url);
    } catch { setError("Нет связи с сервером. Проверьте подключение и повторите действие."); }
  }

  async function downloadFile(file: { id: number; fileName: string }) {
    try {
    const response = await fetch(`/api/files/${file.id}`, { headers: adminHeaders(key) });
    if (!response.ok) { setError(`Не удалось скачать ${file.fileName}.`); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a"); link.href = url; link.download = file.fileName; link.click(); URL.revokeObjectURL(url);
    } catch { setError("Не удалось скачать файл. Проверьте подключение и повторите действие."); }
  }

  return (
    <main className="leads-admin">
      <header className="leads-header"><Brand href="/" /><Link href="/">← Вернуться на сайт</Link></header>
      <section className="leads-shell">
        <div className="leads-title"><div><p className="kicker">Рабочий кабинет</p><h1>Заявки ТРИФОТИ</h1><p>Закрытый реестр обращений с сайта. Меняйте этап, связывайтесь с клиентом и выгружайте данные для работы.</p></div><a href="mailto:projects.step3d@gmail.com">projects.step3d@gmail.com ↗</a></div>
        <form className="leads-login" onSubmit={(event) => { event.preventDefault(); void loadLeads(); }}>
          {!authorized && sessionChecked && <label><span>Код менеджера</span><input type="password" value={key} onChange={(event) => setKey(event.target.value)} autoComplete="current-password" placeholder="Введите код доступа" /></label>}
          {authorized && accessMode === "owner" && <p>Вход через аккаунт владельца.</p>}
          <button type="submit" disabled={loading}>{loading ? "Загружаем…" : authorized ? "Обновить" : "Открыть реестр"}</button>
          {authorized && <button type="button" className="secondary" onClick={() => void downloadCsv()}>Скачать CSV</button>}
          {authorized && accessMode === "key" && <button type="button" className="secondary" onClick={closeAccess}>Выйти из кабинета</button>}
          {!authorized && sessionChecked && <a href="/signin-with-chatgpt?return_to=%2Fleads" target="_top">Войти как владелец</a>}
        </form>
        {error && <p className="admin-error" role="alert">{error}</p>}
        {!loading && !authorized && !error && <div className="leads-empty">Войдите через аккаунт владельца или используйте код менеджера, чтобы увидеть поступившие заявки.</div>}
        {authorized && (
          <>
            <div className={`notification-status notification-status-${notificationChannel ?? "none"}`} role="status">
              <span aria-hidden="true" />
              <div>
                <strong>{notificationChannel === "telegram" ? "Telegram-уведомления настроены" : notificationChannel === "webhook" ? "Webhook-уведомления настроены" : "Мгновенные уведомления ещё не подключены"}</strong>
                <p>{notificationChannel === "none" ? "Все обращения сохраняются в реестре. Для мгновенной доставки уже подготовлено подключение Telegram или защищённого webhook." : "Новые заявки сохраняются в реестре. По настроенному каналу выполняется отправка уведомлений; при сбое доставки заявка остаётся доступной здесь."}</p>
              </div>
            </div>
            <div className="crm-stats"><article><span>Всего</span><strong>{stats.total}</strong></article><article><span>Новые</span><strong>{stats.new}</strong></article><article className={stats.attention ? "has-attention" : ""}><span>Без ответа &gt; 4 ч</span><strong>{stats.attention}</strong></article><article><span>В оценке</span><strong>{stats.active}</strong></article><article><span>В производстве / готово</span><strong>{stats.orders}</strong></article></div>
            <SalesPanel adminKey={key} refresh={salesRefresh} />
            <AnalyticsPanel analytics={analytics} days={analyticsDays} loading={analyticsLoading} onDaysChange={(days) => void loadAnalytics(days)} />
            <div className="crm-toolbar">
              <label><span>Поиск</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Номер, клиент, контакт или задача" /></label>
              <label><span>Этап</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Все статусы</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <strong>{visibleLeads.length} из {leads.length}</strong>
            </div>
            {visibleLeads.length === 0 && <div className="leads-empty">{leads.length ? "По выбранным условиям заявок нет." : "Заявок пока нет — новые обращения появятся здесь автоматически."}</div>}
            <div className="leads-list" aria-live="polite">
              {visibleLeads.map((lead) => {
                const needsAttention = needsReply(lead);
                const contactLink = contactHref(lead);
                return (
                  <article className={`lead-card ${needsAttention ? "lead-overdue" : ""}`} key={lead.id}>
                    <div className="lead-card-top"><div><span>{lead.publicId}</span><time dateTime={`${lead.createdAt.replace(" ", "T")}Z`}>{moscowDate(lead.createdAt)} МСК {needsAttention && "· требуется ответ"}</time></div><select value={lead.status} onChange={(event) => void changeStatus(lead.id, event.target.value)} aria-label={`Этап заявки ${lead.publicId}`}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div>
                    <h2>{lead.name}</h2>
                    <p className="lead-project">{lead.projectType} · {lead.projectFormat}</p>
                    <p className="lead-details">{lead.details}</p>
                    {lead.estimateMin != null && lead.estimateMax != null && <p className="lead-estimate">Калькулятор: {new Intl.NumberFormat("ru-RU").format(lead.estimateMin)}–{new Intl.NumberFormat("ru-RU").format(lead.estimateMax)} ₽<small>{lead.estimateSummary}</small></p>}
                    {lead.files?.length > 0 && <div className="lead-files"><span>Файлы клиента</span>{lead.files.map((file) => <button type="button" onClick={() => void downloadFile(file)} key={file.id}>{file.fileName} · {(file.size / 1024 / 1024).toFixed(1)} МБ ↓</button>)}</div>}
                    <SalesEditor key={`${lead.id}-${leadsGeneration}`} lead={lead} adminKey={key} onSaved={(id, sales) => { setLeads((items) => items.map((item) => item.id === id ? { ...item, ...sales } : item)); setSalesRefresh((value) => value + 1); }} />
                    <dl><div><dt>Контакт</dt><dd>{contactLink ? <a className="lead-contact-link" href={contactLink} target={lead.contactMethod === "Telegram" ? "_blank" : undefined} rel={lead.contactMethod === "Telegram" ? "noopener noreferrer" : undefined}>{lead.contact} · {lead.contactMethod} ↗</a> : <>{lead.contact} · {lead.contactMethod}</>}</dd></div><div><dt>Бюджет</dt><dd>{lead.budget}</dd></div><div><dt>Срок</dt><dd>{lead.deadline || "Не указан"}</dd></div><div><dt>Источник</dt><dd>{[lead.source, lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" · ") || "website"}</dd></div></dl>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
