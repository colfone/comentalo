"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLoginWithGoogle() {
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "https://www.googleapis.com/auth/youtube.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setError("No se pudo iniciar sesion con Google. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / Marca */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
          <p className="mt-3 text-gray-400">
            Comunidad colaborativa de creadores de YouTube en Latinoamerica
          </p>
        </div>

        {/* Manifiesto — seccion 1 del PROYECTO.md */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center shadow-xl">
          <p className="text-sm leading-relaxed text-gray-300">
            Creemos que los creadores merecen crecer con apoyo real.
            No vendemos comentarios. No tenemos bots. No hay atajos.
          </p>
          <p className="mt-3 text-sm font-medium text-[#c4a6e8]">
            Tu comentas. Ellos comentan. Asi crecemos todos.
          </p>
        </div>

        {/* Card de login */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          <h2 className="mb-2 text-xl font-semibold text-white">
            Conecta tu canal de YouTube
          </h2>
          <p className="mb-6 text-sm text-gray-400">
            Usamos tu cuenta de Google para verificar que eres el propietario
            real del canal.
          </p>

          {/* Aviso de vinculacion permanente — seccion 9.1 */}
          <div className="mb-4 rounded-lg border border-[#6B3FA0]/30 bg-[#6B3FA0]/10 p-4">
            <p className="text-sm text-[#c4a6e8]">
              Tu canal de YouTube quedara vinculado permanentemente a tu cuenta
              de Comentalo.
            </p>
          </div>

          {/* Advertencia de cuenta correcta */}
          <div className="mb-6 rounded-lg border border-[#E87722]/30 bg-[#E87722]/10 p-4">
            <p className="text-sm font-medium text-[#f0a964]">
              Importante: Usa la cuenta de Google vinculada a tu canal de
              YouTube. Si usas una cuenta diferente no podremos verificar tu
              canal.
            </p>
          </div>

          <button
            onClick={handleLoginWithGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Google icon */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? "Conectando..." : "Continuar con Google"}
          </button>

          {error && (
            <p className="mt-4 text-center text-sm text-red-400">{error}</p>
          )}

          <p className="mt-6 text-center text-xs text-gray-500">
            Al continuar, verificaremos que tu canal cumple los requisitos
            minimos de la comunidad.
          </p>
        </div>
      </div>
    </main>
  );
}
