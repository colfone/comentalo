"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type EstadoUsuario =
  | "activo"
  | "suspendido"
  | "baneado"
  | "eliminado";

type Accion = "suspender" | "reactivar" | "banear" | "eliminar";

type Props = {
  usuario: {
    id: string;
    nombre: string | null;
    estado: EstadoUsuario;
  };
};

type ModalState = {
  accion: Accion;
  motivo: string;
  hasta: string; // datetime-local value
  loading: boolean;
  error: string | null;
};

const TITULO_MODAL: Record<Accion, string> = {
  suspender: "Suspender usuario",
  reactivar: "Reactivar usuario",
  banear: "Banear usuario",
  eliminar: "Eliminar usuario",
};

type HardDeleteModalState = {
  loading: boolean;
  error: string | null;
};

export default function UsuarioAccionesAdmin({ usuario }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [hardDeleteModal, setHardDeleteModal] =
    useState<HardDeleteModalState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // El menú usa position: fixed para escapar el overflow-hidden del contenedor
  // de la tabla. Calculamos coords del trigger al abrir.
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
    // capture:true captura scroll de cualquier ancestor scrollable.
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menuOpen]);

  function openHardDelete() {
    setHardDeleteModal({ loading: false, error: null });
  }

  function closeHardDelete() {
    if (hardDeleteModal?.loading) return;
    setHardDeleteModal(null);
  }

  async function handleHardDelete() {
    if (!hardDeleteModal) return;
    setHardDeleteModal({ loading: true, error: null });

    try {
      const res = await fetch("/api/admin/usuarios/eliminar-cuenta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ usuario_id: usuario.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setHardDeleteModal({
          loading: false,
          error: data.error ?? "Error desconocido.",
        });
        return;
      }

      setHardDeleteModal(null);
      router.refresh();
    } catch (err) {
      setHardDeleteModal({
        loading: false,
        error: err instanceof Error ? err.message : "Error de red.",
      });
    }
  }

  function openModal(accion: Accion) {
    setModal({
      accion,
      motivo: "",
      hasta: "",
      loading: false,
      error: null,
    });
  }

  function closeModal() {
    if (modal?.loading) return;
    setModal(null);
  }

  async function handleConfirm() {
    if (!modal) return;
    const { accion, motivo, hasta } = modal;

    if (
      (accion === "banear" || accion === "eliminar") &&
      motivo.trim().length === 0
    ) {
      setModal({ ...modal, error: "El motivo es obligatorio." });
      return;
    }

    setModal({ ...modal, loading: true, error: null });

    const body: Record<string, string> = {
      usuario_id: usuario.id,
      accion,
    };
    if (motivo.trim().length > 0) body.motivo = motivo.trim();
    if (accion === "suspender" && hasta) {
      const parsed = new Date(hasta);
      if (!Number.isNaN(parsed.getTime())) {
        body.hasta = parsed.toISOString();
      }
    }

    try {
      const res = await fetch("/api/admin/usuarios/moderar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setModal((m) =>
          m
            ? { ...m, loading: false, error: data.error ?? "Error desconocido." }
            : null
        );
        return;
      }

      setModal(null);
      router.refresh();
    } catch (err) {
      setModal((m) =>
        m
          ? {
              ...m,
              loading: false,
              error: err instanceof Error ? err.message : "Error de red.",
            }
          : null
      );
    }
  }

  const { estado, nombre } = usuario;

  const motivoRequerido =
    modal?.accion === "banear" || modal?.accion === "eliminar";
  const confirmDisabled =
    !!modal?.loading ||
    (motivoRequerido && (modal?.motivo.trim().length ?? 0) === 0);

  return (
    <>
      <div className="inline-block" ref={menuRef}>
        <button
          ref={triggerRef}
          onClick={toggleMenu}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="inline-flex items-center gap-1 rounded-md border border-black/15 bg-white px-2 py-1 text-xs font-medium text-[#5b5e60] transition-colors hover:bg-black/5"
        >
          Acciones <span aria-hidden="true">▾</span>
        </button>

        {menuOpen && menuPos && (
          <div
            role="menu"
            style={{
              position: "fixed",
              top: menuPos.top,
              right: menuPos.right,
            }}
            className="z-50 w-44 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
          >
            {estado === "activo" && (
              <>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    openModal("suspender");
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-[#2c2f30] transition-colors hover:bg-black/5"
                >
                  Suspender
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    openModal("banear");
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-[#2c2f30] transition-colors hover:bg-black/5"
                >
                  Banear
                </button>
                <div className="border-t border-black/10" />
              </>
            )}

            {(estado === "suspendido" || estado === "baneado") && (
              <>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    openModal("reactivar");
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-[#2c2f30] transition-colors hover:bg-black/5"
                >
                  Reactivar
                </button>
                <div className="border-t border-black/10" />
              </>
            )}

            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                openHardDelete();
              }}
              className="block w-full px-3 py-2 text-left text-sm text-red-700 transition-colors hover:bg-red-50"
            >
              Eliminar cuenta
            </button>
          </div>
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline text-lg font-bold text-[#2c2f30]">
              {TITULO_MODAL[modal.accion]}
            </h3>
            <p className="mt-1 text-xs text-[#5b5e60]">
              {nombre ?? "(sin nombre)"}
            </p>

            {modal.accion !== "reactivar" && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-[#5b5e60]">
                  Motivo{" "}
                  {motivoRequerido && (
                    <span className="text-red-600">*</span>
                  )}
                </label>
                <textarea
                  value={modal.motivo}
                  onChange={(e) =>
                    setModal((m) =>
                      m
                        ? { ...m, motivo: e.target.value, error: null }
                        : null
                    )
                  }
                  placeholder={
                    motivoRequerido
                      ? "Razón (obligatorio)"
                      : "Razón (opcional)"
                  }
                  rows={3}
                  maxLength={500}
                  disabled={modal.loading}
                  className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-[#6200EE] focus:outline-none disabled:opacity-50"
                />
              </div>
            )}

            {modal.accion === "suspender" && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-[#5b5e60]">
                  Hasta (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={modal.hasta}
                  onChange={(e) =>
                    setModal((m) =>
                      m ? { ...m, hasta: e.target.value } : null
                    )
                  }
                  disabled={modal.loading}
                  className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-[#6200EE] focus:outline-none disabled:opacity-50"
                />
                <p className="mt-1 text-[11px] text-[#9097a0]">
                  Dejar vacío para suspensión indefinida.
                </p>
              </div>
            )}

            {modal.error && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                {modal.error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={modal.loading}
                className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm text-[#2c2f30] transition-colors hover:bg-black/5 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmDisabled}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "#6200EE" }}
              >
                {modal.loading ? "Aplicando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {hardDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeHardDelete}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline text-lg font-bold text-red-700">
              Eliminar cuenta
            </h3>
            <p className="mt-3 text-sm text-[#2c2f30]">
              ¿Eliminar cuenta de{" "}
              <strong>{nombre ?? "(sin nombre)"}</strong>? Esta acción es
              irreversible.
            </p>
            <p className="mt-2 text-xs text-[#5b5e60]">
              Borra la fila de <code>usuarios</code> (con cascade a videos,
              campañas e intercambios) y también elimina la cuenta de{" "}
              <code>auth.users</code>.
            </p>

            {hardDeleteModal.error && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                {hardDeleteModal.error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeHardDelete}
                disabled={hardDeleteModal.loading}
                className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm text-[#2c2f30] transition-colors hover:bg-black/5 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleHardDelete}
                disabled={hardDeleteModal.loading}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {hardDeleteModal.loading ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
