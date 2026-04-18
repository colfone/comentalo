"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// --- Tabla de tiempos minimos (seccion 5.4 del PROYECTO.md) ---

function getMinWaitSeconds(duracionSegundos: number): number {
  if (duracionSegundos < 120) return 60;
  if (duracionSegundos < 300) return 120;
  if (duracionSegundos < 600) return 180;
  return 300;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
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

type Step = "loading" | "blocked" | "empty" | "choose" | "video" | "write" | "copied" | "verificando" | "done" | "pendiente";

interface Creador {
  nombre: string | null;
  avatar_url: string | null;
  canal_url: string | null;
}

interface AssignedVideo {
  reserva_id: string;
  campana_id: string;
  video_id: string;
  youtube_video_id: string;
  titulo: string;
  descripcion: string | null;
  tipo_intercambio: string | null;
  tono: string | null;
  duracion_segundos: number | null;
  vistas: number;
  expires_at: string;
  thumbnail: string;
  youtube_url: string;
  creador: Creador;
}

export default function IntercambiarPage() {
  const [step, setStep] = useState<Step>("loading");
  const [blockedMessage, setBlockedMessage] = useState("");

  // Reservas (choose step)
  const [videos, setVideos] = useState<AssignedVideo[]>([]);
  const [confirmingCampanaId, setConfirmingCampanaId] = useState<string | null>(null);

  // Seleccionado (flujo post-confirmacion)
  const [intercambioId, setIntercambioId] = useState<string | null>(null);
  const [video, setVideo] = useState<AssignedVideo | null>(null);

  const [comentario, setComentario] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cancelando, setCancelando] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  // --- Cancel ---
  async function handleCancelar() {
    if (!intercambioId) return;
    setCancelando(true);
    try {
      const res = await fetch("/api/intercambios/cancelar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intercambio_id: intercambioId }) });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Error al cancelar."); return; }
      window.location.href = "/dashboard";
    } catch { alert("Error de conexion."); } finally { setCancelando(false); }
  }

  // --- Realtime ---
  useEffect(() => {
    if (!intercambioId) return;
    const supabaseBrowser = createSupabaseBrowserClient();
    const channel = supabaseBrowser
      .channel(`intercambio-${intercambioId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "intercambios", filter: `id=eq.${intercambioId}` }, (payload) => {
        const newEstado = payload.new?.estado;
        if (newEstado === "verificado") setStep("done");
        else if (newEstado === "rechazado") { setResultMessage("Tu intercambio no pudo ser verificado tras 24 horas de reintentos."); setStep("blocked"); }
      })
      .subscribe();
    return () => { supabaseBrowser.removeChannel(channel); };
  }, [intercambioId]);

  // --- Reservar 2 videos ---
  useEffect(() => { assignVideos(); }, []);

  async function assignVideos() {
    setStep("loading");
    try {
      const res = await fetch("/api/intercambios/asignar");
      const data = await res.json();
      if (!res.ok) { setBlockedMessage(data.error || "Error al asignar intercambio."); setStep("blocked"); return; }
      if (!data.ok) {
        if (data.error_code === "LIMITE_PENDIENTES_ALCANZADO") { setBlockedMessage("Tienes 3 intercambios pendientes de verificacion. Espera a que se resuelvan antes de continuar."); setStep("blocked"); }
        else if (data.error_code === "USUARIO_SIN_VIDEO_ACTIVO") { setBlockedMessage(data.mensaje); setStep("blocked"); }
        else if (data.error_code === "COLA_VACIA") { setStep("empty"); }
        else { setBlockedMessage(data.mensaje || "Error inesperado."); setStep("blocked"); }
        return;
      }
      setVideos(data.videos || []);
      setStep("choose");
    } catch { setBlockedMessage("Error de conexion. Intenta de nuevo."); setStep("blocked"); }
  }

  // --- Confirmar una de las 2 reservas ---
  async function handleParticipar(chosen: AssignedVideo) {
    if (confirmingCampanaId) return;
    setConfirmingCampanaId(chosen.campana_id);
    try {
      const res = await fetch("/api/intercambios/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campana_id: chosen.campana_id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Error al confirmar."); setConfirmingCampanaId(null); return; }
      if (!data.ok) {
        if (data.error_code === "RESERVA_EXPIRADA") {
          alert(data.mensaje || "La reserva expiro. Cargando nuevos videos...");
          setConfirmingCampanaId(null);
          assignVideos();
          return;
        }
        alert(data.mensaje || "No se pudo confirmar.");
        setConfirmingCampanaId(null);
        return;
      }
      setIntercambioId(data.intercambio_id);
      setVideo(chosen);
      setStep("video");
    } catch { alert("Error de conexion."); setConfirmingCampanaId(null); }
  }

  // --- Copiar ---
  async function handleCopiar() {
    if (!intercambioId || !video || comentario.length < 20) return;
    try { await navigator.clipboard.writeText(comentario); setCopied(true); } catch { /* fallback */ }
    try {
      const res = await fetch("/api/intercambios/copiar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intercambio_id: intercambioId, texto_comentario: comentario, duracion_video_segundos: video.duracion_segundos || 0 }) });
      if (!res.ok) { const data = await res.json(); alert(data.error || "Error al guardar el comentario."); return; }
    } catch { alert("Error de conexion al guardar el comentario."); return; }
    const waitSeconds = getMinWaitSeconds(video.duracion_segundos || 0);
    setCountdown(waitSeconds);
    setStep("copied");
  }

  // --- Countdown ---
  const tickCountdown = useCallback(() => {
    setCountdown((prev) => { if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; } return prev - 1; });
  }, []);

  useEffect(() => {
    if (step !== "copied") return;
    timerRef.current = setInterval(tickCountdown, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, tickCountdown]);

  // --- Ya publique ---
  async function handleYaPublique() {
    if (!intercambioId) return;
    setStep("verificando");
    try {
      const res = await fetch("/api/intercambios/verificar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intercambio_id: intercambioId }) });
      const data = await res.json();
      if (!res.ok) { setResultMessage(data.error || "Error al verificar."); setStep("blocked"); return; }
      if (data.resultado === "verificado") setStep("done");
      else if (data.resultado === "pendiente") { setResultMessage(data.mensaje); setStep("pendiente"); }
    } catch { setResultMessage("Error de conexion al verificar."); setStep("blocked"); }
  }

  const hasVideo = step === "video" || step === "write" || step === "copied" || step === "verificando";

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
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Volver al dashboard
            </a>
          </div>
          <p className="text-sm font-medium text-[#2c2f30]">Intercambiar</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        {/* ===== LOADING ===== */}
        {step === "loading" && (
          <div className="flex items-center justify-center py-32">
            <div className="rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-3 border-[#eff1f2] border-t-[#6200EE]" />
              <p className="text-sm text-[#595c5d]">Buscando videos para ti...</p>
            </div>
          </div>
        )}

        {/* ===== BLOCKED ===== */}
        {step === "blocked" && (
          <div className="flex items-center justify-center py-32">
            <div className="w-full max-w-md rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <p className="text-sm leading-relaxed text-[#2c2f30]">{resultMessage || blockedMessage}</p>
              <a href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}>
                Volver al dashboard
              </a>
            </div>
          </div>
        )}

        {/* ===== EMPTY ===== */}
        {step === "empty" && (
          <div className="flex items-center justify-center py-32">
            <div className="w-full max-w-md rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f6f7]">
                <svg className="h-7 w-7 text-[#595c5d]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <p className="text-sm text-[#2c2f30]">No hay videos disponibles en este momento.</p>
              <p className="mt-1 text-xs text-[#595c5d]">Vuelve pronto — otros creadores estan registrando videos.</p>
              <a href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}>
                Volver al dashboard
              </a>
            </div>
          </div>
        )}

        {/* ===== CHOOSE — 2 cards para elegir ===== */}
        {step === "choose" && videos.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#6200EE]">Elige un video</p>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#2c2f30]">
              {videos.length === 2 ? "2 videos disponibles" : "Video disponible"}
            </h2>
            <div className="mt-1 h-[3px] w-12 rounded-full bg-[#6200EE]" />
            <p className="mt-3 max-w-2xl text-sm text-[#595c5d]">
              Elige cual quieres comentar. Tienes 5 minutos para decidir — despues las reservas se liberan automaticamente para otros creadores.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {videos.map((v) => {
                const isConfirming = confirmingCampanaId === v.campana_id;
                const isDisabled = confirmingCampanaId !== null && !isConfirming;
                return (
                  <div
                    key={v.campana_id}
                    className={`group relative overflow-hidden rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${isDisabled ? "opacity-40" : ""}`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-[#eff1f2]">
                      <img
                        src={`https://img.youtube.com/vi/${v.youtube_video_id}/maxresdefault.jpg`}
                        alt={v.titulo}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).src = v.thumbnail; }}
                      />
                      {v.duracion_segundos && v.duracion_segundos > 0 && (
                        <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-xs font-medium text-white">
                          {formatDuration(v.duracion_segundos)}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-6">
                      {/* Creador */}
                      <div className="mb-4 flex items-center gap-3">
                        {v.creador.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.creador.avatar_url} alt={v.creador.nombre || "Creador"} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}>
                            {(v.creador.nombre || "C").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#2c2f30]">
                            {v.creador.nombre || "Creador de YouTube"}
                          </p>
                          {v.creador.canal_url && (
                            <a href={v.creador.canal_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#595c5d] hover:text-[#6200EE]">
                              Ver canal →
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="line-clamp-2 font-headline text-lg font-bold leading-snug text-[#2c2f30]">
                        {v.titulo}
                      </h3>

                      {/* Description */}
                      {v.descripcion && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#595c5d]">
                          {v.descripcion}
                        </p>
                      )}

                      {/* Badges */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {v.tipo_intercambio && (
                          <span className="rounded-full border border-[#6200EE]/20 bg-[#6200EE]/5 px-3 py-1 text-xs font-medium text-[#6200EE]">
                            {tipoLabels[v.tipo_intercambio] || v.tipo_intercambio}
                          </span>
                        )}
                        {v.tono && (
                          <span className="rounded-full border border-[#E87722]/20 bg-[#E87722]/5 px-3 py-1 text-xs font-medium text-[#E87722]">
                            Tono: {tonoLabels[v.tono] || v.tono}
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => handleParticipar(v)}
                        disabled={isDisabled || isConfirming}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                      >
                        {isConfirming ? (
                          <>
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Confirmando...
                          </>
                        ) : (
                          <>
                            Participar
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== TWO-COLUMN LAYOUT (video confirmado) ===== */}
        {hasVideo && video && (
          <div className="grid gap-8 lg:grid-cols-12">
            {/* --- Left: Video info --- */}
            <div className="lg:col-span-7">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#6200EE]">Intercambio activo</p>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#2c2f30]">
                Video Asignado
              </h2>
              <div className="mt-1 h-[3px] w-12 rounded-full bg-[#6200EE]" />

              {/* Thumbnail */}
              <div className="group relative mt-6 overflow-hidden rounded-2xl">
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_video_id}/maxresdefault.jpg`}
                  alt={video.titulo}
                  className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = video.thumbnail; }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                  <svg className="h-16 w-16 text-white opacity-0 transition-opacity group-hover:opacity-80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {video.duracion_segundos && video.duracion_segundos > 0 && (
                  <span className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-2 py-1 text-xs font-medium text-white">
                    {formatDuration(video.duracion_segundos)}
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {video.tipo_intercambio && (
                  <span className="rounded-full border border-[#6200EE]/20 bg-[#6200EE]/5 px-3 py-1 text-xs font-medium text-[#6200EE]">
                    {tipoLabels[video.tipo_intercambio] || video.tipo_intercambio}
                  </span>
                )}
                {video.tono && (
                  <span className="rounded-full border border-[#E87722]/20 bg-[#E87722]/5 px-3 py-1 text-xs font-medium text-[#E87722]">
                    Tono: {tonoLabels[video.tono] || video.tono}
                  </span>
                )}
                {video.duracion_segundos && (
                  <span className="rounded-full border border-[rgba(171,173,174,0.15)] px-3 py-1 text-xs text-[#595c5d]">
                    {formatDuration(video.duracion_segundos)}
                  </span>
                )}
              </div>

              {/* Title + description */}
              <h3 className="mt-4 font-headline text-2xl font-bold text-[#2c2f30]">{video.titulo}</h3>
              {video.descripcion && (
                <p className="mt-2 text-sm leading-relaxed text-[#595c5d]">{video.descripcion}</p>
              )}

              {/* Like nudge */}
              <div className="mt-6 flex gap-3 rounded-xl border-l-[3px] border-[#E87722] bg-[#fff8f3] p-4">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#E87722]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <p className="text-xs leading-relaxed text-[#2c2f30]/70">
                  Recuerda darle Like al video antes de comentar. Es un buen gesto entre creadores.
                </p>
              </div>
            </div>

            {/* --- Right: Task + Creator --- */}
            <div className="space-y-4 lg:col-span-5">
              {/* Card: Tu Tarea */}
              <div className="rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#6200EE]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                  <h3 className="font-headline text-base font-bold text-[#2c2f30]">Tu Tarea</h3>
                </div>

                {/* STATE: video — show "start writing" */}
                {step === "video" && (
                  <>
                    <p className="mb-4 text-sm text-[#595c5d]">Escribe un comentario genuino para este video y pegalo en YouTube.</p>
                    <button
                      onClick={() => setStep("write")}
                      className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                      style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                    >
                      Escribir comentario
                    </button>
                  </>
                )}

                {/* STATE: write */}
                {step === "write" && (
                  <>
                    {(video.tipo_intercambio || video.tono) && (
                      <p className="mb-3 text-xs text-[#595c5d]">
                        El creador busca:{" "}
                        {video.tipo_intercambio && <span className="font-medium text-[#6200EE]">{tipoLabels[video.tipo_intercambio] || video.tipo_intercambio}</span>}
                        {video.tipo_intercambio && video.tono && " — "}
                        {video.tono && <span className="font-medium text-[#E87722]">tono {tonoLabels[video.tono] || video.tono}</span>}
                      </p>
                    )}

                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows={5}
                      placeholder="Escribe un comentario genuino sobre el video..."
                      className="w-full rounded-xl border border-[rgba(171,173,174,0.15)] bg-[#f5f6f7] px-4 py-3 text-sm text-[#2c2f30] placeholder-[#595c5d]/50 outline-none transition-colors focus:border-[#6200EE] focus:bg-white"
                    />

                    {/* Emojis */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {["👍", "🔥", "❤️", "💯", "🙌", "😊", "👏", "🎯", "💪", "✅"].map((emoji) => (
                        <button key={emoji} type="button" onClick={() => setComentario((prev) => prev + emoji)} className="rounded-lg border border-[rgba(171,173,174,0.15)] bg-white px-2 py-1 text-base transition-colors hover:bg-[#f5f6f7]">
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <p className={`text-xs ${comentario.length < 20 ? "text-[#595c5d]" : "text-green-600"}`}>
                        {comentario.length} caracteres{comentario.length < 20 && " (minimo 20)"}
                      </p>
                    </div>

                    <button
                      onClick={handleCopiar}
                      disabled={comentario.length < 20}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                      </svg>
                      Copiar comentario
                    </button>

                    <button onClick={() => setStep("video")} className="mt-2 w-full text-center text-xs text-[#595c5d] hover:text-[#2c2f30]">
                      Volver
                    </button>
                  </>
                )}

                {/* STATE: copied */}
                {step === "copied" && (
                  <>
                    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                      <p className="text-xs font-medium text-green-700">
                        {copied ? "Comentario copiado al portapapeles." : "Comentario guardado. Selecciona el texto y copialo manualmente."}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="mb-1 text-[10px] uppercase tracking-widest text-[#595c5d]">Tu comentario:</p>
                      <textarea
                        readOnly
                        value={comentario}
                        rows={3}
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        className="w-full rounded-xl border border-[rgba(171,173,174,0.15)] bg-[#f5f6f7] px-4 py-3 text-xs text-[#2c2f30] outline-none focus:border-[#6200EE]"
                      />
                    </div>

                    <p className="mb-3 text-sm text-[#2c2f30]">Ahora publica en YouTube</p>
                    <p className="mb-4 text-xs text-[#595c5d]">Abre el video, pega tu comentario y publicalo.</p>

                    <a
                      href={video.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      Ir al video en YouTube
                    </a>

                    {/* Countdown */}
                    {countdown > 0 ? (
                      <>
                        <div className="mb-2 flex items-center justify-center">
                          <span className={`font-headline text-4xl font-extrabold text-[#6200EE] ${countdown <= 30 ? "animate-pulse" : ""}`}>
                            {formatCountdown(countdown)}
                          </span>
                        </div>
                        <button disabled className="w-full rounded-xl bg-[#eff1f2] py-3 text-sm font-medium text-[#595c5d] cursor-not-allowed">
                          Ya publique mi comentario
                        </button>
                        <p className="mt-2 text-center text-[10px] text-[#595c5d]">
                          El boton se habilitara cuando termine el tiempo minimo de visualizacion.
                        </p>
                      </>
                    ) : (
                      <button
                        onClick={handleYaPublique}
                        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                        style={{ background: "linear-gradient(135deg, #E87722, #f0a964)" }}
                      >
                        Ya publique mi comentario
                      </button>
                    )}
                  </>
                )}

                {/* STATE: verificando */}
                {step === "verificando" && (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-3 border-[#eff1f2] border-t-[#6200EE]" />
                    <p className="text-sm text-[#2c2f30]">Verificando tu comentario en YouTube...</p>
                    <p className="mt-1 text-xs text-[#595c5d]">Esto puede tardar unos segundos.</p>
                  </div>
                )}

                {/* Cancel button — visible in video, write, copied */}
                {(step === "video" || step === "write" || step === "copied") && (
                  <button
                    onClick={handleCancelar}
                    disabled={cancelando}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#595c5d]/30 py-3 text-sm font-medium text-[#595c5d] transition-colors hover:border-red-400 hover:text-red-500 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    {cancelando ? "Cancelando..." : "Cancelar intercambio"}
                  </button>
                )}
              </div>

              {/* Card: El Creador */}
              <div className="rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-6">
                <h3 className="mb-3 font-headline text-sm font-bold text-[#2c2f30]">El Creador</h3>
                <div className="flex items-center gap-3">
                  {video.creador.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.creador.avatar_url} alt={video.creador.nombre || "Creador"} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}>
                      {(video.creador.nombre || "C").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#2c2f30]">{video.creador.nombre || "Creador de YouTube"}</p>
                    {video.creador.canal_url && (
                      <a href={video.creador.canal_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#E87722] hover:underline">
                        Ver canal →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== PENDIENTE ===== */}
        {step === "pendiente" && (
          <div className="flex items-center justify-center py-32">
            <div className="w-full max-w-md rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E87722]/10">
                <svg className="h-7 w-7 text-[#E87722]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="font-headline text-lg font-bold text-[#2c2f30]">Intercambio en revision</h3>
              <p className="mt-2 text-sm text-[#595c5d]">{resultMessage}</p>
              <p className="mt-3 text-xs text-[#595c5d]">Esta pagina se actualizara automaticamente cuando tu intercambio sea verificado.</p>
              <a href="/dashboard" className="mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}>
                Volver al dashboard
              </a>
            </div>
          </div>
        )}

        {/* ===== DONE ===== */}
        {step === "done" && (
          <div className="flex items-center justify-center py-32">
            <div className="w-full max-w-md rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="font-headline text-lg font-bold text-[#2c2f30]">Intercambio enviado</h3>
              <p className="mt-2 text-sm text-[#595c5d]">Tu comentario sera verificado automaticamente. Recibiras una notificacion cuando se confirme.</p>
              <a href="/dashboard" className="mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}>
                Volver al dashboard
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
