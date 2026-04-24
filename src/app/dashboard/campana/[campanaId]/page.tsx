"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

interface Intercambio {
  id: string;
  comentarista_id: string;
  comentarista_nombre: string;
  comentarista_canal: string | null;
  texto_comentario: string;
  estado: string;
  calificacion: "positiva" | "negativa" | "neutral" | null;
  estrellas: number | null;
  created_at: string;
}

const STAR_LABELS: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

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
      <div
        className="flex gap-1"
        onMouseLeave={() => setHover(0)}
      >
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
            style={{
              color: display >= n ? "#E87722" : "#e0e3e4",
            }}
          >
            ★
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#595c5d]">
        {display > 0
          ? STAR_LABELS[display]
          : "Selecciona una calificación del 1 al 5"}
      </p>
    </div>
  );
}

interface Campana {
  id: string;
  estado: string;
  intercambios_completados: number;
}

interface VideoInfo {
  titulo: string;
  youtube_video_id: string;
}

type TabFilter = "todos" | "verificados";

function getInitials(name: string | null): string {
  if (!name) return "C";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

export default function CampanaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const campanaId = params.campanaId as string;

  const [campana, setCampana] = useState<Campana | null>(null);
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [intercambios, setIntercambios] = useState<Intercambio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calificando, setCalificando] = useState<string | null>(null);
  const [tab, setTab] = useState<TabFilter>("todos");

  useEffect(() => {
    fetchDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanaId]);

  async function fetchDetalle() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/campanas/detalle?campana_id=${campanaId}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al cargar la campana.");
        return;
      }
      setCampana(data.campana);
      setVideo(data.video);
      setIntercambios(data.intercambios || []);
    } catch {
      setError("Error de conexion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCalificar(intercambioId: string, estrellas: number) {
    setCalificando(intercambioId);
    const calificacionDerivada: "positiva" | "negativa" | "neutral" =
      estrellas >= 4 ? "positiva" : estrellas <= 2 ? "negativa" : "neutral";
    try {
      const res = await fetch("/api/intercambios/calificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intercambio_id: intercambioId,
          estrellas,
        }),
      });

      if (res.ok) {
        setIntercambios((prev) =>
          prev.map((i) =>
            i.id === intercambioId
              ? { ...i, estrellas, calificacion: calificacionDerivada }
              : i
          )
        );
      }
    } catch {
      // user can retry
    } finally {
      setCalificando(null);
    }
  }

  const verificados = intercambios.filter((i) => i.estado === "verificado");

  const filtered = tab === "verificados" ? verificados : intercambios;

  const campanaLabel =
    campana?.estado === "abierta" || campana?.estado === "activa"
      ? "CAMPAÑA ACTIVA"
      : campana?.estado === "pausada"
      ? "CAMPAÑA PAUSADA"
      : campana?.estado === "finalizada"
      ? "CAMPAÑA FINALIZADA"
      : "CAMPAÑA";

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      <main className="mx-auto max-w-7xl px-6 pt-8 pb-12">
        {/* Back link */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-5 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
        >
          <span aria-hidden>←</span>
          Volver al inicio
        </button>
        {/* ===== LOADING / ERROR ===== */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-24">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ac8eff]/40 border-t-[#6200EE]" />
            <p className="text-sm text-[#595c5d]">Cargando campaña…</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 rounded-full bg-[#6200EE] px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              Volver al inicio
            </button>
          </div>
        )}

        {!loading && !error && campana && video && (
          <>
            {/* ===== HERO ===== */}
            <section className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              {/* Thumbnail */}
              <div className="lg:col-span-5">
                <a
                  href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-video overflow-hidden rounded-2xl border border-[rgba(171,173,174,0.15)] bg-black shadow-sm"
                >
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_video_id}/maxresdefault.jpg`}
                    alt={normalizeTitle(video.titulo)}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/40">
                    <svg
                      className="h-16 w-16 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  </div>
                </a>
              </div>

              {/* Info + stats */}
              <div className="lg:col-span-7">
                <span className="inline-block rounded-full bg-[#6200EE]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#6200EE]">
                  {campanaLabel}
                </span>
                <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-[#2c2f30]">
                  {normalizeTitle(video.titulo)}
                </h1>

                <div className="mt-6 max-w-xs">
                  <div className="rounded-2xl border border-[rgba(171,173,174,0.15)] bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#595c5d]">
                      Comentarios verificados
                    </p>
                    <p className="mt-1 font-headline text-3xl font-extrabold text-[#6200EE]">
                      {verificados.length}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== INTERCAMBIOS ===== */}
            <section>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#2c2f30]">
                  Comentarios recibidos
                </h2>

                {/* Tabs */}
                <div className="inline-flex rounded-full border border-[rgba(171,173,174,0.15)] bg-white p-1 text-sm">
                  {(
                    [
                      { key: "todos", label: `Todos (${intercambios.length})` },
                      {
                        key: "verificados",
                        label: `Verificados (${verificados.length})`,
                      },
                    ] as { key: TabFilter; label: string }[]
                  ).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        tab === t.key
                          ? "bg-[#6200EE] text-white shadow-sm"
                          : "text-[#595c5d] hover:text-[#2c2f30]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[rgba(171,173,174,0.3)] bg-white py-16 text-center">
                  <p className="text-sm text-[#595c5d]">
                    {intercambios.length === 0
                      ? "Aún no hay intercambios en esta campaña."
                      : "No hay intercambios en este filtro."}
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {filtered.map((intercambio) => {
                    const initials = getInitials(intercambio.comentarista_nombre);
                    const isVerified = intercambio.estado === "verificado";
                    const isPending = intercambio.estado === "pendiente";

                    return (
                      <li
                        key={intercambio.id}
                        className="group rounded-3xl border border-[rgba(171,173,174,0.15)] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(44,47,48,0.15)]"
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                              style={{
                                background:
                                  "linear-gradient(135deg, #6200EE, #ac8eff)",
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              {intercambio.comentarista_canal ? (
                                <a
                                  href={intercambio.comentarista_canal}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-[#2c2f30] hover:text-[#6200EE]"
                                >
                                  {intercambio.comentarista_nombre}
                                </a>
                              ) : (
                                <p className="font-bold text-[#2c2f30]">
                                  {intercambio.comentarista_nombre}
                                </p>
                              )}
                              <p className="text-xs text-[#595c5d]">
                                {tiempoRelativo(intercambio.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* State badge */}
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                              isVerified
                                ? "bg-green-100 text-green-700"
                                : isPending
                                ? "bg-[#E87722]/10 text-[#E87722]"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {intercambio.estado}
                          </span>
                        </div>

                        {/* Comment text */}
                        {intercambio.texto_comentario ? (
                          <blockquote className="mt-5 rounded-2xl bg-[#f5f6f7] p-4 text-base leading-relaxed text-[#2c2f30]">
                            “{intercambio.texto_comentario}”
                          </blockquote>
                        ) : isPending ? (
                          <p className="mt-5 text-sm italic text-[#595c5d]">
                            Comentario aún no redactado
                          </p>
                        ) : null}

                        {/* Rating state */}
                        <div className="mt-5">
                          {isPending && (
                            <p className="text-sm italic text-[#595c5d]">
                              Verificación en curso…
                            </p>
                          )}

                          {isVerified && (
                            <StarRating
                              value={intercambio.estrellas}
                              disabled={calificando === intercambio.id}
                              onRate={(n) =>
                                handleCalificar(intercambio.id, n)
                              }
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-black/5 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 md:flex-row">
          <p className="text-xs text-[#595c5d]">
            &copy; 2026 Comentalo — Hecho para creadores de LatAm
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-[10px] font-medium uppercase tracking-widest text-[#595c5d] hover:text-[#2c2f30]"
            >
              Términos
            </a>
            <a
              href="#"
              className="text-[10px] font-medium uppercase tracking-widest text-[#595c5d] hover:text-[#2c2f30]"
            >
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
