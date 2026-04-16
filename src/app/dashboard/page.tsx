import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// --- Reputation helpers ---

function getReputationLevel(porcentaje: number, activo: boolean) {
  if (!activo) return { nivel: "sin_activar", color: "gray", label: "Sin activar" };
  if (porcentaje >= 80) return { nivel: "verde", color: "green", label: "Verde" };
  if (porcentaje >= 60) return { nivel: "amarillo", color: "yellow", label: "Amarillo" };
  if (porcentaje >= 40) return { nivel: "naranja", color: "orange", label: "Naranja" };
  return { nivel: "rojo", color: "red", label: "Rojo" };
}

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
      "id, nombre, canal_url, canal_youtube_id, avatar_url, suscriptores_al_registro, reputacion"
    )
    .eq("auth_id", user.id)
    .single();

  if (!usuario) {
    redirect("/login");
  }

  // Fetch videos with their campaigns
  const { data: videos } = await supabase
    .from("videos")
    .select("id, youtube_video_id, titulo, vistas, estado, created_at")
    .eq("usuario_id", usuario.id)
    .order("created_at", { ascending: false });

  // For each video, fetch its campaigns
  const videosWithCampanas = await Promise.all(
    (videos || []).map(async (video) => {
      const { data: campanas } = await supabase
        .from("campanas")
        .select("id, estado, intercambios_completados, created_at")
        .eq("video_id", video.id)
        .order("created_at", { ascending: false });

      return { ...video, campanas: campanas || [] };
    })
  );

  // Get reputation info
  const { data: reputacionData } = await supabase.rpc("calcular_reputacion", {
    p_comentarista_id: usuario.id,
  });

  const reputacion = reputacionData || {
    total_calificados: 0,
    porcentaje: 100,
    nivel: "verde",
    activo: false,
  };

  const repLevel = getReputationLevel(reputacion.porcentaje, reputacion.activo);

  const videosActivos =
    videosWithCampanas.filter((v) => v.estado === "activo") || [];
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

        {/* User info + reputation */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <div className="flex items-center gap-4">
            {usuario.avatar_url && (
              <img
                src={usuario.avatar_url}
                alt="Avatar"
                className="h-14 w-14 rounded-full"
              />
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">
                {usuario.nombre || user.email}
              </h2>
              <p className="text-sm text-gray-400">
                {usuario.suscriptores_al_registro} suscriptores al registrarse
              </p>
              {usuario.canal_url && (
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

          {/* Reputation badge */}
          <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
            <div>
              <p className="text-xs text-gray-500">Reputacion</p>
              <p className="text-sm font-medium text-white">
                {reputacion.porcentaje.toFixed(0)}% positiva
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  repLevel.nivel === "verde"
                    ? "bg-green-400"
                    : repLevel.nivel === "amarillo"
                    ? "bg-yellow-400"
                    : repLevel.nivel === "naranja"
                    ? "bg-orange-400"
                    : repLevel.nivel === "rojo"
                    ? "bg-red-400"
                    : "bg-gray-500"
                }`}
              />
              <span className="text-xs text-gray-400">
                {repLevel.label}
              </span>
              {!reputacion.activo && (
                <span className="text-[10px] text-gray-600">
                  ({reputacion.total_calificados}/20)
                </span>
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

        {/* Videos + Campaigns section */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">
              Mis videos ({videosActivos.length}/2 activos)
            </h3>
          </div>

          {videosWithCampanas.length > 0 ? (
            <ul className="space-y-4">
              {videosWithCampanas.map((video) => (
                <li
                  key={video.id}
                  className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                >
                  {/* Video header */}
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtube_video_id}/default.jpg`}
                      alt={video.titulo}
                      className="h-12 w-20 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">
                        {video.titulo}
                      </p>
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
                  </div>

                  {/* Campaigns */}
                  {video.campanas.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {video.campanas.map((campana, idx) => {
                        const esperaCalificacion =
                          campana.estado === "completada";
                        const calificada = campana.estado === "calificada";

                        return (
                          <div
                            key={campana.id}
                            className={`flex items-center justify-between rounded-md px-3 py-2 ${
                              esperaCalificacion
                                ? "border border-[#E87722]/30 bg-[#E87722]/5"
                                : "bg-gray-900/50"
                            }`}
                          >
                            <div>
                              <p className="text-xs text-gray-400">
                                Campana {video.campanas.length - idx}
                              </p>
                              <p className="text-sm text-white">
                                {campana.intercambios_completados}/10
                                intercambios
                              </p>
                            </div>

                            {esperaCalificacion ? (
                              <a
                                href={`/dashboard/calificar/${campana.id}`}
                                className="rounded-lg bg-[#E87722] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#d06a1a]"
                              >
                                Calificar
                              </a>
                            ) : calificada ? (
                              <span className="text-xs text-green-400">
                                Calificada
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {campana.estado === "abierta"
                                  ? "En curso"
                                  : campana.estado}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {video.campanas.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Sin campana activa — necesita 10 vistas para activarse.
                    </p>
                  )}
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
