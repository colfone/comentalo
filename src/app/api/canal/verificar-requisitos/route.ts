import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Resuelve distintos formatos de URL del canal de YouTube
function extractChannelId(url: string): { type: "id" | "custom" | "handle"; value: string } | null {
  const channelMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelMatch) return { type: "id", value: channelMatch[1] };

  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  if (handleMatch) return { type: "handle", value: `@${handleMatch[1]}` };

  const customMatch = url.match(/youtube\.com\/(?:c\/)?([a-zA-Z0-9_.-]+)/);
  if (customMatch && !["watch", "feed", "channel", "playlist", "shorts"].includes(customMatch[1])) {
    return { type: "custom", value: customMatch[1] };
  }

  return null;
}

export async function POST(request: Request) {
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

  let body: { canal_url: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  if (!body.canal_url) {
    return NextResponse.json(
      { error: "El link del canal es obligatorio." },
      { status: 400 }
    );
  }

  // Parsea el link del canal
  const parsed = extractChannelId(body.canal_url);
  if (!parsed) {
    return NextResponse.json({
      ok: false,
      error:
        "No pudimos reconocer el link. Usa un formato como youtube.com/@tucanal o youtube.com/channel/UCxxxx",
    });
  }

  // Resuelve a channel ID via YouTube API
  let channelId: string | null = null;

  if (parsed.type === "id") {
    channelId = parsed.value;
  } else {
    const searchParam = parsed.type === "handle" ? "forHandle" : "forUsername";
    const resolveUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    resolveUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
    resolveUrl.searchParams.set("part", "id");
    resolveUrl.searchParams.set(searchParam, parsed.value);

    const resolveRes = await fetch(resolveUrl.toString());
    if (resolveRes.ok) {
      const resolveData = await resolveRes.json();
      if (resolveData.items && resolveData.items.length > 0) {
        channelId = resolveData.items[0].id;
      }
    }

    // Fallback — search
    if (!channelId) {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
      searchUrl.searchParams.set("part", "id");
      searchUrl.searchParams.set("type", "channel");
      searchUrl.searchParams.set("q", parsed.value);
      searchUrl.searchParams.set("maxResults", "1");

      const searchRes = await fetch(searchUrl.toString());
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].id?.channelId || null;
        }
      }
    }
  }

  if (!channelId) {
    return NextResponse.json({
      ok: false,
      error:
        "No encontramos este canal en YouTube. Verifica que el link sea correcto y que el canal sea publico.",
    });
  }

  // Trae la data completa del canal
  const ytUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  ytUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
  ytUrl.searchParams.set("id", channelId);
  ytUrl.searchParams.set("part", "snippet,statistics");

  const ytRes = await fetch(ytUrl.toString());
  if (!ytRes.ok) {
    return NextResponse.json({
      ok: false,
      error: "Error al consultar YouTube. Intenta de nuevo.",
    });
  }

  const ytData = await ytRes.json();
  if (!ytData.items || ytData.items.length === 0) {
    return NextResponse.json({
      ok: false,
      error: "Canal no encontrado en YouTube.",
    });
  }

  const channel = ytData.items[0];

  // Idempotencia: si el usuario ya tiene fila de usuarios con este canal, retry es exitoso
  const { data: existingByAuth } = await supabase
    .from("usuarios")
    .select("id, canal_youtube_id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existingByAuth) {
    if (existingByAuth.canal_youtube_id === channelId) {
      return NextResponse.json({ ok: true });
    }
    // Ya tiene cuenta vinculada a otro canal — cambio solo via soporte (seccion 9.3)
    return NextResponse.json({
      ok: false,
      error:
        "Ya tienes una cuenta vinculada a otro canal. Contacta a soporte para cambiarlo.",
    });
  }

  // Anti-duplicado: canal ya usado por otro auth
  const { data: existingByChannel } = await supabase
    .from("usuarios")
    .select("id")
    .eq("canal_youtube_id", channelId)
    .maybeSingle();

  if (existingByChannel) {
    return NextResponse.json({
      ok: false,
      error:
        "Este canal de YouTube ya esta vinculado a otra cuenta de Comentalo.",
    });
  }

  // Verifica requisitos minimos (seccion 4B)
  const errors: string[] = [];

  if (channel.statistics.hiddenSubscriberCount) {
    errors.push("Tu canal debe ser publico para registrarte en Comentalo.");
  }

  const createdAt = new Date(channel.snippet.publishedAt);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  if (createdAt > threeMonthsAgo) {
    errors.push(
      "Tu canal debe tener al menos 3 meses de antiguedad. " +
        `Fue creado el ${createdAt.toLocaleDateString("es-LA")}.`
    );
  }

  const videoCount = parseInt(channel.statistics.videoCount || "0", 10);
  if (videoCount < 1) {
    errors.push("Tu canal debe tener al menos 1 video publico.");
  }

  const subscriberCount = parseInt(
    channel.statistics.subscriberCount || "0",
    10
  );
  if (subscriberCount < 20) {
    errors.push(
      `Tu canal tiene ${subscriberCount} suscriptores. Se requieren al menos 20.`
    );
  }

  if (errors.length > 0) {
    return NextResponse.json({
      ok: false,
      error: errors.join("|"),
    });
  }

  // Auto-registro — inserta directo en public.usuarios (reemplaza flujo de codigo)
  const channelUrl = channel.snippet.customUrl
    ? `https://www.youtube.com/${channel.snippet.customUrl}`
    : `https://www.youtube.com/channel/${channelId}`;

  const { error: insertError } = await supabase.from("usuarios").insert({
    auth_id: user.id,
    email: user.email,
    nombre:
      user.user_metadata?.full_name || user.user_metadata?.name || null,
    avatar_url:
      channel.snippet.thumbnails?.default?.url ||
      user.user_metadata?.avatar_url ||
      null,
    canal_youtube_id: channelId,
    canal_url: channelUrl,
    suscriptores_al_registro: subscriberCount,
    antiguedad: channel.snippet.publishedAt.split("T")[0],
    videos_al_registro: videoCount,
    reputacion: 100.0,
  });

  if (insertError) {
    console.error("Error inserting usuario:", insertError);
    return NextResponse.json(
      { error: "Error al crear tu cuenta. Intenta de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
