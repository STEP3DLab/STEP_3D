/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export function TeamSection() {
  return (
    <section className="team-section" id="team" aria-labelledby="team-title">
      <div className="section-heading horizontal">
        <div>
          <p className="kicker">Два подхода. Одна студия.</p>
          <h2 id="team-title">Авторская пластика.<br /><em>Инженерная точность.</em></h2>
        </div>
        <p>ТРИФОТИ — совместная креативная студия Фёдора Паршина и Владимира Ганьшина. Объединяем художественный замысел и цифровое производство.</p>
      </div>
      <div className="tri-team-grid">
        <article className="tri-founder">
          <img className="tri-founder-media" src="/images/cases/parshin-sculptures/relief-finished.webp" alt="Фёдор Паршин рядом со своей многофигурной рельефной композицией" width={1152} height={1536} loading="lazy" decoding="async" style={{ objectPosition: "center 38%" }} />
          <div className="tri-founder-copy">
            <p className="team-role">Художественный замысел и скульптура</p>
            <h3>Фёдор Паршин</h3>
            <p>Скульптор. Создаёт художественный образ, определяет пластику и характер формы. В портфолио команды — его анималистическая скульптура и многофигурная рельефная композиция.</p>
            <p className="tri-founder-tags">Скульптура / рельеф / авторская форма</p>
            <Link href="/cases/parshin-sculptures" className="service-related-link">Работы Фёдора <span aria-hidden="true">↗</span></Link>
          </div>
        </article>
        <article className="tri-founder">
          <div className="tri-founder-media tri-founder-mark" aria-hidden="true"><span>ВГ</span><small>Идея → модель → объект</small></div>
          <div className="tri-founder-copy">
            <p className="team-role">Инженерия и цифровое производство</p>
            <h3>Владимир Ганьшин</h3>
            <p>Занимается инженерным проектированием, прототипированием и аддитивным производством. Соединяет цифровую модель с технологией изготовления: от проверки геометрии до организации сборки.</p>
            <p className="tri-founder-tags">CAD / 3D-сканирование / 3D-печать</p>
            <Link href="/projects" className="service-related-link">Опыт команды <span aria-hidden="true">↗</span></Link>
          </div>
        </article>
      </div>
      <p className="team-note">В проектах сохраняем авторство художников и обозначаем вклад каждого участника. Состав команды и ответственного за реализацию согласуем под конкретную задачу.</p>
    </section>
  );
}
