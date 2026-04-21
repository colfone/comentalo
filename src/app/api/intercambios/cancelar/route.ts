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

  let body: { intercambio_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  if (!body.intercambio_id) {
    return NextResponse.json(
      { error: "intercambio_id es obligatorio." },
      { status: 400 }
    );
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: intercambio } = await serviceClient
    .from("intercambios")
    .select("id, comentarista_id, estado")
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
      { error: "Solo se pueden cancelar intercambios pendientes." },
      { status: 400 }
    );
  }

  // Delete the intercambio — this frees the slot in the campaign
  // so the next commentator can take it via asignar_intercambio
  await serviceClient
    .from("intercambios")
    .delete()
    .eq("id", intercambio.id);

  return NextResponse.json({ ok: true });
}

// DELETE /api/intercambios/cancelar
// Body: { campana_id: string }
// Cancela la RESERVA del usuario para esa campaña (modelo nuevo: el
// intercambio no existe hasta verificar, así que lo que hay en disco
// para cancelar es la reserva temporal de `reservas_intercambio`).
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

  let body: { campana_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  if (!body.campana_id) {
    return NextResponse.json(
      { error: "campana_id es obligatorio." },
      { status: 400 }
    );
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Borra la reserva del usuario para esa campaña. Si no existe, es no-op
  // pero devolvemos ok: true — el efecto deseado (sin reserva viva) se logra.
  await serviceClient
    .from("reservas_intercambio")
    .delete()
    .eq("campana_id", body.campana_id)
    .eq("comentarista_id", usuario.id);

  return NextResponse.json({ ok: true });
}
