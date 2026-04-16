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

  // Check if already registered
  const { data: existingAccount } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existingAccount) {
    return NextResponse.json({ ok: true, redirect: "/dashboard" });
  }

  // Parse body — channel data from the selection page
  let body: {
    id: string;
    title: string;
    thumbnail: string;
    subscribers: number;
    videos: number;
    publishedAt: string;
    customUrl: string;
    hiddenSubscriberCount: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Datos invalidos." },
      { status: 400 }
    );
  }

  if (!body.id) {
    return NextResponse.json(
      { error: "ID del canal es obligatorio." },
      { status: 400 }
    );
  }

  // --- Verify channel requirements (seccion 4B) ---
  const errors: string[] = [];

  if (body.hiddenSubscriberCount) {
    errors.push("Tu canal debe ser publico para registrarte en Comentalo.");
  }

  const createdAt = new Date(body.publishedAt);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  if (createdAt > threeMonthsAgo) {
    errors.push(
      "Tu canal debe tener al menos 3 meses de antiguedad. " +
        `Fue creado el ${createdAt.toLocaleDateString("es-LA")}.`
    );
  }

  if (body.videos < 1) {
    errors.push("Tu canal debe tener al menos 1 video publico.");
  }

  if (body.subscribers < 20) {
    errors.push(
      `Tu canal tiene ${body.subscribers} suscriptores. Se requieren al menos 20.`
    );
  }

  if (errors.length > 0) {
    return NextResponse.json({
      ok: false,
      error: errors.join("|"),
    });
  }

  // Check if channel is already linked to another account
  const { data: existingUser } = await supabase
    .from("usuarios")
    .select("id, auth_id")
    .eq("canal_youtube_id", body.id)
    .maybeSingle();

  if (existingUser) {
    if (existingUser.auth_id === user.id) {
      return NextResponse.json({ ok: true, redirect: "/dashboard" });
    }
    return NextResponse.json({
      ok: false,
      error:
        "Este canal de YouTube ya esta vinculado a otra cuenta de Comentalo. Cada canal solo puede estar vinculado a una cuenta.",
    });
  }

  // Insert user
  const channelUrl = body.customUrl
    ? `https://www.youtube.com/${body.customUrl}`
    : `https://www.youtube.com/channel/${body.id}`;

  const { error: insertError } = await supabase.from("usuarios").insert({
    auth_id: user.id,
    email: user.email,
    nombre: user.user_metadata?.full_name || user.user_metadata?.name || null,
    avatar_url: body.thumbnail || user.user_metadata?.avatar_url || null,
    canal_youtube_id: body.id,
    canal_url: channelUrl,
    suscriptores_al_registro: body.subscribers,
    antiguedad: body.publishedAt.split("T")[0],
    videos_al_registro: body.videos,
    reputacion: 100.0,
  });

  if (insertError) {
    console.error("Error inserting usuario:", insertError);
    return NextResponse.json(
      { error: "Error al crear tu cuenta. Intenta de nuevo mas tarde." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, redirect: "/dashboard" });
}
