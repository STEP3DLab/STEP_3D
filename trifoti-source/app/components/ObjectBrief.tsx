"use client";
import { useState } from "react";
import { STAGE_REQUEST_TYPE } from "../project-routing";

const kinds = [
  { label: "Скульптура", type: "Скульптура / арт-объект" },
  { label: "Интерьерный объект", type: "Декор / инсталляция" },
  { label: "Авторская награда", type: "Кубок / награда" },
  { label: "Сцена и костюм", type: STAGE_REQUEST_TYPE },
];

export function ObjectBrief({ onApply }: { onApply: (type: string, summary: string, format?: string) => void }) {
  const [kind, setKind] = useState(0);
  const [scale, setScale] = useState("До 50 см");
  const [context, setContext] = useState("В интерьере");
  const [amount, setAmount] = useState("Один объект");
  const summary = `${kinds[kind].label}. Размер: ${scale.toLowerCase()}. Размещение: ${context.toLowerCase()}. Количество: ${amount.toLowerCase()}.`;
  return <section className="tri-config" id="calculator" aria-labelledby="config-title">
    <div className="tri-config-heading"><p className="tri-eyebrow">05 / Ваш будущий объект</p><h2 id="config-title">Начнём<br />с главного.</h2><p>Несколько параметров помогут нам предложить подходящий способ реализации.</p></div>
    <div className="tri-config-controls">
      <fieldset><legend>01 — Что создаём?</legend><div className="tri-config-kinds">{kinds.map((item, i) => <button key={item.label} type="button" aria-pressed={i === kind} onClick={() => setKind(i)}>{item.label}</button>)}</div></fieldset>
      <div className="tri-config-row"><label><span>02 — Масштаб</span><select value={scale} onChange={e => setScale(e.target.value)}>{["До 50 см", "50–100 см", "1–2 метра", "Более 2 метров", "Пока не определён"].map(v => <option key={v}>{v}</option>)}</select></label><label><span>03 — Пространство</span><select value={context} onChange={e => setContext(e.target.value)}>{["В интерьере", "На улице", "На сцене или выставке", "Уточним вместе"].map(v => <option key={v}>{v}</option>)}</select></label><label><span>04 — Количество</span><select value={amount} onChange={e => setAmount(e.target.value)}>{["Один объект", "Небольшая серия", "Тираж", "Уточним вместе"].map(v => <option key={v}>{v}</option>)}</select></label></div>
      <div className="tri-config-result"><div><span>Состав будущего проекта</span><p aria-live="polite">{summary}</p></div><button className="tri-button" type="button" onClick={() => onApply(kinds[kind].type, summary, amount === "Один объект" ? "Единичный объект" : amount === "Уточним вместе" ? undefined : "Серия или тираж")}>Перейти к брифу <span>↗</span></button></div>
      <p className="tri-config-note">Стоимость рассчитываем после обсуждения формы, материала, отделки и условий размещения.</p>
    </div>
  </section>;
}
