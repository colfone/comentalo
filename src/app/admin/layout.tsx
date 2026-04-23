import Link from "next/link";
import { requireAdminForPage } from "@/lib/supabase/admin-guard";

// Layout del panel admin. Gate via requireAdminForPage() — redirige si no
// corresponde. Chrome distinto del dashboard de usuario: banda superior
// oscura con label "Admin" + sidebar izquierdo, para que sea obvio el
// contexto y no se confunda con el área de usuario.

const DashboardIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

const UsersIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.9" />
    <path d="M16 3.1a4 4 0 0 1 0 7.8" />
  </svg>
);

const MegaphoneIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m3 11 18-8v18L3 13z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminForPage();

  const navLinkClass =
    "inline-flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#c7c9cc] transition-colors hover:bg-white/5 hover:text-white";

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Banda superior oscura */}
      <header className="sticky top-0 z-40 border-b border-black/30 bg-[#1a1c1e] text-white">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="flex h-14 items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-[8px] font-headline text-sm font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #6200EE, #ac8eff)",
                }}
              >
                C
              </div>
              <span className="font-headline text-base font-bold tracking-[-0.02em]">
                Comentalo
              </span>
              <span className="ml-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                Admin
              </span>
            </div>

            <div className="flex-1" />

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#c7c9cc] transition-colors hover:bg-white/5 hover:text-white"
            >
              <ExitIcon />
              Salir del panel
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1240px] gap-6 px-6 py-6">
        {/* Sidebar izquierdo */}
        <aside className="w-56 shrink-0">
          <nav className="flex flex-col gap-1 rounded-xl bg-[#1a1c1e] p-2">
            <Link href="/admin" className={navLinkClass}>
              <DashboardIcon />
              Resumen
            </Link>
            <Link href="/admin/configuracion" className={navLinkClass}>
              <SettingsIcon />
              Configuración
            </Link>
            <Link href="/admin/usuarios" className={navLinkClass}>
              <UsersIcon />
              Usuarios
            </Link>
            <Link href="/admin/campanas" className={navLinkClass}>
              <MegaphoneIcon />
              Campañas
            </Link>
          </nav>
        </aside>

        {/* Contenido */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
