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

  // RPC reserva hasta 2 videos por 5 minutos y devuelve data completa
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

  if (!rpcResult.ok) {
    return NextResponse.json({
      ok: false,
      error_code: rpcResult.error,
      mensaje: rpcResult.mensaje,
    });
  }

  type RpcVideo = {
    reserva_id: string;
    campana_id: string;
    video_id: string;
    youtube_video_id: string;
    titulo: string;
    descripcion: string | null;
    tipo_intercambio: string | null;
    tono: string | null;
    duracion_segundos: number | null;
    vistas: number;
    expires_at: string;
    creador: { nombre: string | null; avatar_url: string | null; canal_url: string | null };
  };

  const videos = (rpcResult.videos as RpcVideo[]).map((v) => ({
    reserva_id: v.reserva_id,
    campana_id: v.campana_id,
    video_id: v.video_id,
    youtube_video_id: v.youtube_video_id,
    titulo: v.titulo,
    descripcion: v.descripcion,
    tipo_intercambio: v.tipo_intercambio,
    tono: v.tono,
    duracion_segundos: v.duracion_segundos,
    vistas: v.vistas,
    expires_at: v.expires_at,
    thumbnail: `https://img.youtube.com/vi/${v.youtube_video_id}/mqdefault.jpg`,
    youtube_url: `https://www.youtube.com/watch?v=${v.youtube_video_id}`,
    creador: v.creador,
  }));

  return NextResponse.json({ ok: true, videos });
}
