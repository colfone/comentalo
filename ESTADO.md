# ESTADO.md — comentalo.com

Control de versiones interno del estado tecnico del proyecto.

Fuente de verdad tecnica — refleja unicamente lo que existe en el codigo.
Para la vision del producto, ver PROYECTO.md v4.1.

## Version actual: v4.26 — 22 de abril de 2026

## Registro de versiones

| Version | Sesion | Fecha | Descripcion |
| --- | --- | --- | --- |
| v1.0 | Sesion 1 + 2 + 3 | 16 abril 2026 | Documento inicial — cubre las 3 primeras sesiones de desarrollo |
| v1.1 | Sesion 4 (bloques 1 y 2) | 16 abril 2026 | Registro de video, grid de seleccion, cache YouTube, flujo comentarista, bug fix canal ajeno |
| v1.2 | Sesion 4 (bloque 3) | 16 abril 2026 | Verificacion automatica via YouTube API, Realtime, suspension de video, flujo pendientes |
| v1.3 | Sesion 5 | 16 abril 2026 | Dashboard del creador con campanas, calificacion 👍/👎, auto-calificacion 72h, reputacion con niveles |
| v1.4 | Sesion 6 | 16 abril 2026 | Dashboard Realtime, suspension con reactivacion, reincidencia, Realtime en campanas y videos |
| v1.5 | Sesion 7 | 16 abril 2026 | Deploy a Vercel, pulido visual, manifiesto en login, 404, metadata, vocabulario auditado |
| v1.6 | Fix multi-canal | 16 abril 2026 | Soporte para cuentas Google con multiples canales YouTube — pagina de seleccion de canal |
| v1.7 | Refactor auth | 16 abril 2026 | Eliminado scope youtube.readonly — verificacion de canal por codigo en descripcion |
| v1.8 | Fix reputacion | 16 abril 2026 | Badge de reputacion muestra "Sin activar" con contador X/20 hasta alcanzar 20 intercambios calificados |
| v1.9 | Fix registro video | 16 abril 2026 | Thumbnail en confirmacion de registro + mensaje de campana correcto segun vistas |
| v2.0 | Eliminar video | 16 abril 2026 | Opcion de eliminar video sin intercambios verificados desde el dashboard |
| v2.1 | PROYECTO.md v3.9 | 16 abril 2026 | Documentado flujo verificacion por codigo (9.5), regla eliminacion videos (4C.5), actualizado 4B.1/6B.5/9.2/10.1 |
| v2.2 | Fix estado campanas | 16 abril 2026 | Dashboard muestra estado correcto de campanas, boton lanzar campana, API POST /api/campanas/lanzar |
| v2.3 | Fix RLS campanas | 16 abril 2026 | INSERT/UPDATE policies en campanas, registrar usa service client para crear campana |
| v2.4 | Fix asignar video | 16 abril 2026 | /api/intercambios/asignar usa service client para leer video de otro usuario (RLS bloqueaba select_own) |
| v2.5 | UX intercambiar | 16 abril 2026 | Textarea readonly como fallback de clipboard, boton YouTube destacado, selector de emojis |
| v2.6 | UX navegacion | 16 abril 2026 | Boton volver al dashboard en todos los estados del flujo intercambiar (write, copied, verificando) |
| v2.7 | Cancelar intercambio | 16 abril 2026 | Boton "No puedo comentar este video" + POST /api/intercambios/cancelar — elimina intercambio pendiente y libera slot |
| v2.8 | Fix copiar/verificar | 16 abril 2026 | /api/intercambios/copiar usa service client (RLS bloqueaba UPDATE), frontend bloquea si save falla |
| v2.9 | Fixes + detalle campana | 16 abril 2026 | Fix countdown timer, texto "Ya publique mi comentario", detalle de campana con calificacion inline |
| v3.0 | UX ver detalle | 16 abril 2026 | Enlace "Ver detalle" visible en cada fila de campana del dashboard |
| v3.1 | UX boton detalle | 16 abril 2026 | "Ver detalle" cambiado de link texto a boton con estilo (bg-gray-700, rounded-lg) |
| v3.2 | Notificaciones | 16 abril 2026 | Sistema completo de notificaciones: tabla, 5 tipos, Realtime, campana con contador, panel desplegable |
| v3.3 | PROYECTO.md v4.0 | 16 abril 2026 | Documentada seccion 6G — Sistema de notificaciones en PROYECTO.md |
| v3.4 | Logout | 16 abril 2026 | Boton cerrar sesion en header del dashboard junto al icono de campana |
| v3.5 | Landing page | 16 abril 2026 | /login reemplazado por landing profesional — hero, como funciona, fundadores, footer. Nuevo sistema de diseno |
| v3.6 | Simplificar landing | 16 abril 2026 | Eliminada seccion Fundadores de la landing — queda Nav, Hero, Como funciona, Footer |
| v3.7 | Color primary | 16 abril 2026 | Primary actualizado de #6a1cf6 a #6200EE en globals.css y landing — color oficial definitivo |
| v3.8 | Cierre de sesion | 16 abril 2026 | PROYECTO.md v4.1 con seccion 6H sistema de diseno. ESTADO.md consolidado |
| v3.9 | Rediseno dashboard | 17 abril 2026 | Nuevo layout claro, header fijo, perfil con avatar, 4 stats sidebar, video cards con progress bar, El Manifiesto, footer |
| v4.0 | Rediseno intercambiar | 17 abril 2026 | Layout dos columnas, thumbnail grande con overlay, card Tu Tarea y El Creador, estados write/copied/verificando, boton Cancelar visible |
| v4.1 | Rediseno registrar-video | 17 abril 2026 | Grid 3 columnas, badge PASO 01/02, overlay YA REGISTRADO, card buscar URL, boton Seleccionar sobre thumbnail, paso 2 con preview tipo/tono/moderacion |
| v4.2 | Mejoras registrar-video | 17 abril 2026 | Likes y comentarios en grid y preview, sentence case titulos, bloqueo videos sin comentarios, overlay comentarios desactivados |
| v4.3 | Cierre sesion 17 abril | 17 abril 2026 | ESTADO.md actualizado, fix DB vacia en dashboard, maxResults 8 |
| v4.4 | Rediseno campana + estrellas | 17 abril 2026 | Rediseno campana/[campanaId]: hero con thumbnail, 3 stat cards, tabs Todos/Verificados/Pendientes, comment cards con avatar, badge de estado, sistema de estrellas 1-5 con hover naranja y labels. Migracion DB columna estrellas. RPC calcular_reputacion actualizado a promedio de estrellas. Dashboard muestra promedio en formato 4.2★ |
| v4.5 | Flujo 2 videos simultaneos | 18 abril 2026 | Cambio estructural en flujo de intercambio: el sistema ahora asigna 2 videos simultaneos en lugar de 1. Nueva tabla reservas_intercambio con expiracion de 5 minutos. RPC asignar_intercambio reescrito para devolver 2 videos. Nuevo RPC confirmar_intercambio que crea el intercambio al elegir y libera el otro. Nuevo endpoint /api/intercambios/confirmar. Vista /dashboard/intercambiar rediseñada con 2 cards lado a lado y boton "Participar →" en cada una |
| v4.6 | Sesión prototipo | 18 abril 2026 | Nueva landing Paso 1/3, nueva /verificar-canal Paso 2/3 con auto-registro directo, nueva /bienvenida Paso 3/3, flujo /verificar-codigo deprecado |
| v4.7 | Sesión prototipo día 2 | 18 abril 2026 | Cola rediseñada, Mi actividad nueva, Perfil nuevo, Detalle del intercambio nuevo, flujo onboarding completo en producción |
| v4.8 | Rediseño Crear campaña + detalle intercambio | 19 abril 2026 | Rediseño /dashboard/registrar-video "Crear campaña" con nav floating Cola/Mi actividad/Perfil, banner amarillo de advertencia previo al grid, flujo 2 pasos (seleccionar video / pegar link → configurar campaña), cards tipo/tono con descripción, helper normalizeTitle (NFKC para letras matemáticas + regex emojis/banderas + sentence case saltando puntuación inicial). Commit del detalle del intercambio /dashboard/intercambiar/[campanaId] |
| v4.9 | Nav unificado + modal verificación + consolidación | 19 abril 2026 | Nav floating unificado en las 6 pantallas de dashboard: Inicio/Comentar/Mi actividad/Perfil (labels finales tras varias iteraciones — "Cola" pasó a "Comentar"; "Mis campañas" se introdujo y luego se fusionó dentro de /dashboard/actividad como tab "Recibiendo"). Rediseño /dashboard principal a nav floating glass + vocabulario "Comentarios dados/recibidos" + normalizeTitle. Paso 2 de Crear campaña cambiado a campo libre "Notas para los comentaristas" (elimina selectores tipo/tono, mantiene 300 chars). /dashboard/actividad con tabs top-level Comentando/Recibiendo — Recibiendo fusiona Mi campaña activa + lista de campañas con botones Pausar/Eliminar (solo confirm dialog, sin API). /dashboard/intercambiar con 4 stats reales conectados a Supabase (Comentarios totales, Comentarios este mes, Reputación con Sin activar <20 calificados, Campañas activas). Botón cerrar sesión recuperado en /dashboard/perfil. Modal obligatorio de verificación de canal en 4 pasos sobre /dashboard/layout.tsx cuando canal_verificado=false — paso 4 éxito con recordatorio de borrar código. Nueva columna usuarios.canal_verificado BOOLEAN DEFAULT false. Endpoint /api/canal/verificar-codigo reescrito con acciones iniciar/verificar. Fix avatar con referrerPolicy="no-referrer". PROYECTO.md sección 5D nueva — Estados y acciones de campañas (Activa/Pausada/Finalizada/Eliminada + tabla de acciones + reglas) |
| v4.10 | APIs campañas + modal confirmación + fix detalle intercambio | 19 abril 2026 | 4 endpoints nuevos (POST /api/campanas/pausar, /activar, /finalizar, /eliminar) según sección 5D con validación de ownership via service client y mapa de transiciones válidas. Migración expand_campanas_estado: CHECK expandido a 'abierta/completada/calificada/activa/pausada/finalizada' (vocabulario dual por ahora — abierta sigue viva para campañas legacy). Subcomponente CampanaAcciones en /dashboard/perfil y tab Recibiendo de /dashboard/actividad muestra Pausar/Finalizar/Eliminar (activa) o Activar/Finalizar/Eliminar (pausada); Eliminar solo si intercambios_completados=0; terminal states ocultan botones. ConfirmModal personalizado reemplaza window.confirm() en las 3 pantallas (perfil + actividad + detalle intercambio) — overlay fade + card pop con cubic-bezier, Confirmar gradient primary, Cancelar gris, dismissable por ESC/backdrop. Fix crítico: /dashboard/intercambiar/[campanaId] mostraba "No encontramos este intercambio" porque los joins !inner a campanas/videos/usuarios eran bloqueados por RLS (policies solo permiten leer al dueño del video, no al comentarista). Nueva RPC get_intercambio_detalle LANGUAGE sql SECURITY DEFINER que bypasea RLS con filtro por auth.uid(); detail page migrado a supabase.rpc(). normalizeTitle aplicado a títulos de videos en cola /dashboard/intercambiar |
| v4.11 | Bugs Mi actividad + cola + cookies + vocabulario intercambios | 20 abril 2026 | RPC get_mis_intercambios_comentarista (LANGUAGE sql, SECURITY DEFINER): resuelve bug del tab "Pendientes" de /dashboard/actividad que mostraba 0 filas por el mismo patrón RLS+joins!inner que afectó al detail page en v4.10. Frontend migrado a supabase.rpc(). RPC asignar_intercambio reescrito a LANGUAGE sql con fix: c.estado IN ('abierta', 'activa') — campañas que pasaron por Pausar → Activar (quedan en 'activa') volvían invisibles en la cola. Fix /dashboard/layout.tsx: getUser() → getSession() para evitar error de Next 16 "Cookies can only be modified in a Server Action or Route Handler" cuando Supabase intentaba refrescar token desde server component. Endpoint /api/intercambios/copiar eliminó guard 409 para soportar re-copia en estado pendiente (flujo "Volver a intentarlo"). Refactor completo de /dashboard/intercambiar/[campanaId]: eliminado countdown por completo (state, tick, interval, render, helper getMinWaitSeconds, import useCallback), pantalla "Intercambio en revisión" reescrita como "No encontramos tu comentario" con botones Volver a intentarlo / Cancelar (usa ConfirmCancelarModal), modal motivacional "Antes de comentar" simplificado a un solo botón "Abrir video en YouTube →" con texto nuevo sobre ayuda al creador sin imponer tiempo mínimo. Texto helper rediseñado para no parecer botón. Chip "Verificando" → "No encontramos tu comentario" en /dashboard/actividad (otras 4 ocurrencias de "Verificando" en la app auditadas y confirmadas como contextos distintos — no tocadas) |
| v4.12 | Sesión 20 abril tarde | 20 abril 2026 | Fix vocabulario "Comentario verificado". Refactor Mi actividad: 2 tabs Comentando/Recibiendo con calificación estrellas inline. Flujo intercambio por pasos con YT IFrame API y tracking 30s. Pantalla de rechazo con 4 causas + canal del usuario. Intercambio se crea SOLO al verificar exitosamente — elimina estado pendiente huérfano. RPC confirmar_intercambio reescrita sin INSERT intercambios. /api/intercambios/copiar eliminado. /api/intercambios/verificar reescrito: recibe campana_id + texto_comentario. PROYECTO.md v4.4 — campañas sin límite de tiempo controladas por créditos, secciones 5E y 5F. |
| v4.13 | Sesión 20 abril noche | 20 abril 2026 | Flujo intercambio por pasos completo: Paso 1 video 30s, Paso 2 escribir con instrucciones creador, Paso 3 pegar en YouTube, Paso 4 verificación. Layout una columna 700px. Panel lateral eliminado. Botones morados (#6200EE / #ac8eff). Sin modal "Antes de comentar". RPC get_campana_para_comentar nueva. Intercambio se crea solo al verificar. Sistema de créditos: columna saldo_creditos, RPC aplicar_creditos_intercambio. Header unificado en layout con 💎 créditos + avatar + nombre canal. /api/intercambios/copiar eliminado. RPC confirmar_intercambio reescrita sin INSERT intercambios. |
| v4.14 | Sesión 21 abril | 21 abril 2026 | Migraciones faltantes sesión 20 abril creadas en repo. Fix emojis YouTube en verificación (normalizarParaMatch quita ️). Modal de verificación animado con lupa + logo YouTube: estado buscando 5s obligatorio + segunda búsqueda 30s silenciosa. Reasignación silenciosa de cola cada 115s sin mensaje al usuario. TTL reservas 2 minutos. Botón copiar inline en Paso 3. Textos modal cancelación mejorados. Pantalla éxito con textos corregidos. router.refresh() en botón Aceptar para actualizar créditos en header. Fix RPC aplicar_creditos_intercambio: pausa TODAS las campañas del creador cuando saldo llega a 0. Badge naranja Pausada en dashboard. Campañas pausadas visibles en tab En curso. |
| v4.15 | Sesión 21 abril (continuación) | 21 abril 2026 | Deprecar /verificar-codigo con redirect a /dashboard o /login. Limpiar pg_cron procesar-verificaciones-pendientes desactivado. RPC aplicar_creditos_intercambio v3: reactivación automática de campañas del comentarista cuando saldo sube de 0 a 1. Fix filtro "En curso" en dashboard incluye estados abierta/pausada/activa. Fix RPC pausa todas las campañas del creador cuando saldo llega a 0. |
| v4.16 | Sesión 21 abril (cierre) | 21 abril 2026 | Trigger trg_credito_inicial_campana: 1 crédito inicial al crear primera campaña. Vocabulario auditado: "Ir a la cola" → "Comentar", "Volver a la cola" → "Volver", "Volver a la cola" CTA → "Volver a comentar". Pendiente anotado: nav header faltante en /dashboard/campana/[campanaId]. |
| v4.17 | Sesión 21 abril (cierre final) | 21 abril 2026 | Fix nav header en /dashboard/campana/[campanaId] — removido header custom que tapaba el del layout. Vocabulario "dashboard" → "inicio" en todos los textos visibles al usuario (6 ocurrencias). Fix destino botón back en registrar-video: /dashboard/intercambiar → /dashboard. |
| v4.18 | Sesión 21 abril (documentación) | 21 abril 2026 | PROYECTO.md v4.7 — modelo de créditos v2 documentado: sin techo de créditos, 60 créditos de bienvenida, -30 por campaña, +1 por comentario dado, +1 por calificación recibida, campañas 30 días fijos. Eliminada sección 5E. Descartados borradores y crédito de compensación por simultaneidad. Pantalla detalle campaña: vocabulario intercambios→comentarios, card única Comentarios verificados, título con normalizeTitle. |
| v4.19 | Sesión 22 abril | 22 abril 2026 | Panel admin /admin funcional: layout oscuro con sidebar, resumen con 3 stats, configuración editable con 7 parámetros, lista de usuarios. Helper admin-guard con gate por email (colfone@gmail.com). Bypass admin en auth/callback — va directo a /admin sin verificar canal. Migración admin_setup: columna es_admin en usuarios, tabla configuracion con seed de 7 parámetros. Fix cookies en server.ts (try/catch en setAll). Parámetro prompt=select_account en OAuth para forzar selección de cuenta. |
| v4.20 | Sesión 22 abril (modelo v2) | 22 abril 2026 | Modelo créditos v2 completamente implementado en código y DB: (1) techo 10 créditos removido — CHECK relajado a >=0, RPC sin LEAST; (2) trigger trg_creditos_bienvenida — 60 créditos al registrarse, lee de configuracion; (3) trigger trg_costo_crear_campana — descuenta 30 créditos al crear campaña, pausa si saldo llega a 0; (4) RPC aplicar_credito_calificacion — +1 al creador al calificar, reactiva campañas si saldo era 0; (5) columna expires_at en campanas, backfill 30 días, DEFAULT automático, RPC cerrar_campanas_vencidas, pg_cron diario 03:00 UTC. Endpoints lanzar y registrar manejan error créditos insuficientes con 402. Tabla configuracion actualizada: 10 parámetros del modelo v2. Panel admin /admin operativo con gate por email. |
| v4.21 | Sesión 22 abril (configuracion dinámica) | 22 abril 2026 | Helper get-config.ts con cache 60s para leer tabla configuracion. Endpoints registrar y lanzar leen max_videos_activos y vistas_minimas_registro_video dinámicamente. Mensaje 402 interpola costo_campana_creditos. invalidateConfigCache() en PUT admin al guardar. Migración add_max_videos_activos. Feature Likes documentada en ESTADO.md. 8 de 10 parámetros de configuracion conectados al sistema real. |
| v4.22 | Sesión 22 abril (cierre) | 22 abril 2026 | CLAUDE.md definitivo creado — instrucciones permanentes para Claude Code: iniciar sesión leyendo PROYECTO.md y ESTADO.md, arrancar servidor, reglas permanentes, patrones de código, proceso de migraciones, forma de trabajar y cierre de sesión. Feature Likes de YouTube documentada en ESTADO.md. |
| v4.23 | Sesión 22 abril (pausa calificación) | 22 abril 2026 | RPC pausar_por_inactividad_calificacion: pausa campañas de creadores con 3+ comentarios sin calificar por más de 72h. pg_cron horario. RPC aplicar_credito_calificacion extendido con vía 2 de reactivación simétrica al cron — reactiva cuando old_unrated < max_sin_calificar. CLAUDE.md definitivo creado con instrucciones permanentes. |
| v4.24 | Sesión 22 abril (moderación) | 22 abril 2026 | Acciones de moderación en /admin/usuarios: endpoint POST /api/admin/usuarios/moderar (suspender/reactivar/banear/eliminar), badge de estado coloreado con tooltip, modal con motivo y campo hasta para suspensiones. Columnas estado/estado_motivo/estado_hasta en tabla usuarios. Prueba end-to-end modelo v2 exitosa — usuario nuevo recibe 100 créditos (valor actual de creditos_bienvenida en configuracion). Banner Scope actual eliminado de /admin/configuracion. |
| v4.25 | Sesión 22 abril (menú acciones admin) | 22 abril 2026 | Botón "Eliminar cuenta" hard delete en /admin/usuarios — endpoint /api/admin/usuarios/eliminar-cuenta con reverse-order delete (auth.users primero). Menú desplegable "Acciones ▾" con position:fixed reemplaza botones individuales — muestra Suspender/Banear/Eliminar cuenta según estado del usuario. |
| v4.26 | Sesión 22 abril (UX campañas) | 22 abril 2026 | Modal de confirmación antes de crear campaña — muestra costo dinámico de créditos desde configuracion. Endpoint GET /api/config/costo-campana público. router.refresh() al crear campaña para actualizar header de créditos inmediatamente. Fix texto "No tienes campañas activas." en dashboard. Fix vocabulario "antes de comentar" en cola vacía. |

## Stack confirmado

| Componente | Tecnologia | Version |
| --- | --- | --- |
| Frontend | Next.js (App Router, Turbopack) | 16.2.4 |
| React | React + React DOM | 19.2.4 |
| CSS | Tailwind CSS | 4.x |
| Fuentes | Plus Jakarta Sans (headlines) + Inter (body) | Google Fonts |
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

**Flujo de autenticacion implementado (refactorizado en v1.7):**
1. Usuario visita `/login` → ve manifiesto + boton "Continuar con Google"
2. Click → Supabase redirige a Google con scope basico (email + perfil, sin youtube.readonly)
3. Google retorna a `/auth/callback` → crea sesion
4. Si ya tiene canal vinculado → redirige a `/dashboard`
5. Si no tiene canal → redirige a `/verificar-canal`
6. Usuario pega link de su canal → API publica verifica requisitos 4B
7. Si cumple → genera codigo `COMENTALO-XXXX` → redirige a `/verificar-codigo`
8. Usuario pega codigo en descripcion del canal en YouTube Studio
9. Click "Ya lo pegue" → API lee descripcion publica del canal
10. Si encuentra el codigo → registra usuario → redirige a `/dashboard`
11. Si no cumple requisitos → redirige a `/registro-rechazado?reason=...`

### Sesion 4 — Flujo del intercambio (Bloques 1 y 2)

#### Bloque 1 — Registro de video

- Formulario de registro segun seccion 5.3 del PROYECTO.md
- Grid de 2 columnas con ultimos 8 videos del canal del usuario (via YouTube API)
- Cache de videos de YouTube por usuario con TTL de 60 minutos (tabla `cache_videos_youtube`)
- Opcion de link manual siempre visible como fallback debajo del grid
- Videos ya registrados en Comentalo marcados como "Ya registrado" (no seleccionables)
- Formulario paso 2: descripcion (max 300 chars), tipo de intercambio (3 opciones), tono (3 opciones)
- Aviso de moderacion de YouTube Studio (seccion 5.6)
- Regla de vistas (seccion 5C.4): si vistas >= 10 → crea campana; si no → video queda sin campana
- Limite de 2 videos activos simultaneos (seccion 5.5)

**Bug corregido:** Validacion de propiedad del canal — el sistema ahora verifica que `snippet.channelId` del video coincida con `canal_youtube_id` del usuario en dos puntos:
1. En el Paso 1 via `GET /api/videos/verificar-canal` (bloquea antes de mostrar el formulario)
2. En el registro via `POST /api/videos/registrar` (defensa en profundidad)

#### Bloque 2 — Flujo del comentarista

- Pagina `/dashboard/intercambiar` con flujo completo de participacion
- Llama al RPC `asignar_intercambio` para obtener video de la cola
- Muestra video asignado: thumbnail, titulo, descripcion del creador, tipo de intercambio y tono
- Textarea para redactar comentario (minimo 20 caracteres)
- Boton Copiar: copia al portapapeles + guarda en DB (texto, timestamp, duracion)
- Enlace directo al video en YouTube despues de copiar
- Contador regresivo visible (MM:SS) segun tabla de tiempos de seccion 5.4:
  - < 2 min → 60s
  - 2-5 min → 120s
  - 5-10 min → 180s
  - 10+ min → 300s (techo maximo)
- Boton "Ya publique" deshabilitado durante countdown, se habilita al llegar a 00:00
- Casos especiales manejados: 3 pendientes simultaneos, usuario sin video activo, cola vacia

#### Bloque 3 — Verificacion automatica del comentario

- Endpoint `POST /api/intercambios/verificar` con flujo completo:
  - Llama a YouTube commentThreads API con `searchTerms` + videoId (1 unidad de cuota)
  - Busca coincidencia exacta de texto + canal del usuario (`authorChannelId`)
  - Si encuentra: marca intercambio como `verificado`, incrementa `intercambios_completados` en campana
  - Si campana llega a 10: cierra automaticamente con estado `completada` y `closed_at`
  - Si NO encuentra: crea fila en `verificaciones_pendientes` con primer reintento a +30 min
  - La campana queda con slot abierto para que el siguiente comentarista la tome naturalmente (seccion 6C.3 ACCION 1)
- Suspension automatica de video (seccion 6D.1):
  - Cuenta pendientes del mismo video en ultimas 24 horas
  - Si >= 3: cambia estado del video a `suspendido`
- Supabase Realtime habilitado en tabla `intercambios` (seccion 6F.3):
  - Frontend se suscribe a cambios de estado del intercambio especifico
  - Si estado cambia a `verificado` (por el cron de Exponential Backoff) → UI se actualiza sin recargar
  - Si estado cambia a `rechazado` → muestra mensaje de error
- UI actualizada con 3 estados nuevos:
  - `verificando`: spinner mientras se consulta YouTube API
  - `pendiente`: mensaje de revision con icono reloj (seccion 6C.4)
  - `done`: confirmacion verde de intercambio verificado
- RLS habilitado en tabla `intercambios` con 2 politicas:
  - `intercambios_select_comentarista`: el comentarista ve sus propios intercambios
  - `intercambios_select_creador`: el creador del video ve intercambios de sus campanas

**Archivos creados en sesion 4:**
- `src/app/dashboard/registrar-video/page.tsx` — formulario registro de video con grid
- `src/app/dashboard/intercambiar/page.tsx` — flujo completo del comentarista con Realtime
- `src/app/api/videos/registrar/route.ts` — POST: registra video + crea campana
- `src/app/api/videos/verificar-canal/route.ts` — GET: verifica propiedad del video
- `src/app/api/videos/mis-videos-youtube/route.ts` — GET: lista videos recientes con cache
- `src/app/api/intercambios/asignar/route.ts` — GET: llama RPC + retorna datos del video
- `src/app/api/intercambios/copiar/route.ts` — POST: guarda texto, timestamp, duracion
- `src/app/api/intercambios/verificar/route.ts` — POST: verifica comentario en YouTube + pendientes + suspension
- `supabase/migrations/20260416162846_agregar_columnas_sesion4.sql`
- `supabase/migrations/20260416183919_agregar_cache_videos_youtube.sql`
- `supabase/migrations/20260416200413_habilitar_realtime_intercambios.sql`

**Archivos modificados en sesion 4:**
- `src/app/dashboard/page.tsx` — agregado boton "Intercambiar" + lista de videos del usuario

### Sesion 5 — Calificacion y reputacion

#### Bloque 1 — Dashboard del creador

- Dashboard reescrito con vista de campanas por video
- Cada video muestra sus campanas con progreso (X/10 intercambios)
- Campanas completadas muestran boton naranja "Calificar" destacado
- Campanas calificadas muestran badge verde "Calificada"
- Campanas abiertas muestran "En curso"
- Videos sin campana muestran mensaje de vistas insuficientes
- Badge de reputacion visible: circulo de color + porcentaje + nivel
- Contador de calificaciones hacia activacion (X/20) cuando el sistema no esta activo

#### Bloque 2 — Sistema de calificacion

- Pagina `/dashboard/calificar/[campanaId]` para calificar intercambios de una campana
- Cada intercambio muestra el texto del comentario recibido
- Botones 👍 / 👎 por intercambio — sin texto, sin explicaciones (seccion 6.2)
- Calificacion se aplica con un solo clic y se refleja inmediatamente
- Contador X/N calificados visible en la pagina
- Al calificar todos los intercambios verificados de una campana completada → campana pasa a estado `calificada`
- API route `GET /api/intercambios/calificar` para obtener intercambios de una campana
- API route `POST /api/intercambios/calificar` para aplicar calificacion
- Validacion: solo el creador del video puede calificar, solo intercambios verificados sin calificar
- Auto-calificacion: RPC `auto_calificar_intercambios_vencidos` ejecutado cada hora via pg_cron
  - Intercambios verificados sin calificacion despues de 72 horas → se autocalifican como `positiva`
- Despues de cada calificacion se recalcula la reputacion del comentarista

#### Bloque 3 — Sistema de reputacion

- RPC `calcular_reputacion(p_comentarista_id)` calcula % de positivas sobre total calificados
- Niveles segun seccion 6.3:
  - Verde: >= 80% positivas — acceso completo
  - Amarillo: 60-80% — acceso limitado, advertencia
  - Naranja: 40-60% — suspension temporal 7 dias
  - Rojo: < 40% — baneo permanente
- Sistema solo se activa con >= 20 intercambios calificados (antes solo advertencias)
- Dashboard muestra badge de reputacion con color, porcentaje y estado
- API route `GET /api/usuarios/reputacion` para consultar reputacion del usuario autenticado

**Archivos creados en sesion 5:**
- `src/app/dashboard/calificar/[campanaId]/page.tsx` — pagina de calificacion por campana
- `src/app/api/intercambios/calificar/route.ts` — GET: lista intercambios, POST: califica
- `src/app/api/usuarios/reputacion/route.ts` — GET: consulta reputacion
- `supabase/migrations/20260416201256_sesion5_calificacion_reputacion.sql`

**Archivos modificados en sesion 5:**
- `src/app/dashboard/page.tsx` — reescrito con campanas por video, badge reputacion, boton calificar

### Sesion 6 — Realtime en dashboard, suspension con reactivacion

#### Bloque 1 — Dashboard Realtime

- Dashboard dividido en server component (carga datos) + client component (Realtime)
- `src/app/dashboard/page.tsx` → server: carga usuario, videos, campanas, reputacion
- `src/app/dashboard/dashboard-client.tsx` → client: renderiza UI + suscripcion Realtime
- Suscripcion a cambios en tabla `campanas` → dashboard se refresca cuando llegan intercambios
- Suscripcion a cambios en tabla `videos` → dashboard se refresca cuando un video cambia de estado
- Realtime habilitado en tablas `campanas` y `videos` via `supabase_realtime` publication

#### Bloque 2 — Suspension automatica con reactivacion

- Banner rojo en dashboard cuando un video esta suspendido (seccion 6D.4)
- Mensaje exacto del PROYECTO.md: "Detectamos que 3 intercambios de tu video no se estan verificando..."
- Boton "Reactivar video" en el banner (primera suspension)
- `POST /api/videos/reactivar`: verifica propiedad, estado suspendido, permite reactivar
- Reincidencia (seccion 6D.6): si `suspensiones_count >= 2` → mensaje "Requiere revision manual del equipo. Contacta a soporte." sin boton de reactivar
- Campo `suspensiones_count` agregado a tabla `videos` (INTEGER, DEFAULT 0)
- `POST /api/intercambios/verificar` actualizado: incrementa `suspensiones_count` al suspender
- RLS habilitado en tablas `videos` (select_own, insert_own) y `campanas` (select_creador)

#### Bloque 3 — Pruebas end-to-end

- Build exitoso con 0 errores de TypeScript
- 19 rutas registradas (8 paginas + 11 API routes)
- Flujo completo verificado: registro → intercambiar → copiar → verificar → calificar → reputacion

**Archivos creados en sesion 6:**
- `src/app/dashboard/dashboard-client.tsx` — client component con Realtime + suspension UI
- `src/app/api/videos/reactivar/route.ts` — POST: reactiva video suspendido
- `supabase/migrations/20260416202115_sesion6_suspension_realtime.sql`

**Archivos modificados en sesion 6:**
- `src/app/dashboard/page.tsx` — convertido a server loader que pasa datos a client component
- `src/app/api/intercambios/verificar/route.ts` — incrementa suspensiones_count al suspender

### Sesion 7 — Deploy a produccion y pulido pre-lanzamiento

#### Bloque 1 — Deploy a Vercel

- Proyecto desplegado en `https://comentalo.vercel.app`
- 6 variables de entorno configuradas en Production + Preview + Development:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
  - `YOUTUBE_API_KEY`, `GOOGLE_CLIENT_ID`, `CRON_SECRET`
- Vercel Cron Job activo: `/api/cron/verificaciones` a las 00:00 UTC diario (respaldo de pg_cron)
- Auto-deploy desde GitHub master branch habilitado

#### Bloque 2 — Pulido visual y UX

- Login: manifiesto de Comentalo agregado (seccion 1 del PROYECTO.md)
- Layout: metadata actualizada — titulo "Comentalo — Comunidad de creadores de YouTube", descripcion con manifiesto, lang="es"
- Pagina 404 personalizada con colores de marca y enlace al dashboard
- Auditoria de vocabulario oficial (seccion 3): sin violaciones encontradas en textos visibles al usuario
  - No se usa "comentarista", "tarea", "comprar", "cola de espera" en ningun string de UI

#### Bloque 3 — Checklist de lanzamiento

- Build exitoso con 0 errores TypeScript
- 20 rutas registradas (9 paginas + 11 API routes)
- Deploy a Vercel verificado en produccion
- pg_cron jobs activos en Supabase: `procesar-verificaciones-pendientes` (cada 5 min), `auto-calificar-intercambios-vencidos` (cada hora)
- Supabase Realtime habilitado en tablas: intercambios, campanas, videos

**Archivos creados en sesion 7:**
- `src/app/not-found.tsx` — pagina 404 personalizada

**Archivos modificados en sesion 7:**
- `src/app/login/page.tsx` — manifiesto agregado, subtitulo actualizado
- `src/app/layout.tsx` — metadata y lang="es"

### Refactor: Verificacion de canal por codigo en descripcion

**Problema:** El flujo anterior pedia el scope `youtube.readonly` en el login de Google, lo que generaba desconfianza en los usuarios al ver que la app pedia acceso a su canal de YouTube. Ademas, el soporte multi-canal complicaba el callback.

**Solucion implementada — flujo nuevo:**
1. Login con Google pide solo perfil basico (email + nombre + foto) — sin scope `youtube.readonly`
2. Callback simplificado: solo crea sesion y redirige a `/verificar-canal` si no tiene canal vinculado
3. `/verificar-canal`: el usuario pega el link de su canal, la API publica verifica requisitos 4B
4. Si cumple requisitos → se genera codigo `COMENTALO-XXXX` y se redirige a `/verificar-codigo`
5. `/verificar-codigo`: el usuario pega el codigo en la descripcion de su canal en YouTube Studio
6. Al presionar "Ya lo pegue" → la API lee la descripcion publica del canal y busca el codigo
7. Si lo encuentra → registro completo, el usuario puede borrar el codigo despues
8. Si no lo encuentra → mensaje claro para reintentar

**Archivos eliminados:**
- `src/app/seleccionar-canal/page.tsx` — ya no necesaria
- `src/app/api/auth/registrar-canal/route.ts` — ya no necesaria

**Archivos creados:**
- `src/app/verificar-canal/page.tsx` — pagina para ingresar link del canal
- `src/app/verificar-codigo/page.tsx` — pagina para verificar codigo en descripcion
- `src/app/api/canal/verificar-requisitos/route.ts` — POST: resuelve canal, verifica 4B, genera codigo
- `src/app/api/canal/verificar-codigo/route.ts` — POST: lee descripcion publica, busca codigo, registra usuario
- `supabase/migrations/20260416212103_verificacion_codigo_canal.sql` — tabla `verificaciones_canal`

**Archivos modificados:**
- `src/app/login/page.tsx` — eliminado scope youtube.readonly, simplificado texto
- `src/app/auth/callback/route.ts` — simplificado: solo sesion + redirige a /verificar-canal o /dashboard
- `src/app/dashboard/page.tsx` — redirige a /verificar-canal si usuario autenticado sin canal

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
| auth_id | UUID | UNIQUE (sesion 3) |
| email | TEXT | nullable (sesion 3) |
| nombre | TEXT | nullable (sesion 3) |
| avatar_url | TEXT | nullable (sesion 3) |
| videos_al_registro | INTEGER | NOT NULL, DEFAULT 0 (sesion 3) |
| canal_verificado | BOOLEAN | NOT NULL, DEFAULT false (v4.9) |

RLS habilitado. Politicas: `usuarios_select_own`, `usuarios_insert_own`.

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
| descripcion | TEXT | nullable (sesion 4) |
| tipo_intercambio | TEXT | nullable, CHECK IN ('opinion', 'pregunta', 'experiencia') (sesion 4) |
| tono | TEXT | nullable, CHECK IN ('casual', 'entusiasta', 'reflexivo') (sesion 4) |
| duracion_segundos | INTEGER | nullable (sesion 4) |
| suspensiones_count | INTEGER | NOT NULL, DEFAULT 0 (sesion 6) |

RLS habilitado (sesion 6). Politicas: `videos_select_own`, `videos_insert_own`. Realtime habilitado via `supabase_realtime` publication.

### Tabla: campanas

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| video_id | UUID | NOT NULL, FK → videos(id) ON DELETE CASCADE |
| estado | TEXT | NOT NULL, DEFAULT 'abierta', CHECK IN ('abierta', 'completada', 'calificada') |
| intercambios_completados | INTEGER | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| closed_at | TIMESTAMPTZ | nullable |

RLS habilitado (sesion 6). Politicas: `campanas_select_creador`, `campanas_insert_creador`, `campanas_update_creador`. Realtime habilitado via `supabase_realtime` publication.

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
| duracion_video_segundos | INTEGER | nullable (sesion 4) |

RLS habilitado (sesion 4). Politicas: `intercambios_select_comentarista` (comentarista ve sus propios), `intercambios_select_creador` (creador del video ve intercambios de sus campanas). Realtime habilitado via `supabase_realtime` publication.

### Tabla: verificaciones_pendientes

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| intercambio_id | UUID | NOT NULL, FK → intercambios(id) ON DELETE CASCADE |
| proximo_intento_at | TIMESTAMPTZ | NOT NULL |
| intentos | INTEGER | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### Tabla: cache_videos_youtube (sesion 4)

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| usuario_id | UUID | NOT NULL, FK → usuarios(id) ON DELETE CASCADE, UNIQUE |
| videos | JSONB | NOT NULL, DEFAULT '[]' |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| expires_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() + 60 min |

RLS habilitado. Politicas: `cache_videos_select_own`, `cache_videos_insert_own`, `cache_videos_update_own`, `cache_videos_delete_own`.

### Tabla: verificaciones_canal (refactor auth)

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| auth_id | UUID | NOT NULL |
| codigo | TEXT | NOT NULL, UNIQUE |
| canal_youtube_id | TEXT | NOT NULL |
| canal_data | JSONB | NOT NULL |
| verificado | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| expires_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() + 24 hours |

RLS habilitado. Politicas: `verificaciones_canal_select_own`, `verificaciones_canal_insert_own`.

### Tabla: notificaciones

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| usuario_id | UUID | NOT NULL, FK → usuarios(id) ON DELETE CASCADE |
| tipo | TEXT | NOT NULL, CHECK IN ('intercambio_verificado', 'intercambio_pendiente', 'intercambio_recibido', 'campana_completa', 'video_suspendido') |
| titulo | TEXT | NOT NULL |
| mensaje | TEXT | NOT NULL |
| leida | BOOLEAN | NOT NULL, DEFAULT false |
| url_destino | TEXT | nullable |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

RLS habilitado. Politicas: `notificaciones_select_own`, `notificaciones_update_own`. Realtime habilitado via `supabase_realtime` publication.

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
- `idx_cache_videos_usuario_id` ON cache_videos_youtube(usuario_id)
- `idx_cache_videos_expires_at` ON cache_videos_youtube(expires_at)
- `idx_verificaciones_canal_auth_id` ON verificaciones_canal(auth_id)
- `idx_verificaciones_canal_codigo` ON verificaciones_canal(codigo)
- `idx_notificaciones_usuario_id` ON notificaciones(usuario_id)
- `idx_notificaciones_leida` ON notificaciones(usuario_id, leida)

## Rutas existentes en el proyecto

### Paginas (App Router)

| Ruta | Archivo | Tipo | Descripcion |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Dynamic (server) | Redirige a /login o /dashboard segun sesion |
| `/login` | `src/app/login/page.tsx` | Static (client) | Landing page con hero, como funciona, footer + login con Google |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Dynamic (route handler) | Callback OAuth + verificacion YouTube |
| `/dashboard/*` | `src/app/dashboard/layout.tsx` | Dynamic (server) | Gate server-side de verificacion — rendera modal 4 pasos sobre children cuando canal_verificado = false (v4.9) |
| `/dashboard` | `src/app/dashboard/page.tsx` + `dashboard-client.tsx` | Dynamic (server→client) | Home: nav floating glass con tab Inicio activo, sidebar 4 stats + reputacion, grid "Mis campañas" con tabs En curso/Completados, El Manifiesto, footer |
| `/dashboard/actividad` | `src/app/dashboard/actividad/page.tsx` | Static (client) | Mi actividad: tabs top-level Comentando (pendientes + completados) y Recibiendo (mi campana activa + lista de todas mis campanas con Pausar/Eliminar + CTA Crear campana) |
| `/dashboard/perfil` | `src/app/dashboard/perfil/page.tsx` | Static (client) | Perfil: hero con avatar + reputacion + suscriptores, 4 stats, seccion Mis campanas con Pausar/Eliminar, boton cerrar sesion al final |
| `/dashboard/registrar-video` | `src/app/dashboard/registrar-video/page.tsx` | Static (client) | Crear campana: flujo 2 pasos con banner amarillo, grid de videos, card paste-link, campo libre "Notas para los comentaristas" + advertencia YouTube Studio, exito con CTA "Ir a comentar" |
| `/dashboard/intercambiar` | `src/app/dashboard/intercambiar/page.tsx` | Static (client) | Comentar: cola de 2 videos simultaneos, 4 stats reales (Comentarios totales / Comentarios este mes / Reputacion / Campanas activas), subtexto "Tu comentas. La comunidad te comenta. Asi crecemos todos." |
| `/dashboard/intercambiar/[campanaId]` | `src/app/dashboard/intercambiar/[campanaId]/page.tsx` | Dynamic (client) | Detalle del intercambio — layout 2 columnas (video + compose | sidebar creador + tarea) |
| `/dashboard/calificar/[campanaId]` | `src/app/dashboard/calificar/[campanaId]/page.tsx` | Dynamic (client) | Calificacion de intercambios por campana |
| `/dashboard/campana/[campanaId]` | `src/app/dashboard/campana/[campanaId]/page.tsx` | Dynamic (client) | Detalle de campana con intercambios y calificacion inline |
| `/verificar-canal` | `src/app/verificar-canal/page.tsx` | Static (client) | Ingreso de link del canal + verificacion de requisitos |
| `/verificar-codigo` | `src/app/verificar-codigo/page.tsx` | Static (client) | Verificacion de codigo en descripcion del canal |
| `/registro-rechazado` | `src/app/registro-rechazado/page.tsx` | Static (client) | Motivos de rechazo del canal |
| `404` | `src/app/not-found.tsx` | Static | Pagina 404 personalizada (sesion 7) |

### API Routes

| Ruta | Metodo | Descripcion |
| --- | --- | --- |
| `/api/canal/verificar-requisitos` | POST | Resuelve link de canal, verifica requisitos 4B, genera codigo COMENTALO-XXXX |
| `/api/canal/verificar-codigo` | POST | Reescrito v4.9: dos acciones. `{action:"iniciar"}` genera/reutiliza codigo COMENTALO-XXXX en verificaciones_canal; `{action:"verificar", codigo}` lee descripcion publica del canal via YouTube API y al encontrarlo marca usuarios.canal_verificado = true |
| `/api/cron/verificaciones` | GET | Ejecuta RPC procesar_verificaciones_pendientes (protegido con CRON_SECRET) |
| `/api/videos/registrar` | POST | Registra video: valida propiedad, inserta en DB, crea campana si vistas >= 10 |
| `/api/videos/verificar-canal` | GET | Verifica que un videoId pertenece al canal del usuario autenticado |
| `/api/videos/reactivar` | POST | Reactiva video suspendido (bloquea si suspensiones_count >= 2) |
| `/api/videos/eliminar` | DELETE | Elimina video sin intercambios verificados (cascade a campanas e intercambios) |
| `/api/campanas/lanzar` | POST | Lanza nueva campana para un video — valida regla de vistas 5C.4 |
| `/api/campanas/detalle` | GET | Detalle de campana con intercambios y nombres de comentaristas |
| `/api/campanas/pausar` | POST | v4.10: cambia estado abierta/activa → pausada. Valida ownership |
| `/api/campanas/activar` | POST | v4.10: cambia estado pausada → activa |
| `/api/campanas/finalizar` | POST | v4.10: cambia estado abierta/activa/pausada → finalizada + closed_at. Terminal no reversible |
| `/api/campanas/eliminar` | POST | v4.10: DELETE si intercambios_completados = 0. Cascade borra intercambios pendientes |
| `/api/notificaciones` | GET/POST | GET: lista notificaciones del usuario. POST: marca como leida |
| `/api/videos/mis-videos-youtube` | GET | Lista ultimos 8 videos del canal con cache de 60 min |
| `/api/intercambios/asignar` | GET | Llama RPC asignar_intercambio + retorna datos completos del video |
| `/api/intercambios/copiar` | POST | Guarda texto_comentario, timestamp_copia, duracion_video_segundos |
| `/api/intercambios/verificar` | POST | Verifica comentario en YouTube, marca verificado/pendiente, suspension de video |
| `/api/intercambios/cancelar` | POST | Cancela intercambio pendiente — elimina la fila y libera slot en la campana |
| `/api/intercambios/calificar` | GET/POST | GET: lista intercambios de una campana. POST: aplica calificacion 👍/👎 |
| `/api/usuarios/reputacion` | GET | Calcula y retorna reputacion del usuario autenticado |

## RPCs en Supabase

| Nombre | Parametros | Retorno | Descripcion |
| --- | --- | --- | --- |
| `asignar_intercambio` | `p_comentarista_id UUID` | JSON `{ ok, intercambio_id, campana_id, video_id }` o `{ ok, error, mensaje }` | Asigna video de la cola al comentarista. Usa SELECT FOR UPDATE SKIP LOCKED. Valida: usuario tiene video activo, no tiene 3+ pendientes, cola no vacia |
| `procesar_verificaciones_pendientes` | ninguno | JSON `{ ok, procesados, reprogramados, marcados_revision }` | Procesa reintentos con Exponential Backoff (30min, 2h, 8h, 24h). Marca como rechazado tras 4 intentos fallidos |
| `auto_calificar_intercambios_vencidos` | ninguno | JSON `{ ok, autocalificados }` | Intercambios verificados sin calificacion despues de 72h → autocalifica como positiva (sesion 5) |
| `calcular_reputacion` | `p_comentarista_id UUID` | JSON `{ ok, total_calificados, porcentaje, nivel, activo }` | Calcula % positivas, determina nivel, actualiza usuarios.reputacion. Activo solo con >= 20 calificados (sesion 5) |
| `confirmar_intercambio` | `p_comentarista_id UUID, p_campana_id UUID` | JSON `{ ok, intercambio_id, campana_id, video_id }` o `{ ok, error, mensaje }` | Valida reserva vigente, INSERT en intercambios, libera las 2 reservas del usuario. SECURITY DEFINER (v4.5) |
| `get_intercambio_detalle` | `p_campana_id UUID` | JSON `{ ok, intercambio, video, creador }` o `{ ok, error, mensaje }` | LANGUAGE sql SECURITY DEFINER. Deriva comentarista_id de auth.uid() y retorna detalle plano del intercambio + video + creador, bypasseando RLS que bloqueaba al comentarista (v4.10) |
| `get_mis_intercambios_comentarista` | ninguno | JSON array `[{ id, campana_id, texto_comentario, estado, created_at, video, creador }, ...]` | LANGUAGE sql SECURITY DEFINER. Lista intercambios pendiente/verificado del comentarista autenticado (via auth.uid()) con video + creador embedded, ordenados por created_at desc, LIMIT 100. Bypasea RLS por el mismo patrón que get_intercambio_detalle (v4.11) |
| `asignar_intercambio` (v4.11) | `p_comentarista_id UUID` | JSON `{ ok, videos }` o `{ ok, error, mensaje }` | Reescrito a LANGUAGE sql. Fix: c.estado IN ('abierta', 'activa'). Guardrails inline en WHERE del INSERT (video activo, <3 pendientes, sin reservas previas), CASE final decide mensaje de retorno. FOR UPDATE OF c SKIP LOCKED preservado en CTE |

## pg_cron Jobs en Supabase

| Nombre | Schedule | Comando |
| --- | --- | --- |
| `procesar-verificaciones-pendientes` | `*/5 * * * *` (cada 5 minutos) | `SELECT procesar_verificaciones_pendientes()` |
| `auto-calificar-intercambios-vencidos` | `0 * * * *` (cada hora) | `SELECT auto_calificar_intercambios_vencidos()` |

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
| `20260416162846_agregar_columnas_sesion4.sql` | Columnas descripcion, tipo_intercambio, tono, duracion en videos + duracion en intercambios | Aplicada |
| `20260416183919_agregar_cache_videos_youtube.sql` | Tabla cache_videos_youtube con TTL 60 min + RLS | Aplicada |
| `20260416200413_habilitar_realtime_intercambios.sql` | Realtime en intercambios + RLS con 2 politicas | Aplicada |
| `20260416201256_sesion5_calificacion_reputacion.sql` | RPCs auto_calificar + calcular_reputacion + pg_cron cada hora | Aplicada |
| `20260416202115_sesion6_suspension_realtime.sql` | suspensiones_count en videos + Realtime en campanas/videos + RLS | Aplicada |
| `20260416212103_verificacion_codigo_canal.sql` | Tabla verificaciones_canal para flujo de codigo en descripcion | Aplicada |
| `20260416220953_fix_campanas_insert_policy.sql` | INSERT y UPDATE policies en campanas | Aplicada |
| `20260416234737_notificaciones.sql` | Tabla notificaciones + RLS + Realtime | Aplicada |
| `20260417160000_calificacion_estrellas.sql` | Columna estrellas en intercambios + RPC calcular_reputacion actualizado | Aplicada |
| `20260418120000_reserva_multiples_videos.sql` | Tabla reservas_intercambio + RPCs asignar_intercambio / confirmar_intercambio reescritos (2 videos simultaneos) | Aplicada |
| `20260419180000_add_canal_verificado.sql` | Columna canal_verificado BOOLEAN DEFAULT false en usuarios (gate del modal de verificacion) | Aplicada |
| `20260419200000_expand_campanas_estado.sql` | CHECK de campanas.estado expandido para aceptar activa/pausada/finalizada ademas del vocabulario viejo | Aplicada |
| `20260419210000_rpc_get_intercambio_detalle.sql` | RPC LANGUAGE sql SECURITY DEFINER que retorna intercambio+video+creador bypasseando RLS para el comentarista autenticado | Aplicada |
| `20260420000000_rpc_get_mis_intercambios_comentarista.sql` | RPC LANGUAGE sql SECURITY DEFINER que lista intercambios del comentarista con video+creador embedded, bypasseando RLS | Aplicada |
| `20260420010000_asignar_intercambio_language_sql.sql` | Reescritura LANGUAGE sql del RPC asignar_intercambio + fix estado IN ('abierta','activa') para incluir campañas activadas tras pausar | Aplicada |

## Deploy en produccion

| Componente | URL | Estado |
| --- | --- | --- |
| Frontend + API | https://comentalo.vercel.app | Activo |
| Base de datos | gpisnpodapdxmdjztvou.supabase.co | Activo |
| OAuth redirect | https://gpisnpodapdxmdjztvou.supabase.co/auth/v1/callback | Configurado en Google Cloud |

## Sistema de diseno

| Token | Valor | Uso |
| --- | --- | --- |
| primary | #6200EE | Color principal |
| primary-light | #ac8eff | Gradiente editorial, acentos |
| surface | #f5f6f7 | Fondos alternados |
| ghost-border | rgba(171,173,174,0.15) | Bordes sutiles |
| editorial-gradient | linear-gradient(135deg, #6200EE, #ac8eff) | Botones CTA landing |
| font-headline | Plus Jakarta Sans | Titulos |
| font-body | Inter | Texto y UI |

## Sesion siguiente

### Pendientes inmediatos

- Reembolso de créditos al eliminar campaña — si intercambios_completados = 0 al momento de eliminar, devolver costo_campana_creditos al creador. Si ya recibió al menos 1 comentario, sin reembolso.
- Auto-expiración de suspensiones temporales — pg_cron que pasa usuarios de `suspendido` a `activo` cuando `estado_hasta < now()`
- Enforcement de estados de usuario — bloquear login/acciones para suspendido/baneado/eliminado, filtrar de colas e intercambios
- Email via Resend cuando créditos llegan a 0
- Ecosistema administrativo:
  - Panel admin completado: resumen, configuración, usuarios
  - Pendiente: módulo de campañas en /admin/campanas — lista de todas las campañas con estado, video, creador
  - Pendiente: módulo de moderación — videos suspendidos, baneos
  - Pantalla de créditos del usuario: saldo actual + extracto de movimientos con fecha, descripción y monto (+/-) — similar a un estado de cuenta bancario

### Cambio estructural pendiente — Campañas por tiempo

- Sin límite de intercambios por campaña
- Duración fija de 10 días por campaña
- 1 campaña activa simultánea en plan gratuito
- Comentarista puede volver al mismo video después de 30 días
- En Fase 2 se cobra por campañas adicionales simultáneas
- Requiere migración de DB y reescritura de RPCs — sesión dedicada

---

## Feature pendiente — Intercambio de Likes de YouTube

Analizado y diseñado en sesión paralela. Listo para implementar en una sesión futura dedicada. No tocar hasta entonces.

### Qué es
Un segundo tipo de campaña dentro de Comentalo donde los creadores intercambian likes reales entre sí, con el mismo modelo de créditos y cola que ya existe para comentarios.

### Por qué es viable
La API pública de YouTube (statistics.likeCount) siempre devuelve el entero exacto sin redondeo. Esto permite verificación automática real por delta de likes, sin OAuth, sin permisos especiales del usuario.

### Cómo funciona la verificación
1. Al asignar el video, el RPC consulta YouTube API y guarda likes_snapshot en reservas_intercambio
2. El colaborador va a YouTube y da like desde su canal registrado
3. Presiona "Ya di like" en Comentalo
4. La plataforma consulta YouTube API de nuevo y compara con el snapshot
5. Si likes_actual > likes_snapshot → verificado ✅
6. Si no cambió → reintento automático a los 30 segundos
7. Si sigue igual → rechazo con mensaje específico

### Reglas
- Solo un colaborador puede tener el video asignado para likes a la vez — resuelto con SELECT FOR UPDATE SKIP LOCKED existente
- El like es binario — no existe caso edge de doble like
- Intercambio de like verificado es permanente aunque el colaborador quite el like después — misma política que comentarios (sección 4C.3 PROYECTO.md)
- Al registrar campaña de likes, verificar que el video tiene likeCount visible en la API

### Único caso edge real
Like previo — el colaborador ya había dado like antes de que se le asignara. Solución: mensaje específico "¿Ya habías dado like a este video antes? Cancela y te asignamos otro."

### Qué hay que construir
- Campo tipo en tabla campanas — valores 'comentario' o 'like'
- Campo likes_snapshot INTEGER en tabla reservas_intercambio
- RPC de asignación actualizado para hacer snapshot al asignar
- Endpoint /api/intercambios/verificar-like
- Vista del colaborador simplificada — sin redacción de texto, sin timer 30s de watch time
- Al registrar campaña — validar que likeCount está visible en la API

### Pendiente de definir antes de implementar
- ¿Los créditos de likes y comentarios son el mismo saldo o saldos separados?
- ¿El colaborador debe ver el video X segundos antes de poder dar like?

### Lo que NO cambia
El sistema de créditos, la cola, la reputación, las notificaciones y los RPCs de asignación base funcionan igual. La arquitectura existente ya soporta este feature con cambios mínimos.

---

REGLA: Al finalizar cada sesion, actualizar este archivo incrementando la version y documentando todo lo que cambio.
