import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";
import { company } from "../legal-data";

export const metadata: Metadata = {
  title: "Реквизиты ООО «СТЕП_3Д»",
  description: "Юридические и банковские реквизиты ООО «СТЕП_3Д», рабочие контакты и данные для проверки контрагента.",
  alternates: { canonical: "/requisites" },
  openGraph: { title: "Реквизиты ООО «СТЕП_3Д»", url: "/requisites", images: [{ url: "/favicon.svg" }] },
  twitter: { card: "summary", title: "Реквизиты ООО «СТЕП_3Д»", images: ["/favicon.svg"] },
};

export default function RequisitesPage() {
  return (
    <LegalPage eyebrow="Информация об исполнителе" title="Реквизиты Step3D" version="Для договоров, счетов и проверки контрагента">
      <div className="requisites-grid">
        <dl>
          <div><dt>Полное наименование</dt><dd>{company.fullName}</dd></div>
          <div><dt>Сокращённое наименование</dt><dd>{company.shortName}</dd></div>
          <div><dt>ИНН / КПП</dt><dd>{company.inn} / {company.kpp}</dd></div>
          <div><dt>ОГРН</dt><dd>{company.ogrn}</dd></div>
          <div><dt>Дата регистрации</dt><dd>{company.foundedAt}</dd></div>
          <div><dt>Генеральный директор</dt><dd>{company.director}</dd></div>
          <div><dt>Расчётный счёт</dt><dd>{company.account}</dd></div>
          <div><dt>Банк</dt><dd>{company.bank}</dd></div>
          <div><dt>БИК / корр. счёт</dt><dd>{company.bik} / {company.correspondentAccount}</dd></div>
          <div><dt>Рабочие контакты</dt><dd><a href={`mailto:${company.email}`}>{company.email}</a><br /><a href={`mailto:${company.corporateEmail}`}>{company.corporateEmail}</a><br /><a href="tel:+79959009141">{company.phone}</a></dd></div>
          <div><dt>Режим обработки обращений</dt><dd>Понедельник–пятница, 10:00–19:00 (МСК)</dd></div>
        </dl>
      </div>
      <p className="policy-note">Реквизиты сверены с карточкой предприятия и открытыми регистрационными данными. Перед оплатой проверяйте получателя и назначение платежа в выставленном счёте. <a href="https://egrul.nalog.ru/index.html" target="_blank" rel="noopener noreferrer">Проверить организацию в ЕГРЮЛ по ИНН ↗</a></p>
    </LegalPage>
  );
}
