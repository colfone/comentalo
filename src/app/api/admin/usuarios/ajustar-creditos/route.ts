import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/supabase/admin-guard";

// POST /api/admin/usuarios/ajustar-creditos
// Body: { usuario_id, monto, motivo? }
// Llama RPC ajustar_creditos_admin que hace UPDATE + INSERT audit trail
// en la misma transacción con row lock.

const MOTIVO_MAX = 500;

type RpcErrorCode = "monto_invalido" | "no_encontrado" | "saldo_insuficiente";

type RpcResponse = {
  ok: boolean;
  error?: RpcErrorCode;
  mensaje?: string;
  saldo_anterior?: number;
  saldo_nuevo?: number;
};

export async function POST(request: Request) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;

  const { serviceClient, authEmail } = auth.ctx;

  let body: { usuario_id?: unknown; monto?: unknown; motivo?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body inválido" },
      { status: 400 }
    );
  }

  const usuario_id = body.usuario_id;
  const monto = body.monto;
  const motivo = body.motivo;

  if (typeof usuario_id !== "string" || usuario_id.length === 0) {
    return NextResponse.json(
      { ok: false, error: "usuario_id es obligatorio." },
      { status: 400 }
    );
  }
  if (typeof monto !== "number" || !Number.isInteger(monto)) {
    return NextResponse.json(
      { ok: false, error: "monto debe ser un número entero." },
      { status: 400 }
    );
  }
  if (monto === 0) {
    return NextResponse.json(
      { ok: false, error: "monto debe ser distinto de 0." },
      { status: 400 }
    );
  }

  let motivoLimpio: string | null = null;
  if (motivo !== undefined && motivo !== null) {
    if (typeof motivo !== "string") {
      return NextResponse.json(
        { ok: false, error: "motivo debe ser string." },
        { status: 400 }
      );
    }
    if (motivo.length > MOTIVO_MAX) {
      return NextResponse.json(
        { ok: false, error: `motivo excede ${MOTIVO_MAX} caracteres.` },
        { status: 400 }
      );
    }
    const trimmed = motivo.trim();
    motivoLimpio = trimmed.length > 0 ? trimmed : null;
  }

  // Resolver usuarios.id del admin (opcional — si no tiene fila, audit queda
  // sin admin_id). Útil para admins que nunca se registraron como creadores.
  let adminId: string | null = null;
  if (authEmail) {
    const { data: adminRow } = await serviceClient
      .from("usuarios")
      .select("id")
      .eq("email", authEmail)
      .maybeSingle();

    if (adminRow?.id) {
      adminId = adminRow.id;
      // Bloqueo auto-ajuste solo aplica si el admin tiene fila. Sin fila no
      // hay forma de que usuario_id matchee al admin.
      if (adminId === usuario_id) {
        return NextResponse.json(
          { ok: false, error: "No puedes ajustar tus propios créditos." },
          { status: 400 }
        );
      }
    }
  }

  // RPC atómica
  const { data: rpcResult, error: rpcError } = await serviceClient.rpc(
    "ajustar_creditos_admin",
    {
      p_usuario_id: usuario_id,
      p_monto: monto,
      p_admin_id: adminId,
      p_motivo: motivoLimpio,
    }
  );

  if (rpcError) {
    console.error("Error llamando ajustar_creditos_admin:", rpcError);
    return NextResponse.json(
      { ok: false, error: "Error interno al ajustar créditos." },
      { status: 500 }
    );
  }

  const result = rpcResult as RpcResponse;

  if (!result.ok) {
    const status =
      result.error === "no_encontrado"
        ? 404
        : 400; // saldo_insuficiente / monto_invalido
    return NextResponse.json(
      { ok: false, error: result.mensaje ?? "Error al ajustar créditos." },
      { status }
    );
  }

  return NextResponse.json({
    ok: true,
    saldo_anterior: result.saldo_anterior,
    saldo_nuevo: result.saldo_nuevo,
  });
}
