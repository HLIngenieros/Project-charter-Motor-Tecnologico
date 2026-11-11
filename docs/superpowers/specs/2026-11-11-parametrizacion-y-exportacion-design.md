# Parametrización del Admin y exportación de la ficha — Diseño

Fecha: 2026-11-11. Pedido del usuario en la sesión 2 de la Fase 5. Toca el plan maestro en T7 (Admin) y T8.1 (exportar a PDF). Manda sobre lo que diga el plan maestro de esas tareas; lo ya aprobado (Fases 3–5, [arquitectura.md](../../arquitectura.md), [DESIGN.md](../../../DESIGN.md)) sigue vigente.

## Intención

Dos pedidos que salen del mismo deseo: que el sistema reemplace de verdad al Excel.

1. **Parametrización.** Hoy las reglas de cálculo «de fondo» están fijas en el código. El Admin debe poder ajustarlas para toda la organización desde una pestaña propia, sobre todo las reglas de **pesos de las actividades** y las **fórmulas generales** (semáforo, reparto del planeado, proyección del fin, vencida).
2. **Exportación.** El líder necesita sacar del sistema **la ficha general de todo lo hecho en el proyecto, ordenadamente**: un PDF para archivar o anexar, en el orden de la ficha (opción A de las maquetas: documento completo, no hoja resumen). Además, un JSON con todos los datos.

**Éxito:** el Admin cambia una regla y los charters nuevos la usan sin tocar a los existentes; el líder imprime un PDF que podría anexar a un acta sin retocarlo.

**Sería un fracaso aunque funcione:** que cambiar una regla mueva las cifras de charters ya creados o de cortes registrados; que el PDF muestre cifras distintas de la ficha para la misma fecha; que el PDF se corte a mitad de una fila o de la curva.

## 1. Parametrización (Admin)

### Dónde vive

- Nueva área **`/admin`** con pestañas *(call de Claude: el área aún no existe; esta es su primera pestaña)*. Por ahora solo **«Parametrización»** (`/admin/parametros`); Cuentas, Catálogos y Charters (T7.1–T7.3) se suman después como pestañas hermanas.
- Acceso: enlace «Administración» en el menú de la cuenta, visible solo para Admin. La API responde 404 a quien no es Admin (como el resto del aislamiento).

### Qué se parametriza

Cada regla con su valor actual como **valor por defecto**, para que nada cambie si el Admin no toca nada:

| Regla | Opciones | Por defecto (= hoy) |
|---|---|---|
| **Suma de pesos** | `aviso`: si las hojas programadas no suman 100 %, solo se avisa · `obligatoria`: además, no se puede registrar un corte hasta que sumen 100 % (tolerancia 0,01 puntos) | `aviso` |
| **Hojas sin peso** | `fuera`: una hoja sin peso no entra en el cálculo · `repartir`: las hojas con fechas válidas y sin peso se reparten en partes iguales lo que falta para llegar al 100 % (si las demás ya suman 100 % o más, quedan en 0) | `fuera` |
| **Umbrales del semáforo** (puntos de brecha) | atención, riesgo, atraso; números de 0 a 100 con atención < riesgo < atraso | 10 / 25 / 50 |
| **Reparto del planeado** | `calendario`: lineal por días calendario entre inicio y fin · `habiles`: lineal por días hábiles (lunes a viernes; sin festivos) | `calendario` |
| **Proyección del fin** | `desviacion`: `max(t, fin − desv)` por hoja (§4.3 del análisis) · `ritmo`: `inicio + duración / SPI`, sin bajar de `t`; con SPI = 0 se usa `desviacion` | `desviacion` |
| **Vencida** | días de gracia (entero ≥ 0): una hoja está vencida si pasó `fin + gracia` sin llegar al 100 % | 0 |

- **Precisiones** *(calls de Claude tras la revisión)*:
  - *Hojas sin peso:* con `repartir` solo se reparte el peso **vacío**; un peso de 0 escrito a propósito sigue excluyendo la hoja. Hoy el motor trata vacío y 0 igual: hay que separarlos en el motor, la captura y la foto del corte (la foto guarda el peso efectivo, el repartido).
  - *Suma obligatoria:* la hace cumplir la **API** al crear y al editar un corte (409 `pesos_incompletos` con el mensaje «Los pesos de las actividades deben sumar 100 % para registrar un corte.»); Registrar corte la muestra antes de enviar y deshabilita «Guardar».
  - *Ritmo:* el SPI es **el de cada hoja**, como la regla de desviación; agrupadoras y proyecto toman el mayor fin de sus hojas, como hoy. Si la hoja aún no tiene SPI (planeado 0) o es 0, se usa `desviacion`. La proyección de la curva S ya termina en el fin del motor, así que sigue la regla sin cambios.
  - *Días hábiles:* la duración, el planeado, la desviación y el forecast se calculan en días hábiles; el fin proyectado se convierte de vuelta a fecha calendario. Una hoja sin ningún día hábil (p. ej. sábado a domingo) cuenta como de 1 día hábil: su planeado pasa de 0 a 100 % en el fin.
  - *Gracia:* se aplica a la hoja; agrupadoras y proyecto cuentan sus hojas vencidas como hoy, así que el efecto llega a la banda, al portafolio, al PDF y al historial.
  - *Otras vías de creación:* hoy solo existe el diálogo «Nuevo charter». Toda creación futura (p. ej. la semilla de T8.2) copia las reglas vigentes; la copia va en el servicio de creación.
- «Hoja programada», «agrupadora», el ponderado sobre hojas y el resto de §4 del [análisis](../../analisis-plantilla-excel.md) no cambian. Con `repartir`, el Gantt y el detalle muestran el peso calculado con la marca «auto».
- Con `habiles`, el planeado de un día no hábil es el del último día hábil; la duración sigue mostrándose en días calendario (la hoja ID & TI la usa así) *(call de Claude)*.
- La pantalla muestra cada regla con una frase de qué hace y un ejemplo corto, el botón «Guardar» y «Restablecer valores de fábrica». Debajo: «Modificado por Ana Pérez el 11 nov 2026».

### A quién afecta *(decisión del usuario)*

- **Solo a los charters creados después del cambio.** Al crear un charter se copian las reglas vigentes al charter, y desde ahí el charter calcula siempre con las suyas.
- Los charters existentes se quedan con lo que tenían: la migración les asigna las reglas por defecto (= el comportamiento de hoy). Sus umbrales actuales se respetan.
- Un corte registrado no cambia nunca (regla de la Fase 4 y 5).
- La pantalla lo dice: «Los cambios aplican a los charters que se creen desde ahora. Los charters existentes conservan sus reglas.»

### Coherencia

- Todas las cifras (banda, curva S, Gantt, detalle, Registrar corte, portafolio, PDF y JSON) salen del motor compartido con **las reglas del charter**. El motor recibe las reglas como un parámetro; sin él, usa los valores por defecto. El detalle del charter (`GET /charters/:id`) las trae, como hoy trae los umbrales.
- Los cortes guardan sus totales calculados con las reglas del charter al registrarlos.

### Fuera de alcance

- Editar las reglas de un charter puntual (ni el dueño ni el Admin). Si hace falta después, es otra tarea.
- Historial de cambios de las reglas (solo se muestra la última modificación).
- Festivos, otras curvas de reparto (S, frontal) o pesos de categorías y ejes para priorizar.

## 2. Exportación de la ficha

### Dónde

- Botón **«Exportar»** en la banda de la ficha, con un menú: **«PDF»** y **«JSON»**. Disponible para el dueño y para el Admin, también en solo lectura y en la vista de un corte pasado.
- **Se exporta lo que se está viendo:** en la vista actual, al último corte (recalculado en vivo, como la ficha); en un corte pasado, a esa fecha con la foto del corte. El nombre del archivo y el pie del PDF dicen la fecha del corte.

### PDF (opción A: documento completo)

- Se arma en el navegador: una vista de impresión **`/charters/:id/imprimir`** (con `?corte=` si aplica) que abre el diálogo de impresión, y el usuario elige «Guardar como PDF». Sin dependencias ni servicios en el servidor *(call de Claude)*. Debe verse bien en Chrome y Edge.
- A4 vertical, márgenes de 14 mm, identidad del Informe global ([DESIGN.md](../../../DESIGN.md)): institucional `#003366`, acento `#00A9E0`, Sora para títulos y cifras, Plus Jakarta Sans para texto.
- Contenido, en el orden de la ficha (y de la hoja ID & TI):
  1. **Encabezado:** código, nombre, estado, categoría, área, responsable, patrocinador, revisión; chip de estado del proyecto y cifras del corte (planeado, real, brecha, vencidas, fin proyectado).
  2. **Razón de ser.**
  3. **Objetivo general y objetivos específicos.**
  4. **Curva S:** la misma gráfica de la ficha, estática (sin animación ni lectura por puntero), a todo el ancho, con la planeada, la real, la brecha sombreada, los puntos de corte con su color, la proyección y la franja del semáforo. Zoom «Todo el proyecto».
  5. **Cronograma:** todas las filas desplegadas; columnas ítem, actividad (sangrada), peso, inicio, fin, estado, real % y una pista con la barra a la escala de todo el proyecto, la línea del corte y el fin proyectado. Las filas no se parten entre hojas; la cabecera de columnas se repite en cada hoja.
  6. **Supuestos y criterios de éxito.**
  7. **Historial de cortes:** fecha, estado, planeado, real, brecha y nota.
- Pie en cada hoja: nombre del charter · «Corte del 15 oct 2026» · «Generado el 11 nov 2026» · «Página n de m».
- Una sección no se parte si cabe en una hoja; la curva S nunca se parte.
- Las secciones de fases futuras (indicadores, riesgos, presupuesto) entran al PDF cuando existan en la ficha.
- Como hoy la ficha no tiene un estilo de impresión propio, «Imprimir» desde la ficha normal no es el camino; el camino es «Exportar → PDF».

### JSON

- Descarga directa de `charter-<código o nombre>-<fecha del corte>.json`, con formato legible (sangría de 2 espacios).
- Contiene todos los datos del charter, para respaldo o para otro sistema: `formato: "project-charter"`, `version: 1`, `generadoEn`, `corte` (la fecha exportada), el detalle del charter (encabezado, razón de ser, listas), las **reglas** del charter, el cronograma (actividades A–J y el cálculo de cada nodo a la fecha: pv, ev, desviación, forecast, estado) y **todos los cortes** con su resumen y su foto.
- Lo arma un endpoint de la API (`GET /charters/:id/exportar?corte=`) con `cargarCharter` en modo lectura *(call de Claude: así trae todas las fotos de una vez)*.
- **Solo exportación:** no hay importación *(call de Claude; el usuario no la pidió)*.

## Restricciones

- Todo lo de las Fases 3–5 sigue vigente: español de tú, formato `es-CO`, `{ error: { codigo, mensaje } }`, `cargarCharter` en toda ruta, Admin de solo lectura sobre charters ajenos, contraste del semáforo, movimiento reducido.
- Sin dependencias nuevas.
- Pruebas con cada tarea: motor (cada regla con su caso y los valores por defecto iguales a hoy, incluida la prueba de aceptación 12,51 % / 12,47 %), API (permisos de Admin, copia de reglas al crear, el cambio no toca charters existentes, exportar con aislamiento) y web.

## Lo que queda al constructor

- La firma exacta del motor con las reglas y el esquema Zod de las reglas.
- Cómo guardar las reglas: tabla de parámetros globales y una columna JSON (o columnas) en `charter`; la migración debe conservar los umbrales actuales de cada charter.
- El diseño visual de la pestaña de parametrización, dentro de DESIGN.md.
- Cómo lograr «Página n de m» y la cabecera repetida en Chrome y Edge.
