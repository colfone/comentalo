"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Mi actividad — 2 secciones:
//   Comentando → intercambios propios verificados (como comentarista)
//   Recibiendo → campañas propias con sus intercambios verificados + calificación

// --- Types ---

interface VideoInfo {
  id: string;
  youtube_video_id: string;
  titulo: string;
  duracion_segundos: number | null;
}

interface CreadorInfo {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
}

interface ComentandoRow {
  id: string;
  campana_id: string;
  texto_comentario: string;
  created_at: string;
  estado: string;
  video: VideoInfo;
  creador: CreadorInfo;
}

interface RecibiendoIntercambio {
  id: string;
  comentarista_id: string;
  comentarista_nombre: string;
  comentarista_canal: string | null;
  texto_comentario: string;
  estrellas: number | null;
  created_at: string;
}

interface RecibiendoCampana {
  campana_id: string;
  campana_estado: string;
  video_titulo: string;
  youtube_video_id: string;
  intercambios: RecibiendoIntercambio[];
}

type Section = "comentando" | "recibiendo";

// --- Helpers ---

// Duplicado de /dashboard/registrar-video — NFKC + emojis/banderas + sentence case.
function normalizeTitle(titulo: string): string {
  if (!titulo) return "";
  const plano = titulo.normalize("NFKC");
  const sinEmojis = plano
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}\u200D\uFE0F]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!sinEmojis) return "";
  const lower = sinEmojis.toLowerCase();
  const firstLetter = lower.search(/\p{L}/u);
  if (firstLetter < 0) return lower;
  return lower.slice(0, firstLetter) + lower[firstLetter].toUpperCase() + lower.slice(firstLetter + 1);
}

function getInitials(name: string | null): string {
  if (!name) return "C";
  return name.split(" ").map((w) => w[0] || "").join("").toUpperCase().slice(0, 2) || "C";
}

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hace instantes";
  if (mins < 60) return `Hace ${mins} min`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `Hace ${dias} d`;
  return new Date(iso).toLocaleDateString("es");
}

function formatDuration(sec: number | null): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${m} min`;
}

// --- Star labels — PROYECTO.md 6.2 ---

const STAR_LABELS: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

// --- Star rating (copiado de /dashboard/campana/[campanaId]) ---

function StarRating({
  value,
  disabled,
  onRate,
}: {
  value: number | null;
  disabled: boolean;
  onRate: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);

  if (value && value > 0) {
    return (
      <div className="inline-flex items-center gap-3 rounded-full bg-[#E87722]/10 px-4 py-2">
        <div className="flex gap-0.5 text-xl leading-none text-[#E87722]">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n}>{n <= value ? "★" : "☆"}</span>
          ))}
        </div>
        <span className="text-sm font-semibold text-[#E87722]">
          Calificado — {value}/5 estrellas
        </span>
      </div>
    );
  }

  const display = hover || 0;

  return (
    <div>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onClick={() => onRate(n)}
            aria-label={`${n} estrella${n > 1 ? "s" : ""} — ${STAR_LABELS[n]}`}
            className="text-4xl leading-none transition-transform duration-150 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: display >= n ? "#E87722" : "#e0e3e4" }}
          >
            ★
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#595c5d]">
        {display > 0 ? STAR_LABELS[display] : "Selecciona una calificación del 1 al 5"}
      </p>
    </div>
  );
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
const ChevronRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const PlusIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// --- Component ---

export default function ActividadPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("comentando");
  const [comentando, setComentando] = useState<ComentandoRow[]>([]);
  const [recibiendo, setRecibiendo] = useState<RecibiendoCampana[]>([]);
  const [calificandoId, setCalificandoId] = useState<string | null>(null);
  const [cerrandoCampanaId, setCerrandoCampanaId] = useState<string | null>(null);
  const [confirmCerrar, setConfirmCerrar] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
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

      // --- Comentando: intercambios del usuario verificados ---
      // RPC SECURITY DEFINER — los joins con RLS bloqueaban al comentarista.
      type IntercambioRpcRow = {
        id: string;
        campana_id: string;
        texto_comentario: string;
        created_at: string;
        estado: string;
        video: { id: string; youtube_video_id: string; titulo: string; duracion_segundos: number | null };
        creador: { id: string; nombre: string | null; avatar_url: string | null };
      };
      const { data: rpcRows } = await supabase.rpc("get_mis_intercambios_comentarista");
      const rows = (rpcRows as IntercambioRpcRow[] | null) ?? [];
      setComentando(rows.filter((r) => r.estado === "verificado"));

      // --- Recibiendo: mis campañas (excluyendo finalizadas/eliminadas) ---
      type VideoRow = {
        id: string;
        youtube_video_id: string;
        titulo: string;
        campanas: { id: string; estado: string; intercambios_completados: number; created_at: string }[];
      };
      const { data: misVideos } = await supabase
        .from("videos")
        .select(`
          id, youtube_video_id, titulo, created_at,
          campanas ( id, estado, intercambios_completados, created_at )
        `)
        .eq("usuario_id", usuario.id)
        .order("created_at", { ascending: false });

      const campanasAplanadas: {
        id: string;
        estado: string;
        video_titulo: string;
        youtube_video_id: string;
        created_at: string;
      }[] = [];
      for (const v of (misVideos as VideoRow[] | null) ?? []) {
        for (const c of v.campanas ?? []) {
          if (c.estado === "finalizada" || c.estado === "eliminada") continue;
          if ((c.intercambios_completados ?? 0) <= 0) continue;
          campanasAplanadas.push({
            id: c.id,
            estado: c.estado,
            video_titulo: v.titulo,
            youtube_video_id: v.youtube_video_id,
            created_at: c.created_at,
          });
        }
      }
      campanasAplanadas.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // N+1 por ahora — V1. /api/campanas/detalle es SECURITY DEFINER y
      // enriquece con comentarista_nombre/canal bypasseando RLS.
      const resultados = await Promise.all(
        campanasAplanadas.map(async (c): Promise<RecibiendoCampana | null> => {
          try {
            const res = await fetch(`/api/campanas/detalle?campana_id=${c.id}`);
            if (!res.ok) return null;
            const data = (await res.json()) as {
              intercambios?: Array<{
                id: string;
                comentarista_id: string;
                comentarista_nombre: string;
                comentarista_canal: string | null;
                texto_comentario: string;
                estado: string;
                estrellas: number | null;
                created_at: string;
              }>;
            };
            const verificados = (data.intercambios ?? []).filter((i) => i.estado === "verificado");
            if (verificados.length === 0) return null;
            return {
              campana_id: c.id,
              campana_estado: c.estado,
              video_titulo: c.video_titulo,
              youtube_video_id: c.youtube_video_id,
              intercambios: verificados.map((i) => ({
                id: i.id,
                comentarista_id: i.comentarista_id,
                comentarista_nombre: i.comentarista_nombre,
                comentarista_canal: i.comentarista_canal,
                texto_comentario: i.texto_comentario,
                estrellas: i.estrellas,
                created_at: i.created_at,
              })),
            };
          } catch {
            return null;
          }
        })
      );

      setRecibiendo(resultados.filter((r): r is RecibiendoCampana => r !== null));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCalificar(campanaId: string, intercambioId: string, estrellas: number) {
    setCalificandoId(intercambioId);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/intercambios/calificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intercambio_id: intercambioId, estrellas }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErrorMsg(d.error || "No se pudo calificar.");
        return;
      }
      setRecibiendo((prev) =>
        prev.map((c) =>
          c.campana_id !== campanaId
            ? c
            : {
                ...c,
                intercambios: c.intercambios.map((i) =>
                  i.id === intercambioId ? { ...i, estrellas } : i
                ),
              }
        )
      );
    } catch {
      setErrorMsg("Error de conexión.");
    } finally {
      setCalificandoId(null);
    }
  }

  async function handleCerrarCampana(campanaId: string) {
    setCerrandoCampanaId(campanaId);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/campanas/finalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campana_id: campanaId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "No se pudo cerrar la campaña.");
        return;
      }
      setRecibiendo((prev) => prev.filter((c) => c.campana_id !== campanaId));
      setConfirmCerrar(null);
    } catch {
      setErrorMsg("Error de conexión.");
    } finally {
      setCerrandoCampanaId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
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
            { id: "comentando" as Section, label: `Comentando (${comentando.length})` },
            { id: "recibiendo" as Section, label: `Recibiendo (${recibiendo.length})` },
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

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-[#c43535]">
            {errorMsg}
          </div>
        )}

        {/* ===== COMENTANDO ===== */}
        {section === "comentando" && (
          <div className="flex flex-col gap-3">
            {loading && (
              <div className="flex items-center justify-center rounded-3xl bg-white py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
              </div>
            )}

            {!loading && comentando.length === 0 && (
              <div className="rounded-3xl bg-white p-10 text-center">
                <p className="text-sm text-[#2c2f30]">
                  Aún no tienes comentarios verificados.
                </p>
                <a
                  href="/dashboard/intercambiar"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:shadow-[0_0_0_6px_rgba(98,0,238,0.12)] active:scale-[0.97]"
                  style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                >
                  Ir a la cola
                  <ChevronRight />
                </a>
              </div>
            )}

            {!loading &&
              comentando.map((i) => (
                <ComentandoCard key={i.id} intercambio={i} />
              ))}
          </div>
        )}

        {/* ===== RECIBIENDO ===== */}
        {section === "recibiendo" && (
          <div className="flex flex-col gap-5">
            {loading && (
              <div className="flex items-center justify-center rounded-3xl bg-white py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
              </div>
            )}

            {!loading && recibiendo.length === 0 && (
              <div className="rounded-3xl bg-white p-10 text-center">
                <p className="text-sm text-[#2c2f30]">
                  Aún no has recibido comentarios verificados en tus campañas.
                </p>
                <a
                  href="/dashboard/registrar-video"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:shadow-[0_0_0_6px_rgba(98,0,238,0.12)] active:scale-[0.97]"
                  style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                >
                  <PlusIcon />
                  Crear campaña
                </a>
              </div>
            )}

            {!loading &&
              recibiendo.map((c) => (
                <RecibiendoCard
                  key={c.campana_id}
                  campana={c}
                  calificandoId={calificandoId}
                  cerrandoCampanaId={cerrandoCampanaId}
                  onRate={(intercambioId, estrellas) =>
                    handleCalificar(c.campana_id, intercambioId, estrellas)
                  }
                  onRequestClose={() => setConfirmCerrar(c.campana_id)}
                />
              ))}
          </div>
        )}
      </main>

      <ConfirmCerrarModal
        open={confirmCerrar !== null}
        pending={cerrandoCampanaId !== null && cerrandoCampanaId === confirmCerrar}
        onCancel={() => {
          if (cerrandoCampanaId === null) setConfirmCerrar(null);
        }}
        onConfirm={() => {
          if (confirmCerrar) handleCerrarCampana(confirmCerrar);
        }}
      />
    </div>
  );
}

// --- Sub-components ---

function ComentandoCard({ intercambio }: { intercambio: ComentandoRow }) {
  const v = intercambio.video;

  return (
    <div
      className="grid gap-4 rounded-3xl bg-white p-4"
      style={{ gridTemplateColumns: "120px 1fr", alignItems: "start" }}
    >
      {/* Thumbnail */}
      <a
        href={`https://www.youtube.com/watch?v=${v.youtube_video_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-video overflow-hidden rounded-xl bg-[#e3e5e6]"
      >
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
      </a>

      {/* Body */}
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-[#2c2f30]">
          {normalizeTitle(v.titulo)}
        </div>
        <blockquote className="mt-2 rounded-xl bg-[#f5f6f7] p-3 text-[14px] leading-relaxed text-[#2c2f30]">
          &ldquo;{intercambio.texto_comentario}&rdquo;
        </blockquote>
      </div>
    </div>
  );
}

function RecibiendoCard({
  campana,
  calificandoId,
  cerrandoCampanaId,
  onRate,
  onRequestClose,
}: {
  campana: RecibiendoCampana;
  calificandoId: string | null;
  cerrandoCampanaId: string | null;
  onRate: (intercambioId: string, estrellas: number) => void;
  onRequestClose: () => void;
}) {
  const todosCalificados =
    campana.intercambios.length > 0 &&
    campana.intercambios.every((i) => (i.estrellas ?? 0) > 0);
  const cerrando = cerrandoCampanaId === campana.campana_id;
  // El endpoint /api/campanas/finalizar solo acepta activa/pausada.
  const puedeCerrar =
    todosCalificados &&
    ["activa", "pausada"].includes(campana.campana_estado);

  return (
    <article className="rounded-3xl bg-white p-5">
      {/* ===== Header: thumbnail + title ===== */}
      <header className="flex items-center gap-4">
        <a
          href={`https://www.youtube.com/watch?v=${campana.youtube_video_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-video w-[140px] shrink-0 overflow-hidden rounded-xl bg-[#e3e5e6]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${campana.youtube_video_id}/mqdefault.jpg`}
            alt={campana.video_titulo}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/60">
            <PlayIcon size={24} />
          </div>
        </a>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 line-clamp-2 font-headline text-[18px] font-bold leading-[1.25] text-[#2c2f30]">
            {normalizeTitle(campana.video_titulo)}
          </h3>
          <p className="mt-1 text-[13px] text-[#5b5e60]">
            {campana.intercambios.length} comentario
            {campana.intercambios.length === 1 ? "" : "s"} recibido
            {campana.intercambios.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {/* ===== Intercambios verificados ===== */}
      <ul className="mt-5 flex flex-col gap-3">
        {campana.intercambios.map((i) => {
          const initials = getInitials(i.comentarista_nombre);
          return (
            <li
              key={i.id}
              className="rounded-2xl border border-[rgba(171,173,174,0.18)] bg-[#f8f9fa] p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  {i.comentarista_canal ? (
                    <a
                      href={i.comentarista_canal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] font-bold text-[#2c2f30] hover:text-[#6200EE]"
                    >
                      {i.comentarista_nombre}
                    </a>
                  ) : (
                    <p className="text-[14px] font-bold text-[#2c2f30]">
                      {i.comentarista_nombre}
                    </p>
                  )}
                  <p className="text-xs text-[#5b5e60]">
                    {tiempoRelativo(i.created_at)}
                  </p>
                </div>
              </div>

              {i.texto_comentario && (
                <blockquote className="mt-3 rounded-xl bg-white p-3 text-[14px] leading-relaxed text-[#2c2f30]">
                  &ldquo;{i.texto_comentario}&rdquo;
                </blockquote>
              )}

              <div className="mt-4">
                <StarRating
                  value={i.estrellas}
                  disabled={calificandoId === i.id}
                  onRate={(n) => onRate(i.id, n)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* ===== Cerrar campaña ===== */}
      {puedeCerrar && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onRequestClose}
            disabled={cerrando}
            className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-3 text-[13px] font-semibold text-white transition-all hover:shadow-[0_0_0_6px_rgba(98,0,238,0.12)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
          >
            {cerrando ? "Cerrando…" : "Cerrar campaña"}
            {!cerrando && <ChevronRight />}
          </button>
        </div>
      )}
    </article>
  );
}

// --- Modal de confirmación (mismo patrón que el resto del dashboard) ---

function ConfirmCerrarModal({
  open,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
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
  }, [open, onCancel, pending]);

  if (!open) return null;

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
      aria-labelledby="confirm-cerrar-title"
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
          id="confirm-cerrar-title"
          className="font-headline text-xl font-extrabold tracking-[-0.02em] text-[#2c2f30]"
        >
          Cerrar campaña
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#5b5e60]">
          La campaña quedará finalizada en tu historial. Esta acción no se puede deshacer.
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
