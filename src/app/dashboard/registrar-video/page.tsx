"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
}

interface RegistroResult {
  ok: boolean;
  titulo: string;
  vistas: number;
  campana_creada: boolean;
  mensaje: string;
}

const tiposIntercambio = [
  { value: "opinion", label: "Opinion" },
  { value: "pregunta", label: "Pregunta" },
  { value: "experiencia", label: "Experiencia personal" },
] as const;

const tonos = [
  { value: "casual", label: "Casual" },
  { value: "entusiasta", label: "Entusiasta" },
  { value: "reflexivo", label: "Reflexivo" },
] as const;

export default function RegistrarVideoPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("select");
  const [misVideos, setMisVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [manualVideo, setManualVideo] = useState<YouTubeVideo | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [descripcion, setDescripcion] = useState("");
  const [tipoIntercambio, setTipoIntercambio] = useState<string | null>(null);
  const [tono, setTono] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistroResult | null>(null);

  useEffect(() => { fetchVideos(false); }, []);

  async function fetchVideos(refresh: boolean) {
    setLoadingVideos(true); setLoadError(null);
    try {
      const res = await fetch(refresh ? "/api/videos/mis-videos-youtube?refresh=1" : "/api/videos/mis-videos-youtube");
      const data = await res.json();
      if (!res.ok) { setLoadError(data.error || "Error al cargar."); return; }
      setMisVideos(data.videos || []);
    } catch { setLoadError("Error de conexion."); } finally { setLoadingVideos(false); }
  }

  async function handleManualUrlChange(value: string) {
    setYoutubeUrl(value); setLinkError(null); setManualVideo(null);
    const videoId = extractVideoId(value);
    if (!videoId) return;
    setVerificando(true);
    try {
      const res = await fetch(`/api/videos/verificar-canal?videoId=${videoId}`);
      const data = await res.json();
      if (!data.valido) { setLinkError(data.error); return; }
      setManualVideo({ id: videoId, titulo: data.titulo || "", thumbnail: data.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, vistas: 0, likes: 0, comentarios: 0, duracion_segundos: 0, ya_registrado: false });
      setSelectedVideo(null);
    } catch { setLinkError("Error de conexion."); } finally { setVerificando(false); }
  }

  function handleSelectVideo(video: YouTubeVideo) {
    if (video.ya_registrado) return;
    setSelectedVideo(video); setManualVideo(null); setYoutubeUrl(""); setLinkError(null);
  }

  function getChosenVideo(): YouTubeVideo | null { return selectedVideo || manualVideo; }

  async function handleSubmit() {
    const chosen = getChosenVideo();
    if (!chosen) return;
    if (!tipoIntercambio) { setSubmitError("Selecciona el tipo de intercambio."); return; }
    if (!tono) { setSubmitError("Selecciona el tono."); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const res = await fetch("/api/videos/registrar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ youtube_url: `https://www.youtube.com/watch?v=${chosen.id}`, descripcion: descripcion || undefined, tipo_intercambio: tipoIntercambio, tono }) });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Error al registrar."); setSubmitting(false); return; }
      setResult(data); setStep("success");
    } catch { setSubmitError("Error de conexion."); } finally { setSubmitting(false); }
  }

  const chosen = getChosenVideo();

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="font-headline text-xl font-bold tracking-tighter text-[#2c2f30]">
              Comentalo<span className="text-[#E87722]">.</span>
            </a>
            <a href="/dashboard" className="hidden items-center gap-1 text-sm text-[#595c5d] transition-colors hover:text-[#2c2f30] md:flex">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
              Volver al dashboard
            </a>
          </div>
          <p className="text-sm font-medium text-[#2c2f30]">Registrar video</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-24 pb-12">
        {/* ===== STEP 1: SELECT ===== */}
        {step === "select" && (
          <div className="transition-opacity duration-300">
            {/* Header */}
            <div className="mb-8">
              <span className="inline-block rounded-full bg-[#6200EE]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#6200EE]">Paso 01</span>
              <h1 className="mt-3 font-headline text-4xl font-extrabold tracking-tighter text-[#2c2f30]">Selecciona un video de tu canal</h1>
              <p className="mt-2 text-sm text-[#595c5d]">Elige el video para el que quieres activar intercambios. Sincronizamos tus ultimas subidas automaticamente.</p>
              <div className="mt-4 h-px bg-black/5" />
            </div>

            {/* Refresh button */}
            <div className="mb-4 flex justify-end">
              <button onClick={() => fetchVideos(true)} disabled={loadingVideos} className="flex items-center gap-1.5 text-xs font-medium text-[#6200EE] transition-colors hover:text-[#6200EE]/70 disabled:opacity-50">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>
                Actualizar lista
              </button>
            </div>

            {/* Loading */}
            {loadingVideos && (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#eff1f2] border-t-[#6200EE]" />
              </div>
            )}

            {/* Error */}
            {loadError && !loadingVideos && (
              <div className="rounded-2xl border border-[rgba(171,173,174,0.15)] bg-white p-8 text-center">
                <p className="text-sm text-red-500">{loadError}</p>
                <button onClick={() => fetchVideos(true)} className="mt-3 text-sm font-medium text-[#6200EE] hover:underline">Reintentar</button>
              </div>
            )}

            {/* Grid */}
            {!loadingVideos && !loadError && (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {misVideos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleSelectVideo(video)}
                      disabled={video.ya_registrado}
                      className={`group relative rounded-2xl border bg-white text-left transition-all duration-200 ${
                        video.ya_registrado
                          ? "cursor-not-allowed border-[rgba(171,173,174,0.15)] opacity-60"
                          : selectedVideo?.id === video.id
                          ? "border-[#6200EE] border-2 shadow-lg shadow-[#6200EE]/10"
                          : "border-[rgba(171,173,174,0.15)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#6200EE]/10"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative overflow-hidden rounded-t-2xl">
                        <img
                          src={video.thumbnail}
                          alt={video.titulo}
                          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Duration badge */}
                        {video.duracion_segundos > 0 && (
                          <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-white">
                            {formatDuration(video.duracion_segundos)}
                          </span>
                        )}
                        {/* Ya registrado overlay */}
                        {video.ya_registrado && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                              YA REGISTRADO
                            </span>
                          </div>
                        )}
                        {/* Selected check + overlay button */}
                        {selectedVideo?.id === video.id && (
                          <>
                            <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#6200EE]">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                            </div>
                            <div
                              onClick={(e) => { e.stopPropagation(); setStep("form"); }}
                              className="absolute bottom-0 left-0 right-0 py-2 text-center text-sm font-bold text-white transition-opacity duration-200"
                              style={{ background: "linear-gradient(135deg, rgba(98,0,238,0.95), rgba(172,142,255,0.95))" }}
                            >
                              Seleccionar →
                            </div>
                          </>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <p className="line-clamp-2 text-sm font-bold text-[#2c2f30]" style={{ textTransform: "none", fontFamily: "var(--font-body)" }}>{video.titulo}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-[#595c5d]">
                          <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                            {formatViews(video.vistas)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Manual link card */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#595c5d]/20 bg-[#eff1f2] p-6 text-center">
                    <svg className="mb-3 h-8 w-8 text-[#6200EE]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.757 8.3" /></svg>
                    <p className="mb-3 font-headline text-sm font-bold text-[#2c2f30]">Pega el link de YouTube</p>
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => handleManualUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full rounded-xl border border-[rgba(171,173,174,0.15)] bg-white px-3 py-2.5 text-xs text-[#2c2f30] placeholder-[#595c5d]/50 outline-none focus:border-[#6200EE]"
                    />
                    <button
                      onClick={() => handleManualUrlChange(youtubeUrl)}
                      disabled={!youtubeUrl.trim() || verificando}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      {verificando ? "Buscando..." : "Buscar"}
                    </button>
                    {verificando && <p className="mt-2 text-xs text-[#595c5d]">Verificando...</p>}
                    {manualVideo && (
                      <div className="mt-3 flex w-full items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-2">
                        <img src={manualVideo.thumbnail} alt="" className="h-10 w-16 rounded-lg object-cover" />
                        <div className="min-w-0 text-left">
                          <p className="truncate text-xs font-medium text-[#2c2f30]">{manualVideo.titulo}</p>
                          <p className="text-[10px] text-green-600">Verificado</p>
                        </div>
                      </div>
                    )}
                    {linkError && <p className="mt-2 text-xs text-red-500">{linkError}</p>}
                  </div>
                </div>

                {misVideos.length === 0 && !manualVideo && (
                  <p className="mt-8 text-center text-sm text-[#595c5d]">No encontramos videos publicos recientes en tu canal.</p>
                )}

                {/* Continue for manual video (no overlay available) */}
                {manualVideo && !selectedVideo && (
                  <button
                    onClick={() => setStep("form")}
                    className="mt-8 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                  >
                    Continuar con video manual
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== STEP 2: FORM ===== */}
        {step === "form" && chosen && (
          <div className="transition-opacity duration-300">
            <div className="mb-8">
              <span className="inline-block rounded-full bg-[#6200EE]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#6200EE]">Paso 02</span>
              <h1 className="mt-3 font-headline text-3xl font-extrabold tracking-tighter text-[#2c2f30]">Configura tu intercambio</h1>
            </div>

            <div className="rounded-3xl bg-white p-8" style={{ border: "1px solid rgba(171,173,174,0.2)", boxShadow: "0 4px 24px rgba(44,47,48,0.08)" }}>
              {/* Preview */}
              <div className="mb-6 flex items-center gap-4 rounded-2xl p-4" style={{ background: "#f5f6f7", border: "1px solid rgba(171,173,174,0.3)" }}>
                <img src={chosen.thumbnail} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2c2f30]">{chosen.titulo}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-[#595c5d]">
                    <span>{formatViews(chosen.vistas || 0)} vistas</span>
                    <span>·</span>
                    <span>👍 {formatViews(chosen.likes || 0)} likes</span>
                    <span>·</span>
                    <span>💬 {formatViews(chosen.comentarios || 0)} comentarios</span>
                  </p>
                </div>
              </div>

              {/* Descripcion */}
              <label className="mb-1 block text-sm font-semibold text-[#2c2f30]">
                ¿De que trata tu video? <span className="font-normal text-[#595c5d]">(opcional)</span>
              </label>
              <div className="relative">
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value.slice(0, 300))}
                  rows={3}
                  maxLength={300}
                  placeholder="Breve descripcion para los demas creadores..."
                  className="w-full rounded-xl border border-[rgba(171,173,174,0.15)] bg-[#f5f6f7] px-4 py-3 text-sm text-[#2c2f30] placeholder-[#595c5d]/50 outline-none focus:border-[#6200EE] focus:bg-white"
                />
                <span className="absolute bottom-2 right-3 text-xs text-[#595c5d]">{descripcion.length}/300</span>
              </div>

              {/* Tipo */}
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-semibold text-[#2c2f30]">Tipo de intercambio deseado</legend>
                <div className="flex flex-wrap gap-2">
                  {tiposIntercambio.map((t) => (
                    <button key={t.value} type="button" onClick={() => setTipoIntercambio(t.value)}
                      className={`rounded-xl px-5 py-2.5 text-sm transition-all ${
                        tipoIntercambio === t.value
                          ? "border-[#6200EE] bg-[#6200EE] font-bold text-white"
                          : "font-medium text-[#2c2f30] hover:border-[#6200EE] hover:text-[#6200EE]"
                      }`}
                      style={tipoIntercambio === t.value
                        ? { border: "1.5px solid #6200EE", boxShadow: "0 4px 12px rgba(98,0,238,0.25)" }
                        : { border: "1.5px solid #abadae", background: "#fff" }
                      }
                    >{t.label}</button>
                  ))}
                </div>
              </fieldset>

              {/* Tono */}
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-semibold text-[#2c2f30]">Tono preferido</legend>
                <div className="flex flex-wrap gap-2">
                  {tonos.map((t) => (
                    <button key={t.value} type="button" onClick={() => setTono(t.value)}
                      className={`rounded-xl px-5 py-2.5 text-sm transition-all ${
                        tono === t.value
                          ? "border-[#6200EE] bg-[#6200EE] font-bold text-white"
                          : "font-medium text-[#2c2f30] hover:border-[#6200EE] hover:text-[#6200EE]"
                      }`}
                      style={tono === t.value
                        ? { border: "1.5px solid #6200EE", boxShadow: "0 4px 12px rgba(98,0,238,0.25)" }
                        : { border: "1.5px solid #abadae", background: "#fff" }
                      }
                    >{t.label}</button>
                  ))}
                </div>
              </fieldset>

              {/* Moderacion warning */}
              <div className="mt-6 rounded-xl border-l-[3px] border-[#E87722] bg-[#fff8f3] p-4">
                <p className="text-xs font-semibold text-[#2c2f30]">
                  Antes de registrar — revisa tu configuracion en YouTube Studio
                </p>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#2c2f30]/80">
                  Para que los intercambios se verifiquen automaticamente, asegurate de que los comentarios de tu video esten en modo &ldquo;Ninguno&rdquo; o &ldquo;Basico&rdquo;. Si tienes revision manual activada, los intercambios no podran verificarse.
                </p>
              </div>

              {submitError && <p className="mt-4 text-sm text-red-500">{submitError}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>
                {submitting ? "Registrando..." : "Registrar video y activar intercambios"}
              </button>

              <button
                onClick={() => { setStep("select"); setSubmitError(null); }}
                disabled={submitting}
                className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-[#595c5d] hover:text-[#2c2f30]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                Cambiar video
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: SUCCESS ===== */}
        {step === "success" && result && (
          <div className="flex items-center justify-center py-16">
            <div className="w-full max-w-lg rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              <h2 className="font-headline text-2xl font-extrabold text-[#2c2f30]">Video registrado</h2>

              {chosen && (
                <div className="mx-auto mt-4 max-w-sm overflow-hidden rounded-2xl">
                  <img src={`https://img.youtube.com/vi/${chosen.id}/hqdefault.jpg`} alt={result.titulo} className="w-full object-cover" />
                </div>
              )}

              <p className="mt-4 text-sm font-medium text-[#2c2f30]">{result.titulo}</p>
              <p className="mt-1 text-xs text-[#595c5d]">{result.vistas} vistas en YouTube</p>

              {result.campana_creada ? (
                <div className="mt-4 rounded-xl bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-700">Tu campana esta activa. Ya puedes recibir intercambios.</p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-[#fff8f3] p-4">
                  <p className="text-sm text-[#E87722]">Tu video se activara automaticamente cuando alcance 10 vistas en YouTube.</p>
                </div>
              )}

              <button
                onClick={() => router.push("/dashboard")}
                className="mt-6 inline-flex rounded-xl px-8 py-3 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
              >
                Ir al dashboard
              </button>
            </div>
          </div>
        )}
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
