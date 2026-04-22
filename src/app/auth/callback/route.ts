import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/supabase/admin-guard";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  // Exchange OAuth code for session
  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData.session) {
    console.error("Session exchange error:", sessionError);
    return NextResponse.redirect(`${origin}/login?error=session_failed`);
  }

  const user = sessionData.session.user;

  // Admins van directo al panel — no necesitan canal linkeado.
  if (isAdminEmail(user.email)) {
    return NextResponse.redirect(`${origin}/admin`);
  }

  // Check if user already has a linked channel
  const { data: existingAccount } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existingAccount) {
    // Already registered — go to dashboard
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // New user — needs to verify channel
  return NextResponse.redirect(`${origin}/verificar-canal`);
}
