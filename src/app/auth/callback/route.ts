import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// --- YouTube channel type ---

interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: { default?: { url: string } };
    customUrl?: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
}

// --- Channel verification (seccion 4B) ---

function verifyChannelRequirements(
  channel: YouTubeChannel
): { ok: true; channel: YouTubeChannel } | { ok: false; reason: string } {
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

  const videoCount = parseInt(channel.statistics.videoCount, 10);
  if (videoCount < 1) {
    errors.push("Tu canal debe tener al menos 1 video publico.");
  }

  const subscriberCount = parseInt(channel.statistics.subscriberCount, 10);
  if (subscriberCount < 20) {
    errors.push(
      `Tu canal tiene ${subscriberCount} suscriptores. Se requieren al menos 20.`
    );
  }

  if (errors.length > 0) {
    return { ok: false, reason: errors.join("|") };
  }

  return { ok: true, channel };
}

// --- Route handler ---

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
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

  // Exchange OAuth code for session
  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData.session) {
    console.error("Session exchange error:", sessionError);
    return NextResponse.redirect(`${origin}/login?error=session_failed`);
  }

  const session = sessionData.session;
  const providerToken = session.provider_token;
  const user = session.user;

  if (!providerToken) {
    console.error("No provider_token returned from Google OAuth");
    return NextResponse.redirect(`${origin}/login?error=no_provider_token`);
  }

  // Check if user is already registered
  const { data: existingAccount } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existingAccount) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // --- Fetch ALL YouTube channels for this account ---
  let channels: YouTubeChannel[] = [];

  try {
    const ytResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: { Authorization: `Bearer ${providerToken}` },
      }
    );

    if (!ytResponse.ok) {
      const errorBody = await ytResponse.text();
      console.error("YouTube API error:", ytResponse.status, errorBody);
      return NextResponse.redirect(
        `${origin}/registro-rechazado?reason=` +
          encodeURIComponent(
            "No pudimos acceder a tu canal de YouTube. Asegurate de tener un canal creado y vuelve a intentar."
          )
      );
    }

    const ytData = await ytResponse.json();

    if (!ytData.items || ytData.items.length === 0) {
      return NextResponse.redirect(
        `${origin}/registro-rechazado?reason=` +
          encodeURIComponent(
            "No encontramos un canal de YouTube asociado a tu cuenta de Google. Necesitas tener un canal para registrarte."
          )
      );
    }

    channels = ytData.items as YouTubeChannel[];
  } catch (err) {
    console.error("YouTube API fetch error:", err);
    return NextResponse.redirect(
      `${origin}/registro-rechazado?reason=` +
        encodeURIComponent(
          "Error al verificar tu canal de YouTube. Intenta de nuevo mas tarde."
        )
    );
  }

  // --- Multiple channels: redirect to selection page ---
  if (channels.length > 1) {
    // Encode minimal channel data for the selection page
    const channelSummaries = channels.map((ch) => ({
      id: ch.id,
      title: ch.snippet.title,
      thumbnail: ch.snippet.thumbnails?.default?.url || "",
      subscribers: parseInt(ch.statistics.subscriberCount, 10),
      videos: parseInt(ch.statistics.videoCount, 10),
      publishedAt: ch.snippet.publishedAt,
      customUrl: ch.snippet.customUrl || "",
      hiddenSubscriberCount: ch.statistics.hiddenSubscriberCount,
    }));

    const encoded = encodeURIComponent(JSON.stringify(channelSummaries));
    return NextResponse.redirect(
      `${origin}/seleccionar-canal?channels=${encoded}`
    );
  }

  // --- Single channel: verify and register directly ---
  const channel = channels[0];
  const verification = verifyChannelRequirements(channel);

  if (!verification.ok) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/registro-rechazado?reason=` +
        encodeURIComponent(verification.reason)
    );
  }

  // Check if channel is already linked to another account
  const { data: existingUser } = await supabase
    .from("usuarios")
    .select("id, auth_id")
    .eq("canal_youtube_id", channel.id)
    .maybeSingle();

  if (existingUser) {
    if (existingUser.auth_id === user.id) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/registro-rechazado?reason=` +
        encodeURIComponent(
          "Este canal de YouTube ya esta vinculado a otra cuenta de Comentalo. Cada canal solo puede estar vinculado a una cuenta."
        )
    );
  }

  // Insert user
  const channelUrl = channel.snippet.customUrl
    ? `https://www.youtube.com/${channel.snippet.customUrl}`
    : `https://www.youtube.com/channel/${channel.id}`;

  const { error: insertError } = await supabase.from("usuarios").insert({
    auth_id: user.id,
    email: user.email,
    nombre: user.user_metadata?.full_name || user.user_metadata?.name || null,
    avatar_url:
      channel.snippet.thumbnails?.default?.url ||
      user.user_metadata?.avatar_url ||
      null,
    canal_youtube_id: channel.id,
    canal_url: channelUrl,
    suscriptores_al_registro: parseInt(
      channel.statistics.subscriberCount,
      10
    ),
    antiguedad: channel.snippet.publishedAt.split("T")[0],
    videos_al_registro: parseInt(channel.statistics.videoCount, 10),
    reputacion: 100.0,
  });

  if (insertError) {
    console.error("Error inserting usuario:", insertError);
    return NextResponse.redirect(
      `${origin}/registro-rechazado?reason=` +
        encodeURIComponent(
          "Error al crear tu cuenta. Intenta de nuevo mas tarde."
        )
    );
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
