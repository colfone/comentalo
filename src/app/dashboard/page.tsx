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
    redirect("/login");
  }

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

      return { ...video, campanas: campanas || [] };
    })
  );

  // Get reputation
  const { data: reputacionData } = await supabase.rpc("calcular_reputacion", {
    p_comentarista_id: usuario.id,
  });

  const reputacion = reputacionData || {
    total_calificados: 0,
    porcentaje: 100,
    nivel: "verde",
    activo: false,
  };

  return (
    <DashboardClient
      user={{ email: user.email || "" }}
      usuario={usuario}
      videosWithCampanas={videosWithCampanas}
      reputacion={reputacion}
    />
  );
}
