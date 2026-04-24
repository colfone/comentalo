import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./server";
import { isAdminEmail } from "@/lib/admin-emails";

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
//
// isAdminEmail se reexporta desde @/lib/admin-emails para no forzar a los
// consumidores server-side a cambiar el import path. Client components
// deben importar directamente de @/lib/admin-emails (este archivo trae
// server-only deps via ./server).

export { isAdminEmail };

function createSupabaseServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export type AdminContext = {
  serviceClient: SupabaseClient;
  authEmail: string | null;
};

export async function requireAdminForPage(): Promise<AdminContext> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  if (!isAdminEmail(session.user.email)) redirect("/dashboard");

  return {
    serviceClient: createSupabaseServiceClient(),
    authEmail: session.user.email ?? null,
  };
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
    ctx: {
      serviceClient: createSupabaseServiceClient(),
      authEmail: user.email ?? null,
    },
  };
}
