"use client";

import { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import Link from "next/link";
import { STUDIO_OBJECT_PATH } from "./Brand";

type TechnologyMode = "model" | "print" | "scan";

const modes: Array<{ id: TechnologyMode; number: string; label: string; title: string; description: string }> = [
  { id: "model", number: "01", label: "3D-модель", title: "Объёмная цифровая модель", description: "Проверяем силуэт, пропорции и геометрию до изготовления." },
  { id: "print", number: "02", label: "3D-печать", title: "Послойное производство", description: "3D-принтер формирует физический объект слой за слоем по подготовленной модели." },
  { id: "scan", number: "03", label: "3D-скан", title: "Цифровая копия", description: "Сканер считывает поверхность физического объекта и превращает её в цифровую геометрию." },
];

const scanPoints = Array.from({ length: 88 }, (_, index) => {
  const column = index % 11;
  const row = Math.floor(index / 11);
  return [69 + column * 8.4, 96 + row * 8] as const;
});

function ModelScene() {
  const depthLayers = [12, 10, 8, 6, 4];
  return (
    <svg viewBox="0 0 240 210" role="img" aria-label="Интерактивная объёмная модель космического захватчика ТРИФОТИ">
      <defs>
        <linearGradient id="model-invader-surface" x1="67" y1="76" x2="177" y2="165" gradientUnits="userSpaceOnUse">
          <stop stopColor="#474747" /><stop offset=".5" stopColor="#1d2020" /><stop offset="1" stopColor="#090b0b" />
        </linearGradient>
        <clipPath id="model-invader-clip"><path d={STUDIO_OBJECT_PATH} transform="translate(42 48) scale(.3)" fillRule="evenodd" clipRule="evenodd" /></clipPath>
      </defs>
      <path className="model-grid" d="M25 176 103 137l112 27-75 39L25 176Zm78-39V38m0 99 37 66m-37-66-78 39m78-39 112 27M45 166l112 27M65 156l112 27M84 146l112 27" />
      <ellipse className="model-shadow" cx="120" cy="174" rx="67" ry="11" />
      <g className="model-invader">
        {depthLayers.map((offset) => <path key={offset} className="model-invader-depth" d={STUDIO_OBJECT_PATH} transform={`translate(${42 + offset * .72} ${48 + offset}) scale(.3)`} fillRule="evenodd" clipRule="evenodd" />)}
        <path className="model-invader-bevel" d={STUDIO_OBJECT_PATH} transform="translate(44 51) scale(.3)" fillRule="evenodd" clipRule="evenodd" />
        <path className="model-invader-front" d={STUDIO_OBJECT_PATH} transform="translate(42 48) scale(.3)" fillRule="evenodd" clipRule="evenodd" />
        <g className="model-mesh" clipPath="url(#model-invader-clip)">
          {Array.from({ length: 9 }, (_, index) => <path key={`h-${index}`} d={`M55 ${89 + index * 9}H185`} />)}
          {Array.from({ length: 11 }, (_, index) => <path key={`v-${index}`} d={`M${66 + index * 11} 76V170`} />)}
        </g>
      </g>
      <path className="model-axis axis-x" d="M119 174h75" /><path className="model-axis axis-y" d="M119 174 67 194" /><path className="model-axis axis-z" d="M119 174V87" />
      <g className="axis-labels"><text x="198" y="177">X</text><text x="59" y="199">Y</text><text x="113" y="82">Z</text><text x="163" y="198">STEP3D MODEL</text></g>
    </svg>
  );
}

function PrintScene() {
  return (
    <svg viewBox="0 0 240 210" role="img" aria-label="Анимация: 3D-принтер послойно печатает объёмного захватчика ТРИФОТИ">
      <defs>
        <clipPath id="print-invader-reveal"><rect className="print-reveal" x="70" y="97" width="104" height="68" /></clipPath>
        <clipPath id="print-invader-face"><path d={STUDIO_OBJECT_PATH} transform="translate(68 78) scale(.22)" fillRule="evenodd" clipRule="evenodd" /></clipPath>
      </defs>
      <path className="machine-frame" d="M32 182V28h176v154M24 182h192M45 45h150M54 164h132" />
      <path className="printer-rail" d="M48 50h144" />
      <path className="filament" d="M120 28V45" />
      <g className="printer-z"><g className="printer-head"><rect x="95" y="45" width="50" height="28" rx="2" /><path d="m108 73 5 14h14l5-14M120 87v13" /><circle cx="120" cy="102" r="2.5" /></g></g>
      <g clipPath="url(#print-invader-reveal)" className="printed-invader">
        <path className="print-invader-depth" d={STUDIO_OBJECT_PATH} transform="translate(73 86) scale(.22)" fillRule="evenodd" clipRule="evenodd" />
        <path className="print-invader-bevel" d={STUDIO_OBJECT_PATH} transform="translate(70.5 82) scale(.22)" fillRule="evenodd" clipRule="evenodd" />
        <path className="print-invader-front" d={STUDIO_OBJECT_PATH} transform="translate(68 78) scale(.22)" fillRule="evenodd" clipRule="evenodd" />
        <g className="print-layer-lines" clipPath="url(#print-invader-face)">{Array.from({ length: 11 }, (_, index) => <path key={index} className="print-layer-line" d={`M72 ${158 - index * 5.2}H170`} style={{ animationDelay: `${index * 95}ms` }} />)}</g>
      </g>
      <path className="printer-bed-front" d="M54 164h132l-8 10H62l-8-10Z" />
      <g className="axis-labels"><text x="198" y="58">X</text><text x="35" y="55">Z</text><text x="169" y="178">BUILD PLATE</text></g>
    </svg>
  );
}

function ScanScene() {
  return (
    <svg viewBox="0 0 240 210" role="img" aria-label="Анимация: сканер считывает объёмного захватчика ТРИФОТИ и строит цифровую модель">
      <defs>
        <linearGradient id="scan-invader-surface" x1="78" y1="88" x2="151" y2="157" gradientUnits="userSpaceOnUse">
          <stop stopColor="#444442" /><stop offset=".48" stopColor="#202323" /><stop offset="1" stopColor="#101313" />
        </linearGradient>
        <clipPath id="scan-invader-clip"><path d={STUDIO_OBJECT_PATH} transform="translate(54 70) scale(.22)" fillRule="evenodd" clipRule="evenodd" /></clipPath>
        <clipPath id="scan-points-reveal"><rect className="scan-points-reveal" x="66" y="94" width="94" height="64" /></clipPath>
      </defs>
      <path className="scan-grid" d="M25 176 96 141l119 24-72 37L25 176Zm71-35v-93m0 93 47 61m-47-61-71 35m71-35 119 24M44 166l112 23M62 157l112 23M80 149l112 23" />
      <ellipse className="scan-object-shadow" cx="113" cy="162" rx="55" ry="10" />
      <g className="scan-invader"><path className="scan-invader-depth" d={STUDIO_OBJECT_PATH} transform="translate(60 77) scale(.22)" fillRule="evenodd" clipRule="evenodd" /><path className="scan-invader-bevel" d={STUDIO_OBJECT_PATH} transform="translate(57 73.5) scale(.22)" fillRule="evenodd" clipRule="evenodd" /><path className="scan-invader-front" d={STUDIO_OBJECT_PATH} transform="translate(54 70) scale(.22)" fillRule="evenodd" clipRule="evenodd" /><path className="scan-invader-wire" d={STUDIO_OBJECT_PATH} transform="translate(54 70) scale(.22)" fillRule="evenodd" clipRule="evenodd" /></g>
      <g clipPath="url(#scan-invader-clip)"><g className="point-cloud" clipPath="url(#scan-points-reveal)">{scanPoints.map(([cx, cy], index) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index % 5 === 0 ? 1.7 : 1.05} style={{ animationDelay: `${-(index % 11) * 85}ms` }} />)}</g></g>
      <path className="scan-beam" d="M40 78h144l20 13H40Z" />
      <g className="scanner-unit"><path d="m182 52 23 9-9 26-24-9 10-26Z" /><circle cx="190" cy="69" r="6" /><path d="m181 83-12 71m25-66 9 70m-21-75 5 72" /></g>
      <g className="axis-labels"><text x="29" y="68">PHYSICAL MODEL</text><text x="159" y="178">POINT CLOUD</text></g>
    </svg>
  );
}

export function TechnologyMotion() {
  const [mode, setMode] = useState<TechnologyMode>("model");
  const stageRef = useRef<HTMLElement>(null);
  const current = modes.find((item) => item.id === mode)!;

  function updateTilt(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" && !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    event.currentTarget.style.setProperty("--stage-ry", `${(x - .5) * 9}deg`);
    event.currentTarget.style.setProperty("--stage-rx", `${(.5 - y) * 7}deg`);
  }

  function resetTilt() {
    stageRef.current?.style.setProperty("--stage-ry", "0deg");
    stageRef.current?.style.setProperty("--stage-rx", "0deg");
  }

  function navigateTabs(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % modes.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + modes.length) % modes.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = modes.length - 1;
    else return;
    event.preventDefault();
    const next = modes[nextIndex];
    setMode(next.id);
    requestAnimationFrame(() => document.getElementById(`technology-tab-${next.id}`)?.focus());
  }

  return (
    <section className="technology-motion" id="technology" aria-labelledby="technology-motion-title">
      <div className="technology-intro">
        <p className="kicker light">03 / Технология в движении</p>
        <h2 id="technology-motion-title">Одна форма.<br /><em>Три этапа.</em></h2>
        <p>Фирменный персонаж ТРИФОТИ проходит три этапа: цифровая модель, 3D-печать и сканирование готового объекта.</p>
        <div className="technology-tabs" role="tablist" aria-label="Состояние 3D-объекта">
          {modes.map((item, index) => <button key={item.id} id={`technology-tab-${item.id}`} type="button" role="tab" aria-selected={mode === item.id} aria-controls="technology-stage" tabIndex={mode === item.id ? 0 : -1} className={mode === item.id ? "active" : ""} onClick={() => setMode(item.id)} onKeyDown={(event) => navigateTabs(event, index)}><span>{item.number}</span>{item.label}</button>)}
        </div>
        <p className="technology-mode-copy" aria-live="polite">{current.description}</p>
        <nav className="technology-service-links" aria-label="Подробнее о технологиях ТРИФОТИ">
          <Link href="/services/3d-printing">3D-печать <span>↗</span></Link>
          <Link href="/services/3d-scanning">3D-сканирование <span>↗</span></Link>
        </nav>
      </div>
      <article
        ref={stageRef}
        id="technology-stage"
        className={`technology-scene technology-stage mode-${mode}`}
        role="tabpanel"
        aria-labelledby={`technology-tab-${mode}`}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateTilt(event); }}
        onPointerMove={updateTilt}
        onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); resetTilt(); }}
        onPointerCancel={resetTilt}
        onPointerLeave={resetTilt}
      >
        <div className="scene-copy"><span>{current.number}</span><div><h3>{current.title}</h3><p>{current.description}</p></div></div>
        {mode === "model" && <ModelScene />}
        {mode === "print" && <PrintScene />}
        {mode === "scan" && <ScanScene />}
        <div className="scene-status"><i /><span>{mode === "model" ? "CAD · DIGITAL MASTER" : mode === "print" ? "FDM · SLA · DLP" : "SCAN · POINT CLOUD"}</span><b>{current.label}</b></div>
        <p className="stage-hint">Перемещайте указатель или палец, чтобы рассмотреть объект</p>
      </article>
    </section>
  );
}
