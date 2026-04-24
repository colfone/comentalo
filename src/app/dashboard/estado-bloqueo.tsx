"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  estado: "suspendido" | "baneado";
  motivo: string | null;
  hasta: string | null;
};

function formatHasta(iso: string): string {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hora = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${fecha} a las ${hora}`;
}

export default function EstadoBloqueo({ estado, motivo, hasta }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const titulo =
    estado === "baneado"
      ? "Tu cuenta fue baneada permanentemente"
      : hasta
        ? `Tu cuenta está suspendida hasta el ${formatHasta(hasta)}`
        : "Tu cuenta está suspendida indefinidamente";

  const subtitulo =
    estado === "baneado"
      ? "No vas a poder acceder a Comentalo. Si creés que esto es un error, contactá a soporte."
      : hasta
        ? "Cuando pase esa fecha, tu cuenta se reactiva automáticamente."
        : "Contactá a soporte para más información sobre cuándo se reactivará.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6f7] px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
            style={{ background: "#fde4e4" }}
            aria-hidden="true"
          >
            {estado === "baneado" ? "🚫" : "⏸️"}
          </div>
          <h1 className="font-headline text-xl font-bold leading-tight text-[#2c2f30]">
            {titulo}
          </h1>
        </div>

        <p className="text-sm text-[#5b5e60]">{subtitulo}</p>

        {motivo && (
          <div className="mt-4 rounded-lg bg-[#f5f6f7] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5b5e60]">
              Motivo
            </p>
            <p className="mt-1 text-sm text-[#2c2f30]">{motivo}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <a
            href="mailto:soporte@comentalo.com"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
            style={{
              background: "linear-gradient(135deg, #6200EE, #ac8eff)",
            }}
          >
            Contactar a soporte
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center rounded-lg bg-[#e3e5e6] px-4 py-2.5 text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#fde4e4] hover:text-[#c43535]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
