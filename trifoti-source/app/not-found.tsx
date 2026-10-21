import Link from "next/link";
import { InnerHeader } from "./components/InnerHeader";
import { SiteFooter } from "./components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <InnerHeader backHref="/" backLabel="На главную" requestHref="/?source=not_found#request" />
      <main className="not-found-page" id="content" tabIndex={-1}>
        <section aria-labelledby="not-found-title">
          <p className="kicker">Ошибка 404</p>
          <h1 id="not-found-title">Такой страницы<br /><em>у нас нет.</em></h1>
          <p>Возможно, ссылка устарела. Выберите услугу, посмотрите реальные проекты или расскажите нам о своей задаче.</p>
          <div>
            <Link className="button primary" href="/services">Выбрать услугу <span>→</span></Link>
            <Link className="button ghost" href="/projects">Смотреть проекты <span>↗</span></Link>
          </div>
        </section>
        <SiteFooter />
      </main>
    </>
  );
}
