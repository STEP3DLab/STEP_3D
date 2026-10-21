import Link from "next/link";
import { Brand } from "./Brand";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  version: string;
  children: React.ReactNode;
};

export function LegalPage({ eyebrow, title, version, children }: LegalPageProps) {
  return (
    <main className="policy-page" id="content" tabIndex={-1}>
      <a className="skip-link" href="#content">Перейти к содержанию</a>
      <header className="legal-header">
        <Brand />
        <Link className="policy-back" href="/">← Вернуться на сайт</Link>
      </header>
      <div className="legal-layout">
        <aside className="legal-nav" aria-label="Юридическая информация">
          <Link href="/offer">Публичная оферта</Link>
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/consent">Согласие на обработку данных</Link>
          <Link href="/requisites">Реквизиты</Link>
        </aside>
        <article>
          <p className="kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal-version">{version}</p>
          {children}
        </article>
      </div>
    </main>
  );
}
