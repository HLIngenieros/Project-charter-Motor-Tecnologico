# Ajustes de cronograma, pesos, indicadores y riesgos — diseño

Fecha: 2026-11-18 · Estado: propuesto

## Por qué

Con los tres charters reales (RF1, PC1, AC1) en uso surgieron siete ajustes. Armar un cronograma hoy obliga a escribir cada fecha a mano, los pesos solo avisan cuando el total no da 100 % y no dicen dónde está el faltante, y la columna Estado ocupa el lugar de las fechas, que es lo que más se consulta. Los riesgos cargados tienen nombres cortos y poco dicientes.

## Metas

1. **Columnas Inicio y Fin en lugar de Estado.** Cada barra toma el color de su estado y arriba del Gantt hay una leyenda con los colores.
2. **Fechas encadenadas a la actividad de arriba.** Una actividad nueva empieza el día hábil siguiente al fin de la de arriba. Si cambia el fin de una actividad, las de abajo se corren lo mismo. Se puede adelantar a mano el inicio de una actividad.
3. **Riesgos de RF1, PC1 y AC1 redactados de nuevo:** nombre, causas y mitigación más claros y detallados.
4. **Pesos relativos por grupo** con alertas siempre visibles cuando falta o sobra, tanto por grupo como en el total.
5. **Resumen de pesos** del total y de cada grupo.
6. **Indicadores ordenados:** Meta numérica y angosta; Fórmula y Observaciones parejas.
7. **Duración en días hábiles:** se puede escribir la duración o las fechas y lo otro se calcula.

## No metas

- Predecesoras explícitas (elegir de cuál depende cada actividad). La predecesora es siempre la fila de arriba.
- Festivos de Colombia. Días hábiles = lunes a viernes, como ya los usa el motor.
- Deshacer general del cronograma. Solo se deshace el corrimiento en cadena.
- Recalcular los cortes ya registrados: sus fotos guardan el peso global de cada hoja y no cambian.

## Anti-metas

- Que el corrimiento en cadena mueva actividades sin que el usuario lo note.
- Que la conversión de pesos cambie el avance calculado de un charter existente.
- Perder datos de producción (Neon) en la conversión.

## Enfoques considerados

**Predecesora:** (a) la fila de arriba, sin cambios en la base, **elegido**; (b) vínculo explícito por actividad, descartado: más complejo de lo que se necesita.

**Corrimiento:**

- (A) correr todas las de abajo los mismos días hábiles, **elegido**;
- (B) encadenamiento estricto, descartado: no permite actividades en paralelo ni inicios adelantados;
- (C) igual que A pero con confirmación, descartado: interrumpe en cada arrastre.

**Pesos:**

- (A) relativos dentro de cada grupo, **elegido**: es la única forma de que un grupo tenga un «100 %» contra el cual alertar;
- (B) peso global con sumas informativas, descartado: no permite alertar por grupo.

## Diseño

### Pesos relativos (motor, `packages/shared`)

- El `peso` de toda actividad (hoja o agrupadora) es su parte **dentro de su padre**. Las del primer nivel se reparten el 100 % del proyecto. La columna `peso` ya existe para todas las filas, así que no cambia el esquema.
- **Peso global de una hoja** = producto de los pesos relativos desde la raíz. `pesosEfectivos` devuelve ese global, y el resto del motor (EV, PV, curva, cortes) sigue trabajando con pesos globales sin cambios.
- **Repartir el peso vacío** (regla `sinPeso: 'repartir'`) se aplica por grupo de hermanas: las que no tienen peso se reparten lo que les falta a sus hermanas para llegar a 100 %. Un 0 escrito sigue excluyendo. Aplica también a las agrupadoras sin peso.
- **Avisos.** `pesos_no_suman_100` queda para el primer nivel. Se agrega `pesos_grupo` por agrupadora (con `actividadId`): «Las subactividades de 1.2 suman 90 %; falta 10 %» o «sobra 5 %».
- **Suma obligatoria** = todos los niveles completos (`pesosCompletos`). Si falta en cualquier nivel, «Guardar corte» se deshabilita, como hoy.
- **El resultado de cada nodo trae su peso relativo y su peso global**, para mostrar ambos.

### Conversión de los charters existentes

Es una migración de datos (SQL en `drizzle/`, revisada a mano), que corre con `npm run migrar` en local y en el build de Vercel:

- agrupadora: peso = suma de los pesos globales de sus hojas descendientes;
- toda actividad: peso relativo = su peso global ÷ el peso global de su padre;
- una hoja con peso vacío sigue vacía;
- si un padre suma 0, sus hijas quedan como están.

El avance calculado no debe cambiar. Se prueba sobre una copia con RF1, PC1 y AC1 antes de publicar, comparando el avance antes y después.

### Cronograma: columnas y colores (web)

- **Columnas:** Ítem · Actividad · Peso · Inicio · Fin · Gantt. Inicio y Fin en formato corto («23 nov»). La columna Estado desaparece y el estado se sigue viendo en el fondo de la fila y en el color de la barra.
- **Barra de una hoja:** el tono suave del estado ocupa la barra completa, y el avance va en el tono fuerte del estado. «Por iniciar» y «Sin programar» van en neutro.
- **Leyenda** en la cabecera del cronograma, con un punto de color por estado: Al día, En atención, En riesgo, Atrasada, Vencida, Terminada y Por iniciar. El amarillo lleva borde `amarillo-texto`, igual que en la curva S.

### Pesos en la ficha (web)

- **Peso en la fila:** el relativo («40 %»). El global va en el título de la celda y en el detalle («40 % del grupo · 12 % del proyecto»).
- **Agrupadora:** peso relativo editable en el detalle (hoy no tiene campo de peso). Junto a su peso, una marca discreta con la suma de sus hijas cuando no da 100 % («suma 90 %», en ámbar si falta y en rojo si sobra).
- **Resumen de pesos** (meta 5), siempre visible sobre el Gantt: «Pesos: proyecto 100 % ✓ · 2 grupos incompletos». Los grupos incompletos son enlaces que abren esa fila. Reemplaza el `Aviso` actual de pesos.
- `RegistrarCorte`, la exportación y el PDF muestran el peso global de cada hoja, que es el que entra al cálculo.

### Fechas encadenadas y duración (operaciones puras + detalle)

- **Duración** = días hábiles entre inicio y fin, ambos incluidos (`diasHabiles`). En el detalle de la actividad, junto a Inicio y Fin, va el campo «Días hábiles»: al escribirlo se recalcula el fin (`sumarHabiles` desde el inicio) y al cambiar una fecha se recalculan los días. El tooltip de la barra también dice «días hábiles».
- **Actividad nueva:** inicio = primer día hábil después del fin de la fila de arriba con fin (en preorden: la última hoja programada antes de ella), y duración por defecto de 5 días hábiles. Sin fila programada arriba, queda sin fechas, como hoy.
- **Corrimiento en cadena:** cuando el fin de una hoja cambia de F a F′ (arrastrando la barra o el extremo final, editando el fin o editando los días), se calcula Δ = días hábiles con signo entre F y F′. Toda hoja con fechas que esté **debajo en preorden**, de cualquier grupo, mueve inicio y fin Δ días hábiles y conserva su duración.
  - Cambiar solo el inicio no corre nada. Esa es la excepción para adelantar una actividad.
  - Las agrupadoras no tienen fechas propias: siguen a sus hijas.
  - Una operación pura nueva, `correrDebajo(acts, id, delta)`, en `operaciones.ts`.
- **Aviso tras correr:** «Se corrieron 12 actividades 5 días hábiles · Deshacer». Deshacer restaura la lista anterior al cambio. Desaparece a los 8 s o con la siguiente edición.
- Mover una fecha a fin de semana: el fin arrastrado se acepta tal cual (no se ajusta), pero las corridas en cadena siempre caen en días hábiles.

### Indicadores (meta 6)

- La meta ya se guarda como número (operador, valor y unidad), así que solo cambia la presentación: un bloque angosto y compacto (operador, valor de ~5rem alineado a la derecha y unidad corta) que no le quita ancho a Fórmula y Observaciones.
- Fórmula y Observaciones van en columnas del mismo ancho, en campos que crecen con el texto, con la misma altura mínima y alineados arriba.

### Riesgos de RF1, PC1 y AC1 (meta 3)

- Reescribir el nombre (que diga qué puede pasar y su efecto, p. ej. «Retraso en la integración con el ERP por falta de acceso a su API»), las causas y la mitigación (acciones concretas, con responsable cuando se sepa).
- Primero se le muestra al usuario un documento con el antes y el después, y solo con su visto bueno se carga en Neon (y en local) por la API o con un script temporal con las validaciones Zod, con respaldo previo.

## Lo que queda al constructor

- La forma de la migración de datos (SQL recursivo o paso de `migrar` en TS), siempre que sea idempotente y quede probada sobre una copia.
- La distribución exacta de la leyenda y del resumen en celular (bajo 640 px las columnas Inicio y Fin se ocultan, como hoy Peso y Estado).
- El orden de las tareas: motor y conversión de pesos → cronograma → pesos en la web → indicadores → riesgos.
