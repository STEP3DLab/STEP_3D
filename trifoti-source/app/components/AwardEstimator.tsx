"use client";

import { useMemo, useState } from "react";
import { baseServiceEstimates } from "../estimate-data";

const sizes = [
  { value: "до 20 см", factor: .78 },
  { value: "20–40 см", factor: 1 },
  { value: "40–70 см", factor: 1.55 },
];

const quantities = [
  { value: "1 экземпляр", factor: 1, format: "Единичный объект" },
  { value: "2–10 экземпляров", factor: 1.75, format: "Серия или тираж" },
  { value: "11–30 экземпляров", factor: 3.2, format: "Серия или тираж" },
  { value: "31–50 экземпляров", factor: 4.5, format: "Серия или тираж" },
];

const startingPoints = [
  { value: "Есть готовая 3D-модель", factor: .82 },
  { value: "Есть эскиз или референсы", factor: 1 },
  { value: "Нужна разработка идеи", factor: 1.18 },
];

const finishes = [
  { value: "Готовое изделие", factor: 1 },
  { value: "Премиальная ручная отделка", factor: 1.42 },
];

function roundFive(value: number) {
  return Math.max(5_000, Math.round(value / 5_000) * 5_000);
}

function money(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function trackEstimate(min: number, max: number) {
  window.dispatchEvent(new CustomEvent("step3d:conversion", {
    detail: { event: "estimate_complete", source: "awards_calculator", project_type: "Кубок / награда", estimate_min: min, estimate_max: max },
  }));
}

export function AwardEstimator() {
  const [size, setSize] = useState(sizes[1].value);
  const [quantity, setQuantity] = useState(quantities[0].value);
  const [startingPoint, setStartingPoint] = useState(startingPoints[1].value);
  const [finish, setFinish] = useState(finishes[0].value);
  const [urgent, setUrgent] = useState(false);

  const estimate = useMemo(() => {
    const factor = sizes.find((item) => item.value === size)!.factor
      * quantities.find((item) => item.value === quantity)!.factor
      * startingPoints.find((item) => item.value === startingPoint)!.factor
      * finishes.find((item) => item.value === finish)!.factor
      * (urgent ? 1.35 : 1);
    const awardBase = baseServiceEstimates["Кубок / награда"];
    const min = roundFive(awardBase.min * factor);
    const max = roundFive(awardBase.max * factor);
    const summary = `Награда; размер: ${size}; количество: ${quantity}; исходные данные: ${startingPoint}; отделка: ${finish}; ${urgent ? "срочный срок" : "стандартный срок"}`;
    const format = quantities.find((item) => item.value === quantity)!.format;
    const params = new URLSearchParams({
      type: "Кубок / награда",
      format,
      estimate_min: String(min),
      estimate_max: String(max),
      estimate_summary: summary,
      step: "2",
      source: "awards_calculator",
    });
    return { min, max, summary, href: `/?${params.toString()}#request` };
  }, [finish, quantity, size, startingPoint, urgent]);

  return (
    <div className="award-estimator">
      <div className="award-estimator-controls">
        <label><span>Высота</span><select value={size} onChange={(event) => setSize(event.target.value)}>{sizes.map((item) => <option key={item.value}>{item.value}</option>)}</select></label>
        <label><span>Количество</span><select value={quantity} onChange={(event) => setQuantity(event.target.value)}>{quantities.map((item) => <option key={item.value}>{item.value}</option>)}</select></label>
        <label><span>Что уже есть</span><select value={startingPoint} onChange={(event) => setStartingPoint(event.target.value)}>{startingPoints.map((item) => <option key={item.value}>{item.value}</option>)}</select></label>
        <label><span>Финиш</span><select value={finish} onChange={(event) => setFinish(event.target.value)}>{finishes.map((item) => <option key={item.value}>{item.value}</option>)}</select></label>
        <label className="award-urgent"><input type="checkbox" checked={urgent} onChange={(event) => setUrgent(event.target.checked)} /><span><b>Нужен срочный выпуск</b><small>Проверим возможность срока от 10 дней</small></span></label>
      </div>
      <div className="award-estimator-result" aria-live="polite">
        <span>Предварительный диапазон проекта</span>
        <strong>{money(estimate.min)}–{money(estimate.max)} ₽</strong>
        <p>{estimate.summary}</p>
        <a href={estimate.href} onClick={() => trackEstimate(estimate.min, estimate.max)}>Запросить смету <i>↗</i></a>
        <small>Это предварительный ориентир за весь проект. Итоговая цена зависит от формы, материалов, персонализации, упаковки и срока.</small>
      </div>
    </div>
  );
}
