"use client";
import { useState } from "react";
import { TechnologyMotion } from "./TechnologyMotion";

const stages = [
  { name: "Идея", title: "Находим характер будущего объекта.", text: "Обсуждаем образ, назначение и пространство. Собираем референсы и определяем масштаб — начать можно с фотографии или нескольких слов.", image: "/images/cases/parshin-sculptures/relief-finished.webp", caption: "Фёдор Паршин. Авторская рельефная композиция", alt: "Фёдор Паршин рядом с крупной рельефной скульптурой" },
  { name: "Проект", title: "Продумываем форму и конструкцию.", text: "Создаём цифровую модель, уточняем пропорции и разбиение. Согласуем внешний вид, состав работ, бюджет и контрольные точки.", image: "/images/cases/pletneva-costume/06-lacing-detail.webp", caption: "Проект команды. Проверка соединений сценического костюма", alt: "Соединения модулей 3D-печатного сценического костюма" },
  { name: "Мастерская", title: "Соединяем технологии и ручную работу.", text: "Изготавливаем элементы, собираем объект и доводим поверхность. Показываем промежуточный результат на согласованных этапах.", image: "/images/cases/sakharov-art/finishing.webp", caption: "Проект команды. Ручная обработка интерьерного панно", alt: "Ручная обработка крупного круглого панно в мастерской" },
  { name: "Пространство", title: "Помогаем объекту занять своё место.", text: "Проверяем готовое изделие, продумываем упаковку и передачу. Доставку, крепления и монтаж включаем в согласованный состав проекта.", image: "/images/cases/sakharov-art/ring-installed.webp", caption: "Проект команды. Панно в интерьере на проспекте Сахарова", alt: "Синее рельефное панно, установленное в общественном интерьере" },
];

export function StudioProcess() {
  const [active, setActive] = useState(2);
  const [demoOpen, setDemoOpen] = useState(false);
  const stage = stages[active];
  return <section className="tri-process" id="process" aria-labelledby="process-title">
    <div className="tri-section-top"><p className="tri-eyebrow">04 / Подход</p><span>От замысла до воплощения</span></div>
    <div className="tri-process-grid">
      <div className="tri-process-copy"><h2 id="process-title">У каждой формы<br />есть свой путь.</h2>
        <div className="tri-stage-nav" role="group" aria-label="Этапы работы">{stages.map((item, index) => <button key={item.name} type="button" aria-pressed={active === index} onClick={() => setActive(index)}><span>0{index + 1}</span>{item.name}</button>)}</div>
        <div className="tri-stage-copy" aria-live="polite"><h3>{stage.title}</h3><p>{stage.text}</p></div>
        <a className="tri-text-link" href="#request">Начать с вашей идеи <span>↗</span></a>
      </div>
      <figure className="tri-stage-image"><img key={stage.image} src={stage.image} alt={stage.alt} width={1152} height={1536} loading="lazy" decoding="async" /><figcaption>{stage.caption}</figcaption></figure>
    </div>
    <details className="tri-technology" onToggle={event => setDemoOpen(event.currentTarget.open)}><summary>Как работают 3D-технологии <span>Открыть интерактивную схему +</span></summary>{demoOpen && <TechnologyMotion />}</details>
  </section>;
}
