import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

interface NotificacionParams {
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  url_destino?: string;
}

export async function crearNotificacion(params: NotificacionParams) {
  const client = getServiceClient();
  await client.from("notificaciones").insert(params);
}
