"use client";

import { useMemo, useState } from "react";
import { serviceEstimateOptions } from "../estimate-data";

const SIZES = [
  { value: "до 20 см", factor: .72 }, { value: "20–50 см", factor: 1 },
  { value: "50–100 см", factor: 1.65 }, { value: "более 1 м", factor: 2.6 },
];
const QUANTITIES = [
  { value: "1 экземпляр", factor: 1 }, { value: "2–10", factor: 1.75 },
  { value: "11–50", factor: 3.5 }, { value: "более 50", factor: 5.8 },
];
const FINISHES = [
  { value: "Технический прототип", factor: .82 }, { value: "Готовое изделие", factor: 1 },
  { value: "Премиальная отделка", factor: 1.48 },
];

const SERVICE_DETAILS: Record<string, { label: string; choices: string[]; note: string }> = {
  "3D-печать по готовой модели": { label: "Назначение детали", choices: ["Проверка формы и сборки", "Рабочая деталь под нагрузкой", "Декоративное изделие"], note: "Пришлите модель. Материал, заполнение и точность подберём под условия использования." },
  "3D-сканирование / реверсивный инжиниринг": { label: "Нужный результат", choices: ["Полигональная 3D-модель", "Модель, готовая к печати", "Редактируемая CAD-модель"], note: "Укажите требуемую точность и приложите фотографии. Восстановление CAD оценивается после осмотра геометрии." },
  "Кубок / награда": { label: "Персонализация", choices: ["Одинаковая серия", "Разные имена и номинации", "Индивидуальная форма каждого изделия"], note: "Для расчёта нужны количество, высота, дата вручения и логотип. Персонализацию и упаковку включим в смету отдельно." },
  "Скульптура / арт-объект": { label: "Где будет установлен объект", choices: ["В помещении", "На улице", "На временной выставке"], note: "Условия размещения влияют на материал, покрытие, крепления и монтаж. Уточним их до расчёта." },
  "Промышленный дизайн / прототип": { label: "Цель прототипа", choices: ["Проверка компоновки и сборки", "Проверка эргономики", "Функциональные испытания"], note: "Опишите, что должен подтвердить прототип. Согласуем критерии проверки и состав документации." },
};

function roundFive(value: number) { return Math.max(5_000, Math.round(value / 5_000) * 5_000); }
function money(value: number) { return new Intl.NumberFormat("ru-RU").format(value); }

export type Estimate = { min: number; max: number; summary: string };

const individualServices = [
  { value: "3D-моделирование / подготовка модели", label: "3D-моделирование" },
  { value: "AR/VR-приложение", label: "AR/VR и интерактивный 3D" },
  { value: "Другое", label: "Другая задача" },
];

export function Estimator({ onApply, onRequest, initialService }: { onApply: (type: string, estimate: Estimate) => void; onRequest: (type: string) => void; initialService?: string }) {
  const [service, setService] = useState(() => [...serviceEstimateOptions, ...individualServices].some((item) => item.value === initialService) ? initialService! : serviceEstimateOptions[0].value);
  const [size, setSize] = useState(SIZES[1].value);
  const [quantity, setQuantity] = useState(QUANTITIES[0].value);
  const [finish, setFinish] = useState(FINISHES[1].value);
  const [urgent, setUrgent] = useState(false);
  const [detail, setDetail] = useState("");
  const detailConfig = SERVICE_DETAILS[service];
  const selectedDetail = detailConfig?.choices.includes(detail) ? detail : detailConfig?.choices[0];
  const scanning = service.startsWith("3D-сканирование");
  const estimate = useMemo(() => {
    const base = serviceEstimateOptions.find((item) => item.value === service);
    if (!base) return null;
    const factor = SIZES.find((item) => item.value === size)!.factor * QUANTITIES.find((item) => item.value === quantity)!.factor * (scanning ? 1 : FINISHES.find((item) => item.value === finish)!.factor) * (urgent ? 1.35 : 1);
    return {
      min: roundFive(base.min * factor),
      max: roundFive(base.max * factor),
      summary: `${base.label}; размер: ${size}; тираж: ${quantity}; результат: ${scanning ? "цифровая модель; состав обработки согласуем" : finish}; ${urgent ? "срочный срок" : "стандартный срок"}${selectedDetail ? `; ${detailConfig.label.toLowerCase()}: ${selectedDetail}` : ""}`,
    };
  }, [finish, quantity, service, size, urgent, scanning, selectedDetail, detailConfig]);

  return (
    <div className="estimator-card">
      <div className="estimator-controls">
        <label><span>Что создаём</span><select value={service} onChange={(event) => { setService(event.target.value); setDetail(""); setFinish(FINISHES[1].value); }}>{[...serviceEstimateOptions, ...individualServices].map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        {estimate && <>
        <label><span>Габарит</span><select value={size} onChange={(event) => setSize(event.target.value)}>{SIZES.map((item) => <option key={item.value}>{item.value}</option>)}</select></label>
        <label><span>{scanning ? "Количество объектов" : "Количество изделий"}</span><select value={quantity} onChange={(event) => setQuantity(event.target.value)}>{QUANTITIES.map((item) => <option key={item.value}>{item.value}</option>)}</select></label>
        {!scanning && <label><span>Уровень готовности</span><select value={finish} onChange={(event) => setFinish(event.target.value)}>{FINISHES.map((item) => <option key={item.value}>{item.value}</option>)}</select></label>}
        {detailConfig && <label><span>{detailConfig.label}</span><select value={selectedDetail} onChange={event => setDetail(event.target.value)}>{detailConfig.choices.map(value => <option key={value}>{value}</option>)}</select></label>}
        <label className="urgent-toggle"><input type="checkbox" checked={urgent} onChange={(event) => setUrgent(event.target.checked)} /><span><b>Нужно быстрее</b><small>Проверим возможность и доплату</small></span></label>
        </>}
        {!estimate && <p className="estimate-disclaimer">Для расчёта нужны назначение модели или приложения, исходные материалы и требования к результату. Можно начать с короткого описания.</p>}
      </div>
      <div className="estimate-result" aria-live="polite">
        {estimate ? <>
        <span>Предварительная оценка · бюджетный ориентир</span>
        <strong>{money(estimate.min)}–{money(estimate.max)} ₽</strong>
        <p className="estimate-selection">{estimate.summary}</p>
        <p className="estimate-disclaimer">Диапазон помогает спланировать бюджет. Дополнительные требования передадим менеджеру для уточнения сметы. Состав работ и итоговую цену определим после проверки модели, чертежей и требований.</p>
        {detailConfig && <p className="estimate-disclaimer">{detailConfig.note}</p>}
        <p className="estimate-disclaimer">Это не минимальная цена заказа. Небольшие детали и нестандартные задачи рассчитаем по файлу; доставка и дополнительные работы согласуются отдельно.</p>
        <button type="button" onClick={() => onApply(service, estimate)}>Добавить расчёт к заявке</button>
        </> : <>
          <span>Индивидуальный расчёт</span>
          <strong>Оценим по задаче</strong>
          <p className="estimate-disclaimer">Стоимость зависит от сложности и состава работ. Согласуем результат, цену и срок до начала проекта.</p>
          <button type="button" onClick={() => onRequest(service)}>Описать задачу</button>
        </>}
      </div>
    </div>
  );
}
