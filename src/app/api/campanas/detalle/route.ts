import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campanaId = searchParams.get("campana_id");

  if (!campanaId) {
    return NextResponse.json(
      { error: "campana_id es obligatorio." },
      { status: 400 }
    );
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

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Get campaign + verify ownership
  const { data: campana } = await serviceClient
    .from("campanas")
    .select("id, video_id, estado, intercambios_completados, created_at")
    .eq("id", campanaId)
    .single();

  if (!campana) {
    return NextResponse.json(
      { error: "Campana no encontrada." },
      { status: 404 }
    );
  }

  const { data: video } = await serviceClient
    .from("videos")
    .select("id, usuario_id, titulo, youtube_video_id")
    .eq("id", campana.video_id)
    .single();

  if (!video || video.usuario_id !== usuario.id) {
    return NextResponse.json(
      { error: "No tienes permiso para ver esta campana." },
      { status: 403 }
    );
  }

  // Get all intercambios for this campaign with commentator names
  const { data: intercambios } = await serviceClient
    .from("intercambios")
    .select("id, comentarista_id, texto_comentario, estado, calificacion, created_at")
    .eq("campana_id", campanaId)
    .order("created_at", { ascending: true });

  // Get commentator names
  const comentaristaIds = [
    ...new Set((intercambios || []).map((i: { comentarista_id: string }) => i.comentarista_id)),
  ];

  let comentaristas: Record<string, { nombre: string | null; canal_url: string | null }> = {};

  if (comentaristaIds.length > 0) {
    const { data: usuarios } = await serviceClient
      .from("usuarios")
      .select("id, nombre, canal_url")
      .in("id", comentaristaIds);

    for (const u of usuarios || []) {
      comentaristas[u.id] = { nombre: u.nombre, canal_url: u.canal_url };
    }
  }

  const intercambiosConNombre = (intercambios || []).map(
    (i: {
      id: string;
      comentarista_id: string;
      texto_comentario: string;
      estado: string;
      calificacion: string | null;
      created_at: string;
    }) => ({
      ...i,
      comentarista_nombre:
        comentaristas[i.comentarista_id]?.nombre || "Creador",
      comentarista_canal:
        comentaristas[i.comentarista_id]?.canal_url || null,
    })
  );

  return NextResponse.json({
    campana,
    video: {
      titulo: video.titulo,
      youtube_video_id: video.youtube_video_id,
    },
    intercambios: intercambiosConNombre,
  });
}
