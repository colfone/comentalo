import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { crearNotificacion } from "@/lib/notificaciones";

// POST /api/intercambios/verificar
// Body: { campana_id: string, texto_comentario: string }
// Response: { ok: true, resultado: "verificado" | "rechazado" }
//
// Nueva lógica (refactor):
// - El intercambio sólo se crea cuando YouTube confirma que el comentario
//   existe publicado desde el canal del usuario.
// - Si no se encuentra → rechazado, sin fila en intercambios ni en
//   verificaciones_pendientes (el sistema de reintentos del cron fue
//   eliminado de este flujo).

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export async function POST(request: Request) {
  // --- Auth ---
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
    .select("id, canal_youtube_id")
    .eq("auth_id", user.id)
    .single();

  if (!usuario) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  // --- Parse body ---
  let body: { campana_id?: string; texto_comentario?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  if (!body.campana_id) {
    return NextResponse.json(
      { error: "campana_id es obligatorio." },
      { status: 400 }
    );
  }
  if (!body.texto_comentario || body.texto_comentario.trim().length === 0) {
    return NextResponse.json(
      { error: "texto_comentario es obligatorio." },
      { status: 400 }
    );
  }

  const campanaId = body.campana_id;
  const textoComentario = body.texto_comentario;

  // --- Campaña + video ---
  const serviceClient = createServiceClient();

  const { data: campana } = await serviceClient
    .from("campanas")
    .select("id, video_id, intercambios_completados")
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
    .select("id, youtube_video_id, usuario_id, titulo")
    .eq("id", campana.video_id)
    .single();

  if (!video) {
    return NextResponse.json(
      { error: "Video no encontrado." },
      { status: 404 }
    );
  }

  // --- YouTube commentThreads API ---
  const ytUrl = new URL(
    "https://www.googleapis.com/youtube/v3/commentThreads"
  );
  ytUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
  ytUrl.searchParams.set("part", "snippet");
  ytUrl.searchParams.set("videoId", video.youtube_video_id);
  ytUrl.searchParams.set("searchTerms", textoComentario.slice(0, 100));
  ytUrl.searchParams.set("maxResults", "20");

  type YTItem = {
    snippet?: {
      topLevelComment?: {
        snippet?: {
          textOriginal?: string;
          textDisplay?: string;
          authorChannelId?: { value?: string };
        };
      };
    };
  };

  let commentFound = false;

  try {
    const ytRes = await fetch(ytUrl.toString());
    if (ytRes.ok) {
      const ytData = (await ytRes.json()) as { items?: YTItem[] };
      const items = ytData.items ?? [];

      for (const item of items) {
        const snippet = item.snippet?.topLevelComment?.snippet;
        if (!snippet) continue;
        const matchesChannel =
          snippet.authorChannelId?.value === usuario.canal_youtube_id;
        const originalText = snippet.textOriginal ?? "";
        const displayText = snippet.textDisplay ?? "";
        const matchesText =
          originalText.includes(textoComentario) ||
          displayText.includes(textoComentario);
        if (matchesChannel && matchesText) {
          commentFound = true;
          break;
        }
      }
    } else {
      console.error("YouTube commentThreads API error:", ytRes.status);
    }
  } catch (err) {
    console.error("YouTube API fetch error:", err);
  }

  // --- NO encontrado: rechazado sin dejar huella en DB ---
  if (!commentFound) {
    return NextResponse.json({ ok: true, resultado: "rechazado" });
  }

  // --- Encontrado: INSERT intercambio + increment campaña + notificaciones ---
  const { error: insertError } = await serviceClient.from("intercambios").insert({
    campana_id: campanaId,
    comentarista_id: usuario.id,
    texto_comentario: textoComentario,
    estado: "verificado",
    timestamp_copia: new Date().toISOString(),
    duracion_video_segundos: null,
  });

  if (insertError) {
    console.error("Error al insertar intercambio:", insertError);
    return NextResponse.json(
      { error: "Error al registrar intercambio." },
      { status: 500 }
    );
  }

  const newCompleted = (campana.intercambios_completados ?? 0) + 1;
  await serviceClient
    .from("campanas")
    .update({ intercambios_completados: newCompleted })
    .eq("id", campana.id);

  await crearNotificacion({
    usuario_id: usuario.id,
    tipo: "intercambio_verificado",
    titulo: "Tu comentario fue verificado",
    mensaje: `Tu intercambio en "${video.titulo}" fue verificado correctamente.`,
    url_destino: "/dashboard",
  });

  await crearNotificacion({
    usuario_id: video.usuario_id,
    tipo: "intercambio_recibido",
    titulo: "Nuevo comentario en tu video",
    mensaje: `Tu video "${video.titulo}" recibió un nuevo intercambio verificado.`,
    url_destino: `/dashboard/campana/${campana.id}`,
  });

  return NextResponse.json({ ok: true, resultado: "verificado" });
}
