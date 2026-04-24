import { requireAdminForPage } from "@/lib/supabase/admin-guard";

// Dashboard resumen del panel admin. Consulta directa al service client
// (sin hop HTTP a un endpoint intermedio — misma convención que
// dashboard/page.tsx del área de usuario).

export default async function AdminResumenPage() {
  const { serviceClient } = await requireAdminForPage();

  const [usuariosRes, campanasRes, creditosRes] = await Promise.all([
    serviceClient
      .from("usuarios")
      .select("id", { count: "exact", head: true }),
    serviceClient
      .from("campanas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "activa"),
    serviceClient.from("usuarios").select("saldo_creditos"),
  ]);

  const totalUsuarios = usuariosRes.count ?? 0;
  const campanasActivas = campanasRes.count ?? 0;
  const creditosEnCirculacion = (creditosRes.data ?? []).reduce(
    (sum, row) => sum + (row.saldo_creditos ?? 0),
    0
  );

  return (
    <div>
      <h1 className="font-headline text-2xl font-bold tracking-[-0.02em] text-[#2c2f30]">
        Resumen
      </h1>
      <p className="mt-1 text-sm text-[#5b5e60]">
        Vista general del estado del ecosistema.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total usuarios" value={totalUsuarios} />
        <StatCard label="Campañas activas" value={campanasActivas} />
        <StatCard
          label="Créditos en circulación"
          value={creditosEnCirculacion}
          accent
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-[#5b5e60]">
        {label}
      </div>
      <div
        className="mt-2 font-headline text-3xl font-bold tabular-nums tracking-[-0.02em]"
        style={{ color: accent ? "#6200EE" : "#2c2f30" }}
      >
        {value.toLocaleString("es-AR")}
      </div>
    </div>
  );
}
