import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { valido: false, error: "videoId es obligatorio." },
      { status: 400 }
    );
  }

  // Auth
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
    return NextResponse.json(
      { valido: false, error: "No autenticado." },
      { status: 401 }
    );
  }

  // Get user's linked channel
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("canal_youtube_id")
    .eq("auth_id", user.id)
    .single();

  if (!usuario) {
    return NextResponse.json(
      { valido: false, error: "Usuario no encontrado." },
      { status: 404 }
    );
  }

  // Fetch video from YouTube API
  const ytUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  ytUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
  ytUrl.searchParams.set("id", videoId);
  ytUrl.searchParams.set("part", "snippet,status");

  const ytResponse = await fetch(ytUrl.toString());

  if (!ytResponse.ok) {
    return NextResponse.json(
      { valido: false, error: "Error al consultar YouTube. Intenta de nuevo." },
      { status: 502 }
    );
  }

  const ytData = await ytResponse.json();

  if (!ytData.items || ytData.items.length === 0) {
    return NextResponse.json({
      valido: false,
      error:
        "No encontramos este video en YouTube. Verifica que sea publico y que el link sea correcto.",
    });
  }

  const video = ytData.items[0];

  // Check privacy
  if (video.status?.privacyStatus !== "public") {
    return NextResponse.json({
      valido: false,
      error:
        "El video debe ser publico para registrarlo en Comentalo.",
    });
  }

  // Check ownership
  if (video.snippet?.channelId !== usuario.canal_youtube_id) {
    return NextResponse.json({
      valido: false,
      error:
        "Este video no pertenece a tu canal. Solo puedes registrar videos de tu propio canal de YouTube.",
    });
  }

  return NextResponse.json({
    valido: true,
    titulo: video.snippet?.title || "",
    thumbnail:
      video.snippet?.thumbnails?.medium?.url ||
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  });
}
