// Allowlist de emails admin — source of truth compartido.
// Vive fuera de admin-guard.ts a propósito: admin-guard importa "next/headers"
// (server-only) y no puede consumirse desde client components. Este archivo
// es puro (sin imports de Next), por lo que page.tsx y otros client pueden
// importar `isAdminEmail` sin romper el bundle.

export const ADMIN_EMAILS = new Set<string>(["colfone@gmail.com"]);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}
