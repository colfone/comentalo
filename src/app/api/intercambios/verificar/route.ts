import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { crearNotificacion } from "@/lib/notificaciones";

// Service-role client for operations that bypass RLS
// (second commentator assignment, video suspension, campaign updates)
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
  let body: { intercambio_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo invalido" },
      { status: 400 }
    );
  }

  if (!body.intercambio_id) {
    return NextResponse.json(
      { error: "intercambio_id es obligatorio." },
      { status: 400 }
    );
  }

  // --- Get intercambio with related data ---
  const serviceClient = createServiceClient();

  const { data: intercambio } = await serviceClient
    .from("intercambios")
    .select(
      "id, campana_id, comentarista_id, texto_comentario, estado"
    )
    .eq("id", body.intercambio_id)
    .single();

  if (!intercambio) {
    return NextResponse.json(
      { error: "Intercambio no encontrado." },
      { status: 404 }
    );
  }

  if (intercambio.comentarista_id !== usuario.id) {
    return NextResponse.json(
      { error: "Este intercambio no te pertenece." },
      { status: 403 }
    );
  }

  if (intercambio.estado !== "pendiente") {
    return NextResponse.json(
      { error: "Este intercambio ya fue procesado." },
      { status: 409 }
    );
  }

  if (!intercambio.texto_comentario || intercambio.texto_comentario.length === 0) {
    return NextResponse.json(
      { error: "Debes copiar el comentario antes de verificar." },
      { status: 400 }
    );
  }

  // Get campaign + video info
  const { data: campana } = await serviceClient
    .from("campanas")
    .select("id, video_id, estado, intercambios_completados")
    .eq("id", intercambio.campana_id)
    .single();

  if (!campana) {
    return NextResponse.json(
      { error: "Campana no encontrada." },
      { status: 500 }
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
      { status: 500 }
    );
  }

  // --- Call YouTube commentThreads API (seccion 6B.2) ---
  // Search for a comment by this user's channel on this video
  const ytUrl = new URL(
    "https://www.googleapis.com/youtube/v3/commentThreads"
  );
  ytUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
  ytUrl.searchParams.set("part", "snippet");
  ytUrl.searchParams.set("videoId", video.youtube_video_id);
  ytUrl.searchParams.set("searchTerms", intercambio.texto_comentario.slice(0, 100));
  ytUrl.searchParams.set("maxResults", "20");

  let commentFound = false;

  try {
    const ytRes = await fetch(ytUrl.toString());

    if (ytRes.ok) {
      const ytData = await ytRes.json();
      const items = ytData.items || [];

      // Search for exact text match from this user's channel
      for (const item of items) {
        const snippet = item.snippet?.topLevelComment?.snippet;
        if (!snippet) continue;

        const matchesChannel =
          snippet.authorChannelId?.value === usuario.canal_youtube_id;
        const matchesText =
          snippet.textOriginal === intercambio.texto_comentario ||
          snippet.textDisplay === intercambio.texto_comentario;

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

  // --- FOUND: Mark as verified (seccion 6B.3 paso 5) ---
  if (commentFound) {
    // Update intercambio estado → verificado
    await serviceClient
      .from("intercambios")
      .update({ estado: "verificado" })
      .eq("id", intercambio.id);

    // Increment intercambios_completados in campaign
    const newCompleted = (campana.intercambios_completados || 0) + 1;
    const campanaUpdate: { intercambios_completados: number; estado?: string; closed_at?: string } = {
      intercambios_completados: newCompleted,
    };

    // If campaign reaches 10, close it (seccion 5C.3)
    if (newCompleted >= 10) {
      campanaUpdate.estado = "completada";
      campanaUpdate.closed_at = new Date().toISOString();
    }

    await serviceClient
      .from("campanas")
      .update(campanaUpdate)
      .eq("id", campana.id);

    // Notifications
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
      mensaje: `Tu video "${video.titulo}" recibio un nuevo intercambio verificado.`,
      url_destino: `/dashboard/campana/${campana.id}`,
    });

    if (newCompleted >= 10) {
      await crearNotificacion({
        usuario_id: video.usuario_id,
        tipo: "campana_completa",
        titulo: "Campana completada",
        mensaje: `Tu video "${video.titulo}" completo su campana de 10 intercambios. Califica los intercambios recibidos.`,
        url_destino: `/dashboard/calificar/${campana.id}`,
      });
    }

    return NextResponse.json({
      ok: true,
      resultado: "verificado",
      mensaje: "Intercambio verificado correctamente.",
    });
  }

  // --- NOT FOUND: Pending flow (seccion 6C.3) ---

  // ACCION 2: Create entry in verificaciones_pendientes with first retry at +30 min
  await serviceClient.from("verificaciones_pendientes").insert({
    intercambio_id: intercambio.id,
    proximo_intento_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    intentos: 0,
  });

  // Notification: intercambio pendiente
  await crearNotificacion({
    usuario_id: usuario.id,
    tipo: "intercambio_pendiente",
    titulo: "Tu comentario esta en revision",
    mensaje: "Tu intercambio esta siendo revisado por YouTube. Esto es normal y puede tardar hasta 24 horas.",
    url_destino: "/dashboard",
  });

  // ACCION 1 (seccion 6C.3): The campaign slot remains open naturally.
  // The next commentator who calls asignar_intercambio will pick up this
  // campaign since intercambios_completados < 10 still holds. The creator
  // gets their comment without waiting. If the original pending comment
  // later verifies via Exponential Backoff, the creator gets a bonus comment.

  // Check video suspension rule (seccion 6D.1):
  // 3+ pending intercambios on same video in last 24 hours → suspend
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  // Get all campaign IDs for this video
  const { data: videoCampanas } = await serviceClient
    .from("campanas")
    .select("id")
    .eq("video_id", video.id);

  const campanaIds = (videoCampanas || []).map(
    (c: { id: string }) => c.id
  );

  if (campanaIds.length > 0) {
    // Get intercambio IDs from those campaigns
    const { data: videoIntercambios } = await serviceClient
      .from("intercambios")
      .select("id")
      .in("campana_id", campanaIds);

    const intercambioIds = (videoIntercambios || []).map(
      (i: { id: string }) => i.id
    );

    if (intercambioIds.length > 0) {
      const { count: pendingCount } = await serviceClient
        .from("verificaciones_pendientes")
        .select("id", { count: "exact", head: true })
        .in("intercambio_id", intercambioIds)
        .gte("created_at", twentyFourHoursAgo);

      if ((pendingCount ?? 0) >= 3) {
        // Suspend the video and increment counter (seccion 6D.4, 6D.6)
        const { data: currentVideo } = await serviceClient
          .from("videos")
          .select("suspensiones_count")
          .eq("id", video.id)
          .single();

        const newCount = ((currentVideo?.suspensiones_count as number) || 0) + 1;

        await serviceClient
          .from("videos")
          .update({
            estado: "suspendido",
            suspensiones_count: newCount,
          })
          .eq("id", video.id);

        await crearNotificacion({
          usuario_id: video.usuario_id,
          tipo: "video_suspendido",
          titulo: "Tu video fue suspendido",
          mensaje: `Tu video "${video.titulo}" fue suspendido porque 3 intercambios no se verificaron. Revisa la configuracion de comentarios en YouTube Studio.`,
          url_destino: "/dashboard",
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    resultado: "pendiente",
    mensaje:
      "Tu intercambio esta siendo revisado por YouTube. Esto es normal y puede tardar hasta 24 horas. Los demas intercambios siguen funcionando con normalidad.",
  });
}
