import { createClient } from "@supabase/supabase-js";
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

  const { data: video } = await serviceClient
    .from("videos")
    .select("id, usuario_id, estado, suspensiones_count")
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

  if (video.estado !== "suspendido") {
    return NextResponse.json(
      { error: "Este video no esta suspendido." },
      { status: 400 }
    );
  }

  // Reincidence rule (seccion 6D.6): 2nd suspension requires manual review
  if ((video.suspensiones_count || 0) >= 2) {
    return NextResponse.json({
      ok: false,
      error:
        "Este video fue suspendido por segunda vez. Requiere revision manual del equipo de Comentalo antes de ser reactivado. Contacta a soporte.",
    });
  }

  // Reactivate
  await serviceClient
    .from("videos")
    .update({ estado: "activo" })
    .eq("id", video.id);

  return NextResponse.json({
    ok: true,
    mensaje: "Video reactivado correctamente.",
  });
}
