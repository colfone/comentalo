import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getConfigInt } from "@/lib/config/get-config";

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

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!usuario) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  let body: { video_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  if (!body.video_id) {
    return NextResponse.json(
      { error: "video_id es obligatorio." },
      { status: 400 }
    );
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Verify ownership
  const { data: video } = await serviceClient
    .from("videos")
    .select("id, usuario_id, vistas, estado")
    .eq("id", body.video_id)
    .single();

  if (!video) {
    return NextResponse.json(
      { error: "Video no encontrado." },
      { status: 404 }
    );
  }

  if (video.usuario_id !== usuario.id) {
    return NextResponse.json(
      { error: "Este video no te pertenece." },
      { status: 403 }
    );
  }

  if (video.estado !== "activo") {
    return NextResponse.json(
      { error: "El video debe estar activo para lanzar una campana." },
      { status: 400 }
    );
  }

  // Check no open campaign exists
  const { data: openCampana } = await serviceClient
    .from("campanas")
    .select("id")
    .eq("video_id", video.id)
    .eq("estado", "abierta")
    .maybeSingle();

  if (openCampana) {
    return NextResponse.json(
      { error: "Ya hay una campana abierta para este video." },
      { status: 409 }
    );
  }

  // Regla de vistas (seccion 5C.4):
  // vistas >= total intercambios de campanas anteriores + 10 de la nueva
  const { data: previousCampanas } = await serviceClient
    .from("campanas")
    .select("intercambios_completados")
    .eq("video_id", video.id);

  const totalPrevious = (previousCampanas || []).reduce(
    (sum: number, c: { intercambios_completados: number }) =>
      sum + c.intercambios_completados,
    0
  );

  // TODO v2: este "+10" es legacy del modelo con intercambios_por_campana=10.
  // Con campañas por tiempo, la regla de vistas requiere rediseño. No lo
  // conectamos a configuracion para no cementar semántica confusa.
  const vistasRequeridas = totalPrevious + 10;

  if (video.vistas < vistasRequeridas) {
    return NextResponse.json({
      ok: false,
      error: `Tu video necesita al menos ${vistasRequeridas} vistas para lanzar esta campana. Actualmente tiene ${video.vistas}.`,
    });
  }

  // Create campaign
  const { error: insertError } = await serviceClient
    .from("campanas")
    .insert({
      video_id: video.id,
      estado: "abierta",
      intercambios_completados: 0,
    });

  if (insertError) {
    console.error("Error creating campana:", insertError);
    if (
      insertError.code === "P0001" &&
      insertError.message?.includes("Créditos insuficientes")
    ) {
      const costoCampana = await getConfigInt("costo_campana_creditos", 30);
      return NextResponse.json(
        {
          error: `No tienes créditos suficientes para abrir esta campaña. Necesitas ${costoCampana} 💎 créditos.`,
        },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "Error al lanzar la campana." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
