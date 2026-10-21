import { and, eq } from "drizzle-orm";
import { getDb, getRuntimeEnv } from "../../../db";
import { leadFiles, leads } from "../../../db/schema";

const ALLOWED_EXTENSIONS = new Set(["stl", "step", "stp", "obj", "3mf", "dxf", "dwg", "pdf", "png", "jpg", "jpeg", "webp", "zip"]);
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "file";
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > MAX_FILE_SIZE + 65536) return Response.json({ error: "Размер одного файла — не более 25 МБ." }, { status: 413 });
    const form = await request.formData();
    const publicId = String(form.get("leadId") ?? "").trim().slice(0, 40);
    const token = String(form.get("token") ?? "").trim().slice(0, 80);
    const file = form.get("file");
    if (!(file instanceof File) || !publicId || token.length < 24) {
      return Response.json({ error: "Не удалось связать файл с заявкой." }, { status: 400 });
    }
    if (file.size < 1 || file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "Размер одного файла — не более 25 МБ." }, { status: 413 });
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return Response.json({ error: "Поддерживаются STL, STEP, STP, OBJ, 3MF, DXF, DWG, PDF, изображения и ZIP." }, { status: 415 });
    }

    const db = getDb();
    const [lead] = await db.select({ id: leads.id }).from(leads)
      .where(and(eq(leads.publicId, publicId), eq(leads.publicToken, token))).limit(1);
    if (!lead) return Response.json({ error: "Заявка не найдена." }, { status: 404 });
    const existingFiles = await db.select({ id: leadFiles.id }).from(leadFiles)
      .where(eq(leadFiles.leadId, lead.id)).limit(5);
    if (existingFiles.length >= 5) {
      return Response.json({ error: "К одной заявке можно прикрепить не более 5 файлов." }, { status: 409 });
    }

    const bucket = getRuntimeEnv()?.BUCKET;
    if (!bucket) throw new Error("R2 binding is unavailable");
    const fileName = safeName(file.name);
    const storageKey = `leads/${publicId}/${crypto.randomUUID()}-${fileName}`;
    await bucket.put(storageKey, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: { leadId: publicId, originalName: fileName },
    });
    await db.insert(leadFiles).values({
      leadId: lead.id,
      storageKey,
      fileName,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    });
    return Response.json({ ok: true, file: { name: fileName, size: file.size } }, { status: 201 });
  } catch (error) {
    console.error("lead_file_upload_failed", error);
    return Response.json({ error: "Не удалось загрузить файл. Отправьте его менеджеру в Telegram или по почте." }, { status: 500 });
  }
}
