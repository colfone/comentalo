import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/usuarios/historial-creditos
// Devuelve saldo actual + todos los movimientos del usuario autenticado
// ordenados por created_at DESC. movimientos_creditos tiene RLS con cero
// policies SELECT — el browser client no puede leer; este endpoint usa
// service client para bypasear tras resolver auth_id → usuario_id.

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("id, saldo_creditos")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (usuarioError || !usuario) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data, error } = await serviceClient
    .from("movimientos_creditos")
    .select(
      "id, monto, saldo_anterior, saldo_nuevo, origen, motivo, created_at"
    )
    .eq("usuario_id", usuario.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error leyendo movimientos_creditos:", error);
    return NextResponse.json(
      { error: "Error interno al leer historial." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    saldo_actual: usuario.saldo_creditos ?? 0,
    movimientos: data ?? [],
  });
}
