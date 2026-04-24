"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Botón "Salir del panel" del header admin. Client island para poder llamar
// supabase.auth.signOut() — antes era un <Link href="/dashboard"> que solo
// cambiaba de contexto sin cerrar sesión. Ahora cierra sesión y redirige a
// /login, coherente con el botón de /dashboard/perfil y /verificar-canal.

const ExitIcon = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export default function AdminSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#c7c9cc] transition-colors hover:bg-white/5 hover:text-white"
    >
      <ExitIcon />
      Salir del panel
    </button>
  );
}
