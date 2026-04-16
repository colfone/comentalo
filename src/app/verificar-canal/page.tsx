"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerificarCanalPage() {
  const router = useRouter();
  const [canalUrl, setCanalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerificar() {
    if (!canalUrl.trim()) {
      setError("Ingresa el link de tu canal de YouTube.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/canal/verificar-requisitos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal_url: canalUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data.error?.includes("|")) {
          // Multiple requirement failures — redirect to rechazo page
          router.push(
            `/registro-rechazado?reason=${encodeURIComponent(data.error)}`
          );
        } else {
          setError(data.error || "Error al verificar el canal.");
        }
        return;
      }

      // Success — redirect to code verification with the code
      router.push(`/verificar-codigo?codigo=${data.codigo}`);
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
          <p className="mt-2 text-gray-400">Paso 1 de 2 — Verifica tu canal</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          <h2 className="mb-2 text-lg font-semibold text-white">
            ¿Cual es tu canal de YouTube?
          </h2>
          <p className="mb-6 text-sm text-gray-400">
            Pega el link de tu canal. Puede ser en cualquier formato:
            youtube.com/@tucanal, youtube.com/channel/UCxxxx, etc.
          </p>

          <input
            type="text"
            value={canalUrl}
            onChange={(e) => {
              setCanalUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://www.youtube.com/@tucanal"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#6B3FA0]"
          />

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          {/* Vinculacion permanente — seccion 9.1 */}
          <div className="mt-4 rounded-lg border border-[#6B3FA0]/30 bg-[#6B3FA0]/10 p-4">
            <p className="text-sm text-[#c4a6e8]">
              Tu canal de YouTube quedara vinculado permanentemente a tu cuenta
              de Comentalo. Si necesitas cambiarlo en el futuro, contacta a
              nuestro equipo de soporte.
            </p>
          </div>

          <button
            onClick={handleVerificar}
            disabled={loading || !canalUrl.trim()}
            className="mt-6 w-full rounded-lg bg-[#6B3FA0] py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a3588] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verificando canal..." : "Verificar canal"}
          </button>
        </div>
      </div>
    </main>
  );
}
