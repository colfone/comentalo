"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// /verificar-codigo deprecado (ESTADO.md v4.14). Flujo actual:
// - Usuarios nuevos → /verificar-canal (auto-registro directo)
// - Existentes sin canal verificado → modal en /dashboard/layout.tsx
// Esta page solo redirige según sesión.
export default function VerificarCodigoDeprecated() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      router.replace(user ? "/dashboard" : "/login");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6f7]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgba(171,173,174,0.3)] border-t-[#6200EE]" />
    </div>
  );
}
