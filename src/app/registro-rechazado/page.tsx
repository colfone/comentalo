"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RegistroRechazadoContent() {
  const searchParams = useSearchParams();
  const rawReason = searchParams.get("reason") || "";

  // Reasons are pipe-separated when there are multiple failures
  const reasons = rawReason.split("|").filter(Boolean);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#6B3FA0]">Comenta</span>
            <span className="text-[#E87722]">lo</span>
          </h1>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <svg
                className="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">
              Tu canal no cumple los requisitos
            </h2>
          </div>

          <p className="mb-4 text-sm text-gray-400">
            Para registrarte en Comentalo, tu canal de YouTube debe cumplir los
            siguientes requisitos minimos:
          </p>

          {/* Requirements checklist */}
          <ul className="mb-6 space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gray-600">&#8226;</span>
              Minimo 3 meses de antiguedad
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gray-600">&#8226;</span>
              Al menos 1 video publico
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gray-600">&#8226;</span>
              Al menos 20 suscriptores
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gray-600">&#8226;</span>
              Canal publico (no privado)
            </li>
          </ul>

          {/* Specific reasons */}
          {reasons.length > 0 && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="mb-2 text-sm font-medium text-red-300">
                Esto es lo que detectamos en tu canal:
              </p>
              <ul className="space-y-1">
                {reasons.map((reason, i) => (
                  <li key={i} className="text-sm text-red-200/80">
                    &mdash; {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mb-6 text-sm text-gray-400">
            Puedes volver cuando tu canal cumpla los requisitos. Comentalo esta
            disenado para creadores reales que quieren crecer juntos.
          </p>

          <a
            href="/login"
            className="block w-full rounded-lg bg-[#6B3FA0] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#5a3588]"
          >
            Volver a intentar
          </a>
        </div>
      </div>
    </main>
  );
}

export default function RegistroRechazadoPage() {
  return (
    <Suspense>
      <RegistroRechazadoContent />
    </Suspense>
  );
}
