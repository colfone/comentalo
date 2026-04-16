import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre, canal_url, canal_youtube_id, avatar_url, suscriptores_al_registro")
    .eq("auth_id", user.id)
    .single();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-4">
            {usuario?.avatar_url && (
              <img
                src={usuario.avatar_url}
                alt="Avatar"
                className="h-14 w-14 rounded-full"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">
                {usuario?.nombre || user.email}
              </h2>
              <p className="text-sm text-gray-400">
                {usuario?.suscriptores_al_registro} suscriptores al registrarse
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-sm text-green-300">
              Canal vinculado correctamente. Tu cuenta de Comentalo esta activa.
            </p>
            {usuario?.canal_url && (
              <a
                href={usuario.canal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-[#E87722] underline"
              >
                Ver canal en YouTube
              </a>
            )}
          </div>

          <p className="mt-6 text-sm text-gray-500">
            El dashboard completo se construira en sesiones futuras.
          </p>
        </div>
      </div>
    </main>
  );
}
