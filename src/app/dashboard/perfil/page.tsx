"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Perfil — info del usuario + stats + mis videos
// Prototipo Design: App.jsx Profile component

// --- Types ---

interface UsuarioInfo {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
  suscriptores_al_registro: number;
  reputacion: number | null;
  created_at: string;
}

interface VideoRow {
  id: string;
  youtube_video_id: string;
  titulo: string;
  vistas: number;
  estado: string;
  created_at: string;
  intercambios_recibidos: number;
  campana_id: string | null;
  campana_estado: string | null;
}

interface Stats {
  comentariosMes: string;
  promedioEstrellas: string;
  calificacionPositiva: string;
  campanasCompletadas: string;
}

interface RepLevel {
  label: string;
  dot: string;
}

// --- Helpers ---

function formatSubs(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(".0", "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
}

function formatMemberSince(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleDateString("es-LA", { month: "long" });
  const year = d.getFullYear();
  const now = new Date();
  return year === now.getFullYear() ? `Miembro desde ${month}` : `Miembro desde ${month} ${year}`;
}

function reputacionLevel(rep: number | null, totalCalificados: number): RepLevel {
  if (totalCalificados < 20) return { label: "Sin activar", dot: "#dcdedf" };
  if (rep == null) return { label: "—", dot: "#dcdedf" };
  if (rep >= 4.0) return { label: "Verde", dot: "#22c55e" };
  if (rep >= 3.0) return { label: "Amarillo", dot: "#eab308" };
  if (rep >= 2.0) return { label: "Naranja", dot: "#f97316" };
  return { label: "Rojo", dot: "#ef4444" };
}

function initials(nombre: string | null): string {
  if (!nombre) return "C";
  const parts = nombre.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase() || "C";
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

// --- Icons ---

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
const PlusIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const PlayIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 4v16l14-8z" />
  </svg>
);

type CampanaActionId = "pausar" | "activar" | "finalizar" | "eliminar";

const CONFIRM_TEXTS: Record<CampanaActionId, { titulo: string; mensaje: string }> = {
  pausar: {
    titulo: "Pausar campaña",
    mensaje: "Los comentaristas no podrán comentar tu video mientras esté pausada.",
  },
  activar: {
    titulo: "Activar campaña",
    mensaje: "Tu video volverá a estar disponible para comentarios.",
  },
  finalizar: {
    titulo: "Finalizar campaña",
    mensaje: "Tu campaña se cerrará permanentemente. Esta acción no se puede deshacer.",
  },
  eliminar: {
    titulo: "Eliminar campaña",
    mensaje: "Tu campaña será eliminada permanentemente. Solo puedes eliminar campañas sin comentarios verificados.",
  },
};

// --- Component ---

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioInfo | null>(null);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [repLevel, setRepLevel] = useState<RepLevel>({ label: "Sin activar", dot: "#dcdedf" });
  const [stats, setStats] = useState<Stats>({
    comentariosMes: "—",
    promedioEstrellas: "—",
    calificacionPositiva: "—",
    campanasCompletadas: "—",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ action: CampanaActionId; campanaId: string } | null>(null);

  async function accionCampana(campanaId: string, endpoint: string) {
    setActionPending(campanaId);
    setActionError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campana_id: campanaId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setActionError(data.error || "No se pudo completar la acción.");
        return;
      }
      setRefreshKey((k) => k + 1);
    } catch {
      setActionError("Error de conexión.");
    } finally {
      setActionPending(null);
    }
  }

  function pedirConfirmacion(action: CampanaActionId, campanaId: string | null) {
    if (!campanaId) return;
    setActionError(null);
    setConfirmState({ action, campanaId });
  }

  async function confirmarAccion() {
    if (!confirmState) return;
    const { action, campanaId } = confirmState;
    await accionCampana(campanaId, `/api/campanas/${action}`);
    setConfirmState(null);
  }

  useEffect(() => {
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/"); return; }

        const { data: u } = await supabase
          .from("usuarios")
          .select("id, nombre, avatar_url, suscriptores_al_registro, reputacion, created_at")
          .eq("auth_id", user.id)
          .maybeSingle();
        if (!u) { router.replace("/verificar-canal"); return; }
        setUsuario(u as UsuarioInfo);

        // --- Mis videos con campaña más reciente (id + estado + conteo) ---
        type VideoRaw = {
          id: string;
          youtube_video_id: string;
          titulo: string;
          vistas: number;
          estado: string;
          created_at: string;
          campanas: { id: string; estado: string; intercambios_completados: number; created_at: string }[];
        };
        const { data: misVideos } = await supabase
          .from("videos")
          .select(`
            id, youtube_video_id, titulo, vistas, estado, created_at,
            campanas ( id, estado, intercambios_completados, created_at )
          `)
          .eq("usuario_id", u.id)
          .order("created_at", { ascending: false });

        const videoRows: VideoRow[] = ((misVideos as VideoRaw[] | null) ?? []).map((v) => {
          const campanaReciente = [...(v.campanas ?? [])].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          return {
            id: v.id,
            youtube_video_id: v.youtube_video_id,
            titulo: v.titulo,
            vistas: v.vistas,
            estado: v.estado,
            created_at: v.created_at,
            intercambios_recibidos: campanaReciente?.intercambios_completados ?? 0,
            campana_id: campanaReciente?.id ?? null,
            campana_estado: campanaReciente?.estado ?? null,
          };
        });
        setVideos(videoRows);

        // --- Stats ---
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: comentariosMes } = await supabase
          .from("intercambios")
          .select("*", { count: "exact", head: true })
          .eq("comentarista_id", u.id)
          .gte("created_at", startOfMonth.toISOString());

        // Calificación positiva — basada en estrellas (v4.4 en adelante)
        const { data: calificados } = await supabase
          .from("intercambios")
          .select("estrellas")
          .eq("comentarista_id", u.id)
          .not("estrellas", "is", null);
        const totalCalificados = calificados?.length ?? 0;
        const positivos = (calificados ?? []).filter(
          (c: { estrellas: number }) => c.estrellas >= 4
        ).length;
        const calificacionPositiva =
          totalCalificados > 0
            ? `${Math.round((positivos / totalCalificados) * 100)}%`
            : "—";

        const promedioEstrellas =
          totalCalificados > 0 && u.reputacion != null
            ? `${u.reputacion.toFixed(1)}★`
            : "—";

        // Campañas completadas — join video.usuario_id
        const { count: campanasCompletadas } = await supabase
          .from("campanas")
          .select("*, videos!inner(usuario_id)", { count: "exact", head: true })
          .eq("videos.usuario_id", u.id)
          .in("estado", ["completada", "calificada"]);

        setStats({
          comentariosMes: (comentariosMes ?? 0).toString(),
          promedioEstrellas,
          calificacionPositiva,
          campanasCompletadas: (campanasCompletadas ?? 0).toString(),
        });

        setRepLevel(reputacionLevel(u.reputacion, totalCalificados));
      } finally {
        setLoading(false);
      }
    })();
  }, [router, refreshKey]);

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      {/* ===== TOP FLOATING NAV ===== */}
      <header className="sticky top-3 z-30 mx-auto mt-3 max-w-[1240px] px-4">
        <div
          className="flex items-center gap-4 rounded-full border border-white/60 bg-white/80 px-5 py-2 pr-2.5 shadow-[0_8px_32px_rgba(44,47,48,0.08)]"
          style={{ backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)" }}
        >
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
              className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
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
              className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium transition-colors"
              style={{ background: "rgba(98, 0, 238, 0.08)", color: "#6200EE" }}
            >
              <UserIcon />
              Perfil
            </a>
          </nav>

          <div className="flex-1" />

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
        <div className="py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6200EE]">
            Tu canal
          </p>
          <h1 className="font-headline text-[clamp(32px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em] text-[#2c2f30]">
            Perfil
          </h1>
        </div>

        {/* ===== IDENTITY CARD ===== */}
        <div className="mb-6 flex flex-wrap items-center gap-5 rounded-3xl bg-white p-7">
          {loading && !usuario ? (
            <div className="flex w-full justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
            </div>
          ) : usuario ? (
            <>
              {/* Avatar */}
              {usuario.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={usuario.avatar_url}
                  alt={usuario.nombre || "Perfil"}
                  className="aspect-square h-20 w-20 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex aspect-square h-20 w-20 shrink-0 items-center justify-center rounded-full font-headline text-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                >
                  {initials(usuario.nombre)}
                </div>
              )}

              {/* Info */}
              <div className="min-w-[200px] flex-1">
                <h2 className="m-0 font-headline text-2xl font-bold text-[#2c2f30]">
                  {usuario.nombre || "Creador"}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#5b5e60]">
                  <span>{formatSubs(usuario.suscriptores_al_registro)} suscriptores</span>
                  <span className="inline-block h-[3px] w-[3px] rounded-full bg-[#abadae]" />
                  <span>{formatMemberSince(usuario.created_at)}</span>
                </div>
              </div>

              {/* Reputación */}
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-[#5b5e60]">
                <span
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ background: repLevel.dot, boxShadow: `0 0 0 3px ${repLevel.dot}33` }}
                />
                {repLevel.label}
              </span>
            </>
          ) : null}
        </div>

        {/* ===== STATS ===== */}
        <div
          className="mb-6 grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {[
            { k: stats.comentariosMes, l: "Comentarios este mes" },
            { k: stats.promedioEstrellas, l: "Promedio de estrellas" },
            { k: stats.calificacionPositiva, l: "Calificación positiva" },
            { k: stats.campanasCompletadas, l: "Campañas completadas" },
          ].map((s, i) => (
            <div key={i} className="rounded-3xl bg-white p-5">
              <div className="font-headline text-[clamp(28px,3.5vw,40px)] font-bold leading-none tracking-[-0.02em] text-[#2c2f30]">
                {s.k}
              </div>
              <div className="mt-2 text-[13px] leading-[1.5] text-[#5b5e60]">{s.l}</div>
            </div>
          ))}
        </div>

        {/* ===== MIS CAMPAÑAS ===== */}
        <div className="rounded-3xl bg-white p-6">
          <h3 className="m-0 mb-4 font-headline text-xl font-semibold text-[#2c2f30]">
            Mis campañas
          </h3>

          {actionError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-[#c43535]">
              {actionError}
            </div>
          )}

          {loading && videos.length === 0 && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
            </div>
          )}

          {!loading && videos.length === 0 && (
            <p className="py-4 text-sm text-[#5b5e60]">
              Aún no has registrado videos. Registra el primero para entrar a la comunidad.
            </p>
          )}

          {videos.length > 0 && (
            <div className="flex flex-col gap-3">
              {videos.map((v) => {
                const estadoChip = chipForEstado(v.estado);
                return (
                  <div
                    key={v.id}
                    className="flex items-center gap-4 rounded-2xl bg-[#eff1f2] p-3"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-[120px] shrink-0 overflow-hidden rounded-xl bg-[#e3e5e6]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${v.youtube_video_id}/mqdefault.jpg`}
                        alt={v.titulo}
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/60">
                        <PlayIcon size={24} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold text-[#2c2f30]">
                        {normalizeTitle(v.titulo)}
                      </div>
                      <div className="mt-1 text-[13px] text-[#5b5e60]">
                        {v.intercambios_recibidos}/10 comentarios · {formatSubs(v.vistas)} vistas
                      </div>
                    </div>

                    {/* Chip estado */}
                    <span
                      className="inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium"
                      style={{ background: estadoChip.bg, color: estadoChip.color }}
                    >
                      {estadoChip.label}
                    </span>

                    {/* Acciones — sección 5D de PROYECTO.md */}
                    <CampanaAcciones
                      campanaId={v.campana_id}
                      campanaEstado={v.campana_estado}
                      intercambiosRecibidos={v.intercambios_recibidos}
                      actionPending={actionPending}
                      onPausar={() => pedirConfirmacion("pausar", v.campana_id)}
                      onActivar={() => pedirConfirmacion("activar", v.campana_id)}
                      onFinalizar={() => pedirConfirmacion("finalizar", v.campana_id)}
                      onEliminar={() => pedirConfirmacion("eliminar", v.campana_id)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <a
            href="/dashboard/registrar-video"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#e3e5e6] px-4 py-3 text-[13px] font-semibold text-[#6200EE] transition-colors hover:bg-[#dcdedf]"
          >
            <PlusIcon />
            Crear campaña
          </a>
        </div>

        {/* ===== CERRAR SESIÓN ===== */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              router.replace("/");
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#e3e5e6] px-4 py-2 text-[13px] font-medium text-[#5b5e60] transition-colors hover:bg-[#fde4e4] hover:text-[#c43535]"
          >
            Cerrar sesión
          </button>
        </div>
      </main>

      <ConfirmModal
        state={confirmState}
        pending={confirmState ? actionPending === confirmState.campanaId : false}
        onCancel={() => setConfirmState(null)}
        onConfirm={confirmarAccion}
      />
    </div>
  );
}

function chipForEstado(estado: string): { label: string; bg: string; color: string } {
  switch (estado) {
    case "activo":
      return { label: "Activo", bg: "#6200EE", color: "#ffffff" };
    case "suspendido":
      return { label: "Suspendido", bg: "#fde4e4", color: "#c43535" };
    case "completado":
      return { label: "Completado", bg: "rgba(98,0,238,0.08)", color: "#6200EE" };
    default:
      return { label: estado, bg: "#e3e5e6", color: "#5b5e60" };
  }
}

// --- Subcomponente de acciones — sección 5D de PROYECTO.md ---
// Muestra Pausar + Finalizar + Eliminar cuando la campaña está activa/abierta.
// Muestra Activar + Finalizar + Eliminar cuando está pausada.
// Eliminar solo si intercambios_recibidos === 0.
// Oculta todo cuando el estado es terminal (completada/calificada/finalizada)
// o cuando el video no tiene campaña asociada aún.

function CampanaAcciones({
  campanaId,
  campanaEstado,
  intercambiosRecibidos,
  actionPending,
  onPausar,
  onActivar,
  onFinalizar,
  onEliminar,
}: {
  campanaId: string | null;
  campanaEstado: string | null;
  intercambiosRecibidos: number;
  actionPending: string | null;
  onPausar: () => void;
  onActivar: () => void;
  onFinalizar: () => void;
  onEliminar: () => void;
}) {
  if (!campanaId || !campanaEstado) return null;

  const esActiva = campanaEstado === "activa" || campanaEstado === "abierta";
  const esPausada = campanaEstado === "pausada";
  if (!esActiva && !esPausada) return null;

  const puedeEliminar = intercambiosRecibidos === 0;
  const deshabilitado = actionPending === campanaId;

  return (
    <div className="flex shrink-0 flex-wrap justify-end gap-2">
      {esActiva && (
        <button
          type="button"
          onClick={onPausar}
          disabled={deshabilitado}
          className="rounded-full bg-[#e3e5e6] px-3.5 py-1.5 text-[13px] font-medium text-[#5b5e60] transition-colors hover:bg-[#dcdedf] hover:text-[#2c2f30] disabled:opacity-50"
        >
          Pausar
        </button>
      )}
      {esPausada && (
        <button
          type="button"
          onClick={onActivar}
          disabled={deshabilitado}
          className="rounded-full bg-[rgba(98,0,238,0.1)] px-3.5 py-1.5 text-[13px] font-medium text-[#6200EE] transition-colors hover:bg-[rgba(98,0,238,0.16)] disabled:opacity-50"
        >
          Activar
        </button>
      )}
      <button
        type="button"
        onClick={onFinalizar}
        disabled={deshabilitado}
        className="rounded-full bg-[#e3e5e6] px-3.5 py-1.5 text-[13px] font-medium text-[#5b5e60] transition-colors hover:bg-[#dcdedf] hover:text-[#2c2f30] disabled:opacity-50"
      >
        Finalizar
      </button>
      {puedeEliminar && (
        <button
          type="button"
          onClick={onEliminar}
          disabled={deshabilitado}
          className="rounded-full bg-[#fde4e4] px-3.5 py-1.5 text-[13px] font-medium text-[#c43535] transition-colors hover:bg-[#fbd0d0] disabled:opacity-50"
        >
          Eliminar
        </button>
      )}
    </div>
  );
}

// --- Modal de confirmación de acción sobre campaña ---
// Centrado, dismissable (Cancelar, ESC, click en backdrop), con animación suave.
// Cerrable — a diferencia del modal de verificación que es gate obligatorio.

function ConfirmModal({
  state,
  pending,
  onCancel,
  onConfirm,
}: {
  state: { action: CampanaActionId; campanaId: string } | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!state) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [state, onCancel, pending]);

  if (!state) return null;

  const { titulo, mensaje } = CONFIRM_TEXTS[state.action];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{
        background: "rgba(20, 20, 24, 0.48)",
        animation: "comentaloFade 160ms ease-out forwards",
      }}
      onClick={() => { if (!pending) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <style>{`
        @keyframes comentaloFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes comentaloPop {
          from { opacity: 0; transform: scale(0.96) translateY(6px) }
          to   { opacity: 1; transform: scale(1) translateY(0) }
        }
      `}</style>
      <div
        className="w-full max-w-[420px] rounded-3xl bg-white p-7 shadow-[0_24px_64px_rgba(20,20,24,0.24)]"
        style={{ animation: "comentaloPop 220ms cubic-bezier(0.2, 0.9, 0.3, 1.12) forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="confirm-title"
          className="font-headline text-xl font-extrabold tracking-[-0.02em] text-[#2c2f30]"
        >
          {titulo}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#5b5e60]">
          {mensaje}
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 rounded-2xl bg-[#e3e5e6] py-3 text-sm font-semibold text-[#5b5e60] transition-colors hover:bg-[#dcdedf] hover:text-[#2c2f30] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
          >
            {pending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
