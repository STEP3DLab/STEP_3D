"use client";

import { useRef, useState } from "react";
import { company } from "../legal-data";
import "./direct-brief.css";

export function DirectBrief({ message, onEdit, onReset }: {
  message: string;
  onEdit: () => void;
  onReset: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const [textOpen, setTextOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const telegramHref = `https://t.me/step_3d_mngr?text=${encodeURIComponent(message)}`;
  const emailHref = `mailto:${company.email}?subject=${encodeURIComponent("Новый проект — ТРИФОТИ")}&body=${encodeURIComponent(message)}`;

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus("Бриф скопирован. Вставьте его в сообщение студии.");
    } catch {
      setTextOpen(true);
      window.requestAnimationFrame(() => { textRef.current?.focus(); textRef.current?.select(); });
      setCopyStatus("Текст выделен. Скопируйте его через меню устройства или Ctrl/Cmd + C.");
    }
  }

  function downloadBrief() {
    const file = new Blob([message], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trifoti-brief.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="tri-direct-brief" id="request-success" tabIndex={-1}>
      <p className="tri-eyebrow">Ваш следующий шаг</p>
      <h3>Идея собрана.<br /><em>Давайте обсудим.</em></h3>
      <p>Бриф подготовлен. Откройте Telegram или почту, проверьте сообщение и отправьте его студии. Файлы можно приложить там.</p>
      <div className="tri-direct-actions">
        <a className="tri-button" href={telegramHref} target="_blank" rel="noopener noreferrer">Открыть Telegram <span aria-hidden="true">↗</span></a>
        <a href={emailHref}>Подготовить письмо <span aria-hidden="true">↗</span></a>
      </div>
      <details className="tri-direct-text" open={textOpen} onToggle={event => setTextOpen(event.currentTarget.open)}>
        <summary>Посмотреть текст брифа</summary>
        <label htmlFor="prepared-brief">Текст сообщения</label>
        <textarea ref={textRef} id="prepared-brief" value={message} readOnly rows={12} spellCheck={false} />
      </details>
      <div className="tri-direct-tools">
        <button type="button" onClick={() => void copyBrief()}>Скопировать бриф</button>
        <button type="button" onClick={downloadBrief}>Скачать .txt</button>
      </div>
      <p className="tri-direct-status" role="status">{copyStatus}</p>
      <p className="tri-direct-note">Сообщение отправится после вашего подтверждения в выбранном приложении.</p>
      <div className="tri-direct-edit">
        <button type="button" onClick={onEdit}>← Изменить бриф</button>
        <button type="button" onClick={onReset}>Новая идея +</button>
      </div>
    </div>
  );
}
