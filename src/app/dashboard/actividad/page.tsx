"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Mi actividad — pendientes + completados + mi campaña activa
// Prototipo Design: screens/MyExchanges.jsx

// --- Types ---

interface CreadorRow {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
}

interface IntercambioRow {
  id: string;
  campana_id: string;
  texto_comentario: string;
  created_at: string;
  estado: string;
  video: {
    id: string;
    youtube_video_id: string;
    titulo: string;
    duracion_segundos: number | null;
  };
  creador: CreadorRow;
}

interface MiCampanaActiva {
  campana_id: string;
  video_titulo: string;
  intercambios_completados: number;
  en_cola: number;
}

interface MisCampanasVideoRow {
  id: string;
  youtube_video_id: string;
  titulo: string;
  vistas: number;
  estado: string;
  intercambios_recibidos: number;
  campana_id: string | null;
  campana_estado: string | null;
}

// --- Helpers ---

function formatSubs(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(".0", "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
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

function formatDateRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "hoy";
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
  return new Date(iso).toLocaleDateString("es-LA", { day: "numeric", month: "short" });
}

function formatDuration(sec: number | null): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${m} min`;
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
const PlayIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 4v16l14-8z" />
  </svg>
);
const PlusIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const CheckIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const ChevronRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

// --- Component ---

type Tab = "pendientes" | "completados";
type Section = "comentando" | "recibiendo";
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

export default function ActividadPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("comentando");
  const [tab, setTab] = useState<Tab>("pendientes");

  const [miCampana, setMiCampana] = useState<MiCampanaActiva | null>(null);
  const [pendientes, setPendientes] = useState<IntercambioRow[]>([]);
  const [completados, setCompletados] = useState<IntercambioRow[]>([]);
  const [misCampanasVideos, setMisCampanasVideos] = useState<MisCampanasVideoRow[]>([]);
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
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/"); return; }

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle();
        if (!usuario) { router.replace("/verificar-canal"); return; }

        // --- Mi campaña activa ---
        const { data: misVideos } = await supabase
          .from("videos")
          .select(`
            id, titulo,
            campanas!inner ( id, estado, intercambios_completados, created_at )
          `)
          .eq("usuario_id", usuario.id)
          .eq("campanas.estado", "abierta")
          .order("created_at", { ascending: false })
          .limit(1);

        type VideoConCampana = {
          id: string;
          titulo: string;
          campanas: { id: string; estado: string; intercambios_completados: number; created_at: string }[];
        };
        const miVideo = (misVideos as VideoConCampana[] | null)?.[0];
        if (miVideo && miVideo.campanas && miVideo.campanas.length > 0) {
          const campana = miVideo.campanas[0];
          const { count: enCola } = await supabase
            .from("intercambios")
            .select("*", { count: "exact", head: true })
            .eq("campana_id", campana.id)
            .eq("estado", "pendiente");

          setMiCampana({
            campana_id: campana.id,
            video_titulo: miVideo.titulo,
            intercambios_completados: campana.intercambios_completados,
            en_cola: enCola ?? 0,
          });
        }

        // --- Intercambios del usuario (como comentarista) ---
        // RPC get_mis_intercambios_comentarista (SECURITY DEFINER) bypasea RLS
        // en campanas/videos/usuarios — las policies solo permiten ver esos
        // rows al DUEÑO del video, no al comentarista, y los !inner joins
        // colapsaban por RLS. Ver migración 20260420_rpc_get_mis_intercambios.
        type IntercambioRpcRow = {
          id: string;
          campana_id: string;
          texto_comentario: string;
          created_at: string;
          estado: string;
          video: {
            id: string;
            youtube_video_id: string;
            titulo: string;
            duracion_segundos: number | null;
          };
          creador: { id: string; nombre: string | null; avatar_url: string | null };
        };

        const { data: rpcRows } = await supabase.rpc("get_mis_intercambios_comentarista");
        const rows: IntercambioRow[] = (rpcRows as IntercambioRpcRow[] | null) ?? [];

        setPendientes(rows.filter((r) => r.estado === "pendiente"));
        setCompletados(rows.filter((r) => r.estado === "verificado"));

        // --- Mis campañas (todos los videos + última campaña) para tab Recibiendo ---
        type VideoRecibiendoRaw = {
          id: string;
          youtube_video_id: string;
          titulo: string;
          vistas: number;
          estado: string;
          campanas: { id: string; estado: string; intercambios_completados: number; created_at: string }[];
        };
        const { data: todosMisVideos } = await supabase
          .from("videos")
          .select(`
            id, youtube_video_id, titulo, vistas, estado, created_at,
            campanas ( id, estado, intercambios_completados, created_at )
          `)
          .eq("usuario_id", usuario.id)
          .order("created_at", { ascending: false });

        const misCampanasRows: MisCampanasVideoRow[] = ((todosMisVideos as VideoRecibiendoRaw[] | null) ?? []).map((v) => {
          const campanaReciente = [...(v.campanas ?? [])].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          return {
            id: v.id,
            youtube_video_id: v.youtube_video_id,
            titulo: v.titulo,
            vistas: v.vistas,
            estado: v.estado,
            intercambios_recibidos: campanaReciente?.intercambios_completados ?? 0,
            campana_id: campanaReciente?.id ?? null,
            campana_estado: campanaReciente?.estado ?? null,
          };
        });
        setMisCampanasVideos(misCampanasRows);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, refreshKey]);

  const currentList = tab === "pendientes" ? pendientes : completados;

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
              className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium transition-colors"
              style={{ background: "rgba(98, 0, 238, 0.08)", color: "#6200EE" }}
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
            Tu actividad
          </p>
          <h1 className="font-headline text-[clamp(32px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em] text-[#2c2f30]">
            Mi actividad
          </h1>
        </div>

        {/* ===== SECTION TABS ===== */}
        <div className="mb-6 inline-flex gap-1 rounded-full bg-[#eff1f2] p-1">
          {[
            { id: "comentando" as Section, label: "Comentando" },
            { id: "recibiendo" as Section, label: "Recibiendo" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="rounded-full px-5 py-2 text-sm font-semibold transition-all"
              style={{
                background: section === s.id ? "#ffffff" : "transparent",
                color: section === s.id ? "#2c2f30" : "#5b5e60",
                boxShadow: section === s.id ? "0 2px 6px rgba(44,47,48,0.05)" : "none",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === "comentando" && (
          <>
            {/* ===== SUB-TABS ===== */}
            <div className="mb-5 inline-flex gap-1 rounded-full bg-[#eff1f2] p-1">
              {[
                { id: "pendientes" as Tab, label: `Pendientes (${pendientes.length})` },
                { id: "completados" as Tab, label: `Completados (${completados.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="rounded-full px-4 py-2 text-[13px] font-semibold transition-all"
                  style={{
                    background: tab === t.id ? "#ffffff" : "transparent",
                    color: tab === t.id ? "#2c2f30" : "#5b5e60",
                    boxShadow: tab === t.id ? "0 2px 6px rgba(44,47,48,0.05)" : "none",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ===== COMENTANDO LIST ===== */}
            <div className="flex flex-col gap-3">
              {loading && (
                <div className="flex items-center justify-center rounded-3xl bg-white py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
                </div>
              )}

              {!loading && currentList.length === 0 && (
                <div className="rounded-3xl bg-white p-10 text-center">
                  <p className="text-sm text-[#2c2f30]">
                    {tab === "pendientes"
                      ? "Sin intercambios pendientes."
                      : "Aún no has completado intercambios."}
                  </p>
                </div>
              )}

              {!loading && currentList.length > 0 && currentList.map((i) => (
                <ActividadRow key={i.id} intercambio={i} tab={tab} router={router} />
              ))}
            </div>
          </>
        )}

        {section === "recibiendo" && (
          <>
            {/* ===== MI CAMPAÑA ACTIVA ===== */}
            <div className="mb-6 rounded-3xl bg-white p-6">
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
                </div>
              )}

              {!loading && !miCampana && (
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.05em] text-[#5b5e60]">
                      Mi campaña activa
                    </p>
                    <h3 className="m-0 mb-2 font-headline text-2xl font-bold text-[#2c2f30]">
                      Aún no tienes una campaña activa
                    </h3>
                    <p className="text-[14px] leading-[1.55] text-[#5b5e60]">
                      Registra un video para que otros creadores puedan comentarlo.
                    </p>
                  </div>
                  <a
                    href="/dashboard/registrar-video"
                    className="inline-flex items-center gap-1.5 rounded-2xl px-[18px] py-2.5 text-[13px] font-semibold text-white transition-all hover:shadow-[0_0_0_6px_rgba(98,0,238,0.12)] active:scale-[0.97]"
                    style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                  >
                    Crear campaña
                    <ChevronRight />
                  </a>
                </div>
              )}

              {!loading && miCampana && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.05em] text-[#5b5e60]">
                        Mi campaña activa
                      </p>
                      <h3 className="m-0 mb-2 line-clamp-2 font-headline text-2xl font-bold leading-[1.2] text-[#2c2f30]">
                        {normalizeTitle(miCampana.video_titulo)}
                      </h3>
                      <p className="text-[14px] leading-[1.55] text-[#5b5e60]">
                        {miCampana.intercambios_completados} comentarios recibidos de 10 · {miCampana.en_cola} en cola
                      </p>
                    </div>
                    <a
                      href={`/dashboard/calificar/${miCampana.campana_id}`}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-[#e3e5e6] px-4 py-2.5 text-[13px] font-semibold text-[#6200EE] transition-colors hover:bg-[#dcdedf]"
                    >
                      Calificar recibidos
                      <ChevronRight />
                    </a>
                  </div>

                  {/* Progress: 10 segmentos */}
                  <div className="mt-5 flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const done = i < miCampana.intercambios_completados;
                      const inQueue =
                        !done &&
                        i < miCampana.intercambios_completados + miCampana.en_cola;
                      return (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full"
                          style={{
                            background: done
                              ? "linear-gradient(135deg, #6200EE, #ac8eff)"
                              : inQueue
                                ? "rgba(98, 0, 238, 0.15)"
                                : "#e3e5e6",
                          }}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ===== MIS CAMPAÑAS LIST ===== */}
            <div className="rounded-3xl bg-white p-6">
              <h3 className="m-0 mb-4 font-headline text-xl font-semibold text-[#2c2f30]">
                Mis campañas
              </h3>

              {actionError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-[#c43535]">
                  {actionError}
                </div>
              )}

              {loading && misCampanasVideos.length === 0 && (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
                </div>
              )}

              {!loading && misCampanasVideos.length === 0 && (
                <p className="py-4 text-sm text-[#5b5e60]">
                  Aún no has registrado videos. Crea tu primera campaña para entrar a la comunidad.
                </p>
              )}

              {misCampanasVideos.length > 0 && (
                <div className="flex flex-col gap-3">
                  {misCampanasVideos.map((v) => {
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
          </>
        )}
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

// --- Row ---

function ActividadRow({
  intercambio,
  tab,
  router,
}: {
  intercambio: IntercambioRow;
  tab: Tab;
  router: ReturnType<typeof useRouter>;
}) {
  const v = intercambio.video;
  const c = intercambio.creador;
  const youtubeUrl = `https://www.youtube.com/watch?v=${v.youtube_video_id}`;

  function handleClick() {
    if (tab === "pendientes") {
      router.push(`/dashboard/intercambiar/${intercambio.campana_id}`);
    } else {
      window.open(youtubeUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className="grid gap-4 rounded-3xl bg-white p-4"
      style={{ gridTemplateColumns: "100px 1fr auto", alignItems: "center" }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[#e3e5e6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${v.youtube_video_id}/mqdefault.jpg`}
          alt={v.titulo}
          className="h-full w-full object-cover"
        />
        {v.duracion_segundos && v.duracion_segundos > 0 && (
          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {formatDuration(v.duracion_segundos)}
          </span>
        )}
      </div>

      {/* Middle */}
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          {c.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.avatar_url}
              alt={c.nombre || "Creador"}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
            >
              {(c.nombre || "C").charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold text-[#2c2f30]">
            {c.nombre || "Creador"}
          </span>
        </div>
        <div className="truncate text-[15px] font-semibold text-[#2c2f30]">
          {v.titulo}
        </div>
        {tab === "completados" && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[13px] text-[#5b5e60]">
              Completado {formatDateRelative(intercambio.created_at)}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      {tab === "pendientes" ? (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:shadow-[0_0_0_6px_rgba(98,0,238,0.12)] active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
        >
          Comentar ahora
          <ChevronRight />
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#e3e5e6] px-4 py-2.5 text-[13px] font-semibold text-[#2c2f30] transition-colors hover:bg-[#dcdedf]"
        >
          <CheckIcon size={12} />
          Ver video
        </button>
      )}
    </div>
  );
}

// --- Subcomponente de acciones — sección 5D de PROYECTO.md ---
// (duplicado del de /dashboard/perfil; consolidar cuando se cree shared lib)

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

// --- Modal de confirmación (duplicado del de /dashboard/perfil) ---
// Cerrable con Cancelar, ESC o click en backdrop. Deshabilita controles
// mientras la acción está pendiente.

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
