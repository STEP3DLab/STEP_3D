import type { MetadataRoute } from "next";
import { sitePath, siteUrl } from "./site-config";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "OAI-SearchBot",
        allow: sitePath("/"),
        disallow: ["/api/", "/leads", "/status"].map(sitePath),
      },
      {
        userAgent: "*",
        allow: sitePath("/"),
        disallow: ["/api/", "/leads", "/status"].map(sitePath),
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
