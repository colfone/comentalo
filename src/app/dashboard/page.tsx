import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select(
      "id, nombre, canal_url, canal_youtube_id, avatar_url, suscriptores_al_registro, reputacion"
    )
    .eq("auth_id", user.id)
    .single();

  if (!usuario) {
    redirect("/verificar-canal");
  }

  // Service client for cross-user queries
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Fetch videos
  const { data: videos } = await supabase
    .from("videos")
    .select(
      "id, youtube_video_id, titulo, vistas, estado, suspensiones_count, created_at"
    )
    .eq("usuario_id", usuario.id)
    .order("created_at", { ascending: false });

  // Fetch campaigns for each video
  const videosWithCampanas = await Promise.all(
    (videos || []).map(async (video) => {
      const { data: campanas } = await supabase
        .from("campanas")
        .select("id, estado, intercambios_completados, created_at")
        .eq("video_id", video.id)
        .order("created_at", { ascending: false });

      const tieneVerificados = (campanas || []).some(
        (c) => c.intercambios_completados > 0
      );

      return { ...video, campanas: campanas || [], puede_eliminar: !tieneVerificados };
    })
  );

  // Get reputation — wrapped in try/catch to prevent page crash
  let reputacion = {
    total_calificados: 0,
    promedio_estrellas: 5,
    porcentaje: 100,
    nivel: "verde",
    activo: false,
  };
  try {
    const { data: reputacionData } = await supabase.rpc("calcular_reputacion", {
      p_comentarista_id: usuario.id,
    });
    if (reputacionData) {
      reputacion = {
        ...reputacion,
        ...reputacionData,
        porcentaje: Number(reputacionData.porcentaje) || 100,
        promedio_estrellas: Number(reputacionData.promedio_estrellas) || 5,
        total_calificados: Number(reputacionData.total_calificados) || 0,
      };
    }
  } catch (e) {
    console.error("Error calling calcular_reputacion:", e);
  }

  // Stats: intercambios dados (where this user is the commentator, verified)
  const { count: intercambiosDados } = await serviceClient
    .from("intercambios")
    .select("id", { count: "exact", head: true })
    .eq("comentarista_id", usuario.id)
    .eq("estado", "verificado");

  // Stats: intercambios recibidos (verified intercambios in this user's campaigns)
  const videoIds = (videos || []).map((v) => v.id);
  let intercambiosRecibidos = 0;
  if (videoIds.length > 0) {
    const { data: userCampanas } = await serviceClient
      .from("campanas")
      .select("id")
      .in("video_id", videoIds);

    const campanaIds = (userCampanas || []).map((c: { id: string }) => c.id);
    if (campanaIds.length > 0) {
      const { count } = await serviceClient
        .from("intercambios")
        .select("id", { count: "exact", head: true })
        .in("campana_id", campanaIds)
        .eq("estado", "verificado");
      intercambiosRecibidos = count ?? 0;
    }
  }

  // Stats: campanas completadas
  let campanasCompletadas = 0;
  if (videoIds.length > 0) {
    const { data: completedCampanas } = await serviceClient
      .from("campanas")
      .select("id")
      .in("video_id", videoIds)
      .or("estado.eq.completada,estado.eq.calificada");
    campanasCompletadas = completedCampanas?.length ?? 0;
  }

  return (
    <DashboardClient
      user={{ email: user.email || "" }}
      usuario={usuario}
      videosWithCampanas={videosWithCampanas}
      reputacion={reputacion}
      stats={{
        intercambiosDados: intercambiosDados ?? 0,
        intercambiosRecibidos,
        campanasCompletadas,
      }}
    />
  );
}
