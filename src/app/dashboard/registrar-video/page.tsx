"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// --- YouTube URL → video ID extraction (for manual link fallback) ---

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// --- Format view count ---

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// --- Types ---

type Step = "select" | "form" | "success";

interface YouTubeVideo {
  id: string;
  titulo: string;
  thumbnail: string;
  vistas: number;
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

// --- Tipo de intercambio y tono options ---

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

  // Step state
  const [step, setStep] = useState<Step>("select");

  // Step 1: Video selection
  const [misVideos, setMisVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  // Manual link fallback
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [manualVideo, setManualVideo] = useState<YouTubeVideo | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Step 2: Form
  const [descripcion, setDescripcion] = useState("");
  const [tipoIntercambio, setTipoIntercambio] = useState<string | null>(null);
  const [tono, setTono] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 3: Success
  const [result, setResult] = useState<RegistroResult | null>(null);

  // --- Load recent videos on mount ---

  useEffect(() => {
    fetchVideos(false);
  }, []);

  async function fetchVideos(refresh: boolean) {
    setLoadingVideos(true);
    setLoadError(null);

    try {
      const url = refresh
        ? "/api/videos/mis-videos-youtube?refresh=1"
        : "/api/videos/mis-videos-youtube";
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setLoadError(data.error || "Error al cargar tus videos.");
        return;
      }

      setMisVideos(data.videos || []);
    } catch {
      setLoadError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoadingVideos(false);
    }
  }

  // --- Manual link verification ---

  async function handleManualUrlChange(value: string) {
    setYoutubeUrl(value);
    setLinkError(null);
    setManualVideo(null);

    const videoId = extractVideoId(value);
    if (!videoId) return;

    setVerificando(true);

    try {
      const res = await fetch(
        `/api/videos/verificar-canal?videoId=${videoId}`
      );
      const data = await res.json();

      if (!data.valido) {
        setLinkError(data.error);
        return;
      }

      setManualVideo({
        id: videoId,
        titulo: data.titulo || "",
        thumbnail:
          data.thumbnail ||
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        vistas: 0,
        duracion_segundos: 0,
        ya_registrado: false,
      });
      setSelectedVideo(null); // deselect grid
    } catch {
      setLinkError("Error de conexion al verificar el video.");
    } finally {
      setVerificando(false);
    }
  }

  // --- Select video from grid ---

  function handleSelectVideo(video: YouTubeVideo) {
    if (video.ya_registrado) return;
    setSelectedVideo(video);
    setManualVideo(null); // deselect manual
    setYoutubeUrl("");
    setLinkError(null);
  }

  // --- Get the chosen video (grid or manual) ---

  function getChosenVideo(): YouTubeVideo | null {
    return selectedVideo || manualVideo;
  }

  function handleContinue() {
    const chosen = getChosenVideo();
    if (!chosen) return;
    setStep("form");
  }

  // --- Step 2: Submit ---

  async function handleSubmit() {
    const chosen = getChosenVideo();
    if (!chosen) return;

    if (!tipoIntercambio) {
      setSubmitError("Selecciona el tipo de intercambio que deseas.");
      return;
    }
    if (!tono) {
      setSubmitError("Selecciona el tono que prefieres para los comentarios.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/videos/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtube_url: `https://www.youtube.com/watch?v=${chosen.id}`,
          descripcion: descripcion || undefined,
          tipo_intercambio: tipoIntercambio,
          tono,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Error al registrar el video.");
        setSubmitting(false);
        return;
      }

      setResult(data);
      setStep("success");
    } catch {
      setSubmitError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Render ---

  const chosen = getChosenVideo();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
          <p className="mt-2 text-gray-400">Registrar un video</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          {/* ===== STEP 1: Select video ===== */}
          {step === "select" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Paso 1 — Selecciona un video de tu canal
                </h2>
                <button
                  onClick={() => fetchVideos(true)}
                  disabled={loadingVideos}
                  className="text-xs text-[#E87722] hover:underline disabled:opacity-50"
                >
                  Actualizar lista
                </button>
              </div>

              {/* Loading state */}
              {loadingVideos && (
                <div className="flex items-center justify-center gap-3 py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-[#6B3FA0]" />
                  <p className="text-sm text-gray-400">
                    Cargando tus videos recientes...
                  </p>
                </div>
              )}

              {/* Error state */}
              {loadError && !loadingVideos && (
                <div className="py-8 text-center">
                  <p className="text-sm text-red-400">{loadError}</p>
                  <button
                    onClick={() => fetchVideos(true)}
                    className="mt-3 text-sm text-[#E87722] hover:underline"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {/* Video grid */}
              {!loadingVideos && !loadError && (
                <>
                  {misVideos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {misVideos.map((video) => (
                        <button
                          key={video.id}
                          onClick={() => handleSelectVideo(video)}
                          disabled={video.ya_registrado}
                          className={`group relative rounded-lg border p-2 text-left transition-colors ${
                            video.ya_registrado
                              ? "cursor-not-allowed border-gray-800 bg-gray-800/50 opacity-60"
                              : selectedVideo?.id === video.id
                              ? "border-[#6B3FA0] bg-[#6B3FA0]/10"
                              : "border-gray-700 bg-gray-800 hover:border-gray-600"
                          }`}
                        >
                          <div className="relative">
                            <img
                              src={video.thumbnail}
                              alt={video.titulo}
                              className="h-24 w-full rounded object-cover"
                            />
                            {video.ya_registrado && (
                              <span className="absolute left-1 top-1 rounded bg-gray-900/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                                Ya registrado
                              </span>
                            )}
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs font-medium text-white">
                            {video.titulo}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-500">
                            {formatViews(video.vistas)} vistas
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-gray-500">
                      No encontramos videos publicos recientes en tu canal.
                    </p>
                  )}

                  {/* Manual link */}
                  <div className="mt-6 border-t border-gray-800 pt-4">
                    <p className="mb-2 text-sm text-gray-400">
                      ¿No ves tu video? Pega el link manualmente
                    </p>
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => handleManualUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#6B3FA0]"
                    />

                    {verificando && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-[#6B3FA0]" />
                        <p className="text-xs text-gray-400">
                          Verificando...
                        </p>
                      </div>
                    )}

                    {manualVideo && (
                      <div className="mt-3 flex gap-3 rounded-lg border border-green-500/20 bg-gray-800 p-3">
                        <img
                          src={manualVideo.thumbnail}
                          alt={manualVideo.titulo}
                          className="h-14 w-24 rounded object-cover"
                        />
                        <div className="flex flex-col justify-center">
                          <p className="text-xs font-medium text-white">
                            {manualVideo.titulo}
                          </p>
                          <p className="mt-0.5 text-[10px] text-green-400">
                            Video verificado
                          </p>
                        </div>
                      </div>
                    )}

                    {linkError && (
                      <p className="mt-2 text-sm text-red-400">{linkError}</p>
                    )}
                  </div>

                  {/* Continue button */}
                  {chosen && (
                    <button
                      onClick={handleContinue}
                      className="mt-6 w-full rounded-lg bg-[#6B3FA0] py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a3588]"
                    >
                      Continuar con &ldquo;{chosen.titulo.length > 40
                        ? chosen.titulo.slice(0, 40) + "..."
                        : chosen.titulo}&rdquo;
                    </button>
                  )}
                </>
              )}

              <a
                href="/dashboard"
                className="mt-4 block text-center text-sm text-gray-500 hover:text-gray-300"
              >
                Volver al dashboard
              </a>
            </>
          )}

          {/* ===== STEP 2: Form ===== */}
          {step === "form" && chosen && (
            <>
              <h2 className="mb-2 text-lg font-semibold text-white">
                Paso 2 — Configura tu intercambio
              </h2>

              {/* Preview reminder */}
              <div className="mb-6 flex gap-4 rounded-lg border border-gray-700 bg-gray-800 p-3">
                <img
                  src={chosen.thumbnail}
                  alt="Thumbnail"
                  className="h-16 w-28 rounded object-cover"
                />
                <div className="flex flex-col justify-center">
                  <p className="text-sm font-medium text-white">
                    {chosen.titulo}
                  </p>
                  {chosen.vistas > 0 && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatViews(chosen.vistas)} vistas
                    </p>
                  )}
                </div>
              </div>

              {/* Descripcion */}
              <label className="mb-1 block text-sm font-medium text-gray-300">
                ¿De que trata tu video?{" "}
                <span className="text-gray-500">(opcional)</span>
              </label>
              <div className="relative">
                <textarea
                  value={descripcion}
                  onChange={(e) =>
                    setDescripcion(e.target.value.slice(0, 300))
                  }
                  rows={3}
                  maxLength={300}
                  placeholder="Breve descripcion para que los demas creadores sepan de que va..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#6B3FA0]"
                />
                <span className="absolute bottom-2 right-3 text-xs text-gray-500">
                  {descripcion.length}/300
                </span>
              </div>

              {/* Tipo de intercambio */}
              <fieldset className="mt-5">
                <legend className="mb-2 text-sm font-medium text-gray-300">
                  Tipo de intercambio deseado
                </legend>
                <div className="flex flex-wrap gap-2">
                  {tiposIntercambio.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTipoIntercambio(t.value)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                        tipoIntercambio === t.value
                          ? "border-[#6B3FA0] bg-[#6B3FA0]/20 text-[#c4a6e8]"
                          : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Tono */}
              <fieldset className="mt-5">
                <legend className="mb-2 text-sm font-medium text-gray-300">
                  Tono preferido
                </legend>
                <div className="flex flex-wrap gap-2">
                  {tonos.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTono(t.value)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                        tono === t.value
                          ? "border-[#E87722] bg-[#E87722]/20 text-[#f0a964]"
                          : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Aviso moderacion — seccion 5.6 */}
              <div className="mt-6 rounded-lg border border-[#E87722]/30 bg-[#E87722]/10 p-4">
                <p className="text-xs text-[#f0a964]">
                  Asegurate de que tu video tenga los comentarios configurados en
                  modo Ninguno o Basico en YouTube Studio. Si tienes moderacion
                  estricta activada, los intercambios pueden no verificarse
                  automaticamente.
                </p>
              </div>

              {submitError && (
                <p className="mt-4 text-sm text-red-400">{submitError}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-[#6B3FA0] py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a3588] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Registrando..." : "Registrar video"}
              </button>

              <button
                onClick={() => {
                  setStep("select");
                  setSubmitError(null);
                }}
                disabled={submitting}
                className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-300"
              >
                Cambiar video
              </button>
            </>
          )}

          {/* ===== STEP 3: Success ===== */}
          {step === "success" && result && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <svg
                    className="h-6 w-6 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Video registrado
                </h2>
              </div>

              <p className="mb-2 text-sm text-white">{result.titulo}</p>
              <p className="mb-4 text-sm text-gray-400">
                {result.vistas} vistas en YouTube
              </p>

              {result.campana_creada ? (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                  <p className="text-sm text-green-300">
                    Primera campana lanzada. Tu video ya esta en la cola de
                    intercambios.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-[#E87722]/30 bg-[#E87722]/10 p-4">
                  <p className="text-sm text-[#f0a964]">
                    Tu video se activara automaticamente cuando alcance 10
                    vistas en YouTube. Mientras tanto, puedes participar en
                    intercambios de otros creadores.
                  </p>
                </div>
              )}

              <button
                onClick={() => router.push("/dashboard")}
                className="mt-6 w-full rounded-lg bg-[#6B3FA0] py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a3588]"
              >
                Ir al dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
