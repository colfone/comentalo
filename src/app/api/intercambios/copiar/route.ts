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

  // Parse body
  let body: {
    intercambio_id: string;
    texto_comentario: string;
    duracion_video_segundos: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud invalido" },
      { status: 400 }
    );
  }

  if (!body.intercambio_id || !body.texto_comentario) {
    return NextResponse.json(
      { error: "intercambio_id y texto_comentario son obligatorios." },
      { status: 400 }
    );
  }

  if (body.texto_comentario.length < 20) {
    return NextResponse.json(
      { error: "El comentario debe tener al menos 20 caracteres." },
      { status: 400 }
    );
  }

  // Verify the intercambio belongs to this user and is in correct state
  const { data: intercambio } = await supabase
    .from("intercambios")
    .select("id, comentarista_id, estado, texto_comentario")
    .eq("id", body.intercambio_id)
    .single();

  if (!intercambio) {
    return NextResponse.json(
      { error: "Intercambio no encontrado." },
      { status: 404 }
    );
  }

  if (intercambio.comentarista_id !== usuario.id) {
    return NextResponse.json(
      { error: "Este intercambio no te pertenece." },
      { status: 403 }
    );
  }

  if (intercambio.estado !== "pendiente") {
    return NextResponse.json(
      { error: "Este intercambio ya fue procesado." },
      { status: 409 }
    );
  }

  // Check if text was already saved (Copiar already pressed)
  if (intercambio.texto_comentario && intercambio.texto_comentario.length > 0) {
    return NextResponse.json(
      { error: "El texto del comentario ya fue guardado." },
      { status: 409 }
    );
  }

  // Update intercambio with comment text, timestamp and video duration
  const { error: updateError } = await supabase
    .from("intercambios")
    .update({
      texto_comentario: body.texto_comentario,
      timestamp_copia: new Date().toISOString(),
      duracion_video_segundos: body.duracion_video_segundos || null,
    })
    .eq("id", body.intercambio_id);

  if (updateError) {
    console.error("Error updating intercambio:", updateError);
    return NextResponse.json(
      { error: "Error al guardar el comentario." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    timestamp_copia: new Date().toISOString(),
  });
}
