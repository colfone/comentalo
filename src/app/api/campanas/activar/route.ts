import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/campanas/activar
// Body: { campana_id }
// Pausada → activa. Sección 5D de PROYECTO.md.

type CampanaOwnership = {
  id: string;
  estado: string;
  videos: { usuario_id: string } | null;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  let body: { campana_id?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: "Cuerpo inválido" }, { status: 400 }); }

  if (!body.campana_id) {
    return NextResponse.json({ ok: false, error: "Falta campana_id" }, { status: 400 });
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (!usuario) return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: campana } = await service
    .from("campanas")
    .select("id, estado, videos!inner(usuario_id)")
    .eq("id", body.campana_id)
    .maybeSingle<CampanaOwnership>();

  if (!campana) return NextResponse.json({ ok: false, error: "Campaña no encontrada" }, { status: 404 });
  if (campana.videos?.usuario_id !== usuario.id) {
    return NextResponse.json({ ok: false, error: "No tienes acceso a esta campaña" }, { status: 403 });
  }

  if (campana.estado !== "pausada") {
    return NextResponse.json({
      ok: false,
      error: `Solo se pueden activar campañas pausadas. Estado actual: ${campana.estado}.`,
    });
  }

  const { error: updateError } = await service
    .from("campanas")
    .update({ estado: "activa" })
    .eq("id", campana.id);

  if (updateError) {
    console.error("Error activando campaña:", updateError);
    return NextResponse.json({ ok: false, error: "No se pudo activar la campaña." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
