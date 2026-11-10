# Fase 5 · Visualización — diseño

Fecha: 2026-11-10. Tareas T5.1–T5.5 de [plan-implementacion.md](../../plan-implementacion.md). Lo visual ya aprobado está en [pantallas.md](../../pantallas.md) y en las maquetas de `docs/maquetas/` (`ficha.html`, `curva.js`, `portafolio.html`, `corte.html`, `celular.html`); este documento solo agrega lo que falta y lo que cambia.

## Para qué

El líder de proyecto deja el Excel cuando la ficha le dice, sin cuentas, **cómo va el proyecto y cómo iba**. Las Fases 3 y 4 dejaron la captura (definición, cronograma, cortes); la Fase 5 convierte esos datos en lectura: la curva S protagonista, el semáforo en todas partes, la ficha vista en cualquier corte pasado y el portafolio con el avance de cada charter.

**Éxito:** abrir un charter y, en cinco segundos, saber si va atrasado, desde cuándo y qué frente lo arrastra; elegir un corte anterior y ver la ficha como estaba ese día.

## Alcance

**Entra**

1. **Curva S** en la ficha (T5.2), según «Curva S protagonista» de `pantallas.md`.
2. **Selector de corte** y **modo histórico** de la ficha (T5.1).
3. **Gantt** completado (T5.3): marca de fin proyectado, plegado por grupos, rendimiento con 170 filas y el modo histórico.
4. **Semáforo** (T5.4): tonos finales con prueba de contraste y umbrales del charter en la ficha.
5. **Portafolio con avance** (T5.5), según `pantallas.md` §1.
6. **Mini curva S** en el resumen de Registrar corte (quedó pendiente de la Fase 4).
7. Dos arreglos menores vistos al cerrar la Fase 4: la etiqueta del corte se monta sobre la del mes en el Gantt, y el aviso «Corte guardado» reaparece al recargar.

**No entra**

- Bloque aparte de «avance por grupo» (decisión del usuario: basta con las agrupadoras del Gantt; ver §4).
- Indicadores, riesgos, presupuesto (Fase 6), vista de Admin y columna de propietario en el portafolio (Fase 7), impresión A4 (Fase 8).
- Historial de los textos de la ficha: los cortes no guardan foto de la definición.

**Sería un fracaso aunque funcione:** que la curva y el Gantt den números distintos de la banda para la misma fecha; que el modo histórico deje editar algo; que la ficha se sienta lenta con 170 actividades.

## 1. Curva S (T5.2)

Se construye tal como la describe `pantallas.md` («Curva S protagonista») y la maqueta `curva.js`: bloque a todo el ancho entre la razón de ser y el cronograma; planeado (semanal, `curvaSPlaneada`) y real (por cortes); brecha sombreada por tramo con el color del semáforo; puntos de corte con su color (borde vinotinto si tenía vencidas); franja inferior con el semáforo corte a corte; proyección punteada al ritmo actual con el fin proyectado; lectura por defecto en el corte elegido y, al pasar el puntero, la fecha bajo él (en un corte, sus datos; entre cortes, interpolado; después del último, la proyección); zoom «Todo el proyecto» / «Cortes»; animación de entrada y transformación al recalcular (mover una barra del Gantt redibuja). Celular: 260 px de alto, lectura en dos filas.

- **Coherencia:** los valores de la curva salen del motor compartido (`packages/shared/src/calculo`) según la regla de §2.1. El **fin proyectado** es siempre el del motor (§4.3 de `analisis-plantilla-excel.md`: por hoja `max(t, fin − desv)`, el del proyecto es el mayor): la proyección punteada termina ahí, no en el cálculo por curva de la maqueta (call de Claude, para que curva, Gantt y detalle den la misma fecha).
- **Sin cortes:** solo la planeada, con un mensaje que invita a registrar el primer corte. **Sin cronograma programado:** estado vacío que lleva al cronograma.
- **Clic en un punto de corte** elige ese corte (ver §2).
- **Accesibilidad:** el SVG lleva `role="img"` y una etiqueta; la lectura es texto real (no solo dibujo). Con `prefers-reduced-motion`, sin animación de entrada.

## 2. Selector de corte y modo histórico (T5.1)

**Decisión del usuario (A+B):** la fecha se elige de tres formas que cambian el mismo estado:

- desplegable «Corte: 10 nov ▾» en la banda de estado (fijo al hacer scroll);
- clic en un punto de corte de la curva S;
- en el historial, la acción «Ver la ficha a esta fecha» de cada fila.

**Qué cambia al elegir un corte anterior** (decisión del usuario: «los datos a esa fecha, avances de actividades y eso»):

- **Banda:** planeado, real, brecha, estado y vencidas de ese corte.
- **Curva S:** lectura fija en esa fecha; los cortes posteriores y su tramo de curva se ven tenues, sin desaparecer.
- **Gantt:** % real y semáforo de cada actividad en ese corte, línea de corte en esa fecha.
- **Aviso** bajo la banda: «Estás viendo el charter como estaba el 10 oct (corte 3 de 5). Solo lectura.» con «Volver al último corte».
- **Todo en solo lectura** mientras se ve un corte anterior: sin arrastre ni detalle editable en el Gantt, sin edición de textos, sin «Registrar corte». Reutiliza el modo de solo lectura que ya existe (charter cerrado / Admin), con su propio aviso.

### 2.1 De dónde sale cada cifra

**Decisión del usuario:** un corte registrado **no cambia** aunque después se muevan fechas o pesos del cronograma; su `pv`/`ev`/estado/vencidas guardados y su foto son el registro.

- **Cortes anteriores al último** (puntos de la curva, historial, modo histórico): siempre lo guardado y la foto.
- **Vista actual** (sin `?corte` o con el último corte): banda, Gantt, curva y último punto se **recalculan en vivo** con el cronograma actual y los avances del último corte, como hoy, para que mover una barra lo redibuje todo. Si ese recálculo difiere de lo guardado del último corte, la banda muestra «Línea base modificada desde el corte» (call de Claude) y el punto guardado queda como referencia tenue junto al vivo.
- **Portafolio e historial:** lo guardado.
- **Curva planeada:** en la vista actual, la del cronograma actual; en el modo histórico, la de la foto del corte elegido (la foto tiene peso y fechas de cada hoja, que bastan porque el avance se pondera sobre las hojas). Así la curva siempre cuadra con la banda en la fecha que se lee.

**Calls de Claude (revisar):**

- La fecha va en la URL (`/charters/:id?corte=2026-10-10`): se puede compartir el enlace y el botón atrás vuelve. Sin parámetro = último corte (o «hoy» si no hay cortes, como ahora).
- Solo se eligen **cortes registrados**, no cualquier día: es lo único con datos reales.
- Una fecha en la URL que no es un corte → se ignora y se muestra el último, con un aviso breve.
- Las secciones de texto (razón de ser, objetivos, supuestos, criterios) muestran lo actual.
- **Gantt histórico:** la estructura del árbol (agrupadoras, nombres, orden) es la **actual**, porque la foto del corte solo guarda hojas. Para cada hoja presente en la foto se usan sus fechas, peso y % **de la foto**; así el Gantt cuadra con la banda. Hojas creadas después del corte se ven tenues con «no existía en este corte»; hojas de la foto que ya no existen se listan al final como «actividad eliminada» (mismo rótulo que en Registrar corte). Las agrupadoras se recalculan con el motor sobre esas hojas.
- Los KPIs de la Fase 5 no agregan cifras nuevas a la banda: el **fin proyectado** vive en la lectura de la curva S (como en la maqueta) y en el detalle de cada actividad.

## 3. Gantt (T5.3)

Ya existe de la Fase 4 (barras, relleno por avance, arrastre, teclado, escala, plegado de agrupadoras). Se completa con:

- **Marca de fin proyectado** en cada hoja con retraso (tick o extensión punteada desde el fin de línea base hasta el fin proyectado), en el tono del semáforo.
- **«Plegar a grupos» / «Desplegar todo»** en la cabecera del cronograma (call de Claude): reemplaza al bloque de avance por grupo; con un clic se ve el planeado frente al real de cada grupo de primer nivel.
- **Modo histórico** según §2.
- **Rendimiento:** con 170 filas, arrastrar una barra y recalcular no debe trabarse (medir en el navegador; si hace falta, memoizar filas y no virtualizar salvo que la medición lo exija).
- **Arreglo:** la etiqueta de la fecha de corte no se monta sobre la etiqueta del mes.

## 4. Semáforo (T5.4)

- **Decisión del usuario (B):** sin bloque aparte de avance por grupo; las agrupadoras del Gantt ya muestran barra resumen, chip de estado y «n vencidas».
- Fijar los tonos de amarillo, naranja y vinotinto (pendiente de la revisión de la Fase 2) con una **prueba de contraste** automática: el texto de cada chip ≥ 4,5:1 sobre su fondo; los rellenos de barra ≥ 3:1 sobre el fondo de la pista.
- **Umbrales del charter en la ficha:** hoy la ficha usa los de por defecto porque el detalle no los trae. El detalle del charter debe incluirlos y la ficha (banda, curva, Gantt) debe usarlos, igual que los cortes.
- Los estados deben coincidir con la §4.4 de `analisis-plantilla-excel.md` (pruebas con el motor).

## 5. Portafolio con avance (T5.5)

Tal como `pantallas.md` §1: columnas fijas charter · avance (real de planeado, barra con marca del planeado) · mini curva S · estado (chip y vencidas en vinotinto) · último corte (fecha y «hace n días», en ámbar después de 21 días). Celular apilado y sin curva. Filtros «Con vencidas» y «Sin cortes».

- **API:** el resumen de `GET /charters` hoy trae `ultimoCorte { fecha, pv, ev }`. Debe sumar estado y vencidas del último corte y la serie de cortes (`fecha`, `pv`, `ev`) para la mini curva. La mini curva dibuja planeado y real **en los cortes** (no la curva semanal), para no cargar el cronograma de cada charter.
- La mini curva es un SVG estático (sin ejes ni interacción) en el estilo de la grande.
- Clic en la mini curva o en la fila abre la ficha (como hoy).

## 6. Mini curva S en Registrar corte

En el resumen fijo de la derecha: curva planeada y real con el **punto nuevo** en vivo (se mueve al escribir los %). En celular no se muestra (la barra fija abajo ya resume).

## 7. Arreglo del aviso «Corte guardado»

Al mostrarlo, limpiar `state.aviso` del historial del navegador (`navigate(..., { replace: true, state: null })` o equivalente) para que no reaparezca al recargar.

## Cómo se construye (calls de Claude)

- **Gráficas en SVG propio con Motion**, no ECharts: la maqueta aprobada ya resuelve la curva en SVG con transiciones de geometría, el resto de la app usa Motion y así se evita una dependencia de ~1 MB. Actualizar `docs/arquitectura.md` (fila «Gráficas»).
- Funciones puras nuevas (geometría de la curva, interpolación de la lectura, armado del Gantt histórico) en módulos `.ts` con sus pruebas, como `escala.ts` y `clasificar.ts`.
- El corte elegido vive en la URL y se lee en `Ficha.tsx`, que ya reparte el borrador del cronograma a la banda y al Gantt.
- Pruebas con cada tarea; suite completa, lint, build y una ronda de navegador (1440 y 390 px) al cerrar la fase.
- Repartir en sesiones equilibradas (decisión del usuario para cada fase).

## Queda al constructor

Orden de las tareas, nombres de componentes, forma exacta de la marca de fin proyectado, detalle de la respuesta ampliada de `GET /charters` y del detalle del charter (nuevos campos con migración solo si hace falta), y la técnica de rendimiento del Gantt según lo que mida.
