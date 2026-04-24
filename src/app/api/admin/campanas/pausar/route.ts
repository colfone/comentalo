import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/supabase/admin-guard";

// POST /api/admin/campanas/pausar
// Body: { campana_id }
// Versión admin del endpoint de usuario: requireAdminForApi + sin check
// de ownership. El admin puede actuar sobre cualquier campaña.
// Transición abierta/activa → pausada.

export async function POST(request: Request) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;

  const { serviceClient } = auth.ctx;

  let body: { campana_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo inválido" },
      { status: 400 }
    );
  }

  if (!body.campana_id) {
    return NextResponse.json(
      { ok: false, error: "Falta campana_id" },
      { status: 400 }
    );
  }

  const { data: campana } = await serviceClient
    .from("campanas")
    .select("id, estado")
    .eq("id", body.campana_id)
    .maybeSingle();

  if (!campana) {
    return NextResponse.json(
      { ok: false, error: "Campaña no encontrada" },
      { status: 404 }
    );
  }

  if (campana.estado !== "abierta" && campana.estado !== "activa") {
    return NextResponse.json({
      ok: false,
      error: `Solo se pueden pausar campañas activas. Estado actual: ${campana.estado}.`,
    });
  }

  const { error: updateError } = await serviceClient
    .from("campanas")
    .update({ estado: "pausada" })
    .eq("id", campana.id);

  if (updateError) {
    console.error("Error pausando campaña (admin):", updateError);
    return NextResponse.json(
      { ok: false, error: "No se pudo pausar la campaña." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
