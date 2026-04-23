import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/supabase/admin-guard";

// POST /api/admin/usuarios/moderar
// Body: { usuario_id, accion, motivo?, hasta? }
// Acciones:
//   suspender → estado='suspendido', estado_motivo=motivo|null, estado_hasta=hasta|null
//   reactivar → estado='activo',     estado_motivo=null,        estado_hasta=null
//   banear    → estado='baneado',    estado_motivo=motivo,      estado_hasta=null   (motivo obligatorio)
//   eliminar  → estado='eliminado',  estado_motivo=motivo,      estado_hasta=null   (motivo obligatorio)
//
// Reglas:
// - Motivo obligatorio para banear y eliminar (non-empty).
// - Motivo opcional para suspender.
// - hasta solo relevante para suspender; si se pasa debe ser ISO válido.
// - Un admin no puede moderarse a sí mismo.

type Accion = "suspender" | "reactivar" | "banear" | "eliminar";

const ACCIONES_VALIDAS: readonly Accion[] = [
  "suspender",
  "reactivar",
  "banear",
  "eliminar",
];
const MOTIVO_MAX = 500;

export async function POST(request: Request) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;

  const { serviceClient, authEmail } = auth.ctx;

  let body: {
    usuario_id?: unknown;
    accion?: unknown;
    motivo?: unknown;
    hasta?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const usuario_id = body.usuario_id;
  const accion = body.accion;
  const motivo = body.motivo;
  const hasta = body.hasta;

  if (typeof usuario_id !== "string" || usuario_id.length === 0) {
    return NextResponse.json(
      { error: "usuario_id es obligatorio." },
      { status: 400 }
    );
  }
  if (typeof accion !== "string" || !ACCIONES_VALIDAS.includes(accion as Accion)) {
    return NextResponse.json(
      { error: "accion inválida." },
      { status: 400 }
    );
  }
  const accionTyped = accion as Accion;

  // Motivo: obligatorio para banear/eliminar; opcional para suspender; ignorado para reactivar
  if (accionTyped === "banear" || accionTyped === "eliminar") {
    if (typeof motivo !== "string" || motivo.trim().length === 0) {
      return NextResponse.json(
        { error: `El motivo es obligatorio para ${accionTyped}.` },
        { status: 400 }
      );
    }
    if (motivo.length > MOTIVO_MAX) {
      return NextResponse.json(
        { error: `El motivo excede ${MOTIVO_MAX} caracteres.` },
        { status: 400 }
      );
    }
  } else if (accionTyped === "suspender") {
    if (motivo !== undefined && motivo !== null) {
      if (typeof motivo !== "string") {
        return NextResponse.json(
          { error: "motivo debe ser string." },
          { status: 400 }
        );
      }
      if (motivo.length > MOTIVO_MAX) {
        return NextResponse.json(
          { error: `El motivo excede ${MOTIVO_MAX} caracteres.` },
          { status: 400 }
        );
      }
    }
  }

  // hasta: solo relevante para suspender. Si viene, debe ser timestamp válido.
  let hastaISO: string | null = null;
  if (
    accionTyped === "suspender" &&
    hasta !== undefined &&
    hasta !== null &&
    hasta !== ""
  ) {
    if (typeof hasta !== "string") {
      return NextResponse.json(
        { error: "hasta debe ser string." },
        { status: 400 }
      );
    }
    const parsed = new Date(hasta);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "hasta no es una fecha válida." },
        { status: 400 }
      );
    }
    hastaISO = parsed.toISOString();
  }

  // Bloquear auto-moderación: resolver usuarios.id del admin por su email.
  if (authEmail) {
    const { data: adminRow } = await serviceClient
      .from("usuarios")
      .select("id")
      .eq("email", authEmail)
      .maybeSingle();

    if (adminRow?.id === usuario_id) {
      return NextResponse.json(
        { error: "No puedes moderarte a ti mismo." },
        { status: 400 }
      );
    }
  }

  // Construir patch según acción
  const motivoLimpio =
    typeof motivo === "string" && motivo.trim().length > 0
      ? motivo.trim()
      : null;

  let patch: {
    estado: string;
    estado_motivo: string | null;
    estado_hasta: string | null;
  };
  switch (accionTyped) {
    case "suspender":
      patch = {
        estado: "suspendido",
        estado_motivo: motivoLimpio,
        estado_hasta: hastaISO,
      };
      break;
    case "reactivar":
      patch = {
        estado: "activo",
        estado_motivo: null,
        estado_hasta: null,
      };
      break;
    case "banear":
      patch = {
        estado: "baneado",
        estado_motivo: motivoLimpio,
        estado_hasta: null,
      };
      break;
    case "eliminar":
      patch = {
        estado: "eliminado",
        estado_motivo: motivoLimpio,
        estado_hasta: null,
      };
      break;
  }

  const { data: actualizado, error: updateError } = await serviceClient
    .from("usuarios")
    .update(patch)
    .eq("id", usuario_id)
    .select("id, estado, estado_motivo, estado_hasta")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Error al actualizar: " + updateError.message },
      { status: 500 }
    );
  }
  if (!actualizado) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, usuario: actualizado });
}
