import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/supabase/admin-guard";
import { invalidateConfigCache } from "@/lib/config/get-config";

// GET  /api/admin/configuracion           — lista parámetros ordenados por clave
// PUT  /api/admin/configuracion  { clave, valor }  — actualiza un parámetro
//
// Validación server-side: el valor recibido debe ser parseable según el `tipo`
// declarado en la fila existente. Si no matchea, 400 con el error.

type ConfigRow = {
  clave: string;
  valor: string;
  tipo: "integer" | "text" | "boolean" | "numeric";
  descripcion: string;
  updated_at: string;
  updated_by: string | null;
};

function validarValor(
  valor: string,
  tipo: ConfigRow["tipo"]
): { ok: true } | { ok: false; error: string } {
  if (tipo === "integer") {
    if (!/^-?\d+$/.test(valor)) {
      return { ok: false, error: "El valor debe ser un entero (ej: 10, -3)." };
    }
    return { ok: true };
  }
  if (tipo === "numeric") {
    if (!/^-?\d+(\.\d+)?$/.test(valor)) {
      return {
        ok: false,
        error: "El valor debe ser numérico (ej: 10 o 10.5).",
      };
    }
    return { ok: true };
  }
  if (tipo === "boolean") {
    if (valor !== "true" && valor !== "false") {
      return { ok: false, error: "El valor debe ser 'true' o 'false'." };
    }
    return { ok: true };
  }
  // text
  if (valor.length === 0) {
    return { ok: false, error: "El valor no puede estar vacío." };
  }
  return { ok: true };
}

export async function GET() {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.ctx.serviceClient
    .from("configuracion")
    .select("clave, valor, tipo, descripcion, updated_at, updated_by")
    .order("clave", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Error al cargar configuración: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ parametros: data ?? [] });
}

export async function PUT(request: Request) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;

  let body: { clave?: unknown; valor?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { clave, valor } = body;

  if (typeof clave !== "string" || clave.length === 0) {
    return NextResponse.json(
      { error: "Campo 'clave' es obligatorio y debe ser string." },
      { status: 400 }
    );
  }
  if (typeof valor !== "string") {
    return NextResponse.json(
      { error: "Campo 'valor' es obligatorio y debe ser string." },
      { status: 400 }
    );
  }

  const { data: existente, error: readError } = await auth.ctx.serviceClient
    .from("configuracion")
    .select("tipo")
    .eq("clave", clave)
    .maybeSingle();

  if (readError) {
    return NextResponse.json(
      { error: "Error al leer parámetro: " + readError.message },
      { status: 500 }
    );
  }
  if (!existente) {
    return NextResponse.json(
      { error: `Parámetro '${clave}' no existe.` },
      { status: 404 }
    );
  }

  const validacion = validarValor(valor, existente.tipo as ConfigRow["tipo"]);
  if (!validacion.ok) {
    return NextResponse.json({ error: validacion.error }, { status: 400 });
  }

  const { data: actualizado, error: updateError } = await auth.ctx.serviceClient
    .from("configuracion")
    .update({
      valor,
      updated_at: new Date().toISOString(),
    })
    .eq("clave", clave)
    .select("clave, valor, tipo, descripcion, updated_at, updated_by")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Error al actualizar: " + updateError.message },
      { status: 500 }
    );
  }

  // Tirar el cache in-memory — próximas lecturas ven el nuevo valor.
  invalidateConfigCache();

  return NextResponse.json({ parametro: actualizado });
}
