import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/supabase/admin-guard";

// POST /api/admin/usuarios/eliminar-cuenta
// Body: { usuario_id }
// Hard delete irreversible. Orden: auth.users primero, usuarios después.
// Reverse order → si el paso 1 falla, no quedamos con estado parcial y el admin
// puede reintentar. Un "not found" en auth.users es benigno (recovery de un
// intento anterior partialmente fallido).
//
// ADVERTENCIA: este endpoint elimina al usuario y cascade borra sus videos,
// campañas, intercambios y reservas. También borra la fila en auth.users.
// No reversible.

export async function POST(request: Request) {
  const auth = await requireAdminForApi();
  if (!auth.ok) return auth.response;

  const { serviceClient, authEmail } = auth.ctx;

  let body: { usuario_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const usuario_id = body.usuario_id;
  if (typeof usuario_id !== "string" || usuario_id.length === 0) {
    return NextResponse.json(
      { error: "usuario_id es obligatorio." },
      { status: 400 }
    );
  }

  // Fetch auth_id + email del target
  const { data: target, error: fetchError } = await serviceClient
    .from("usuarios")
    .select("auth_id, email")
    .eq("id", usuario_id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { error: "Error al leer usuario: " + fetchError.message },
      { status: 500 }
    );
  }
  if (!target) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 }
    );
  }

  // Bloquear auto-eliminación
  if (
    authEmail &&
    typeof target.email === "string" &&
    target.email.toLowerCase() === authEmail.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta." },
      { status: 400 }
    );
  }

  // Paso 1: DELETE auth.users (si auth_id existe)
  if (target.auth_id) {
    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(
      target.auth_id as string
    );
    if (authDeleteError) {
      const msg = (authDeleteError.message ?? "").toLowerCase();
      // "not found" es benigno: auth.users ya estaba huérfano de un intento
      // anterior. Seguimos con el DELETE de la DB.
      const benign = msg.includes("not found") || msg.includes("no user");
      if (!benign) {
        return NextResponse.json(
          {
            error:
              "Error al eliminar auth.users: " + authDeleteError.message,
          },
          { status: 500 }
        );
      }
    }
  }

  // Paso 2: DELETE FROM usuarios (cascade borra videos/campañas/intercambios/...)
  const { error: dbDeleteError } = await serviceClient
    .from("usuarios")
    .delete()
    .eq("id", usuario_id);

  if (dbDeleteError) {
    return NextResponse.json(
      { error: "Error al eliminar usuario: " + dbDeleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
