"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Mis campañas — lista de videos registrados con estado de campaña y acciones.
// Hasta v4.27 vivía dentro de /dashboard/perfil; movido a ruta propia en v4.28.

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
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}‍️]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!sinEmojis) return '';
  const lower = sinEmojis.toLowerCase();
  const firstLetter = lower.search(/\p{L}/u);
  if (firstLetter < 0) return lower;
  return lower.slice(0, firstLetter) + lower[firstLetter].toUpperCase() + lower.slice(firstLetter + 1);
}

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

export default function MisCampanasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ action: CampanaActionId; campanaId: string } | null>(null);

  async function accionCampana(campanaId: string, endpoint: string) {
    setActionPending(campanaId);
    setActionError(null);
    setActionSuccess(null);
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
      // Toast de reembolso para eliminar. router.refresh() invalida el
      // Router Cache del layout → badge de créditos del header refleja saldo nuevo.
      if (endpoint === "/api/campanas/eliminar") {
        const reembolso = typeof data.reembolso === "number" ? data.reembolso : 0;
        setActionSuccess(
          reembolso > 0
            ? `Campaña eliminada. Se restituyeron ${reembolso} 💎 créditos.`
            : "Campaña eliminada."
        );
        router.refresh();
      }
      setRefreshKey((k) => k + 1);
    } catch {
      setActionError("Error de conexión.");
    } finally {
      setActionPending(null);
    }
  }

  // Auto-dismiss del success toast a los 4s.
  useEffect(() => {
    if (!actionSuccess) return;
    const t = setTimeout(() => setActionSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [actionSuccess]);

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
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle();
        if (!u) { router.replace("/verificar-canal"); return; }

        type VideoRaw = {
          id: string;
          youtube_video_id: string;
          titulo: string;
          vistas: number;
          estado: string;
          created_at: string;
          campanas: { id: string; estado: string; intercambios_completados: number; created_at: string }[];
        };
        // `campanas!inner(...)` fuerza INNER JOIN: solo devuelve videos
        // con al menos una campaña. Videos sin campaña quedan fuera.
        const { data: misVideos } = await supabase
          .from("videos")
          .select(`
            id, youtube_video_id, titulo, vistas, estado, created_at,
            campanas!inner ( id, estado, intercambios_completados, created_at )
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
      } finally {
        setLoading(false);
      }
    })();
  }, [router, refreshKey]);

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      <main className="mx-auto max-w-[1240px] px-6 pb-16 pt-8">
        {/* Hero */}
        <div className="py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6200EE]">
            Gestión
          </p>
          <h1 className="font-headline text-[clamp(32px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em] text-[#2c2f30]">
            Mis campañas
          </h1>
        </div>

        <div className="rounded-3xl bg-white p-6">
          {actionError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-[#c43535]">
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
              {actionSuccess}
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
                        {v.intercambios_recibidos} comentarios recibidos · {formatSubs(v.vistas)} vistas
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
// Sin campaña → no renderiza (solo el chip de estado queda visible).
// Con campaña → Pausar/Activar/Finalizar/Eliminar siempre visibles;
// habilitados según estado (activa, pausada, terminal) e intercambios_recibidos.

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

  const esActiva = campanaEstado === "activa";
  const esPausada = campanaEstado === "pausada";
  const pendiente = actionPending === campanaId;
  const puedeEliminarPorIntercambios = intercambiosRecibidos === 0;

  // Reglas:
  // - activa: Pausar on, Activar off, Finalizar on, Eliminar si 0 intercambios
  // - pausada: Pausar off, Activar on, Finalizar on, Eliminar si 0 intercambios
  // - finalizada (terminal): todos off
  const pausarHabilitado = esActiva && !pendiente;
  const activarHabilitado = esPausada && !pendiente;
  const finalizarHabilitado = (esActiva || esPausada) && !pendiente;
  const eliminarHabilitado =
    (esActiva || esPausada) && puedeEliminarPorIntercambios && !pendiente;

  const disabledCls = "opacity-40 cursor-not-allowed";

  return (
    <div className="flex shrink-0 flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={onPausar}
        disabled={!pausarHabilitado}
        className={`rounded-full bg-[#e3e5e6] px-3.5 py-1.5 text-[13px] font-medium text-[#5b5e60] transition-colors hover:bg-[#dcdedf] hover:text-[#2c2f30] ${!pausarHabilitado ? disabledCls : ""}`}
      >
        Pausar
      </button>
      <button
        type="button"
        onClick={onActivar}
        disabled={!activarHabilitado}
        className={`rounded-full bg-[rgba(98,0,238,0.1)] px-3.5 py-1.5 text-[13px] font-medium text-[#6200EE] transition-colors hover:bg-[rgba(98,0,238,0.16)] ${!activarHabilitado ? disabledCls : ""}`}
      >
        Activar
      </button>
      <button
        type="button"
        onClick={onFinalizar}
        disabled={!finalizarHabilitado}
        className={`rounded-full bg-[#e3e5e6] px-3.5 py-1.5 text-[13px] font-medium text-[#5b5e60] transition-colors hover:bg-[#dcdedf] hover:text-[#2c2f30] ${!finalizarHabilitado ? disabledCls : ""}`}
      >
        Finalizar
      </button>
      <button
        type="button"
        onClick={onEliminar}
        disabled={!eliminarHabilitado}
        className={`rounded-full bg-[#fde4e4] px-3.5 py-1.5 text-[13px] font-medium text-[#c43535] transition-colors hover:bg-[#fbd0d0] ${!eliminarHabilitado ? disabledCls : ""}`}
      >
        Eliminar
      </button>
    </div>
  );
}

// --- Modal de confirmación de acción sobre campaña ---

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
