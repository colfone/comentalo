"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Crear campaña — flujo 2 pasos: selecciona video / pega link → configura campaña
// Prototipo Design: screens/RegisterVideo.jsx + App.jsx Shell

// --- Helpers ---

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(s: number): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m === 0 ? `${sec}s` : sec > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${m}:00`;
}

function normalizeTitle(titulo: string): string {
  if (!titulo) return '';
  // NFKC colapsa letras matemáticas/estilizadas (𝗕Ó𝗫𝗘𝗥 → BÓXER) a ASCII;
  // sin esto toLowerCase() no tiene efecto sobre el bloque U+1D400–U+1D7FF.
  const plano = titulo.normalize('NFKC');
  const sinEmojis = plano
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}\u200D\uFE0F]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!sinEmojis) return '';
  const lower = sinEmojis.toLowerCase();
  // Primera letra (saltando puntuación inicial como ¡, ¿, comillas) va en mayúscula.
  const firstLetter = lower.search(/\p{L}/u);
  if (firstLetter < 0) return lower;
  return lower.slice(0, firstLetter) + lower[firstLetter].toUpperCase() + lower.slice(firstLetter + 1);
}

// --- Types ---

type Step = "select" | "form" | "success";

interface YouTubeVideo {
  id: string;
  titulo: string;
  thumbnail: string;
  vistas: number;
  likes: number;
  comentarios: number;
  duracion_segundos: number;
  ya_registrado: boolean;
  comentarios_desactivados: boolean;
}

interface RegistroResult {
  ok: boolean;
  titulo: string;
  vistas: number;
  campana_creada: boolean;
  mensaje: string;
}

// --- Icons (inline, same family as el resto de /dashboard) ---

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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const RefreshIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
const LinkIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
  </svg>
);
const SearchIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const EyeIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const MessageIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ZapIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
  </svg>
);
const CheckCircle = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.1V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

// --- Component ---

export default function CrearCampanaPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("select");
  const [misVideos, setMisVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistroResult | null>(null);

  useEffect(() => { fetchVideos(false); }, []);

  async function fetchVideos(refresh: boolean) {
    if (refresh) setRefreshing(true); else setLoadingVideos(true);
    setLoadError(null);
    try {
      const res = await fetch(refresh ? "/api/videos/mis-videos-youtube?refresh=1" : "/api/videos/mis-videos-youtube");
      const data = await res.json();
      if (!res.ok) { setLoadError(data.error || "Error al cargar."); return; }
      setMisVideos(data.videos || []);
    } catch { setLoadError("Error de conexión."); } finally {
      setLoadingVideos(false);
      setRefreshing(false);
    }
  }

  async function handleVerificarLink() {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) { setLinkError("Link de YouTube inválido."); return; }
    setVerificando(true); setLinkError(null);
    try {
      const res = await fetch(`/api/videos/verificar-canal?videoId=${videoId}`);
      const data = await res.json();
      if (!data.valido) { setLinkError(data.error || "No se pudo verificar el video."); return; }
      const verified: YouTubeVideo = {
        id: videoId,
        titulo: data.titulo || "Video sin título",
        thumbnail: data.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        vistas: 0,
        likes: 0,
        comentarios: 0,
        duracion_segundos: 0,
        ya_registrado: false,
        comentarios_desactivados: false,
      };
      setSelectedVideo(verified);
      setStep("form");
    } catch { setLinkError("Error de conexión."); } finally { setVerificando(false); }
  }

  function handleSelectVideo(video: YouTubeVideo) {
    if (video.ya_registrado || video.comentarios_desactivados || video.comentarios === 0) return;
    setSelectedVideo(video);
    setYoutubeUrl("");
    setLinkError(null);
    setStep("form");
  }

  async function handleSubmit() {
    const chosen = selectedVideo;
    if (!chosen) return;
    setSubmitting(true); setSubmitError(null);
    try {
      const res = await fetch("/api/videos/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtube_url: `https://www.youtube.com/watch?v=${chosen.id}`,
          descripcion: descripcion || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Error al registrar."); setSubmitting(false); return; }
      setResult(data); setStep("success");
    } catch { setSubmitError("Error de conexión."); } finally { setSubmitting(false); }
  }

  const chosen = selectedVideo;

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
        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/dashboard/intercambiar")}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
        >
          <ChevronLeft />
          Volver al dashboard
        </button>

        {/* Header */}
        <div className="pt-2 pb-5">
          <h1 className="font-headline text-4xl font-extrabold tracking-[-0.02em] text-[#2c2f30] sm:text-5xl">
            {step === "select" ? "Crear campaña" : step === "form" ? "Configura tu campaña de comentarios" : "Campaña creada"}
          </h1>
          {step === "select" && (
            <p className="mt-3 max-w-[640px] text-base text-[#5b5e60]">
              Selecciona un video de tu canal para empezar a recibir comentarios.
            </p>
          )}
        </div>

        {/* Progress segments */}
        {step !== "success" && (
          <div className="mb-7 flex max-w-[240px] gap-1.5">
            {[0, 1].map((i) => {
              const active = (step === "select" && i === 0) || step === "form";
              return (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #6200EE, #ac8eff)"
                      : "#e3e5e6",
                  }}
                />
              );
            })}
          </div>
        )}

        {/* ===== STEP 1: SELECT ===== */}
        {step === "select" && (
          <div>
            {/* Warning banner (amarillo) */}
            <div
              className="mb-5 flex items-start gap-3.5 rounded-2xl border-l-[3px] px-4 py-3.5"
              style={{
                background: "#fdf6d8",
                borderLeftColor: "#e3b21a",
                color: "#5a4a0c",
              }}
              role="note"
            >
              <span aria-hidden className="mt-0.5 shrink-0 text-lg leading-none">⚠️</span>
              <p className="text-sm leading-relaxed">
                Videos con comentarios desactivados no pueden registrarse. Actívalos desde YouTube Studio antes de continuar.
              </p>
            </div>

            {/* Refresh */}
            <div className="mb-3.5 flex justify-end">
              <button
                type="button"
                onClick={() => fetchVideos(true)}
                disabled={loadingVideos || refreshing}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold text-[#6200EE] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshIcon />
                {refreshing ? "Actualizando…" : "Actualizar lista"}
              </button>
            </div>

            {/* Loading */}
            {loadingVideos && (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#e3e5e6] border-t-[#6200EE]" />
              </div>
            )}

            {/* Error */}
            {loadError && !loadingVideos && (
              <div className="rounded-2xl border border-[rgba(171,173,174,0.2)] bg-white p-8 text-center">
                <p className="text-sm text-red-500">{loadError}</p>
                <button
                  type="button"
                  onClick={() => fetchVideos(true)}
                  className="mt-3 text-sm font-semibold text-[#6200EE] hover:underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Grid */}
            {!loadingVideos && !loadError && (
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {misVideos.map((video) => {
                  const disabled =
                    video.ya_registrado ||
                    video.comentarios_desactivados ||
                    video.comentarios === 0;
                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => handleSelectVideo(video)}
                      disabled={disabled}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white text-left transition-all duration-200 ${
                        disabled
                          ? "cursor-not-allowed opacity-60"
                          : "hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(44,47,48,0.1)]"
                      }`}
                      style={{ border: "1px solid rgba(171,173,174,0.2)" }}
                    >
                      {/* Thumb */}
                      <div className="relative aspect-video w-full overflow-hidden bg-[#e9ebec]">
                        <img
                          src={video.thumbnail}
                          alt={video.titulo}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        {video.duracion_segundos > 0 && (
                          <span className="absolute bottom-2.5 right-2.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                            {formatDuration(video.duracion_segundos)}
                          </span>
                        )}
                        {video.ya_registrado && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="rounded-full bg-green-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                              Ya registrado
                            </span>
                          </div>
                        )}
                        {!video.ya_registrado && video.comentarios_desactivados && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60">
                            <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                              Comentarios desactivados
                            </span>
                            <p className="text-[10px] text-white/80">No se puede registrar en Comentalo</p>
                          </div>
                        )}
                        {!video.ya_registrado && !video.comentarios_desactivados && video.comentarios === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="rounded-full bg-[#E87722] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                              Sin comentarios
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3
                          className="font-headline text-[15px] font-semibold leading-snug text-[#2c2f30]"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: "2.6em",
                          }}
                        >
                          {normalizeTitle(video.titulo)}
                        </h3>
                        {!video.ya_registrado && !video.comentarios_desactivados && video.comentarios === 0 ? (
                          <p className="text-xs font-medium text-[#E87722]">
                            Agrega al menos 1 comentario en YouTube para habilitar este video.
                          </p>
                        ) : (
                          <div className="flex items-center gap-2.5 text-xs text-[#8a8d8f]">
                            <span className="inline-flex items-center gap-1">
                              <EyeIcon /> {formatViews(video.vistas)}
                            </span>
                            <span className="inline-flex items-center gap-1">👍 {formatViews(video.likes || 0)}</span>
                            <span className="inline-flex items-center gap-1">
                              <MessageIcon /> {formatViews(video.comentarios || 0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Paste link tile */}
                <div
                  className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center"
                  style={{
                    border: "1.5px dashed #abadae",
                    background: "#eff1f2",
                  }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[#6200EE]"
                    style={{ background: "rgba(98,0,238,0.1)" }}
                  >
                    <LinkIcon />
                  </div>
                  <p className="font-headline text-base font-semibold text-[#2c2f30]">
                    Pega el link de YouTube
                  </p>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => { setYoutubeUrl(e.target.value); setLinkError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleVerificarLink(); }}
                    placeholder="https://www.youtube.com/watch?v=…"
                    disabled={verificando}
                    className="h-[42px] w-full rounded-xl bg-white px-3.5 text-[13px] text-[#2c2f30] placeholder-[#8a8d8f] outline-none transition-colors focus:ring-2 focus:ring-[#6200EE]/20"
                    style={{ border: "1px solid rgba(171,173,174,0.3)" }}
                  />
                  <button
                    type="button"
                    onClick={handleVerificarLink}
                    disabled={!youtubeUrl.trim() || verificando}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                  >
                    {verificando ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <SearchIcon />
                    )}
                    {verificando ? "Buscando…" : "Buscar"}
                  </button>
                  {linkError && <p className="text-xs text-red-500">{linkError}</p>}
                  <p className="text-[11px] leading-snug text-[#8a8d8f]">
                    Videos con comentarios desactivados no pueden registrarse.
                  </p>
                </div>
              </div>
            )}

            {misVideos.length === 0 && !loadingVideos && !loadError && (
              <p className="mt-8 text-center text-sm text-[#5b5e60]">
                No encontramos videos públicos recientes en tu canal.
              </p>
            )}
          </div>
        )}

        {/* ===== STEP 2: FORM ===== */}
        {step === "form" && chosen && (
          <div
            className="max-w-[680px] rounded-3xl bg-white p-7"
            style={{
              border: "1px solid rgba(171,173,174,0.2)",
              boxShadow: "0 12px 32px rgba(44,47,48,0.06)",
            }}
          >
            {/* Preview */}
            <div
              className="mb-6 flex items-center gap-4 rounded-2xl p-3.5"
              style={{ background: "#eff1f2", border: "1px solid rgba(171,173,174,0.25)" }}
            >
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl bg-[#e9ebec]">
                <img src={chosen.thumbnail} alt="" className="h-full w-full object-cover" />
                {chosen.duracion_segundos > 0 && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[10px] font-semibold text-white">
                    {formatDuration(chosen.duracion_segundos)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="font-headline text-[15px] font-semibold text-[#2c2f30]"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {normalizeTitle(chosen.titulo)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#5b5e60]">
                  <span>{formatViews(chosen.vistas || 0)} vistas</span>
                  <span>👍 {formatViews(chosen.likes || 0)}</span>
                  <span>💬 {formatViews(chosen.comentarios || 0)}</span>
                </p>
              </div>
            </div>

            {/* Notas para los comentaristas */}
            <div className="mb-6">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <label className="font-semibold text-[#2c2f30]">
                  Notas para los comentaristas
                  <span className="ml-1.5 font-medium text-[#6200EE]">(opcional)</span>
                </label>
                <span className="text-xs text-[#8a8d8f]">{descripcion.length}/300</span>
              </div>
              <p className="mb-2.5 text-xs leading-relaxed text-[#8a8d8f]">
                Cuéntales a los comentaristas cómo quieres que comenten tu video. Mientras más claro seas, mejores comentarios recibirás.
              </p>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value.slice(0, 300))}
                rows={4}
                maxLength={300}
                placeholder="Ej: Quiero comentarios que mencionen qué parte del video les gustó más. Tono cercano, como si me hablaran de tú."
                className="w-full resize-y rounded-xl bg-[#f5f6f7] px-3.5 py-3 text-sm leading-relaxed text-[#2c2f30] placeholder-[#8a8d8f] outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-[#6200EE]/20"
                style={{ border: "1px solid rgba(171,173,174,0.25)", minHeight: 112 }}
              />
            </div>

            {/* Warning YouTube Studio */}
            <div
              className="mb-6 flex items-start gap-3.5 rounded-2xl px-4 py-4"
              style={{
                background: "#fff4e8",
                borderLeft: "3px solid #E87722",
              }}
            >
              <span className="mt-0.5 shrink-0 text-[#E87722]">
                <ZapIcon size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#2c2f30]">
                  Antes de registrar — revisa tu configuración en YouTube Studio
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#5b5e60]">
                  Para que los comentarios se verifiquen automáticamente, asegúrate de que los comentarios de tu video
                  estén en modo &ldquo;Ninguno&rdquo; o &ldquo;Básico&rdquo;. Si tienes revisión manual activada, no
                  podrán verificarse.
                </p>
              </div>
            </div>

            {submitError && <p className="mb-4 text-sm text-red-500">{submitError}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <ZapIcon />
              )}
              {submitting ? "Registrando…" : "Crear campaña"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("select"); setSubmitError(null); }}
              disabled={submitting}
              className="mt-2.5 flex w-full items-center justify-center gap-1 py-2.5 text-sm font-medium text-[#5b5e60] transition-colors hover:text-[#2c2f30]"
            >
              <ChevronLeft size={14} />
              Cambiar video
            </button>
          </div>
        )}

        {/* ===== STEP 3: SUCCESS ===== */}
        {step === "success" && result && (
          <div className="flex items-center justify-center py-10">
            <div
              className="w-full max-w-lg rounded-3xl bg-white p-10 text-center"
              style={{
                border: "1px solid rgba(171,173,174,0.2)",
                boxShadow: "0 12px 32px rgba(44,47,48,0.06)",
              }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <CheckCircle />
              </div>
              <h2 className="font-headline text-2xl font-extrabold tracking-[-0.02em] text-[#2c2f30]">
                Campaña creada
              </h2>

              {chosen && (
                <div className="mx-auto mt-4 max-w-sm overflow-hidden rounded-2xl">
                  <img
                    src={`https://img.youtube.com/vi/${chosen.id}/hqdefault.jpg`}
                    alt={result.titulo}
                    className="w-full object-cover"
                  />
                </div>
              )}

              <p className="mt-4 text-sm font-semibold text-[#2c2f30]">{result.titulo}</p>
              <p className="mt-1 text-xs text-[#8a8d8f]">{result.vistas} vistas en YouTube</p>

              {result.campana_creada ? (
                <div className="mt-4 rounded-xl bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-700">
                    Tu campaña está activa. Ya puedes recibir comentarios.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-[#fff4e8] p-4">
                  <p className="text-sm font-medium text-[#E87722]">
                    Tu video se activará automáticamente cuando alcance 10 vistas en YouTube.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push("/dashboard/intercambiar")}
                className="mt-6 inline-flex rounded-xl px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
              >
                Ir a la cola
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
