"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Historial de créditos del usuario autenticado.
// Lee /api/usuarios/historial-creditos (service client server-side) porque
// movimientos_creditos tiene RLS cerrada.

type OrigenDB =
  | "bienvenida"
  | "crear_campana"
  | "comentar"
  | "calificar"
  | "ajuste_admin";

interface Movimiento {
  id: string;
  monto: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  origen: OrigenDB;
  motivo: string | null;
  created_at: string;
}

const ORIGEN_LABEL: Record<OrigenDB, string> = {
  bienvenida: "Bienvenida",
  crear_campana: "Creación de campaña",
  comentar: "Comentario",
  calificar: "Calificación",
  ajuste_admin: "Ajuste de admin",
};

function formatFecha(iso: string): string {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-AR");
  const hora = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${fecha} ${hora}`;
}

function formatMonto(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export default function CreditosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saldo, setSaldo] = useState<number>(0);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/usuarios/historial-creditos");
        if (res.status === 401) {
          router.replace("/");
          return;
        }
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Error al cargar el historial.");
          return;
        }
        setSaldo(json.saldo_actual ?? 0);
        setMovimientos(json.movimientos ?? []);
      } catch {
        setError("Error de red al cargar el historial.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      <main className="mx-auto max-w-[1240px] px-6 pb-16 pt-8">
        {/* ===== HERO ===== */}
        <div className="py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6200EE]">
            Tu cuenta
          </p>
          <h1 className="font-headline text-[clamp(32px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em] text-[#2c2f30]">
            Historial de créditos
          </h1>
        </div>

        {/* ===== SALDO ===== */}
        <div className="mb-6 rounded-3xl bg-white p-7">
          <div className="flex flex-wrap items-center gap-5">
            <span className="text-5xl leading-none" aria-hidden="true">
              💎
            </span>
            <div className="min-w-0">
              <div className="font-headline text-[clamp(32px,4vw,48px)] font-bold leading-none tracking-[-0.02em] tabular-nums text-[#2c2f30]">
                {saldo}
              </div>
              <div className="mt-2 text-sm text-[#5b5e60]">
                Saldo disponible.
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABLA ===== */}
        <div className="overflow-hidden rounded-3xl bg-white">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-center text-sm text-red-700">
              {error}
            </div>
          ) : movimientos.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-[#5b5e60]">
              Sin movimientos registrados aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 bg-[#f5f5f7] text-xs font-semibold uppercase tracking-wider text-[#5b5e60]">
                    <th className="px-5 py-3 text-left">Fecha</th>
                    <th className="px-5 py-3 text-right">Monto</th>
                    <th className="px-5 py-3 text-right">Saldo resultante</th>
                    <th className="px-5 py-3 text-left">Origen</th>
                    <th className="px-5 py-3 text-left">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => {
                    const isPositive = m.monto > 0;
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-black/5 last:border-0"
                      >
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-[#5b5e60]">
                          {formatFecha(m.created_at)}
                        </td>
                        <td
                          className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums"
                          style={{ color: isPositive ? "#16a34a" : "#dc2626" }}
                        >
                          {formatMonto(m.monto)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-[#2c2f30]">
                          {m.saldo_nuevo}
                        </td>
                        <td className="px-5 py-3 text-[#2c2f30]">
                          {ORIGEN_LABEL[m.origen] ?? m.origen}
                        </td>
                        <td className="px-5 py-3 text-[#5b5e60]">
                          {m.motivo ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
