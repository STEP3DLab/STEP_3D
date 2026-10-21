import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Статус проекта",
  description: "Закрытая страница проверки статуса заявки ТРИФОТИ по индивидуальной ссылке.",
  alternates: { canonical: "/status" },
  robots: { index: false, follow: false, nocache: true },
};

export default function StatusLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
