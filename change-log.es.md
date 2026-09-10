# Changelog

[Português](change-log.md) | [English](change-log.en.md) | [Español](change-log.es.md) | [Deutsch](change-log.de.md) | [Français](change-log.fr.md) | [العربية](change-log.ar.md)

---

## [1.44.0] - 2026-09-10

### Añadido

- **Vincular una carrera al catálogo cuenta lo que ya corriste:** las ediciones que corriste con resultado verificado ya llegan al catálogo, y no solo las próximas.
- **Los resultados de cada edición en el catálogo:** al importar un resultado verificado, el enlace a la página de resultados de ese año queda en el catálogo, sin nada que te identifique (una búsqueda por tu nombre o tu fila de la tabla se quedan fuera).

### Cambiado

- **La zona horaria se elige de una lista:** por región y con la hora de cada una, en vez de escribir el nombre IANA a mano.

### Corregido

- **Después de decir cuál es la carrera, la caja desaparece:** antes seguía pidiendo lo mismo hasta recargar la página.

---

## [1.43.0] - 2026-09-10

### Añadido

- **La búsqueda por nombre acierta más:** usa todas las palabras que escribes y pone delante las que más coinciden, no las más próximas.
- **Proponer una carrera dice qué sigue:** el mensaje deja claro que no hace falta nada más, y quien mantiene el catálogo ve las propuestas en espera.
- **Panel del catálogo más rápido:** muestra las carreras que necesitan trabajo, cincuenta a la vez, en vez de descargar las cinco mil.
- **El país se elige de una lista:** con los nombres en tu idioma, en vez del código de dos letras.

---

## [1.42.0] - 2026-09-09

### Añadido

- **Buscar una carrera por nombre:** el campo de búsqueda busca en todo el catálogo, y no solo en las carreras que ya estaban en la página.
- **Decir cuál es la carrera:** vincula la carrera de tu evento al catálogo compartido, y las fechas y el precio de la próxima edición llegan rellenados.
- **Proponer una carrera que falta:** si la carrera que corres no está en el catálogo, puedes proponerla en la página del evento.

---

## [1.41.0] - 2026-09-09

### Añadido

- **Duplicados en el catálogo:** cada carrera de la cola de revisión lleva ahora el enlace a su fuente, para distinguir las dos en las páginas de origen.
- **La inscripción ya viene rellenada:** al planificar una carrera que el catálogo conoce, las fechas, los plazos y el precio aparecen rellenados, con la fuente a la vista. Mientras nadie haya verificado la entrada, quedan como sugerencia y la fecha no cuenta como confirmada.
- **Tu resultado oficial mejora el catálogo:** al importar un resultado verificado, le dices al catálogo qué día se corrió la carrera. Un año que no tenía entra de inmediato; corregir una fecha que ya tenía requiere que dos corredores coincidan. Viaja solo el día, nunca quién lo envió, y sigue sin disparar avisos.
- **Cuánto costó, para quien venga después:** al marcar una inscripción como hecha, el precio que pagaste queda en el catálogo. Ninguno de los calendarios que leemos publica precios, así que esto solo existe porque lo dicen los corredores. Cambiar un precio que el catálogo ya tiene requiere que dos corredores coincidan.

---

## [1.40.0] - 2026-09-09

### Añadido

- **Carreras cerca de ti:** la búsqueda gana un radio, de 10 a 250 km, contando desde tu ubicación o desde el pueblo que escribas.
- **Carreras repetidas:** cuando dos filas de la búsqueda son la misma carrera escrita de dos formas, puedes decírnoslo con un toque.

### Cambiado

- **Búsqueda por distancia:** las carreras cuyo calendario solo dice la distancia en la descripción ya entran en el filtro.

### Corregido

- **La misma carrera dos veces:** muchas menos repeticiones en la lista, cuando las fuentes escriben el pueblo, la fecha o el idioma de otra manera.

---

## [1.39.0] - 2026-09-04

### Cambiado

- **Encontrar carreras:** la página pide un filtro antes de mostrar la lista, gana búsqueda por país, y trae los resultados por partes en vez de descargar el catálogo entero al navegador.

---

## [1.38.0] - 2026-09-04

### Corregido

- **Carreras repetidas en el catálogo:** la misma carrera ya no entra dos veces cuando dos fuentes le dan nombres algo distintos, cuando una no publica la distancia, o cuando el nombre del pueblo cambia de sitio.

---

## [1.37.0] - 2026-09-04

### Añadido

- **Carreras en 60 países:** el descubrimiento puede leer un calendario mundial con 2280 carreras, en su mayoría de 5 y 10 km, y calendarios de media maratón de 17 países. Sigue apagado hasta que los actives.

---

## [1.36.0] - 2026-09-04

### Corregido

- **Actualización del catálogo:** una fuente leída solo en parte (por porciones, o cortada por el sitio) ya no se toma por averiada, lo que impedía su actualización.

---

## [1.35.0] - 2026-09-03

### Añadido

- **Más carreras cortas:** el descubrimiento puede leer dos calendarios alemanes llenos de 5 km, 10 km y medias maratones. Sigue apagado hasta que los actives.

### Cambiado

- **El catálogo se actualiza por partes:** el catálogo se actualiza cada día, una fuente por vez, y una fuente caída ya no retrasa a las demás.

### Corregido

- **Self-hosting:** el deploy de las funciones fallaba desde la última actualización de dependencias.

---

## [1.34.0] - 2026-09-03

### Añadido

- **Dos fuentes nuevas:** maratones en 55 países, y carreras alemanas con el precio de la inscripción. Sigue apagado hasta que las actives.

---

## [1.33.0] - 2026-09-03

### Añadido

- **La carretera de la temporada:** el hero muestra tu última carrera, la siguiente y la carrera objetivo, cada una con su cuenta atrás.

### Cambiado

- **Planificar es mover:** planificar una carrera de la bucket list la pasa al calendario y la saca de la lista.
- **Avisos de la temporada:** se quedan en la página de la carrera y ya no desaparecen al planificarla.

### Corregido

- **Distancias con decimales:** ya se puede guardar 42,195 km.
- **Carreras repetidas en el catálogo:** la misma carrera deja de aparecer dos veces con nombres distintos.

---

## [1.32.0] - 2026-09-02

### Añadido

- **Planificación de inscripciones:** la bucket list se agrupa por lo que falta hacer, y cada carrera puede llevar su inscripción: cuándo abre, cuándo cierra, el sorteo y el plazo para asegurar una plaza ya ganada. Con aviso antes de cada plazo.
- **La temporada alrededor de las carreras ancla:** marca las carreras que fijan tu año y la app sugiere dónde encaja una de preparación, avisa cuando algo cae en el afinamiento y muestra el tiempo previsto para el ancla.
- **Cuando falla:** una carrera que pasa sin resultado pregunta qué ocurrió en vez de decir que la perdiste, un abandono cuenta como carrera empezada, y un botón crea el intento de la próxima temporada.
- **Encontrar carreras:** una página nueva busca en el catálogo por mes, distancia y lugar, y añade una carrera a la lista en un clic. Incluye los parkruns cerca de ti.
- **Primeros pasos:** el dashboard de una cuenta nueva abre con cuatro pasos, cada uno explicando qué hace la app con eso. Desaparece al completarlos.

### Cambiado

- **Cuentas esperando aprobación:** el login se rechaza con el motivo, en vez de entrar en una app donde no se podía escribir nada.
- **Self-hosting:** dos fuentes nuevas para el catálogo, apagadas hasta que las actives. Ver [`docs/discovery-sources.md`](docs/discovery-sources.md).

---

## [1.31.0] - 2026-09-01

### Añadido

- **Más distancias:** 1500 m, 3000 m, 15K, 10 millas, 30K, 50K, 50 millas, 100K y 100 millas se suman a las cuatro originales. Las nuevas llegan desactivadas: activa las que corres en Ajustes, Disciplinas.
- **Catálogo de carreras:** la instancia ya conoce carreras por nombre, con la forma de inscripción y los plazos y el sorteo de cada edición. Es lo que avisará antes de que cierren las inscripciones.
- **Área de administración:** aprobar, bloquear y eliminar cuentas, y mantener el catálogo, dentro de la app en lugar de la consola.

### Cambiado

- **Elegir disciplinas es más compacto:** las 13 distancias ahora son pastillas agrupadas en pista, ruta y ultra.
- **Self-hosting:** el administrador pasa a ser un usuario marcado como tal, en vez de una variable de entorno. Ver [`docs/self-hosting.md`](docs/self-hosting.md).

---

## [1.30.0] - 2026-09-01

### Eliminado

- **Se eliminan el import y el export de Excel:** la copia completa en `.zip` cubre lo mismo con más precisión, incluidas fotos, vídeos, archivos de actividad y objetivos, y lo restaura todo con los mismos identificadores. La hoja de cálculo deja de ser una vía de entrada.

---

## [1.29.1] - 2026-08-31

### Cambiado

- **Distribución del esfuerzo más legible:** perder hasta 10 s/km en la segunda mitad ahora cuenta como ritmo constante, y el rojo queda para bajones por encima de 25 s/km. El gráfico aparece desde una carrera, en vez de exigir cinco.
- **Conteos en singular:** "1 vez aquí" en lugar de "1 veces aquí", en las frases que cuentan cuántas veces has corrido un recorrido.

---

## [1.29.0] - 2026-08-31

### Añadido

- **Marca a batir en las carreras que vienen:** al abrir una carrera futura en un recorrido que ya has hecho, ves tu mejor ritmo allí y el tiempo que da en esta distancia.
- **La marca a batir también en el inicio:** la tarjeta de la próxima carrera muestra el tiempo y el ritmo a batir cuando ya has hecho ese recorrido.

### Cambiado

- **Subir archivo solo después de la carrera:** la subida de GPX o TCX ya no aparece en carreras futuras, para que un entrenamiento en el recorrido no acabe archivado como la carrera.

---

## [1.28.0] - 2026-08-30

### Añadido

- **Distribución del esfuerzo:** la página de análisis muestra, carrera a carrera, cuánto bajaste el ritmo en la segunda mitad, y en cuántas carreras ocurre.
- **Comparación del mismo recorrido:** al abrir una carrera que ya has hecho antes, ves dónde queda entre todas tus veces, con la mejor y la anterior.

---

## [1.27.0] - 2026-08-30

### Añadido

- **Archivos de actividad en los eventos:** sube el GPX o TCX de tu reloj y la carrera gana parciales por kilómetro, el recorrido en el mapa, ritmo, altitud y pulsaciones. El tiempo medido se ofrece para rellenar el resultado, nunca se impone: el cronometraje oficial es el que cuenta.

---

## [1.26.1] - 2026-08-30

### Cambiado

- **Los documentos siguen el idioma de la app:** el changelog, el aviso de resultados y la política de privacidad pierden su selector propio, y en árabe se leen de derecha a izquierda.

---

## [1.26.0] - 2026-08-30

### Añadido

- **Elige las disciplinas que quieres ver:** en Ajustes > App puedes desactivar las distancias que no corres. Dejan de aparecer en los filtros y en los selectores. No se pierde nada de lo que ya tienes.

---

## [1.25.0] - 2026-08-30

### Cambiado

- **La página de Resultados pasa a ser la de Análisis:** responde a tres preguntas, con un selector arriba: cómo va esta temporada, cómo está frente a las anteriores y qué ha cambiado desde siempre. Los enlaces antiguos siguen funcionando.
- **Curva de forma:** cada carrera se convierte a su equivalente en tu distancia más corrida, así que un 5K y un maratón se comparan en la misma línea. Con previsión de tiempos para las otras distancias.
- **Nuevas lecturas:** posición en el pelotón a lo largo del tiempo, progresión de cada récord, km acumulados frente a temporadas anteriores, los meses fuertes y flojos del año, y una cuadrícula de constancia por carreras o por kilómetros.
- **Ritmo medio del año corregido:** ahora está ponderado por la distancia. Antes un 5K pesaba lo mismo que un maratón.

---

## [1.24.0] - 2026-08-29

### Cambiado

- **El resultado de una carrera se edita en la página del evento:** se acabó la página aparte. El tiempo, la posición y el enlace a los resultados oficiales están juntos, al lado de las cifras.

---

## [1.23.0] - 2026-08-29

### Cambiado

- **El catálogo de parkrun se actualiza solo:** las pruebas parkrun nuevas aparecen a los pocos días de abrir, sin esperar a una actualización de la aplicación.

---

## [1.22.0] - 2026-08-28

### Cambiado

- **El resto de la app con el aspecto de Inicio:** los objetivos se agrupan por estado, los filtros son iguales en todas las páginas, y la página de un evento lleva el nombre de la carrera como título.

---

## [1.21.0] - 2026-08-28

### Cambiado

- **Inicio rediseñado:** el próximo evento destacado con su cuenta atrás, las cifras del año en una única franja, ahora con los kilómetros recorridos, y un lugar propio para logros, objetivos pendientes y marcas personales.

---

## [1.20.0] - 2026-08-25

### Añadido

- **Nuevo idioma, Árabe (primera versión):** la app está ahora disponible en árabe, con diseño de derecha a izquierda. Selecciónalo en Ajustes → Idioma.

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

- **Estado de los eventos:** un evento con resultado oficial ya no puede quedar marcado como «Perdido».

---

## [1.16.0] - 2026-08-03

### Añadido

- **Copia con fotos y vídeos:** el `.zip` de la copia ahora incluye los archivos de fotos y vídeos, no solo sus metadatos. Puedes desactivar la opción antes de exportar; por encima de 300 MB la copia solo guarda los datos.
- **Restauración de fotos y vídeos:** con los archivos en el `.zip`, las fotos y vídeos vuelven incluso en el modo «sustituir todo» y al restaurar en otra cuenta. Antes solo se recuperaban si seguían en la cuenta.

---

## [1.15.1] - 2026-08-03

### Corregido

- **Seguridad:** una cuenta pendiente o rechazada ya no puede darse acceso total a sí misma.
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

- **Self-hosting:** puedes exigir aprobación manual de las cuentas nuevas: email al administrador para aprobar o rechazar, y aviso al usuario. Opcional. Ver [`docs/self-hosting.md`](docs/self-hosting.md).

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
