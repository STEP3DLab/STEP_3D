export const responseHours = "На связи: пн–пт, 10:00–19:00 МСК.";
export const responseNextStep = "Сначала уточним задачу и полноту исходных данных. Затем согласуем, когда подготовим расчёт или коммерческое предложение.";

export function materialLinkError(value: string) {
  if (!value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !url.hostname.includes(".")) throw new Error();
    return "";
  } catch { return "Добавьте полную ссылку на материалы, начиная с https://."; }
}

export function requestDetails(details: string, materialsUrl: string, fileNames: string[], quick: boolean) {
  const summary = quick
    ? `Прошу проверить готовую модель и рассчитать 3D-печать. ${details.trim() || "Материал, количество и срок уточним при оценке."}`
    : details.trim();
  return [summary.slice(0, 1700), materialsUrl.trim() ? `Ссылка на материалы: ${materialsUrl.trim()}` : "", quick && fileNames.length ? `Файлы к заявке: ${fileNames.join(", ").slice(0, 300)}` : ""].filter(Boolean).join("\n");
}
