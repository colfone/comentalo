import Link from "next/link";
import { requireAdminForPage } from "@/lib/supabase/admin-guard";

// Lista global de campañas. Read-only en esta iteración.
//
// estado CHECK vive con vocabulario dual desde v4.10: abierta/activa se
// muestran como Activas; completada/calificada/finalizada como Finalizadas;
// pausada va sola.

type EstadoCampana =
  | "abierta"
  | "activa"
  | "pausada"
  | "completada"
  | "calificada"
  | "finalizada";

type CampanaFila = {
  id: string;
  estado: EstadoCampana;
  intercambios_completados: number;
  created_at: string;
  videos: {
    titulo: string;
    youtube_video_id: string;
    usuarios: {
      nombre: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
};

const ESTADO_LABEL: Record<EstadoCampana, string> = {
  abierta: "Activa",
  activa: "Activa",
  pausada: "Pausada",
  completada: "Finalizada",
  calificada: "Finalizada",
  finalizada: "Finalizada",
};

const ESTADO_CLASSES: Record<EstadoCampana, string> = {
  abierta: "bg-green-100 text-green-800",
  activa: "bg-green-100 text-green-800",
  pausada: "bg-amber-100 text-amber-800",
  completada: "bg-gray-200 text-gray-700",
  calificada: "bg-gray-200 text-gray-700",
  finalizada: "bg-gray-200 text-gray-700",
};

type TabId = "todas" | "activas" | "pausadas" | "finalizadas";

const TABS: ReadonlyArray<{
  id: TabId;
  label: string;
  estados: ReadonlyArray<EstadoCampana> | null;
}> = [
  { id: "todas", label: "Todas", estados: null },
  { id: "activas", label: "Activas", estados: ["abierta", "activa"] },
  { id: "pausadas", label: "Pausadas", estados: ["pausada"] },
  {
    id: "finalizadas",
    label: "Finalizadas",
    estados: ["completada", "calificada", "finalizada"],
  },
];

// Duplicado del mismo helper presente en /dashboard/** — NFKC + emojis/banderas + sentence case.
function normalizeTitle(titulo: string): string {
  if (!titulo) return "";
  const plano = titulo.normalize("NFKC");
  const sinEmojis = plano
    .replace(
      /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}‍️]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
  if (!sinEmojis) return "";
  const lower = sinEmojis.toLowerCase();
  const firstLetter = lower.search(/\p{L}/u);
  if (firstLetter < 0) return lower;
  return (
    lower.slice(0, firstLetter) +
    lower[firstLetter].toUpperCase() +
    lower.slice(firstLetter + 1)
  );
}

export default async function AdminCampanasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { serviceClient } = await requireAdminForPage();
  const params = await searchParams;

  const activeTab =
    TABS.find((t) => t.id === (params.estado as TabId)) ?? TABS[0];

  let query = serviceClient
    .from("campanas")
    .select(
      "id, estado, intercambios_completados, created_at, videos!inner(titulo, youtube_video_id, usuarios!inner(nombre, avatar_url))"
    )
    .order("created_at", { ascending: false });

  if (activeTab.estados) {
    query = query.in("estado", activeTab.estados as unknown as string[]);
  }

  const { data, error } = await query;
  const campanas = (data ?? []) as unknown as CampanaFila[];

  return (
    <div>
      <h1 className="font-headline text-2xl font-bold tracking-[-0.02em] text-[#2c2f30]">
        Campañas
      </h1>
      <p className="mt-1 text-sm text-[#5b5e60]">
        {campanas.length}{" "}
        {activeTab.id === "todas" ? "en total" : "en este estado"}.
      </p>

      <div className="mt-5 flex gap-1 border-b border-black/10">
        {TABS.map((t) => {
          const isActive = t.id === activeTab.id;
          const href =
            t.id === "todas"
              ? "/admin/campanas"
              : `/admin/campanas?estado=${t.id}`;
          return (
            <Link
              key={t.id}
              href={href}
              className={`-mb-px rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-b-2 border-[#6200EE] text-[#6200EE]"
                  : "text-[#5b5e60] hover:text-[#2c2f30]"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          Error al cargar campañas: {error.message}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-[#f5f5f7] text-xs font-semibold uppercase tracking-wider text-[#5b5e60]">
              <th className="px-4 py-3 text-left">Video</th>
              <th className="px-4 py-3 text-left">Creador</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Comentarios</th>
              <th className="px-4 py-3 text-left">Creada</th>
            </tr>
          </thead>
          <tbody>
            {campanas.map((c) => {
              const video = c.videos;
              const creador = video?.usuarios;
              const thumbUrl = video
                ? `https://i.ytimg.com/vi/${video.youtube_video_id}/mqdefault.jpg`
                : null;
              return (
                <tr
                  key={c.id}
                  className="border-b border-black/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbUrl}
                          alt=""
                          width={64}
                          height={36}
                          className="h-9 w-16 shrink-0 rounded-md bg-[#e5e7eb] object-cover"
                        />
                      ) : (
                        <div className="h-9 w-16 shrink-0 rounded-md bg-[#e5e7eb]" />
                      )}
                      <span className="truncate font-medium text-[#2c2f30]">
                        {video
                          ? normalizeTitle(video.titulo)
                          : "(video eliminado)"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {creador?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={creador.avatar_url}
                          alt=""
                          width={24}
                          height={24}
                          referrerPolicy="no-referrer"
                          className="h-6 w-6 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, #6200EE, #ac8eff)",
                          }}
                          aria-hidden="true"
                        >
                          {(creador?.nombre ?? "C").trim().charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate text-[#2c2f30]">
                        {creador?.nombre ?? "(sin nombre)"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${ESTADO_CLASSES[c.estado]}`}
                    >
                      {ESTADO_LABEL[c.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.intercambios_completados}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5b5e60]">
                    {new Date(c.created_at).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              );
            })}
            {campanas.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-[#9097a0]"
                >
                  No hay campañas en esta vista.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
