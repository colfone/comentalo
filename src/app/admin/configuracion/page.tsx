import { requireAdminForPage } from "@/lib/supabase/admin-guard";
import ConfiguracionForm, {
  type ParametroConfig,
} from "./configuracion-form";

export default async function ConfiguracionPage() {
  const { serviceClient } = await requireAdminForPage();

  const { data, error } = await serviceClient
    .from("configuracion")
    .select("clave, valor, tipo, descripcion, updated_at, updated_by")
    .order("clave", { ascending: true });

  const parametros: ParametroConfig[] = (data ?? []) as ParametroConfig[];

  return (
    <div>
      <h1 className="font-headline text-2xl font-bold tracking-[-0.02em] text-[#2c2f30]">
        Configuración
      </h1>
      <p className="mt-1 text-sm text-[#5b5e60]">
        Parámetros del sistema editables. Cada cambio queda registrado con
        fecha y admin que lo hizo.
      </p>

      <div className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Scope actual:</strong> editar estos valores los guarda en la
        tabla <code>configuracion</code>, pero los RPCs y endpoints todavía
        leen los valores hardcodeados. Conectar los consumidores a esta tabla
        es un paso posterior.
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          Error al cargar parámetros: {error.message}
        </div>
      )}

      <div className="mt-6">
        <ConfiguracionForm parametros={parametros} />
      </div>
    </div>
  );
}
