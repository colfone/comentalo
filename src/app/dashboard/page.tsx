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
    .select(
      "id, nombre, canal_url, canal_youtube_id, avatar_url, suscriptores_al_registro"
    )
    .eq("auth_id", user.id)
    .single();

  // Fetch user's videos
  const { data: videos } = usuario
    ? await supabase
        .from("videos")
        .select("id, youtube_video_id, titulo, vistas, estado, created_at")
        .eq("usuario_id", usuario.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const videosActivos = videos?.filter((v) => v.estado === "activo") || [];
  const puedeRegistrar = videosActivos.length < 2;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
        </div>

        {/* User info */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <div className="flex items-center gap-4">
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
              {usuario?.canal_url && (
                <a
                  href={usuario.canal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#E87722] hover:underline"
                >
                  Ver canal
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Intercambiar CTA */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <h3 className="mb-2 text-base font-semibold text-white">
            Participar en un intercambio
          </h3>
          <p className="mb-4 text-sm text-gray-400">
            Comenta el video de otro creador para activar tu derecho a recibir
            un intercambio en tu propio video.
          </p>
          <a
            href="/dashboard/intercambiar"
            className="block w-full rounded-lg bg-[#E87722] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#d06a1a]"
          >
            Intercambiar
          </a>
        </div>

        {/* Videos section */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">
              Mis videos ({videosActivos.length}/2 activos)
            </h3>
          </div>

          {videos && videos.length > 0 ? (
            <ul className="space-y-3">
              {videos.map((video) => (
                <li
                  key={video.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-3"
                >
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_video_id}/default.jpg`}
                    alt={video.titulo}
                    className="h-12 w-20 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{video.titulo}</p>
                    <p className="text-xs text-gray-500">
                      {video.vistas} vistas
                      <span
                        className={`ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          video.estado === "activo"
                            ? "bg-green-500/10 text-green-400"
                            : video.estado === "suspendido"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {video.estado}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              No tienes videos registrados todavia.
            </p>
          )}

          {/* Register video button */}
          {puedeRegistrar ? (
            <a
              href="/dashboard/registrar-video"
              className="mt-4 block w-full rounded-lg bg-[#6B3FA0] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#5a3588]"
            >
              Registrar un video
            </a>
          ) : (
            <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-3">
              <p className="text-center text-sm text-gray-400">
                Ya tienes 2 videos activos. Completa las campanas actuales para
                registrar otro.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
