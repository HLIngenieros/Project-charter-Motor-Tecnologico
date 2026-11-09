# CLAUDE.md

Memoria del proyecto para Claude. Mantenerla breve: si algo cambia, se edita la sección en vez de añadir otra.

## Proyecto

- **Qué es:** plataforma web donde cualquier usuario crea su propio Project Charter, aislado de los demás, con cronograma y registro real de avances (cortes con historial).
- **Fuentes:** `docs/referencias/Project Charter TI 2025 Rev.B.xlsx` (hoja ID & TI = contenido y cálculos) y `docs/referencias/Informe_Global_Priorizacion_Comite_IA_2.pdf` (identidad visual).
- **Responsable:** Juan David Urbina (Transformación Digital, Grupo HL).
- **Idioma:** español. Tratar de **tú**, cordial y sin exceso de palabras.

## Forma de trabajo

- Flujo superpowers: brainstorming → spec → plan → ejecución, con el diseño aprobado antes de implementar.
- Tareas y registro de sesiones en [PENDIENTES.md](PENDIENTES.md).
- **"Cerremos sesión"** significa, en este orden:
  1. Actualizar este CLAUDE.md (decisiones y lo aprendido).
  2. Actualizar PENDIENTES.md y la documentación afectada.
  3. Hacer commit en español, en imperativo y breve.
- **No hacer push:** el usuario lo hace manualmente desde GitHub Desktop.
- **Ejecución de planes:** directa (sin subagente por tarea), con superpowers para pensar y skills de front para diseño y animaciones. Las pruebas se escriben con cada tarea; la verificación formal (suite completa, lint, build y navegador) es al cerrar cada fase.

## Repositorio

- GitHub: `HLIngenieros/Project-charter-Motor-Tecnologico` (privado), rama `main`.
- Se reutiliza el repo del trabajo anterior (dashboard estático "Motor Tecnológico" de otro equipo), que se descartó. Sus archivos quedan en el historial hasta el commit `f38039d`; `dashboard/js/calculo.js` tiene un port útil de las fórmulas del Excel.

## Estructura

| Ruta | Contenido |
|---|---|
| `README.md` | Requerimientos, identidad visual y arquitectura propuesta |
| `docs/arquitectura.md` | Arquitectura: perfiles, stack, modelo de datos, API, motor, despliegue |
| `docs/plan-implementacion.md` | Plan general por fases y tareas con criterios de terminado |
| `docs/planes/fase-N.md` | Plan detallado de cada fase (pasos, interfaces y pruebas) |
| `docs/analisis-plantilla-excel.md` | Análisis del Excel, errores encontrados y **especificación de cálculos** (§4) |
| `docs/referencias/` | Excel y PDF fuente |
| `PENDIENTES.md` | Fases, tareas y registro de sesiones |

## Decisiones

- 2026-11-09 · Se reutiliza el repo anterior, movido a la raíz · Petición del usuario.
- 2026-11-09 · Varios charters, cualquier usuario crea los suyos; las categorías (ejes) son un catálogo editable y los 3 ejes del Comité son solo ejemplos · Usuario.
- 2026-11-09 · Autenticación muy sencilla pero cuidada visualmente, con usuarios individuales; cada usuario ve solo sus charters (filtrado en backend) · Usuario.
- 2026-11-09 · Captura del cronograma = columnas A–J del Excel; K–N, Gantt y curva S se calculan · Usuario.
- 2026-11-09 · UI interactiva, con animaciones limpias y modernas y gráficas potentes · Usuario. Propuesta: Motion + ECharts.
- 2026-11-09 · Stack: React + Vite + TS + Tailwind / Fastify + Drizzle + SQLite / Zod y motor de cálculo compartidos. Detalle en `docs/arquitectura.md` · Claude.
- 2026-11-09 · Consolidar el avance ponderando sobre las hojas (corrige el doble conteo del Excel) · Claude.
- 2026-11-09 · **Totalmente independiente de HorasHombre**; multiárea; no escalar al modelo de HH (sin roles intermedios ni aprobaciones) · Usuario.
- 2026-11-09 · Registro libre con correo `@hlingenieros.com` (solo valida dominio). Perfiles: usuario y Admin (lectura de todo + parametrización) · Usuario.
- 2026-11-09 · Sin aprobación de charters; línea base editable y cada corte guarda una foto · Usuario / Claude.
- 2026-11-09 · Local primero, después servidor interno. Web responsive · Usuario.

## Estado actual

- Arquitectura, plan general y plan detallado de la Fase 2 aprobados (2026-11-09). Siguiente: ejecutar `docs/planes/fase-2.md` desde la Task 1; T1.3 (maquetas) antes de la Fase 3.
- Hallazgo: en el Excel la jerarquía se deduce de las fórmulas de peso (G), no del esquema de filas (roto en 1.3.1 y 1.3.2). Con esa regla da 12,51 % / 12,47 %.

## Glosario

- **Hoja / agrupadora:** actividad sin hijas (lleva peso, fechas y % real) / con hijas (se calcula).
- **Corte:** fecha de corte + % real por hoja + nota. Se guardan todos.
- **Línea base:** fechas y pesos aprobados del cronograma.

## Entorno

- Windows 11, VS Code, PowerShell 5.1 y Git Bash. Python 3.13 con openpyxl; Node 24.
