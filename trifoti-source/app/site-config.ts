/** Public build settings. No credentials belong in these values. */
export const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://trifoti.step3d.chatgpt.site").replace(/\/+$/, "");
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

/** Prefix ordinary anchors and public assets; next/link already handles basePath. */
export function sitePath(path: string): string {
  if (!BASE_PATH || !path.startsWith("/") || path.startsWith("//")) return path;
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`) || path.startsWith(`${BASE_PATH}?`) || path.startsWith(`${BASE_PATH}#`)) return path;
  return `${BASE_PATH}${path}`;
}

export function assetUrl(path: string): string {
  return sitePath(path);
}

/** Absolute URL for canonical metadata, structured data and sharing. */
export function siteUrl(path = "/"): string {
  return new URL(sitePath(path), `${SITE_ORIGIN}${BASE_PATH}/`).toString();
}
