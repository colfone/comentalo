import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./server";

// Gate de acceso para /admin y /api/admin/*. Autoriza por email: el usuario
// autenticado debe estar en ADMIN_EMAILS. Sin lookup a la tabla usuarios —
// la columna es_admin existe en el schema (migración 20260422120000) pero
// queda en reserva para un modelo DB-based futuro.
//
// Dos variantes:
// - requireAdminForPage(): redirige a /login (sin sesión) o /dashboard (no admin).
// - requireAdminForApi(): retorna NextResponse 401/403 en caso de fallo.
//
// Nota sobre auth: en páginas usamos getSession() para evitar el refresh de
// cookie que rompe en layouts de Next 16. En route handlers usamos getUser()
// porque sí pueden escribir cookies.

const ADMIN_EMAILS = new Set<string>(["colfone@gmail.com"]);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}

function createSupabaseServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export type AdminContext = {
  serviceClient: SupabaseClient;
};

export async function requireAdminForPage(): Promise<AdminContext> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  if (!isAdminEmail(session.user.email)) redirect("/dashboard");

  return { serviceClient: createSupabaseServiceClient() };
}

export type AdminApiResult =
  | { ok: true; ctx: AdminContext }
  | { ok: false; response: NextResponse };

export async function requireAdminForApi(): Promise<AdminApiResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  if (!isAdminEmail(user.email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso denegado: se requiere permiso de admin." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    ctx: { serviceClient: createSupabaseServiceClient() },
  };
}
