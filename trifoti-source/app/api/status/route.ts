import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { leads } from "../../../db/schema";

function clean(value: string | null, max: number) {
  return (value ?? "").trim().slice(0, max);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const publicId = clean(url.searchParams.get("id"), 40);
  const token = clean(url.searchParams.get("token"), 80);
  if (!publicId || token.length < 24) {
    return Response.json({ error: "Откройте персональную ссылку из подтверждения заявки." }, { status: 400 });
  }

  const [lead] = await getDb().select({
    publicId: leads.publicId,
    createdAt: leads.createdAt,
    updatedAt: leads.updatedAt,
    status: leads.status,
    projectType: leads.projectType,
    projectFormat: leads.projectFormat,
    deadline: leads.deadline,
  }).from(leads).where(and(eq(leads.publicId, publicId), eq(leads.publicToken, token))).limit(1);

  if (!lead) return Response.json({ error: "Заявка не найдена или ссылка недействительна." }, { status: 404 });
  return Response.json({ lead });
}
