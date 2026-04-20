"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Cola de intercambios — el sistema asigna 2 videos simultáneos
// Prototipo Design: screens/Feed.jsx + App.jsx Shell

// --- Types ---

interface Creador {
  nombre: string | null;
  avatar_url: string | null;
  canal_url: string | null;
}

interface AssignedVideo {
  reserva_id: string;
  campana_id: string;
  video_id: string;
  youtube_video_id: string;
  titulo: string;
  descripcion: string | null;
  tipo_intercambio: string | null;
  tono: string | null;
  duracion_segundos: number | null;
  vistas: number;
  expires_at: string;
  thumbnail: string;
  youtube_url: string;
  creador: Creador;
}

// --- Helpers ---

function formatSubs(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(".0", "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
}

function formatDuration(sec: number | null): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${m} min`;
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

function reputacionNivel(rep: number | null, totalCalificados: number): { color: string; label: string; dot: string } {
  // Promedio de estrellas 1-5 (seccion 6.3 del PROYECTO.md tras v4.4).
  // Se activa con >= 20 intercambios calificados (igual que /dashboard/perfil).
  if (totalCalificados < 20) return { color: "#8a8d8f", label: "Sin activar", dot: "#dcdedf" };
  if (rep == null) return { color: "#8a8d8f", label: "—", dot: "#dcdedf" };
  if (rep >= 4.0) return { color: "#2c2f30", label: `${rep.toFixed(1)}★`, dot: "#22c55e" };
  if (rep >= 3.0) return { color: "#2c2f30", label: `${rep.toFixed(1)}★`, dot: "#eab308" };
  if (rep >= 2.0) return { color: "#2c2f30", label: `${rep.toFixed(1)}★`, dot: "#f97316" };
  return { color: "#2c2f30", label: `${rep.toFixed(1)}★`, dot: "#ef4444" };
}

// --- Icons (inline) ---

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
const UserIcon = ({ size = 16 }: { size?: number }) => (
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
const CommentIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const CalendarIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const MegaphoneIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m3 11 18-5v12L3 13v-2z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);
const PlayIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 4v16l14-8z" />
  </svg>
);
const ChevronRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

// --- Component ---

export default function ColaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<AssignedVideo[]>([]);
  const [empty, setEmpty] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  const [confirmingCampanaId, setConfirmingCampanaId] = useState<string | null>(null);

  const [stats, setStats] = useState({
    comentariosTotales: "—",
    comentariosMes: "—",
    reputacion: reputacionNivel(null, 0),
    campanasActivas: "—",
  });

  // --- Load cola ---
  useEffect(() => {
    (async () => {
      setLoading(true);
      setEmpty(false);
      setBlocked(null);
      try {
        const res = await fetch("/api/intercambios/asignar");
        const data = await res.json();
        if (!res.ok) {
          setBlocked(data.error || "Error al cargar la cola.");
        } else if (!data.ok) {
          if (data.error_code === "COLA_VACIA") setEmpty(true);
          else if (data.error_code === "LIMITE_PENDIENTES_ALCANZADO")
            setBlocked("Tienes 3 intercambios pendientes de verificación. Espera a que se resuelvan antes de continuar.");
          else if (data.error_code === "USUARIO_SIN_VIDEO_ACTIVO")
            setBlocked(data.mensaje);
          else setBlocked(data.mensaje || "Error inesperado.");
        } else {
          setVideos(data.videos || []);
        }
      } catch {
        setBlocked("Error de conexión.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Load stats ---
  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id, reputacion")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!usuario) return;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Comentarios totales (verificados, todos los tiempos)
      const { count: totales } = await supabase
        .from("intercambios")
        .select("*", { count: "exact", head: true })
        .eq("comentarista_id", usuario.id)
        .eq("estado", "verificado");

      // Comentarios este mes (verificados, mes actual)
      const { count: delMes } = await supabase
        .from("intercambios")
        .select("*", { count: "exact", head: true })
        .eq("comentarista_id", usuario.id)
        .eq("estado", "verificado")
        .gte("created_at", startOfMonth.toISOString());

      // Total calificados (para decidir Sin activar vs estrellas)
      const { data: calificados } = await supabase
        .from("intercambios")
        .select("estrellas")
        .eq("comentarista_id", usuario.id)
        .not("estrellas", "is", null);
      const totalCalificados = calificados?.length ?? 0;

      // Campañas activas (estado abierta) de todos los videos del usuario
      const { data: misVideos } = await supabase
        .from("videos")
        .select("id")
        .eq("usuario_id", usuario.id);
      const videoIds = (misVideos ?? []).map((v) => v.id);
      let campanasActivas = 0;
      if (videoIds.length > 0) {
        const { count: activas } = await supabase
          .from("campanas")
          .select("*", { count: "exact", head: true })
          .in("video_id", videoIds)
          .eq("estado", "abierta");
        campanasActivas = activas ?? 0;
      }

      setStats({
        comentariosTotales: (totales ?? 0).toString(),
        comentariosMes: (delMes ?? 0).toString(),
        reputacion: reputacionNivel(usuario.reputacion, totalCalificados),
        campanasActivas: campanasActivas.toString(),
      });
    })();
  }, []);

  async function handleComentar(video: AssignedVideo) {
    if (confirmingCampanaId) return;
    setConfirmingCampanaId(video.campana_id);
    try {
      const res = await fetch("/api/intercambios/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campana_id: video.campana_id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error_code === "RESERVA_EXPIRADA") {
          alert("La reserva expiró. Recargando la cola...");
          window.location.reload();
          return;
        }
        alert(data.mensaje || data.error || "No se pudo confirmar.");
        setConfirmingCampanaId(null);
        return;
      }
      // Navega al detalle — pendiente de construir (ver ESTADO.md Pendientes)
      router.push(`/dashboard/intercambiar/${video.campana_id}`);
    } catch {
      alert("Error de conexión.");
      setConfirmingCampanaId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      {/* ===== TOP FLOATING NAV ===== */}
      <header className="sticky top-3 z-30 mx-auto mt-3 max-w-[1240px] px-4">
        <div
          className="flex items-center gap-4 rounded-full border border-white/60 bg-white/80 px-5 py-2 pr-2.5 shadow-[0_8px_32px_rgba(44,47,48,0.08)]"
          style={{ backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)" }}
        >
          {/* Logo */}
          <a href="/dashboard/intercambiar" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[10px] font-headline text-base font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
            >
              C
            </div>
            <span className="font-headline text-lg font-bold tracking-[-0.02em] text-[#2c2f30]">
              Comentalo
            </span>
          </a>

          {/* Nav items */}
          <nav className="ml-4 flex gap-0.5">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
            >
              <HomeIcon />
              Inicio
            </a>
            <a
              href="/dashboard/intercambiar"
              className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium transition-colors"
              style={{ background: "rgba(98, 0, 238, 0.08)", color: "#6200EE" }}
            >
              <SwapIcon />
              Comentar
            </a>
            <a
              href="/dashboard/actividad"
              className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
            >
              <InboxIcon />
              Mi actividad
            </a>
            <a
              href="/dashboard/perfil"
              className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
            >
              <UserIcon />
              Perfil
            </a>
          </nav>

          <div className="flex-1" />

          {/* Bell */}
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#e9ebec] text-[#5b5e60] transition-colors hover:bg-[#e3e5e6]"
          >
            <BellIcon />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E87722] ring-2 ring-white" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-6 pb-16 pt-8">
        {/* ===== HERO ===== */}
        <div className="py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6200EE]">
            Comentar · {videos.length} asignados
          </p>
          <h1 className="max-w-[820px] font-headline text-[clamp(40px,6vw,72px)] font-bold leading-[1.02] tracking-[-0.03em] text-[#2c2f30]">
            Creadores esperando tu comentario.
          </h1>
          <p className="mt-4 max-w-[620px] text-base leading-[1.55] text-[#5b5e60]">
            Tú comentas. La comunidad te comenta. Así crecemos todos.
          </p>
        </div>

        {/* ===== STATS STRIP ===== */}
        <div
          className="mt-5 grid gap-0.5 overflow-hidden rounded-3xl bg-[#eff1f2] p-0.5"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
        >
          {/* Comentarios totales */}
          <div className="flex items-center gap-3.5 bg-white px-5 py-[18px]">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(98, 0, 238, 0.08)", color: "#6200EE" }}
            >
              <CommentIcon />
            </div>
            <div>
              <div className="font-headline text-2xl font-bold leading-none text-[#2c2f30]">
                {stats.comentariosTotales}
              </div>
              <div className="mt-1 text-[13px] leading-[1.5] text-[#5b5e60]">
                Comentarios totales
              </div>
            </div>
          </div>

          {/* Comentarios este mes */}
          <div className="flex items-center gap-3.5 bg-white px-5 py-[18px]">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(98, 0, 238, 0.08)", color: "#6200EE" }}
            >
              <CalendarIcon />
            </div>
            <div>
              <div className="font-headline text-2xl font-bold leading-none text-[#2c2f30]">
                {stats.comentariosMes}
              </div>
              <div className="mt-1 text-[13px] leading-[1.5] text-[#5b5e60]">
                Comentarios este mes
              </div>
            </div>
          </div>

          {/* Reputación */}
          <div className="flex items-center gap-3.5 bg-white px-5 py-[18px]">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(98, 0, 238, 0.08)" }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: stats.reputacion.dot, boxShadow: `0 0 0 3px ${stats.reputacion.dot}33` }}
              />
            </div>
            <div>
              <div className="font-headline text-2xl font-bold leading-none text-[#2c2f30]">
                {stats.reputacion.label}
              </div>
              <div className="mt-1 text-[13px] leading-[1.5] text-[#5b5e60]">
                Reputación
              </div>
            </div>
          </div>

          {/* Campañas activas */}
          <div className="flex items-center gap-3.5 bg-white px-5 py-[18px]">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(98, 0, 238, 0.08)", color: "#6200EE" }}
            >
              <MegaphoneIcon />
            </div>
            <div>
              <div className="font-headline text-2xl font-bold leading-none text-[#2c2f30]">
                {stats.campanasActivas}
              </div>
              <div className="mt-1 text-[13px] leading-[1.5] text-[#5b5e60]">
                Campañas activas
              </div>
            </div>
          </div>
        </div>

        {/* ===== CARDS ===== */}
        <div className="mt-8">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
            </div>
          )}

          {!loading && blocked && (
            <div className="rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-[#2c2f30]">{blocked}</p>
              <a
                href="/dashboard"
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
              >
                Volver al dashboard
              </a>
            </div>
          )}

          {!loading && !blocked && empty && (
            <div className="rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-[#2c2f30]">No hay videos disponibles en este momento.</p>
              <p className="mt-1 text-xs text-[#5b5e60]">
                Vuelve pronto — otros creadores están registrando videos.
              </p>
            </div>
          )}

          {!loading && !blocked && !empty && videos.length > 0 && (
            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}
            >
              {videos.map((v, i) => {
                const isConfirming = confirmingCampanaId === v.campana_id;
                const isDisabled = confirmingCampanaId !== null && !isConfirming;
                return (
                  <article
                    key={v.campana_id}
                    className={`flex flex-col gap-4 rounded-3xl bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${isDisabled ? "opacity-40" : ""}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#e3e5e6]">
                      <img
                        src={`https://img.youtube.com/vi/${v.youtube_video_id}/maxresdefault.jpg`}
                        alt={v.titulo}
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = v.thumbnail; }}
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/65">
                        <PlayIcon size={48} />
                      </div>
                      {v.duracion_segundos && v.duracion_segundos > 0 && (
                        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {formatDuration(v.duracion_segundos)}
                        </span>
                      )}
                    </div>

                    {/* Creator row + title */}
                    <div>
                      <div className="mb-2.5 flex flex-wrap items-center gap-2">
                        {v.creador.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.creador.avatar_url}
                            alt={v.creador.nombre || "Creador"}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                          >
                            {(v.creador.nombre || "C").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-[#2c2f30]">
                          {v.creador.nombre || "Creador"}
                        </span>
                        {v.vistas > 0 && (
                          <>
                            <span className="inline-block h-[3px] w-[3px] rounded-full bg-[#abadae]" />
                            <span className="text-[13px] text-[#5b5e60]">
                              {formatSubs(v.vistas)} vistas
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="m-0 line-clamp-2 font-headline text-xl font-bold leading-[1.2] tracking-[-0.01em] text-[#2c2f30]">
                        {normalizeTitle(v.titulo)}
                      </h3>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleComentar(v)}
                        disabled={isDisabled || isConfirming}
                        className="inline-flex items-center gap-1.5 rounded-2xl px-[18px] py-2.5 text-[13px] font-semibold text-white transition-all hover:shadow-[0_0_0_6px_rgba(98,0,238,0.12)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
                        style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                      >
                        {isConfirming ? (
                          <>
                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Confirmando…
                          </>
                        ) : (
                          <>
                            Comentar
                            <ChevronRight />
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
