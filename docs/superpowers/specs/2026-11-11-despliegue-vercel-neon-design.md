# Despliegue en Vercel + Neon · Diseño

**Fecha:** 2026-11-11 · **Estado:** aprobado en conversación (el usuario eligió Vercel + Neon; pide algo veloz y sin complicarse).

## Objetivo

Un link público y fijo, disponible aunque el PC esté apagado, para uso personal por ahora. Gratis: Vercel Hobby + Neon Free.

## Decisiones

| Tema | Decisión |
|---|---|
| Base | **Postgres en todas partes.** Producción: Neon (cadena *pooled*) con `pg` (`drizzle-orm/node-postgres`). Desarrollo y pruebas: **PGlite** (Postgres en WASM, sin instalar nada): archivo en `data/pglite` en desarrollo, en memoria en pruebas. Se elimina SQLite (`better-sqlite3`). |
| Datos actuales | No se migran. Las migraciones de SQLite se borran y se genera una `0000_inicial` de Postgres. RF1 se recarga a mano o con un script temporal si el usuario lo pide. |
| Esquema | Mismas tablas y columnas. `integer({mode:'boolean'})` → `boolean`, `real` → `doublePrecision`. Fechas y marcas siguen como `text` ISO (no cambia el contrato de la API). |
| API | Toda la capa de datos pasa a `async` (`.get()` → primer elemento de `await …limit(1)`, `.run()`/`.all()` → `await`). `r.changes` → `.returning()` y largo. Error de único: código `23505`. |
| Concurrencia del cronograma | La verificación de `cronograma_version` pasa dentro de la transacción con `UPDATE … WHERE cronograma_version = :v` (en Postgres ya no hay atomicidad gratis por ser síncrono). |
| Migraciones | No en cada arranque en frío: `npm run migrar` (migra y siembra) en el build de Vercel. En desarrollo y pruebas, `crearDb` sigue migrando al abrir. |
| Vercel | Un solo proyecto desde la raíz del repo: web estática (`apps/web/dist`) + una función `api/index.js` que reenvía a Fastify (`app.server.emit('request')`). Rewrites: `/api/(.*)` → `/api`; el resto → `/index.html` (SPA). Mismo origen: la cookie y el CSRF no cambian. Región `iad1` (Neon en `us-east-1`). |
| Fecha de hoy | `hoyISO` usa `America/Bogota` (Vercel corre en UTC). Cierra el pendiente de la prueba de zona horaria. |
| Acceso | `CORREOS_PERMITIDOS` (lista separada por comas, opcional). Si está definida, solo esos correos pueden registrarse (403 `correo_no_permitido`). |
| Entorno de producción | `DATABASE_URL`, `COOKIE_SEGURA=true`, `CONFIAR_PROXY=true`, `DOMINIO_PERMITIDO`, `CORREOS_PERMITIDOS`. |

## Fuera de alcance

- Límite de intentos compartido entre instancias (queda en memoria por instancia; aceptable para uso personal).
- Respaldo propio: se usa el historial de Neon. `npm run respaldo` (SQLite) desaparece de la documentación.
- Dominio propio: se usa `*.vercel.app`.
