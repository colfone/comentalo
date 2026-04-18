"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Paso 3 / 3 — Bienvenida (prototipo Design, OnbStep2)
// Colores: primary #6200EE, gradient 135deg #6200EE → #ac8eff

export default function BienvenidaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/");
      else setReady(true);
    });
  }, [router]);

  function handleEntrar() {
    router.push("/dashboard");
  }

  if (!ready) {
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
          Paso 3 / 3
        </div>
      </div>

      {/* ===== PROGRESS 100% ===== */}
      <div className="px-6 sm:px-8">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#e9ebec]">
          <div
            className="h-full w-full transition-[width] duration-500 ease-out"
            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
          />
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[560px] text-center">
          {/* Sparkle badge */}
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-white"
            style={{
              background: "linear-gradient(135deg, #6200EE, #ac8eff)",
              boxShadow: "0 20px 48px rgba(44, 47, 48, 0.10)",
            }}
          >
            <svg
              width={36}
              height={36}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
            </svg>
          </div>

          {/* Headline */}
          <h1 className="mb-3 font-headline text-[clamp(28px,3.5vw,40px)] font-bold leading-[1.08] tracking-[-0.02em] text-[#2c2f30]">
            Bienvenido a Comentalo
          </h1>

          {/* Body */}
          <p className="mx-auto mb-9 max-w-[460px] text-base leading-[1.55] text-[#5b5e60]">
            Aquí crecemos juntos — tú comentas los videos de otros, ellos comentan los
            tuyos. Registra tu primer video y empieza.
          </p>

          {/* CTA */}
          <button
            onClick={handleEntrar}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_0_6px_rgba(98,0,238,0.12)] active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
          >
            Entrar a Comentalo
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
