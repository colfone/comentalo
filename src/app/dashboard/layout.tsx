import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import VerificacionCanalModal from "./verificacion-canal-modal";
import CampanaNotificaciones from "@/components/dashboard/CampanaNotificaciones";

// Layout compartido del dashboard: header fijo + gate de verificación.
//
// - El header vive acá para no duplicarlo en cada page.tsx.
// - `CampanaNotificaciones` es el único client component (Realtime).
// - Resto del layout es server.
// - Si la columna `usuarios.saldo_creditos` todavía no existe (migración
//   20260420130000 no aplicada), la query retorna error y renderizamos el
//   header con defaults (0 créditos, iniciales en avatar). Fail-open.
// - Usamos getSession() en vez de getUser() — ver nota histórica: getUser()
//   refresca cookie y Next 16 prohíbe set() en layouts.

// --- Nav icons (inline SVG, se renderizan en server) ---

const HomeIcon = () => (
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
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9.5z" />
  </svg>
);
const SwapIcon = () => (
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
    <path d="M7 4v14m0 0-3-3m3 3 3-3M17 20V6m0 0 3 3m-3-3-3 3" />
  </svg>
);
const InboxIcon = () => (
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
    <path d="M22 13h-6l-2 3h-4l-2-3H2" />
    <path d="M5.5 5h13l3 8v6a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-6z" />
  </svg>
);
const UserIcon = () => (
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
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let mostrarModal = false;
  let canalInfo: {
    nombre: string | null;
    avatar_url: string | null;
    canal_url: string | null;
    suscriptores: number;
  } | null = null;

  let saldoCreditos = 0;
  let avatarUrl: string | null = null;
  let nombre: string | null = null;

  if (user) {
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select(
        "canal_verificado, nombre, avatar_url, canal_url, suscriptores_al_registro, saldo_creditos"
      )
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!error && usuario) {
      saldoCreditos = usuario.saldo_creditos ?? 0;
      avatarUrl = usuario.avatar_url ?? null;
      nombre = usuario.nombre ?? null;

      if (usuario.canal_verificado === false) {
        mostrarModal = true;
        canalInfo = {
          nombre: usuario.nombre,
          avatar_url: usuario.avatar_url,
          canal_url: usuario.canal_url,
          suscriptores: usuario.suscriptores_al_registro ?? 0,
        };
      }
    }
  }

  const initial = (nombre ?? "C").trim().charAt(0).toUpperCase() || "C";

  return (
    <>
      {user && (
        <header className="sticky top-0 z-40 border-b border-black/10 bg-white">
          <div className="mx-auto max-w-[1240px] px-6">
            <div className="flex h-16 items-center gap-4">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-[10px] font-headline text-base font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #6200EE, #ac8eff)",
                  }}
                >
                  C
                </div>
                <span className="font-headline text-lg font-bold tracking-[-0.02em] text-[#2c2f30]">
                  Comentalo
                </span>
              </Link>

              {/* Nav */}
              <nav className="ml-4 flex gap-0.5">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
                >
                  <HomeIcon />
                  Inicio
                </Link>
                <Link
                  href="/dashboard/intercambiar"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
                >
                  <SwapIcon />
                  Comentar
                </Link>
                <Link
                  href="/dashboard/actividad"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
                >
                  <InboxIcon />
                  Mi actividad
                </Link>
                <Link
                  href="/dashboard/perfil"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-sm font-medium text-[#5b5e60] transition-colors hover:bg-[#e9ebec] hover:text-[#2c2f30]"
                >
                  <UserIcon />
                  Perfil
                </Link>
              </nav>

              <div className="flex-1" />

              {/* Badge créditos */}
              <div
                className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold"
                style={{ color: "#6200EE" }}
                aria-label={`${saldoCreditos} créditos`}
              >
                <span aria-hidden="true">💎</span>
                <span className="tabular-nums">{saldoCreditos}</span>
              </div>

              {/* Avatar */}
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={nombre ?? "Avatar del canal"}
                  width={32}
                  height={32}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #6200EE, #ac8eff)",
                  }}
                  aria-hidden="true"
                >
                  {initial}
                </div>
              )}

              {/* Nombre del canal */}
              <span className="hidden max-w-[120px] truncate text-xs text-[#5b5e60] sm:block">
                {nombre ?? ""}
              </span>

              {/* Campana de notificaciones (client island) */}
              <CampanaNotificaciones />
            </div>
          </div>
        </header>
      )}

      {user && saldoCreditos === 0 && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto max-w-[1240px] px-6 py-4">
            <div className="flex items-start gap-4 sm:items-center">
              <div className="text-3xl leading-none" aria-hidden="true">
                💎
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-headline text-base font-bold text-amber-900">
                  Tus créditos llegaron a 0
                </p>
                <p className="mt-0.5 text-sm text-amber-800">
                  Tus campañas están pausadas. Comenta videos de otros
                  creadores para ganar créditos y reactivarlas automáticamente.
                </p>
              </div>
              <Link
                href="/dashboard/intercambiar"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #6200EE, #ac8eff)",
                }}
              >
                Ir a comentar →
              </Link>
            </div>
          </div>
        </div>
      )}

      {children}

      {mostrarModal && canalInfo && <VerificacionCanalModal canal={canalInfo} />}
    </>
  );
}
