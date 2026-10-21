import Link from "next/link";

export function StudioMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M4 7H42L34 15H4V7ZM4 20H32L24 28H4V20ZM4 33H22L14 41H4V33Z" fill="currentColor" />
    <path d="M36 22V41H44V14L36 22Z" fill="currentColor" />
  </svg>;
}

export function Brand({ href = "/", className = "" }: { href?: string; className?: string }) {
  return <Link className={`brand tri-brand ${className}`} href={href} aria-label="ТРИФОТИ — на главную">
    <StudioMark className="tri-mark" />
    <span className="tri-wordmark">ТРИФОТИ<span className="tri-wordmark-dot">✳</span></span>
  </Link>;
}

export const STUDIO_OBJECT_PATH = "M91 405V242C91 154 144 94 227 94C303 94 353 146 353 227V292H290V226C290 183 270 160 230 160C189 160 164 189 164 242V339H421V405H91Z";
