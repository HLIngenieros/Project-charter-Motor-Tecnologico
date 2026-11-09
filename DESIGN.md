---
name: Project Charters · Grupo HL
description: Charters de proyecto con cronograma y cortes de avance, con la identidad del Informe global de priorización.
colors:
  institucional: "#003366"
  institucional-2: "#0a3f73"
  tinta: "#0b1f33"
  texto: "#3b4b5e"
  texto-2: "#5b6c7e"
  texto-3: "#7c8ca1"
  linea: "#dce3ec"
  linea-2: "#e3e8ef"
  fondo: "#eef2f6"
  superficie: "#ffffff"
  acento: "#00a9e0"
  barra: "#c9d6e5"
  info: "#1f6fd1"
  info-suave: "#e6effb"
  neutro: "#7c8ca1"
  ok: "#15a06a"
  ok-suave: "#e3f4ec"
  ok-texto: "#0e6e48"
  amarillo: "#d9a400"
  amarillo-suave: "#fbf3d9"
  amarillo-texto: "#7a5c00"
  naranja: "#e07b1f"
  naranja-suave: "#fcebdc"
  naranja-texto: "#9a4a0a"
  alerta: "#c4513c"
  alerta-suave: "#f8e9e5"
  alerta-texto: "#a63f2c"
  vencida: "#7a1f2b"
  vencida-suave: "#f4e4e6"
typography:
  titular:
    fontFamily: "Sora Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  titulo:
    fontFamily: "Sora Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  titulo-sm:
    fontFamily: "Sora Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  cifra-grande:
    fontFamily: "Sora Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.25
    fontFeature: "tnum"
  cuerpo:
    fontFamily: "Plus Jakarta Sans Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  cuerpo-sm:
    fontFamily: "Plus Jakarta Sans Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  etiqueta:
    fontFamily: "Plus Jakarta Sans Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
  cifra:
    fontFamily: "JetBrains Mono Variable, ui-monospace, Cascadia Mono, monospace"
    fontSize: "0.78125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
rounded:
  barra: "4px"
  fino: "6px"
  control: "8px"
  sello: "10px"
  tarjeta: "12px"
  pildora: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
components:
  boton-primario:
    backgroundColor: "{colors.institucional}"
    textColor: "{colors.superficie}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  boton-primario-hover:
    backgroundColor: "{colors.institucional-2}"
  boton-primario-active:
    backgroundColor: "{colors.tinta}"
  boton-secundario:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  boton-fantasma:
    backgroundColor: "transparent"
    textColor: "{colors.institucional}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  boton-peligro:
    backgroundColor: "{colors.alerta}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  campo:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  tarjeta:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.tarjeta}"
    padding: "20px"
  dialogo:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.tarjeta}"
    padding: "24px"
    width: "448px"
  chip-al-dia:
    backgroundColor: "{colors.ok-suave}"
    textColor: "{colors.ok-texto}"
    rounded: "{rounded.pildora}"
    padding: "2px 10px"
  chip-en-atencion:
    backgroundColor: "{colors.amarillo-suave}"
    textColor: "{colors.amarillo-texto}"
    rounded: "{rounded.pildora}"
    padding: "2px 10px"
  chip-en-riesgo:
    backgroundColor: "{colors.naranja-suave}"
    textColor: "{colors.naranja-texto}"
    rounded: "{rounded.pildora}"
    padding: "2px 10px"
  chip-atrasada:
    backgroundColor: "{colors.alerta-suave}"
    textColor: "{colors.alerta-texto}"
    rounded: "{rounded.pildora}"
    padding: "2px 10px"
  chip-vencida:
    backgroundColor: "{colors.vencida-suave}"
    textColor: "{colors.vencida}"
    rounded: "{rounded.pildora}"
    padding: "2px 10px"
  chip-sin-estado:
    backgroundColor: "{colors.fondo}"
    textColor: "{colors.texto-2}"
    rounded: "{rounded.pildora}"
    padding: "2px 10px"
  pestana-activa:
    textColor: "{colors.institucional}"
    typography: "{typography.cuerpo-sm}"
    padding: "8px 12px 10px"
---

# Design System: Project Charters · Grupo HL

## Overview

**Creative North Star: "El charter A4 vivo"**

El sistema es el del *Informe global de priorización* llevado a pantalla: una banda institucional azul con retícula de plano arriba, un fondo gris azulado frío y hojas blancas con borde fino donde vive el contenido. Se lee como un documento técnico de ingeniería, no como un tablero: títulos en Sora, texto en Plus Jakarta Sans, cifras de tabla e ítems en JetBrains Mono, y todo el color fuerte reservado para decir el estado.

La densidad es de herramienta de oficina: texto base de 15 px, controles de 40 a 44 px, filas de 36 px en el Gantt y tablas con cifras tabulares alineadas a la derecha. La profundidad es mínima: bordes `linea` hacen la estructura y las sombras solo aparecen en lo que flota (diálogos, tooltips, barras arrastradas). El movimiento es corto, con salida suave, y desaparece con `prefers-reduced-motion`.

El semáforo (verde, amarillo, naranja, rojo y vinotinto para vencida) es el único sistema cromático expresivo. Cada estado tiene tres piezas: tono base para puntos y barras, fondo suave para chips y filas, y una variante de texto que cumple 4,5:1.

**Key Characteristics:**
- Banda institucional `#003366` con retícula de plano como único elemento decorativo.
- Hojas blancas con borde de 1 px y radio de 12 px sobre fondo `fondo`.
- Plano por defecto: borde en reposo, sombra solo en lo que flota.
- Semáforo de cinco estados con tono, fondo suave y texto accesible.
- Acento cian solo para lo medido, la selección y el foco.
- Cifras tabulares siempre; Sora para las grandes, mono para las de tabla.

## Colors

Una base fría de azules y grises tinta, con un azul institucional para la acción, un cian medido y un semáforo cálido que es el único color expresivo.

### Primary
- **Azul institucional** (`institucional`): banda superior, botón primario, pestaña activa, enlaces y la marca del corte planeado en las pistas de avance. Su variante **Azul institucional claro** (`institucional-2`) es el hover del primario.

### Secondary
- **Cian de corte** (`acento`): la línea de corte del Gantt, la serie «Real» de la curva S, el anillo de foco (`:focus-visible` de 2 px y `shadow-foco`), la selección de texto y la fila seleccionada. Para texto sobre `fondo` se usa un cian oscurecido (`#00759c`, aún sin token).

### Tertiary (semáforo)
- **Verde al día** (`ok`, `ok-suave`, `ok-texto`): al día y terminada; también el punto de «guardado».
- **Amarillo en atención** (`amarillo`, `amarillo-suave`, `amarillo-texto`): brecha de 10 a 25 puntos; también el aviso de «último corte viejo».
- **Naranja en riesgo** (`naranja`, `naranja-suave`, `naranja-texto`): brecha de 25 a 50 puntos.
- **Rojo atrasada** (`alerta`, `alerta-suave`, `alerta-texto`): brecha de 50 puntos o más, botón de peligro y errores de formulario.
- **Vinotinto vencida** (`vencida`, `vencida-suave`): pasó el fin sin el 100 %. El mismo tono sirve de texto (llega a 4,5:1 sobre su fondo suave y sobre blanco).
- **Azul informativo** (`info`, `info-suave`): solo avisos de tipo informativo, nunca estado del proyecto.

### Neutral
- **Tinta** (`tinta`): títulos, cifras, valores capturados, fondo del tooltip y del velo del diálogo (al 45 %).
- **Pizarra** (`texto`): texto corrido.
- **Pizarra media** (`texto-2`): etiquetas, encabezados de tabla, ayudas, metadatos.
- **Pizarra clara** (`texto-3` / `neutro`): solo elementos no esenciales (placeholders, puntos de «sin estado», borde hover de controles); no llega a 4,5:1 sobre el fondo.
- **Línea** (`linea`): bordes de hojas, tarjetas, controles y tablas. **Línea fina** (`linea-2`): separadores entre filas.
- **Fondo** (`fondo`): lienzo de la aplicación, cabeceras de tabla, chip «sin estado», pistas vacías.
- **Superficie** (`superficie`): hojas, tarjetas, campos, diálogos.
- **Barra de plan** (`barra`): barra de una hoja en el Gantt y avance «por iniciar»; el avance real se pinta encima con el color de su estado.

### Named Rules
**The Acento Medido Rule.** El cian `acento` marca lo que se midió en un corte, la selección y el foco. Nunca es decorativo ni de marca.

**The Three-Piece Semáforo Rule.** Todo estado usa sus tres piezas: tono base para puntos y barras, fondo suave para el chip o la fila, y la variante `-texto` para cualquier letra. Un tono base nunca se usa como color de texto.

**The Category Stays Quiet Rule.** El color de una categoría (catálogo editable, valor libre) solo aparece en el borde superior de 3 px de una tarjeta y en el chip de categoría. Nunca pinta barras, filas ni cifras, que son del semáforo.

## Typography

**Display Font:** Sora Variable (con Segoe UI, system-ui)
**Body Font:** Plus Jakarta Sans Variable (con Segoe UI, system-ui)
**Label/Mono Font:** JetBrains Mono Variable (con ui-monospace, Cascadia Mono)

**Character:** Sora da a los títulos y las cifras grandes la geometría del Informe global; Plus Jakarta Sans es cálida y legible en texto denso; JetBrains Mono alinea ítems, pesos y porcentajes de tabla.

### Hierarchy
- **Titular** (600, 24 a 28 px, 1.2, -0.015em): título de pantalla y nombre del charter (26 px; 22 px en celular).
- **Título** (600, 18 px, 1.2): encabezado de cada sección de la hoja.
- **Título pequeño** (600, 15 a 16 px): título de tarjeta y de grupo; nombre del charter en el portafolio (15,5 px).
- **Cifra grande** (Sora 600, 17 px, tabular): planeado, real y brecha en la banda de estado y en el resumen del corte.
- **Cuerpo** (400, 15 px, 1.55): texto corrido; máximo 70ch en lectura.
- **Cuerpo pequeño** (14 y 13 px): tablas, botones y campos de las maquetas, ayudas, notas de corte.
- **Etiqueta** (12 px, 400 a 600, en `texto-2`): rótulos de dato, cabeceras de tabla y de Gantt. En caja normal, sin tracking.
- **Cifra** (JetBrains Mono 500, 12,5 a 15 px, tabular, -0.01em): ítems (1.3.2), pesos, % de tabla y del portafolio.

### Named Rules
**The Cifra Rule.** Toda cifra es tabular. Las grandes (17 px o más, en bandas y resúmenes) van en Sora; la mono queda para tablas, ítems y códigos.

**The Sentence Case Rule.** Rótulos, cabeceras y botones van en caja de oración. No hay mayúsculas sostenidas ni tracking abierto en ningún rótulo.

## Layout

Contenedor centrado de 1360 px (ficha), 1280 px (portafolio) o 1180 px (corte), con margen lateral de 24 px que baja a 16 px en celular. El ritmo de espaciado es de 4 px (4, 8, 12, 16, 20, 24, 32, 40). La ficha usa una rejilla de índice de 216 px y hoja flexible con 32 px entre ambos; el corte, contenido y resumen fijo de 340 px. Dentro de la hoja las secciones se separan 32 px y las de dos columnas usan 40 px de calle.

La banda institucional mide 60 px (56 en celular). Bajo ella, en la ficha, una banda de estado blanca fija con los datos clave. Los quiebres de las maquetas están en 520, 760, 900/960, 1080 y 1180 px; en 960 px el índice pasa a una fila deslizable fija y la hoja pierde borde y radio para ocupar el ancho; en 760 px las filas de lista se apilan. El corte en celular pone la acción en una barra inferior fija con `safe-area-inset-bottom`. En la app, el marco de acceso usa una columna de 448 px y el quiebre `sm` de Tailwind (640 px).

La impresión A4 (margen 14 mm, 10,5 pt) quita bandas, índice y controles, y deja la hoja sin borde.

## Elevation & Depth

Sistema plano con bordes: la estructura la hacen `linea` y `linea-2`, y la jerarquía, el contraste entre `fondo` y `superficie`. Las sombras son tenues, teñidas de tinta, y se reservan para lo que se levanta del plano.

### Shadow Vocabulary
- **Sombra de diálogo** (`shadow-dialogo`): diálogos y la tarjeta de acceso que flota sobre la banda.
- **Sombra de realce** (`--sombra` de las maquetas): elemento elegido dentro de un grupo, como la entrada activa del índice o el botón presionado del segmento.
- **Sombra flotante** (`--sombra-flota` de las maquetas): barra del Gantt mientras se arrastra y tooltip de fechas.
- **Anillo de foco** (`shadow-foco`): foco de campos, junto al borde `acento`.

### Named Rules
**The Flat-By-Default Rule.** Hojas, tarjetas y tablas están planas en reposo, con borde de 1 px. Una sombra indica que algo flota, está elegido o se está arrastrando.

## Shapes

Esquinas suaves y consistentes: 8 px en controles (botones, campos, tabla del Gantt, ficha de encabezado), 12 px en hojas, tarjetas y diálogos, 10 px en el sello «HL», 6 px en piezas pequeñas (botones del segmento, tooltip, ficha de responsable, zona editable) y 4 px en las barras del Gantt. Chips y puntos de estado son píldoras y círculos. Las barras de avance son pistas de 6 a 8 px con el avance real encima y una marca vertical de 2 px para el planeado.

La retícula de plano (cuadrícula blanca al 6 % cada 96 px y al 3 % cada 24 px sobre `institucional`) es el único ornamento y solo vive en la banda superior.

**The Single Ornament Rule.** La retícula de plano es el único elemento decorativo y solo aparece sobre el azul institucional.

## Components

### Buttons
Sobrios y firmes: una sola acción primaria azul por zona.
- **Shape:** esquinas suaves (`rounded.control`), alto mínimo de 40 px, ícono SVG de 16 px con 8 px de separación.
- **Primary:** azul institucional con texto blanco, 600; hover `institucional-2`, activo `tinta`; deshabilitado al 60 %.
- **Hover / Focus:** transición de color de 150 ms; foco con contorno `acento` de 2 px y 2 px de separación. Cargando: el texto se oculta y aparece un giro de 16 px en `currentColor`, con `aria-busy`.
- **Secundario:** blanco con borde `linea`; en hover el borde pasa a `texto-3` y el fondo a `fondo` tenue.
- **Fantasma:** sin fondo, texto `institucional`, hover con velo institucional al 6 %. Para acciones de agregar y de impresión.
- **Peligro:** `alerta` con texto blanco.

### Chips
- **Style:** píldora de 12,5 px, 600, con punto de 7 px en el tono base del estado, fondo `-suave` y texto `-texto`.
- **State:** al día y terminada (verde), en atención (amarillo), en riesgo (naranja), atrasada (rojo), vencida (vinotinto); por iniciar, sin programar y sin cortes en `fondo` con texto `texto-2` y punto `texto-3`. El chip de categoría usa la misma forma con punto de 6 px y el color del catálogo.

### Cards / Containers
- **Corner Style:** `rounded.tarjeta`.
- **Background:** `superficie` sobre `fondo`.
- **Shadow Strategy:** ninguna en reposo (ver Elevation & Depth).
- **Border:** 1 px `linea`; con categoría, borde superior de 3 px en su color.
- **Internal Padding:** 20 px en tarjetas, 24 px en diálogos, 30/40 px en la hoja de la ficha (16 px en celular).

### Inputs / Fields
- **Style:** etiqueta encima en 14 px, 600, `tinta`; campo blanco con borde `linea`, radio `control`, alto mínimo 44 px y texto de 15 px; placeholder en `texto-3`.
- **Focus:** borde `acento` más anillo `shadow-foco`; hover con borde `texto-3`.
- **Error / Disabled:** borde `alerta` y mensaje en `alerta-texto` 14 px, enlazado con `aria-describedby`; la ayuda va en `texto-2`.
- **Edición en sitio:** el texto editable de la hoja muestra un fondo tenue y un subrayado interior de 1 px en hover, y un anillo `acento` de 2 px al enfocar.

### Navigation
- **Banda institucional:** sello «HL» blanco con texto institucional, «Grupo HL» en 11 a 12 px al 70 % y nombre de la plataforma en Sora 600; miga en blanco al 78 % con la página actual en blanco 600.
- **Pestañas:** texto 14 px 600 en `texto-2`, activa en `institucional` con una línea de 2 px que se desliza entre pestañas (resorte 500/40); flechas, Inicio y Fin mueven el foco.
- **Índice de la ficha:** entradas de 14 px en `texto-2` con contador en mono; la activa en blanco, `institucional`, 600 y sombra de realce. En celular pasa a una fila deslizable fija.
- **Segmento:** grupo sobre `fondo` con padding de 3 px; la opción presionada en blanco con sombra de realce.

### Tablas
- Envoltura con borde `linea` y radio `tarjeta`; cabecera en `fondo` con etiquetas 600 en `texto-2`; filas separadas por `linea-2` con hover tenue; columnas numéricas a la derecha, en mono y `tinta`. Estado vacío centrado en `texto-2`.

### Gantt del cronograma (signature)
- Columnas fijas (ítem, actividad, peso, pista) que no se mueven con el estado; la fila se tiñe con un fondo muy suave del semáforo. La barra de plan es `barra` con el avance real encima en el color del estado; las agregadoras llevan una barra resumen de 7 px en tinta. Asas de 3 px en `institucional` aparecen al pasar; al arrastrar, cursor de agarre, sombra flotante y tooltip `tinta` con las fechas. La línea de corte es un trazo `acento` de 2 px con su fecha en la cabecera.

### Avisos
- Borde del tono al 30 %, fondo `-suave`, 14 px 500 y un punto de 6 px en `currentColor`; `role="alert"` para alerta y `status` para info y ok.

### Movimiento
- Entrada de vista: opacidad y 8 px de subida en 320 ms con `ease-salida`; listas escalonadas cada 35 ms (hasta 12 elementos); diálogo en 200 ms con escala de 0,98; cambio de pantalla con fundido de 200/120 ms. Con movimiento reducido, ninguna variante anima.

## Do's and Don'ts

### Do:
- **Do** usar `institucional` para la acción primaria y `acento` solo para lo medido, la selección y el foco.
- **Do** escribir texto de estado con la variante `-texto` (`ok-texto`, `amarillo-texto`, `naranja-texto`, `alerta-texto`, `vencida`) para cumplir 4,5:1.
- **Do** separar con bordes `linea` de 1 px y dejar las hojas planas; usar `shadow-dialogo` solo en lo que flota.
- **Do** poner toda cifra en tabular: Sora para las grandes, JetBrains Mono para tablas, ítems y pesos.
- **Do** dibujar íconos como SVG en línea de 16 px, con trazo de 2 a 2,5 y `currentColor`.
- **Do** respetar `prefers-reduced-motion` con `useVariantes` y el bloque global de reducción.

### Don't:
- **Don't** usar `acento` como color decorativo o de marca.
- **Don't** usar el tono base de un estado (`amarillo`, `naranja`, `ok`) como color de texto.
- **Don't** dejar que el color de una categoría pinte barras, filas o cifras.
- **Don't** añadir ornamentos fuera de la retícula de plano de la banda institucional.
- **Don't** poner rótulos en mayúsculas sostenidas con tracking abierto, ni antetítulos sobre los títulos.
- **Don't** usar caracteres tipográficos (×, ✓, →) como íconos.
- **Don't** usar `texto-3` para texto esencial: no llega a 4,5:1 sobre el fondo.
