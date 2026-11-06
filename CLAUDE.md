# CLAUDE.md

Memoria y contexto del proyecto para Claude Code. Claude lo lee al inicio de cada sesión.
Mantenlo breve y actualizado: si algo cambia, edita esta sección en lugar de añadir una nueva.

## Proyecto

- **Nombre:** Project Charter – Motor Tecnológico
- **Propósito:** el Motor Tecnológico es una palanca del plan estratégico de Grupo HL (Dirección ID&TI): herramientas, datos e IA para crecer de 48,5 a 100 MUSD en cinco años y bajar el costo de administrar los proyectos del 30–35 % al 20 %. El charter cubre 2027 con visión a 2028: uno principal y uno por iniciativa (01 Herramientas core: Libra, Procore, OPUS, Zoho CRM, M365 · 02 Data Driven · 03 IA · 04 Vigilancia Tecnológica, esta como propuesta). Gestión híbrida: PMI para gobernar, Scrum para entregar.
- **Fuentes:** `Project Charter TI 2025 Rev.B.xlsx` (formato 2025, con fecha de corte, % planeado/real y curva S) y `Palanca Motor Tecnologico  (2).html` (diagnóstico de la palanca, oct-2026).
- **Responsable:** rovalle1987 (rovalle@hlingenieros.com)
- **Idioma:** todo el contenido y la comunicación se hacen en **español**.

## Repositorio

- GitHub: https://github.com/rovalle1987/Project-charter-Motor-Tecnologico (privado)
- Rama principal: `main`
- Claude hace el **commit a `main`** al cerrar cada sesión (ver "Forma de trabajo"). El push lo hace el usuario desde **GitHub Desktop**, salvo que pida otra cosa.
- `gh` (GitHub CLI) está instalado pero sin sesión iniciada. Si hace falta usarlo desde la terminal: `gh auth login` + `gh auth setup-git`.

## Forma de trabajo

- El trabajo se organiza en **fases** y cada fase en **tareas**, registradas en [PENDIENTES.md](PENDIENTES.md).
- **Una sesión = una tarea.** Al empezar, confirmar con el usuario qué tarea de PENDIENTES.md se trabaja y marcarla "en curso".
- **Cierre de sesión obligatorio**, en este orden:
  1. **Memoria y documentación:** actualizar este CLAUDE.md (decisiones, glosario, estructura, lo aprendido) y PENDIENTES.md (marcar la tarea como hecha, añadir tareas nuevas que hayan surgido).
  2. **Commit a `main`** con un mensaje en español que describa la tarea completada.
  3. **Actualizar el artefacto** del proyecto (ver "Artefacto").

## Artefacto

- **Tablero del proyecto:** página privada en claude.ai con las fases y tareas, el avance, la bitácora de sesiones y las decisiones.
- **Fuente:** [tablero.html](tablero.html). Los datos están en el bloque JSON `<script id="datos">` al inicio del archivo; la página se dibuja a partir de ellos.
- **URL:** https://claude.ai/artifact/7vS94KqN5FP4Q1npvi5fcG (privado; se comparte desde su menú Share)
- **Cómo actualizarlo al cierre:**
  1. Editar el JSON a partir de PENDIENTES.md y CLAUDE.md: estado de las tareas, `revision` y `fecha`, `proxima`, una nueva entrada en `sesiones` y las nuevas `decisiones`.
  2. Publicar con la herramienta Artifact pasando `url` (la de arriba) y `file_path` = tablero.html. Sin `url` se crearía un tablero nuevo con otra dirección.
- Cada sesión es una **revisión** del tablero (Rev. 01, 02…), igual que en el registro de sesiones de PENDIENTES.md.

## Referencias

- **Protocolo de inicio de proyecto para Claude:** https://claude.ai/artifact/8Q2szpGdfVPqhsyt62C8CJ. Es un documento de Claude Docs que se edita con el conector de Claude Docs, no publicando archivos. Contiene los pasos y las preferencias del usuario para iniciar proyectos nuevos; hay que seguirlo cuando el usuario pida iniciar uno.

## Estructura

| Archivo | Contenido |
|---|---|
| `README.md` | Descripción breve del repositorio |
| `CLAUDE.md` | Este archivo: memoria del proyecto para Claude |
| `PENDIENTES.md` | Fases, tareas, su estado y el registro de sesiones |
| `tablero.html` | Fuente del tablero del proyecto (artefacto en claude.ai) |
| `.gitignore` | Excluye temporales de Office (`~$*`), archivos del SO, `.vscode/`, `.env` |
| `ejemplo.md` | Archivo de prueba (contenido sin significado) |
| `dashboard/index.html` | **Entregable:** dashboard del Project Charter (HTML + Tailwind CDN + JS). Se abre en el navegador; necesita internet para Tailwind y las fuentes |
| `dashboard/css/styles.css` | Identidad visual, componentes y animaciones |
| `dashboard/js/datos.js` | Contenido del charter (`window.CHARTER`): general + 4 iniciativas, épicas, KPI, riesgos |
| `dashboard/js/plan.js` | Línea base del cronograma (`window.PLAN`): frentes → épicas → 84 tareas con fechas, pesos y responsables. Solo cambia con aprobación del Comité |
| `dashboard/js/avance.js` | Cortes semanales con el % real por tarea (`window.AVANCE`). Lo genera el dashboard (pestaña Seguimiento → Guardar corte) |
| `dashboard/js/calculo.js` | Fórmulas: % planeado lineal a la fecha de corte, consolidación por pesos, desviación en días, forecast, estado, curva S |
| `dashboard/js/app.js` | Dibuja las pestañas (principal, Seguimiento, 4 iniciativas) y el registro del corte |
| `charter-motor-tecnologico.html` | Primera versión (artefacto), reemplazada por `dashboard/`. Sin versionar, pendiente de decidir |

### Cómo funciona el seguimiento del dashboard

- Fecha de corte en la barra superior: recalcula el % planeado en todas las pestañas. El % real es el del último corte en o antes de esa fecha.
- Corte semanal (viernes): Seguimiento → Registrar corte → editar % real por tarea → Guardar corte → reemplazar `dashboard/js/avance.js` → commit «Corte semana N».
- Estado: Al día (desviación ≥ −3 días), Atención (−3 a −10), Atrasada (< −10).
- Pesos de frentes: Gestión PMI 10, Core 30, Data Driven 25, IA 25, Vigilancia 10 (propuesta, por validar).

## Convenciones

- Documentos en Markdown (`.md`).
- Mensajes de commit en español, en modo imperativo y breves (ej.: "Añade sección de alcance").

## Entorno

- Windows 11, PowerShell 5.1, VS Code.
- Git 2.56 y GitHub CLI 2.103 instalados con winget. Git no está en el PATH de la terminal de Claude: usar `& "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"`.
- Python no está instalado. Los `.xlsx` se leen descomprimiéndolos con PowerShell. Las pruebas visuales se hacen con Edge headless (`msedge.exe --headless=new --screenshot`); el sandbox no resuelve CDN externos.
- Skills globales en `~/.claude/skills/`: `impeccable` (diseño de interfaces, sin su hook) y `humanizer` (quitar rasgos de texto escrito por IA).
- Plugin `superpowers` (marketplace oficial, ámbito usuario): 14 skills de proceso (brainstorming, planes, TDD, depuración, revisión de código…) y un hook de inicio de sesión que me obliga a revisar las skills antes de actuar.
- Disponibles desde claude.ai: `frontend-design` y `web-artifacts-builder`.

## Decisiones

<!-- Registrar aquí las decisiones importantes: fecha · decisión · motivo -->
- 2026-11-05 · Repositorio privado en GitHub · Contiene documentación interna.
- 2026-11-05 · Trabajo por fases y tareas, una sesión por tarea, con un cierre de 3 pasos · Preferencia del usuario.
- 2026-11-05 · El artefacto de seguimiento es el tablero del proyecto (tablero.html) · Muestra el estado del proyecto sin abrir el repositorio.
- 2026-11-05 · El protocolo de inicio de proyecto va dirigido a Claude, no al usuario · El usuario quiere que Claude inicie proyectos nuevos solo, siguiendo sus preferencias.
- 2026-11-05 · Se instala superpowers para todos los proyectos del usuario · Petición del usuario; se desactiva con `claude plugin disable` si resulta excesivo.
- 2026-11-05 · El charter es un dashboard local HTML + CSS + Tailwind + JavaScript, no un artefacto de claude.ai · Petición del usuario.
- 2026-11-05 · Charter 2027 con visión 2028, uno general + uno por iniciativa, enfoque híbrido PMI + Scrum · Respuestas del usuario.
- 2026-11-05 · OPUS, Zoho CRM y M365 dentro de la iniciativa 01; Vigilancia Tecnológica como iniciativa 04 propuesta · Propuesta de Claude, por validar.
- 2026-11-05 · Seguimiento por fecha de corte semanal, % real por tarea, planeado lineal por fechas y pesos; registro con formulario que exporta avance.js · Respuestas del usuario, siguiendo el modelo del Excel 2025.
- 2026-11-05 · Se añade el frente «Gestión de la palanca (PMI)» con peso 10 % · Sin él, el avance de nov–dic 2026 sería casi nulo.

## Glosario

<!-- Términos propios del proyecto y su significado -->
- **Palanca:** línea del plan estratégico; el Motor Tecnológico es una.
- **Frente:** Gestión PMI o una de las 4 iniciativas.
- **Épica:** entregable grande de una iniciativa (E1.1…E4.4); se parte en tareas (línea base) y en historias (sprints).
- **Fecha de corte:** fecha a la que se calcula el % planeado y se registra el % real.
- **Línea base:** fechas, pesos y tareas aprobadas (`plan.js`).
- **PO:** Product Owner de una iniciativa.

## Pendientes

Ver [PENDIENTES.md](PENDIENTES.md).
