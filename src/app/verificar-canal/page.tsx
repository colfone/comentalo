"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Paso 2 / 3 — Verificar canal (prototipo Design)
// Colores: primary #6200EE, gradient 135deg #6200EE → #ac8eff

type ReqKey = "antiguedad" | "videos" | "suscriptores" | "publico";
type ReqState = "idle" | "pass" | "fail";

const REQUIREMENTS: { key: ReqKey; label: string }[] = [
  { key: "antiguedad", label: "Mínimo 3 meses de antigüedad" },
  { key: "videos", label: "Al menos 1 video público" },
  { key: "suscriptores", label: "20 o más suscriptores" },
  { key: "publico", label: "Canal público (no oculto)" },
];

const IDLE_STATES: Record<ReqKey, ReqState> = {
  antiguedad: "idle",
  videos: "idle",
  suscriptores: "idle",
  publico: "idle",
};

// Parsea los mensajes de error del API para marcar qué requisitos fallaron
function failedRequirementsFromError(errorString: string): Set<ReqKey> {
  const failed = new Set<ReqKey>();
  for (const msg of errorString.split("|")) {
    const lower = msg.toLowerCase();
    if (lower.includes("antiguedad") || lower.includes("meses")) failed.add("antiguedad");
    else if (lower.includes("video")) failed.add("videos");
    else if (lower.includes("suscriptor")) failed.add("suscriptores");
    else if (lower.includes("publico") || lower.includes("oculto")) failed.add("publico");
  }
  return failed;
}

function isRequirementError(errorString: string): boolean {
  const lower = errorString.toLowerCase();
  return (
    errorString.includes("|") ||
    lower.includes("antiguedad") ||
    lower.includes("meses") ||
    lower.includes("video") ||
    lower.includes("suscriptor") ||
    lower.includes("publico") ||
    lower.includes("oculto")
  );
}

export default function VerificarCanalPage() {
  const router = useRouter();
  const [canalUrl, setCanalUrl] = useState("");
  const [reqStates, setReqStates] = useState<Record<ReqKey, ReqState>>(IDLE_STATES);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    if (!canalUrl.trim() || verifying || verified) return;
    setVerifying(true);
    setError(null);
    setReqStates(IDLE_STATES);

    try {
      const res = await fetch("/api/canal/verificar-requisitos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal_url: canalUrl }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        const errorStr: string = data.error || "";

        if (isRequirementError(errorStr)) {
          const failed = failedRequirementsFromError(errorStr);
          const next: Record<ReqKey, ReqState> = { ...IDLE_STATES };
          for (const r of REQUIREMENTS) {
            next[r.key] = failed.has(r.key) ? "fail" : "pass";
          }
          setReqStates(next);
          setError(errorStr.split("|").join(" · "));
        } else {
          setError(errorStr || "Error al verificar el canal.");
        }
        setVerifying(false);
        return;
      }

      // Todos los requisitos cumplen — marcar en verde y redirigir
      setReqStates({
        antiguedad: "pass",
        videos: "pass",
        suscriptores: "pass",
        publico: "pass",
      });
      setVerifying(false);
      setVerified(true);
      setTimeout(() => {
        router.push(`/verificar-codigo?codigo=${data.codigo}`);
      }, 800);
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
      setVerifying(false);
    }
  }

  function handleChangeUrl(value: string) {
    setCanalUrl(value);
    if (error) setError(null);
    // Resetear estados del checklist al editar
    setReqStates(IDLE_STATES);
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
          Paso 2 / 3
        </div>
      </div>

      {/* ===== PROGRESS 66% ===== */}
      <div className="px-6 sm:px-8">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#e9ebec]">
          <div
            className="h-full w-2/3 transition-[width] duration-500 ease-out"
            style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
          />
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[560px]">
          {/* Kicker */}
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#6200EE]">
            Verifica tu canal
          </p>

          {/* Headline */}
          <h1 className="mb-4 font-headline text-[clamp(28px,3.5vw,40px)] font-bold leading-[1.08] tracking-[-0.02em] text-[#2c2f30]">
            Pega el link de tu canal de YouTube
          </h1>

          {/* Body */}
          <p className="mb-7 text-base leading-[1.55] text-[#5b5e60]">
            Comprobamos que cumpla los requisitos mínimos: 3 meses de antigüedad, al
            menos 1 video publicado y 20 suscriptores.
          </p>

          <div className="flex flex-col gap-3">
            {/* Input with YouTube icon */}
            <div className="relative">
              <div className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[#8a8d8f]">
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="5" width="20" height="14" rx="4" />
                  <path d="m10 9 5 3-5 3z" fill="currentColor" />
                </svg>
              </div>
              <input
                type="text"
                value={canalUrl}
                onChange={(e) => handleChangeUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerify();
                }}
                placeholder="https://youtube.com/@tucanal"
                disabled={verifying || verified}
                className="h-[52px] w-full rounded-xl bg-[#eff1f2] pl-11 pr-4 text-[15px] text-[#2c2f30] outline-none transition placeholder:text-[#8a8d8f] focus:bg-white focus:shadow-[inset_0_0_0_1px_rgba(98,0,238,0.4)] disabled:opacity-60"
              />
            </div>

            {/* Requirements checklist */}
            <div className="rounded-2xl bg-white p-[18px]">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a8d8f]">
                Requisitos del canal
              </p>
              {REQUIREMENTS.map((r) => {
                const state = reqStates[r.key];
                const ok = state === "pass";
                const fail = state === "fail";
                return (
                  <div key={r.key} className="flex items-center gap-2.5 py-1.5">
                    <span
                      className="flex h-[18px] w-[18px] items-center justify-center rounded-full transition-colors"
                      style={{
                        background: ok ? "#6200EE" : fail ? "#fde4e4" : "#e3e5e6",
                        color: ok ? "#ffffff" : fail ? "#c43535" : "#8a8d8f",
                      }}
                    >
                      {ok && (
                        <svg
                          width={11}
                          height={11}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                      {fail && (
                        <svg
                          width={10}
                          height={10}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                    <span
                      className="text-sm leading-[1.55] transition-colors"
                      style={{
                        color: ok ? "#2c2f30" : fail ? "#c43535" : "#5b5e60",
                      }}
                    >
                      {r.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Error detail */}
            {error && (
              <p className="text-sm leading-[1.5] text-red-500">{error}</p>
            )}

            {/* CTA */}
            <button
              onClick={handleVerify}
              disabled={!canalUrl.trim() || verifying || verified}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_0_6px_rgba(98,0,238,0.12)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
            >
              {verifying && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {verified && (
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              {verifying
                ? "Consultando YouTube…"
                : verified
                  ? "Canal verificado"
                  : "Verificar canal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
