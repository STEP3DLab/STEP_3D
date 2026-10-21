/** Server-side authorization for the studio's private workspace.
 *
 * Sites dispatch owns the identity headers: a signed-in visitor is permitted
 * only when the configured owner's email matches. Never trust a client field,
 * an arbitrary signed-in account, or the presence of a header by itself.
 */
type AdminEnvironment = {
  TRIFOTI_OWNER_EMAIL?: string;
  LEADS_ADMIN_KEY?: string;
};

export type AdminAuthorization = "owner" | "key";

function sameSecret(provided: string, expected: string) {
  if (provided.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export function adminAuthorization(
  request: Request,
  environment: AdminEnvironment | undefined,
): AdminAuthorization | null {
  const owner = environment?.TRIFOTI_OWNER_EMAIL?.trim().toLowerCase() ?? "";
  const visitor = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase() ?? "";
  if (owner && visitor && visitor === owner) return "owner";

  const expected = environment?.LEADS_ADMIN_KEY ?? "";
  const provided = request.headers.get("x-trifoti-admin-key") ?? "";
  if (expected.length >= 24 && sameSecret(provided, expected)) return "key";
  return null;
}
