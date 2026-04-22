// Server-only helper para leer la tabla `configuracion` con cache in-memory.
// Nunca lanza: ante cualquier fallo retorna el fallback que da el caller.
//
// TTL de 60s por entrada. En serverless cada instancia tiene su propio cache;
// eventual consistency entre instancias tras un edit desde /admin.
//
// Invalidación explícita: invalidateConfigCache() limpia todo el Map. Se llama
// desde PUT /api/admin/configuracion cuando el admin edita un valor.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CacheEntry = {
  valor: string | null;
  expiresAt: number;
};

const TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

let serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
  }
  return serviceClient;
}

async function fetchValue(
  clave: string
): Promise<{ ok: true; valor: string | null } | { ok: false }> {
  const { data, error } = await getServiceClient()
    .from("configuracion")
    .select("valor")
    .eq("clave", clave)
    .maybeSingle();

  if (error) {
    console.error(`[configuracion] Error leyendo clave '${clave}':`, error);
    return { ok: false };
  }
  return { ok: true, valor: data?.valor ?? null };
}

export async function getConfigValue(clave: string): Promise<string | null> {
  const now = Date.now();
  const cached = cache.get(clave);
  if (cached && cached.expiresAt > now) {
    return cached.valor;
  }

  const result = await fetchValue(clave);
  if (!result.ok) {
    // Error de DB — no cachear, el caller usa el fallback.
    // Próximos requests reintentan.
    return null;
  }

  // Cacheamos también null (clave ausente): evita re-queries durante TTL.
  cache.set(clave, { valor: result.valor, expiresAt: now + TTL_MS });
  return result.valor;
}

export async function getConfigInt(
  clave: string,
  fallback: number
): Promise<number> {
  const valor = await getConfigValue(clave);
  if (valor === null) return fallback;
  const parsed = parseInt(valor, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getConfigText(
  clave: string,
  fallback: string
): Promise<string> {
  const valor = await getConfigValue(clave);
  return valor ?? fallback;
}

export async function getConfigBool(
  clave: string,
  fallback: boolean
): Promise<boolean> {
  const valor = await getConfigValue(clave);
  if (valor === null) return fallback;
  if (valor === "true") return true;
  if (valor === "false") return false;
  return fallback;
}

export function invalidateConfigCache(): void {
  cache.clear();
}
