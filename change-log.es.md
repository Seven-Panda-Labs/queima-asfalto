# Changelog

[Português](change-log.md) | [English](change-log.en.md) | [Español](change-log.es.md) | [Deutsch](change-log.de.md) | [Français](change-log.fr.md) | [العربية](change-log.ar.md)

---

## [1.22.0] - 2026-08-28

### Cambiado

- **El resto de la app con el aspecto de Inicio:** los objetivos se agrupan por estado, con los cumplidos destacados, los filtros y los selectores de vista son iguales en todas las páginas, y la página de un evento encabeza con el nombre de la carrera y su resultado.

---

## [1.21.0] - 2026-08-28

### Cambiado

- **Inicio rediseñado:** el próximo evento destacado con su cuenta atrás, las cifras del año en una única franja, ahora con los kilómetros recorridos, y un lugar propio para logros, objetivos pendientes y marcas personales.

---

## [1.20.0] - 2026-08-25

### Añadido

- **Nuevo idioma, Árabe (primera versión):** la aplicación, las notas de versión, el aviso de resultados oficiales, la política de privacidad, los correos de cuenta y los recordatorios push ya están disponibles en árabe, con diseño de derecha a izquierda (RTL). Selecciónalo en Ajustes → Idioma.

---

## [1.19.0] - 2026-08-25

### Añadido

- **Nuevo idioma, Francés:** la aplicación, las notas de versión, el aviso de resultados oficiales, la política de privacidad, los correos de cuenta y los recordatorios push ya están disponibles en francés. Selecciónalo en Ajustes → Idioma.

---

## [1.18.0] - 2026-08-17

### Cambiado

- **Resultados oficiales:** búsqueda automática de resultados de Parkrun desactivada temporalmente: Parkrun bloquea las solicitudes automatizadas desde infraestructura en la nube conocida. El resultado se puede seguir registrando manualmente.

---

## [1.17.0] - 2026-08-13

### Añadido

- **Nuevo selector de emoji:** búsqueda y acceso a todos los emojis Unicode, en lugar de la lista curada anterior.

---

## [1.16.1] - 2026-08-13

### Añadido

- **Más emojis:** añadimos más de 50 opciones nuevas al selector de emoji de eventos y objetivos: animales, flores, comida, temática de Halloween y banderas de Asia, Sudamérica y el norte de África.

### Corregido

- **Estado de los eventos:** un evento con resultado oficial ya no puede quedar marcado como «Perdido». Existía una condición de carrera entre la transición automática a «Perdido» y el guardado del resultado. Si la transición automática ganaba la carrera, el estado quedaba mal aunque el resultado estuviera guardado.

---

## [1.16.0] - 2026-08-03

### Añadido

- **Copia con fotos y vídeos:** el `.zip` de la copia ahora incluye los archivos de fotos y vídeos, no solo sus metadatos. Puedes desactivar la opción antes de exportar; por encima de 300 MB la copia solo guarda los datos.
- **Restauración de fotos y vídeos:** con los archivos en el `.zip`, las fotos y vídeos vuelven incluso en el modo «sustituir todo» y al restaurar en otra cuenta. Antes solo se recuperaban si seguían en la cuenta.

---

## [1.15.1] - 2026-08-03

### Corregido

- **Seguridad:** las reglas de Firestore tratan ahora los campos de aprobación de cuenta como inmutables desde el cliente. Antes, una cuenta pendiente o rechazada podía borrar su propio `accountStatus` en una sola escritura y obtener acceso total.
- **Ajustes:** en instancias con la aprobación de cuentas activada, vuelve a guardarse el idioma, las preferencias de notificaciones y el perfil de resultados. Todas las escrituras se rechazaban una vez aprobada la cuenta.

---

## [1.15.0] - 2026-08-03

### Añadido

- **Copia de seguridad completa:** exporta todos tus datos en JSON dentro de un archivo `.zip` (eventos, objetivos, metas de rendimiento, bucket list, metadatos de fotos y vídeos, preferencias y compartidos).
- **Restaurar copia:** vuelve a subir un `.zip` de copia para recuperar tus datos, conservando los IDs originales. Puedes combinarlos con los datos actuales o sustituirlo todo.

---

## [1.14.2] - 2026-08-02

### Corregido

- **Resultados oficiales:** MikaTiming usa la columna de clasificación general correcta (varía por evento).
- **Resultados oficiales:** total de participantes MikaTiming sin filtro de sexo (cabecera de la lista).

---

## [1.14.1] - 2026-08-01

### Corregido

- **Resultados oficiales:** conector MikaTiming (búsqueda multi-disciplina y tiempos Netto); más memoria en la callable de lookup.

---

## [1.14.0] - 2026-07-30

### Añadido

- **Self-hosting:** aprobación manual de cuentas nuevas (opcional): pantallas pendiente/rechazado, email al administrador con enlaces aprobar/rechazar (Resend), notificación al usuario, reglas Firestore/Storage y funciones blocking Auth; ver `docs/configuration.md` y `docs/self-hosting.md`.

---

## [1.13.0] - 2026-07-23

### Añadido

- **Recuerdos:** visor a pantalla completa para fotos y vídeos, con navegación por flechas, teclado y deslizamiento en móvil.

---

## [1.12.1] - 2026-07-23

### Cambiado

- Varias mejoras de rendimiento y actualizaciones de seguridad.

---

## [1.12.0] - 2026-07-23

### Añadido

- **Idiomas:** soporte de español (es-ES) y alemán en la app: UI, emojis, recordatorios push, changelog, política de privacidad y aviso de resultados oficiales.
- **Ajustes:** selector de idioma con Português, English, Español y Deutsch.

### Cambiado

- Las claves de traducción faltantes usan inglés como respaldo; detección automática del navegador para `pt`, `en`, `es` y `de`.

---

## [1.11.0] - 2026-07-20

### Añadido

- **Privacidad:** enlace a la política de privacidad en el pie de la app.

### Corregido

- **Privacidad:** la página usa el mismo diseño, tema y navegación que el resto de la app.

### Cambiado

- El intervalo mínimo entre búsquedas de resultados oficiales se ha aumentado a **10 segundos**, con cuenta atrás en el botón.

---

## [1.10.0] - 2026-07-19

### Añadido

- **Parkrun:** creación dedicada de eventos con búsqueda en el catálogo global, favoritos y país en el autocompletado.
- **Parkrun:** favoritos en el perfil de resultados; los eventos elegidos se añaden a favoritos automáticamente.

### Corregido

- **Parkrun:** al cambiar la selección del autocompletado, se actualizan de nuevo la ubicación y el mapa.

### Cambiado

- **Parkrun:** importación de resultados más fiable, con el evento correcto guardado en el registro.

---

## [1.9.2] - 2026-07-19

### Añadido

- **Google Analytics** integrado en la app.

### Corregido

- **Parkrun:** fallo en la importación de resultados oficiales en algunos entornos.

### Cambiado

- El intervalo mínimo entre búsquedas de resultados oficiales se ha reducido a **5 segundos**, con cuenta atrás en el botón.

---

## [1.9.1] - 2026-07-19

### Corregido

- **MyRaceResult:** búsqueda en eventos con varias categorías (p. ej. Mittsommerlauf).

### Cambiado

- **MyRaceResult:** soporte para resultados incrustados en páginas de eventos y clasificación general por tiempo.

---

## [1.9.0] - 2026-07-09

### Añadido

- Conector **mika:timing** (Chicago Marathon, London Marathon, etc.).

### Cambiado

- Lista de plataformas compatibles en Ajustes ordenada alfabéticamente.

---

## [1.8.0] - 2026-07-09

### Añadido

- Conector **Tímataka** (timataka.net / timataka.is).

---

## [1.7.0] - 2026-07-09

### Añadido

- **Notificaciones push** con recordatorios incluso cuando la app está cerrada.

### Cambiado

- Ajustes de notificaciones actualizados; idioma de la app usado para mensajes remotos.

---

## [1.6.0] - 2026-07-08

### Añadido

- Conector **Wiclax** (resultados de carreras en directo).

---

## [1.5.1] - 2026-07-08

### Añadido

- Página **Novedades** (`/novidades`) con historial de versiones; enlace desde la versión en el pie.
- Crédito de **Seven Panda Labs** en el pie.

---

## [1.5.0] - 2026-07-08

### Añadido

- Conector **VCRunning** (Valencia Ciudad del Running).
- Changelog versionado en portugués e inglés.

---

## [1.4.0] - 2026-07-08

### Añadido

- Mejoras de UX para eventos **Parkrun**: configuración del ID de Parkrunner y formulario simplificado.

---

## [1.3.2] - 2026-07-07

### Añadido

- Más mensajes de carga con la voz de la marca.

---

## [1.3.1] - 2026-07-07

### Añadido

- Voz de la marca en estados vacíos, carga y mensajes de éxito.
- Documentación de voz en [docs/voice.md](docs/voice.md).

### Corregido

- Desempate de récords personales por tiempo cuando el ritmo y la distancia coinciden.

---

## [1.3.0] - 2026-07-06

### Cambiado

- Ajustes reorganizados; el uso compartido se ha movido a Ajustes.

---

## [1.2.0] - 2026-07-06

### Añadido

- Resultados compartidos en la página de Resultados, con separadores por amigo.

### Corregido

- Fechas en datos compartidos recibidos de amigos.

---

## [1.1.0] - 2026-07-06

### Añadido

- Vistas compartidas en las secciones de Eventos y Objetivos.

---

## [1.0.2] - 2026-07-06

### Corregido

- Email del propietario visible en invitaciones de uso compartido recibidas.

---

## [1.0.1] - 2026-07-06

### Añadido

- Edición de permisos de uso compartido y aviso de invitación pendiente.

---

## [1.0.0] - 2026-07-06

Hito: uso compartido de datos entre amigos.

### Añadido

- Compartir eventos, objetivos y resultados con invitaciones por email.
- Permisos configurables por área (eventos, objetivos, resultados, metas de rendimiento).

---

## [0.22.0] - 2026-07-06

### Añadido

- Base para compartir con amigos.

---

## [0.21.0] - 2026-07-06

### Añadido

- Modo oscuro con preferencia del sistema.

---

## [0.20.0] - 2026-07-05

### Añadido

- Conector **Ultimate Sport Service**.

---

## [0.19.1] - 2026-07-05

### Corregido

- **RunCzech:** tiempo chip en lugar de tiempo de salida.

---

## [0.19.0] - 2026-07-05

### Añadido

- Conector **RunCzech**.

---

## [0.18.1] - 2026-07-05

### Corregido

- **NSF Berlin:** tablas con columnas variables.

---

## [0.18.0] - 2026-07-05

### Añadido

- Conector **NSF Berlin**.

---

## [0.17.2] - 2026-07-05

### Corregido

- **ZielZeit:** tiempo neto en lugar de tiempo bruto.

---

## [0.17.1] - 2026-07-05

### Corregido

- **EQ Timing:** posición general basada en finalistas de la etapa.

---

## [0.17.0] - 2026-07-05

### Añadido

- Conector **EQ Timing**.

---

## [0.16.0] - 2026-07-05

### Añadido

- Conector **ZielZeit**.

---

## [0.15.0] - 2026-07-05

### Añadido

- Conector **Strassenlauf.org**.

---

## [0.14.1] - 2026-07-05

### Corregido

- **MyRacePartner:** búsqueda más robusta.

---

## [0.14.0] - 2026-07-05

### Añadido

- Conector **MyRacePartner**.

---

## [0.13.1] - 2026-07-05

### Corregido

- **MaxFunSports:** recuento de finalistas en URLs incrustadas.

---

## [0.13.0] - 2026-07-05

### Añadido

- Conector **MaxFunSports**.

---

## [0.12.2] - 2026-07-05

### Corregido

- **SCC Events:** competición SCC Läufer incluida en la búsqueda.

---

## [0.12.1] - 2026-07-05

### Corregido

- **SCC Events:** detección de URL más amplia.

---

## [0.12.0] - 2026-07-05

### Añadido

- Conector **SCC Events**.

---

## [0.11.1] - 2026-07-05

### Corregido

- **MyRaceResult:** búsqueda en categorías excluidas de la lista principal.

---

## [0.11.0] - 2026-07-05

### Añadido

- Conector **MyRaceResult**.

### Corregido

- **Parkrun**, **Davengo** y **Sporthive:** varias mejoras en la importación de resultados.

---

## [0.9.0] - 2026-07-04

Hito: resultados oficiales automáticos.

### Añadido

- Importación de resultados oficiales para **Sporthive**, **Davengo** y **Parkrun**.
- Icono de resultados verificados en las listas.
- Recuento de finalistas para Parkrun y Davengo.

### Corregido

- Análisis de la tabla de resultados de Parkrun.

---

## [0.8.0] - 2026-07-04

### Corregido

- El mapa ya no se superpone a los diálogos.

### Cambiado

- Orden de los elementos de navegación principal.

---

## [0.7.0] - 2026-07-04

### Añadido

- Mapa en la lista de deseos y en la página de Resultados.
- Más emojis disponibles.

---

## [0.6.2] - 2026-07-02

### Añadido

- Leyenda de estados en la vista de mapa.

---

## [0.6.1] - 2026-07-02

### Corregido

- Alertas de seguridad de dependencias.

---

## [0.6.0] - 2026-06-30

### Añadido

- Autocompletado de ubicación y mapa en la lista de deseos.

---

## [0.5.4] - 2026-06-30

### Añadido

- Vista previa del mapa en el formulario de evento.

---

## [0.5.3] - 2026-06-30

### Corregido

- Agrupación de marcadores en el mapa.

---

## [0.5.2] - 2026-06-30

### Corregido

- Búsqueda de ubicación redundante tras seleccionar una sugerencia.

---

## [0.5.1] - 2026-06-30

### Añadido

- Autocompletado de ubicación y geocodificación.
- Mapa en el detalle del evento.

---

## [0.5.0] - 2026-06-29

Hito: modo mapa.

### Añadido

- Coordenadas en eventos y vista **Lista | Mapa** en la página de Eventos.
- Panel para eventos sin ubicación definida.

---

## [0.4.3] - 2026-06-29

### Corregido

- Fotos y vídeos de eventos en producción.

---

## [0.4.2] - 2026-06-29

### Corregido

- Permisos de acceso a fotos y vídeos.

---

## [0.4.1] - 2026-06-29

### Corregido

- Carga de recuerdos (foto/vídeo).

---

## [0.4.0] - 2026-06-29

Hito: fotos y vídeos de eventos.

### Añadido

- Subida de fotos y vídeos en el detalle del evento (hasta 10 archivos; vídeo máx. 2 min).
- Galería de recuerdos por evento.

### Corregido

- La galería se actualiza inmediatamente tras la subida.

---

## [0.2.0] - 2026-06-28

Hito: internacionalización.

### Añadido

- Soporte para **pt-PT** y **en-GB**.
- Varias disciplinas por elemento de la lista de deseos.
- Vista de detalle del evento y recuperación a la lista de deseos.
- Estados Fallido, Superado y Destruido para metas de rendimiento.
- Días hasta el próximo evento en el Panel.
- Versión de la app en el pie.

### Cambiado

- Estado «Scheduled» renombrado a «Planned».
- Cerrar sesión movido a Ajustes.

### Corregido

- Contraste y filtros de estado; leyenda y tabla en Resultados.
- Aislamiento de datos por usuario.

---

## [0.1.0] - 2026-06-26

Hito: **MVP**, sustituto de hoja de cálculo Excel como PWA.

### Añadido

- App web con inicio de sesión con Google, datos en la nube y modo sin conexión.
- Gestión de eventos, resultados y objetivos anuales; panel con gráficos.
- Importación y exportación de Excel.
- **Lista de deseos**, calendario, metas de rendimiento y notificaciones locales.
- Ajustes, récords personales e instalación PWA.

### Corregido

- Inicio de sesión y sincronización sin conexión en varias pestañas.
