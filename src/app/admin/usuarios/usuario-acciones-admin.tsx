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
    saldo_creditos: number;
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

type AjusteModalState = {
  monto: string; // input crudo; parseamos al enviar
  motivo: string;
  loading: boolean;
  error: string | null;
};

type Origen =
  | "ajuste_admin"
  | "bienvenida"
  | "crear_campana"
  | "comentar"
  | "calificar";

type Movimiento = {
  id: string;
  monto: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  origen: Origen;
  motivo: string | null;
  created_at: string;
};

type HistorialModalState = {
  loading: boolean;
  error: string | null;
  movimientos: Movimiento[];
};

const ORIGEN_LABEL: Record<Origen, string> = {
  ajuste_admin: "Ajuste admin",
  bienvenida: "Bienvenida",
  crear_campana: "Crear campaña",
  comentar: "Comentar",
  calificar: "Calificar",
};

export default function UsuarioAccionesAdmin({ usuario }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [hardDeleteModal, setHardDeleteModal] =
    useState<HardDeleteModalState | null>(null);
  const [ajusteModal, setAjusteModal] =
    useState<AjusteModalState | null>(null);
  const [historialModal, setHistorialModal] =
    useState<HistorialModalState | null>(null);
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

  function openAjuste() {
    setAjusteModal({ monto: "", motivo: "", loading: false, error: null });
  }

  function closeAjuste() {
    if (ajusteModal?.loading) return;
    setAjusteModal(null);
  }

  async function openHistorial() {
    setHistorialModal({ loading: true, error: null, movimientos: [] });
    try {
      const res = await fetch(
        `/api/admin/usuarios/historial-creditos?usuario_id=${encodeURIComponent(
          usuario.id
        )}`
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setHistorialModal({
          loading: false,
          error: data.error ?? "Error al leer historial.",
          movimientos: [],
        });
        return;
      }
      setHistorialModal({
        loading: false,
        error: null,
        movimientos: (data.movimientos ?? []) as Movimiento[],
      });
    } catch (err) {
      setHistorialModal({
        loading: false,
        error: err instanceof Error ? err.message : "Error de red.",
        movimientos: [],
      });
    }
  }

  function closeHistorial() {
    if (historialModal?.loading) return;
    setHistorialModal(null);
  }

  async function handleConfirmAjuste() {
    if (!ajusteModal) return;
    const montoNum = parseInt(ajusteModal.monto, 10);
    if (!Number.isFinite(montoNum) || montoNum === 0) {
      setAjusteModal({
        ...ajusteModal,
        error: "Ingresá un número entero distinto de 0.",
      });
      return;
    }

    setAjusteModal({ ...ajusteModal, loading: true, error: null });

    const motivoTrim = ajusteModal.motivo.trim();

    try {
      const res = await fetch("/api/admin/usuarios/ajustar-creditos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuario.id,
          monto: montoNum,
          motivo: motivoTrim.length > 0 ? motivoTrim : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAjusteModal((m) =>
          m
            ? { ...m, loading: false, error: data.error ?? "Error desconocido." }
            : null
        );
        return;
      }

      setAjusteModal(null);
      router.refresh();
    } catch (err) {
      setAjusteModal((m) =>
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
              </>
            )}

            {(estado === "suspendido" || estado === "baneado") && (
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
            )}

            {estado !== "eliminado" && (
              <>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    openAjuste();
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-[#2c2f30] transition-colors hover:bg-black/5"
                >
                  Ajustar créditos
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    openHistorial();
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-[#2c2f30] transition-colors hover:bg-black/5"
                >
                  Ver historial 💎
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

      {ajusteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeAjuste}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline text-lg font-bold text-[#2c2f30]">
              Ajustar créditos
            </h3>
            <p className="mt-1 text-xs text-[#5b5e60]">
              {nombre ?? "(sin nombre)"}
            </p>

            <div className="mt-3 rounded-lg bg-[#f5f5f7] px-3 py-2 text-sm text-[#2c2f30]">
              Saldo actual: <strong>{usuario.saldo_creditos} 💎</strong>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#5b5e60]">
                Cantidad (+/-) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step={1}
                value={ajusteModal.monto}
                onChange={(e) =>
                  setAjusteModal((m) =>
                    m ? { ...m, monto: e.target.value, error: null } : null
                  )
                }
                placeholder="Ej: 50 (suma) o -30 (resta)"
                disabled={ajusteModal.loading}
                className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-mono focus:border-[#6200EE] focus:outline-none disabled:opacity-50"
              />
              <p className="mt-1 text-[11px] text-[#9097a0]">
                Positivo suma, negativo resta. El saldo resultante no puede quedar negativo.
              </p>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-[#5b5e60]">
                Motivo (opcional)
              </label>
              <textarea
                value={ajusteModal.motivo}
                onChange={(e) =>
                  setAjusteModal((m) =>
                    m ? { ...m, motivo: e.target.value } : null
                  )
                }
                placeholder="Razón del ajuste"
                rows={2}
                maxLength={500}
                disabled={ajusteModal.loading}
                className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-[#6200EE] focus:outline-none disabled:opacity-50"
              />
            </div>

            {ajusteModal.error && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                {ajusteModal.error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAjuste}
                disabled={ajusteModal.loading}
                className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm text-[#2c2f30] transition-colors hover:bg-black/5 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAjuste}
                disabled={
                  ajusteModal.loading ||
                  ajusteModal.monto.trim().length === 0
                }
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #6200EE, #ac8eff)",
                }}
              >
                {ajusteModal.loading ? "Aplicando…" : "Confirmar →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {historialModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeHistorial}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline text-lg font-bold text-[#2c2f30]">
              Historial de créditos
            </h3>
            <p className="mt-1 text-xs text-[#5b5e60]">
              {nombre ?? "(sin nombre)"}
            </p>

            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {historialModal.loading ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
                </div>
              ) : historialModal.error ? (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                  {historialModal.error}
                </div>
              ) : historialModal.movimientos.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#5b5e60]">
                  Sin movimientos registrados aún.
                </p>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-black/10 text-left text-[11px] font-semibold uppercase tracking-wide text-[#9097a0]">
                      <th className="py-2 pr-3">Fecha</th>
                      <th className="py-2 pr-3">Monto</th>
                      <th className="py-2 pr-3">Saldo resultante</th>
                      <th className="py-2 pr-3">Origen</th>
                      <th className="py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialModal.movimientos.map((m) => {
                      const fecha = new Date(m.created_at).toLocaleString(
                        "es-LA",
                        { dateStyle: "short", timeStyle: "short" }
                      );
                      const montoTxt =
                        (m.monto > 0 ? "+" : "") + m.monto + " 💎";
                      const montoCls =
                        m.monto > 0
                          ? "text-green-700"
                          : m.monto < 0
                            ? "text-red-700"
                            : "text-[#2c2f30]";
                      return (
                        <tr
                          key={m.id}
                          className="border-b border-black/5 align-top"
                        >
                          <td className="py-2 pr-3 text-[13px] tabular-nums text-[#5b5e60]">
                            {fecha}
                          </td>
                          <td
                            className={`py-2 pr-3 text-[13px] font-semibold tabular-nums ${montoCls}`}
                          >
                            {montoTxt}
                          </td>
                          <td className="py-2 pr-3 text-[13px] tabular-nums text-[#2c2f30]">
                            {m.saldo_nuevo} 💎
                          </td>
                          <td className="py-2 pr-3 text-[13px] text-[#2c2f30]">
                            {ORIGEN_LABEL[m.origen]}
                          </td>
                          <td
                            className="max-w-[220px] truncate py-2 text-[13px] text-[#5b5e60]"
                            title={m.motivo ?? undefined}
                          >
                            {m.motivo ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={closeHistorial}
                disabled={historialModal.loading}
                className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm text-[#2c2f30] transition-colors hover:bg-black/5 disabled:opacity-40"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
