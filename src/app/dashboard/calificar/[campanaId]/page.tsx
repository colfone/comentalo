"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Intercambio {
  id: string;
  texto_comentario: string;
  calificacion: "positiva" | "negativa" | null;
  comentarista_id: string;
}

export default function CalificarPage() {
  const params = useParams();
  const router = useRouter();
  const campanaId = params.campanaId as string;

  const [intercambios, setIntercambios] = useState<Intercambio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calificando, setCalificando] = useState<string | null>(null);

  useEffect(() => {
    fetchIntercambios();
  }, [campanaId]);

  async function fetchIntercambios() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/intercambios/calificar?campana_id=${campanaId}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al cargar intercambios.");
        return;
      }
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
      // Silent fail — user can retry
    } finally {
      setCalificando(null);
    }
  }

  const totalCalificados = intercambios.filter(
    (i) => i.calificacion !== null
  ).length;
  const todosCalificados =
    intercambios.length > 0 && totalCalificados === intercambios.length;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
          <p className="mt-2 text-gray-400">Calificar intercambios</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-[#6B3FA0]" />
              <p className="text-sm text-gray-400">Cargando intercambios...</p>
            </div>
          )}

          {error && (
            <div className="py-8 text-center">
              <p className="text-sm text-red-400">{error}</p>
              <a
                href="/dashboard"
                className="mt-4 inline-block text-sm text-[#E87722] hover:underline"
              >
                Volver al inicio
              </a>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Intercambios recibidos
                </h2>
                <span className="text-sm text-gray-400">
                  {totalCalificados}/{intercambios.length} calificados
                </span>
              </div>

              <p className="mb-6 text-xs text-gray-500">
                Califica cada intercambio con un solo clic. Sin texto, sin
                explicaciones.
              </p>

              <ul className="space-y-3">
                {intercambios.map((intercambio, idx) => (
                  <li
                    key={intercambio.id}
                    className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400">
                        Intercambio {idx + 1}
                      </span>
                      {intercambio.calificacion && (
                        <span
                          className={`text-xs font-medium ${
                            intercambio.calificacion === "positiva"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {intercambio.calificacion === "positiva"
                            ? "👍"
                            : "👎"}
                        </span>
                      )}
                    </div>

                    <p className="mb-3 text-sm text-gray-300">
                      &ldquo;{intercambio.texto_comentario}&rdquo;
                    </p>

                    {!intercambio.calificacion && (
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

              {todosCalificados && (
                <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                  <p className="text-sm text-green-300">
                    Campana calificada. Todos los intercambios fueron evaluados.
                  </p>
                </div>
              )}

              <button
                onClick={() => router.push("/dashboard")}
                className="mt-6 w-full rounded-lg bg-[#6B3FA0] py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a3588]"
              >
                Volver al inicio
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
