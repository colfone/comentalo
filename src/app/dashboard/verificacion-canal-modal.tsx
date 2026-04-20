"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CanalInfo {
  nombre: string | null;
  avatar_url: string | null;
  canal_url: string | null;
  suscriptores: number;
}

type Step = 1 | 2 | 3 | 4;
type Step3State = "verificando" | "error";

function formatSubs(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(".0", "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
}

export default function VerificacionCanalModal({ canal }: { canal: CanalInfo }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [loadingCodigo, setLoadingCodigo] = useState(false);
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [step3, setStep3] = useState<Step3State>("verificando");
  const [step3Error, setStep3Error] = useState<string | null>(null);

  // ESC deshabilitado — el modal no se cierra hasta verificar.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, []);

  async function iniciarVerificacion() {
    setLoadingCodigo(true);
    setCodigoError(null);
    try {
      const res = await fetch("/api/canal/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "iniciar" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCodigoError(data.error || "No se pudo generar el código.");
        return;
      }
      setCodigo(data.codigo);
      setStep(2);
    } catch {
      setCodigoError("Error de conexión.");
    } finally {
      setLoadingCodigo(false);
    }
  }

  async function verificarCodigo() {
    if (!codigo) return;
    setStep(3);
    setStep3("verificando");
    setStep3Error(null);
    try {
      const res = await fetch("/api/canal/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verificar", codigo }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStep3Error(
          data.error ||
            "No encontramos el código en la descripción de tu canal. Asegúrate de haberlo guardado en YouTube Studio y vuelve a intentarlo."
        );
        setStep3("error");
        return;
      }
      // Éxito — avanza al Paso 4 (pantalla final de confirmación).
      setStep(4);
    } catch {
      setStep3Error("Error de conexión. Intenta de nuevo.");
      setStep3("error");
    }
  }

  async function copiarCodigo() {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* silent */
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(20, 20, 24, 0.58)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="verificacion-title"
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-3xl bg-white shadow-[0_24px_64px_rgba(20,20,24,0.24)]"
      >
        {/* Progress segments */}
        <div className="flex gap-1 bg-[#f5f6f7] px-7 pt-7">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background: step >= i ? "linear-gradient(135deg, #6200EE, #ac8eff)" : "#e3e5e6",
              }}
            />
          ))}
        </div>

        <div className="bg-[#f5f6f7] px-7 pt-5 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6200EE]">
            Paso {step} de 4
          </p>
        </div>

        {/* ===== PASO 1 ===== */}
        {step === 1 && (
          <div className="px-7 pt-4 pb-7">
            <h2
              id="verificacion-title"
              className="font-headline text-2xl font-extrabold tracking-[-0.02em] text-[#2c2f30]"
            >
              Verifica que este canal es tuyo
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5b5e60]">
              Para que otros creadores puedan comentar tus videos, necesitamos confirmar
              que eres el dueño del canal. Solo toma 2 minutos.
            </p>

            <div
              className="mt-6 flex items-center gap-4 rounded-2xl p-4"
              style={{ background: "#f5f6f7", border: "1px solid rgba(171,173,174,0.25)" }}
            >
              {canal.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={canal.avatar_url}
                  alt={canal.nombre || "Canal"}
                  referrerPolicy="no-referrer"
                  className="aspect-square h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex aspect-square h-14 w-14 shrink-0 items-center justify-center rounded-full font-headline text-lg font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                >
                  {(canal.nombre || "C").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-headline text-base font-bold text-[#2c2f30]">
                  {canal.nombre || "Tu canal"}
                </p>
                <p className="mt-0.5 text-[13px] text-[#5b5e60]">
                  {formatSubs(canal.suscriptores)} suscriptores
                </p>
              </div>
            </div>

            {codigoError && (
              <p className="mt-4 text-sm text-red-500">{codigoError}</p>
            )}

            <button
              type="button"
              onClick={iniciarVerificacion}
              disabled={loadingCodigo}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
            >
              {loadingCodigo && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {loadingCodigo ? "Generando código…" : "Verificar mi canal →"}
            </button>
          </div>
        )}

        {/* ===== PASO 2 ===== */}
        {step === 2 && codigo && (
          <div className="px-7 pt-4 pb-7">
            <h2
              id="verificacion-title"
              className="font-headline text-2xl font-extrabold tracking-[-0.02em] text-[#2c2f30]"
            >
              Pega este código en tu canal
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5b5e60]">
              Es un texto invisible que confirma que eres tú. Después lo puedes borrar.
            </p>

            {/* Código + copiar */}
            <div
              className="mt-5 flex items-center gap-3 rounded-2xl p-4"
              style={{ background: "#f5f6f7", border: "1px solid rgba(171,173,174,0.25)" }}
            >
              <code
                className="flex-1 truncate font-headline text-lg font-bold tracking-wider text-[#6200EE]"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                {codigo}
              </code>
              <button
                type="button"
                onClick={copiarCodigo}
                className="shrink-0 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-[#6200EE] transition-colors hover:bg-[#f5f6f7]"
                style={{ border: "1px solid rgba(98,0,238,0.25)" }}
              >
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>

            {/* Instrucciones */}
            <ol className="mt-6 space-y-2.5 text-sm leading-relaxed text-[#2c2f30]">
              {[
                "Abre YouTube Studio",
                "Ve a Personalización → Información básica",
                <>Pega el código <span className="font-mono font-bold text-[#6200EE]">{codigo}</span> en cualquier parte de la descripción de tu canal</>,
                "Guarda los cambios",
                "Vuelve aquí y presiona el botón de abajo",
              ].map((txt, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: "rgba(98,0,238,0.1)", color: "#6200EE" }}
                  >
                    {i + 1}
                  </span>
                  <span>{txt}</span>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={verificarCodigo}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
            >
              Ya lo pegué, verificar →
            </button>
          </div>
        )}

        {/* ===== PASO 3 ===== */}
        {step === 3 && (
          <div className="px-7 pt-4 pb-7">
            {step3 === "verificando" && (
              <div className="flex flex-col items-center py-8">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#e3e5e6] border-t-[#6200EE]" />
                <h2
                  id="verificacion-title"
                  className="mt-5 font-headline text-xl font-extrabold tracking-[-0.02em] text-[#2c2f30]"
                >
                  Verificando tu canal…
                </h2>
                <p className="mt-1.5 text-center text-sm text-[#5b5e60]">
                  Estamos leyendo la descripción de tu canal en YouTube.
                </p>
              </div>
            )}

            {step3 === "error" && (
              <>
                <h2
                  id="verificacion-title"
                  className="font-headline text-2xl font-extrabold tracking-[-0.02em] text-[#2c2f30]"
                >
                  Aún no encontramos el código
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#5b5e60]">
                  {step3Error}
                </p>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={verificarCodigo}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
                    style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                  >
                    Reintentar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(2); setStep3Error(null); }}
                    className="w-full rounded-2xl bg-[#e3e5e6] py-3 text-sm font-semibold text-[#5b5e60] transition-colors hover:bg-[#dcdedf] hover:text-[#2c2f30]"
                  >
                    Volver a las instrucciones
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== PASO 4 ===== */}
        {step === 4 && codigo && (
          <div className="px-7 pt-6 pb-7">
            <div className="flex flex-col items-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <svg
                  width={36}
                  height={36}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.1V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
              </div>
              <h2
                id="verificacion-title"
                className="text-center font-headline text-2xl font-extrabold tracking-[-0.02em] text-[#2c2f30]"
              >
                ¡Canal verificado!
              </h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-[#5b5e60]">
                Tu canal quedó confirmado. Ya puedes borrar el código{" "}
                <span className="font-mono font-bold text-[#6200EE]">{codigo}</span>{" "}
                de la descripción de tu canal en YouTube Studio — ya no lo necesitamos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
            >
              Entrar a Comentalo →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
