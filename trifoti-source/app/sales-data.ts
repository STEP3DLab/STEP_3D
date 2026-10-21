export const salesStages = ["Не указан", "Новая", "Квалифицирована", "КП отправлено", "Заказ", "Отказ"] as const;
export type SalesStage = typeof salesStages[number];
export type SalesFields = {
  salesStage: SalesStage; quoteAmount: number | null; paidAmount: number | null;
  lostReason: string; salesRevision: number;
};

export function parseSalesUpdate(body: unknown): ({ id: number } & SalesFields) | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  if (!Number.isSafeInteger(value.id) || Number(value.id) < 1 ||
      !Number.isSafeInteger(value.salesRevision) || Number(value.salesRevision) < 0 ||
      !salesStages.includes(value.salesStage as SalesStage)) return null;
  for (const key of ["quoteAmount", "paidAmount"]) {
    const amount = value[key];
    if (amount !== null && (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0 || amount > 100_000_000)) return null;
  }
  if (typeof value.lostReason !== "string" || value.lostReason.length > 500) return null;
  return {
    id: Number(value.id), salesRevision: Number(value.salesRevision), salesStage: value.salesStage as SalesStage,
    quoteAmount: value.quoteAmount as number | null, paidAmount: value.paidAmount as number | null,
    lostReason: value.lostReason.trim(),
  };
}
