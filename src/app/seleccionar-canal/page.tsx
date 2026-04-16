"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

interface ChannelSummary {
  id: string;
  title: string;
  thumbnail: string;
  subscribers: number;
  videos: number;
  publishedAt: string;
  customUrl: string;
  hiddenSubscriberCount: boolean;
}

function formatSubscribers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function SeleccionarCanalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse channels from URL
  let channels: ChannelSummary[] = [];
  try {
    const raw = searchParams.get("channels");
    if (raw) {
      channels = JSON.parse(raw);
    }
  } catch {
    // Invalid data
  }

  if (channels.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            No se encontraron canales. Vuelve a iniciar sesion.
          </p>
          <a
            href="/login"
            className="mt-4 inline-block text-sm text-[#E87722] hover:underline"
          >
            Ir a login
          </a>
        </div>
      </main>
    );
  }

  async function handleConfirm() {
    const channel = channels.find((c) => c.id === selected);
    if (!channel) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/registrar-canal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channel),
      });

      const data = await res.json();

      if (data.ok) {
        router.push(data.redirect || "/dashboard");
        return;
      }

      if (data.error) {
        // Check if it's a requirements failure (pipe-separated reasons)
        if (data.error.includes("|")) {
          const reasons = data.error
            .split("|")
            .map(encodeURIComponent)
            .join("|");
          router.push(`/registro-rechazado?reason=${reasons}`);
        } else {
          setError(data.error);
        }
      }
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
          <p className="mt-2 text-gray-400">Selecciona tu canal</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          <h2 className="mb-2 text-lg font-semibold text-white">
            Tu cuenta tiene {channels.length} canales de YouTube
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            Elige el canal que quieres vincular a Comentalo.
          </p>

          {/* Permanent binding warning — seccion 9.1 */}
          <div className="mb-6 rounded-lg border border-[#6B3FA0]/30 bg-[#6B3FA0]/10 p-4">
            <p className="text-sm text-[#c4a6e8]">
              El canal que elijas quedara vinculado permanentemente a tu cuenta
              de Comentalo. No podras cambiarlo despues sin contactar a soporte.
            </p>
          </div>

          {/* Channel list */}
          <ul className="space-y-3">
            {channels.map((channel) => (
              <li key={channel.id}>
                <button
                  onClick={() => setSelected(channel.id)}
                  className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                    selected === channel.id
                      ? "border-[#6B3FA0] bg-[#6B3FA0]/10"
                      : "border-gray-700 bg-gray-800 hover:border-gray-600"
                  }`}
                >
                  {channel.thumbnail ? (
                    <img
                      src={channel.thumbnail}
                      alt={channel.title}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-lg text-gray-400">
                      {channel.title.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {channel.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatSubscribers(channel.subscribers)} suscriptores
                      {" · "}
                      {channel.videos} videos
                    </p>
                  </div>
                  {selected === channel.id && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6B3FA0]">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          {selected && (
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-[#6B3FA0] py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a3588] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Verificando canal..."
                : "Vincular este canal a mi cuenta"}
            </button>
          )}

          <a
            href="/login"
            className="mt-4 block text-center text-sm text-gray-500 hover:text-gray-300"
          >
            Cancelar
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SeleccionarCanalPage() {
  return (
    <Suspense>
      <SeleccionarCanalContent />
    </Suspense>
  );
}
