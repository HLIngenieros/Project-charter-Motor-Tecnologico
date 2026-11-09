# Análisis de la plantilla Excel · Project Charter TI 2025 Rev.B

Fuente: [referencias/Project Charter TI 2025 Rev.B.xlsx](referencias/Project%20Charter%20TI%202025%20Rev.B.xlsx). Analizado el 9-nov-2026.

El libro tiene 13 hojas. **ID & TI** es el charter; las demás son anexos que alimentan sus indicadores, presupuesto y curva S.

## 1. Hoja ID & TI · secciones y campos

| Filas | Sección | Campos | Tipo en la plataforma |
|---|---|---|---|
| 2–3 | Encabezado | Nombre del proyecto | Texto |
| 4–5 | Razón de ser del proyecto | Párrafo | Texto largo |
| 6–7 | Objetivo general | Párrafo | Texto largo |
| 8–15 | Objetivos específicos (si aplica) | 7 ítems | Lista ordenada |
| 17 | Fecha de corte (celda L17) | Fecha única para todo el libro | Se convierte en **corte** con historial |
| 18–185 | Cronograma | Ítem · Actividad · Entregable · % Peso · Fecha inicio · Fecha fin (línea base) · Responsable · % Av. planeado · % Av. real · Desviación en días · Fecha fin forecast · Gantt semanal (P:BQ, 53 semanas desde 01-ene) | Árbol de actividades + cortes |
| 186–193 | Principales supuestos | Lista numerada (4 con texto) | Lista |
| 186–193 | Criterios de éxito | Lista numerada (5 con texto) | Lista |
| 194–203 | Indicadores de logro / gestión | Ítem · Nombre · Fórmula · Meta · Observaciones (6 indicadores) | Tabla + mediciones |
| 194–203 | Principales riesgos | Ítem · Riesgo · Causa · Acción de mitigación (7 riesgos) | Tabla |
| 204–214 | Presupuesto 2025 | Ítem · Descripción · Valor anual · Total (5 rubros, COP 553,2 M) | Tabla |
| 204+ | Avance | Gráfico de líneas que lee la hoja *Curva S* | Curva S calculada |

### Cronograma del ejemplo

- 167 filas: 22 agrupadoras (se calculan) y 145 hojas (se digitan).
- Tres frentes: 1 Potenciación de herramientas (75 %: Libra, OPUS, Procore), 2 Implementación de IA (20 %), 3 Renovación de software y hardware (5 %).
- Hasta 5 niveles de profundidad (ej. `1.1.5.1.1`).
- Responsables en texto libre con guiones (`Lider ID&TI-Subcontratista TIC-GH`): en realidad son **varios responsables** por actividad.
- Entregables escritos solo en la primera fila de un bloque (celdas combinadas en F): el entregable pertenece al grupo, no a cada tarea.
- Patrones de actividad repetidos en cada bloque: mesa de trabajo → flujo de proceso → desarrollo → pruebas → comunicación y capacitación → gestión del cambio. Sirve como plantilla sugerida al crear un charter.

## 2. Hojas anexas

| Hoja | Contenido | Uso en la plataforma |
|---|---|---|
| KPIs Capacitacion | Usuarios clave por área, cantidad capacitados, meta | Mediciones del indicador "% usuarios capacitados" |
| KPIs Incidencias | Incidencias Libra por mes 2024 vs 2025, meta 85 % | Mediciones mensuales de un indicador |
| KPIs Automatizacion | Procesos y reportes automatizados por área | Mediciones del indicador de automatización |
| KPIs IA | Procesos priorizados por área y optimizados con IA | Mediciones del indicador de IA |
| Ppto TIC, Mtto HW & SW, ERP Libra, PROCORE, OPUS, IA, C.Renovacion | Desglose de costos por rubro (horas × tarifa, licencias) | Detalle opcional de cada rubro de presupuesto |
| Curva S | Semana, fecha, % planeado, % real (valores pegados a mano, real hasta S11) | Se reemplaza por el cálculo desde los cortes |

Conclusión: cada indicador necesita **mediciones por periodo** (valor y meta), y cada rubro de presupuesto puede tener un **desglose** opcional.

## 3. Reglas de cálculo del Excel

Con `corte` = celda L17, `H` = inicio, `I` = fin de línea base, `N` = fin forecast:

| Campo | Fórmula en el Excel |
|---|---|
| % Av. planeado (hoja) | `clamp((corte − H + 1) / (N − H + 1), 0, 1)` |
| % Av. real (hoja) | Digitado |
| Peso, inicio, fin (agrupadora) | Suma de pesos de los hijos · `MIN(H)` · `MAX(I)` |
| % planeado y real (agrupadora) | `SUMPRODUCT(%, peso) / SUM(peso)` sobre el rango de filas debajo |
| Desviación en días | `(% real − % planeado) × (I − H)` |
| Fecha fin forecast | `= I` (no se recalcula) |
| Gantt | Marca la semana si cae entre H e I |

### Errores de la plantilla que la plataforma debe corregir

1. **Pesos contados varias veces.** El rango del `SUMPRODUCT` incluye la agrupadora y también a sus hijas. En la fila total los pesos del rango suman **3,68 en vez de 1**; en `1.1` suman 0,42 en vez de 0,25. Las tareas más profundas pesan de más. **Corrección:** ponderar sobre las hojas.
1b. **Agrupadora calculada como hoja.** En la fila `1.2 OPUS HL Fase 2`, el % planeado usa la fórmula lineal de una hoja sobre feb–dic, mientras que el % real sí consolida a sus hijas. El resultado es una desviación de −14,6 días que no existe.
   - **Efecto conjunto de 1 y 1b** al corte del 13-mar-2025: el Excel muestra planeado 9,37 % y real 8,62 % (−2,6 días). Ponderando correctamente sobre las hojas (los pesos suman exactamente 100 %) da **planeado 12,51 % y real 12,47 %**: el proyecto estaba prácticamente al día.
2. **Códigos de ítem repetidos:** `1.1.1` (×2), `1.1.5.10` (×2), `1.1.5.11` (×3), `1.1.6.7` (×7). La jerarquía no se puede deducir del código. **Corrección:** el código se genera desde el árbol.
3. **Actividades sin fechas** (2.2 "IA propia (Futuro)"): el planeado sale 100 % y el forecast 1900-01-01. **Corrección:** estado "sin programar", fuera del cálculo.
4. **Duración inconsistente:** el planeado usa `N − H + 1` días y la desviación `I − H`. **Corrección:** una sola duración (inicio y fin incluidos).
5. **El forecast no proyecta nada** (= fin de línea base). **Propuesta:** `forecast = fin − desviación en días` mientras no esté terminada.
6. **Sin historial:** el % real se sobrescribe; la curva S se pega a mano. **Corrección:** cortes guardados.
7. Menores: encabezado "%Desviación en Días" (son días, no %), metas en formatos mezclados (`1`, `15% de reducción`, `≥ 1 procesos`, `≤ 72 horas`), indicadores 5 y 6 vacíos, "Toltal" en presupuesto.

## 4. Cálculos de la plataforma

### 4.1 Datos de entrada (columnas A–J)

| Col. | Campo | Captura |
|---|---|---|
| A | Ítem | Se genera desde la posición en el árbol (1, 1.1, 1.1.1…). Al importar un Excel se usa para reconstruir el árbol |
| B–E | Actividad | Texto, obligatorio |
| F | Entregable | Texto opcional; se puede poner en una agrupadora y aplica a todo el bloque |
| G | % Peso | Solo en **actividades hoja**. Las agrupadoras lo suman solas |
| H | Fecha inicio (línea base) | Fecha |
| I | Fecha fin (línea base) | Fecha ≥ inicio |
| J | Responsable | Uno o varios (lista, no texto con guiones) |

Una actividad es **agrupadora** si tiene hijas y **hoja** si no. Solo las hojas llevan peso, fechas propias y % real.

Además, en cada **corte** se captura: fecha de corte (`t`), % real de cada hoja (0–100) y nota opcional.

### 4.2 Actividad hoja

Con `ini`, `fin` y `peso` de la hoja, y `t` = fecha de corte:

| Cálculo | Fórmula |
|---|---|
| Duración | `dur = fin − ini + 1` (días calendario, inicio y fin incluidos) |
| % planeado (K) | `PV = clamp((t − ini + 1) / dur, 0, 1)`; 0 si `t < ini` |
| % real (L) | `EV` = % del último corte con fecha ≤ `t`; 0 si no hay |
| Desviación en días (M) | `desv = (EV − PV) × dur`. Negativa = atraso |
| Índice de cumplimiento | `SPI = EV / PV` si `PV > 0` |
| Fecha fin proyectada (N) | Terminada: fecha del primer corte con 100 %. Si no: `max(t, fin − desv)` |
| Fecha real de inicio | Fecha del primer corte con `EV > 0` (dato informativo) |

### 4.3 Agrupadoras y proyecto

Con `H` = conjunto de hojas bajo la agrupadora:

| Cálculo | Fórmula |
|---|---|
| Peso | `Σ peso` de sus hojas |
| Inicio / fin | `min(ini)` / `max(fin)` de sus hojas |
| % planeado | `Σ(peso·PV) / Σ peso` sobre sus hojas |
| % real | `Σ(peso·EV) / Σ peso` sobre sus hojas |
| Desviación en días | `(EV − PV) × dur` de la agrupadora |
| Fecha fin proyectada | La mayor fecha proyectada de sus hojas |

Ponderar sobre las hojas da el mismo resultado que ponderar los hijos directos con su peso sumado, y evita el doble conteo del Excel. El proyecto es la agrupadora raíz.

### 4.4 Estado (semáforo)

| Estado | Condición |
|---|---|
| Sin programar | Hoja sin fechas o sin peso: queda fuera de los cálculos y se muestra un aviso |
| Por iniciar | `PV = 0` y `EV = 0` |
| Terminada | `EV = 100 %` |
| Al día | `desv ≥ −3` días |
| En atención | `−10 ≤ desv < −3` |
| Atrasada | `desv < −10` |
| Adelantada (etiqueta) | `desv > 0` |

Los umbrales se pueden configurar por charter.

### 4.5 Gráficas

- **Curva S planeada:** `PV` del proyecto (o de un grupo) cada semana, desde el inicio hasta el fin de la línea base.
- **Curva S real:** `EV` del proyecto en cada corte. Las dos se unen en el eje de tiempo.
- **Gantt:** barra de línea base (`ini`–`fin`), relleno según `EV`, marca de la fecha proyectada si es distinta del fin, y línea vertical en la fecha de corte.
- **Avance por grupo:** `PV` frente a `EV` por agrupadora de primer nivel.
- **Variación entre cortes:** `ΔEV` del proyecto entre un corte y el anterior (ritmo semanal).

### 4.6 Indicadores

- La meta tiene estructura: operador (`≥`, `≤`, `=`), valor y unidad (%, horas, procesos…).
- Cumplimiento de una medición: con `≥`, `valor / meta`; con `≤`, `meta / valor`; con `=`, 100 % si coincide. Tope en 100 %.
- Semáforo del indicador: ≥ 100 % verde, 80–99 % atención, < 80 % rojo (configurable).

### 4.7 Presupuesto

- Total = `Σ` valor de los rubros. Cada rubro puede tener un desglose opcional (cantidad × valor unitario), como las hojas anexas del Excel.

### 4.8 Validaciones al guardar

- `fin ≥ ini` en cada hoja.
- La suma de pesos de las hojas debería dar 100 %. Si no da, se avisa y se ofrece normalizar; el cálculo sigue siendo correcto porque divide por `Σ peso`.
- % real entre 0 y 100. Bajar el % real frente al corte anterior genera un aviso, pero se permite.
- Un corte por fecha y por charter. Registrar otro en la misma fecha lo reemplaza, previa confirmación.

### 4.9 Verificación

El motor de cálculo se prueba con el ejemplo del Excel al corte del 13-mar-2025. Con la consolidación corregida, el resultado esperado del proyecto es **planeado 12,51 % y real 12,47 %** (pesos de las hojas = 100 %; se excluye `2.2` por no tener fechas). El Excel muestra 9,37 % y 8,62 % por los errores 1 y 1b, y esa diferencia queda documentada en las pruebas. En las hojas individuales, el % planeado debe coincidir exactamente con la columna K. La desviación difiere de la columna M en un día de duración (error 4).
