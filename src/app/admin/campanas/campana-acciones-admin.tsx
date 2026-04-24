"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Menú "Acciones ▾" para cada campaña en /admin/campanas.
// Mismo patrón que usuario-acciones-admin.tsx: dropdown con position:fixed,
// cierre por click fuera/Escape/scroll. Pausar y Activar son inline; Finalizar
// abre un modal de confirmación porque es terminal e irreversible.

export type EstadoCampanaActiva = "activa" | "pausada" | "finalizada";

type Accion = "pausar" | "activar" | "finalizar";

type Props = {
  campanaId: string;
  estado: EstadoCampanaActiva;
};

type ConfirmModalState = {
  loading: boolean;
  error: string | null;
};

const ENDPOINT_BY_ACCION: Record<Accion, string> = {
  pausar: "/api/admin/campanas/pausar",
  activar: "/api/admin/campanas/activar",
  finalizar: "/api/admin/campanas/finalizar",
};

export default function CampanaAccionesAdmin({ campanaId, estado }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null
  );
  const [pending, setPending] = useState<Accion | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(
    null
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Campañas terminales no tienen acciones — no renderizamos el menú.
  if (estado === "finalizada") {
    return <span className="text-xs text-[#9097a0]">—</span>;
  }

  function toggleMenu() {
    setMenuOpen((open) => {
      if (open) return false;
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
      return true;
    });
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function handleScroll() {
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menuOpen]);

  async function ejecutarAccion(accion: Accion) {
    setPending(accion);
    setInlineError(null);
    try {
      const res = await fetch(ENDPOINT_BY_ACCION[accion], {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campana_id: campanaId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setInlineError(data.error ?? "Error al ejecutar la acción.");
        window.setTimeout(() => setInlineError(null), 4000);
        return false;
      }
      router.refresh();
      return true;
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Error de red.");
      window.setTimeout(() => setInlineError(null), 4000);
      return false;
    } finally {
      setPending(null);
    }
  }

  function openFinalizar() {
    setConfirmModal({ loading: false, error: null });
  }

  function closeFinalizar() {
    if (confirmModal?.loading) return;
    setConfirmModal(null);
  }

  async function handleConfirmFinalizar() {
    if (!confirmModal) return;
    setConfirmModal({ loading: true, error: null });
    try {
      const res = await fetch(ENDPOINT_BY_ACCION.finalizar, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campana_id: campanaId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setConfirmModal({
          loading: false,
          error: data.error ?? "Error al finalizar la campaña.",
        });
        return;
      }
      setConfirmModal(null);
      router.refresh();
    } catch (err) {
      setConfirmModal({
        loading: false,
        error: err instanceof Error ? err.message : "Error de red.",
      });
    }
  }

  const esActiva = estado === "activa";
  const esPausada = estado === "pausada";

  return (
    <>
      <div className="inline-block" ref={menuRef}>
        <button
          ref={triggerRef}
          onClick={toggleMenu}
          disabled={pending !== null}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="inline-flex items-center gap-1 rounded-md border border-black/15 bg-white px-2 py-1 text-xs font-medium text-[#5b5e60] transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Aplicando…" : "Acciones"}{" "}
          <span aria-hidden="true">▾</span>
        </button>

        {inlineError && (
          <div className="mt-1 rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-800">
            {inlineError}
          </div>
        )}

        {menuOpen && menuPos && (
          <div
            role="menu"
            style={{
              position: "fixed",
              top: menuPos.top,
              right: menuPos.right,
            }}
            className="z-50 w-40 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
          >
            {esActiva && (
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  ejecutarAccion("pausar");
                }}
                className="block w-full px-3 py-2 text-left text-sm text-[#2c2f30] transition-colors hover:bg-black/5"
              >
                Pausar
              </button>
            )}
            {esPausada && (
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  ejecutarAccion("activar");
                }}
                className="block w-full px-3 py-2 text-left text-sm text-[#2c2f30] transition-colors hover:bg-black/5"
              >
                Activar
              </button>
            )}
            <div className="border-t border-black/10" />
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                openFinalizar();
              }}
              className="block w-full px-3 py-2 text-left text-sm text-red-700 transition-colors hover:bg-red-50"
            >
              Finalizar
            </button>
          </div>
        )}
      </div>

      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeFinalizar}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline text-lg font-bold text-red-700">
              Finalizar campaña
            </h3>
            <p className="mt-3 text-sm text-[#2c2f30]">
              ¿Finalizar esta campaña? Esta acción es irreversible — la
              campaña pasa al estado <strong>finalizada</strong> y no puede
              volver a activarse.
            </p>

            {confirmModal.error && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                {confirmModal.error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeFinalizar}
                disabled={confirmModal.loading}
                className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm text-[#2c2f30] transition-colors hover:bg-black/5 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmFinalizar}
                disabled={confirmModal.loading}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {confirmModal.loading ? "Finalizando…" : "Sí, finalizar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
