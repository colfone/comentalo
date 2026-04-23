# CLAUDE.md — comentalo.com

## Al iniciar cualquier sesión
1. Lee PROYECTO.md completo — fuente de verdad del producto
2. Lee ESTADO.md completo — estado técnico actual del proyecto
3. Ejecuta `npm run dev` para iniciar el servidor de desarrollo
4. Confirma con: "Listo. Proyecto en v[X.XX]. Servidor corriendo en localhost:3000."

## Stack
- Next.js + TypeScript + Tailwind CSS
- Supabase (PostgreSQL)
- Vercel (deploy automático desde master)
- Carpeta local: C:\proyectos\comentalo
- Terminal: Windows PowerShell

## Reglas que nunca se rompen
1. No implementar lógica de pagos — BACKLOG FASE 2
2. Lógica pesada en RPCs de Supabase — Next.js solo es presentación
3. El intercambio se crea SOLO al verificar exitosamente — no existe estado pendiente
4. Siempre leer valores de negocio desde tabla `configuracion` con fallback — nunca hardcodear
5. Al cerrar sesión siempre actualizar ESTADO.md incrementando la versión
6. Mostrar diff o SQL antes de aplicar cualquier cambio importante
7. Nunca avanzar al siguiente paso sin ver el resultado del anterior
8. Si algo no está claro en PROYECTO.md o ESTADO.md — preguntar antes de implementar

## Patrones de código establecidos
- Service client usa `SUPABASE_SECRET_KEY` — bypasea RLS, solo para operaciones server-side
- Admin guard en `src/lib/supabase/admin-guard.ts` — usar siempre en rutas `/admin`
- Config dinámica en `src/lib/config/get-config.ts` — nunca hardcodear valores de negocio
- Migraciones en `supabase/migrations/` con formato `YYYYMMDDHHMMSS_nombre.sql`

## Proceso de migraciones
1. Crear el archivo SQL en `supabase/migrations/`
2. Mostrar el SQL al usuario antes de aplicar
3. El usuario lo aplica manualmente en Supabase SQL Editor
4. Hacer commit del archivo después de confirmar que se aplicó
5. Documentar en ESTADO.md

## Comandos frecuentes
npm run dev                    # Servidor de desarrollo
npm run build                  # Verificar build antes de deploy
npx tsc --noEmit               # Typecheck
git add -A && git commit -m "tipo: descripción" && git push origin master

## Forma de trabajar
- Instrucciones paso a paso — una a la vez
- El usuario ejecuta en Claude Code y comparte el resultado
- Solo avanzar cuando el resultado del paso anterior es visible y correcto
- Ante cualquier duda sobre producto → consultar PROYECTO.md
- Ante cualquier duda sobre estado técnico → consultar ESTADO.md

## Al cerrar cualquier sesión
1. Siempre actualizar ESTADO.md — incrementar versión y documentar cambios técnicos
2. Actualizar PROYECTO.md solo si hubo decisiones de producto nuevas
3. Hacer commit y push de ambos documentos

## Documentos fuente de verdad
- `PROYECTO.md` — visión del producto, reglas de negocio, vocabulario oficial
- `ESTADO.md` — estado técnico real, migraciones aplicadas, pendientes
- `Credenciales.txt` — credenciales del proyecto (NUNCA subir a GitHub)
