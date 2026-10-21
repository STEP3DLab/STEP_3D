import { getRuntimeEnv } from "../../../db";

export async function GET() {
  const rawId = getRuntimeEnv()?.YANDEX_METRIKA_ID?.trim() ?? "";
  const yandexMetrikaId = /^\d+$/.test(rawId) ? rawId : null;

  return Response.json(
    { yandexMetrikaId },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
