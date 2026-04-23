"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Perfil — info personal, reputación, stats, créditos y cuenta.
// La gestión de campañas vive en /dashboard/campanas desde v4.28.

interface UsuarioInfo {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
  canal_url: string | null;
  suscriptores_al_registro: number;
  reputacion: number | null;
  saldo_creditos: number;
  created_at: string;
}

interface Stats {
  comentariosTotales: string;
  comentariosMes: string;
  campanasCompletadas: string;
  calificacionPositiva: string;
}

interface RepLevel {
  label: string;
  dot: string;
}

function formatSubs(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(".0", "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
}

function formatMemberSince(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleDateString("es-LA", { month: "long" });
  const year = d.getFullYear();
  const now = new Date();
  return year === now.getFullYear() ? `Miembro desde ${month}` : `Miembro desde ${month} ${year}`;
}

function reputacionLevel(rep: number | null, totalCalificados: number): RepLevel {
  if (totalCalificados < 20) return { label: "Sin activar", dot: "#dcdedf" };
  if (rep == null) return { label: "—", dot: "#dcdedf" };
  if (rep >= 4.0) return { label: "Verde", dot: "#22c55e" };
  if (rep >= 3.0) return { label: "Amarillo", dot: "#eab308" };
  if (rep >= 2.0) return { label: "Naranja", dot: "#f97316" };
  return { label: "Rojo", dot: "#ef4444" };
}

function initials(nombre: string | null): string {
  if (!nombre) return "C";
  const parts = nombre.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase() || "C";
}

const ExternalIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  </svg>
);

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioInfo | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [totalCalificados, setTotalCalificados] = useState(0);
  const [repLevel, setRepLevel] = useState<RepLevel>({ label: "Sin activar", dot: "#dcdedf" });
  const [stats, setStats] = useState<Stats>({
    comentariosTotales: "—",
    comentariosMes: "—",
    campanasCompletadas: "—",
    calificacionPositiva: "—",
  });

  useEffect(() => {
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/"); return; }
        setEmail(user.email ?? null);

        const { data: u } = await supabase
          .from("usuarios")
          .select(
            "id, nombre, avatar_url, canal_url, suscriptores_al_registro, reputacion, saldo_creditos, created_at"
          )
          .eq("auth_id", user.id)
          .maybeSingle();
        if (!u) { router.replace("/verificar-canal"); return; }
        setUsuario(u as UsuarioInfo);

        // --- Stats ---
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: comentariosTotales } = await supabase
          .from("intercambios")
          .select("*", { count: "exact", head: true })
          .eq("comentarista_id", u.id);

        const { count: comentariosMes } = await supabase
          .from("intercambios")
          .select("*", { count: "exact", head: true })
          .eq("comentarista_id", u.id)
          .gte("created_at", startOfMonth.toISOString());

        // Calificación positiva — estrellas ≥ 4 / total calificados.
        const { data: calificados } = await supabase
          .from("intercambios")
          .select("estrellas")
          .eq("comentarista_id", u.id)
          .not("estrellas", "is", null);
        const totalCal = calificados?.length ?? 0;
        const positivos = (calificados ?? []).filter(
          (c: { estrellas: number }) => c.estrellas >= 4
        ).length;
        const calificacionPositiva =
          totalCal > 0
            ? `${Math.round((positivos / totalCal) * 100)}%`
            : "—";

        // Campañas completadas — join video.usuario_id
        const { count: campanasCompletadas } = await supabase
          .from("campanas")
          .select("*, videos!inner(usuario_id)", { count: "exact", head: true })
          .eq("videos.usuario_id", u.id)
          .in("estado", ["completada", "calificada"]);

        setStats({
          comentariosTotales: (comentariosTotales ?? 0).toString(),
          comentariosMes: (comentariosMes ?? 0).toString(),
          campanasCompletadas: (campanasCompletadas ?? 0).toString(),
          calificacionPositiva,
        });

        setTotalCalificados(totalCal);
        setRepLevel(reputacionLevel(u.reputacion, totalCal));
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
            Tu canal
          </p>
          <h1 className="font-headline text-[clamp(32px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em] text-[#2c2f30]">
            Perfil
          </h1>
        </div>

        {/* ===== IDENTITY CARD ===== */}
        <div className="mb-6 flex flex-wrap items-center gap-5 rounded-3xl bg-white p-7">
          {loading && !usuario ? (
            <div className="flex w-full justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e9ebec] border-t-[#6200EE]" />
            </div>
          ) : usuario ? (
            <>
              {/* Avatar */}
              {usuario.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={usuario.avatar_url}
                  alt={usuario.nombre || "Perfil"}
                  referrerPolicy="no-referrer"
                  className="aspect-square h-20 w-20 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex aspect-square h-20 w-20 shrink-0 items-center justify-center rounded-full font-headline text-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #6200EE, #ac8eff)" }}
                >
                  {initials(usuario.nombre)}
                </div>
              )}

              {/* Info */}
              <div className="min-w-[200px] flex-1">
                <h2 className="m-0 font-headline text-2xl font-bold text-[#2c2f30]">
                  {usuario.nombre || "Creador"}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#5b5e60]">
                  <span>{formatSubs(usuario.suscriptores_al_registro)} suscriptores</span>
                  <span className="inline-block h-[3px] w-[3px] rounded-full bg-[#abadae]" />
                  <span>{formatMemberSince(usuario.created_at)}</span>
                </div>
                {usuario.canal_url && (
                  <a
                    href={usuario.canal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[13px] text-[#6200EE] hover:underline"
                  >
                    Ver canal
                    <ExternalIcon />
                  </a>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* ===== REPUTACIÓN ===== */}
        <div className="mb-6 rounded-3xl bg-white p-7">
          <h3 className="m-0 mb-4 font-headline text-xl font-semibold text-[#2c2f30]">
            Reputación
          </h3>
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eff1f2] px-4 py-2 text-sm font-medium text-[#2c2f30]">
              <span
                className="h-[10px] w-[10px] rounded-full"
                style={{ background: repLevel.dot, boxShadow: `0 0 0 4px ${repLevel.dot}33` }}
              />
              {repLevel.label}
            </span>
            {totalCalificados >= 20 && usuario?.reputacion != null && (
              <span className="font-headline text-3xl font-bold tracking-[-0.02em] text-[#2c2f30]">
                {usuario.reputacion.toFixed(1)}★
              </span>
            )}
            {totalCalificados < 20 && (
              <span className="text-sm text-[#5b5e60]">
                {totalCalificados}/20 comentarios calificados para activarla
              </span>
            )}
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div
          className="mb-6 grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {[
            { k: stats.comentariosTotales, l: "Comentarios realizados" },
            { k: stats.comentariosMes, l: "Comentarios este mes" },
            { k: stats.campanasCompletadas, l: "Campañas completadas" },
            { k: stats.calificacionPositiva, l: "Calificación positiva" },
          ].map((s, i) => (
            <div key={i} className="rounded-3xl bg-white p-5">
              <div className="font-headline text-[clamp(28px,3.5vw,40px)] font-bold leading-none tracking-[-0.02em] text-[#2c2f30]">
                {s.k}
              </div>
              <div className="mt-2 text-[13px] leading-[1.5] text-[#5b5e60]">{s.l}</div>
            </div>
          ))}
        </div>

        {/* ===== CRÉDITOS ===== */}
        <div className="mb-6 rounded-3xl bg-white p-7">
          <h3 className="m-0 mb-4 font-headline text-xl font-semibold text-[#2c2f30]">
            Créditos
          </h3>
          <div className="flex flex-wrap items-center gap-5">
            <span className="text-5xl leading-none" aria-hidden="true">💎</span>
            <div className="min-w-0">
              <div className="font-headline text-[clamp(32px,4vw,48px)] font-bold leading-none tracking-[-0.02em] tabular-nums text-[#2c2f30]">
                {usuario?.saldo_creditos ?? 0}
              </div>
              <div className="mt-2 text-sm text-[#5b5e60]">
                {(usuario?.saldo_creditos ?? 0) === 0
                  ? "Comenta videos de otros creadores para ganar más."
                  : "Tu saldo disponible."}
              </div>
            </div>
          </div>
        </div>

        {/* ===== CUENTA ===== */}
        <div className="mb-6 rounded-3xl bg-white p-7">
          <h3 className="m-0 mb-4 font-headline text-xl font-semibold text-[#2c2f30]">
            Cuenta
          </h3>
          {email && (
            <div className="mb-5">
              <div className="text-xs font-medium uppercase tracking-[0.05em] text-[#8c8e90]">
                Email vinculado
              </div>
              <div className="mt-1 text-sm text-[#2c2f30]">{email}</div>
            </div>
          )}
          <button
            type="button"
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              router.replace("/");
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#e3e5e6] px-4 py-2 text-[13px] font-medium text-[#5b5e60] transition-colors hover:bg-[#fde4e4] hover:text-[#c43535]"
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    </div>
  );
}
