"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Detalle del intercambio — layout 2 columnas (video + compose | sidebar)
// Prototipo Design: VideoDetail.jsx

// --- Types ---

interface Creador {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
  canal_url: string | null;
  suscriptores_al_registro: number;
}

interface VideoData {
  id: string;
  youtube_video_id: string;
  titulo: string;
  descripcion: string | null;
  tipo_intercambio: string | null;
  tono: string | null;
  duracion_segundos: number | null;
  vistas: number;
}

interface IntercambioData {
  id: string;
  texto_comentario: string;
  estado: string;
  timestamp_copia: string;
}

type Phase = "loading" | "error" | "compose" | "verifying" | "done" | "pendiente";

// --- Labels ---

const tipoLabels: Record<string, string> = {
  opinion: "Opinión",
  pregunta: "Pregunta",
  experiencia: "Experiencia personal",
};

const tonoLabels: Record<string, string> = {
  casual: "Casual",
  entusiasta: "Entusiasta",
  reflexivo: "Reflexivo",
};

const EMOJIS = ["👍","🔥","❤️","😂","😮","👏","🎯","💡","🙌","✨","🤔","😍","👀","💯","🚀","🎉","👌","🙏","😎","💪"];

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

// Seccion 5.4 del PROYECTO.md — tiempo minimo entre Copiar y Ya publique
function getMinWaitSeconds(duracionSegundos: number): number {
  if (duracionSegundos < 120) return 60;
  if (duracionSegundos < 300) return 120;
  if (duracionSegundos < 600) return 180;
  return 300; // techo maximo
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// --- Icons ---

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
const ChevronLeft = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 6-6 6 6 6" />
  </svg>
);
const ChevronRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const CopyIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const ThumbsUpIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 2 2.31l-1.47 8.4A2 2 0 0 1 18.38 22H7V10l5-9a3 3 0 0 1 3 3z" />
  </svg>
);

// --- Component ---

export default function DetalleIntercambioPage({
  params,
}: {
  params: Promise<{ campanaId: string }>;
}) {
  const { campanaId } = use(params);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [intercambio, setIntercambio] = useState<IntercambioData | null>(null);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [creador, setCreador] = useState<Creador | null>(null);

  const [comentario, setComentario] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [wentToYt, setWentToYt] = useState(false);

  const [resultMessage, setResultMessage] = useState("");
  const [cancelando, setCancelando] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Load intercambio ---
  useEffect(() => {
    (async () => {
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

        type IntercambioRaw = {
          id: string;
          texto_comentario: string;
          estado: string;
          timestamp_copia: string;
          campanas: {
            videos: {
              id: string;
              youtube_video_id: string;
              titulo: string;
              descripcion: string | null;
              tipo_intercambio: string | null;
              tono: string | null;
              duracion_segundos: number | null;
              vistas: number;
              usuarios: {
                id: string;
                nombre: string | null;
                avatar_url: string | null;
                canal_url: string | null;
                suscriptores_al_registro: number;
              } | null;
            } | null;
          } | null;
        };

        const { data: raw } = await supabase
          .from("intercambios")
          .select(`
            id, texto_comentario, estado, timestamp_copia,
            campanas!inner (
              videos!inner (
                id, youtube_video_id, titulo, descripcion,
                tipo_intercambio, tono, duracion_segundos, vistas,
                usuarios!inner (
                  id, nombre, avatar_url, canal_url, suscriptores_al_registro
                )
              )
            )
          `)
          .eq("campana_id", campanaId)
          .eq("comentarista_id", usuario.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!raw) {
          setErrorMsg("No encontramos este intercambio o ya no está activo.");
          setPhase("error");
          return;
        }

        const r = raw as unknown as IntercambioRaw;
        const v = r.campanas?.videos;
        const u = v?.usuarios;
        if (!v || !u) {
          setErrorMsg("Datos del video incompletos.");
          setPhase("error");
          return;
        }

        setIntercambio({
          id: r.id,
          texto_comentario: r.texto_comentario,
          estado: r.estado,
          timestamp_copia: r.timestamp_copia,
        });
        setVideo({
          id: v.id,
          youtube_video_id: v.youtube_video_id,
          titulo: v.titulo,
          descripcion: v.descripcion,
          tipo_intercambio: v.tipo_intercambio,
          tono: v.tono,
          duracion_segundos: v.duracion_segundos,
          vistas: v.vistas,
        });
        setCreador(u);

        // Estado inicial según la fila existente
        if (r.estado === "verificado") {
          setPhase("done");
        } else if (r.estado === "rechazado") {
          setResultMessage("Tu intercambio no pudo ser verificado tras 24 horas de reintentos.");
          setPhase("pendiente");
        } else if (r.estado === "pendiente") {
          setPhase("compose");
          // Si ya se copió previamente, recuperar estado
          if (r.texto_comentario && r.texto_comentario.length > 0) {
            setComentario(r.texto_comentario);
            setCopied(true);
            const minWait = getMinWaitSeconds(v.duracion_segundos || 0);
            const elapsed = Math.floor((Date.now() - new Date(r.timestamp_copia).getTime()) / 1000);
            setCountdown(Math.max(0, minWait - elapsed));
          }
        }
      } catch (e) {
        console.error(e);
        setErrorMsg("Error al cargar el intercambio.");
        setPhase("error");
      }
    })();
  }, [campanaId, router]);

  // --- Countdown tick ---
  const tick = useCallback(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (!copied || countdown <= 0) return;
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [copied, countdown, tick]);

  // --- Realtime: actualiza UI cuando verificaciones_pendientes cron cambie el estado ---
  useEffect(() => {
    if (!intercambio?.id) return;
    const supabaseBrowser = createSupabaseBrowserClient();
    const channel = supabaseBrowser
      .channel(`intercambio-${intercambio.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "intercambios", filter: `id=eq.${intercambio.id}` }, (payload) => {
        const newEstado = (payload.new as { estado?: string })?.estado;
        if (newEstado === "verificado") setPhase("done");
        else if (newEstado === "rechazado") {
          setResultMessage("Tu intercambio no pudo ser verificado tras 24 horas de reintentos.");
          setPhase("pendiente");
        }
      })
      .subscribe();
    return () => { supabaseBrowser.removeChannel(channel); };
  }, [intercambio?.id]);

  // --- Actions ---

  async function handleCopiar() {
    if (!intercambio || !video || saving) return;
    if (comentario.trim().length < 20) return;
    setSaving(true);
    try {
      try { await navigator.clipboard.writeText(comentario); } catch { /* fallback silencioso */ }
      const res = await fetch("/api/intercambios/copiar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intercambio_id: intercambio.id,
          texto_comentario: comentario,
          duracion_video_segundos: video.duracion_segundos || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al guardar el comentario.");
        return;
      }
      setCopied(true);
      setCountdown(getMinWaitSeconds(video.duracion_segundos || 0));
    } catch {
      alert("Error de conexión al guardar el comentario.");
    } finally {
      setSaving(false);
    }
  }

  function handleIrAYouTube() {
    if (!copied || !video) return;
    setWentToYt(true);
    window.open(`https://www.youtube.com/watch?v=${video.youtube_video_id}`, "_blank", "noopener,noreferrer");
  }

  async function handleYaPublique() {
    if (!intercambio || countdown > 0) return;
    setPhase("verifying");
    try {
      const res = await fetch("/api/intercambios/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intercambio_id: intercambio.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultMessage(data.error || "Error al verificar.");
        setPhase("compose");
        return;
      }
      if (data.resultado === "verificado") setPhase("done");
      else if (data.resultado === "pendiente") {
        setResultMessage(data.mensaje);
        setPhase("pendiente");
      }
    } catch {
      setResultMessage("Error de conexión al verificar.");
      setPhase("compose");
    }
  }

  async function handleCancelar() {
    if (!intercambio || cancelando) return;
    if (!confirm("¿Cancelar este intercambio? El video volverá a la cola para otro creador.")) return;
    setCancelando(true);
    try {
      const res = await fetch("/api/intercambios/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intercambio_id: intercambio.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || "Error al cancelar.");
        setCancelando(false);
        return;
      }
      router.push("/dashboard/intercambiar");
    } catch {
      alert("Error de conexión.");
      setCancelando(false);
    }
  }

  function insertEmoji(emoji: string) {
    const ta = textareaRef.current;
    if (ta && typeof ta.selectionStart === "number") {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = comentario.slice(0, start) + emoji + comentario.slice(end);
      setComentario(next);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + emoji.length;
        ta.setSelectionRange(pos, pos);
      });
    } else {
      setComentario((prev) => prev + emoji);
    }
  }

  const chars = comentario.length;
  const canCopy = chars >= 20 && !copied && !saving;
  const canPublish = copied && countdown === 0 && wentToYt;
  const disabledPublishReason =
    !copied ? "Copia el comentario primero" :
    countdown > 0 ? "Espera el tiempo mínimo" :
    !wentToYt ? "Visita YouTube primero" : "";

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      {/* ===== TOP FLOATING NAV ===== */}
      <header className="sticky top-3 z-30 mx-auto mt-3 max-w-[1240px] px-4">
        <div
          className="flex items-center gap-4 rounded-full border border-white/60 bg-white/80 px-5 py-2 pr-2.5 shadow-[0_8px_32px_rgba(44,47,48,0.08)]"
          style={{ backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)" }}
        >
          <Link href="/dashboard/intercambiar" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[10px] font-headline text-base font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
            >
              C
            </div>
            <span className="font-headline text-lg font-bold tracking-[-0.02em] text-[#2c2f30]">
              Comentalo
            </span>
          </Link>
          <nav className="ml-4 flex gap-0.5">
            <Link href="/dashboard/intercambiar" className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium transition-colors" style={{ background: "rgba(98, 0, 238, 0.08)", color: "#6200EE" }}>
              <SwapIcon /> Cola
            </Link>
            <a href="/dashboard/actividad" className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]">
              <InboxIcon /> Mi actividad
            </a>
            <a href="/dashboard/perfil" className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]">
              <UserIcon /> Perfil
            </a>
          </nav>
          <div className="flex-1" />
          <button type="button" aria-label="Notificaciones" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#e9ebec] text-[#5b5e60] transition-colors hover:bg-[#e3e5e6]">
            <BellIcon />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E87722] ring-2 ring-white" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-6 pb-16 pt-8">
        {/* Back link */}
        <button
          onClick={() => router.push("/dashboard/intercambiar")}
          className="mb-5 inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
        >
          <ChevronLeft />
          Volver a la cola
        </button>

        {phase === "loading" && (
          <div className="flex items-center justify-center py-32">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
          </div>
        )}

        {phase === "error" && (
          <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center">
            <p className="text-sm text-[#2c2f30]">{errorMsg}</p>
            <Link href="/dashboard/intercambiar" className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}>
              Volver a la cola
            </Link>
          </div>
        )}

        {phase !== "loading" && phase !== "error" && video && creador && (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "minmax(0, 1fr) 380px" }}
          >
            {/* ===== MAIN COLUMN ===== */}
            <div className="flex flex-col gap-4">
              {/* Video card */}
              <div className="rounded-3xl bg-white p-5">
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#e3e5e6]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_video_id}/maxresdefault.jpg`}
                    alt={video.titulo}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`; }}
                  />
                  {video.duracion_segundos && video.duracion_segundos > 0 && (
                    <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                      {formatDuration(video.duracion_segundos)}
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  {/* Creator */}
                  <div className="mb-3 flex flex-wrap items-center gap-2.5">
                    {creador.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={creador.avatar_url} alt={creador.nombre || "Creador"} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}>
                        {(creador.nombre || "C").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-[15px] font-semibold text-[#2c2f30]">
                      {creador.nombre || "Creador"}
                    </span>
                    {creador.suscriptores_al_registro > 0 && (
                      <>
                        <span className="inline-block h-[3px] w-[3px] rounded-full bg-[#abadae]" />
                        <span className="text-[13px] text-[#5b5e60]">
                          {formatSubs(creador.suscriptores_al_registro)} subs
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title + description */}
                  <h1 className="m-0 mb-3 font-headline text-[clamp(24px,2.5vw,32px)] font-bold leading-[1.15] tracking-[-0.015em] text-[#2c2f30]">
                    {video.titulo}
                  </h1>
                  {video.descripcion && (
                    <p className="m-0 text-[15px] leading-[1.55] text-[#5b5e60]">
                      {video.descripcion}
                    </p>
                  )}

                  {/* Meta chips */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {video.duracion_segundos && (
                      <span className="inline-flex items-center rounded-full bg-[#e3e5e6] px-3.5 py-[7px] text-[13px] font-medium text-[#5b5e60]">
                        {formatDuration(video.duracion_segundos)}
                      </span>
                    )}
                    {video.vistas > 0 && (
                      <span className="inline-flex items-center rounded-full bg-[#e3e5e6] px-3.5 py-[7px] text-[13px] font-medium text-[#5b5e60]">
                        {formatSubs(video.vistas)} vistas
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Compose section */}
              {phase === "compose" && (
                <div className="rounded-3xl bg-white p-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#5b5e60]">
                    Tu comentario
                  </p>
                  <h2 className="m-0 mb-2 font-headline text-2xl font-bold leading-[1.2] text-[#2c2f30]">
                    Escribe algo genuino
                  </h2>
                  <p className="mb-5 text-[14px] leading-[1.55] text-[#5b5e60]">
                    Mínimo 20 caracteres.
                  </p>

                  {/* Tipo y tono — etiquetas informativas (read-only) */}
                  {(video.tipo_intercambio || video.tono) && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {video.tipo_intercambio && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold" style={{ background: "rgba(98, 0, 238, 0.08)", color: "#6200EE" }}>
                          Tipo: {tipoLabels[video.tipo_intercambio] || video.tipo_intercambio}
                        </span>
                      )}
                      {video.tono && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold" style={{ background: "rgba(232, 119, 34, 0.1)", color: "#E87722" }}>
                          Tono: {tonoLabels[video.tono] || video.tono}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Textarea with emoji picker */}
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      disabled={copied}
                      rows={5}
                      placeholder="Escribe aquí lo que dirías del video después de verlo…"
                      className="w-full resize-y rounded-xl bg-[#eff1f2] px-4 py-3 pr-[52px] text-[15px] leading-[1.5] text-[#2c2f30] outline-none transition placeholder:text-[#8a8d8f] focus:bg-white focus:shadow-[inset_0_0_0_1px_rgba(98,0,238,0.4)] disabled:opacity-75"
                      style={{ minHeight: 140 }}
                    />
                    {!copied && (
                      <button
                        type="button"
                        onClick={() => setShowEmoji((v) => !v)}
                        aria-label="Insertar emoji"
                        className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] text-lg transition-colors"
                        style={{
                          background: showEmoji ? "rgba(98,0,238,0.08)" : "#e3e5e6",
                          color: showEmoji ? "#6200EE" : "#2c2f30",
                        }}
                      >
                        😊
                      </button>
                    )}
                    {showEmoji && !copied && (
                      <div
                        className="absolute right-2.5 top-[52px] z-10 grid gap-1 rounded-2xl border border-[#dcdedf] bg-white p-2.5 shadow-lg"
                        style={{ gridTemplateColumns: "repeat(5, 32px)" }}
                      >
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => insertEmoji(e)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-[#eff1f2]"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Char counter */}
                  <div className="mt-3 flex items-center justify-end">
                    <span
                      className="text-[13px] tabular-nums"
                      style={{ color: chars >= 20 ? "#6200EE" : "#8a8d8f" }}
                    >
                      {chars} / 20 mínimo
                    </span>
                  </div>

                  {/* ===== BUTTON 1: Copiar ===== */}
                  <button
                    onClick={handleCopiar}
                    disabled={!canCopy}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: copied ? "#e3e5e6" : "linear-gradient(135deg, #6200EE, #ac8eff)",
                      color: copied ? "#2c2f30" : "#ffffff",
                    }}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {saving ? "Guardando…" : copied ? "Copiado" : "Copiar comentario"}
                  </button>

                  {/* ===== Text entre los botones ===== */}
                  <p className="mt-4 mb-4 rounded-2xl bg-[#eff1f2] px-4 py-3.5 text-[13px] leading-[1.55] text-[#5b5e60]">
                    Pega tu comentario directamente en YouTube. Vuelve aquí cuando lo hayas publicado.
                  </p>

                  {/* ===== BUTTON 2: Ir a YouTube ===== */}
                  <button
                    onClick={handleIrAYouTube}
                    disabled={!copied}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-[#e3e5e6] disabled:text-[#8a8d8f]"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    Ir al video en YouTube
                    <ChevronRight />
                  </button>

                  {/* ===== Countdown + Ya publique (aparece tras copiar) ===== */}
                  {copied && (
                    <div className="mt-6 border-t border-[#e9ebec] pt-5">
                      {countdown > 0 ? (
                        <div className="flex items-center gap-4 rounded-2xl bg-[#eff1f2] p-4">
                          <span
                            className="font-headline text-3xl font-extrabold tabular-nums"
                            style={{ color: countdown <= 30 ? "#E87722" : "#6200EE" }}
                          >
                            {formatCountdown(countdown)}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[#2c2f30]">
                              Tiempo mínimo de visualización
                            </p>
                            <p className="text-[13px] text-[#5b5e60]">
                              Así el comentario cuenta para el algoritmo de YouTube.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 rounded-2xl bg-green-50 p-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                            <CheckIcon />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[#2c2f30]">
                              Ya puedes confirmar
                            </p>
                            <p className="text-[13px] text-[#5b5e60]">
                              {wentToYt
                                ? "Pulsa abajo cuando hayas publicado."
                                : "Visita YouTube primero para publicar tu comentario."}
                            </p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleYaPublique}
                        disabled={!canPublish}
                        title={disabledPublishReason}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #E87722, #f0a964)" }}
                      >
                        <CheckIcon />
                        Ya publiqué mi comentario
                      </button>
                    </div>
                  )}

                  {resultMessage && (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">{resultMessage}</p>
                  )}

                  {/* Cancelar */}
                  <button
                    onClick={handleCancelar}
                    disabled={cancelando}
                    className="mt-4 w-full text-center text-xs text-[#8a8d8f] transition-colors hover:text-red-500 disabled:opacity-50"
                  >
                    {cancelando ? "Cancelando…" : "Cancelar intercambio"}
                  </button>
                </div>
              )}

              {phase === "verifying" && (
                <div className="rounded-3xl bg-white p-10 text-center">
                  <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-3 border-[#e9ebec] border-t-[#6200EE]" />
                  <h2 className="m-0 mb-2 font-headline text-2xl font-bold text-[#2c2f30]">
                    Verificando con YouTube…
                  </h2>
                  <p className="m-0 text-sm text-[#5b5e60]">
                    Buscamos tu comentario en el video. Esto toma unos segundos.
                  </p>
                </div>
              )}

              {phase === "done" && (
                <div
                  className="rounded-3xl p-10 text-center text-white"
                  style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                    <CheckIcon size={28} />
                  </div>
                  <h2 className="m-0 mb-2 font-headline text-2xl font-bold">
                    Intercambio verificado ✨
                  </h2>
                  <p className="m-0 mb-6 text-sm opacity-90">
                    Acabas de activar un intercambio para tu próximo video.
                  </p>
                  <Link
                    href="/dashboard/intercambiar"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#6200EE]"
                  >
                    Volver a la cola
                  </Link>
                </div>
              )}

              {phase === "pendiente" && (
                <div className="rounded-3xl bg-white p-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E87722]/10 text-[#E87722]">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </div>
                  <h2 className="m-0 mb-2 font-headline text-xl font-bold text-[#2c2f30]">
                    Intercambio en revisión
                  </h2>
                  <p className="m-0 text-sm text-[#5b5e60]">{resultMessage}</p>
                  <p className="mt-2 text-xs text-[#8a8d8f]">
                    Esta página se actualizará cuando se verifique automáticamente.
                  </p>
                  <Link
                    href="/dashboard/intercambiar"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                  >
                    Volver a la cola
                  </Link>
                </div>
              )}
            </div>

            {/* ===== SIDEBAR ===== */}
            <aside className="flex flex-col gap-3 self-start lg:sticky lg:top-24">
              {/* Instrucciones del creador */}
              <div className="rounded-3xl bg-white p-[18px]">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.05em] text-[#5b5e60]">
                  Instrucciones del creador
                </p>
                <p className="text-[14px] leading-[1.55] text-[#2c2f30]">
                  {creador.nombre
                    ? `${creador.nombre.split(" ")[0]} prefiere`
                    : "Este creador prefiere"}{" "}
                  comentarios de tipo{" "}
                  <b className="font-semibold">
                    {video.tipo_intercambio ? tipoLabels[video.tipo_intercambio] : "opinión"}
                  </b>{" "}
                  con tono{" "}
                  <b className="font-semibold">
                    {video.tono ? tonoLabels[video.tono] : "casual"}
                  </b>
                  . Comenta algo que muestre que realmente viste el video.
                </p>
                <div className="mt-3.5 rounded-xl bg-[#eff1f2] p-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a8d8f]">
                    Tip
                  </p>
                  <p className="text-[13px] leading-[1.5] text-[#5b5e60]">
                    Si mencionas un minuto específico del video (ej. &ldquo;la parte del 4:20&rdquo;), los comentarios obtienen mucha más interacción.
                  </p>
                </div>
              </div>

              {/* Community Tips */}
              <div className="rounded-3xl p-[18px]" style={{ background: "rgba(232, 119, 34, 0.12)" }}>
                <div className="flex items-start gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: "#E87722" }}
                  >
                    <ThumbsUpIcon />
                  </div>
                  <div>
                    <p className="m-0 text-[14px] font-semibold text-[#2c2f30]">
                      Buena práctica
                    </p>
                    <p className="m-0 mt-0.5 text-[13px] leading-[1.5] text-[#5b5e60]">
                      Dale like al video antes de comentar. No es obligatorio — es parte de la cultura colaborativa de Comentalo.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
