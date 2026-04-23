import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/supabase/admin-guard";

// GET /api/admin/usuarios/historial-creditos?usuario_id=UUID
// Retorna los últimos 50 movimientos de créditos del usuario ordenados
// por created_at DESC. Solo admins.

export async function GET(request: Request) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;

  const { serviceClient } = auth.ctx;

  const url = new URL(request.url);
  const usuario_id = url.searchParams.get("usuario_id");

  if (!usuario_id || usuario_id.length === 0) {
    return NextResponse.json(
      { ok: false, error: "usuario_id es obligatorio." },
      { status: 400 }
    );
  }

  const { data, error } = await serviceClient
    .from("movimientos_creditos")
    .select(
      "id, monto, saldo_anterior, saldo_nuevo, origen, motivo, created_at"
    )
    .eq("usuario_id", usuario_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error leyendo movimientos_creditos:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al leer historial." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, movimientos: data ?? [] });
}
