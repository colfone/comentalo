import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

async function getAuthUser() {
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
  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  return usuario;
}

// GET: Fetch intercambios for a campaign that belong to this user's video
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campanaId = searchParams.get("campana_id");

  if (!campanaId) {
    return NextResponse.json(
      { error: "campana_id es obligatorio." },
      { status: 400 }
    );
  }

  const usuario = await getAuthUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Verify campaign belongs to user's video
  const { data: campana } = await serviceClient
    .from("campanas")
    .select("id, video_id")
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
    .select("usuario_id")
    .eq("id", campana.video_id)
    .single();

  if (!video || video.usuario_id !== usuario.id) {
    return NextResponse.json(
      { error: "No tienes permiso para ver esta campana." },
      { status: 403 }
    );
  }

  // Get verified intercambios for this campaign
  const { data: intercambios } = await serviceClient
    .from("intercambios")
    .select("id, texto_comentario, calificacion, estrellas, comentarista_id")
    .eq("campana_id", campanaId)
    .eq("estado", "verificado")
    .order("created_at", { ascending: true });

  return NextResponse.json({ intercambios: intercambios || [] });
}

export async function POST(request: Request) {
  const usuario = await getAuthUser();
  if (!usuario) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Parse body
  let body: {
    intercambio_id: string;
    estrellas: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo invalido" },
      { status: 400 }
    );
  }

  const estrellas = Number(body.estrellas);

  if (!body.intercambio_id || !Number.isInteger(estrellas)) {
    return NextResponse.json(
      { error: "intercambio_id y estrellas son obligatorios." },
      { status: 400 }
    );
  }

  if (estrellas < 1 || estrellas > 5) {
    return NextResponse.json(
      { error: "estrellas debe estar entre 1 y 5." },
      { status: 400 }
    );
  }

  const calificacionDerivada: "positiva" | "negativa" | "neutral" =
    estrellas >= 4 ? "positiva" : estrellas <= 2 ? "negativa" : "neutral";

  const serviceClient = createServiceClient();

  // Get intercambio with campaign and video chain to verify ownership
  const { data: intercambio } = await serviceClient
    .from("intercambios")
    .select("id, campana_id, estado, estrellas, comentarista_id")
    .eq("id", body.intercambio_id)
    .single();

  if (!intercambio) {
    return NextResponse.json(
      { error: "Intercambio no encontrado." },
      { status: 404 }
    );
  }

  if (intercambio.estado !== "verificado") {
    return NextResponse.json(
      { error: "Solo se pueden calificar intercambios verificados." },
      { status: 400 }
    );
  }

  if (intercambio.estrellas) {
    return NextResponse.json(
      { error: "Este intercambio ya fue calificado." },
      { status: 409 }
    );
  }

  // Verify the user owns the video (is the creator, not the commentator)
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
    .select("usuario_id")
    .eq("id", campana.video_id)
    .single();

  if (!video || video.usuario_id !== usuario.id) {
    return NextResponse.json(
      { error: "No tienes permiso para calificar este intercambio." },
      { status: 403 }
    );
  }

  // Apply calificacion: estrellas es la fuente de verdad; calificacion se mantiene por compat
  await serviceClient
    .from("intercambios")
    .update({ estrellas, calificacion: calificacionDerivada })
    .eq("id", body.intercambio_id);

  // +1 crédito al creador por calificar (modelo v2).
  // No es fatal: si falla, la calificación ya quedó guardada.
  const { error: creditoError } = await serviceClient.rpc(
    "aplicar_credito_calificacion",
    { p_usuario_id: usuario.id }
  );
  if (creditoError) {
    console.error("Error aplicando crédito por calificar:", creditoError);
  }

  // Recalculate commentator's reputation
  await serviceClient.rpc("calcular_reputacion", {
    p_comentarista_id: intercambio.comentarista_id,
  });

  return NextResponse.json({ ok: true });
}
