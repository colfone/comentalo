import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// --- YouTube channel verification (seccion 4B) ---

interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    publishedAt: string; // ISO date — channel creation date
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

interface VerificationResult {
  ok: true;
  channel: YouTubeChannel;
}

interface VerificationError {
  ok: false;
  reason: string;
}

function verifyChannelRequirements(
  channel: YouTubeChannel
): VerificationResult | VerificationError {
  const errors: string[] = [];

  // 1. Canal publico — hiddenSubscriberCount indica canal privado
  if (channel.statistics.hiddenSubscriberCount) {
    errors.push("Tu canal debe ser publico para registrarte en Comentalo.");
  }

  // 2. Antiguedad minima: 3 meses
  const createdAt = new Date(channel.snippet.publishedAt);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  if (createdAt > threeMonthsAgo) {
    errors.push(
      "Tu canal debe tener al menos 3 meses de antiguedad. " +
        `Fue creado el ${createdAt.toLocaleDateString("es-LA")}.`
    );
  }

  // 3. Minimo 1 video publico
  const videoCount = parseInt(channel.statistics.videoCount, 10);
  if (videoCount < 1) {
    errors.push(
      "Tu canal debe tener al menos 1 video publico."
    );
  }

  // 4. Minimo 20 suscriptores
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

  // Create Supabase client with cookie access for this route handler
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

  if (!providerToken) {
    console.error("No provider_token returned from Google OAuth");
    return NextResponse.redirect(`${origin}/login?error=no_provider_token`);
  }

  // --- Call YouTube Data API to get channel info (seccion 4B.1) ---
  // GET https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true
  // Uses the user's OAuth token — cost: 1 quota unit

  let channelData: YouTubeChannel | null = null;

  try {
    const ytResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
        },
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

    channelData = ytData.items[0] as YouTubeChannel;
  } catch (err) {
    console.error("YouTube API fetch error:", err);
    return NextResponse.redirect(
      `${origin}/registro-rechazado?reason=` +
        encodeURIComponent(
          "Error al verificar tu canal de YouTube. Intenta de nuevo mas tarde."
        )
    );
  }

  // --- Verify channel requirements (seccion 4B) ---

  const verification = verifyChannelRequirements(channelData);

  if (!verification.ok) {
    // Sign out — the user cannot register yet
    await supabase.auth.signOut();

    return NextResponse.redirect(
      `${origin}/registro-rechazado?reason=` +
        encodeURIComponent(verification.reason)
    );
  }

  // --- Channel passes all checks — save to usuarios table (seccion 6F.5, 9.1) ---

  const channel = verification.channel;
  const user = session.user;

  // Check if this YouTube channel is already linked to another account (seccion 9.1 — permanent binding)
  const { data: existingUser } = await supabase
    .from("usuarios")
    .select("id, auth_id")
    .eq("canal_youtube_id", channel.id)
    .maybeSingle();

  if (existingUser) {
    if (existingUser.auth_id === user.id) {
      // Same user logging in again — redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // Different auth user trying to register the same channel — blocked
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/registro-rechazado?reason=` +
        encodeURIComponent(
          "Este canal de YouTube ya esta vinculado a otra cuenta de Comentalo. Cada canal solo puede estar vinculado a una cuenta."
        )
    );
  }

  // Check if this auth user already has a linked channel
  const { data: existingAccount } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existingAccount) {
    // User already registered — just go to dashboard
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Insert new user with channel data — seccion 6F.5 campos
  const channelUrl =
    channel.snippet.customUrl
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
    antiguedad: channel.snippet.publishedAt.split("T")[0], // DATE format YYYY-MM-DD
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

  // Success — redirect to dashboard
  return NextResponse.redirect(`${origin}/dashboard`);
}
