import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// --- YouTube ISO 8601 duration → seconds ---

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// --- Extract video ID from YouTube URL ---

function extractVideoId(url: string): string | null {
  // Handles: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const patterns = [
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// --- Constants ---

const MAX_VIDEOS_ACTIVOS = 2; // seccion 5.5 — plan base
const VISTAS_PRIMERA_CAMPANA = 10; // seccion 5C.4 — regla de vistas

export async function POST(request: Request) {
  // Auth check
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

  // Get usuario record (including canal_youtube_id for ownership check)
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

  // Parse request body
  let body: {
    youtube_url: string;
    descripcion?: string;
    tipo_intercambio?: string;
    tono?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud invalido" },
      { status: 400 }
    );
  }

  // Validate youtube_url
  if (!body.youtube_url || typeof body.youtube_url !== "string") {
    return NextResponse.json(
      { error: "El link del video es obligatorio" },
      { status: 400 }
    );
  }

  const videoId = extractVideoId(body.youtube_url);
  if (!videoId) {
    return NextResponse.json(
      { error: "No se pudo extraer el ID del video. Verifica el link." },
      { status: 400 }
    );
  }

  // Validate descripcion length
  if (body.descripcion && body.descripcion.length > 300) {
    return NextResponse.json(
      { error: "La descripcion no puede superar los 300 caracteres." },
      { status: 400 }
    );
  }

  // Validate tipo_intercambio
  const tiposValidos = ["opinion", "pregunta", "experiencia"];
  if (body.tipo_intercambio && !tiposValidos.includes(body.tipo_intercambio)) {
    return NextResponse.json(
      { error: "Tipo de intercambio invalido." },
      { status: 400 }
    );
  }

  // Validate tono
  const tonosValidos = ["casual", "entusiasta", "reflexivo"];
  if (body.tono && !tonosValidos.includes(body.tono)) {
    return NextResponse.json(
      { error: "Tono invalido." },
      { status: 400 }
    );
  }

  // Check 2 video limit (seccion 5.5)
  const { count: videosActivos } = await supabase
    .from("videos")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", usuario.id)
    .eq("estado", "activo");

  if ((videosActivos ?? 0) >= MAX_VIDEOS_ACTIVOS) {
    return NextResponse.json(
      {
        error: `Ya tienes ${MAX_VIDEOS_ACTIVOS} videos activos. Completa las campanas de tus videos actuales antes de registrar uno nuevo.`,
      },
      { status: 409 }
    );
  }

  // Check if video is already registered
  const { data: videoExistente } = await supabase
    .from("videos")
    .select("id")
    .eq("youtube_video_id", videoId)
    .maybeSingle();

  if (videoExistente) {
    return NextResponse.json(
      { error: "Este video ya esta registrado en Comentalo." },
      { status: 409 }
    );
  }

  // Fetch video metadata from YouTube API
  const ytUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  ytUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
  ytUrl.searchParams.set("id", videoId);
  ytUrl.searchParams.set("part", "snippet,contentDetails,statistics,status");

  const ytResponse = await fetch(ytUrl.toString());

  if (!ytResponse.ok) {
    console.error("YouTube API error:", ytResponse.status);
    return NextResponse.json(
      { error: "Error al consultar YouTube. Intenta de nuevo." },
      { status: 502 }
    );
  }

  const ytData = await ytResponse.json();

  if (!ytData.items || ytData.items.length === 0) {
    return NextResponse.json(
      {
        error:
          "No encontramos este video en YouTube. Verifica que el video sea publico y que el link sea correcto.",
      },
      { status: 404 }
    );
  }

  const video = ytData.items[0];

  // Video must be public
  if (video.status?.privacyStatus !== "public") {
    return NextResponse.json(
      {
        error:
          "El video debe ser publico para registrarlo en Comentalo. Cambia la visibilidad en YouTube Studio e intenta de nuevo.",
      },
      { status: 400 }
    );
  }

  // Video must belong to the user's linked channel (seccion 9.1 — vinculacion permanente)
  const videoChannelId = video.snippet?.channelId;
  if (videoChannelId !== usuario.canal_youtube_id) {
    return NextResponse.json(
      {
        error:
          "Este video no pertenece a tu canal. Solo puedes registrar videos de tu propio canal de YouTube.",
      },
      { status: 403 }
    );
  }

  const titulo = video.snippet?.title || "Sin titulo";
  const vistas = parseInt(video.statistics?.viewCount || "0", 10);
  const duracionSegundos = parseDuration(
    video.contentDetails?.duration || "PT0S"
  );

  // Insert video
  const { data: nuevoVideo, error: insertError } = await supabase
    .from("videos")
    .insert({
      usuario_id: usuario.id,
      youtube_video_id: videoId,
      titulo,
      vistas,
      estado: "activo",
      intercambios_disponibles: 10,
      descripcion: body.descripcion || null,
      tipo_intercambio: body.tipo_intercambio || null,
      tono: body.tono || null,
      duracion_segundos: duracionSegundos,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error inserting video:", insertError);
    return NextResponse.json(
      { error: "Error al registrar el video. Intenta de nuevo." },
      { status: 500 }
    );
  }

  // Check regla de vistas (seccion 5C.4) — primera campana necesita >= 10 vistas
  let campanaCreada = false;

  if (vistas >= VISTAS_PRIMERA_CAMPANA) {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const { error: campanaError } = await serviceClient.from("campanas").insert({
      video_id: nuevoVideo.id,
      estado: "abierta",
      intercambios_completados: 0,
    });

    if (campanaError) {
      console.error("Error creating campana:", campanaError);
      // Video se registro pero la campana fallo — no es fatal
    } else {
      campanaCreada = true;
    }
  }

  return NextResponse.json({
    ok: true,
    video_id: nuevoVideo.id,
    titulo,
    vistas,
    duracion_segundos: duracionSegundos,
    campana_creada: campanaCreada,
    mensaje: campanaCreada
      ? "Video registrado y primera campana lanzada."
      : "Video registrado. Se activara automaticamente cuando alcance 10 vistas en YouTube.",
  });
}
