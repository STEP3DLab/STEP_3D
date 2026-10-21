import type { ReactNode } from "react";

export type MotionIconName =
  | "sculpture" | "award" | "installation" | "scan" | "prototype" | "xr"
  | "idea" | "series" | "product" | "reverse"
  | "brief" | "estimate" | "contract" | "production" | "delivery"
  | "geometry" | "sample" | "finish" | "document"
  | "budget" | "checkpoints" | "quality" | "legal"
  | "creator" | "business" | "network";

type Props = { name: MotionIconName; className?: string };

const paths: Record<MotionIconName, ReactNode> = {
  sculpture: <><path d="M7 20h10M8.5 17h7l-1.1-4.2 1.8-2.5-2.8-5.8-5.2 3.2 2.1 4.2L8.5 17Z"/><path d="m9 7.2 4.6 2.2M9.2 13.8h5.3"/></>,
  award: <><path d="M7.5 4h9v4.2a4.5 4.5 0 0 1-9 0V4Z"/><path d="M7.5 6H4.7v1a4 4 0 0 0 4 4M16.5 6h2.8v1a4 4 0 0 1-4 4M12 12.7V17M8.5 20h7M10 17h4v3h-4Z"/></>,
  installation: <><path d="m4 16 8-12 8 12-8 4-8-4Z"/><path d="m8 14.2 4-6.3 4 6.3-4 2-4-2ZM12 4v3.9"/></>,
  scan: <><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><path d="M7 12h10M9 9h6M9 15h6"/><circle cx="12" cy="12" r="1"/></>,
  prototype: <><path d="m12 3.3 7.5 4.2v8.8L12 20.7l-7.5-4.4V7.5L12 3.3Z"/><path d="m4.5 7.5 7.5 4.3 7.5-4.3M12 11.8v8.9M8.2 5.4l7.6 4.3"/></>,
  xr: <><path d="M3 9.5h18v8H3v-8Z"/><path d="M7 9.5V6.2h10v3.3M6.5 13.5h3.5M14 13.5h3.5M10 16h4"/></>,
  idea: <><path d="M9 17.5h6M10 21h4M9.5 19.3h5"/><path d="M8.2 13.7a6 6 0 1 1 7.6 0c-.8.7-.8 1.5-.8 2.1H9c0-.6 0-1.4-.8-2.1Z"/></>,
  series: <><path d="m4 8 5-3 5 3-5 3-5-3Zm0 0v5l5 3 5-3V8M14 11l3-1.8 3 1.8-3 1.8-3-1.8Zm0 0v4.5l3 1.8 3-1.8V11M9 11v5"/></>,
  product: <><path d="m12 3.2 8 4.4v8.8l-8 4.4-8-4.4V7.6l8-4.4Z"/><path d="m4 7.6 8 4.4 8-4.4M12 12v8.8"/></>,
  reverse: <><path d="M4 8h11a5 5 0 0 1 5 5v3"/><path d="m7.5 4.5-4 3.5 4 3.5M20 20v-4h-4M9 12.5h5"/></>,
  brief: <><path d="M7 4h10v17H7V4Z"/><path d="M9.5 4V2.8h5V4M10 8h4M10 12h4M10 16h3"/></>,
  estimate: <><circle cx="12" cy="12" r="8.5"/><path d="M10 18V7h3a3 3 0 0 1 0 6H8M8 16h6"/></>,
  contract: <><path d="M6 3h9l3 3v15H6V3Z"/><path d="M15 3v4h4M9 12h6M9 16h3M13.5 17.5l1.2 1.2 2.3-2.8"/></>,
  production: <><path d="m12 3 2 3 4-.2-.2 4L21 12l-3.2 2.2.2 4-4-.2-2 3-2-3-4 .2.2-4L3 12l3.2-2.2-.2-4 4 .2 2-3Z"/><circle cx="12" cy="12" r="3"/></>,
  delivery: <><path d="M3 6h11v11H3V6ZM14 10h4l3 3v4h-7v-7Z"/><path d="M16 10v4h5"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
  geometry: <><path d="M4 19 12 4l8 15H4Z"/><path d="M8 15h8M12 4v15M6 17.5h12"/></>,
  sample: <><path d="M5 7 12 3l7 4v10l-7 4-7-4V7Z"/><path d="m5 7 7 4 7-4M12 11v10"/><circle cx="15.2" cy="14.1" r="1.2"/></>,
  finish: <><path d="M4 18c4-6 6-9 12-12l2 2c-3 6-6 8-12 12l-2-2Z"/><path d="m15 5 2-2 4 4-2 2M5.5 16.2l2.3 2.3"/></>,
  document: <><path d="M6 3h9l3 3v15H6V3Z"/><path d="m9 14 2 2 4-5M15 3v4h4"/></>,
  budget: <><path d="M4 8h16v11H4V8ZM7 5h10v3"/><path d="M15 12h5v4h-5a2 2 0 0 1 0-4Z"/><circle cx="15" cy="14" r=".5"/></>,
  checkpoints: <><path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="19" r="2"/></>,
  quality: <><path d="m12 3 7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-5"/></>,
  legal: <><path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7ZM17 7l-4 7h8l-4-7ZM8 21h8"/></>,
  creator: <><circle cx="12" cy="8" r="4"/><path d="M5 21c.7-5 3-7 7-7s6.3 2 7 7M9.5 8h5"/></>,
  business: <><path d="M4 8h16v11H4V8ZM9 8V5h6v3M4 12h16M10 12v2h4v-2"/></>,
  network: <><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m10.5 7-4 8.5M13.5 7l4 8.5M7.5 18h9"/></>,
};

export function MotionIcon({ name, className = "" }: Props) {
  return <span className={`motion-icon ${className}`} data-icon={name} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" focusable="false"><g className="motion-icon-glyph">{paths[name]}</g></svg></span>;
}
