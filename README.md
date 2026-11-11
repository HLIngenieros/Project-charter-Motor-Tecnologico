# Project Charters · Grupo HL

Plataforma web donde **cualquier persona crea y lleva su propio Project Charter**: llena la información del proyecto, construye su cronograma y registra avances reales con historial. Cada usuario trabaja en su espacio, aislado de los demás.

> **Estado:** definición (nov-2026). Arquitectura en [docs/arquitectura.md](docs/arquitectura.md), plan en [docs/plan-implementacion.md](docs/plan-implementacion.md), cálculos en [docs/analisis-plantilla-excel.md](docs/analisis-plantilla-excel.md). Tareas en [PENDIENTES.md](PENDIENTES.md).

---

## 1. Qué problema resuelve

Hoy el charter se lleva en Excel ([Project Charter TI 2025 Rev.B.xlsx](docs/referencias/Project%20Charter%20TI%202025%20Rev.B.xlsx), hoja **ID & TI**). Cada proyecto nuevo implica copiar el libro y ajustar fórmulas. El % real se sobrescribe en cada corte, la curva S se pega a mano y no hay forma de ver varios proyectos juntos. Además, la plantilla tiene errores de cálculo (ver el análisis).

## 2. Alcance

- **Cualquier usuario** crea los charters que necesite. No hay límite de proyectos ni de temas.
- Cada charter puede tener una **categoría** opcional con color propio (catálogo editable). Los tres ejes del Comité de IA (Automatización, Análisis de Data, Gestión del Conocimiento) se cargan solo como **ejemplos iniciales**.
- Casos de prueba: las 3 iniciativas seleccionadas por el Comité ([Informe global](docs/referencias/Informe_Global_Priorizacion_Comite_IA_2.pdf)): A1 Nivelación de costos en el informe económico, D1 Plataforma de control diario de obra · Captura digital en campo, C1 Consulta rápida de especificaciones técnicas.

## 3. Usuarios y aislamiento

- **Sistema independiente:** no comparte base de datos, usuarios ni despliegue con HorasHombre ni con otro sistema. Es multiárea y no tiene flujos de aprobación.
- **Registro libre** con correo `@hlingenieros.com` y clave; solo se valida el dominio.
- **Dos perfiles:** usuario (crea y sigue sus propios charters) y **Admin** (ve todos los charters en solo lectura y parametriza catálogos y cuentas).
- El backend filtra todo por propietario; el aislamiento no depende del frontend.

## 4. Contenido del charter

Mismo contenido de la hoja **ID & TI**:

1. **Encabezado:** nombre, categoría, responsable, patrocinador, revisión.
2. **Razón de ser** y **objetivo general**.
3. **Objetivos específicos** (lista).
4. **Cronograma.** Se captura con las **columnas A–J del Excel**: ítem, actividad, entregable, % peso, fecha inicio, fecha fin (línea base) y responsable. Las columnas K–N (% planeado, % real, desviación en días y fecha fin proyectada), el Gantt y la curva S **se calculan**.
5. **Supuestos** y **criterios de éxito** (listas).
6. **Indicadores:** nombre, fórmula, meta y observaciones, con mediciones por periodo.
7. **Riesgos:** riesgo, causa y mitigación.
8. **Presupuesto:** rubros, valores y total.
9. **Avance:** cortes, curva S, Gantt y semáforo.

## 5. Avance y cálculos

- Un **corte** = fecha de corte + % real de cada actividad + nota. Todos los cortes se guardan.
- El % planeado, la consolidación por pesos, la desviación, la fecha proyectada, el estado y la curva S se calculan en un motor compartido entre frontend y backend.
- Reglas completas y fórmulas en [docs/analisis-plantilla-excel.md §4](docs/analisis-plantilla-excel.md#4-cálculos-de-la-plataforma).

## 6. Experiencia e identidad visual

Basada en el *Informe global de priorización* (generado desde HTML, se reproduce tal cual en la web):

| Uso | Valor |
|---|---|
| Azul institucional | `#003366` |
| Tinta / títulos | `#0B1F33` |
| Texto | `#3B4B5E` · secundario `#5B6C7E` / `#7C8CA1` |
| Líneas y fondos | `#DCE3EC`, `#E3E8EF`, `#EEF2F6` |
| Acento | `#00A9E0` |
| Categorías de ejemplo | `#D98A00` (fondo `#FBF1DF`) · `#6A55D8` (`#EEEBFB`) · `#0A9C9B` (`#E1F4F3`) |
| Estados | `#15A06A` verde · `#1F6FD1` azul · `#7C8CA1` gris · `#C4513C` rojo |
| Tipografías | **Sora** (títulos), **Plus Jakarta Sans** (texto), **JetBrains Mono** (cifras y códigos) |

Principios:

- **Interactiva y dinámica:** edición en línea, recálculo inmediato al cambiar fechas, pesos o % real, y filtros y fecha de corte que actualizan todo al instante.
- **Animaciones limpias y modernas:** transiciones entre vistas, entradas escalonadas, contadores animados, barras de progreso que se llenan y estados que cambian con suavidad. Se respeta `prefers-reduced-motion`.
- **Gráficas potentes:** curva S con zoom y tooltip, Gantt interactivo con línea de corte, avance por grupo, semáforos e indicadores frente a la meta.
- **Exportable:** cada charter se imprime en A4 con el estilo del Informe global.

## 7. Arquitectura

Definición completa en [docs/arquitectura.md](docs/arquitectura.md). Resumen:

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Animación | Motion (Framer Motion) |
| Gráficas | Apache ECharts (curva S, Gantt, indicadores) |
| Backend | Node + Fastify + Drizzle ORM |
| Base de datos | PostgreSQL con Drizzle: Neon en producción, PGlite en desarrollo |
| Autenticación | Usuario + contraseña con hash (argon2), sesión en cookie httpOnly |
| Tipos y validación | Zod, compartido |
| Cálculos | Paquete compartido en TypeScript, con pruebas contra el Excel |

```
ProjectCharter/
├── apps/
│   ├── api/          # Fastify + Drizzle + Postgres
│   └── web/          # React + Vite + Tailwind
├── packages/
│   └── shared/       # Esquemas Zod, tipos y motor de cálculo
├── docs/
│   ├── referencias/  # Excel plantilla 2025 y PDF del Informe global
│   └── analisis-plantilla-excel.md
├── CLAUDE.md         # Memoria del proyecto para Claude
├── PENDIENTES.md     # Fases, tareas y registro de sesiones
└── README.md
```

## 8. Decisiones cerradas

- Registro libre con dominio `@hlingenieros.com`, sin confirmación por correo.
- Sin aprobación de charters ni congelamiento de la línea base: cada corte guarda una foto de pesos y fechas.
- Despliegue local por ahora; después, servidor interno.

## 9. Historial

El trabajo anterior (dashboard estático "Motor Tecnológico", de otro equipo) se descartó como base. Queda en el historial de git hasta el commit `f38039d`.
