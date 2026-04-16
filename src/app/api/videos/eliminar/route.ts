import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
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
    .select("id, usuario_id")
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

  // Check for verified intercambios — block deletion if any exist
  const { data: campanas } = await serviceClient
    .from("campanas")
    .select("id")
    .eq("video_id", video.id);

  const campanaIds = (campanas || []).map((c: { id: string }) => c.id);

  if (campanaIds.length > 0) {
    const { count: verificados } = await serviceClient
      .from("intercambios")
      .select("id", { count: "exact", head: true })
      .in("campana_id", campanaIds)
      .eq("estado", "verificado");

    if ((verificados ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Este video ya tiene intercambios verificados y no puede ser eliminado.",
        },
        { status: 409 }
      );
    }
  }

  // Delete — cascades to campanas and intercambios
  const { error: deleteError } = await serviceClient
    .from("videos")
    .delete()
    .eq("id", video.id);

  if (deleteError) {
    console.error("Error deleting video:", deleteError);
    return NextResponse.json(
      { error: "Error al eliminar el video." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
