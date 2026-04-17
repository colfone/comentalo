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

interface VideoItem {
  id: string;
  titulo: string;
  thumbnail: string;
  vistas: number;
  likes: number | null;
  comentarios: number;
  duracion_segundos: number;
  ya_registrado: boolean;
  comentarios_desactivados: boolean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "1";

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

  // --- Check cache ---
  if (!forceRefresh) {
    const { data: cache } = await supabase
      .from("cache_videos_youtube")
      .select("videos, expires_at")
      .eq("usuario_id", usuario.id)
      .single();

    if (cache && new Date(cache.expires_at) > new Date()) {
      // Cache valid — still need to mark ya_registrado against current DB state
      const cachedVideos = cache.videos as VideoItem[];
      const enriched = await markRegistered(supabase, cachedVideos);
      return NextResponse.json({ videos: enriched, from_cache: true });
    }
  }

  // --- Fetch from YouTube API ---
  // Step 1: search.list to get recent video IDs
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
  searchUrl.searchParams.set("channelId", usuario.canal_youtube_id);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "8");
  searchUrl.searchParams.set("part", "id");

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    console.error("YouTube search API error:", searchRes.status);
    return NextResponse.json(
      { error: "Error al consultar YouTube. Intenta de nuevo." },
      { status: 502 }
    );
  }

  const searchData = await searchRes.json();
  const videoIds: string[] = (searchData.items || [])
    .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) {
    return NextResponse.json({ videos: [], from_cache: false });
  }

  // Step 2: videos.list to get full metadata (duration, views, title, thumbnail)
  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
  videosUrl.searchParams.set("id", videoIds.join(","));
  videosUrl.searchParams.set("part", "snippet,contentDetails,statistics");

  const videosRes = await fetch(videosUrl.toString());
  if (!videosRes.ok) {
    console.error("YouTube videos API error:", videosRes.status);
    return NextResponse.json(
      { error: "Error al obtener datos de los videos." },
      { status: 502 }
    );
  }

  const videosData = await videosRes.json();
  const videos: VideoItem[] = (videosData.items || []).map(
    (v: {
      id: string;
      snippet?: { title?: string; thumbnails?: { medium?: { url?: string } } };
      contentDetails?: { duration?: string };
      statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
    }) => ({
      id: v.id,
      titulo: v.snippet?.title || "",
      thumbnail:
        v.snippet?.thumbnails?.medium?.url ||
        `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
      vistas: parseInt(v.statistics?.viewCount || "0", 10),
      likes: v.statistics?.likeCount != null ? parseInt(v.statistics.likeCount, 10) : null,
      comentarios: v.statistics?.commentCount != null ? parseInt(v.statistics.commentCount, 10) : 0,
      duracion_segundos: parseDuration(v.contentDetails?.duration || "PT0S"),
      ya_registrado: false,
      comentarios_desactivados: v.statistics?.commentCount == null,
    })
  );

  // --- Save to cache (upsert) ---
  await supabase.from("cache_videos_youtube").upsert(
    {
      usuario_id: usuario.id,
      videos: videos,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "usuario_id" }
  );

  // --- Mark already registered ---
  const enriched = await markRegistered(supabase, videos);

  return NextResponse.json({ videos: enriched, from_cache: false });
}

// --- Helper: mark videos already registered in Comentalo ---

async function markRegistered(
  supabase: ReturnType<typeof createServerClient>,
  videos: VideoItem[]
): Promise<VideoItem[]> {
  if (videos.length === 0) return videos;

  const ids = videos.map((v) => v.id);
  const { data: registered } = await supabase
    .from("videos")
    .select("youtube_video_id")
    .in("youtube_video_id", ids);

  const registeredSet = new Set(
    (registered || []).map((r: { youtube_video_id: string }) => r.youtube_video_id)
  );

  return videos.map((v) => ({
    ...v,
    ya_registrado: registeredSet.has(v.id),
  }));
}
