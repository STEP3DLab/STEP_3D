"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "../components/Brand";

type LeadStatus = { publicId: string; createdAt: string; updatedAt: string; status: string; projectType: string; projectFormat: string; deadline: string };

const stages = [
  { title: "Оценка", text: "Проверяем задачу и исходные материалы" },
  { title: "Согласование", text: "Фиксируем результат, цену и срок" },
  { title: "Моделирование", text: "Создаём или готовим цифровую модель" },
  { title: "Производство", text: "Печатаем, собираем и обрабатываем" },
  { title: "Контроль", text: "Проверяем результат перед передачей" },
  { title: "Готово", text: "Упаковываем и согласуем получение" },
];

const statusIndex: Record<string, number> = {
  "Новая": 0, "Оценка": 0,
  "Согласование": 1,
  "Моделирование": 2,
  "Производство": 3,
  "Контроль": 4,
  "Готово": 5,
};

function moscowDate(value: string) {
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long", timeStyle: "short", timeZone: "Europe/Moscow",
  }).format(date);
}

export default function StatusPage() {
  const [lead, setLead] = useState<LeadStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const token = params.get("token");
    if (!id || !token) {
      const timer = window.setTimeout(() => { setError("Откройте персональную ссылку, полученную после отправки заявки."); setLoading(false); }, 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let active = true;
    fetch(`/api/status?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as { lead?: LeadStatus; error?: string };
        if (!response.ok || !data.lead) throw new Error(data.error || "Не удалось загрузить статус.");
        if (active) setLead(data.lead);
      })
      .catch((requestError) => {
        if (active) setError(controller.signal.aborted ? "Ответ задерживается. Обновите страницу или свяжитесь со студией ТРИФОТИ." : requestError instanceof Error ? requestError.message : "Не удалось загрузить статус.");
      })
      .finally(() => { window.clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, []);

  const currentIndex = lead ? statusIndex[lead.status] ?? -1 : -1;

  return (
    <main className="status-page" id="content" tabIndex={-1}>
      <a className="skip-link" href="#content">Перейти к содержанию</a>
      <header className="simple-header"><Brand href="/" /><Link href="/">← На главную</Link></header>
      <section className="status-shell">
        <p className="kicker">Кабинет заказчика</p>
        <h1>Статус проекта</h1>
        {loading && <div className="status-loading" role="status">Проверяем актуальный этап…</div>}
        {error && <div className="status-error" role="alert">{error}<br /><a href="mailto:projects.step3d@gmail.com">Связаться со студией ТРИФОТИ</a></div>}
        {lead && (
          <>
            <div className="status-card">
              <div><span>Заявка</span><strong>{lead.publicId}</strong></div>
              <div><span>Проект</span><strong>{lead.projectType}</strong><small>{lead.projectFormat}</small></div>
              <div><span>Обновлено</span><strong>{moscowDate(lead.updatedAt)} МСК</strong>{lead.deadline && <small>Желаемый срок: {lead.deadline}</small>}</div>
            </div>
            <div className="status-current"><span>Статус заявки</span><strong>{lead.status}</strong><p>{currentIndex >= 0 ? stages[currentIndex].text : lead.status === "Закрыта" ? "Работа с заявкой завершена. Подробности можно уточнить у менеджера." : "Менеджер уточняет параметры проекта. Этап производства отображается после его подтверждения."}</p></div>
            {currentIndex >= 0 && <ol className="status-timeline">
              {stages.map((stage, index) => (
                <li className={index <= currentIndex ? "done" : ""} aria-current={index === currentIndex ? "step" : undefined} key={stage.title}>
                  <i>{index < currentIndex ? "✓" : index + 1}</i>
                  <div><strong>{stage.title}</strong><span>{index === currentIndex ? "Сейчас" : index < currentIndex ? "Пройдено" : "Впереди"}</span></div>
                </li>
              ))}
            </ol>}
            <p className="status-note">Страница не содержит ваших контактных данных. Не пересылайте персональную ссылку третьим лицам.</p>
          </>
        )}
      </section>
    </main>
  );
}
