import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const campanaId = body?.campana_id;

  if (!campanaId || typeof campanaId !== "string") {
    return NextResponse.json({ error: "Falta campana_id" }, { status: 400 });
  }

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

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!usuario) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "confirmar_intercambio",
    { p_comentarista_id: usuario.id, p_campana_id: campanaId }
  );

  if (rpcError) {
    console.error("RPC confirmar_intercambio error:", rpcError);
    return NextResponse.json(
      { error: "Error al confirmar intercambio." },
      { status: 500 }
    );
  }

  if (!rpcResult.ok) {
    return NextResponse.json({
      ok: false,
      error_code: rpcResult.error,
      mensaje: rpcResult.mensaje,
    });
  }

  return NextResponse.json({
    ok: true,
    intercambio_id: rpcResult.intercambio_id,
    campana_id: rpcResult.campana_id,
    video_id: rpcResult.video_id,
  });
}
