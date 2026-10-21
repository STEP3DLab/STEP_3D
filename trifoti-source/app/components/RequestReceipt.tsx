"use client";

import { useState } from "react";
import { responseHours, responseNextStep } from "../request-copy";

export function RequestReceipt({ leadId, leadToken }: { leadId: string; leadToken: string }) {
  const [feedback, setFeedback] = useState("");
  const statusPath = `/status?id=${encodeURIComponent(leadId)}&token=${encodeURIComponent(leadToken)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(statusPath, window.location.origin).href);
      setFeedback("Ссылка скопирована.");
    } catch {
      setFeedback("Не удалось скопировать. Сохраните подтверждение кнопкой ниже или скопируйте адрес открытой страницы статуса.");
    }
  }

  function saveReceipt() {
    const content = ["ТРИФОТИ — подтверждение заявки", `Номер: ${leadId}`, `Статус: ${new URL(statusPath, window.location.origin).href}`, "", responseHours, responseNextStep, "", "Связь: projects.step3d@gmail.com · +7 995 900-91-41", "Ссылка персональная. Не передавайте её третьим лицам."].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `Trifoti-${leadId}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("Подтверждение подготовлено к скачиванию.");
  }

  return <section className="request-receipt" aria-label="Подтверждение заявки">
    <h4>Что дальше</h4>
    <p>{responseNextStep}</p><p>{responseHours} По срочным задачам — телефон или Telegram.</p>
    <p>Сохраните персональную ссылку: по ней можно узнать статус заявки.</p>
    <div className="receipt-actions"><button type="button" onClick={() => void copyLink()}>Скопировать ссылку на статус</button><button type="button" onClick={saveReceipt}>Сохранить подтверждение</button></div>
    <p className="receipt-feedback" role="status">{feedback}</p>
  </section>;
}
