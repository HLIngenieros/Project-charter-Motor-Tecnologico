# Pantallas y flujos

Resultado de la tarea T1.3. Las maquetas están en [maquetas/](maquetas/) (abrir `index.html` con un servidor estático, por ejemplo `python -m http.server` dentro de la carpeta). Son HTML estático con un port mínimo del motor de cálculo ([maquetas/maqueta.js](maquetas/maqueta.js)): lo que se mueve recalcula de verdad.

Contexto de producto en [PRODUCT.md](../PRODUCT.md); contrato de dirección de la ficha en `.impeccable/surfaces/docs-maquetas-ficha-html.md`.

## Decisiones (2026-11-09)

| Tema | Decisión | Origen |
|---|---|---|
| Estructura de la ficha | **Documento vivo**: el charter se lee en el orden de la hoja ID & TI y cada sección se edita en su sitio. Se eligió entre tres estructuras (documento vivo, riel de secciones, fecha de corte al mando) | Usuario |
| Captura del cronograma | **Gantt interactivo**: arrastrar la barra mueve las fechas; sus extremos cambian inicio o fin; clic en la fila abre el detalle A–J en línea | Usuario |
| Registro de corte | **Solo lo que toca**: primero vencidas y en curso, con el % anterior al lado; el resto plegado | Usuario |
| Portafolio | Avance y semáforo, mini curva S y fecha del último corte | Usuario |
| Celular | Consultar y registrar corte; el cronograma se arma en escritorio | Usuario |

## Mapa de pantallas

```
Entrar / Registro  (ya construidas, Fase 2)
        │
   Mis charters ──► + Nuevo charter ──► Ficha (vacía)
        │
      Ficha ──► Registrar corte ──► Ficha · Avance y cortes
        └──► Imprimir A4
```

## 1. Mis charters (`portafolio.html`)

- **Banda institucional** con marca y usuario.
- **Cabecera:** «Mis charters» y el botón principal «+ Nuevo charter».
- **Filtros:** búsqueda por nombre o responsable, categoría y estado (incluye «Con vencidas» y «Sin cortes»). Contador «n de m charters».
- **Lista de columnas fijas** (no tarjetas): charter (nombre, categoría con su color, responsable) · avance (real de planeado, barra con marca del planeado) · mini curva S · estado (chip del semáforo y, debajo, las vencidas en vinotinto) · último corte (fecha y «hace n días»; en ámbar si pasan más de 21 días).
- **Estados:** sin charters (explica el primer paso y ofrece crear), sin resultados por filtro, charter sin cortes («Registra el primer corte»).
- **Admin:** misma lista con todos los charters y una columna de propietario; solo lectura (sin «Nuevo charter»).
- **Celular:** cada charter apilado (nombre, avance + estado, último corte); sin curva S.

## 2. Ficha del charter (`ficha.html`)

- **Banda de estado fija** (al hacer scroll): nombre, chip del proyecto, planeado, real, brecha, vencidas (enlace al cronograma), último corte, «Imprimir A4» y «Registrar corte». Las cifras se animan al recalcular.
- **Índice lateral** con contadores y la sección visible marcada; abajo, «Guardado hace un momento» (guardado automático).
- **Hoja** en el orden del Excel:
  1. Encabezado: nombre, ficha de 4 celdas (responsable, patrocinador, categoría, revisión).
  2. Razón de ser y objetivo general (columna izquierda) con los objetivos específicos a la derecha (lista numerada, «+ Agregar objetivo»).
  3. **Curva S** (ver abajo), a todo el ancho de la hoja.
  4. **Cronograma** (ver abajo).
  5. Supuestos y criterios de éxito.
  6. Indicadores: fórmula, meta y medición frente a la meta.
  7. Riesgos: riesgo, causa, mitigación.
  8. Presupuesto: rubros y total.
  9. Historial de cortes: tabla con fecha, estado, planeado, real y nota.
- Los textos se editan en su sitio (resaltado al pasar, borde de foco al editar).
- **Listas** (objetivos, supuestos, criterios): Enter al final crea un ítem debajo, Retroceso en uno vacío lo quita, Alt + ↑/↓ lo mueve; botones Subir, Bajar y Quitar al pasar o con foco (siempre visibles en pantallas táctiles). Un ítem que queda vacío desaparece al salir.
- **Estado del charter** (construido en la Fase 3): botón con el estado en la banda que abre un menú con Activo, Pausado, Cerrado, Cancelado y «Eliminar charter…». Cerrar o cancelar pide confirmación y deja la ficha en solo lectura con un aviso y «Reabrir». El Admin ve los charters ajenos con «Charter de {nombre} · solo lectura» y sin menú.

### Curva S protagonista

Pedido del usuario al aprobar (2026-11-09): más grande, dinámica, antes del cronograma y con el semáforo.

- Bloque a todo el ancho de la hoja, con fondo propio. Se dibuja al entrar (planeado, luego real, brecha y puntos de corte).
- **Lectura:** fecha, planeado, real, brecha, chip de estado (y vencidas) y fin al ritmo actual. Por defecto muestra el último corte; al pasar el puntero muestra la fecha bajo él (en un corte, sus datos; entre cortes, interpolado; después del corte, la proyección).
- **Semáforo:** cada punto de corte lleva el color de su estado (borde vinotinto si tenía vencidas); la brecha entre planeado y real se sombrea con el color del semáforo de cada tramo; una franja inferior resume el semáforo corte a corte.
- **Proyección al ritmo actual** (punteada): la línea base desplazada por el retraso en días; da el fin proyectado.
- **Zoom:** «Todo el proyecto» o «Cortes» (acerca la zona con datos). Las curvas se transforman al cambiar.
- Se recalcula y se transforma al mover una barra del Gantt.
- **Celular:** misma curva a 260 px de alto, lectura en dos filas.

### Cronograma como Gantt

- Columnas fijas: ítem · actividad (sangrada por nivel) · peso · estado · pista de tiempo. El estado recolorea la fila sin mover la grilla.
- **Agrupadoras:** negrita, barra resumen delgada con su avance, chip de estado o «n vencidas»; se pliegan y conservan la barra.
- **Hojas:** barra de línea base con el avance real pintado del color del semáforo.
- **Arrastre:** el centro mueve la barra; los extremos (5–7 px) cambian inicio o fin. Tooltip con fechas y duración. Al soltar se recalcula todo (fila, agrupadoras, banda de estado) y la fila destella.
- **Teclado:** con el foco en una barra, ← → mueven un día; Mayús + ← → cambian el fin.
- **Escala:** Trimestre, Semestre, Año. Línea de corte en azul acento.
- **Detalle en línea** (clic en la fila, sin modal): actividad, entregable, peso, inicio, fin y responsable (columnas A–J).
- «+ Agregar actividad»; Tab sangra la fila (la vuelve hija de la anterior) y Mayús + Tab la saca. Pegar desde el Excel queda para la Fase 3.
- **Celular:** solo actividad y pista, de consulta (sin arrastre).

## 3. Registrar corte (`corte.html`)

- Fecha de corte (por defecto hoy; no puede ser anterior al último corte) y referencia al corte anterior.
- **Vencidas:** fin pasado y sin 100 %. **En curso:** ya empezaron y no han terminado. **Resto plegado:** terminadas o por iniciar, con «Mostrar las n restantes».
- Cada fila: actividad, ítem, responsable, fin · % anterior · campo de % real con atajo «100 %» · chip de estado en vivo · barra de real con la marca de lo planeado a la fecha. Las filas cambiadas se tiñen.
- **Resumen a la derecha (fijo):** cómo queda el charter (chip, planeado, real, brecha), mini curva S con el nuevo punto, nota del corte, «Cancelar» y «Guardar corte».
- Al cambiar la fecha se reclasifican las listas.
- **Celular:** una columna; el resumen pasa a una barra fija abajo con real/planeado, estado y «Guardar corte».
- **Como quedó al construirlo (Fase 4):** la fecha no puede ir antes del día siguiente al último corte ni después de hoy; si ya hay corte hoy, la pantalla ofrece editarlo. Las listas se reclasifican al cambiar la fecha, no al escribir (una fila no salta al llegar a 100). **Editar** (`?fecha=`, desde el historial) usa la foto del corte: fecha fija, actividades borradas rotuladas «actividad eliminada» y «Antes» = el corte inmediatamente anterior. Si el % baja frente al anterior, la fila avisa. La mini curva S del resumen queda para la Fase 5.

## 4. Vista celular (`celular.html`)

Las tres pantallas a 390 px, navegables dentro de marcos de teléfono.

## Pendiente para la Fase 3

- Crear charter (flujo corto: nombre, categoría, razón de ser; el resto en la ficha).
- Pegar el cronograma desde el Excel sobre el Gantt.
- ~~Ver la foto de un corte anterior desde el historial~~ (hecho en la Fase 4: «Editar» abre su foto).
- Vista de Admin (todos los charters, solo lectura) y catálogos.
