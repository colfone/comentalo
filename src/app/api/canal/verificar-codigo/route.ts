import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

  let body: { codigo: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  if (!body.codigo) {
    return NextResponse.json(
      { error: "Codigo es obligatorio." },
      { status: 400 }
    );
  }

  // Get the pending verification for this user
  const { data: verificacion } = await supabase
    .from("verificaciones_canal")
    .select("id, codigo, canal_youtube_id, canal_data, expires_at")
    .eq("auth_id", user.id)
    .eq("codigo", body.codigo)
    .eq("verificado", false)
    .single();

  if (!verificacion) {
    return NextResponse.json({
      ok: false,
      error: "Codigo de verificacion no encontrado o ya expirado.",
    });
  }

  // Check expiry
  if (new Date(verificacion.expires_at) < new Date()) {
    return NextResponse.json({
      ok: false,
      error:
        "El codigo expiro. Vuelve al paso anterior para generar uno nuevo.",
    });
  }

  // Fetch channel description from YouTube public API
  const ytUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  ytUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
  ytUrl.searchParams.set("id", verificacion.canal_youtube_id);
  ytUrl.searchParams.set("part", "snippet");

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

  const description: string = ytData.items[0].snippet?.description || "";

  // Check if code is in the channel description
  if (!description.includes(body.codigo)) {
    return NextResponse.json({
      ok: false,
      error:
        "No encontramos el codigo en la descripcion de tu canal. Asegurate de haberlo pegado y guardado en YouTube Studio, luego intenta de nuevo.",
    });
  }

  // Code found — register the user
  const canalData = verificacion.canal_data as {
    id: string;
    title: string;
    thumbnail: string;
    customUrl: string;
    subscribers: number;
    videos: number;
    publishedAt: string;
  };

  // Check if channel is already linked (race condition guard)
  const { data: existingUser } = await supabase
    .from("usuarios")
    .select("id")
    .eq("canal_youtube_id", verificacion.canal_youtube_id)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({
      ok: false,
      error:
        "Este canal ya esta vinculado a otra cuenta de Comentalo.",
    });
  }

  const channelUrl = canalData.customUrl
    ? `https://www.youtube.com/${canalData.customUrl}`
    : `https://www.youtube.com/channel/${canalData.id}`;

  const { error: insertError } = await supabase.from("usuarios").insert({
    auth_id: user.id,
    email: user.email,
    nombre: user.user_metadata?.full_name || user.user_metadata?.name || null,
    avatar_url: canalData.thumbnail || user.user_metadata?.avatar_url || null,
    canal_youtube_id: verificacion.canal_youtube_id,
    canal_url: channelUrl,
    suscriptores_al_registro: canalData.subscribers,
    antiguedad: canalData.publishedAt.split("T")[0],
    videos_al_registro: canalData.videos,
    reputacion: 100.0,
  });

  if (insertError) {
    console.error("Error inserting usuario:", insertError);
    return NextResponse.json(
      { error: "Error al crear tu cuenta. Intenta de nuevo." },
      { status: 500 }
    );
  }

  // Mark verification as complete
  await supabase
    .from("verificaciones_canal")
    .update({ verificado: true })
    .eq("id", verificacion.id);

  return NextResponse.json({ ok: true });
}
