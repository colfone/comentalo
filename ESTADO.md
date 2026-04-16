# ESTADO.md — comentalo.com

Control de versiones interno del estado tecnico del proyecto.

Fuente de verdad tecnica — refleja unicamente lo que existe en el codigo.
Para la vision del producto, ver PROYECTO.md v3.8.

## Version actual: v1.0 — 16 de abril de 2026

## Registro de versiones

| Version | Sesion | Fecha | Descripcion |
| --- | --- | --- | --- |
| v1.0 | Sesion 1 + 2 + 3 | 16 abril 2026 | Documento inicial — cubre las 3 primeras sesiones de desarrollo |

## Stack confirmado

| Componente | Tecnologia | Version |
| --- | --- | --- |
| Frontend | Next.js (App Router, Turbopack) | 16.2.4 |
| React | React + React DOM | 19.2.4 |
| CSS | Tailwind CSS | 4.x |
| Backend | Next.js API Routes (serverless) | 16.2.4 |
| Base de datos | Supabase (PostgreSQL) | remoto |
| Auth | Supabase Auth + Google OAuth | @supabase/ssr 0.10.2, @supabase/supabase-js 2.103.2 |
| Hosting | Vercel | pendiente de deploy a produccion |
| Lenguaje | TypeScript | 5.x |
| Linter | ESLint + eslint-config-next | 9.x |

## Sesiones completadas

### Sesion 1 — Scaffolding inicial

- Proyecto Next.js 16.2.4 creado con TypeScript y Tailwind CSS
- Configuracion de Supabase (proyecto remoto conectado)
- Variables de entorno configuradas en `.env.local`
- Esquema inicial de base de datos: 5 tablas creadas via migracion

**Archivos relevantes:**
- `package.json` — dependencias base
- `next.config.ts` — configuracion vacia (defaults)
- `tsconfig.json` — configuracion TypeScript
- `.env.local` — 6 variables de entorno
- `supabase/migrations/20260416020535_create_initial_tables.sql`

### Sesion 2 — RPCs y Cron Jobs

- RPC `asignar_intercambio` — asignacion transaccional con SELECT FOR UPDATE SKIP LOCKED
- RPC `procesar_verificaciones_pendientes` — Exponential Backoff (30min, 2h, 8h, 24h)
- pg_cron job cada 5 minutos para ejecutar verificaciones pendientes
- API Route `/api/cron/verificaciones` como endpoint de Vercel Cron (respaldo)
- `vercel.json` con cron diario a las 00:00 UTC

**Archivos relevantes:**
- `supabase/migrations/20260416021340_create_rpc_asignar_intercambio.sql`
- `supabase/migrations/20260416022010_create_rpc_procesar_verificaciones.sql`
- `supabase/migrations/20260416024639_migrate_cron_to_pg_cron.sql`
- `src/app/api/cron/verificaciones/route.ts`
- `vercel.json`

### Sesion 3 — Autenticacion con Google + Verificacion de canal YouTube

- Login con Google via Supabase Auth con scope `youtube.readonly`
- Callback OAuth que obtiene `provider_token` y llama a YouTube Data API v3
- Verificacion automatica de los 4 requisitos del canal (seccion 4B del PROYECTO.md):
  - Antiguedad >= 3 meses
  - Videos publicos >= 1
  - Suscriptores >= 20
  - Canal publico (no oculto)
- Vinculacion permanente del canal a la cuenta (seccion 9.1)
- Pagina de rechazo con motivos especificos
- Dashboard minimo post-registro
- Pagina raiz redirige segun estado de sesion
- Migracion para campos de identidad en tabla `usuarios` + RLS

**Archivos creados:**
- `src/lib/supabase/server.ts` — cliente Supabase server-side (cookies async)
- `src/lib/supabase/client.ts` — cliente Supabase browser-side
- `src/app/login/page.tsx` — pagina de login con boton Google + avisos
- `src/app/auth/callback/route.ts` — callback OAuth + verificacion YouTube + insert en usuarios
- `src/app/registro-rechazado/page.tsx` — pagina de rechazo con motivos
- `src/app/dashboard/page.tsx` — dashboard minimo con datos del canal
- `src/app/page.tsx` — redirige a /login o /dashboard segun sesion
- `supabase/migrations/20260416030000_add_auth_fields_to_usuarios.sql`

**Flujo de autenticacion implementado:**
1. Usuario visita `/login` → ve avisos de vinculacion permanente y cuenta correcta
2. Click "Continuar con Google" → Supabase redirige a Google con scope `youtube.readonly`
3. Google retorna a `/auth/callback` con code
4. Callback intercambia code por sesion → obtiene `provider_token`
5. Llama a `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`
6. Verifica 4 requisitos de seccion 4B
7. Si pasa: insert en tabla `usuarios` → redirige a `/dashboard`
8. Si no pasa: sign out → redirige a `/registro-rechazado?reason=...`

## Estado actual del esquema de base de datos

### Tabla: usuarios

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| canal_youtube_id | TEXT | NOT NULL, UNIQUE |
| canal_url | TEXT | NOT NULL |
| suscriptores_al_registro | INTEGER | NOT NULL, DEFAULT 0 |
| antiguedad | DATE | NOT NULL |
| reputacion | NUMERIC(5,2) | NOT NULL, DEFAULT 100.00 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| auth_id | UUID | UNIQUE (agregado en sesion 3) |
| email | TEXT | nullable (agregado en sesion 3) |
| nombre | TEXT | nullable (agregado en sesion 3) |
| avatar_url | TEXT | nullable (agregado en sesion 3) |
| videos_al_registro | INTEGER | NOT NULL, DEFAULT 0 (agregado en sesion 3) |

RLS habilitado. Politicas: `usuarios_select_own` (SELECT where auth.uid() = auth_id), `usuarios_insert_own` (INSERT with check auth.uid() = auth_id).

### Tabla: videos

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| usuario_id | UUID | NOT NULL, FK → usuarios(id) ON DELETE CASCADE |
| youtube_video_id | TEXT | NOT NULL, UNIQUE |
| titulo | TEXT | NOT NULL |
| vistas | INTEGER | NOT NULL, DEFAULT 0 |
| estado | TEXT | NOT NULL, DEFAULT 'activo', CHECK IN ('activo', 'suspendido', 'completado') |
| intercambios_disponibles | INTEGER | NOT NULL, DEFAULT 10 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### Tabla: campanas

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| video_id | UUID | NOT NULL, FK → videos(id) ON DELETE CASCADE |
| estado | TEXT | NOT NULL, DEFAULT 'abierta', CHECK IN ('abierta', 'completada', 'calificada') |
| intercambios_completados | INTEGER | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| closed_at | TIMESTAMPTZ | nullable |

### Tabla: intercambios

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| campana_id | UUID | NOT NULL, FK → campanas(id) ON DELETE CASCADE |
| comentarista_id | UUID | NOT NULL, FK → usuarios(id) ON DELETE CASCADE |
| texto_comentario | TEXT | NOT NULL |
| timestamp_copia | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| estado | TEXT | NOT NULL, DEFAULT 'pendiente', CHECK IN ('pendiente', 'verificado', 'rechazado') |
| calificacion | TEXT | nullable, CHECK IN ('positiva', 'negativa') |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### Tabla: verificaciones_pendientes

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| intercambio_id | UUID | NOT NULL, FK → intercambios(id) ON DELETE CASCADE |
| proximo_intento_at | TIMESTAMPTZ | NOT NULL |
| intentos | INTEGER | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### Indices

- `idx_videos_usuario_id` ON videos(usuario_id)
- `idx_videos_estado` ON videos(estado)
- `idx_campanas_video_id` ON campanas(video_id)
- `idx_campanas_estado` ON campanas(estado)
- `idx_intercambios_campana_id` ON intercambios(campana_id)
- `idx_intercambios_comentarista_id` ON intercambios(comentarista_id)
- `idx_intercambios_estado` ON intercambios(estado)
- `idx_verificaciones_proximo_intento` ON verificaciones_pendientes(proximo_intento_at)
- `idx_usuarios_auth_id` ON usuarios(auth_id)

## Rutas existentes en el proyecto

### Paginas (App Router)

| Ruta | Archivo | Tipo | Descripcion |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Dynamic (server) | Redirige a /login o /dashboard segun sesion |
| `/login` | `src/app/login/page.tsx` | Static (client) | Login con Google OAuth |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Dynamic (route handler) | Callback OAuth + verificacion YouTube |
| `/dashboard` | `src/app/dashboard/page.tsx` | Dynamic (server) | Dashboard minimo post-registro |
| `/registro-rechazado` | `src/app/registro-rechazado/page.tsx` | Static (client) | Motivos de rechazo del canal |

### API Routes

| Ruta | Archivo | Metodo | Descripcion |
| --- | --- | --- | --- |
| `/api/cron/verificaciones` | `src/app/api/cron/verificaciones/route.ts` | GET | Ejecuta RPC procesar_verificaciones_pendientes (protegido con CRON_SECRET) |

## RPCs en Supabase

| Nombre | Parametros | Retorno | Descripcion |
| --- | --- | --- | --- |
| `asignar_intercambio` | `p_comentarista_id UUID` | JSON `{ ok, intercambio_id, campana_id, video_id }` o `{ ok, error, mensaje }` | Asigna video de la cola al comentarista. Usa SELECT FOR UPDATE SKIP LOCKED. Valida: usuario tiene video activo, no tiene 3+ pendientes, cola no vacia |
| `procesar_verificaciones_pendientes` | ninguno | JSON `{ ok, procesados, reprogramados, marcados_revision }` | Procesa reintentos con Exponential Backoff (30min, 2h, 8h, 24h). Marca como rechazado tras 4 intentos fallidos |

## pg_cron Jobs en Supabase

| Nombre | Schedule | Comando |
| --- | --- | --- |
| `procesar-verificaciones-pendientes` | `*/5 * * * *` (cada 5 minutos) | `SELECT procesar_verificaciones_pendientes()` |

## Variables de entorno (.env.local)

| Variable | Proposito |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publica de Supabase |
| `SUPABASE_SECRET_KEY` | Clave secreta de Supabase (server-side) |
| `YOUTUBE_API_KEY` | API key de YouTube Data API v3 (verificacion de comentarios) |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth (scope youtube.readonly) |
| `CRON_SECRET` | Token de autorizacion para el endpoint cron de Vercel |

## Migraciones aplicadas

| Archivo | Descripcion | Estado |
| --- | --- | --- |
| `20260416020535_create_initial_tables.sql` | 5 tablas + 8 indices | Aplicada |
| `20260416021340_create_rpc_asignar_intercambio.sql` | RPC asignar_intercambio | Aplicada |
| `20260416022010_create_rpc_procesar_verificaciones.sql` | RPC procesar_verificaciones_pendientes | Aplicada |
| `20260416024639_migrate_cron_to_pg_cron.sql` | pg_cron job cada 5 minutos | Aplicada |
| `20260416030000_add_auth_fields_to_usuarios.sql` | Campos auth + RLS en usuarios | Aplicada |

## Sesion siguiente

Sesion 4 — Flujo del intercambio
Pendiente: registro de video, cola de intercambios, flujo de comentario con boton Copiar y Ya publique, verificacion automatica via API.

---

REGLA: Al finalizar cada sesion, actualizar este archivo incrementando la version y documentando todo lo que cambio.
