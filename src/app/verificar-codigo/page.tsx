"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

function VerificarCodigoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const codigo = searchParams.get("codigo") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function handleCopiarCodigo() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback — the code is visible, user can copy manually
    }
  }

  async function handleVerificar() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/canal/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });

      const data = await res.json();

      if (data.ok) {
        router.push("/dashboard");
        return;
      }

      setError(data.error || "Error al verificar.");
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!codigo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            No se encontro un codigo de verificacion.
          </p>
          <a
            href="/verificar-canal"
            className="mt-4 inline-block text-sm text-[#E87722] hover:underline"
          >
            Volver a verificar canal
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Paso 2 de 2 — Confirma que el canal es tuyo
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Pega este codigo en la descripcion de tu canal
          </h2>

          {/* Code display */}
          <div className="mb-4 flex items-center justify-between rounded-lg border border-[#6B3FA0]/30 bg-[#6B3FA0]/10 px-4 py-3">
            <span className="font-mono text-lg font-bold tracking-wider text-[#c4a6e8]">
              {codigo}
            </span>
            <button
              onClick={handleCopiarCodigo}
              className="rounded-md bg-[#6B3FA0]/30 px-3 py-1 text-xs text-[#c4a6e8] transition-colors hover:bg-[#6B3FA0]/50"
            >
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-6 space-y-3 text-sm text-gray-400">
            <p className="font-medium text-gray-300">Instrucciones:</p>
            <ol className="list-inside list-decimal space-y-2">
              <li>
                Abre{" "}
                <a
                  href="https://studio.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E87722] hover:underline"
                >
                  YouTube Studio
                </a>
              </li>
              <li>
                Ve a <span className="text-gray-300">Personalizacion</span> →{" "}
                <span className="text-gray-300">Informacion basica</span>
              </li>
              <li>
                Pega el codigo{" "}
                <span className="font-mono text-[#c4a6e8]">{codigo}</span> en
                cualquier parte de la descripcion de tu canal
              </li>
              <li>Guarda los cambios</li>
              <li>Vuelve aqui y presiona el boton de abajo</li>
            </ol>
            <p className="mt-2 text-xs text-gray-500">
              Despues de verificar, puedes borrar el codigo de la descripcion.
            </p>
          </div>

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          <button
            onClick={handleVerificar}
            disabled={loading}
            className="w-full rounded-lg bg-[#E87722] py-3 text-sm font-medium text-white transition-colors hover:bg-[#d06a1a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verificando..." : "Ya lo pegue — verificar mi canal"}
          </button>

          <a
            href="/verificar-canal"
            className="mt-4 block text-center text-sm text-gray-500 hover:text-gray-300"
          >
            Usar un canal diferente
          </a>
        </div>
      </div>
    </main>
  );
}

export default function VerificarCodigoPage() {
  return (
    <Suspense>
      <VerificarCodigoContent />
    </Suspense>
  );
}
