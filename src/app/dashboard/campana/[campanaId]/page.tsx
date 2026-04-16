"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Intercambio {
  id: string;
  comentarista_id: string;
  comentarista_nombre: string;
  comentarista_canal: string | null;
  texto_comentario: string;
  estado: string;
  calificacion: "positiva" | "negativa" | null;
  created_at: string;
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

  useEffect(() => {
    fetchDetalle();
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

  async function handleCalificar(
    intercambioId: string,
    calificacion: "positiva" | "negativa"
  ) {
    setCalificando(intercambioId);
    try {
      const res = await fetch("/api/intercambios/calificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intercambio_id: intercambioId,
          calificacion,
        }),
      });

      if (res.ok) {
        setIntercambios((prev) =>
          prev.map((i) =>
            i.id === intercambioId ? { ...i, calificacion } : i
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
  const pendientes = intercambios.filter((i) => i.estado === "pendiente");
  const sinCalificar = verificados.filter((i) => !i.calificacion);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
          <p className="mt-2 text-gray-400">Detalle de campana</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-[#6B3FA0]" />
              <p className="text-sm text-gray-400">Cargando...</p>
            </div>
          )}

          {error && (
            <div className="py-8 text-center">
              <p className="text-sm text-red-400">{error}</p>
              <a
                href="/dashboard"
                className="mt-4 inline-block text-sm text-[#E87722] hover:underline"
              >
                Volver al dashboard
              </a>
            </div>
          )}

          {!loading && !error && campana && video && (
            <>
              {/* Video header */}
              <div className="mb-4 flex items-center gap-3">
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_video_id}/default.jpg`}
                  alt={video.titulo}
                  className="h-12 w-20 rounded object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    {video.titulo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {campana.intercambios_completados}/10 intercambios
                    <span
                      className={`ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        campana.estado === "abierta"
                          ? "bg-[#6B3FA0]/10 text-[#c4a6e8]"
                          : campana.estado === "completada"
                          ? "bg-[#E87722]/10 text-[#f0a964]"
                          : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      {campana.estado === "abierta"
                        ? "En curso"
                        : campana.estado === "completada"
                        ? "Esperando calificacion"
                        : "Calificada"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Pending calificacion banner */}
              {sinCalificar.length > 0 && campana.estado === "completada" && (
                <div className="mb-4 rounded-lg border border-[#E87722]/30 bg-[#E87722]/5 p-3">
                  <p className="text-xs text-[#f0a964]">
                    {sinCalificar.length} intercambio
                    {sinCalificar.length > 1 ? "s" : ""} pendiente
                    {sinCalificar.length > 1 ? "s" : ""} de calificacion.
                  </p>
                </div>
              )}

              {/* Intercambios list */}
              <ul className="space-y-3">
                {intercambios.map((intercambio, idx) => (
                  <li
                    key={intercambio.id}
                    className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">
                          #{idx + 1}
                        </span>
                        {intercambio.comentarista_canal ? (
                          <a
                            href={intercambio.comentarista_canal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#E87722] hover:underline"
                          >
                            {intercambio.comentarista_nombre}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">
                            {intercambio.comentarista_nombre}
                          </span>
                        )}
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          intercambio.estado === "verificado"
                            ? "bg-green-500/10 text-green-400"
                            : intercambio.estado === "pendiente"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {intercambio.estado}
                      </span>
                    </div>

                    {intercambio.texto_comentario && (
                      <p className="mb-3 text-sm text-gray-300">
                        &ldquo;{intercambio.texto_comentario}&rdquo;
                      </p>
                    )}

                    {!intercambio.texto_comentario &&
                      intercambio.estado === "pendiente" && (
                        <p className="mb-3 text-xs text-gray-500 italic">
                          Comentario aun no redactado
                        </p>
                      )}

                    {/* Calificacion display or buttons */}
                    {intercambio.calificacion && (
                      <span
                        className={`text-xs font-medium ${
                          intercambio.calificacion === "positiva"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {intercambio.calificacion === "positiva"
                          ? "👍 Buen intercambio"
                          : "👎 Mal intercambio"}
                      </span>
                    )}

                    {!intercambio.calificacion &&
                      intercambio.estado === "verificado" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleCalificar(intercambio.id, "positiva")
                            }
                            disabled={calificando === intercambio.id}
                            className="flex-1 rounded-lg border border-green-500/30 bg-green-500/10 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                          >
                            👍
                          </button>
                          <button
                            onClick={() =>
                              handleCalificar(intercambio.id, "negativa")
                            }
                            disabled={calificando === intercambio.id}
                            className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                          >
                            👎
                          </button>
                        </div>
                      )}
                  </li>
                ))}
              </ul>

              {intercambios.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">
                  Aun no hay intercambios en esta campana.
                </p>
              )}

              {/* Summary */}
              <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2 text-xs text-gray-400">
                <span>{verificados.length} verificados</span>
                <span>{pendientes.length} pendientes</span>
              </div>

              <button
                onClick={() => router.push("/dashboard")}
                className="mt-6 w-full rounded-lg bg-[#6B3FA0] py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a3588]"
              >
                Volver al dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
