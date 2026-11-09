---
version: 1
slug: "docs-maquetas-ficha-html"
primary_target: "docs/maquetas/ficha.html"
related_targets: ["docs/maquetas/portafolio.html","docs/maquetas/corte.html","docs/maquetas/celular.html"]
---

# Ficha del charter (con portafolio, registro de corte y vista celular)

**Modo:** Operate. **Alcance:** maquetas T1.3 (HTML estático en `docs/maquetas/`) que luego guían las pantallas de la Fase 3.

**Audiencia y tarea:** líder de proyecto que arma su charter en escritorio y registra cortes periódicos; desde el celular consulta y registra cortes. Éxito: más rápido que el Excel.

**Decisiones del usuario (2026-11-09):** cronograma capturado como Gantt interactivo (arrastrar barras = fechas); registro de corte "solo lo que toca" (hojas en curso o vencidas primero, % anterior al lado, semáforo recalculando); portafolio con avance y semáforo, mini curva S y fecha del último corte.

## Direction contract

THESIS: La ficha se lee como el charter A4 del Informe global, en el orden de la hoja ID & TI, y cada sección se edita en su sitio. Rechaza el tablero de tarjetas KPI con pestañas que esconden el documento.

OWN-WORLD: Banda institucional #003366 con retícula de plano, fondo #EEF2F6, hoja blanca con bordes #DCE3EC y radio 12px; Sora en títulos y cifras grandes, Plus Jakarta Sans en texto, JetBrains Mono solo en ítems y cifras de tabla. Estado en chips de semáforo (verde, amarillo, naranja, rojo, vinotinto vencida); acento #00A9E0 para lo medido en cortes (línea de corte y serie «Real» de la curva S), selección y foco; nunca decorativo.

STORY: El líder entra, ve en la banda de estado si va bien (semáforo, planeado/real, vencidas, último corte), recorre el charter por el índice y ajusta el cronograma arrastrando barras; registra el corte desde la banda.

FIRST VIEWPORT: Banda institucional 60px con marca y miga; banda de estado blanca 72px fija (nombre, chip, planeado, real, brecha, vencidas, último corte, Imprimir A4 y Registrar corte a la derecha); índice de secciones 232px a la izquierda con contadores; al centro la hoja: encabezado en ficha de 4 celdas, razón de ser y objetivo general a dos columnas, y debajo arranca el Gantt con columnas fijas (ítem, actividad, peso, pista) y la línea de corte.

FORM: estructura 6 de 7 en mi lista (Documento A4 vivo), repartida como líder. seed:e6a025cd1dd0b9ac. Raise del tablero de salidas: columnas del Gantt fijas, el estado recolorea la fila sin mover la grilla. Kept del mapa de metro: agrupadoras plegadas conservan su barra resumen.

Imprimir A4 usa una hoja de impresión propia (sin bandas ni índice).

Signature interaction: arrastrar una barra del Gantt (o sus extremos) mueve inicio/fin con tooltip de fechas y recalcula planeado y semáforo al soltar.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
