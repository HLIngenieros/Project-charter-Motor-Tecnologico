# Video de presentación de Project Charter: diseño

**Fecha:** 2026-11-26 · **Estado:** entregado el 2026-11-26 (guion aprobado el mismo día)

## Resultado

- **Archivos:**
  - `project-charter-presentacion.mp4`: 40,7 s, 1920×1080, 30 fps, H.264 yuv420p y AAC, 11,5 MB.
  - `project-charter-presentacion-liviano.mp4`: para el sitio y la intranet, CRF 26 y `+faststart`, 3,8 MB.
  - `project-charter-poster.jpg`: fotograma del cronograma (16,3 s).
- **Cómo se rearma:** `bash construir.sh`. Las capturas de referencia se rehacen con `capturas.py` (levanta `servidor-demo.ts`, datos ficticios).
- **Revisión propia:** fotogramas de las 8 escenas y de cada transición contra el guion; títulos exactos, esquina de la insignia libre y golpes en los acentos de `proyecto/golpes.md`. Se corrigieron el título que se cortaba en el acercamiento del cronograma, las cifras apretadas del corte y el total del presupuesto, que aparecía en cero antes de contar.
- **Copia en la maqueta del sitio:** `media/project-charter.mp4` y `media/project-charter.jpg`. Línea que hay que agregar a la entrada de `PROJECTS`: `v: 'media/project-charter.mp4'`.

### Rondas de ajustes

| Fecha | Pedido | Qué cambió |
|---|---|---|
| 2026-11-26 | Las líneas de las gráficas aparecían de repente; entradas y salidas más suaves | Las curvas se dibujan como trazo con su longitud real (`getTotalLength`; con `pathLength="1"` el trazo no se animaba en el render) en la curva S, la ficha, el corte y el portafolio. Cada escena se cruza 0,3 s con la siguiente (la que entra va encima), con entradas de 0,8 a 0,9 s, recorridos más cortos y curvas `inOut` en barras, arrastre y línea de corte; los riesgos se posan en vez de caer. Final de 11,5 MB y liviano de 3,8 MB |

## Para qué es

Project Charter es la aplicación web donde cualquier área de Grupo HL crea el charter de su proyecto, lleva el cronograma y registra el avance real en cortes. El video es para la ficha del portafolio del sitio de ID&TI y debe coincidir con su entrada: «Aplicación web que reemplaza el Excel del Project Charter de TI: charter, cronograma, cortes, curva S y administración».

Ideas que deben quedar:
1. Reemplaza el Excel: el charter es una ficha viva en la web.
2. El cronograma se trabaja arrastrando y cada corte guarda una foto del avance real.
3. La curva S y el semáforo dicen al instante cómo va el proyecto, y el portafolio, cómo van todos.

## Restricciones

- **Formato:** 16:9, 1920×1080 y 30 fps, 40,7 s (19 compases), sin voz.
- **Motor:** HyperFrames (`npx -y hyperframes@0.9.16`). Por qué: lo que convence es ver la app en uso (arrastrar una barra, registrar un corte, la curva que se mueve).
- **Música:** «Technology Corporate» de PaulYudin (`musica/technology-corporate` de la skill), Pixabay Content License. Tramo de 12,964 a 53,678 s, con fundido de 1,5 s al final (otro tramo que el de Horas Hombre). La animación cae en los golpes de `node scripts/musica.mjs golpes technology-corporate 12.964 53.678`; fronteras y acentos en `proyecto/golpes.md`.
- **Identidad visual del proyecto** (origen: `apps/web/src/estilos/tokens.css` y `global.css`; copia en `proyecto/tokens.css`):
  - Fondo: `#eef2f6` con superficies blancas; apertura y cierre sobre la retícula azul institucional `#003366` del encabezado.
  - Marca y acento: institucional `#003366`, tinta `#0b1f33` y acento `#00a9e0` (lo medido en cortes y la serie Real). Semáforo: verde `#15a06a`, amarillo `#d9a400`, naranja `#de781c`, rojo `#c4513c` y vinotinto `#7a1f2b`.
  - Tipografía: Sora (títulos y cifras grandes), Plus Jakarta Sans (texto) y JetBrains Mono (tablas y códigos), en local en `proyecto/fuentes/` (copias de `@fontsource-variable`).
  - Logo: el proyecto no tiene; se usa el sello «HL» de su encabezado.
- **Marca común:** el logo de Grupo HL en la esquina inferior derecha sobre una placa blanca (la pone `entregar.sh`) y en el cierre.
- **Texto:** en español, máximo cuatro palabras por título y un subtítulo corto. Una acción visual por escena.
- **Pantallas:** réplicas vivas comparadas con `capturas/` (datos ficticios de `servidor-demo.ts`). Nunca datos reales ni de producción.
- **Sitio público:** nada de RF1, PC1 ni AC1, ni responsables o nombres reales. Presupuesto y riesgos se muestran porque son función del proyecto, con un charter inventado («Portal de Proveedores»), cifras redondas y riesgos genéricos.

## Guion

El boceto con los cuadros de estilo es `guion-grafico.html`, en esta carpeta.

| # | Tiempo | Título | Subtítulo | Acción | Puente a la siguiente |
|---|---|---|---|---|---|
| 1 | 0–4,3 s | Project Charter | Del Excel a una ficha viva | Sello HL, nombre y línea de acento sobre la retícula azul | La retícula se vuelve la cuadrícula de una hoja de cálculo |
| 2 | 4,3–8,6 s | Adiós al Excel | El charter, en la web | Las celdas se reordenan y forman la ficha con su banda de Planeado, Real y Brecha | La ficha baja al cronograma: las filas ya son barras |
| 3 | 8,6–17,1 s | Cronograma que se arrastra | Fechas encadenadas y pesos claros | Se arrastra el fin de una barra del Gantt y las de abajo se corren; aviso «Deshacer»; pesos al 100 % | Cae la línea de corte y la cámara entra a la actividad que cruza |
| 4 | 17,1–21,4 s | Cada corte, una foto | Registra solo lo que toca | En «Registrar corte» se escribe el % real; el resumen recalcula Real y Brecha | El punto del corte vuela a la curva |
| 5 | 21,4–27,9 s | La curva S, viva | Planeado contra real, corte a corte | Se dibuja el planeado, cae el corte, avanza el real, se sombrea la brecha y se pinta el semáforo | El semáforo se parte en las celdas de la matriz de riesgos |
| 6 | 27,9–32,1 s | Riesgos y presupuesto | Todo en la misma ficha | Los riesgos caen en la matriz; crecen las barras de rubros y el total cuenta hasta COP 50.000.000 | La ficha se encoge hasta ser una fila del portafolio |
| 7 | 32,1–36,4 s | Todo el portafolio | Semáforo por área y categoría | Filas del portafolio con su mini curva S; los semáforos por área se llenan | Las barras se juntan en la línea de acento |
| 8 | 36,4–40,7 s | Project Charter | Transformación Digital · Grupo HL | Nombre sobre la retícula; logo grande de Grupo HL con fundido en 38,6 s y quieto hasta el final | Fin |

## Fuera de alcance

- Voz y narración.
- Versión vertical.
- Pantalla de entrada, administración de cuentas, parametrización, compartir y exportación a PDF.
- Planos generados con IA.

## Lo que sería un fracaso aunque el video funcione

- Que no se entienda sin alguien que lo explique.
- Que muestre datos reales o algo que el sitio público no puede publicar.
- Que use colores, fuentes o pantallas que no sean los del proyecto.
- Que se sienta quieto, saturado de texto, o con cortes secos en lugar de transformaciones.
- Que la música vaya desfasada de los golpes visuales.
- Que no se vea de la misma familia que los otros videos del portafolio: duración, cierre y calidad.
- *(Propios de este proyecto:)* que parezca un tablero genérico de gestión de proyectos y no se vea lo propio: el corte como foto y la curva S con su brecha y semáforo.
