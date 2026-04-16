"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// --- Types ---

interface Campana {
  id: string;
  estado: string;
  intercambios_completados: number;
  created_at: string;
}

interface Video {
  id: string;
  youtube_video_id: string;
  titulo: string;
  vistas: number;
  estado: string;
  suspensiones_count: number;
  created_at: string;
  campanas: Campana[];
  puede_eliminar: boolean;
}

interface Usuario {
  id: string;
  nombre: string | null;
  canal_url: string | null;
  canal_youtube_id: string;
  avatar_url: string | null;
  suscriptores_al_registro: number;
  reputacion: number;
}

interface Reputacion {
  total_calificados: number;
  porcentaje: number;
  nivel: string;
  activo: boolean;
}

interface Props {
  user: { email: string };
  usuario: Usuario;
  videosWithCampanas: Video[];
  reputacion: Reputacion;
}

function getReputationLevel(porcentaje: number, activo: boolean) {
  if (!activo)
    return { nivel: "sin_activar", label: "Sin activar" };
  if (porcentaje >= 80) return { nivel: "verde", label: "Verde" };
  if (porcentaje >= 60) return { nivel: "amarillo", label: "Amarillo" };
  if (porcentaje >= 40) return { nivel: "naranja", label: "Naranja" };
  return { nivel: "rojo", label: "Rojo" };
}

export default function DashboardClient({
  user,
  usuario,
  videosWithCampanas: initialVideos,
  reputacion,
}: Props) {
  const router = useRouter();
  const [videos, setVideos] = useState(initialVideos);
  const [reactivando, setReactivando] = useState<string | null>(null);
  const [reactivarError, setReactivarError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const repLevel = getReputationLevel(reputacion.porcentaje, reputacion.activo);
  const videosActivos = videos.filter((v) => v.estado === "activo");
  const puedeRegistrar = videosActivos.length < 2;

  // --- Supabase Realtime: listen for campaign and video changes ---
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Subscribe to campaign changes (new intercambios verified, campaign completed)
    const campanaChannel = supabase
      .channel("dashboard-campanas")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campanas",
        },
        () => {
          // Refresh on any campaign change
          router.refresh();
        }
      )
      .subscribe();

    // Subscribe to video state changes (suspension/reactivation)
    const videoChannel = supabase
      .channel("dashboard-videos")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "videos",
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(campanaChannel);
      supabase.removeChannel(videoChannel);
    };
  }, [router]);

  // --- Reactivate video ---
  async function handleReactivar(videoId: string) {
    setReactivando(videoId);
    setReactivarError(null);

    try {
      const res = await fetch("/api/videos/reactivar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId }),
      });

      const data = await res.json();

      if (!data.ok) {
        setReactivarError(data.error);
        return;
      }

      // Update local state immediately
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId ? { ...v, estado: "activo" } : v
        )
      );
    } catch {
      setReactivarError("Error de conexion. Intenta de nuevo.");
    } finally {
      setReactivando(null);
    }
  }

  // --- Delete video ---
  async function handleEliminar(videoId: string) {
    if (!confirm("¿Estas seguro? Esta accion no se puede deshacer.")) return;

    setEliminando(videoId);

    try {
      const res = await fetch("/api/videos/eliminar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data.error || "Error al eliminar el video.");
        return;
      }

      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch {
      alert("Error de conexion. Intenta de nuevo.");
    } finally {
      setEliminando(null);
    }
  }

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
            {reputacion.activo ? (
              <>
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
                        : "bg-red-400"
                    }`}
                  />
                  <span className="text-xs text-gray-400">
                    {repLevel.label}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-gray-500">Reputacion</p>
                  <p className="text-sm font-medium text-gray-400">
                    Sin activar
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {reputacion.total_calificados}/20 intercambios calificados
                </span>
              </>
            )}
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

        {/* Videos + Campaigns */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">
              Mis videos ({videosActivos.length}/2 activos)
            </h3>
          </div>

          {videos.length > 0 ? (
            <ul className="space-y-4">
              {videos.map((video) => (
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
                    {video.puede_eliminar && (
                      <button
                        onClick={() => handleEliminar(video.id)}
                        disabled={eliminando === video.id}
                        title="Eliminar video"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Suspension banner (seccion 6D.4) */}
                  {video.estado === "suspendido" && (
                    <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <p className="mb-2 text-xs text-red-300">
                        Detectamos que 3 intercambios de tu video no se estan
                        verificando automaticamente. Esto suele ocurrir cuando
                        el video tiene moderacion estricta o revision manual
                        activada en YouTube Studio. Revisa tu configuracion de
                        comentarios y reactiva tu video.
                      </p>

                      {(video.suspensiones_count || 0) >= 2 ? (
                        <p className="text-xs font-medium text-red-400">
                          Este video fue suspendido por segunda vez. Requiere
                          revision manual del equipo. Contacta a soporte.
                        </p>
                      ) : (
                        <button
                          onClick={() => handleReactivar(video.id)}
                          disabled={reactivando === video.id}
                          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                        >
                          {reactivando === video.id
                            ? "Reactivando..."
                            : "Reactivar video"}
                        </button>
                      )}

                      {reactivarError && reactivando === null && (
                        <p className="mt-2 text-xs text-red-400">
                          {reactivarError}
                        </p>
                      )}
                    </div>
                  )}

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
