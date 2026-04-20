"use client";

import { use, useEffect, useRef, useState } from "react";
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

type Phase = "loading" | "error" | "watch" | "compose" | "copied" | "verifying" | "done" | "rechazado";

// --- YouTube IFrame Player API types ---
// Shim mínimo para no introducir un .d.ts global. Sólo lo que usamos.

type YTPlayer = { destroy: () => void };

type YTPlayerConstructor = new (
  elementId: string,
  opts: {
    videoId: string;
    width: string | number;
    height: string | number;
    playerVars?: { rel?: 0 | 1; modestbranding?: 0 | 1 };
    events?: {
      onReady?: () => void;
      onStateChange?: (event: { data: number }) => void;
    };
  }
) => YTPlayer;

interface YTApi {
  Player: YTPlayerConstructor;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

interface YTWindow extends Window {
  YT?: YTApi;
  onYouTubeIframeAPIReady?: () => void;
}

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
  const [wentToYt, setWentToYt] = useState(false);
  const [verificandoEn, setVerificandoEn] = useState<number | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [primerIntentoFallido, setPrimerIntentoFallido] = useState(false);

  const [resultMessage, setResultMessage] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [motivationalOpen, setMotivationalOpen] = useState(false);
  const [miCanalUrl, setMiCanalUrl] = useState<string | null>(null);
  const [secondsWatched, setSecondsWatched] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Load intercambio ---
  useEffect(() => {
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/"); return; }

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id, canal_url")
          .eq("auth_id", user.id)
          .maybeSingle<{ id: string; canal_url: string | null }>();
        if (!usuario) { router.replace("/verificar-canal"); return; }
        setMiCanalUrl(usuario.canal_url);

        // RPC con SECURITY DEFINER — bypasea RLS de campanas/videos/usuarios
        // que solo dejan ver los rows al dueño del video. Ver migración
        // 20260419210000_rpc_get_intercambio_detalle.sql.
        type DetalleResult =
          | {
              ok: true;
              intercambio: { id: string; texto_comentario: string; estado: string; timestamp_copia: string };
              video: {
                id: string;
                youtube_video_id: string;
                titulo: string;
                descripcion: string | null;
                tipo_intercambio: string | null;
                tono: string | null;
                duracion_segundos: number | null;
                vistas: number;
              };
              creador: {
                id: string;
                nombre: string | null;
                avatar_url: string | null;
                canal_url: string | null;
                suscriptores_al_registro: number;
              };
            }
          | { ok: false; error: string; mensaje: string };

        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "get_intercambio_detalle",
          { p_campana_id: campanaId }
        );

        if (rpcError) {
          console.error("RPC get_intercambio_detalle error:", rpcError);
          setErrorMsg("Error al cargar el intercambio.");
          setPhase("error");
          return;
        }

        const result = rpcData as DetalleResult | null;
        if (!result || !result.ok) {
          setErrorMsg(
            (result && !result.ok ? result.mensaje : null) ||
              "No encontramos este intercambio o ya no está activo."
          );
          setPhase("error");
          return;
        }

        const i = result.intercambio;
        const v = result.video;
        const u = result.creador;

        setIntercambio(i);
        setVideo(v);
        setCreador(u);

        // Estado inicial según la fila existente
        if (i.estado === "verificado") {
          setPhase("done");
        } else if (i.estado === "rechazado") {
          // Restaura el comentario y marca copied/wentToYt para que
          // "Volver a intentarlo" permita re-verificar sin re-copiar.
          if (i.texto_comentario && i.texto_comentario.length > 0) {
            setComentario(i.texto_comentario);
          }
          setCopied(true);
          setWentToYt(true);
          setPhase("rechazado");
        } else if (i.estado === "pendiente") {
          // Primera visita → watch. Si el usuario ya había empezado (tiene
          // texto guardado), saltamos directo a compose para no forzarlo a
          // ver 30s de video otra vez.
          if (i.texto_comentario && i.texto_comentario.length > 0) {
            setComentario(i.texto_comentario);
            setPhase("compose");
          } else {
            setPhase("watch");
          }
        }
      } catch (e) {
        console.error(e);
        setErrorMsg("Error al cargar el intercambio.");
        setPhase("error");
      }
    })();
  }, [campanaId, router]);

  // --- Realtime: actualiza UI cuando verificaciones_pendientes cron cambie el estado ---
  useEffect(() => {
    if (!intercambio?.id) return;
    const supabaseBrowser = createSupabaseBrowserClient();
    const channel = supabaseBrowser
      .channel(`intercambio-${intercambio.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "intercambios", filter: `id=eq.${intercambio.id}` }, (payload) => {
        const newEstado = (payload.new as { estado?: string })?.estado;
        if (newEstado === "verificado") setPhase("done");
        else if (newEstado === "rechazado") setPhase("rechazado");
      })
      .subscribe();
    return () => { supabaseBrowser.removeChannel(channel); };
  }, [intercambio?.id]);

  // --- YouTube IFrame Player API ---
  // Carga la API una sola vez (el script puede ya estar en el DOM si el
  // usuario navegó desde otra página de la app que lo usara) y monta el
  // player sobre el div #youtube-player. Detectamos el primer PLAY para
  // habilitar el botón "Copiar comentario".
  useEffect(() => {
    if (!video) return;
    const videoId = video.youtube_video_id;
    const w = window as unknown as YTWindow;

    let cancelled = false;
    let player: YTPlayer | null = null;
    let watchInterval: ReturnType<typeof setInterval> | null = null;

    const startWatchInterval = () => {
      if (watchInterval !== null) return;
      watchInterval = setInterval(() => {
        setSecondsWatched((s) => s + 1);
      }, 1000);
    };
    const stopWatchInterval = () => {
      if (watchInterval !== null) {
        clearInterval(watchInterval);
        watchInterval = null;
      }
    };

    const initPlayer = () => {
      if (cancelled) return;
      if (!w.YT || !w.YT.Player) return;
      if (!document.getElementById("youtube-player")) return;
      player = new w.YT.Player("youtube-player", {
        videoId,
        width: "100%",
        height: "360",
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {},
          onStateChange: (event) => {
            if (!w.YT) return;
            if (event.data === w.YT.PlayerState.PLAYING) {
              startWatchInterval();
            } else if (
              event.data === w.YT.PlayerState.PAUSED ||
              event.data === w.YT.PlayerState.ENDED
            ) {
              stopWatchInterval();
            }
          },
        },
      });
    };

    if (w.YT && w.YT.Player) {
      // API ya cargada en esta sesión.
      initPlayer();
    } else {
      // Registrar callback global y cargar script si no existe.
      w.onYouTubeIframeAPIReady = initPlayer;
      const existing = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      stopWatchInterval();
      if (w.onYouTubeIframeAPIReady === initPlayer) {
        w.onYouTubeIframeAPIReady = undefined;
      }
      if (player) {
        try {
          player.destroy();
        } catch {
          /* noop */
        }
      }
    };
  }, [video]);

  // --- Tick del countdown de 30s tras presionar "Ya publiqué" ---
  // Al llegar a 0 dispara handleYaPublique automáticamente.
  useEffect(() => {
    if (verificandoEn === null) return;
    if (verificandoEn <= 0) {
      setVerificandoEn(null);
      handleYaPublique();
      return;
    }
    const id = setTimeout(
      () => setVerificandoEn((n) => (n === null ? null : n - 1)),
      1000
    );
    return () => clearTimeout(id);
    // handleYaPublique es closure estable sobre intercambio; no lo incluimos
    // en deps para evitar reinicios del timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificandoEn]);

  // --- Actions ---

  async function handleCopiar() {
    if (!video || saving) return;
    if (comentario.trim().length < 20) return;
    setSaving(true);
    try {
      try { await navigator.clipboard.writeText(comentario); } catch { /* fallback silencioso */ }
      // Ya no persistimos el texto en DB — el intercambio se crea sólo
      // cuando YouTube confirma el comentario en /verificar.
      setCopied(true);
      setPhase("copied");
    } finally {
      setSaving(false);
    }
  }

  function handleIrAYouTube() {
    if (!copied || !video) return;
    setMotivationalOpen(true);
  }

  function abrirVideoConfirmado() {
    if (!video) return;
    setWentToYt(true);
    setMotivationalOpen(false);
    window.open(`https://www.youtube.com/watch?v=${video.youtube_video_id}`, "_blank", "noopener,noreferrer");
  }

  async function handleYaPublique() {
    if (!video || verificando || verificandoEn !== null) return;
    setVerificando(true);
    try {
      const res = await fetch("/api/intercambios/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campana_id: campanaId,
          texto_comentario: comentario,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResultMessage(data.error || "Error al verificar.");
        return;
      }
      if (data.resultado === "verificado") {
        setPhase("done");
        return;
      }
      // Resultado no verificado (la API responde "pendiente"):
      //   — 1er intento: activamos countdown de 30s para 2º intento automático.
      //   — 2º intento: mostramos pantalla de rechazo.
      if (primerIntentoFallido) {
        setPhase("rechazado");
      } else {
        setPrimerIntentoFallido(true);
        setVerificandoEn(30);
      }
    } catch {
      setResultMessage("Error de conexión al verificar.");
    } finally {
      setVerificando(false);
    }
  }

  async function handleCancelar() {
    if (!intercambio || cancelando) return;
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
        setConfirmCancelar(false);
        return;
      }
      router.push("/dashboard/intercambiar");
    } catch {
      alert("Error de conexión.");
      setCancelando(false);
      setConfirmCancelar(false);
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
  const canPublish = copied && wentToYt;
  const disabledPublishReason =
    !copied ? "Copia el comentario primero" :
    !wentToYt ? "Visita YouTube primero" : "";
  const enCountdown = verificandoEn !== null;
  const botonOcupado = enCountdown || verificando;
  // Handle tipo "@agenciajaque1142" extraído de una URL como
  // "https://www.youtube.com/@agenciajaque1142". Si no podemos
  // parsear, caemos a la URL completa, y si no hay URL, null.
  const miCanalHandle = miCanalUrl
    ? miCanalUrl.match(/@[^/?#]+/)?.[0] ?? miCanalUrl
    : null;

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
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
            style={{ gridTemplateColumns: phase === "compose" ? "minmax(0, 1fr)" : "minmax(0, 1fr) 380px" }}
          >
            {/* ===== MAIN COLUMN ===== */}
            <div className="flex flex-col gap-4">
              {/* Video card */}
              <div className="rounded-3xl bg-white p-5">
                <div className="relative overflow-hidden rounded-lg bg-[#e3e5e6]" style={{ height: 360 }}>
                  {/* El player se monta aquí vía YT.Player (ver useEffect). */}
                  <div id="youtube-player" className="h-full w-full" />
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

              {/* ===== Pantalla 1: Ver el video ===== */}
              {phase === "watch" && (
                <div className="rounded-3xl bg-white p-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#5b5e60]">
                    Paso 1 de 3
                  </p>
                  <h2 className="m-0 mb-2 font-headline text-2xl font-bold leading-[1.2] text-[#2c2f30]">
                    Ve el video antes de comentar
                  </h2>
                  <p className="mb-5 text-[14px] leading-[1.55] text-[#5b5e60]">
                    Mira al menos 30 segundos para entender de qué trata.
                  </p>

                  {/* Progress bar — secondsWatched acumula aunque el usuario pause */}
                  <div className="rounded-xl bg-[#eff1f2] p-4">
                    <div className="mb-2 flex items-center justify-between text-[13px] text-[#5b5e60]">
                      <span>Viendo el video...</span>
                      <span className="tabular-nums font-medium">
                        {Math.min(secondsWatched, 30)}s / 30 segundos
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#e3e5e6]">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (secondsWatched / 30) * 100)}%`,
                          background: "#6200EE",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setPhase("compose")}
                    disabled={secondsWatched < 30}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed"
                    style={{
                      background: secondsWatched >= 30
                        ? "linear-gradient(135deg, #6200EE, #ac8eff)"
                        : "#e5e7eb",
                      color: secondsWatched >= 30 ? "#ffffff" : "#9ca3af",
                    }}
                  >
                    {secondsWatched >= 30 ? "Comentar este video →" : "Comentar este video"}
                  </button>
                </div>
              )}

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

                  {/* Instrucciones del creador — esenciales, encima del textarea.
                      Reemplaza al panel lateral en esta fase. */}
                  {((video.tipo_intercambio && video.tono) || video.descripcion) && (
                    <div className="mb-5 rounded-xl bg-[#eff1f2] p-4">
                      {video.tipo_intercambio && video.tono && (
                        <p className="m-0 text-[14px] leading-[1.55] text-[#2c2f30]">
                          <b className="font-semibold">
                            {creador.canal_url?.match(/@[^/?#]+/)?.[0] ??
                              (creador.nombre ? creador.nombre.split(" ")[0] : "Este creador")}
                          </b>{" "}
                          prefiere comentarios de tipo{" "}
                          <b className="font-semibold">
                            {tipoLabels[video.tipo_intercambio] || video.tipo_intercambio}
                          </b>{" "}
                          con tono{" "}
                          <b className="font-semibold">
                            {tonoLabels[video.tono] || video.tono}
                          </b>.
                        </p>
                      )}
                      {video.descripcion && (
                        <div
                          className={`${
                            video.tipo_intercambio && video.tono ? "mt-3 " : ""
                          }rounded-lg bg-white p-3`}
                        >
                          <p className="m-0 whitespace-pre-wrap text-[13px] leading-[1.5] text-[#5b5e60]">
                            {video.descripcion}
                          </p>
                        </div>
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

                  {/* ===== BUTTON: Copiar ===== */}
                  <button
                    onClick={handleCopiar}
                    disabled={!canCopy}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                  >
                    <CopyIcon />
                    {saving ? "Guardando…" : "Copiar comentario"}
                  </button>

                  {/* Cancelar */}
                  <button
                    onClick={() => setConfirmCancelar(true)}
                    disabled={cancelando}
                    className="mt-4 w-full text-center text-xs text-[#8a8d8f] transition-colors hover:text-red-500 disabled:opacity-50"
                  >
                    {cancelando ? "Cancelando…" : "Cancelar intercambio"}
                  </button>
                </div>
              )}

              {/* ===== Pantalla 3: Verificar ===== */}
              {phase === "copied" && (
                <div className="rounded-3xl bg-white p-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#5b5e60]">
                    Paso 3 de 3
                  </p>
                  <h2 className="m-0 mb-2 font-headline text-2xl font-bold leading-[1.2] text-[#2c2f30]">
                    Publica tu comentario en YouTube
                  </h2>
                  <p className="mb-5 text-[14px] leading-[1.55] text-[#5b5e60]">
                    Tu comentario ya está copiado. Pégalo en YouTube y vuelve aquí para verificarlo.
                  </p>

                  {/* Display del comentario copiado (sólo lectura) */}
                  <div className="rounded-xl bg-[#eff1f2] p-4 text-[15px] leading-[1.5] text-[#2c2f30] whitespace-pre-wrap">
                    {comentario}
                  </div>

                  {/* Ir a YouTube */}
                  <button
                    onClick={handleIrAYouTube}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    Ir al video en YouTube
                    <ChevronRight />
                  </button>

                  <p className="mt-3 text-center text-sm leading-[1.5] text-[#8a8d8f]">
                    Pega tu comentario directamente en YouTube. Vuelve aquí cuando lo hayas publicado.
                  </p>

                  {/* Ya publiqué — mismo flujo de 2 intentos con countdown de 30s */}
                  <button
                    onClick={handleYaPublique}
                    disabled={!canPublish || botonOcupado}
                    title={disabledPublishReason}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: botonOcupado ? "#6b7280" : "#16a34a" }}
                  >
                    {enCountdown && verificandoEn !== null && verificandoEn > 0 ? (
                      `Buscando tu comentario... ${verificandoEn}s`
                    ) : botonOcupado ? (
                      "Verificando..."
                    ) : (
                      <>
                        <CheckIcon />
                        Ya publiqué mi comentario
                      </>
                    )}
                  </button>

                  {resultMessage && (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">{resultMessage}</p>
                  )}

                  <button
                    onClick={() => setConfirmCancelar(true)}
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
                    Comentario verificado ✨
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

              {phase === "rechazado" && (
                <div className="rounded-3xl bg-white p-8">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E87722]/10 text-[#E87722]">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </svg>
                  </div>
                  <h2 className="m-0 mb-4 text-center font-headline text-xl font-bold text-[#2c2f30]">
                    No pudimos verificar tu comentario
                  </h2>
                  <ul className="mx-auto max-w-[560px] space-y-3 text-sm leading-[1.55] text-[#5b5e60]">
                    {miCanalHandle && (
                      <li>
                        <strong className="font-semibold text-[#2c2f30]">Canal incorrecto</strong> — tu canal registrado en Comentalo es <strong className="font-semibold text-[#2c2f30]">{miCanalHandle}</strong>. Si tienes múltiples canales en YouTube, asegúrate de haber comentado con ese canal específico.
                      </li>
                    )}
                    <li>
                      <strong className="font-semibold text-[#2c2f30]">Verificaste muy rápido</strong> — YouTube tarda unos segundos en indexar comentarios nuevos. Puedes volver a intentarlo.
                    </li>
                    <li>
                      <strong className="font-semibold text-[#2c2f30]">El texto no coincide</strong> — el comentario publicado en YouTube debe ser exactamente el que copiaste desde Comentalo.
                    </li>
                    <li>
                      <strong className="font-semibold text-[#2c2f30]">YouTube retuvo tu comentario</strong> — ocurre con cuentas nuevas o comentarios que YouTube detecta como sospechosos. Intenta desde una cuenta con más actividad en YouTube.
                    </li>
                    <li>
                      <strong className="font-semibold text-[#2c2f30]">El video tiene moderación estricta</strong> — el creador puede tener activada la revisión manual de comentarios en YouTube Studio.
                    </li>
                  </ul>
                  <div className="mx-auto mt-6 flex max-w-[360px] flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Vuelve a compose (saltamos watch — ya vimos el video).
                        // Resetea copied/wentToYt para que pueda editar el
                        // textarea y re-copiar, y primerIntentoFallido para
                        // tener otro ciclo completo de 2 intentos.
                        setResultMessage("");
                        setPrimerIntentoFallido(false);
                        setCopied(false);
                        setWentToYt(false);
                        setPhase("compose");
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
                      style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                    >
                      Volver a intentarlo
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancelar(true)}
                      className="w-full rounded-2xl bg-[#e3e5e6] py-3 text-sm font-semibold text-[#5b5e60] transition-colors hover:bg-[#dcdedf] hover:text-[#2c2f30]"
                    >
                      Cancelar intercambio
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* ===== SIDEBAR ===== */}
            {/* En el Paso 2 (compose) el sidebar desaparece — las instrucciones
                del creador se muestran encima del textarea en su lugar. */}
            {phase !== "compose" && (
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
            )}
          </div>
        )}
      </main>

      <ConfirmCancelarModal
        open={confirmCancelar}
        pending={cancelando}
        onCancel={() => setConfirmCancelar(false)}
        onConfirm={handleCancelar}
      />

      <MotivacionalModal
        open={motivationalOpen}
        onCancel={() => setMotivationalOpen(false)}
        onAbrirVideo={abrirVideoConfirmado}
      />
    </div>
  );
}

// --- Modal de confirmación de cancelación ---
// (duplica el patrón de /dashboard/perfil y /dashboard/actividad;
// consolidar cuando se cree shared lib)

function ConfirmCancelarModal({
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
      aria-labelledby="confirm-cancelar-title"
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
          id="confirm-cancelar-title"
          className="font-headline text-xl font-extrabold tracking-[-0.02em] text-[#2c2f30]"
        >
          Cancelar intercambio
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#5b5e60]">
          ¿Cancelar este intercambio? El video volverá a la cola para otro creador.
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

// --- Modal motivacional antes de abrir el video en YouTube ---
// Dismissable (ESC / backdrop). Un solo botón: abrir video en YouTube.

function MotivacionalModal({
  open,
  onCancel,
  onAbrirVideo,
}: {
  open: boolean;
  onCancel: () => void;
  onAbrirVideo: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{
        background: "rgba(20, 20, 24, 0.48)",
        animation: "comentaloFade 160ms ease-out forwards",
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="motivacional-title"
    >
      <style>{`
        @keyframes comentaloFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes comentaloPop {
          from { opacity: 0; transform: scale(0.96) translateY(6px) }
          to   { opacity: 1; transform: scale(1) translateY(0) }
        }
      `}</style>
      <div
        className="w-full max-w-[440px] rounded-3xl bg-white p-7 shadow-[0_24px_64px_rgba(20,20,24,0.24)]"
        style={{ animation: "comentaloPop 220ms cubic-bezier(0.2, 0.9, 0.3, 1.12) forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="motivacional-title"
          className="font-headline text-xl font-extrabold tracking-[-0.02em] text-[#2c2f30]"
        >
          Antes de comentar
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#5b5e60]">
          Ver el video y darle like no es obligatorio, pero ayuda al creador y fortalece nuestra comunidad.
        </p>
        <button
          type="button"
          onClick={onAbrirVideo}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
        >
          Abrir video en YouTube →
        </button>
      </div>
    </div>
  );
}
