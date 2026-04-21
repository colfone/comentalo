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
  promedio_estrellas: number;
  porcentaje: number;
  nivel: string;
  activo: boolean;
}

interface Stats {
  intercambiosDados: number;
  intercambiosRecibidos: number;
  campanasCompletadas: number;
}

interface Props {
  user: { email: string };
  usuario: Usuario;
  videosWithCampanas: Video[];
  reputacion: Reputacion;
  stats: Stats;
}

function getReputationLevel(promedio: number, activo: boolean) {
  if (!activo) return { nivel: "sin_activar", label: "Sin activar" };
  if (promedio >= 4.0) return { nivel: "verde", label: "Verde" };
  if (promedio >= 3.0) return { nivel: "amarillo", label: "Amarillo" };
  if (promedio >= 2.0) return { nivel: "naranja", label: "Naranja" };
  return { nivel: "rojo", label: "Rojo" };
}

function getInitials(name: string | null): string {
  if (!name) return "C";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Duplicado de /dashboard/registrar-video — NFKC + emojis/banderas + sentence case.
function normalizeTitle(titulo: string): string {
  if (!titulo) return '';
  const plano = titulo.normalize('NFKC');
  const sinEmojis = plano
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}\u200D\uFE0F]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!sinEmojis) return '';
  const lower = sinEmojis.toLowerCase();
  const firstLetter = lower.search(/\p{L}/u);
  if (firstLetter < 0) return lower;
  return lower.slice(0, firstLetter) + lower[firstLetter].toUpperCase() + lower.slice(firstLetter + 1);
}

// --- Icons (inline, mismos SVG del resto de /dashboard) ---
const HomeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9.5z" />
  </svg>
);
const SwapIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 4v14m0 0-3-3m3 3 3-3M17 20V6m0 0 3 3m-3-3-3 3" />
  </svg>
);
const InboxIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 13h-6l-2 3h-4l-2-3H2" />
    <path d="M5.5 5h13l3 8v6a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-6z" />
  </svg>
);
const UserNavIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
const BellIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

export default function DashboardClient({
  user,
  usuario,
  videosWithCampanas: initialVideos,
  reputacion,
  stats,
}: Props) {
  const router = useRouter();
  const [videos, setVideos] = useState(initialVideos);
  const [tab, setTab] = useState<"curso" | "completados">("curso");
  const [reactivando, setReactivando] = useState<string | null>(null);
  const [reactivarError, setReactivarError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [lanzando, setLanzando] = useState<string | null>(null);

  const repLevel = getReputationLevel(reputacion.promedio_estrellas, reputacion.activo);
  const promedioEstrellas = Number(reputacion.promedio_estrellas || 0).toFixed(1);
  const videosActivos = videos.filter((v) => v.estado === "activo");
  const puedeRegistrar = videosActivos.length < 2;
  const initials = getInitials(usuario.nombre);

  // Filtered videos by tab
  const videosEnCurso = videos.filter((v) =>
    v.campanas.some((c) => c.estado === "abierta" || c.estado === "pausada" || c.estado === "activa")
  );
  const videosCompletados = videos.filter((v) =>
    v.campanas.some((c) => c.estado === "completada" || c.estado === "calificada")
  );
  const filteredVideos = tab === "curso" ? videosEnCurso : videosCompletados;

  // --- Realtime ---
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const campanaChannel = supabase
      .channel("dashboard-campanas")
      .on("postgres_changes", { event: "*", schema: "public", table: "campanas" }, () => router.refresh())
      .subscribe();

    const videoChannel = supabase
      .channel("dashboard-videos")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "videos" }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(campanaChannel);
      supabase.removeChannel(videoChannel);
    };
  }, [router]);

  // --- Actions ---
  async function handleReactivar(videoId: string) {
    setReactivando(videoId);
    setReactivarError(null);
    try {
      const res = await fetch("/api/videos/reactivar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ video_id: videoId }) });
      const data = await res.json();
      if (!data.ok) { setReactivarError(data.error); return; }
      setVideos((prev) => prev.map((v) => v.id === videoId ? { ...v, estado: "activo" } : v));
    } catch { setReactivarError("Error de conexion."); } finally { setReactivando(null); }
  }

  async function handleEliminar(videoId: string) {
    if (!confirm("¿Estas seguro? Esta accion no se puede deshacer.")) return;
    setEliminando(videoId);
    try {
      const res = await fetch("/api/videos/eliminar", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ video_id: videoId }) });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Error al eliminar."); return; }
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch { alert("Error de conexion."); } finally { setEliminando(null); }
  }

  async function handleLanzarCampana(videoId: string) {
    setLanzando(videoId);
    try {
      const res = await fetch("/api/campanas/lanzar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ video_id: videoId }) });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Error al lanzar."); return; }
      router.refresh();
    } catch { alert("Error de conexion."); } finally { setLanzando(null); }
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      <main className="mx-auto max-w-7xl px-6 pt-8 pb-12">
        {/* ===== PROFILE SECTION ===== */}
        <section className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            {/* Avatar large */}
            <div className="relative">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-3xl text-2xl font-extrabold text-white"
                style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
              >
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-500">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
            </div>

            <div>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-[#2c2f30]">
                {usuario.nombre || user.email}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#595c5d]">
                <span>{usuario.suscriptores_al_registro} suscriptores al registrarse</span>
                <span className="text-[#595c5d]/30">|</span>
                {reputacion.activo ? (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    repLevel.nivel === "verde" ? "bg-green-100 text-green-700"
                    : repLevel.nivel === "amarillo" ? "bg-yellow-100 text-yellow-700"
                    : repLevel.nivel === "naranja" ? "bg-orange-100 text-orange-700"
                    : "bg-red-100 text-red-700"
                  }`}>
                    {promedioEstrellas}<span className="text-[#E87722]">★</span>
                  </span>
                ) : (
                  <span className="text-xs text-[#595c5d]">Sin activar · {reputacion.total_calificados}/20</span>
                )}
              </div>
              {usuario.canal_url && (
                <a href={usuario.canal_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-medium text-[#E87722] hover:underline">
                  Ver canal →
                </a>
              )}
            </div>
          </div>

          <a
            href="/dashboard/intercambiar"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            Comentar
          </a>
        </section>

        {/* ===== BENTO GRID ===== */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* --- Left: Stats --- */}
          <div className="space-y-4 lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#595c5d]">Resumen</h3>

            {/* Stat cards */}
            {[
              { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>, color: "#6200EE", label: "Comentarios dados", value: stats.intercambiosDados },
              { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>, color: "#E87722", label: "Comentarios recibidos", value: stats.intercambiosRecibidos },
              { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>, color: "#6200EE", label: "Campanas completadas", value: stats.campanasCompletadas },
            ].map((s) => (
              <div key={s.label} className="rounded-3xl border border-black/5 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                <p className="text-xs text-[#595c5d]">{s.label}</p>
                <p className="mt-1 font-headline text-2xl font-extrabold text-[#2c2f30]">{s.value}</p>
              </div>
            ))}

            {/* Reputation card */}
            <div className="rounded-3xl border border-black/5 bg-white p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <p className="text-xs text-[#595c5d]">Reputacion</p>
              <p className="mt-1 font-headline text-2xl font-extrabold text-[#2c2f30]">
                {reputacion.activo ? (
                  <>
                    {promedioEstrellas}
                    <span className="text-[#E87722]">★</span>
                  </>
                ) : (
                  "—"
                )}
              </p>
              <p className="mt-0.5 text-xs text-[#595c5d]">
                {reputacion.total_calificados}/20 intercambios calificados
              </p>
            </div>
          </div>

          {/* --- Right: Videos --- */}
          <div className="lg:col-span-9">
            {/* Header + tabs */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#595c5d]">
                Mis campañas
              </h3>
              <div className="flex gap-1 rounded-xl bg-[#eff1f2] p-1">
                <button
                  onClick={() => setTab("curso")}
                  className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${tab === "curso" ? "bg-white text-[#2c2f30] shadow-sm" : "text-[#595c5d]"}`}
                >
                  En curso
                </button>
                <button
                  onClick={() => setTab("completados")}
                  className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${tab === "completados" ? "bg-white text-[#2c2f30] shadow-sm" : "text-[#595c5d]"}`}
                >
                  Completados
                </button>
              </div>
            </div>

            {/* Video grid */}
            {filteredVideos.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredVideos.map((video) => {
                  const activeCampana = video.campanas.find((c) => c.estado === "abierta") || video.campanas[0];
                  const progress = activeCampana ? (activeCampana.intercambios_completados / 10) * 100 : 0;

                  return (
                    <div
                      key={video.id}
                      className="rounded-3xl border border-black/5 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#6200EE]/5"
                    >
                      {/* Video header */}
                      <div className="flex gap-4">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                          alt={video.titulo}
                          className="h-24 w-36 shrink-0 rounded-2xl object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23595c5d'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E"; }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold text-[#2c2f30]">{normalizeTitle(video.titulo)}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-[#595c5d]">{formatViews(video.vistas)} vistas</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              activeCampana?.estado === "pausada" ? "bg-[#E87722]/10 text-[#E87722]"
                              : video.estado === "activo" ? "bg-green-100 text-green-700"
                              : video.estado === "suspendido" ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                            }`}>{activeCampana?.estado === "pausada" ? "Pausada" : video.estado}</span>
                          </div>
                          {video.puede_eliminar && (
                            <button onClick={() => handleEliminar(video.id)} disabled={eliminando === video.id} className="mt-1 text-[10px] text-red-400 hover:underline disabled:opacity-50">
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Suspension banner */}
                      {video.estado === "suspendido" && (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                          <p className="text-xs text-red-600">3 intercambios no se verificaron. Revisa la moderacion en YouTube Studio.</p>
                          {(video.suspensiones_count || 0) >= 2 ? (
                            <p className="mt-1 text-xs font-medium text-red-700">Requiere revision manual. Contacta a soporte.</p>
                          ) : (
                            <button onClick={() => handleReactivar(video.id)} disabled={reactivando === video.id} className="mt-2 rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50">
                              {reactivando === video.id ? "Reactivando..." : "Reactivar video"}
                            </button>
                          )}
                          {reactivarError && <p className="mt-1 text-xs text-red-500">{reactivarError}</p>}
                        </div>
                      )}

                      {/* Campaign progress */}
                      {activeCampana && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-[#595c5d]">Campana</p>
                            <p className="text-xs font-semibold text-[#6200EE]">
                              {activeCampana.intercambios_completados} comentarios
                            </p>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eff1f2]">
                            <div
                              className="h-full rounded-full transition-all duration-600"
                              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #6200EE, #ac8eff)" }}
                            />
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                              activeCampana.estado === "completada" ? "text-[#E87722]"
                              : activeCampana.estado === "pausada" ? "text-[#E87722]"
                              : activeCampana.estado === "calificada" ? "text-green-600"
                              : "text-[#595c5d]"
                            }`}>
                              {activeCampana.estado === "abierta" ? "En curso"
                              : activeCampana.estado === "pausada" ? "Pausada"
                              : activeCampana.estado === "completada" ? "Esperando calificacion"
                              : "Calificada"}
                            </span>
                            <a href={`/dashboard/campana/${activeCampana.id}`} className="rounded-lg bg-[#eff1f2] px-3 py-1.5 text-xs font-medium text-[#6200EE] transition-colors hover:bg-[#e0e3e4]">
                              Ver detalle →
                            </a>
                          </div>
                          {activeCampana.estado === "completada" && (
                            <a href={`/dashboard/calificar/${activeCampana.id}`} className="mt-2 block rounded-xl bg-[#E87722] py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-[#d06a1a]">
                              Calificar intercambios
                            </a>
                          )}
                        </div>
                      )}

                      {/* No campaign — launch option */}
                      {!activeCampana && video.estado === "activo" && (
                        <div className="mt-4">
                          {video.vistas >= 10 ? (
                            <button onClick={() => handleLanzarCampana(video.id)} disabled={lanzando === video.id} className="w-full rounded-xl bg-[#6200EE]/10 py-2.5 text-xs font-semibold text-[#6200EE] transition-colors hover:bg-[#6200EE]/20 disabled:opacity-50">
                              {lanzando === video.id ? "Lanzando..." : "Lanzar campana"}
                            </button>
                          ) : (
                            <p className="text-center text-xs text-[#595c5d]">
                              Necesita {10 - video.vistas} vistas mas ({video.vistas}/10)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-black/5 bg-white p-12 text-center">
                <p className="text-sm text-[#595c5d]">
                  {tab === "curso" ? "No tienes videos en curso." : "No tienes videos completados."}
                </p>
              </div>
            )}

            {/* Register / limit */}
            {puedeRegistrar ? (
              <a href="/dashboard/registrar-video" className="mt-4 block rounded-xl border-2 border-dashed border-[#6200EE]/20 py-4 text-center text-sm font-semibold text-[#6200EE] transition-colors hover:border-[#6200EE]/40 hover:bg-[#6200EE]/5">
                + Crear campaña
              </a>
            ) : (
              <div className="mt-4 rounded-xl bg-[#eff1f2] p-4 text-center">
                <p className="text-xs text-[#595c5d]">Ya tienes 2 videos activos. Completa las campanas actuales para registrar otro.</p>
              </div>
            )}

            {/* Manifesto banner */}
            <div className="mt-6 overflow-hidden rounded-3xl p-6" style={{ background: "linear-gradient(135deg, #6200EE10, #E8772210)" }}>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80">
                  <svg className="h-5 w-5 text-[#6200EE]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#6200EE]">El Manifiesto</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#2c2f30]/70">
                    Creemos que los creadores merecen crecer con apoyo real. No vendemos comentarios. No tenemos bots. No hay atajos. Tu comentas. Ellos comentan. Asi crecemos todos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-black/5 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 md:flex-row">
          <p className="text-xs text-[#595c5d]">&copy; 2026 Comentalo — Hecho para creadores de LatAm</p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-medium uppercase tracking-widest text-[#595c5d] hover:text-[#2c2f30]">Terminos</a>
            <a href="#" className="text-[10px] font-medium uppercase tracking-widest text-[#595c5d] hover:text-[#2c2f30]">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
