# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Líderes de proyecto** (principal): ingenieros o coordinadores de cualquier área de Grupo HL. Arman su charter una vez, desde el escritorio, y registran cortes de avance periódicos (semanales o quincenales). Desde el celular consultan el estado y cargan el % real de un corte.
- **Admin** (secundario): Transformación Digital. Ve todos los charters en solo lectura y parametriza catálogos (categorías, umbrales) y cuentas.

## Product Purpose

Reemplazar la plantilla de Excel *Project Charter TI 2025 Rev.B* (hoja ID & TI). Cada persona crea y lleva sus propios charters, con cronograma y registro real de avances que conserva el historial de cortes.

**Éxito:** que los líderes abandonen el Excel. Crear un charter y registrar un corte tiene que ser más rápido y más cómodo que copiar el libro y ajustar fórmulas.

## Positioning

Los cálculos del Excel (planeado, real consolidado por pesos, desviación, fecha proyectada, estado y curva S) salen de un motor compartido, probado contra el libro y con sus errores corregidos (doble conteo). El usuario solo captura lo que sabe (columnas A–J y el % real de cada corte); todo lo demás se calcula y cada corte queda guardado como foto.

## Operating Context

- Trabajo de oficina en escritorio (Windows, navegador) para armar el charter y el cronograma; celular para consultar y registrar cortes.
- Vocabulario del Excel y de la gestión de proyectos: hoja, agrupadora, peso, línea base, corte, % planeado, % real, desviación, curva S, Gantt.
- Cada charter se imprime en A4 con el estilo del Informe global.

## Capabilities and Constraints

- Registro libre con correo `@hlingenieros.com` (solo valida dominio), clave de 8+ caracteres. Perfiles: usuario y Admin.
- Cada usuario ve solo sus charters (filtrado en backend). Sin aprobaciones, sin roles intermedios. Independiente de HorasHombre.
- Contenido: encabezado, razón de ser, objetivos, cronograma, supuestos, criterios de éxito, indicadores con mediciones, riesgos, presupuesto, avance (cortes, curva S, Gantt, semáforo).
- Semáforo por brecha (PV − EV) en puntos: verde < 10, amarillo < 25, naranja < 50, rojo ≥ 50; **vencida** (vinotinto) si pasó el fin sin el 100 %.
- Categorías opcionales con color propio, en catálogo editable.
- Stack existente: React + Vite + TS + Tailwind, Motion, ECharts; Fastify + Drizzle + SQLite.
- Local primero, después servidor interno.

## Brand Commitments

- Identidad del *Informe global de priorización* (`docs/referencias/Informe_Global_Priorizacion_Comite_IA_2.pdf`): azul institucional `#003366`, tinta `#0B1F33`, acento `#00A9E0`; Sora, Plus Jakarta Sans y JetBrains Mono. Tokens en `apps/web/src/estilos/tokens.css`.
- Idioma español, trato de tú, cordial y sin exceso de palabras.

## Evidence on Hand

- Excel fuente y fixture con 167 filas reales (`packages/shared/test/fixtures/id-ti.json`), avance al 13-mar-2025: 12,51 % planeado / 12,47 % real.
- Casos de prueba: iniciativas A1, D1 y C1 del Comité de IA.
- No hay testimonios ni métricas de uso; no inventarlos.

## Product Principles

1. **Capturar solo lo que se sabe.** Todo lo calculable se calcula y se ve al instante.
2. **Más rápido que el Excel.** Cada flujo frecuente (crear charter, registrar corte) se mide contra copiar el libro.
3. **El estado se entiende de un vistazo.** Semáforo, vencidas y curva S sin necesidad de leer tablas.
4. **El historial no se pierde.** Cada corte es una foto consultable.

## Accessibility & Inclusion

Contraste de texto 4,5:1 mínimo (por eso existe `alerta-texto` `#A63F2C`); respetar `prefers-reduced-motion`; responsive hasta celular.
