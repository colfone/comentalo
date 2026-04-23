import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/campanas/eliminar
// Body: { campana_id }
// Delega toda la lógica (ownership, validación de estado, validación de
// intercambios_completados, DELETE y reembolso) al RPC
// eliminar_campana_con_reembolso (migración 20260422230000). Si la campaña
// tiene 0 intercambios verificados, se borra y se reembolsa
// costo_campana_creditos al creador; si tiene >=1, bloquea.

type RpcErrorCode = "no_encontrada" | "tiene_comentarios" | "estado_invalido";

type RpcResponse = {
  ok: boolean;
  error?: RpcErrorCode;
  mensaje?: string;
  reembolso?: number;
  saldo_nuevo?: number;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  let body: { campana_id?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: "Cuerpo inválido" }, { status: 400 }); }

  if (!body.campana_id) {
    return NextResponse.json({ ok: false, error: "Falta campana_id" }, { status: 400 });
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (!usuario) return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: rpcResult, error: rpcError } = await service.rpc(
    "eliminar_campana_con_reembolso",
    { p_campana_id: body.campana_id, p_usuario_id: usuario.id }
  );

  if (rpcError) {
    console.error("Error llamando eliminar_campana_con_reembolso:", rpcError);
    return NextResponse.json(
      { ok: false, error: "Error interno al eliminar la campaña." },
      { status: 500 }
    );
  }

  const result = rpcResult as RpcResponse;

  if (!result.ok) {
    // no_encontrada → 404. tiene_comentarios + estado_invalido → 409.
    const status = result.error === "no_encontrada" ? 404 : 409;
    return NextResponse.json(
      { ok: false, error: result.mensaje ?? "Error al eliminar la campaña." },
      { status }
    );
  }

  return NextResponse.json({
    ok: true,
    reembolso: result.reembolso,
    saldo_nuevo: result.saldo_nuevo,
  });
}
