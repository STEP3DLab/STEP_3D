import Link from "next/link";
import { Brand } from "./Brand";
import { company } from "../legal-data";
import { STATIC_EXPORT } from "../site-config";

const MANAGER_URL = "https://t.me/step_3d_mngr";

export function SiteFooter() {
  return <footer className="tri-footer">
    <div className="tri-footer-grid"><div><Brand href="/" /><p>Искусство, которое<br />обретает форму.</p></div><nav aria-label="Разделы сайта"><Link href="/projects">Проекты</Link><Link href="/about">Студия</Link><Link href="/services">Направления</Link><Link href="/business">Сотрудничество</Link></nav><div><span className="tri-footer-label">Есть идея?</span><a href={MANAGER_URL} target="_blank" rel="noopener noreferrer">Написать в Telegram ↗</a><a href={`mailto:${company.email}`}>{company.email}</a><a href="tel:+79959009141">+7 995 900-91-41</a></div><div className="tri-footer-note"><span className="tri-footer-label">Москва / Россия</span><p>Авторская форма.<br />Цифровые технологии.<br />Ручная работа.</p></div></div>
    <div className="tri-footer-word" aria-hidden="true">ТРИФОТИ<span>✳</span></div>
    <div className="tri-footer-bottom"><span>© 2026 ТРИФОТИ</span><span>Связь со студией — команда Step3D</span><div><Link href="/privacy">Политика данных</Link><Link href="/requisites">Реквизиты</Link>{!STATIC_EXPORT && <Link href="/leads">Кабинет студии ↗</Link>}</div></div>
  </footer>;
}

export function DetailContactBar({ requestHref, context = "проект студии ТРИФОТИ" }: { requestHref: string; context?: string }) {
  const telegramHref = `${MANAGER_URL}?text=${encodeURIComponent(`Здравствуйте! Хочу обсудить ${context}.`)}`;
  return <div className="mobile-cta detail-mobile-cta" aria-label="Быстрая связь с ТРИФОТИ"><Link href={requestHref}>Обсудить проект</Link><a href={telegramHref} target="_blank" rel="noopener noreferrer">Telegram ↗</a></div>;
}
