# Fase 6 · Indicadores, riesgos y presupuesto — Diseño

Fecha: 2026-11-12. Brainstorming con el usuario sobre maquetas (`.superpowers/brainstorm/`, ignorado). **Manda sobre T6.1–T6.3 del [plan maestro](../../plan-implementacion.md)**: reduce el alcance de los indicadores (sin mediciones) y agrega la matriz de riesgos y la gráfica del presupuesto. Lo aprobado antes (Fases 3–5, parametrización y exportación, [arquitectura.md](../../arquitectura.md), [DESIGN.md](../../../DESIGN.md)) sigue vigente.

## Intención

Completar la ficha con las tres secciones que faltan de la hoja ID & TI (filas 194–214 del Excel) para que el charter entero viva en el sistema y no en el Excel. El usuario pidió que riesgos y presupuesto se vean **en lista o tabla y además de forma visual**; los indicadores, por ahora, solo se definen.

**Éxito:** el líder carga los riesgos, los indicadores y el presupuesto de RF1 directamente en la ficha; de un vistazo ve qué riesgos están en zona roja y en qué se va el dinero; el PDF los trae igual que la ficha.

**Sería un fracaso aunque funcione:** que el total del presupuesto no cuadre con la suma de sus rubros o desgloses; que un punto de la matriz no corresponda con su fila; que estas secciones se editen distinto al resto de la ficha (otro tipo de guardado, botones «Guardar»).

## Alcance

| Sección     | Qué entra                                                                   | Qué no entra (por ahora)                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Indicadores | Definición: nombre, fórmula, meta (operador, valor, unidad) y observaciones | Mediciones por periodo, cumplimiento, semáforo y gráfica (quedan para después; la tabla `medicion` y `cumplimientoIndicador` del motor se conservan sin usar) |
| Riesgos     | Riesgo, causa, mitigación, probabilidad e impacto; nivel calculado; matriz  | Historial de calificaciones (solo cuenta la **vigente**, decisión del usuario), responsable, estado abierto/cerrado                                           |
| Presupuesto | Rubros en COP con desglose opcional; total; barras por rubro                | Ejecutado frente a planeado (decisión del usuario: «por ahora» solo lo planeado), vigencias por año                                                           |

Orden en la ficha, el índice, el PDF y el JSON: **Indicadores, Riesgos, Presupuesto**, entre «Supuestos y éxito» y «Cortes», como en la maqueta T1.3 aprobada (`docs/maquetas/ficha.html`). La ficha queda: encabezado · razón y objetivos · curva S · cronograma · supuestos y éxito · indicadores · riesgos · presupuesto · cortes. El PDF sigue el mismo orden.

## 1. Riesgos (opción A de las maquetas)

### Datos

- `riesgo` gana dos columnas: `probabilidad` e `impacto`, enteros de 1 a 5, **opcionales** _(call de Claude: un riesgo recién escrito aún no está calificado)_. Una sola migración nueva para esto y la meta opcional de los indicadores; revisar su SQL antes de commitear.
- Etiquetas de la escala _(call de Claude)_: 1 Muy baja/o · 2 Baja/o · 3 Media/o · 4 Alta/o · 5 Muy alta/o.
- **Nivel** = probabilidad × impacto, calculado (no se guarda), en una función pura del paquete `shared` _(call de Claude, rangos fijos, no parametrizables por ahora)_:

| Puntaje | Nivel   | Color (tokens de DESIGN.md)                      |
| ------- | ------- | ------------------------------------------------ |
| 1–4     | Bajo    | `ok` / `ok-suave` / `ok-texto`                   |
| 5–9     | Medio   | `amarillo` / `amarillo-suave` / `amarillo-texto` |
| 10–15   | Alto    | `naranja` / `naranja-suave` / `naranja-texto`    |
| 16–25   | Crítico | `alerta` / `alerta-suave` / `alerta-texto`       |

- Un riesgo sin probabilidad o sin impacto queda «Sin calificar»: chip neutro y fuera de la matriz.

### Pantalla

- Sección «Riesgos» a todo el ancho: **matriz a la izquierda, tabla a la derecha**.
- **Matriz** 5 × 5 en SVG propio (como la curva S): probabilidad en el eje vertical (5 arriba), impacto en el horizontal (5 a la derecha); cada casilla con el fondo suave de su nivel. Cada riesgo calificado es un punto con su número; si varios caen en la misma casilla, se acomodan dentro de ella sin taparse (con más de los que caben, un «+n»).
- **Tabla**: # · Riesgo · Causa · Mitigación · Probabilidad · Impacto · Nivel (chip «Alto · 12»). El # es la posición en la lista y es el mismo número del punto.
- **Enlace punto ↔ fila**: al pasar el mouse o enfocar un punto se resalta su fila, y al revés. Los puntos son enfocables con teclado y tienen nombre accesible («Riesgo 2: …, probabilidad 4, impacto 3, nivel alto»).
- **Edición en el sitio**, igual que las listas de la ficha: textos editables en la celda; probabilidad e impacto con un selector de 1 a 5; agregar, eliminar y reordenar (teclado y botones, como `ListaEditable`). El orden es manual _(call de Claude: el número debe ser estable mientras se edita; no se reordena solo por nivel)_.
- Debajo de la matriz, un resumen corto por nivel («1 crítico · 2 altos · 1 medio»).
- **Celular (≤ 640 px)** _(call de Claude)_: la matriz arriba a todo el ancho; la tabla pasa a tarjetas apiladas o a scroll horizontal, lo que mejor quepa sin estirar la página.
- Estado vacío: «Aún no hay riesgos» y el botón «Agregar riesgo»; la matriz vacía se muestra atenuada.

## 2. Presupuesto (opción B de las maquetas)

### Datos

- Se usan `rubro` (descripción, valor) y `rubro_detalle` (concepto, cantidad, valor unitario), ya en el esquema. Valores en pesos colombianos enteros (`bigint` modo número); la cantidad admite decimales.
- **Valor del rubro**: si tiene desglose, es la suma de `cantidad × valor unitario` de sus líneas, redondeada al peso, y no se escribe a mano; si no tiene, es el valor escrito _(confirmado por el usuario)_. El cálculo vive en una función pura de `shared` que usan la API, la web, el PDF y el JSON.
- Precisiones _(calls de Claude)_: el PUT **ignora** el `valor` de un rubro que llega con líneas y el servidor guarda el calculado (así la columna siempre cuadra). Al agregar la primera línea, el valor escrito se reemplaza por el calculado. Al borrar la última línea, el rubro conserva el último valor calculado y vuelve a ser editable. Valores y cantidades no negativos.
- **Total** = suma de los valores de los rubros.

### Pantalla

- Arriba, «Presupuesto total» y la cifra grande en Sora («COP 182.000.000», formato es-CO).
- Debajo, **una fila por rubro**: descripción · barra horizontal proporcional al **mayor rubro** · valor alineado a la derecha en cifras tabulares. Al pie, el total.
- Cada rubro puede **desplegar su desglose** (concepto, cantidad, valor unitario, subtotal) con un control propio; al agregar la primera línea, el valor del rubro pasa a ser calculado (se ve como cifra, no como campo).
- Edición en el sitio, agregar, eliminar y reordenar rubros y líneas, como en riesgos.
- Las barras usan `institucional` sobre pista `fondo`; animan su ancho al cambiar un valor (Motion, respetando `prefers-reduced-motion`).
- Estado vacío: «Aún no hay presupuesto» y «Agregar rubro».

## 3. Indicadores

- Tabla: # · Indicador · Fórmula · Meta · Observaciones. La meta se edita como operador (≥, ≤, =), valor y unidad, y se muestra junta: «≥ 90 %», «≤ 72 horas».
- Edición en el sitio, agregar, eliminar y reordenar, como en riesgos.
- Sin mediciones ni gráficas; no se muestra ninguna columna de cumplimiento.
- **Meta opcional** _(call de Claude)_: `meta_valor` pasa a admitir nulo (en la misma migración de riesgos). Sin valor, la meta se muestra «Sin meta» en gris, no «≥ 0»; los indicadores existentes no tienen datos que migrar.

## 4. Comunes

### API

- Una ruta por sección que **reemplaza la colección completa**, como `PUT /charters/:id/listas/:tipo`: `PUT /charters/:id/riesgos`, `PUT /charters/:id/indicadores`, `PUT /charters/:id/presupuesto` (rubros con sus líneas). Validación con Zod en `shared`, acceso con `cargarCharter(…, 'escritura')`, transacción y `actualizado_en` del charter, igual que `reemplazarLista`.
- **Ids estables generados por la web** (UUID v7, como las actividades del cronograma) _(call de Claude: así un indicador no pierde sus futuras mediciones al editarse —`medicion` cuelga de `indicador` con `ON DELETE CASCADE`— y la web no tiene que casar claves temporales con ids del servidor)_. El servidor acepta un id nuevo si no existe; si existe en **otro** charter, responde 400. Lo que no venga en el PUT se borra.
- **Concurrencia**: gana el último envío, como en las listas _(call de Claude: el charter tiene un solo dueño; no se agrega versión con 409)_.
- **Filas incompletas** _(call de Claude)_: los textos principales (riesgo, nombre del indicador, descripción del rubro, concepto de la línea) admiten cadena vacía; Zod no exige `min(1)`. Una fila **totalmente vacía** desaparece al salir de ella, como un ítem vacío de las listas. Una fila con datos y sin texto se guarda y se muestra con el texto de ayuda en gris («Sin descripción»).
- `GET /charters/:id` (`CharterDetalle`) trae `riesgos`, `indicadores` y `presupuesto` (rubros con sus líneas), ya ordenados.
- Límites de longitud y cantidad razonables en los esquemas (como las listas); el builder los fija.

### Ficha

- Las tres secciones entran en `secciones()` de `Ficha.tsx` y en el índice, con contador (riesgos e indicadores: cantidad; presupuesto: sin contador).
- Guardado automático por la **cola de la ficha** (`useColaGuardado`), **al salir de un campo o al cambiar un selector**, como las listas (no con debounce como el cronograma) _(call de Claude)_, y con el mismo manejo de 401/409; nada de botón «Guardar». Un campo no adopta el valor de la API mientras su propio envío va en camino (regla aprendida).
- **Solo lectura** si el charter está cerrado, si el usuario es Admin mirando un charter ajeno, o en un corte pasado (`?corte=`). En un corte pasado se muestran los valores **actuales** _(call de Claude: estas secciones no forman parte de la foto del corte; no se versionan)_.

### Exportación

- **PDF** (`pantallas/imprimir/`): las tres secciones en el mismo orden, con la matriz estática (sin interacción) al lado o encima de la tabla según quepa en 182 mm, y las barras del presupuesto. Ninguna fila ni la matriz se corta entre páginas (`break-inside: avoid`).
- **JSON**: el export ya trae el charter completo; se agregan las tres colecciones con el nivel y los valores calculados incluidos.

### Datos de RF1

- Al terminar, el líder carga en RF1 los riesgos, indicadores y presupuesto propuestos en la sesión del 2026-11-11 (la base local de PGlite arrancó vacía: primero hay que recargar RF1 desde el respaldo JSON en `Documents/Desarrollos/respaldo-projectcharter-2026-11-11/`).

## Pruebas

- `shared`: nivel de riesgo (bordes 4/5, 9/10, 15/16, sin calificar), valor de rubro con y sin desglose (redondeo), total.
- API: cada PUT (aislamiento por dueño, cerrado → 409, Admin → solo lectura, ids estables, id ajeno → 400, validación), detalle y export con las colecciones.
- Web: edición y guardado por la cola, enlace punto ↔ fila, desglose que vuelve calculado el valor, solo lectura, PDF con las secciones.
- Navegador: 1440 y 390 px (sin scroll horizontal de la página) y consola limpia.

## Queda al builder

- Componentes y nombres de archivos; si las tres secciones comparten un editor de tabla genérico o no.
- Distribución exacta de varios puntos en una casilla y tamaño de la matriz.
- Límites de los esquemas, debounce y textos de ayuda.
- Reparto de las tareas en sesiones equilibradas (preferencia del usuario).
