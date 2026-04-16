"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// --- Tabla de tiempos minimos (seccion 5.4 del PROYECTO.md) ---

function getMinWaitSeconds(duracionSegundos: number): number {
  if (duracionSegundos < 120) return 60; // < 2 min → 1 min
  if (duracionSegundos < 300) return 120; // 2-5 min → 2 min
  if (duracionSegundos < 600) return 180; // 5-10 min → 3 min
  return 300; // 10+ min → 5 min (techo maximo)
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// --- Label helpers ---

const tipoLabels: Record<string, string> = {
  opinion: "Opinion",
  pregunta: "Pregunta",
  experiencia: "Experiencia personal",
};

const tonoLabels: Record<string, string> = {
  casual: "Casual",
  entusiasta: "Entusiasta",
  reflexivo: "Reflexivo",
};

// --- Types ---

type Step = "loading" | "blocked" | "empty" | "video" | "write" | "copied" | "verificando" | "done" | "pendiente";

interface AssignedVideo {
  id: string;
  youtube_video_id: string;
  titulo: string;
  descripcion: string | null;
  tipo_intercambio: string | null;
  tono: string | null;
  duracion_segundos: number | null;
  vistas: number;
  thumbnail: string;
  youtube_url: string;
}

export default function IntercambiarPage() {
  const [step, setStep] = useState<Step>("loading");
  const [blockedMessage, setBlockedMessage] = useState("");
  const [intercambioId, setIntercambioId] = useState<string | null>(null);
  const [video, setVideo] = useState<AssignedVideo | null>(null);

  // Write step
  const [comentario, setComentario] = useState("");

  // Copied step — countdown
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cancel + verification
  const [cancelando, setCancelando] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  // --- Cancel intercambio ---

  async function handleCancelar() {
    if (!intercambioId) return;
    setCancelando(true);

    try {
      const res = await fetch("/api/intercambios/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intercambio_id: intercambioId }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data.error || "Error al cancelar.");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      alert("Error de conexion.");
    } finally {
      setCancelando(false);
    }
  }

  // --- Supabase Realtime subscription (seccion 6F.3) ---

  useEffect(() => {
    if (!intercambioId) return;

    const supabaseBrowser = createSupabaseBrowserClient();

    const channel = supabaseBrowser
      .channel(`intercambio-${intercambioId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "intercambios",
          filter: `id=eq.${intercambioId}`,
        },
        (payload) => {
          const newEstado = payload.new?.estado;
          if (newEstado === "verificado") {
            setStep("done");
          } else if (newEstado === "rechazado") {
            setResultMessage(
              "Tu intercambio no pudo ser verificado tras 24 horas de reintentos."
            );
            setStep("blocked");
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [intercambioId]);

  // --- Load: call RPC to get assigned video ---

  useEffect(() => {
    assignVideo();
  }, []);

  async function assignVideo() {
    setStep("loading");

    try {
      const res = await fetch("/api/intercambios/asignar");
      const data = await res.json();

      if (!res.ok) {
        setBlockedMessage(data.error || "Error al asignar intercambio.");
        setStep("blocked");
        return;
      }

      if (!data.ok) {
        if (data.error_code === "LIMITE_PENDIENTES_ALCANZADO") {
          setBlockedMessage(
            "Tienes 3 intercambios pendientes de verificacion. Espera a que se resuelvan antes de continuar."
          );
          setStep("blocked");
        } else if (data.error_code === "USUARIO_SIN_VIDEO_ACTIVO") {
          setBlockedMessage(data.mensaje);
          setStep("blocked");
        } else if (data.error_code === "COLA_VACIA") {
          setStep("empty");
        } else {
          setBlockedMessage(data.mensaje || "Error inesperado.");
          setStep("blocked");
        }
        return;
      }

      setIntercambioId(data.intercambio_id);
      setVideo(data.video);
      setStep("video");
    } catch {
      setBlockedMessage("Error de conexion. Intenta de nuevo.");
      setStep("blocked");
    }
  }

  // --- Copiar ---

  async function handleCopiar() {
    if (!intercambioId || !video || comentario.length < 20) return;

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(comentario);
      setCopied(true);
    } catch {
      // Fallback — still continue, user can copy manually
    }

    // Save to backend — must succeed before moving to next step
    try {
      const res = await fetch("/api/intercambios/copiar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intercambio_id: intercambioId,
          texto_comentario: comentario,
          duracion_video_segundos: video.duracion_segundos || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(
          data.error ||
            "Error al guardar el comentario. Intenta de nuevo."
        );
        return;
      }
    } catch {
      alert("Error de conexion al guardar el comentario. Intenta de nuevo.");
      return;
    }

    // Start countdown — only after backend confirmed save
    const waitSeconds = getMinWaitSeconds(video.duracion_segundos || 0);
    setCountdown(waitSeconds);
    setStep("copied");
  }

  // --- Countdown timer ---

  const tickCountdown = useCallback(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (step !== "copied") return;

    // Start interval when entering copied step
    timerRef.current = setInterval(tickCountdown, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, tickCountdown]);

  // --- Ya publique — calls POST /api/intercambios/verificar ---

  async function handleYaPublique() {
    if (!intercambioId) return;
    setStep("verificando");

    try {
      const res = await fetch("/api/intercambios/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intercambio_id: intercambioId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResultMessage(data.error || "Error al verificar.");
        setStep("blocked");
        return;
      }

      if (data.resultado === "verificado") {
        setStep("done");
      } else if (data.resultado === "pendiente") {
        setResultMessage(data.mensaje);
        setStep("pendiente");
      }
    } catch {
      setResultMessage("Error de conexion al verificar. Intenta de nuevo.");
      setStep("blocked");
    }
  }

  // --- Render ---

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
          <p className="mt-2 text-gray-400">Participar en un intercambio</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          {/* ===== LOADING ===== */}
          {step === "loading" && (
            <div className="flex items-center justify-center gap-3 py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-[#6B3FA0]" />
              <p className="text-sm text-gray-400">
                Buscando un video para ti...
              </p>
            </div>
          )}

          {/* ===== BLOCKED ===== */}
          {step === "blocked" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <svg
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-300">{resultMessage || blockedMessage}</p>
              <a
                href="/dashboard"
                className="mt-6 inline-block text-sm text-[#E87722] hover:underline"
              >
                Volver al dashboard
              </a>
            </div>
          )}

          {/* ===== EMPTY QUEUE ===== */}
          {step === "empty" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
                <svg
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-300">
                No hay videos disponibles en este momento. Vuelve pronto.
              </p>
              <a
                href="/dashboard"
                className="mt-6 inline-block text-sm text-[#E87722] hover:underline"
              >
                Volver al dashboard
              </a>
            </div>
          )}

          {/* ===== STEP 1: Video assigned ===== */}
          {step === "video" && video && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-white">
                Video asignado
              </h2>

              {/* Video preview */}
              <div className="mb-4 overflow-hidden rounded-lg border border-gray-700">
                <img
                  src={video.thumbnail}
                  alt={video.titulo}
                  className="h-48 w-full object-cover"
                />
              </div>

              <h3 className="mb-2 text-base font-medium text-white">
                {video.titulo}
              </h3>

              {video.descripcion && (
                <p className="mb-3 text-sm text-gray-400">
                  {video.descripcion}
                </p>
              )}

              {/* Tipo + tono badges */}
              <div className="mb-4 flex flex-wrap gap-2">
                {video.tipo_intercambio && (
                  <span className="rounded-lg border border-[#6B3FA0]/30 bg-[#6B3FA0]/10 px-3 py-1 text-xs text-[#c4a6e8]">
                    {tipoLabels[video.tipo_intercambio] ||
                      video.tipo_intercambio}
                  </span>
                )}
                {video.tono && (
                  <span className="rounded-lg border border-[#E87722]/30 bg-[#E87722]/10 px-3 py-1 text-xs text-[#f0a964]">
                    Tono: {tonoLabels[video.tono] || video.tono}
                  </span>
                )}
              </div>

              {/* Community nudge */}
              <div className="mb-4 rounded-lg border border-[#6B3FA0]/20 bg-[#6B3FA0]/5 p-3">
                <p className="text-xs text-[#c4a6e8]">
                  Recuerda darle Like al video antes de comentar. Es un buen
                  gesto entre creadores y hace que tu participacion sea mas
                  genuina.
                </p>
              </div>

              <button
                onClick={() => setStep("write")}
                className="w-full rounded-lg bg-[#6B3FA0] py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a3588]"
              >
                Escribir comentario
              </button>

              <button
                onClick={handleCancelar}
                disabled={cancelando}
                className="mt-3 w-full text-center text-sm text-gray-500 hover:text-red-400 disabled:opacity-50"
              >
                {cancelando
                  ? "Cancelando..."
                  : "No puedo comentar este video"}
              </button>
            </>
          )}

          {/* ===== STEP 2: Write comment ===== */}
          {step === "write" && video && (
            <>
              <h2 className="mb-2 text-lg font-semibold text-white">
                Escribe tu comentario
              </h2>

              {/* Mini video reminder */}
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-2">
                <img
                  src={video.thumbnail}
                  alt={video.titulo}
                  className="h-10 w-16 rounded object-cover"
                />
                <p className="truncate text-xs text-gray-400">{video.titulo}</p>
              </div>

              {/* Tipo + tono instruction */}
              {(video.tipo_intercambio || video.tono) && (
                <p className="mb-3 text-xs text-gray-400">
                  El creador busca:{" "}
                  {video.tipo_intercambio && (
                    <span className="text-[#c4a6e8]">
                      {tipoLabels[video.tipo_intercambio] ||
                        video.tipo_intercambio}
                    </span>
                  )}
                  {video.tipo_intercambio && video.tono && " — "}
                  {video.tono && (
                    <span className="text-[#f0a964]">
                      tono {tonoLabels[video.tono] || video.tono}
                    </span>
                  )}
                </p>
              )}

              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={5}
                placeholder="Escribe un comentario genuino sobre el video..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#6B3FA0]"
              />

              {/* Emoji selector */}
              <div className="mt-2 flex flex-wrap gap-1">
                {["👍", "🔥", "❤️", "💯", "🙌", "😊", "👏", "🎯", "💪", "✅"].map(
                  (emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setComentario((prev) => prev + emoji)}
                      className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-base transition-colors hover:border-gray-500 hover:bg-gray-700"
                    >
                      {emoji}
                    </button>
                  )
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p
                  className={`text-xs ${
                    comentario.length < 20 ? "text-gray-500" : "text-green-400"
                  }`}
                >
                  {comentario.length} caracteres
                  {comentario.length < 20 && " (minimo 20)"}
                </p>
              </div>

              <button
                onClick={handleCopiar}
                disabled={comentario.length < 20}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#6B3FA0] py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a3588] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                  />
                </svg>
                Copiar comentario
              </button>

              <button
                onClick={() => setStep("video")}
                className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-300"
              >
                Volver
              </button>

              <button
                onClick={handleCancelar}
                disabled={cancelando}
                className="mt-2 w-full text-center text-sm text-gray-600 hover:text-red-400 disabled:opacity-50"
              >
                {cancelando
                  ? "Cancelando..."
                  : "No puedo comentar este video"}
              </button>
            </>
          )}

          {/* ===== STEP 3: Copied — countdown + Ya publique ===== */}
          {step === "copied" && video && (
            <>
              {/* Success banner */}
              <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <p className="text-sm text-green-300">
                  {copied
                    ? "Comentario copiado al portapapeles."
                    : "Comentario guardado. Selecciona el texto y copialo manualmente."}
                </p>
              </div>

              {/* Comment text — readonly fallback for manual copy */}
              <div className="mb-4">
                <p className="mb-1 text-xs text-gray-500">Tu comentario:</p>
                <textarea
                  readOnly
                  value={comentario}
                  rows={3}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-300 outline-none focus:border-[#6B3FA0]"
                />
              </div>

              <h2 className="mb-2 text-lg font-semibold text-white">
                Ahora publica en YouTube
              </h2>

              <p className="mb-4 text-sm text-gray-400">
                Abre el video, pega tu comentario y publicalo. Luego vuelve aqui
                y presiona &ldquo;Ya publique mi comentario&rdquo;.
              </p>

              {/* Prominent YouTube button */}
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                Ir al video en YouTube
              </a>

              {/* Countdown + Ya publique button */}
              {countdown > 0 ? (
                <div className="space-y-3">
                  <button
                    disabled
                    className="w-full rounded-lg bg-gray-800 py-3 text-sm font-medium text-gray-500 cursor-not-allowed"
                  >
                    Ya publique mi comentario ({formatCountdown(countdown)})
                  </button>
                  <p className="text-center text-xs text-gray-500">
                    El boton se habilitara cuando termine el tiempo minimo de
                    visualizacion. Esto protege el Watch Time del creador.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleYaPublique}
                  className="w-full rounded-lg bg-[#E87722] py-3 text-sm font-medium text-white transition-colors hover:bg-[#d06a1a]"
                >
                  Ya publique mi comentario
                </button>
              )}

              <a
                href="/dashboard"
                className="mt-4 block text-center text-sm text-gray-600 hover:text-gray-400"
              >
                Volver al dashboard
              </a>
            </>
          )}

          {/* ===== VERIFICANDO ===== */}
          {step === "verificando" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-600 border-t-[#E87722]" />
              <p className="text-sm text-gray-400">
                Verificando tu comentario en YouTube...
              </p>
              <p className="text-xs text-gray-500">
                Esto puede tardar unos segundos.
              </p>
              <a
                href="/dashboard"
                className="mt-4 text-sm text-gray-600 hover:text-gray-400"
              >
                Volver al dashboard
              </a>
            </div>
          )}

          {/* ===== PENDIENTE (seccion 6C.4) ===== */}
          {step === "pendiente" && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E87722]/10">
                  <svg
                    className="h-6 w-6 text-[#E87722]"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Intercambio en revision
                </h2>
              </div>

              <div className="mb-4 rounded-lg border border-[#E87722]/30 bg-[#E87722]/10 p-4">
                <p className="text-sm text-[#f0a964]">
                  {resultMessage}
                </p>
              </div>

              <p className="mb-6 text-sm text-gray-400">
                Esta pagina se actualizara automaticamente cuando tu intercambio
                sea verificado. Puedes cerrar esta pagina y continuar con otros
                intercambios.
              </p>

              <a
                href="/dashboard"
                className="block w-full rounded-lg bg-[#6B3FA0] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#5a3588]"
              >
                Volver al dashboard
              </a>
            </>
          )}

          {/* ===== DONE — Verified ===== */}
          {step === "done" && (
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
                  Intercambio enviado
                </h2>
              </div>

              <p className="mb-6 text-sm text-gray-400">
                Tu comentario sera verificado automaticamente. Recibiras una
                notificacion cuando se confirme.
              </p>

              <a
                href="/dashboard"
                className="block w-full rounded-lg bg-[#6B3FA0] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#5a3588]"
              >
                Volver al dashboard
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
