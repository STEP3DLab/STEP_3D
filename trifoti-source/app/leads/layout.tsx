import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Кабинет заявок",
  description: "Закрытый рабочий раздел студии ТРИФОТИ.",
  alternates: { canonical: "/leads" },
  robots: { index: false, follow: false, nocache: true },
};

export default function LeadsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
