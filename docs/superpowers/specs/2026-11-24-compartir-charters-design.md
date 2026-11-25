# Compartir charters — diseño

Fecha: 2026-11-24 · Aprobado por el usuario en la conversación.

## Intención

Hoy cada charter tiene un solo dueño: solo él edita y registra cortes, y el Admin solo consulta. El usuario necesita registrar cortes en charters de otra cuenta («admin») y, en general, colaborar: el dueño comparte su charter con otras personas, como **Lector** o **Editor**, aunque todavía no tengan cuenta. Reemplaza el «Compartir charters o tener varios editores» que estaba fuera de alcance en `docs/arquitectura.md` §12.

## Metas

- El dueño comparte desde la ficha: escribe el correo, elige el rol y puede cambiarlo o quitar el acceso.
- Se puede compartir con un correo `@hlingenieros.com` que aún no tiene cuenta: el acceso queda **pendiente** y se activa solo cuando la persona se registra con ese correo.
- **Editor:** edita la ficha, el cronograma y los complementos, y registra o edita cortes. **Lector:** consulta y exporta.
- Los compartidos aparecen en el portafolio de quien los recibe, junto a los suyos, con una etiqueta del rol y el dueño. La persona sigue creando sus propios charters.

## No metas

- Transferir la propiedad de un charter (descartado: no se puede deshacer y complica la autoría).
- Enlaces públicos para compartir o compartir con un área completa.
- Enviar correos o notificaciones: el dueño le avisa a la persona por fuera; el diálogo trae «Copiar enlace».

## Antimetas

- Que alguien con acceso compartido cambie el estado, elimine o vuelva a compartir el charter.
- Revelar charters ajenos: sin acceso sigue el mismo 404.

## Enfoques

1. **Lista de accesos por charter, por correo (elegido).** Tabla `charter_acceso (charter_id, correo, rol)`. La API cruza el correo de la sesión con la lista. Como se guarda por correo, un acceso pendiente no necesita un paso de activación.
2. Enlace para compartir: un link reenviado da acceso a quien no debía y no se ve quién entra. Descartado.
3. Compartir con un área: más amplio de lo pedido y se parece a los roles intermedios que se decidió no tener. Descartado.

## Diseño

**Datos.** `charter_acceso`: `charter_id` (FK, `ON DELETE CASCADE`), `correo` (normalizado, minúsculas), `rol` (`lector` | `editor`), tiempos. Clave primaria `(charter_id, correo)`; índice por `correo`.

**Acceso (`acceso.ts`, único control).**

- `lectura`: dueño, Admin o cualquier acceso.
- `escritura`: dueño o editor, si el charter no está cerrado ni cancelado. Lector → 403 `solo_lectura` «Tienes acceso de solo lectura a este charter.»; Admin sin acceso → el 403 de siempre.
- `reapertura` (dueño en cualquier estado): reabrir, eliminar y administrar accesos.
- Cambiar el estado por PATCH exige ser el dueño (403 `solo_dueno`), aunque el editor pueda editar lo demás.

**API.**

- `GET /api/charters/:id/accesos` (dueño): `[{ correo, rol, nombre | null }]`; `nombre` nulo = pendiente de registro.
- `POST /api/charters/:id/accesos` `{ correo, rol }` (dueño): crea o cambia el rol. Valida el dominio permitido y que no sea el correo del dueño.
- `DELETE /api/charters/:id/accesos/:correo` (dueño).
- `GET /api/charters` trae los propios **y** los compartidos con mi correo. `CharterResumen.compartido: 'lector' | 'editor' | null`.
- `CharterDetalle.rol: 'dueno' | 'editor' | 'lector' | 'admin'`; `permisos` suma `compartir` (solo el dueño).

**Web.**

- Ficha: botón «Compartir» en la banda (solo el dueño) que abre un diálogo: agregar correo + rol, lista con nombre o «Pendiente de registro», selector de rol y «Quitar» por persona, y «Copiar enlace» del charter. Aviso para quien no es dueño: Lector «Charter de X · compartido contigo, solo lectura»; Editor «Charter de X · compartido contigo como editor». «Volver a Todos los charters» solo para el Admin.
- Portafolio: chip «Compartido · Editor/Lector» y «de X» en la línea de datos.
- El resto de la ficha y Registrar corte ya se gobiernan con `permisos.editar`.

## Ajuste del 2026-11-25 (usuario)

Cualquier Admin también puede compartir, cambiar el rol o quitar accesos en **todos** los charters, incluso agregarse a sí mismo como Editor. Modo `compartir` en `cargarCharter` (dueño o Admin); `permisos.compartir = dueño || Admin`. Estado, reabrir y eliminar siguen siendo solo del dueño.

## Decisiones de Claude

- Los compartidos entran también al tablero del portafolio de quien los recibe (es su vista de trabajo).
- Compartir se permite aunque el charter esté cerrado (el lector puede consultar un cierre).
- Un Admin que además recibe un acceso usa ese rol (editor puede editar).

## Para el constructor

Nombres de componentes, textos menores y la disposición exacta del diálogo.
