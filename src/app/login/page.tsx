"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LandingPage() {
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
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setError("No se pudo iniciar sesion con Google. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ===== NAV ===== */}
      <nav className="fixed top-0 z-50 w-full border-b border-[var(--ghost-border)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <a href="/" className="font-headline text-xl font-bold tracking-tighter text-gray-900">
            Comenta<span className="text-[var(--primary)]">lo</span>
          </a>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pt-32 pb-20 lg:grid-cols-2 lg:items-center lg:pt-40">
        {/* Left column */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--ghost-border)] bg-[var(--surface)] px-4 py-1.5">
            <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              YouTube LatAm
            </span>
          </div>

          <h1 className="font-headline text-4xl font-extrabold leading-tight tracking-tight text-gray-900 lg:text-5xl">
            Comunidad colaborativa de creadores de YouTube en Latinoamerica.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-gray-500">
            Sin bots. Sin atajos. Solo creadores que se apoyan entre si.
            Tu comentas. Ellos comentan. Asi crecemos todos.
          </p>

          {/* Manifiesto card */}
          <div className="mt-8 rounded-xl border border-[var(--ghost-border)] bg-[var(--surface)] p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--primary)]">
              El Manifiesto
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Creemos que los creadores merecen crecer con apoyo real.
              No vendemos comentarios. No tenemos bots. No hay atajos.
              Solo creadores que se apoyan entre si.
            </p>
            <p className="mt-3 text-sm font-semibold text-gray-800">
              Tu comentas. Ellos comentan. Asi crecemos todos.
            </p>
          </div>
        </div>

        {/* Right column — Login form */}
        <div id="login-section" className="scroll-mt-24">
          <div className="rounded-xl border border-[var(--ghost-border)] bg-white p-8 shadow-lg">
            <h2 className="font-headline text-2xl font-bold text-gray-900">
              Empieza hoy
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Solo necesitas tu cuenta de Google. La verificacion de tu canal se
              hace en el siguiente paso.
            </p>

            <button
              onClick={handleLoginWithGoogle}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {loading ? "Conectando..." : "Continuar con Google"}
            </button>

            {error && (
              <p className="mt-4 text-center text-sm text-red-500">{error}</p>
            )}

            <p className="mt-6 text-center text-xs text-gray-400">
              Al continuar, verificaremos que tu canal cumple los requisitos
              minimos de la comunidad.
            </p>
          </div>
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section id="como-funciona" className="bg-[var(--surface)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
            Como funciona
          </p>
          <h2 className="mt-3 text-center font-headline text-3xl font-bold text-gray-900">
            Tres pasos simples
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Registra tu video",
                desc: "Conecta tu canal y elige el video donde quieres recibir intercambios reales.",
              },
              {
                step: "02",
                title: "Comenta a otro creador",
                desc: "La plataforma te asigna un video. Escribes un comentario genuino y lo publicas en YouTube.",
              },
              {
                step: "03",
                title: "Recibe intercambios",
                desc: "Por cada comentario que das, activas el derecho a recibir uno en tu propio video.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-[var(--ghost-border)] bg-white p-6 transition-transform hover:scale-[1.02]"
              >
                <span className="font-headline text-3xl font-extrabold text-[var(--primary-light)]">
                  {item.step}
                </span>
                <h3 className="mt-4 font-headline text-lg font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[var(--ghost-border)] bg-[var(--surface)] py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-gray-400">
              &copy; 2026 Comentalo — Hecho para creadores de LatAm
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-[10px] font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-600">
                Terminos
              </a>
              <a href="#" className="text-[10px] font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-600">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
