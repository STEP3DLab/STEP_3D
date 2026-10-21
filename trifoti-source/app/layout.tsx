import type { Metadata, Viewport } from "next";
import { AnalyticsBridge } from "./components/AnalyticsBridge";
import { SITE_ORIGIN, STATIC_EXPORT, assetUrl, siteUrl } from "./site-config";
import "./fonts.css";
import "./globals.css";
import "./trifoti.css";

const description = "ТРИФОТИ — креативная студия Фёдора Паршина и Владимира Ганьшина. Авторские скульптуры, арт-объекты, интерьерные панно и награды. От замысла до воплощения.";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: "ТРИФОТИ — скульптура, объекты, пространство", template: "%s | ТРИФОТИ" },
  description,
  keywords: ["ТРИФОТИ", "Фёдор Паршин", "скульптура на заказ", "арт-объекты", "интерьерные панно", "предметный дизайн", "авторские награды", "3D-производство", "Москва"],
  alternates: { canonical: siteUrl() },
  openGraph: { type: "website", locale: "ru_RU", title: "ТРИФОТИ — форма с характером", description, url: siteUrl(), siteName: "ТРИФОТИ", images: [{url: siteUrl("/images/cases/sakharov-art/ring-installed.webp"), width: 1152, height: 1536, alt: "Интерьерное панно из портфолио команды Step3D"}] },
  twitter: { card: "summary_large_image", title: "ТРИФОТИ — форма с характером", description, images: [siteUrl("/images/cases/sakharov-art/ring-installed.webp")] },
  icons: { icon: [{url: assetUrl("/favicon.svg"), type: "image/svg+xml"}], shortcut: [assetUrl("/favicon.svg")] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f1efe9" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="ru"><body>{!STATIC_EXPORT && <AnalyticsBridge />}{children}</body></html>;
}
