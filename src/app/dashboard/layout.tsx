import { createSupabaseServerClient } from "@/lib/supabase/server";
import VerificacionCanalModal from "./verificacion-canal-modal";

// Gate de verificación de canal. Envuelve todas las rutas /dashboard/*.
// Si el usuario existe pero no ha verificado su canal, rendereamos el modal
// sobre los children — el usuario ve el dashboard bloqueado por el overlay.
//
// Notas:
// 1. Si la columna `usuarios.canal_verificado` todavía no existe (migración
//    20260419180000 no aplicada), la query retorna error y tratamos al usuario
//    como verificado — fail-open para no romper el dashboard antes de la DDL.
// 2. Usamos getSession() en vez de getUser() a propósito. getUser() valida el
//    JWT contra Supabase y puede intentar refrescar el token, lo que llama a
//    cookies().set() — prohibido en layouts/pages de Next 16 (solo Server
//    Actions y Route Handlers pueden escribir cookies). getSession() lee del
//    cookie sin refresh. La seguridad real sigue enforceada por RLS en cada
//    query, no por esta lectura de gate.

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let mostrarModal = false;
  let canalInfo: {
    nombre: string | null;
    avatar_url: string | null;
    canal_url: string | null;
    suscriptores: number;
  } | null = null;

  if (user) {
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("canal_verificado, nombre, avatar_url, canal_url, suscriptores_al_registro")
      .eq("auth_id", user.id)
      .maybeSingle();

    // Si hay error (típicamente columna no existente) → fail-open.
    // Si no hay row → el page.tsx se encarga de redirigir a /verificar-canal.
    if (!error && usuario && usuario.canal_verificado === false) {
      mostrarModal = true;
      canalInfo = {
        nombre: usuario.nombre,
        avatar_url: usuario.avatar_url,
        canal_url: usuario.canal_url,
        suscriptores: usuario.suscriptores_al_registro ?? 0,
      };
    }
  }

  return (
    <>
      {children}
      {mostrarModal && canalInfo && <VerificacionCanalModal canal={canalInfo} />}
    </>
  );
}
