"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Usuarios con estado='eliminado' (soft-delete) aterrizan acá desde el layout.
// signOut silencioso + redirect a /login — no hay UI útil que mostrar porque
// el estado es terminal. El hard delete vive en /api/admin/usuarios/eliminar-cuenta
// (v4.25) y borra el auth.users primero; este caso cubre el soft-delete donde
// la fila usuarios.estado='eliminado' pero el auth.users sigue vivo.

export default function EstadoEliminadoSignOut() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      if (!cancelled) router.replace("/login");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6f7]">
      <div className="text-sm text-[#5b5e60]">Cerrando sesión…</div>
    </div>
  );
}
