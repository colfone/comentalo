import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

  // Call the RPC — handles all guardrails (video activo, 3 pendientes, cola FIFO, skip own)
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "asignar_intercambio",
    { p_comentarista_id: usuario.id }
  );

  if (rpcError) {
    console.error("RPC asignar_intercambio error:", rpcError);
    return NextResponse.json(
      { error: "Error al asignar intercambio." },
      { status: 500 }
    );
  }

  // RPC returns JSON — parse error codes
  if (!rpcResult.ok) {
    return NextResponse.json({
      ok: false,
      error_code: rpcResult.error,
      mensaje: rpcResult.mensaje,
    });
  }

  // Fetch video details for the UI
  const { data: video } = await supabase
    .from("videos")
    .select(
      "id, youtube_video_id, titulo, descripcion, tipo_intercambio, tono, duracion_segundos, vistas"
    )
    .eq("id", rpcResult.video_id)
    .single();

  if (!video) {
    return NextResponse.json(
      { error: "Video asignado no encontrado." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    intercambio_id: rpcResult.intercambio_id,
    campana_id: rpcResult.campana_id,
    video: {
      id: video.id,
      youtube_video_id: video.youtube_video_id,
      titulo: video.titulo,
      descripcion: video.descripcion,
      tipo_intercambio: video.tipo_intercambio,
      tono: video.tono,
      duracion_segundos: video.duracion_segundos,
      vistas: video.vistas,
      thumbnail: `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`,
      youtube_url: `https://www.youtube.com/watch?v=${video.youtube_video_id}`,
    },
  });
}
