"use client";

import { useRouter } from "next/navigation";

// Placeholder "Próximamente" — compra de créditos es BACKLOG FASE 2
// (CLAUDE.md regla 1). La ruta existe solo para que los CTAs de upsell
// tengan destino coherente; al aterrizar, el usuario ve que no está
// disponible todavía y se le ofrecen los caminos del MVP: ganar créditos
// comentando o volver al inicio.

export default function ComprarPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      <main className="mx-auto flex max-w-[640px] flex-col items-center px-6 pb-16 pt-16 text-center">
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
          style={{ background: "linear-gradient(135deg, #6200EE10, #ac8eff20)" }}
          aria-hidden="true"
        >
          💎
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6200EE]">
          Próximamente
        </p>

        <h1 className="font-headline text-[clamp(32px,4.5vw,48px)] font-bold leading-[1.05] tracking-[-0.025em] text-[#2c2f30]">
          Comprar créditos
        </h1>

        <p className="mt-4 max-w-[480px] text-base text-[#5b5e60]">
          Todavía no activamos la compra de créditos. Mientras tanto, podés
          ganar todos los créditos que quieras comentando videos de otros
          creadores de la comunidad.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex rounded-xl border border-[#6200EE] bg-white px-6 py-3 text-sm font-semibold text-[#6200EE] transition-colors hover:bg-[rgba(98,0,238,0.06)]"
          >
            Volver al inicio
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/intercambiar")}
            className="inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
          >
            Ganar créditos comentando →
          </button>
        </div>
      </main>
    </div>
  );
}
