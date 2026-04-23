import { NextResponse } from "next/server";
import { getConfigInt } from "@/lib/config/get-config";

// GET /api/config/costo-campana
// Endpoint público (sin auth): retorna el costo en créditos de crear una
// campaña según configuracion. Usado por la UI de registrar video para
// informar al usuario antes de confirmar.

export async function GET() {
  const costo = await getConfigInt("costo_campana_creditos", 30);
  return NextResponse.json({ costo });
}
