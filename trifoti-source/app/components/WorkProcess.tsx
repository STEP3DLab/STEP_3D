"use client";

import { useState } from "react";
import { TechnologyMotion } from "./TechnologyMotion";

const steps = [
  ["Расскажите о задаче", "Пришлите файл, фото или идею. Укажите, для чего нужен результат."],
  ["Проверим исходники", "Уточним размеры, количество, материал и требования к готовому объекту."],
  ["Согласуем смету", "Зафиксируем состав работ, цену, срок и точки проверки до старта."],
  ["Подготовим модель", "Согласуем геометрию или образец, если этот этап нужен вашему проекту."],
  ["Изготовим и проверим", "Выполним согласованные работы и проверим результат по ТЗ."],
  ["Передадим результат", "Согласуем получение файлов или изделий и подготовим документы."],
];

export function WorkProcess() {
  const [demoOpen, setDemoOpen] = useState(false);
  return <section className="section work-process" id="process" aria-labelledby="process-title">
    <div className="section-heading horizontal"><div><p className="kicker">03 / Как работаем</p><h2 id="process-title">От первого сообщения<br /><em>до готового результата.</em></h2></div><p>Вы знаете, что происходит на каждом этапе и что нужно согласовать. Для печати по готовой модели путь короче.</p></div>
    <ol className="process-steps">{steps.map(([title, text], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
    <details className="technology-disclosure" onToggle={event => setDemoOpen(event.currentTarget.open)}><summary>Как устроены 3D-модель, печать и сканирование <span>Интерактивная демонстрация</span></summary>{demoOpen && <TechnologyMotion />}</details>
  </section>;
}
