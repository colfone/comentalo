"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  const botonBase =
    "rounded-md px-2 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  const motivoRequerido =
    modal?.accion === "banear" || modal?.accion === "eliminar";
  const confirmDisabled =
    !!modal?.loading ||
    (motivoRequerido && (modal?.motivo.trim().length ?? 0) === 0);

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {estado === "activo" && (
          <>
            <button
              onClick={() => openModal("suspender")}
              className={`${botonBase} bg-amber-100 text-amber-800 hover:bg-amber-200`}
            >
              Suspender
            </button>
            <button
              onClick={() => openModal("banear")}
              className={`${botonBase} bg-red-100 text-red-800 hover:bg-red-200`}
            >
              Banear
            </button>
          </>
        )}
        {(estado === "suspendido" || estado === "baneado") && (
          <button
            onClick={() => openModal("reactivar")}
            className={`${botonBase} bg-green-100 text-green-800 hover:bg-green-200`}
          >
            Reactivar
          </button>
        )}
        {/* Hard delete: siempre visible, irreversible */}
        <button
          onClick={openHardDelete}
          className={`${botonBase} bg-red-600 text-white hover:bg-red-700`}
          title="Borra usuario de la DB y auth.users (irreversible)"
        >
          Eliminar cuenta
        </button>
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
