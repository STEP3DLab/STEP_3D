/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export function EngineeringProof({ compact = false }: { compact?: boolean }) {
  return <section className={`engineering-proof${compact ? " compact" : ""}`} aria-labelledby="engineering-proof-title">
    <div><p className="kicker">Техническая сторона реального проекта</p><h2 id="engineering-proof-title">Красивую форму<br /><em>нужно ещё собрать.</em></h2><p>В костюме Анны Плетнёвой важны не только силуэт, но и посадка, соединения модулей и свобода движения.</p><ol><li><b>Исходные данные</b><span>3D-скан фигуры и требования к сценическому образу.</span></li><li><b>Конструкция</b><span>Цифровая модель и отдельные элементы для печати и сборки.</span></li><li><b>Проверка</b><span>Примерки, подгонка корпуса и плечевых накладок.</span></li></ol><Link href="/cases/pletneva-costume#engineering">Посмотреть технический разбор</Link></div>
    <figure><img src="/images/cases/pletneva-costume/03-front-fitting.webp" alt="Сборка и подгонка модульных элементов костюма Анны Плетнёвой" width={1152} height={1536} loading="lazy" decoding="async" /><figcaption>Реальная сборка: проверка взаимного положения деталей перед отделкой.</figcaption></figure>
  </section>;
}
