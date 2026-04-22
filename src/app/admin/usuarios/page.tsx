import { requireAdminForPage } from "@/lib/supabase/admin-guard";

// Lista de usuarios con saldo, campañas activas, fecha registro.
// Sin paginación en esta iteración — la base es chica.
//
// Conteo de campañas activas: nested select `campanas.videos(usuario_id)`
// para resolver el owner por FK, luego agregación en JS.

type CampanaConOwner = {
  id: string;
  videos: { usuario_id: string } | null;
};

type UsuarioFila = {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
  canal_url: string | null;
  saldo_creditos: number | null;
  created_at: string;
  es_admin: boolean;
};

export default async function AdminUsuariosPage() {
  const { serviceClient } = await requireAdminForPage();

  const [usuariosRes, campanasRes] = await Promise.all([
    serviceClient
      .from("usuarios")
      .select(
        "id, nombre, avatar_url, canal_url, saldo_creditos, created_at, es_admin"
      )
      .order("created_at", { ascending: false }),
    serviceClient
      .from("campanas")
      .select("id, videos(usuario_id)")
      .in("estado", ["abierta", "activa"]),
  ]);

  const usuarios: UsuarioFila[] = (usuariosRes.data ?? []) as UsuarioFila[];
  const campanas = (campanasRes.data ?? []) as unknown as CampanaConOwner[];

  const countPorUsuario = new Map<string, number>();
  for (const c of campanas) {
    const uid = c.videos?.usuario_id;
    if (uid) countPorUsuario.set(uid, (countPorUsuario.get(uid) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="font-headline text-2xl font-bold tracking-[-0.02em] text-[#2c2f30]">
        Usuarios
      </h1>
      <p className="mt-1 text-sm text-[#5b5e60]">
        {usuarios.length} registrados.
      </p>

      {usuariosRes.error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          Error al cargar usuarios: {usuariosRes.error.message}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-[#f5f5f7] text-xs font-semibold uppercase tracking-wider text-[#5b5e60]">
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Canal</th>
              <th className="px-4 py-3 text-right">Saldo</th>
              <th className="px-4 py-3 text-right">Campañas activas</th>
              <th className="px-4 py-3 text-left">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr
                key={u.id}
                className="border-b border-black/5 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatar_url}
                        alt={u.nombre ?? "Avatar"}
                        width={32}
                        height={32}
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #6200EE, #ac8eff)",
                        }}
                        aria-hidden="true"
                      >
                        {(u.nombre ?? "C").trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-[#2c2f30]">
                          {u.nombre ?? "(sin nombre)"}
                        </span>
                        {u.es_admin && (
                          <span className="rounded-md bg-[#6200EE]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6200EE]">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.canal_url ? (
                    <a
                      href={u.canal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#6200EE] hover:underline"
                    >
                      Ver canal
                    </a>
                  ) : (
                    <span className="text-xs text-[#9097a0]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {u.saldo_creditos ?? 0}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {countPorUsuario.get(u.id) ?? 0}
                </td>
                <td className="px-4 py-3 text-xs text-[#5b5e60]">
                  {new Date(u.created_at).toLocaleDateString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
