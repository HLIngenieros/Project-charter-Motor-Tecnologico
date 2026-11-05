# CLAUDE.md

Memoria y contexto del proyecto para Claude Code. Claude lo lee al inicio de cada sesión.
Mantenlo breve y actualizado: si algo cambia, edita esta sección en lugar de añadir una nueva.

## Proyecto

- **Nombre:** Project Charter – Motor Tecnológico
- **Propósito:** _(pendiente: describir qué es el Motor Tecnológico y qué debe cubrir el charter)_
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
- **URL:** _(se registra al publicar)_
- **Cómo actualizarlo al cierre:**
  1. Editar el JSON a partir de PENDIENTES.md y CLAUDE.md: estado de las tareas, `revision` y `fecha`, `proxima`, una nueva entrada en `sesiones` y las nuevas `decisiones`.
  2. Publicar con la herramienta Artifact pasando `url` (la de arriba) y `file_path` = tablero.html. Sin `url` se crearía un tablero nuevo con otra dirección.
- Cada sesión es una **revisión** del tablero (Rev. 01, 02…), igual que en el registro de sesiones de PENDIENTES.md.

## Estructura

| Archivo | Contenido |
|---|---|
| `README.md` | Descripción breve del repositorio |
| `CLAUDE.md` | Este archivo: memoria del proyecto para Claude |
| `PENDIENTES.md` | Fases, tareas, su estado y el registro de sesiones |
| `tablero.html` | Fuente del tablero del proyecto (artefacto en claude.ai) |
| `.gitignore` | Excluye temporales de Office (`~$*`), archivos del SO, `.vscode/`, `.env` |
| `ejemplo.md` | Archivo de prueba (contenido sin significado) |

## Convenciones

- Documentos en Markdown (`.md`).
- Mensajes de commit en español, en modo imperativo y breves (ej.: "Añade sección de alcance").

## Entorno

- Windows 11, PowerShell 5.1, VS Code.
- Git 2.56 y GitHub CLI 2.103 instalados con winget.
- La skill global `impeccable` (diseño de interfaces) está instalada en `~/.claude/skills/impeccable`, sin el hook de diseño.

## Decisiones

<!-- Registrar aquí las decisiones importantes: fecha · decisión · motivo -->
- 2026-11-05 · Repositorio privado en GitHub · Contiene documentación interna.
- 2026-11-05 · Trabajo por fases y tareas, una sesión por tarea, con un cierre de 3 pasos · Preferencia del usuario.
- 2026-11-05 · El artefacto de seguimiento es el tablero del proyecto (tablero.html) · Muestra el estado del proyecto sin abrir el repositorio.

## Glosario

<!-- Términos propios del proyecto y su significado -->
- _(pendiente)_

## Pendientes

Ver [PENDIENTES.md](PENDIENTES.md).
