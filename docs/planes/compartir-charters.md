# Compartir charters — plan de implementación

> Ejecución directa (CLAUDE.md). Pasos con casillas `- [ ]`.

**Goal:** que el dueño comparta su charter por correo como Lector o Editor, también con quien aún no tiene cuenta.

**Architecture:** tabla `charter_acceso` por correo; `cargarCharter` la consulta y sigue siendo el único control de acceso. El detalle expone `rol` y `permisos.compartir`; el listado suma los compartidos con `compartido`. La web reutiliza `permisos.editar` y agrega el diálogo «Compartir».

**Tech Stack:** Fastify + Drizzle (Postgres/PGlite), Zod, React + TanStack Query, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-24-compartir-charters-design.md`

## Global Constraints

- Correos normalizados con `normalizarCorreo` y del dominio `config.dominioPermitido`.
- Sin acceso: el mismo 404 `no_encontrado`. Lector al escribir: 403 `solo_lectura` «Tienes acceso de solo lectura a este charter.» Cambiar estado sin ser dueño: 403 `solo_dueno`.
- Textos en español, tuteo.

## Review Focus

- Correo con mayúsculas o espacios al compartir → se guarda normalizado y casa con el registro.
- Compartir con el correo del propio dueño → 400 con mensaje en `campos.correo`.
- Editor que envía `estado` en el PATCH → 403 `solo_dueno`; los demás campos sí.
- Eliminar el charter → borra sus accesos (cascade) sin error.
- Un correo compartido dos veces → actualiza el rol (no duplica).

---

### Task 1: Datos, acceso y API

**Files:** `apps/api/src/db/esquema.ts`, migración nueva en `apps/api/drizzle/`, `apps/api/src/modulos/charters/acceso.ts`, `servicio.ts`, `rutas.ts`, nuevo `accesos.ts`; `packages/shared/src/esquemas/charter.ts`. Pruebas: `apps/api/test/aislamiento.test.ts`, nuevo `apps/api/test/compartir.test.ts`.

**Interfaces (produce):**

- Shared: `ROLES_ACCESO = ['lector','editor']`, `RolAcceso`, `RolCharter = 'dueno'|RolAcceso|'admin'`, `accesoEntrada` (Zod `{ correo, rol }`), `AccesoCharter { correo; rol; nombre: string | null }`. `CharterResumen.compartido: RolAcceso | null`; `CharterDetalle.rol: RolCharter`; `permisos.compartir: boolean`.
- API: `rolEn(db, fila, usuario): Promise<RolCharter | null>` en `acceso.ts`; `exigirDueno(fila, usuario)`; `listarCharters(db, { propietarioId?, correo? })`; `listarAccesos`, `compartir`, `quitarAcceso` en `accesos.ts`.

- [ ] Pruebas: lector lee y no escribe (403 `solo_lectura`); editor escribe pero no `reapertura` ni cambia estado; acceso pendiente se activa al registrarse con ese correo (con mayúsculas); listado trae los compartidos con `compartido`; POST valida dominio y dueño; DELETE quita; eliminar charter con accesos.
- [ ] Implementar; `npx drizzle-kit generate --name compartir` y revisar el SQL.
- [ ] Suite de la API sola en verde; commit.

### Task 2: Web

**Files:** `apps/web/src/api/charters.ts` (`useAccesos`, `useCompartir`, `useQuitarAcceso`), nuevo `pantallas/ficha/DialogoCompartir.tsx`, `Ficha.tsx` (botón, avisos y `volverA` por `rol`), `pantallas/portafolio/FilaCharter.tsx` (chip y «de X»), `test/simular-api.ts` si hace falta.

- [ ] Prueba del diálogo: agrega un correo, muestra «Pendiente de registro», cambia rol y quita.
- [ ] Implementar; lint, build y suite web en verde; una ronda de capturas; commit.
- [ ] Documentación: `docs/arquitectura.md` (§12 y API), CLAUDE.md y PENDIENTES.md.
