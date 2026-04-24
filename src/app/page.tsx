"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/admin-emails";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Paso 1 / 3 — Landing Onboarding (prototipo Design)
// Colores: primary #6200EE, gradient 135deg #6200EE → #ac8eff

const steps = [
  {
    titulo: "Conectas tu canal de YouTube",
    descripcion: "Login con Google. Verificamos que seas un creador real.",
  },
  {
    titulo: "Registras un video",
    descripcion: "El tuyo entra a la comunidad. Empieza a recibir comentarios.",
  },
  {
    titulo: "Comentas videos de otros",
    descripcion: "Cada comentario activa un nuevo intercambio para ti.",
  },
];

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setChecking(false);
        return;
      }
      router.replace(isAdminEmail(user.email) ? "/admin" : "/dashboard");
    });
  }, [router]);

  async function handleLoginWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError("No se pudo iniciar sesion con Google. Intenta de nuevo.");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgba(171,173,174,0.3)] border-t-[#6200EE]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f7]">
      {/* ===== TOP BAR ===== */}
      <div className="flex items-center justify-between px-6 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-[10px] font-headline text-base font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
          >
            C
          </div>
          <span className="font-headline text-xl font-semibold tracking-[-0.02em] text-[#2c2f30]">
            Comentalo
          </span>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a8d8f]">
          Paso 1 / 3
        </div>
      </div>

      {/* ===== PROGRESS ===== */}
      <div className="px-6 sm:px-8">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#e9ebec]">
          <div
            className="h-full w-1/3 transition-[width] duration-500 ease-out"
            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
          />
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[560px]">
          {/* Kicker */}
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#6200EE]">
            BIENVENIDOS a la comunidad
          </p>

          {/* Headline */}
          <h1 className="mb-5 font-headline text-[clamp(32px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em] text-[#2c2f30]">
            Crecemos comentando los videos de otros creadores.
          </h1>

          {/* Body */}
          <p className="mb-9 max-w-[480px] text-base leading-[1.55] text-[#5b5e60]">
            Sin bots. Sin cuentas falsas. Sin pagar. Solo creadores reales de YouTube en
            LatAm que se apoyan entre sí. Tú comentas sus videos, ellos comentan los
            tuyos.
          </p>

          {/* 3 steps */}
          <div className="mb-9 flex flex-col gap-3">
            {steps.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-2xl bg-white p-[18px]"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-headline text-sm font-bold"
                  style={{ background: "rgba(98, 0, 238, 0.08)", color: "#6200EE" }}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-[15px] font-semibold leading-[1.4] text-[#2c2f30]">
                    {s.titulo}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-[1.5] text-[#5b5e60]">
                    {s.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Google */}
          <button
            onClick={handleLoginWithGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-[14px] text-sm font-semibold text-white transition-all hover:shadow-[0_0_0_6px_rgba(98,0,238,0.12)] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
          >
            <svg width={18} height={18} viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.4 17.7 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.6 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.4z"
              />
              <path
                fill="#FBBC05"
                d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.6 2.6 10.8l7.8-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.3 0-11.6-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            {loading ? "Conectando..." : "Continuar con Google"}
          </button>

          {error && (
            <p className="mt-3 text-center text-sm text-red-500">{error}</p>
          )}

          {/* Privacy note */}
          <p className="mt-3.5 text-center text-[13px] text-[#8a8d8f]">
            Solo leemos tu email y nombre. No publicamos nada en tu nombre.
          </p>
        </div>
      </div>
    </div>
  );
}
