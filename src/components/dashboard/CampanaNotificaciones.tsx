"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Campana de notificaciones con dropdown y Realtime.
// Extraída de dashboard-client.tsx (v4.3 de notificaciones) para usarse
// como client island dentro de src/app/dashboard/layout.tsx.
// El resto del layout se mantiene como server component.

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  url_destino: string | null;
  created_at: string;
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
}

const BellIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

export default function CampanaNotificaciones() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);

  async function fetchNotificaciones() {
    try {
      const res = await fetch("/api/notificaciones");
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data.notificaciones || []);
        setNoLeidas(data.no_leidas ?? 0);
      }
    } catch {
      /* silent */
    }
  }

  async function handleMarcarLeida(notifId: string) {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, leida: true } : n))
    );
    setNoLeidas((prev) => Math.max(0, prev - 1));
    await fetch("/api/notificaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificacion_id: notifId }),
    });
  }

  useEffect(() => {
    fetchNotificaciones();
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("dashboard-notificaciones")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones" },
        () => fetchNotificaciones()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notificaciones"
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#e9ebec] text-[#5b5e60] transition-colors hover:bg-[#e3e5e6]"
      >
        <BellIcon />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E87722] text-[9px] font-bold text-white ring-2 ring-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-black/5 bg-white shadow-xl">
          <div className="border-b border-black/5 px-4 py-3">
            <p className="text-sm font-semibold text-[#2c2f30]">Notificaciones</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-[#595c5d]">
                Sin notificaciones
              </p>
            ) : (
              notificaciones.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.leida) handleMarcarLeida(n.id);
                    if (n.url_destino) {
                      setOpen(false);
                      router.push(n.url_destino);
                    }
                  }}
                  className={`block w-full border-b border-black/5 px-4 py-3 text-left transition-colors hover:bg-[#f5f6f7] ${
                    !n.leida ? "bg-[#6200EE]/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.leida && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#E87722]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#2c2f30]">{n.titulo}</p>
                      <p className="mt-0.5 text-xs text-[#595c5d]">{n.mensaje}</p>
                      <p className="mt-1 text-[10px] text-[#595c5d]/60">
                        {tiempoRelativo(n.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
