export function isPrivatePath(path: string) {
  return /^\/(?:leads|status)(?:\/|$)/.test(path);
}

export function analyticsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return isPrivatePath(url.pathname) ? url.origin : `${url.origin}${url.pathname}`;
  } catch { return ""; }
}
