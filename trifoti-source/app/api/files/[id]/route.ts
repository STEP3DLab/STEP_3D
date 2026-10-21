import { eq } from "drizzle-orm";
import { getDb, getRuntimeEnv } from "../../../../db";
import { leadFiles } from "../../../../db/schema";
import { adminAuthorization } from "../../../admin-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuthorization(request, getRuntimeEnv())) return Response.json({ error: "Доступ к файлам не подтверждён." }, { status: 401 });
  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isInteger(fileId) || fileId < 1) return Response.json({ error: "Файл не найден." }, { status: 404 });
  const [record] = await getDb().select().from(leadFiles).where(eq(leadFiles.id, fileId)).limit(1);
  if (!record) return Response.json({ error: "Файл не найден." }, { status: 404 });
  const object = await getRuntimeEnv()?.BUCKET?.get(record.storageKey);
  if (!object) return Response.json({ error: "Файл недоступен." }, { status: 404 });
  const safeName = record.fileName.replace(/["\\\r\n]/g, "-");
  return new Response(object.body, { headers: { "content-type": record.contentType, "content-length": String(record.size), "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`, "cache-control": "private, no-store" } });
}
