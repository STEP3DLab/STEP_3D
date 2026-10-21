import { analyticsUrl } from "./analytics-privacy";

type Acquisition = { utmSource: string; utmMedium: string; utmCampaign: string; referrer: string };
const empty: Acquisition = { utmSource: "", utmMedium: "", utmCampaign: "", referrer: "" };
const key = "step3d-acquisition";
const memory: Acquisition = { ...empty };

// Keep campaign attribution across service/case navigation in this tab only.
// Form fields, private URL parameters and customer files are never stored here.
export function readAcquisition(): Acquisition {
  if (typeof window === "undefined") return { ...empty };
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || "null");
    if (saved && typeof saved === "object") {
      for (const name of Object.keys(empty) as (keyof Acquisition)[]) {
        memory[name] = typeof saved[name] === "string" ? saved[name].slice(0, 500) : "";
      }
    }
  } catch { /* Continue when session storage is unavailable. */ }
  const params = new URLSearchParams(window.location.search);
  if (["utm_source", "utm_medium", "utm_campaign"].some(name => params.has(name))) {
    memory.utmSource = (params.get("utm_source") || "").slice(0, 120);
    memory.utmMedium = (params.get("utm_medium") || "").slice(0, 120);
    memory.utmCampaign = (params.get("utm_campaign") || "").slice(0, 160);
  }
  const referrer = analyticsUrl(document.referrer);
  if (referrer && new URL(referrer).origin !== window.location.origin) memory.referrer = referrer;
  try { sessionStorage.setItem(key, JSON.stringify(memory)); } catch { /* Memory fallback. */ }
  return { ...memory };
}
