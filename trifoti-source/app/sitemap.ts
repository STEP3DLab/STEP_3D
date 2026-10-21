import type { MetadataRoute } from "next";
import { caseStudies } from "./case-data";
import { servicePages } from "./service-data";
import { siteUrl } from "./site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl().replace(/\/$/, "");
  const lastModified = new Date("2026-10-21");
  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1, images: [`${base}/favicon.svg`] },
    { url: `${base}/services`, lastModified, changeFrequency: "monthly", priority: .9 },
    { url: `${base}/projects`, lastModified, changeFrequency: "monthly", priority: .9, images: caseStudies.slice(0, 6).map((item) => siteUrl(item.image)) },
    { url: `${base}/business`, lastModified, changeFrequency: "monthly", priority: .75 },
    { url: `${base}/about`, lastModified, changeFrequency: "monthly", priority: .7 },
    ...["/offer", "/privacy", "/consent", "/requisites"].map((path) => ({ url: `${base}${path}`, lastModified, changeFrequency: "yearly" as const, priority: .5 })),
  ];
  const serviceEntries: MetadataRoute.Sitemap = servicePages.map((service) => {
    const relatedCase = caseStudies.find((item) => service.relatedCaseSlugs.some(slug => slug === item.slug));
    return {
      url: `${base}/services/${service.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: .8,
      images: relatedCase ? [siteUrl(relatedCase.image)] : undefined,
    };
  });
  const caseEntries: MetadataRoute.Sitemap = caseStudies.map((item) => ({
    url: `${base}/cases/${item.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: .8,
    images: [
      item.image,
      item.resultImage,
      ...(item.gallery?.map((media) => media.src) ?? []),
      ...(item.videos?.map((media) => media.poster) ?? []),
    ].filter((path): path is string => Boolean(path)).map((path) => siteUrl(path)),
  }));

  return [...staticEntries, ...serviceEntries, ...caseEntries];
}
