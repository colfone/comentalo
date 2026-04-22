import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./server";

// Gate de acceso para /admin y /api/admin/*. Valida que el usuario autenticado
// tenga es_admin = true en la tabla usuarios. La columna se agrega en la
// migración 20260422120000_admin_setup.sql.
//
// Dos variantes:
// - requireAdminForPage(): redirige a /login (sin sesión) o /dashboard (no admin).
// - requireAdminForApi(): retorna NextResponse 401/403 en caso de fallo.
//
// Nota sobre auth: en páginas usamos getSession() para evitar el refresh de
// cookie que rompe en layouts de Next 16 (ver comentario en dashboard/layout).
// En route handlers usamos getUser() porque sí pueden escribir cookies.

function createSupabaseServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export type AdminContext = {
  usuarioId: string;
  serviceClient: SupabaseClient;
};

export async function requireAdminForPage(): Promise<AdminContext> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, es_admin")
    .eq("auth_id", session.user.id)
    .maybeSingle();

  if (!usuario || usuario.es_admin !== true) redirect("/dashboard");

  return {
    usuarioId: usuario.id,
    serviceClient: createSupabaseServiceClient(),
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

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, es_admin")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!usuario || usuario.es_admin !== true) {
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
      usuarioId: usuario.id,
      serviceClient: createSupabaseServiceClient(),
    },
  };
}
