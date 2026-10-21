import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type Step3dRuntimeEnv = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  LEADS_ADMIN_KEY?: string;
  TRIFOTI_OWNER_EMAIL?: string;
  LEAD_WEBHOOK_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  YANDEX_METRIKA_ID?: string;
};

export function getRuntimeEnv() {
  return (globalThis as typeof globalThis & { __STEP3D_ENV__?: Step3dRuntimeEnv }).__STEP3D_ENV__;
}

export function getDb() {
  const runtimeEnv = getRuntimeEnv();
  if (!runtimeEnv?.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(runtimeEnv.DB, { schema });
}

export function getRawDb() {
  const runtimeEnv = getRuntimeEnv();
  if (!runtimeEnv?.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }
  return runtimeEnv.DB;
}
