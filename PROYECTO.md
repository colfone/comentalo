**comentalo.com**

Documento Maestro del Proyecto

Versión 4.6 — Abril 2026

*Comunidad de intercambio de comentarios reales entre creadores de YouTube en Latinoamérica*

# **Registro de Cambios**

| **Version** | **Fecha** | **Descripcion del cambio** |
| --- | --- | --- |
| 1.0 | Abril 2026 | Documento inicial — Vision general, mercado, modelo de usuario, mecanica core, monetizacion y estrategia de lanzamiento |
| 1.1 | Abril 2026 | Agregada seccion 6B — Verificacion tecnica del intercambio via API publica de YouTube |
| 1.2 | Abril 2026 | Portada actualizada con control de versiones y registro de cambios |
| 1.3 | Abril 2026 | Agregadas secciones 8.3 Programa de Fundadores y 8.4 Programa de Referidos |
| 1.4 | Abril 2026 | Agregada seccion 9 Canal de YouTube Vinculado — regla, implicaciones y proceso de cambio |
| 1.5 | Abril 2026 | Correccion de inconsistencias — verificacion, vocabulario y numeros de fundadores |
| 1.6 | Abril 2026 | Correccion de 8 inconsistencias detectadas en revision completa del documento |
| 1.7 | Abril 2026 | Correccion de 4 inconsistencias — pie de pagina, prioridad en cola, lenguaje rechazar vs calificar, tabla de expansiones |
| 1.8 | Abril 2026 | Correccion de 3 inconsistencias — titulo seccion 5.5, tiempos de calificacion unificados a 72h, precio por intercambio aclarado |
| 1.9 | Abril 2026 | Eliminados todos los precios del documento — pendientes de definicion tras validacion con usuarios reales |
| 2.0 | Abril 2026 | Agregada seccion 6C — Sistema de intercambios pendientes por retencion de YouTube. Analisis de limitaciones de API |
| 2.1 | Abril 2026 | Actualizada seccion 5.4 — Flujo de redaccion previa en Comentalo con boton Copiar antes de publicar en YouTube |
| 2.2 | Abril 2026 | Agregada seccion 5.6 — Requisitos de moderacion del video al registrarlo. Actualizada seccion 6C con informacion sobre configuracion de moderacion de YouTube |
| 2.3 | Abril 2026 | Agregada seccion 6D — Sistema de suspension automatica de video por patron de intercambios pendientes |
| 2.4 | Abril 2026 | Definidos requisitos minimos del canal para registro — seccion 10.1 resuelta y movida a seccion 4B |
| 2.5 | Abril 2026 | Definida mecanica de la cola de intercambios — seccion 10.2 resuelta y movida a seccion 5B |
| 2.6 | Abril 2026 | Definidas reglas anti-fraude completas — seccion 10.3 resuelta y movida a seccion 4C |
| 2.7 | Abril 2026 | Introducido concepto de Campana como unidad de trabajo — 10 intercambios por campana, regla de vistas, vocabulario actualizado |
| 2.8 | Abril 2026 | Agregada mecanica de tiempo minimo entre Copiar y Ya publique para proteger el Watch Time del creador |
| 2.9 | Abril 2026 | Actualizada tabla de tiempos con techo maximo de 5 minutos. Agregado nudge de likes. Definido limite estrategico de verificacion |
| 3.0 | Abril 2026 | Documentados 2 riesgos residuales — Muro de Cuota API con Exponential Backoff y Deuda Inicial como valvula de emergencia. Stack tecnologico definido |
| 3.1 | Abril 2026 | Agregada seccion 6F — Arquitectura tecnica del MVP: tareas en segundo plano, race conditions y Supabase Realtime |
| 3.2 | Abril 2026 | Confirmada estrategia freemium — limites originales mantenidos, gamificacion para desbloquear capacidad. Limite de 3 pendientes simultaneos por usuario |
| 3.3 | Abril 2026 | Auditoria completa — corregido beneficio fundadores, cola FIFO en V1, precios Backlog V2, boton Ya publique sincronizado en 6B.3, suscriptores_al_registro |
| 3.4 | Abril 2026 | Corregido error logico campana vs expansion en 8.3. Fantasmas de monetizacion aislados como Backlog Fase 2. Sistema de pagos eliminado del MVP |
| 3.5 | Abril 2026 | Ajustes semanticos finales — seccion 5.2 sin lenguaje de pago, seccion 7 etiquetada [BACKLOG FASE 2] con guardrail explicito para Claude Code |
| 3.6 | Abril 2026 | Auditoria interna — 6 hallazgos corregidos: infoBox fundadores, tiempos 24h vs 48h, tabla referidos, lenguaje pago en 5.1, tabla competencia 2.3 |
| 3.7 | Abril 2026 | Auditoria exhaustiva — 6 hallazgos residuales corregidos: premium→Expansion Basica, tabla referidos 3 columnas, 6C.5 48h→24h, 2.3 pagos→modelo colaborativo, infoBox 6C 2h→24h |
| 3.8 | Abril 2026 | Auditoria final — corregido vocabulario en 5C.6: intercambios por video→intercambios por campana. Documento certificado al 100% |
| 3.9 | Abril 2026 | Nuevo flujo de verificacion de canal por codigo en descripcion (seccion 9.5). Regla de eliminacion de videos (seccion 4C.5). Login sin scope youtube.readonly |
| 4.0 | Abril 2026 | Agregada seccion 6G — Sistema de notificaciones con 5 tipos, panel de campana en dashboard, Realtime |
| 4.1 | Abril 2026 | Landing page profesional con sistema de diseno oficial. Color primary #6200EE. Seccion 6H — Sistema de diseno |
| 4.2 | Abril 2026 | Cambio estructural — campañas por tiempo (10 días fijos, sin límite de intercambios, cierre automático al vencer). Actualizada sección 5C completa y sección 6.2 |
| 4.3 | Abril 2026 | Agregada sección 5E — Sistema de saldo de comentarios. Máximo 10, campaña se pausa al llegar a 0 |
| 4.4 | Abril 2026 | Eliminado límite de tiempo de campañas — la campaña vive por saldo, no por tiempo |
| 4.5 | Abril 2026 | Agregada sección 5F — Sistema de créditos. Máximo 10, campaña se pausa al llegar a 0, borradores 2 horas, notificación por email via Resend |
| 4.6 | Abril 2026 | Actualizado flujo 5.4 a asistente de 4 pasos con video embedido 30s. Sección 6B.3 actualizada — intercambio se crea solo al verificar, sin estado pendiente. Sección 6C reemplazada por política de verificación fallida. Sección 6D eliminada. |
| 4.7 | Abril 2026 | Modelo de créditos v2: sin techo, 60 créditos de bienvenida al registrarse, −30 al abrir campaña, +1 por comentario verificado dado o por calificación con estrellas recibida. Campañas 30 días fijos (unificado 5C). Eliminada sección 5E (fusionada en 5F). Descartados borradores de comentario y crédito de compensación por simultaneidad. Reactivación automática de todas las campañas del creador cuando saldo sube de 0 |

# **1. Visión General del Proyecto**

| **El Manifiesto de Comentalo** Creemos que los creadores merecen crecer con apoyo real. No vendemos comentarios. No tenemos bots. No hay atajos. Solo creadores que se apoyan entre sí. Tú comentas. Ellos comentan. Así crecemos todos. |
| --- |

## **1.1 ¿Qué es Comentalo?**

Comentalo.com es una comunidad colaborativa de creadores de YouTube en Latinoamérica, donde los creadores intercambian comentarios reales entre sí para crecer juntos. No es una plataforma SMM tradicional. No vende comentarios. No usa bots. Es un ecosistema cerrado donde la participación activa es la única forma de recibir valor.

## **1.2 Origen del Proyecto**

La idea nació como un módulo dentro de DeLikes.com (plataforma SMM orientada a revendedores en LatAm), pero se decidió construirla como negocio independiente por tener una lógica de negocio distinta, un mercado más amplio y potencial de escala propio.

## **1.3 Conexión con DeLikes**

- DeLikes.com es una plataforma SMM orientada a revendedores en LatAm

- La primera base de usuarios vendrá de la comunidad de DeLikes

- Mismos colores de marca: morado (#6B3FA0) y naranja (#E87722)

- La conexión futura entre ambas plataformas está por definir

## **1.4 Dominio**

comentalo.com — registrado en Abril 2026

# **2. Mercado y Posicionamiento**

## **2.1 Mercado Objetivo**

Latinoamérica — Colombia, México, Venezuela y resto de la región.

Perfil del usuario ideal:

- Creador de YouTube en LatAm con canal pequeño o mediano (500 — 100,000 suscriptores)

- Publica contenido con regularidad (mínimo 2 videos al mes)

- Frustrado porque sus videos tienen pocos comentarios a pesar de tener views

- Entiende que los comentarios impactan el algoritmo de YouTube

- Dispuesto a dar para recibir — mentalidad colaborativa

## **2.2 Plataformas Sociales Objetivo**

YouTube como punto de partida exclusivo en V1. Instagram y TikTok se incorporan en versiones posteriores cuando el modelo esté probado.

## **2.3 Competencia y Diferenciación**

No existe ninguna plataforma que combine: comunidad hispanohablante enfocada en LatAm, intercambios reales con incentivo colaborativo, modelo colaborativo adaptado a la region, y calidad editorial minima garantizada por el ecosistema.

| **Tipo** | **Ejemplos** | **Problema** |
| --- | --- | --- |
| SMM clásico | MediaMister, AceleraTusRedes | Comentarios de bots, cuentas falsas, detectables |
| Intercambio automático | YTMonster, Like4Like | 60-80% de desubscripción, cero watch time |
| Microtareas globales | JumpTask, SproutGigs | En inglés, pagos en cripto, sin enfoque LatAm |
| Comentalo | — | Intercambio real, comunidad colaborativa, LatAm |

# **3. Vocabulario Oficial de la Plataforma**

El lenguaje es estratégico. Cada palabra define la percepción de la plataforma.

| **❌ Nunca decir** | **✅ Siempre decir** |
| --- | --- |
| Comentario comprado | Intercambio activado |
| Comprar comentarios | Activar intercambios |
| Comentarista | Creador colaborador |
| Tarea | Intercambio pendiente |
| Recibir comentarios | Recibir intercambios |
| Hacer un comentario | Participar en un intercambio |
| Cola de espera | Comunidad activa |
| Paquete de comentarios | Oportunidades de intercambio |

# **4. Modelo de Usuario**

## **4.1 Un Solo Tipo de Usuario**

No hay distinción entre creador y comentarista. Existe un solo tipo de usuario: el creador que alterna entre dar y recibir intercambios. El registro no pregunta '¿eres creador o comentarista?' — simplemente conecta tu canal de YouTube.

| **La lógica del ecosistema** Yo comento tus videos → acumulo derechos de intercambio → los uso para que comenten los míos → eso me motiva a comentar más → el ecosistema crece solo. |
| --- |

## **4.2 El Usuario que NO es el Cliente de Comentalo**

- El que quiere comprar interacciones sin esfuerzo

- El que no tiene tiempo de participar en la comunidad

- El que busca números rápidos sin importar la calidad

- El que ya usa plataformas SMM tradicionales

## **4.3 El Usuario que SÍ es el Cliente**

- Creador de YouTube en LatAm con canal pequeño o mediano

- Frustrado porque su contenido merece más atención

- Dispuesto a dar para recibir

- Entiende que el crecimiento real es colaborativo

- Valora que los intercambios sean de otros creadores reales

# **4B. Requisitos Minimos del Canal para Registrarse**

Para registrarse en Comentalo el usuario debe conectar su canal de YouTube via login con Google. La plataforma verifica automaticamente que el canal cumple los requisitos minimos en el momento del registro.

| **Parametro** | **Requisito minimo** | **Por que** |
| --- | --- | --- |
| Antiguedad del canal | Minimo 3 meses desde su creacion | Filtra cuentas creadas especificamente para hacer trampa |
| Videos publicados | Minimo 1 video publico | Confirma que es un creador real con contenido |
| Suscriptores | Minimo 20 suscriptores | Elimina cuentas sin historial social real |
| Canal publico | Obligatorio | No se puede verificar un canal privado via API |

## **4B.1 Como se Verifica**

Cuando el usuario ingresa el link de su canal durante el proceso de verificacion (seccion 9.5), Comentalo consulta la API publica de YouTube con el ID del canal:

| **Llamada a la API al registrarse** GET https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id={CHANNEL_ID}&key={API_KEY} — Costo: 1 unidad de cuota. Devuelve: fecha de creacion, conteo de videos, conteo de suscriptores y estado publico del canal. No requiere OAuth — usa la API key propia de la plataforma. |
| --- |

Si el canal no cumple alguno de los requisitos — el sistema muestra un mensaje claro indicando cual condicion no se cumple y por que. El usuario puede volver cuando su canal cumpla los requisitos.

## **4B.2 Por que No hay Requisito de Vistas**

Las vistas dependen del contenido y del nicho — no son un indicador confiable de que una cuenta es real. Un creador puede tener 20 suscriptores y videos con pocas vistas pero ser completamente legitimo. El requisito de antiguedad y suscriptores es suficiente para filtrar cuentas falsas.

## **4B.3 Por que No hay Requisito de Suscriptores Alto**

Comentalo esta disenado precisamente para canales pequeños que quieren crecer. Poner un requisito alto de suscriptores excluiria exactamente al usuario que mas necesita la plataforma. 20 suscriptores es el minimo justo — accesible para cualquier creador real, imposible de falsificar masivamente.

# **4C. Reglas Anti-Fraude**

## **4C.1 Sistema de Acumulacion de Intercambios**

El sistema funciona en ciclos de 10 intercambios — 1 a 1 en tiempo real. No hay acumulacion descontrolada porque cada intercambio ganado se asigna directamente al video activo del usuario.

Regla fundamental: Para ganar intercambios el usuario debe tener al menos 1 video activo registrado en Comentalo. Si no tiene video activo, no puede participar en intercambios aunque haya comentado videos de otros.

## **4C.2 Requisitos Minimos del Video**

Cualquier video publico del canal puede activarse en Comentalo. No hay requisito minimo de vistas para registrar el video — pero si hay una regla de vistas para lanzar cada campana. Ver seccion 5C.4 para la regla completa.

## **4C.3 Permanencia del Intercambio Verificado**

| **Politica de permanencia** Un intercambio verificado y completado es permanente. No se revierte bajo ninguna circunstancia, incluyendo la eliminacion posterior del comentario por YouTube. |
| --- |

Esta politica existe por tres razones:

- El comentarista cumplio su parte — publicar el comentario verificado. Si YouTube lo elimina despues es un problema externo a Comentalo.

- Revertir intercambios ya completados genera inestabilidad y desconfianza en el sistema.

- Detectar eliminaciones posteriores requeriria polling constante de todos los comentarios verificados — gasto innecesario de cuota de API.

## **4C.3b Limite de Intercambios Pendientes Simultaneos**

Un usuario no puede tener mas de 3 intercambios pendientes de verificacion al mismo tiempo. Si llega a ese limite, su acceso a la cola queda bloqueado temporalmente hasta que al menos uno de los pendientes se resuelva.

Esta regla existe para dos razones:

- Evita que un usuario hiperactivo acapare la cola comentando masivamente sin que sus intercambios se verifiquen correctamente.

- Protege al usuario de acumular intercambios que probablemente no se verificaran — si tiene 3 pendientes seguidos, es una senal de que algo esta mal con su cuenta o con los videos que esta comentando.

## **4C.5 Eliminacion de Videos**

Un creador puede eliminar un video registrado en Comentalo solo si ese video no tiene intercambios verificados. Si el video ya recibio al menos 1 intercambio verificado — no se puede eliminar.

| **Regla de eliminacion** Un video solo puede eliminarse si no tiene intercambios verificados. Una vez que un creador colaborador completo un intercambio real en ese video, el video queda permanente en la plataforma. |
| --- |

Esta regla existe por dos razones:

- Protege al creador colaborador — si alguien ya comento un video y gano su intercambio, eliminar el video no debe afectar el historial de ese intercambio.

- Evita el abuso — un creador no puede registrar un video, recibir intercambios y luego eliminarlo para registrar uno nuevo burlando los limites.

Al eliminar un video se eliminan automaticamente todas sus campanas e intercambios pendientes asociados. Solo los intercambios que nunca fueron verificados se pierden — y esos no afectan a nadie.

## **4C.4 Resumen de Todas las Reglas Anti-Fraude**

| **Escenario** | **Regla** | **Seccion de referencia** |
| --- | --- | --- |
| Canal falso o recien creado | Requisitos minimos — 3 meses, 1 video, 20 suscriptores | Seccion 4B |
| Comentario no encontrado por API | Flujo de pendientes — segundo comentarista asignado inmediatamente | Seccion 6C |
| 3 comentarios pendientes en mismo video en 24h | Video suspendido automaticamente | Seccion 6D |
| Comentario eliminado despues de verificado | Intercambio permanente — no se revierte | Seccion 4C.3 |
| Usuario sin video activo intentando ganar intercambios | Bloqueado — debe registrar un video primero | Seccion 4C.1 |
| Usuario con 3 intercambios pendientes simultaneos | Acceso a la cola bloqueado hasta resolver al menos 1 pendiente | Seccion 4C.3b |
| Patron de comentarios rechazados repetidos | Monitoreo del equipo — decision caso a caso | Seccion 6C.5 |
| Canal baneado en Comentalo | Canal de YouTube bloqueado permanentemente en la plataforma | Seccion 6.3 |
| Video eliminado con intercambios verificados | Bloqueado — el video no puede eliminarse | Seccion 4C.5 |

# **5. Mecánica Core del Intercambio**

## **5.1 La Regla Fundamental**

| **Regla de oro — Sin excepción** Para recibir un intercambio debes haber participado en uno primero. En la beta V1 la capacidad se amplia mediante gamificacion — programa de referidos y beneficios de fundador — no mediante pago. En Fase 2, el dinero ampliara la capacidad pero nunca comprara intercambios directamente. |
| --- |

## **5.2 El Flujo Completo del Intercambio**

Paso 1 — El creador publica su video en Comentalo → entra a la cola automáticamente.

Paso 2 — Recibe su primer intercambio automático (sin haber comentado). Este es el único intercambio que no requiere participación previa.

Paso 3 — Para recibir el segundo intercambio debe comentar un video de otro creador.

Paso 4 — Comenta → activa su derecho a recibir el siguiente intercambio.

Paso 5 — Ciclo continuo. Cada comentario activa un nuevo derecho de intercambio hasta completar los 10 disponibles del video. Para mas intercambios en ese video — se necesita desbloquear una expansion (via programa de referidos o beneficios de fundador).

## **5.3 Creación del Intercambio — Asistencia al Creador**

Al publicar un video en Comentalo, el creador completa un formulario simple:

- Link del video en YouTube

- Descripción corta del video — '¿De qué trata tu video?' (máximo 300 caracteres, opcional)

- Tipo de intercambio deseado — Opinión / Pregunta / Experiencia personal (botones)

- Tono — Casual / Entusiasta / Reflexivo (botones)

Con esa información la plataforma genera automáticamente instrucciones claras para el creador colaborador, usando la metadata pública de YouTube (título, descripción, tags) más la descripción del creador. La IA procesa solo texto — sin costo de procesamiento de video.

## **5.4 Ejecución del Intercambio — El Creador Colaborador**

El creador colaborador sigue este flujo dentro de Comentalo:

Paso 1 — Ve el video embedido directamente en Comentalo. Debe ver al menos 30 segundos antes de poder continuar. Una barra de progreso muestra el tiempo acumulado. El botón "Comentar este video" se habilita al llegar a 30 segundos.

Paso 2 — Lee las instrucciones del creador (tipo de comentario, tono, notas). Redacta su comentario en la casilla de texto (mínimo 20 caracteres). Presiona "Copiar comentario" — el texto queda copiado en su portapapeles.

Paso 3 — Va a YouTube, abre el video y pega el comentario. Un recordatorio le sugiere dar like al video como buena práctica. Puede volver a editar el comentario con "← Editar comentario" o cancelar el intercambio.

Paso 4 — Regresa a Comentalo y presiona "Ya publiqué mi comentario". La plataforma consulta la API de YouTube buscando ese texto específico. Si lo encuentra → intercambio verificado. Si no lo encuentra → segundo intento automático a los 30 segundos. Si tampoco lo encuentra → pantalla de rechazo con causas posibles.

## **5.5 Límites Base — Sin Expansión**

| **Parámetro** | **Valor** |
| --- | --- |
| Videos activos simultáneamente | 2 videos |
| Intercambios por video | 10 intercambios |
| Son permanentes por video | No se reinician — cada video mantiene su cupo de 10 para siempre |
| Primer intercambio | Automático sin comentar |
| Desde el segundo | Requiere haber comentado primero |

## **5.6 Requisitos de Moderacion del Video al Registrarlo**

Al registrar un video en Comentalo, el creador debe asegurarse de que la configuracion de comentarios en YouTube Studio sea compatible con la verificacion automatica de la plataforma.

| **Instruccion importante al registrar un video** Para que los intercambios funcionen correctamente, asegurate de que tu video tenga los comentarios configurados en modo Ninguno o Basico en YouTube Studio. Si tienes activada la revision manual o moderacion estricta, los intercambios pueden tardar mas en verificarse o no verificarse automaticamente. |
| --- |

### **Configuraciones de comentarios en YouTube Studio**

| **Configuracion en YouTube Studio** | **Impacto en Comentalo** |
| --- | --- |
| Ninguno — No retener ningun comentario | Optimo — comentarios aparecen en segundos |
| Basico — Retener comentarios potencialmente inapropiados | Compatible — la mayoria aparecen en minutos |
| Estricto — Retener mas comentarios inapropiados | Problematico — muchos intercambios quedaran pendientes |
| Retener todos — Revision manual de cada comentario | Incompatible — ningun intercambio se verificara automaticamente |
| Comentarios desactivados | Incompatible — el video no puede registrarse en Comentalo |

### **Por que no se puede detectar automaticamente via API**

La configuracion de moderacion de un canal es informacion privada del creador. La API publica de YouTube no expone este dato. Comentalo no puede verificar automaticamente si un video tiene moderacion estricta activada — por eso la responsabilidad recae en el creador al momento de registrar su video.

Si el patron de intercambios pendientes se repite sistematicamente en un video — el equipo de Comentalo puede contactar al creador para orientarlo sobre la configuracion correcta.

# **5B. Mecanica de la Cola de Intercambios**

## **5B.1 Como Funciona el Matching**

El sistema asigna automáticamente 2 videos disponibles de la cola al comentarista simultáneamente. El comentarista ve ambos videos con su información y elige cuál comentar. Una vez que elige uno, el intercambio se crea para ese video y el otro vuelve a la cola disponible para otro comentarista. Esto garantiza que todos los videos reciban atención por igual — el sistema controla qué 2 aparecen, no el usuario — mientras mejora la experiencia al dar una alternativa inmediata.

| **Por que asignacion automatica y no lista de seleccion** Con lista de seleccion, los videos de nichos poco populares nunca recibirian intercambios. Todos elegiriian gaming o entretenimiento y los videos de educacion, cocina o arte quedarian varados. La asignacion automatica garantiza que todos los videos reciban atencion por igual. |
| --- |

## **5B.2 Filtros en V1**

En V1 no hay filtros de categoria, idioma ni pais. La cola es general para todos los usuarios. Esto es necesario porque con pocos usuarios en el inicio, segmentar la cola crearia colas vacias por categoria.

Los filtros por categoria e idioma se evaluaran para versiones posteriores cuando haya suficiente volumen de usuarios para que la segmentacion tenga sentido.

## **5B.3 Reglas de Participacion**

| **Regla** | **Valor** | **Razon** |
| --- | --- | --- |
| Mismo video | Solo una vez por comentarista | Garantiza variedad de voces en cada video |
| Mismo canal | Sin restriccion — puede comentar varios videos del mismo canal | Un canal con multiples videos en la plataforma puede recibir de varios videos diferentes |
| Limite diario global | Sin limite | El comentarista activo no debe ser restringido artificialmente |
| Anti-spam natural | La restriccion de un comentario por video lo resuelve | Para comentar 10 veces el mismo canal necesitaria 10 videos diferentes de ese canal en la plataforma |

## **5B.4 Por que Una Vez por Video Resuelve el Anti-Spam**

Si un comentarista solo puede comentar cada video una vez — y un canal tipico publica 2 a 4 videos al mes — es practicamente imposible que alguien comente el mismo canal demasiadas veces en poco tiempo de forma que parezca spam para YouTube.

No se necesitan limites diarios ni intervalos artificiales. La restriccion ya esta integrada en la mecanica del producto de forma natural.

## **5B.5 Orden de la Cola**

Los videos en la cola se ordenan por antiguedad del registro — el video que lleva mas tiempo esperando va primero. Esto garantiza que ningun video quede bloqueado indefinidamente esperando intercambios.

En V1 la cola es estrictamente FIFO (First In, First Out) — el video que lleva mas tiempo esperando va primero, sin excepciones. No hay prioridad pagada en la beta. La prioridad para videos con expansion pagada se definira en V2 cuando se active la pasarela de pagos.

# 5C. El Modelo de Campanas

Una campaña es la unidad de trabajo central de Comentalo. Cada campaña tiene una duración fija de 30 días y recibe todos los comentarios verificados que lleguen durante ese periodo, sin límite de cantidad.

## 5C.1 Que es una Campaña

| Elemento | Definición |
| --- | --- |
| Intercambios por campaña | Sin límite — recibe todos los comentarios verificados que lleguen en 30 días |
| Inicio | El creador lanza la campaña para un video específico |
| Pausa automática | La campaña se pausa cuando el saldo de comentarios llega a 0 |
| Cierre manual | El creador puede pausarla o finalizarla antes del vencimiento |
| Nueva campaña | El creador puede lanzar otra campaña del mismo video inmediatamente después de que la anterior termine |

## 5C.2 El Flujo de una Campaña

Paso 1 — El creador lanza una campaña para su video.
Paso 2 — El sistema verifica que el video cumple la regla de vistas (ver 5C.4).
Paso 3 — La campaña queda activa durante 30 días en la cola.
Paso 4 — Los comentaristas participan libremente durante esos 30 días.
Paso 5 — El creador califica los comentarios recibidos en cualquier momento durante o después de la campaña.
Paso 6 — La campaña se mantiene activa mientras el creador tenga saldo. Si el saldo llega a 0 la campaña se pausa automáticamente y se reactiva cuando el creador comenta más videos.

## 5C.3 Reglas de las Campañas

| Parámetro | Valor |
| --- | --- |
| Intercambios por campaña | Sin límite |
| Campañas simultáneas por video | 1 — no puede haber dos campañas abiertas en el mismo video |
| Condición para lanzar otra campaña | La campaña anterior debe estar cerrada (finalizada o vencida) |
| Cierre automático | Al vencer los 30 días |

## 5C.4 La Regla de Vistas

Para lanzar una campaña el video debe tener al menos 10 vistas por cada campaña lanzada. Ejemplos:

- Video con 10 vistas → puede lanzar Campaña 1
- Video con 15 vistas al terminar Campaña 1 → no puede lanzar Campaña 2 aún (necesita 20 vistas)
- Video con 22 vistas → puede lanzar Campaña 2

## 5C.5 Vocabulario Oficial de Campañas

| Evitar | Usar en su lugar |
| --- | --- |
| Intercambios por video | Campañas del video |
| Activar intercambios | Lanzar una campaña |
| Completar ciclo de 10 | Campaña finalizada |
| Cola de intercambios | Cola de campañas activas |

# **5D. Estados y Acciones de Campañas**

## Estados posibles de una campaña

- Activa — recibiendo comentarios normalmente
- Pausada — el creador la pausó temporalmente, no recibe comentarios
- Finalizada — cerrada voluntariamente por el creador o por vencimiento de 30 días
- Eliminada — borrada permanentemente, no aparece en ninguna vista

## Acciones disponibles por estado

| Estado | Activar | Pausar | Finalizar | Eliminar |
| --- | --- | --- | --- | --- |
| Activa | — | ✅ | ✅ | ✅ solo si 0 comentarios |
| Pausada | ✅ | — | ✅ | ✅ solo si 0 comentarios |
| Finalizada | — | — | — | — |

## Reglas

- Una campaña finalizada queda en el historial permanentemente — no se puede eliminar
- Solo se puede eliminar una campaña que no haya recibido ningún comentario verificado
- Al pausar — los comentaristas que tenían ese video asignado reciben otro video automáticamente
- Al finalizar — la campaña cierra inmediatamente sin importar cuántos días llevaba activa

# 5F. Sistema de Créditos

## 5F.1 Qué son los Créditos

Los créditos son la unidad de intercambio de Comentalo. Representan el balance entre comentarios dados y comentarios recibidos. Abrir una campaña cuesta créditos, recibir comentarios los consume, dar comentarios o recibir calificaciones los gana.

## 5F.2 Mecánica de los Créditos

| Parámetro | Valor |
| --- | --- |
| Saldo máximo | Sin techo — el usuario acumula ilimitado |
| Saldo al registrarse | 60 créditos de bienvenida |
| Gana +1 | Cada comentario verificado dado |
| Gana +1 | Cada comentario recibido que califica con estrellas |
| Gasta −1 | Cada comentario recibido en campaña activa |
| Gasta −30 | Al abrir una campaña (incluyendo las primeras) |
| Visible en | Header del dashboard + perfil del usuario |

## 5F.3 Saldo Inicial y Primeras Campañas

Al registrarse el usuario recibe 60 créditos de bienvenida. Con esos 60 créditos puede abrir 2 campañas completas (30 × 2 = 60). A partir de la tercera campaña debe ganar créditos antes de abrirla.

## 5F.4 Duración de la Campaña

Todas las campañas duran 30 días fijos desde su apertura, incluyendo las primeras. Al vencer los 30 días la campaña se cierra automáticamente sin importar el saldo del creador.

## 5F.5 Pausa y Reactivación Automática

| Condición | Resultado |
| --- | --- |
| Saldo del creador llega a 0 | Todas sus campañas activas se pausan automáticamente |
| Saldo del creador sube de 0 | Todas sus campañas pausadas se reactivan automáticamente |

Mientras una campaña esté pausada sus videos no aparecen en la cola. La pausa no detiene el reloj de los 30 días — el tiempo sigue corriendo.

## 5F.6 Campañas Simultáneas

No hay límite de campañas simultáneas por usuario. El límite práctico es el saldo de créditos: con 60 créditos se pueden abrir 2 campañas; con 120 se pueden abrir 4.

## 5F.7 Reglas Adicionales

- El creador no puede comentar su propio video
- El saldo nunca baja de 0 — si llega a 0 las campañas se pausan, no se generan créditos negativos
- El comentario del creador debe verificarse exitosamente contra YouTube para sumar crédito. El sistema normaliza el texto quitando Variation Selectors (U+FE00..U+FE0F) y Zero Width Joiner (U+200D) antes del match literal, para tolerar cómo YouTube procesa emojis
- La calificación con estrellas que suma crédito al creador es independiente del número de estrellas — cualquier calificación cuenta

## 5F.8 Notificación por Créditos en 0

Cuando una o más campañas se pausan por créditos en 0, el creador recibe:
- Notificación dentro de la plataforma
- Email automático via Resend (pendiente de implementación) con el mensaje: "Tus campañas se pausaron porque tus créditos llegaron a 0. Comenta más videos o recibe calificaciones para reactivarlas automáticamente."

# **6. Verificación y Sistema de Reputación**

## **6.1 Sistema de Verificación V1**

La verificacion es automatica via API publica de YouTube. Cuando el creador colaborador publica su comentario, presiona el boton Ya comente en Comentalo. La plataforma consulta la API de YouTube con su propia API key y verifica automaticamente si el comentario existe. No se requiere link directo ni screenshot.

El creador que recibe tiene 72 horas para calificar el intercambio. Si no hace nada en 72 horas → el intercambio se confirma automaticamente.

## **6.2 Calificación de Comentarios**

La calificación es por estrellas del 1 al 5. La calificación es simple y rápida — 5 estrellas interactivas por intercambio. Sin texto. Sin explicaciones. En 30 segundos se califican los 10. Si el creador no califica en 72 horas → se autocalifican con 5 estrellas con notificación previa a las 48 horas.

Etiquetas de referencia: 1★ Muy malo / 2★ Malo / 3★ Regular / 4★ Bueno / 5★ Excelente

## **6.3 Sistema de Reputación del Creador Colaborador**

| **Nivel** | **Promedio de estrellas** | **Consecuencia** |
| --- | --- | --- |
| 🟢 Verde — Acceso completo | 4.0 a 5.0 | Todo normal, acceso a todos los videos |
| 🟡 Amarillo — Acceso limitado | 3.0 a 3.9 | Menos videos disponibles, advertencia |
| 🟠 Naranja — Suspensión temporal | 2.0 a 2.9 | Sin intercambios por 7 días, puede apelar |
| 🔴 Rojo — Baneo permanente | Menos de 2.0 | Cuenta bloqueada, canal de YouTube bloqueado |

La reputación se calcula como promedio de estrellas acumuladas. El comentarista ve su promedio general en su perfil pero no la calificación de cada intercambio individual. El sistema se activa después de un mínimo de 20 intercambios calificados.

Migración de calificaciones anteriores: intercambios calificados con positiva equivalen a 5 estrellas, intercambios calificados con negativa equivalen a 1 estrella.

## **6.4 Sistema de Disputas V1**

Cuando el creador califica un intercambio con 👎, puede opcionalmente escribir el motivo. Si el comentarista considera que la calificacion negativa es injusta, puede abrir una disputa. El equipo de Comentalo revisa la evidencia disponible — historial de la API, reputacion del comentarista y contexto del intercambio — y decide en 48 horas. Las disputas solo aplican para suspensiones temporales — no para baneos permanentes.

# **6B. Verificación Técnica del Intercambio**

## **6B.1 ¿Tienen link los comentarios de YouTube?**

YouTube eliminó la opción de copiar link directo por comentario desde la interfaz. En celular tampoco está disponible de forma confiable. Por lo tanto, la verificación por link directo no es viable como método principal.

## **6B.2 Solución — API Pública de YouTube**

Los comentarios publicos de cualquier video de YouTube se pueden leer usando solo una API key gratuita — sin OAuth, sin permisos adicionales del usuario. Importante: esto aplica unicamente para la verificacion del comentario. El login con Google sigue siendo obligatorio al momento del registro para verificar la propiedad del canal.

| **La llamada a la API es simplemente:** https://www.googleapis.com/youtube/v3/commentThreads?key=API_KEY&part=id,snippet&videoId=ID_DEL_VIDEO |
| --- |

## **6B.3 Flujo de Verificación Automática**

Paso 1 — El creador colaborador comenta el video en YouTube desde su cuenta registrada en Comentalo.

Paso 2 — Regresa a Comentalo y presiona "Ya publiqué mi comentario".

Paso 3 — La plataforma consulta la API de YouTube con el videoId y su propia API key buscando el texto exacto del comentario publicado por el canal registrado del usuario.

Paso 4 — Si encuentra el comentario → intercambio verificado automáticamente ✅. Se crea el registro del intercambio en la base de datos con estado verificado.

Paso 5 — Si no encuentra el comentario → segundo intento automático a los 30 segundos.

Paso 6 — Si el segundo intento también falla → pantalla de rechazo ❌. El usuario puede reintentar manualmente o cancelar. No se crea ningún registro en la base de datos.

| IMPORTANTE | El intercambio solo se registra en la base de datos cuando es verificado exitosamente. No existe estado pendiente. |
| --- | --- |

## **6B.4 Ventajas de este Sistema**

- No requiere OAuth ni permisos especiales del usuario para verificar — solo la API key propia de la plataforma

- El usuario no tiene que hacer nada extra — solo comentar en YouTube y presionar Ya comente

- Imposible de falsificar — la API consulta directamente a YouTube

- Costo casi cero — leer comentarios cuesta solo 1 unidad de cuota por petición

- Límite gratuito: 10,000 verificaciones diarias — suficiente para V1

## **6B.5 Impacto en el Registro**

El login con Google es obligatorio al registrarse — pero solo pide el scope basico de perfil (email y nombre). La verificacion de propiedad del canal se realiza mediante codigo en la descripcion (ver seccion 9.5). Una vez registrado, la verificacion de cada intercambio es automatica via API key propia de la plataforma, sin necesidad de permisos OAuth adicionales.

| **Método** | **¿Viable?** | **Razón** |
| --- | --- | --- |
| Link directo al comentario | ❌ No | YouTube eliminó esta opción de la interfaz |
| Screenshot | ❌ No recomendado | Falsificable, requiere moderación manual |
| OAuth del usuario | ⚠️ Opcional | Útil para registro, no necesario para verificar |
| API key propia + videoId | ✅ Sí — método elegido | Gratis, automático, imposible de falsificar |

# 6C. Política de Verificación Fallida

Si la API de YouTube no encuentra el comentario después de 2 intentos, el intercambio se considera fallido. El sistema muestra al usuario las posibles causas:

- Canal incorrecto — el comentario debe publicarse con el canal registrado en Comentalo
- YouTube tardó en indexar — puede ocurrir en cuentas nuevas o con poca actividad
- El texto no coincide — el comentario publicado debe ser exactamente el copiado desde Comentalo
- El video tiene moderación estricta — el creador tiene activada la revisión manual en YouTube Studio

El usuario puede reintentar manualmente presionando "Volver a intentarlo" o cancelar el intercambio. No hay penalización en la reputación por un intento fallido.

# **6G. Sistema de Notificaciones**

Comentalo notifica a los usuarios en tiempo real cuando ocurren eventos relevantes para sus videos o intercambios. Las notificaciones aparecen en un panel accesible desde un icono de campana en el dashboard, con un contador de notificaciones no leidas.

## **6G.1 Tipos de Notificacion**

| **Tipo** | **Titulo** | **Destinatario** | **Cuando se crea** |
| --- | --- | --- | --- |
| intercambio_verificado | Tu comentario fue verificado | Creador colaborador | Cuando su comentario es encontrado por la API de YouTube |
| intercambio_pendiente | Tu comentario esta en revision | Creador colaborador | Cuando su comentario no se encuentra en el primer intento (seccion 6C) |
| intercambio_recibido | Nuevo comentario en tu video | Creador del video | Cuando un intercambio en su video es verificado exitosamente |
| campana_completa | Campana completada | Creador del video | Cuando su campana alcanza 10 intercambios verificados |
| video_suspendido | Tu video fue suspendido | Creador del video | Cuando su video es suspendido por patron de moderacion (seccion 6D) |

## **6G.2 Panel de Notificaciones en el Dashboard**

El dashboard muestra un icono de campana en la esquina superior con un contador naranja de notificaciones no leidas. Al hacer clic se despliega un panel con la lista de notificaciones ordenadas por fecha — las mas recientes primero.

Cada notificacion muestra:

- Titulo del evento
- Mensaje descriptivo con contexto (nombre del video, etc.)
- Tiempo relativo (hace 5 minutos, hace 2 horas, hace 1 dia)
- Indicador visual de no leida (punto naranja)

Al hacer clic en una notificacion:

- Se marca automaticamente como leida
- Navega a la pagina relevante (dashboard, detalle de campana, pagina de calificacion)

## **6G.3 Actualizacion en Tiempo Real**

Las notificaciones se actualizan en tiempo real via Supabase Realtime. Cuando el sistema crea una nueva notificacion — por ejemplo, al verificar un intercambio — el panel del dashboard del usuario destinatario se actualiza automaticamente sin necesidad de recargar la pagina.

## **6G.4 Politica de Retencion**

El panel muestra las ultimas 30 notificaciones del usuario. Las notificaciones mas antiguas se conservan en la base de datos pero no se muestran en el panel. No hay eliminacion automatica de notificaciones en V1.

# **6H. Sistema de Diseno Visual**

La plataforma utiliza un sistema de diseno unificado que se aplica a la landing page, el dashboard y todas las pantallas internas.

## **6H.1 Tipografia**

| **Uso** | **Fuente** | **Variable CSS** |
| --- | --- | --- |
| Titulos y headlines | Plus Jakarta Sans | `--font-headline` |
| Cuerpo de texto y UI | Inter | `--font-body` |

## **6H.2 Colores**

| **Token** | **Valor** | **Uso** |
| --- | --- | --- |
| primary | #6200EE | Color principal — botones, enlaces, badges, gradientes |
| primary-light | #ac8eff | Gradiente editorial, acentos secundarios |
| surface | #f5f6f7 | Fondo de secciones alternadas, tarjetas |
| ghost-border | rgba(171, 173, 174, 0.15) | Bordes sutiles en tarjetas y separadores |

## **6H.3 Componentes Clave**

- **Editorial gradient:** `linear-gradient(135deg, #6200EE, #ac8eff)` — usado en botones principales de la landing
- **Nav fija:** `backdrop-blur-xl` con fondo semitransparente
- **Tarjetas:** `rounded-xl`, borde `ghost-border`, `hover:scale-[1.02]`
- **Botones:** `rounded-lg`, font-semibold, transiciones de color y escala
- **Footer:** links en `uppercase tracking-widest`
- **Espaciado:** secciones con `py-20`, contenido centrado con `max-w-6xl`

## **6H.4 Landing Page**

La landing page (`/login`) es la primera impresion de la plataforma. Estructura:

- **Nav:** Logo "Comentalo" + link "Como funciona" + botones "Iniciar sesion" y "Unirse"
- **Hero:** Dos columnas — headline + manifiesto (izquierda) | formulario login con Google (derecha)
- **Como funciona:** 3 tarjetas con los pasos: Registra tu video → Comenta → Recibe intercambios
- **Footer:** Copyright + links Terminos y Contacto

# **6E. Riesgos Residuales Identificados**

Antes del desarrollo del MVP se identificaron dos riesgos residuales criticos que deben estar mapeados desde el inicio.

## **6E.1 Riesgo Tecnico — El Muro de la Cuota API**

El limite gratuito de 10,000 verificaciones diarias es suficiente para los 100 fundadores, pero puede alcanzarse sorpresivamente rapido al abrir al publico general.

El peligro real esta en el bucle de reintentos para intercambios pendientes. Si entran 500 usuarios nuevos en un dia y el 15% de los comentarios caen en retencion de YouTube — algo normal para cuentas nuevas — la plataforma consumira miles de peticiones de cuota buscando comentarios que no apareceran, bloqueando las verificaciones en tiempo real de usuarios que si estan cumpliendo.

| **Solucion — Exponential Backoff** En lugar de consultas cada 2 horas, el sistema implementa retroceso exponencial: reintenta a los 30 minutos, luego 2 horas, luego 8 horas, luego 24 horas. Esto reduce de 24 consultas maximas por intercambio pendiente a solo 4 — ahorrando hasta 83% de cuota en casos de retencion. |
| --- |

| **Intento** | **Tiempo desde el primer fallo** | **Cuota consumida** |
| --- | --- | --- |
| Reintento 1 | 30 minutos | 1 unidad |
| Reintento 2 | 2 horas | 1 unidad |
| Reintento 3 | 8 horas | 1 unidad |
| Reintento 4 | 24 horas | 1 unidad |
| Sin resolucion | Revision manual del equipo | 0 unidades adicionales |

Accion adicional: Solicitar a Google un aumento de cuota de la API de YouTube desde el momento del lanzamiento de la beta. Este tramite administrativo puede tardar semanas — iniciar el proceso temprano es critico.

## **6E.2 Riesgo Logico — La Deuda Inicial**

La mecanica del primer intercambio automatico crea una deuda sistemica. Por cada usuario nuevo que registra un video, la plataforma adquiere una deuda de 1 comentario que alguien debe ejecutar.

Durante el lanzamiento cerrado con fundadores, esta deuda es manejable. Pero en la apertura al publico general, si entran 1,000 usuarios nuevos buscando su primer intercambio gratis sin que haya suficientes comentaristas activos, la cola se congela.

| **Valvula de emergencia operativa** Si la cola se estanca durante un pico de registros, el equipo puede suspender temporalmente la regla del primer intercambio automatico y obligar a los nuevos usuarios a comentar al menos 1 video antes de recibir el suyo. Esto inyecta liquidez de trabajo al ecosistema de forma inmediata. Es una medida excepcional — no una regla permanente. |
| --- |

## **6E.3 Stack Tecnologico para el MVP**

Comentalo V1 se construye con el siguiente stack tecnologico, optimizado para velocidad de desarrollo con Claude Code:

| **Componente** | **Tecnologia** | **Por que** |
| --- | --- | --- |
| Frontend | Next.js | Un solo lenguaje JavaScript para todo. Facil de desplegar. |
| Backend | Next.js API Routes | Sin servidor separado. Las llamadas a la API de YouTube van aqui. |
| Base de datos | Supabase (PostgreSQL) | Autenticacion con Google incluida. Panel visual. Plan gratuito generoso. |
| Hosting | Vercel | Despliegue automatico. Funciona perfectamente con Next.js. Plan gratuito para V1. |
| Autenticacion | Supabase Auth + Google OAuth | Resuelve el login con Google y la verificacion del canal de YouTube. |

Todo el desarrollo del MVP se realizara con Claude Code como asistente principal, lo que permite a un perfil no tecnico construir la plataforma completa sin necesidad de un equipo de desarrollo externo.

# **6F. Arquitectura Tecnica del MVP**

Antes de escribir la primera linea de codigo, se identificaron tres desafios tecnicos especificos de la arquitectura Serverless que deben resolverse desde el dia uno.

## **6F.1 Tareas en Segundo Plano — El Enemigo del Serverless**

Las funciones Serverless de Vercel tienen un limite de tiempo de ejecucion de 10 a 15 segundos. No pueden dormirse ni usar setTimeout para verificar la API de YouTube despues de 30 minutos — el proceso muere antes.

| **Solucion — Cron Jobs + tabla verificaciones_pendientes** Crear una tabla en Supabase llamada verificaciones_pendientes con una columna proximo_intento_at (timestamp). Usar Vercel Cron Jobs o la extension pg_cron de Supabase configurada para correr cada 5 minutos. Busca filas donde proximo_intento_at <= NOW(), ejecuta las llamadas a la API de YouTube, y si falla actualiza proximo_intento_at sumando 2h, 8h o 24h segun el intento del Exponential Backoff. |
| --- |

## **6F.2 Condiciones de Carrera en la Cola — Race Conditions**

El bug mas peligroso para Comentalo. Si dos comentaristas hacen clic en Buscar intercambio en el mismo milisegundo, un SELECT simple podria asignarles el mismo video. Uno perderia su tiempo o el creador recibiria 11 comentarios en una campana de 10.

| **Solucion — SELECT FOR UPDATE SKIP LOCKED en PostgreSQL** No hacer la asignacion en Next.js. Usar un RPC (Remote Procedure Call) en Supabase con la clausula SELECT ... FOR UPDATE SKIP LOCKED. Esto garantiza transaccionalidad absoluta: el primer milisegundo bloquea la fila del video, el segundo milisegundo salta automaticamente al siguiente disponible. Nunca hay asignaciones duplicadas. |
| --- |

## **6F.3 Latencia en el Flujo Ya Publique — Supabase Realtime**

El flujo requiere que el usuario vaya a YouTube y vuelva. La interfaz debe reaccionar de forma impecable — si tarda unos segundos sin feedback visual, el usuario siente que el sistema fallo.

| **Solucion — Supabase Realtime** Cuando el usuario hace clic en Ya publique, Next.js envia la solicitud al backend. La UI se suscribe a los cambios de esa fila especifica en Supabase. En el momento en que el servidor verifica el comentario en YouTube y actualiza el estado a completado, la UI del usuario se actualiza automaticamente sin recargar la pagina. Experiencia de producto premium e instantanea. |
| --- |

## **6F.4 Principio de Arquitectura — Logica en la Base de Datos**

Toda la logica pesada de los intercambios debe vivir en Supabase como procedimientos almacenados (RPC), no en los componentes de React. Next.js actua solo como capa de presentacion.

| **Componente** | **Responsabilidad** |
| --- | --- |
| Supabase RPC (PostgreSQL) | Asignacion de videos, reglas de vistas, ciclos de campanas, Exponential Backoff, race conditions |
| Next.js API Routes | Llamadas a la API de YouTube, autenticacion, coordinacion entre Supabase y la UI |
| Next.js Frontend (React) | Presentacion, contador regresivo, estados de UI, suscripcion a Supabase Realtime |
| Vercel Cron Jobs | Ejecucion periodica del Exponential Backoff cada 5 minutos |

## **6F.5 Esquema de Base de Datos — Tablas Principales**

Antes de escribir codigo, el esquema relacional debe estar definido. Las tablas principales del sistema son:

| **Tabla** | **Campos principales** | **Proposito** |
| --- | --- | --- |
| usuarios | id, canal_youtube_id, canal_url, suscriptores_al_registro, antiguedad, reputacion, created_at | Identidad permanente del creador. suscriptores_al_registro es foto estatica del dia del registro — no se actualiza automaticamente. |
| videos | id, usuario_id, youtube_video_id, titulo, vistas, estado, intercambios_disponibles, created_at | Videos registrados en la plataforma |
| campanas | id, video_id, estado, intercambios_completados, created_at, closed_at | Ciclos de 10 intercambios por video |
| intercambios | id, campana_id, comentarista_id, texto_comentario, timestamp_copia, estado, calificacion, created_at | Cada intercambio individual dentro de una campana |
| verificaciones_pendientes | id, intercambio_id, proximo_intento_at, intentos, created_at | Cola de reintentos con Exponential Backoff |

# **7. Modelo de Monetización [BACKLOG FASE 2]**

| **IMPORTANTE — Este capitulo es contexto futuro unicamente** Todo el capitulo 7 describe el modelo de monetizacion de la Fase 2. En la Beta V1 NO hay pasarela de pagos, NO hay creditos internos y NO hay expansiones pagadas. Claude Code no debe programar ninguna logica transaccional de este capitulo. |
| --- |

## **7.1 Principio Base**

En la Fase 2, el dinero no comprara intercambios directamente — solo ampliara la capacidad de intercambiar. Siempre habra que comentar primero para recibir, sin importar cuanto se haya pagado.

## **7.2 ¿Qué se Venderá en Fase 2?**

Se vendera capacidad adicional de intercambio — no intercambios en si mismos. Especificamente:

- Mayor numero de intercambios disponibles por video (mas alla de los 10 del plan base)

- Mayor numero de videos activos simultaneamente (mas alla de los 2 del plan base)

| **Estrategia de lanzamiento — Beta gratuita con limites originales** La V1 se lanza 100% gratuita sin pasarela de pagos, pero manteniendo los limites originales del plan base: 2 videos activos y 10 intercambios por campana. La capacidad adicional se desbloquea mediante gamificacion — programa de referidos, logros por calificaciones perfectas — no mediante pago. Esto elimina entre un 30% y 40% de complejidad tecnica del MVP, permite conseguir masa critica sin friccion, y evita el efecto anclaje de regalar limites altos que despues no se pueden bajar. |
| --- |

## **7.3 [BACKLOG FASE 2] Modelo de Pagos Futuro**

Las secciones 7.3, 7.4 y 7.5 describen el modelo de monetizacion que se implementara en la Fase 2 de la plataforma, una vez validada la beta gratuita con masa critica real. NO forman parte del MVP ni deben programarse en V1.

### **7.3.1 Modelo de Pago — Expansion por Video**

El creador paga para ampliar la capacidad de un video específico. Es un pago único permanente, no una suscripción mensual.

| **Nivel de expansion** | **Intercambios totales en el video** |
| --- | --- |
| Sin expansion (base) | Hasta 10 intercambios |
| Expansión Básica | Hasta 20 intercambios |
| Expansión Plus | Hasta 35 intercambios |
| Expansión Pro | Hasta 60 intercambios |

| **Precios pendientes de definicion** Los precios de cada nivel de expansion seran definidos una vez validado el modelo con usuarios reales. El criterio de referencia es ofrecer un precio por intercambio significativamente menor al mercado SMM tradicional (~$0.50 USD por interaccion de baja calidad). |
| --- |

### **7.3.2 Comision de la Plataforma**

Comentalo retiene el 50% del valor de cada transaccion de expansion. El 50% restante queda como credito para el creador colaborador que realizo el intercambio. Los porcentajes exactos podran ajustarse una vez definidos los precios finales.

### **7.3.3 Sistema de Creditos**

Los pagos se realizan mediante créditos internos de la plataforma:

- Los créditos se compran con dinero real

- Los créditos ganados participando solo se usan dentro de la plataforma

- Los créditos nunca expiran

- El precio del paquete de créditos puede ajustarse, pero los créditos ya comprados mantienen su valor

### **7.3.4 Mensaje de Venta**

| **Propuesta de valor vs. la competencia** En otras plataformas pagas por intercambios de bots. En Comentalo cada intercambio es de un creador real. Mas valor. Mas seguro para tu canal. Sin bots. |
| --- |

# **8. Estrategia de Lanzamiento**

## **8.1 El Problema de Masa Crítica**

Sin creadores colaboradores activos, los creadores no reciben intercambios. Sin intercambios disponibles, los creadores colaboradores no tienen videos en qué participar. Este es el problema del huevo y la gallina que hay que resolver en el lanzamiento.

## **8.2 Estrategia por Fases**

### **Fase 1 — Reclutamiento de Creadores Fundadores (Antes del lanzamiento)**

Reclutar los primeros 100 creadores fundadores desde la comunidad de DeLikes. El objetivo es tener un grupo activo listo para ejecutar intercambios antes de abrir al publico. El pitch:

| **Mensaje de reclutamiento** Participa comentando videos de otros creadores esta semana. Cuando abramos al publico, tendras intercambios listos para activar en tu propio canal. Se parte de los 100 creadores fundadores de Comentalo. |
| --- |

### **Fase 2 — Lanzamiento Cerrado con Comunidad DeLikes**

Abrir la plataforma exclusivamente a la comunidad de DeLikes. Los creadores fundadores de la Fase 1 ya estan listos para ejecutar intercambios. Los primeros usuarios que se registren como fundadores reciben automaticamente su primer intercambio en su video al publicarlo — sin necesidad de comentar primero — experimentando el valor de la plataforma desde el primer dia.

### **Fase 3 — Apertura al Público General**

Cuando el ciclo funciona solo — suficientes creadores activos en ambos lados — abrir al público general en Colombia, México y Venezuela.

## **8.3 Programa de Fundadores**

### **¿Quiénes son los Fundadores?**

Los primeros 100 usuarios registrados en la plataforma. El cupo es limitado y no se amplía.

### **¿Qué reciben los Fundadores?**

- Expansion Basica desbloqueada permanentemente desde el dia de activacion — 3 videos activos y 20 intercambios totales por video (2 campanas de 10 disponibles por video) sin necesidad de referidos

- Badge permanente de Fundador visible en su perfil dentro de la comunidad

- Acceso prioritario al programa de referidos exclusivo

### **¿Qué NO cambia para los Fundadores?**

| **La regla de oro se mantiene sin excepción** La Expansion Basica amplía la capacidad — 3 videos activos y 20 intercambios totales por video (2 campanas de 10 disponibles por video). Pero los fundadores siguen teniendo que comentar primero para recibir. Sin excepcion. La cola en V1 es estrictamente FIFO — no hay prioridad especial en cola para fundadores en la beta. |
| --- |

### **Condición de Activación**

El badge de Fundador y la Expansion Basica se activan cuando el fundador completa su primer ciclo de 10 intercambios. No al registrarse — al participar activamente por primera vez.

## **8.4 Programa de Referidos — Invita un Creador**

El programa de referidos es exclusivo para los 100 creadores fundadores. Una vez completado el cupo de fundadores, el programa de referidos se evalua para decidir si se abre al resto de la comunidad.

| **La mecanica en una sola frase** Invita un creador. Cuando complete sus primeros 10 intercambios — tu desbloqueas un video adicional para intercambiar. |
| --- |

### **El Flujo Completo**

Paso 1 — El fundador comparte su link personalizado de referido.

Paso 2 — El referido se registra usando ese link.

Paso 3 — El referido activa su primer video en la plataforma.

Paso 4 — El referido completa sus primeros 10 intercambios y vive la experiencia completa.

Paso 5 — El fundador recibe automaticamente 1 video adicional desbloqueado en su cuenta.

### **Por que se activa al completar 10 intercambios y no al registrarse**

- Evita el fraude — una cuenta falsa nunca va a completar 10 intercambios reales

- Garantiza calidad — el referido que completa el ciclo es un usuario real y valioso

- Alinea incentivos — el fundador acompana al referido hasta que vive la experiencia

- Es honesto — el referido ya participo activamente antes de que el fundador reciba algo

| **Nota sobre la tabla** El programa de referidos es exclusivo para fundadores. Los fundadores parten de 3 videos (Expansion Basica). Los usuarios base parten de 2 videos. La tabla muestra los videos totales para cada caso. |
| --- |

| **Referidos activos** | **Videos — usuario base** | **Videos — fundador** |
| --- | --- | --- |
| 0 referidos | 2 videos | 3 videos (Expansion Basica) |
| 1 referido activo | 3 videos | 4 videos |
| 3 referidos activos | 5 videos | 6 videos |
| 5 referidos activos | 7 videos | 8 videos |
| 10 referidos activos | 12 videos | 13 videos |

Sin techo maximo — cada referido activo suma un video mas de forma permanente sobre la base correspondiente.

## **8.5 Metricas de Exito en los Primeros 30 Dias**

| **Métrica** | **¿Qué nos dice?** |
| --- | --- |
| % de usuarios que completan sus primeros 10 intercambios | Si el esfuerzo requerido es razonable |
| Tiempo promedio en completar un ciclo de 10 | Si la cola fluye bien |
| % que desbloquea la expansion via programa de referidos despues del primer ciclo | Si la gamificacion es suficiente motivacion para invitar creadores |
| % que abandona antes de completar el primer ciclo | Dónde está la fricción principal |
| Score de reputación promedio de la comunidad | Si la calidad de intercambios es aceptable |

# **9. Canal de YouTube Vinculado**

## **9.1 La Regla**

Cada cuenta de Comentalo tiene un canal de YouTube vinculado de forma permanente. El canal es la identidad del usuario dentro de la plataforma y no puede cambiarse de forma autónoma.

| **Mensaje que ve el usuario en el registro** Tu canal de YouTube quedara vinculado permanentemente a tu cuenta de Comentalo. Si necesitas cambiarlo en el futuro, contacta a nuestro equipo de soporte. |
| --- |

## **9.2 Implicaciones de la Vinculacion Permanente**

### **Anti-fraude robusto**

Si el canal es permanente e irrepetible, es imposible crear multiples cuentas utiles. Una persona puede crear 10 emails distintos, pero no puede crear 10 canales de YouTube con historial real. El canal queda como identidad permanente del usuario.

### **La reputacion esta atada al canal**

El historial de intercambios, la reputacion, los videos activos y el badge de Fundador — todo esta vinculado al canal para siempre. Eso genera responsabilidad real. Nadie va a arriesgar su canal de YouTube por hacer trampa en Comentalo.

### **El bane es efectivo**

Si alguien hace trampa y es baneado — el canal queda baneado. No puede crear una cuenta nueva con el mismo canal. Eso hace el bane mucho mas efectivo que en otras plataformas donde basta con cambiar el email.

### **Verificacion obligatoria al registrarse**

Como el canal es la identidad permanente, la verificacion al registrarse es critica. Comentalo utiliza un sistema de verificacion por codigo en la descripcion del canal — ver seccion 9.5 para el flujo completo. Esto confirma que el usuario tiene acceso real al canal sin necesidad de permisos especiales de YouTube.

## **9.3 Proceso de Cambio de Canal**

Si el usuario necesita cambiar su canal vinculado — no puede hacerlo solo. El proceso es:

- Paso 1 — El usuario contacta al equipo de Comentalo via soporte

- Paso 2 — Explica el motivo del cambio (canal suspendido, cambio de proyecto, error al registrarse)

- Paso 3 — El equipo verifica manualmente que el nuevo canal le pertenece

- Paso 4 — El equipo realiza el cambio internamente

- Paso 5 — Todo el historial, reputacion y videos activos se transfieren al nuevo canal

## **9.4 Por que el Proceso es Manual**

En V1 con pocos usuarios estos casos van a ser rarisimos. No justifica construir un sistema automatico. El proceso manual ademas hace que el fraude no valga la pena — nadie va a contactar soporte, inventar una historia y esperar 48 horas solo para hacer trampa.

| **Situacion** | **Lo que pasa** |
| --- | --- |
| Canal abandonado voluntariamente | El usuario empieza de cero con el nuevo canal via soporte |
| Canal suspendido por YouTube | Soporte verifica y transfiere el historial al nuevo canal |
| Error al vincularlo al registrarse | Soporte corrige el canal vinculado |
| Intento de fraude con canal ajeno | Bloqueado — verificacion por codigo en descripcion del canal (seccion 9.5) |
| Canal baneado en Comentalo | No se puede re-registrar con ese canal nunca |

## **9.5 Verificacion de Propiedad del Canal**

El login con Google solo pide el scope basico de perfil (email, nombre y foto). No se pide acceso al canal de YouTube. Esto elimina la desconfianza que genera pedir permisos especiales durante el registro.

La verificacion de propiedad del canal se realiza mediante un codigo unico en la descripcion del canal:

### **Flujo completo de verificacion**

Paso 1 — El usuario inicia sesion con Google. Comentalo solo pide email y perfil basico.

Paso 2 — El usuario ingresa el link de su canal de YouTube manualmente en la pagina de verificacion.

Paso 3 — Comentalo consulta la API publica de YouTube para verificar que el canal cumple los requisitos minimos de la seccion 4B (antiguedad, videos, suscriptores, canal publico).

Paso 4 — Si el canal cumple los requisitos, Comentalo genera un codigo unico tipo COMENTALO-XXXX y se lo muestra al usuario.

Paso 5 — El usuario va a YouTube Studio, abre Personalizacion → Informacion basica, y pega el codigo en la descripcion de su canal.

Paso 6 — El usuario regresa a Comentalo y presiona el boton "Ya lo pegue".

Paso 7 — Comentalo consulta la API publica de YouTube y busca el codigo en la descripcion del canal. Si lo encuentra → registro completo. Si no lo encuentra → el usuario puede reintentar.

Paso 8 — Despues de verificar, el usuario puede borrar el codigo de la descripcion de su canal.

| **Por que este metodo y no login con Google + scope de YouTube** Este metodo no requiere ningun permiso especial sobre el canal del usuario. El login con Google solo pide email y perfil. La verificacion es 100% via API publica. Esto elimina la pantalla de permisos de YouTube que genera desconfianza — el usuario nunca siente que Comentalo tiene acceso a su canal. |
| --- |

### **Seguridad del sistema de codigos**

- Cada codigo es unico y esta vinculado a un usuario especifico
- Los codigos expiran en 24 horas
- Solo un codigo activo por usuario a la vez
- El codigo solo se puede verificar por el usuario que lo genero

# **10. Temas Pendientes por Definir**

## **10.1 Registro y Acceso**

✅ Resuelto en seccion 4B — Requisitos minimos del canal: 3 meses de antiguedad, 1 video publicado, 20 suscriptores, canal publico. Login con Google con scope basico definido en seccion 9.5. Verificacion de propiedad por codigo en descripcion del canal.

## **10.2 Mecanica de la Cola**

Resuelto en seccion 5B — Matching automatico, cola general sin filtros en V1, una vez por video, sin limite diario global.

## **10.3 Proteccion Anti-Fraude**

Resuelto en seccion 4C — Sistema de acumulacion en ciclos de 10, sin requisito de vistas para el video, intercambio verificado es permanente. Ver tambien secciones 4B, 6C y 6D para reglas completas.

## **10.4 Precios y Monedas — Backlog V2**

Movido al Backlog V2. No es un pendiente del MVP. La beta V1 es 100% gratuita sin pasarela de pagos. Estos temas se definen cuando la plataforma tenga masa critica y datos reales de comportamiento de usuario:

- Monedas por pais — COP, MXN, USD

- Metodos de pago por pais — MercadoPago, Nequi, transferencias

- Plan anual con descuento

- Politica de reembolsos

## **10.5 Nombres de las Expansiones y Precios — Backlog V2.0**

Movido al Backlog V2. No es un pendiente del MVP. Se define en Fase 2 basado en validacion con usuarios reales:

- Nombres de cada nivel de expansion

- Precios basados en datos reales de la beta

- Precio por intercambio para el creador colaborador

## **10.6 Pantallas y Flujos de la App**

- Onboarding y registro

- Dashboard del creador

- Cola de intercambios disponibles

- Flujo de creación de intercambio

- Perfil y reputación

## **10.7 Panel Administrativo — Backlog post-diseño**

Panel de administración interno para el equipo de Comentalo. Incluye: gestión de usuarios y baneos, monitoreo de intercambios pendientes de revisión manual (sección 6C.5), gestión de disputas (sección 6.4), monitoreo de cuota de API de YouTube, y vista general de campañas activas. Se construye después de completar el rediseño de todas las vistas.

## **10.8 Masa Crítica — Creadores Aliados**

Para el lanzamiento se reclutarán 10 creadores aliados que autoricen el uso de sus videos en la plataforma como seed data. Estos videos estarán disponibles en la cola desde el día uno para que los primeros fundadores puedan hacer intercambios inmediatamente sin encontrar la cola vacía.

## **10.9 Vista de Perfil — Pendiente de construcción**

Vista /perfil o /dashboard/perfil que muestra: card con avatar del canal, nombre, suscriptores, país y fecha de registro, nivel de reputación (Verde/Amarillo/Naranja/Rojo). 4 stats: intercambios este mes, promedio de estrellas (4.2★), porcentaje de calificación positiva y campañas completadas. Lista de videos registrados con thumbnail, título, progreso de intercambios, vistas y badge de estado (Activo/Suspendido). Botón "+ Registrar otro video" que navega a /dashboard/registrar-video. Nav horizontal con Cola / Mis intercambios / Perfil que reemplaza la navegación actual del dashboard.

## **10.10 Revisar flujo de verificación de canal — Pendiente**

El prototipo de Design muestra verificación por link del canal. El flujo actual en producción (v1.7) usa código en la descripción (COMENTALO-XXXX). Evaluar si simplificar a verificación por link directo es más amigable para el usuario antes del lanzamiento con fundadores.

## **10.11 Trigger de créditos al registrarse — Pendiente**

El trigger `trg_credito_inicial_campana` (migración `20260421160000`) otorga 1 crédito al crear la primera campaña. Con el modelo v4.7 ese trigger queda obsoleto — debe ser reemplazado por un trigger que otorgue 60 créditos al registrarse (sobre la tabla `usuarios` o vía auth hook). Migración pendiente: dropear el trigger actual y crear el nuevo.

comentalo.com — Documento Maestro V4.1 — Abril 2026