import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/canal/verificar-codigo
// Nuevo flujo (v4.9): verifica canal de un usuario que YA existe en `usuarios`
// pero tiene `canal_verificado = false`. Soporta 2 acciones:
//   - { action: "iniciar" }                    → genera/reutiliza código COMENTALO-XXXX
//   - { action: "verificar", codigo: "..." }   → lee descripción del canal en YouTube,
//                                                 si contiene el código → canal_verificado = true

function generarCodigo(): string {
  // 4 caracteres alfanuméricos uppercase, sin chars ambiguos (0, O, I, 1)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let sufijo = "";
  for (let i = 0; i < 4; i++) {
    sufijo += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `COMENTALO-${sufijo}`;
}

async function getSupabaseFromCookies() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );
}

export async function POST(request: Request) {
  const supabase = await getSupabaseFromCookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { action?: string; codigo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, canal_youtube_id, canal_url, nombre, avatar_url")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!usuario) {
    return NextResponse.json(
      { error: "Usuario no encontrado. Completa el registro primero." },
      { status: 404 }
    );
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // ========== ACCIÓN: iniciar ==========
  // Reutiliza código vigente no-verificado si existe (< 24h); si no, genera uno nuevo.
  if (body.action === "iniciar") {
    const { data: existente } = await serviceClient
      .from("verificaciones_canal")
      .select("codigo, expires_at")
      .eq("auth_id", user.id)
      .eq("canal_youtube_id", usuario.canal_youtube_id)
      .eq("verificado", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existente?.codigo) {
      return NextResponse.json({ ok: true, codigo: existente.codigo });
    }

    const codigo = generarCodigo();
    const { error: insertError } = await serviceClient
      .from("verificaciones_canal")
      .insert({
        auth_id: user.id,
        codigo,
        canal_youtube_id: usuario.canal_youtube_id,
        canal_data: { id: usuario.canal_youtube_id },
      });

    if (insertError) {
      console.error("Error insertando verificacion_canal:", insertError);
      return NextResponse.json(
        { error: "No se pudo generar el código. Intenta de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, codigo });
  }

  // ========== ACCIÓN: verificar ==========
  if (body.action === "verificar") {
    if (!body.codigo) {
      return NextResponse.json(
        { error: "Falta el código." },
        { status: 400 }
      );
    }

    const { data: verificacion } = await serviceClient
      .from("verificaciones_canal")
      .select("id, codigo, expires_at")
      .eq("auth_id", user.id)
      .eq("codigo", body.codigo)
      .eq("canal_youtube_id", usuario.canal_youtube_id)
      .eq("verificado", false)
      .maybeSingle();

    if (!verificacion) {
      return NextResponse.json({
        ok: false,
        error: "Código no encontrado. Inicia la verificación nuevamente.",
      });
    }

    if (new Date(verificacion.expires_at) < new Date()) {
      return NextResponse.json({
        ok: false,
        error: "El código expiró. Genera uno nuevo.",
      });
    }

    const ytUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    ytUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
    ytUrl.searchParams.set("id", usuario.canal_youtube_id);
    ytUrl.searchParams.set("part", "snippet");

    const ytRes = await fetch(ytUrl.toString());
    if (!ytRes.ok) {
      return NextResponse.json({
        ok: false,
        error: "Error al consultar YouTube. Intenta de nuevo.",
      });
    }

    const ytData = await ytRes.json();
    if (!ytData.items || ytData.items.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "Canal no encontrado en YouTube.",
      });
    }

    const description: string = ytData.items[0].snippet?.description || "";

    if (!description.includes(body.codigo)) {
      return NextResponse.json({
        ok: false,
        error:
          "No encontramos el código en la descripción de tu canal. Asegúrate de haberlo guardado en YouTube Studio y vuelve a intentarlo.",
      });
    }

    // Código encontrado — marcar usuario como verificado y cerrar la fila
    const { error: updateUserError } = await serviceClient
      .from("usuarios")
      .update({ canal_verificado: true })
      .eq("id", usuario.id);

    if (updateUserError) {
      console.error("Error actualizando canal_verificado:", updateUserError);
      return NextResponse.json({
        ok: false,
        error:
          "Verificación encontrada pero no se pudo guardar. Intenta de nuevo.",
      });
    }

    await serviceClient
      .from("verificaciones_canal")
      .update({ verificado: true })
      .eq("id", verificacion.id);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "Acción no reconocida. Usa { action: 'iniciar' | 'verificar' }." },
    { status: 400 }
  );
}
