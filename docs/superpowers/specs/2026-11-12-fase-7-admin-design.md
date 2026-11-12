# Fase 7 · Admin — diseño

Fecha: 2026-11-12 · Estado: borrador para aprobación · Tareas: T7.1, T7.2, T7.3 (T7.4 ya está hecha).

## Intención

La app se va a publicar (Fase 8) y el usuario será su Admin. Necesita tres cosas que hoy solo existen en la base o en el CLI:

1. **Cuentas:** atender a quien olvidó su clave, cerrar el acceso a quien ya no debe entrar y nombrar otros Admin, sin tocar la consola.
2. **Catálogos:** hoy hay 3 categorías sembradas y **ninguna área**; los charters quedan sin área y no se pueden agrupar por ella.
3. **Lectura total:** ver el estado del conjunto de charters, no uno por uno. El usuario eligió una vista **consolidada** (tablero con cifras y semáforo por área y categoría + tabla con filtros) y decidió que **también la tenga cada usuario** sobre sus propios charters.

Éxito: el Admin puede operar la app publicada sin CLI, y cualquiera abre el portafolio y entiende de un vistazo cómo va su conjunto.

## No-metas

- Sin envío de correos (ni recuperación de clave por correo).
- Sin borrado de cuentas; solo desactivar.
- Sin roles intermedios ni aprobaciones (decisión del 2026-11-09).
- El Admin no edita charters ajenos (ya lo garantiza `acceso.ts`).
- Sin pantalla de tablero aparte: el tablero vive en el portafolio.

## Decisiones del usuario

- Olvido de clave: en **Entrar**, «¿Olvidaste tu clave? Contacta al administrador del sistema».
- Categorías: las 3 del Comité + una nueva **«Default»**, sembrada. Las áreas las crea el Admin.
- Lectura total = **opción A** de la maqueta: cifras arriba, semáforo por área y por categoría, tabla con filtros (dueño, área, categoría, estado).
- El tablero lo ve **todo usuario** con sus charters; el Admin además alterna **«Mis charters / Todos»**.

## 1 · Cuentas (T7.1)

### Web

- **Entrar:** bajo el botón, texto «¿Olvidaste tu clave? Contacta al administrador del sistema.» (sin enlace).
- **Admin › Cuentas** (`/admin/cuentas`, nueva pestaña en `AreaAdmin` antes de Parametrización; el enlace «Administración» de `MenuUsuario` pasa a apuntar a `/admin/cuentas`):
  - Tabla: nombre, correo, rol (chip «Admin»), estado (Activa / Desactivada), n.º de charters, último acceso (`max(sesion.ultimo_uso)`, «nunca» si no hay sesiones; _aproximación, ver Calls_), y menú de acciones por fila.
  - Búsqueda por nombre o correo; filtro Activas / Desactivadas / Todas. En celular, cada cuenta como bloque.
  - Acciones, con diálogo de confirmación:
    - **Restablecer clave:** el servidor genera una clave temporal; el diálogo la muestra **una sola vez** con botón «Copiar» y el texto «Pásasela a la persona; al entrar deberá cambiarla».
    - **Desactivar / Reactivar.**
    - **Dar / Quitar Admin.**
  - En la fila propia, «Desactivar» y «Quitar Admin» no aparecen (o deshabilitados con explicación).
- **Cambiar clave** (`/cuenta/clave`): pantalla nueva (hoy no existe; el portafolio solo muestra un aviso). Campos: clave actual, nueva, confirmar (reutiliza `CampoClave`). Usa `POST /api/auth/cambiar-clave` existente.
  - Con `debeCambiarClave`, `RutaProtegida` lleva a `/cuenta/clave` desde cualquier ruta; el texto explica que la clave fue restablecida. Al guardar, va al portafolio. Se quita el aviso actual del portafolio.
  - Sin `debeCambiarClave`, se llega desde `MenuUsuario` («Cambiar clave»).

### API (`/api/admin/cuentas`, con `exigirAdmin`)

- `GET /` → lista de `CuentaAdmin { id, nombre, correo, esAdmin, activo, debeCambiarClave, charters, ultimoAcceso | null, creadoEn }`.
- `POST /:id/restablecer-clave` → `{ claveTemporal }`. Genera una clave aleatoria legible (≥ 12 caracteres, sin caracteres ambiguos), la cifra, pone `debeCambiarClave = true` y llama a `cerrarSesionesDe` (todas).
- `PATCH /:id` con `{ activo?, esAdmin? }`. Desactivar llama a `cerrarSesionesDe`. Reglas:
  - 400 `sobre_si_mismo` si el Admin intenta desactivarse o quitarse el rol.
  - 409 `ultimo_admin` si la operación dejaría el sistema sin Admin activo.
  - 404 si la cuenta no existe.
- La CLI `npm run admin` se conserva (sirve para el primer Admin).
- El login ya rechaza cuentas inactivas (403 `cuenta_inactiva`) y la guarda ya bloquea rutas fuera de `/api/auth/` con `debeCambiarClave`.

### Pruebas clave

- Reactivar no revive una cookie vieja (criterio del plan general).
- Restablecer cierra las sesiones y la clave temporal permite entrar solo para cambiarla.
- `sobre_si_mismo` y `ultimo_admin`.
- No-Admin recibe 403 `solo_admin` en todo `/api/admin/cuentas`.

## 2 · Catálogos (T7.2)

### Datos

- Semilla: nueva categoría **«Default»** con id fijo, color neutro de la paleta, `orden` 0 (primera). Migración con `INSERT … ON CONFLICT DO NOTHING` o vía `sembrar` (idempotente).
- Columna nueva `categoria.protegida boolean default false` (true solo para Default). _Call: alternativa sería comparar con el id fijo; la columna es más clara._

### Web · Admin › Catálogos (`/admin/catalogos`)

- Dos bloques: **Categorías** y **Áreas**. Cada fila: nombre editable en su sitio, (categorías) color, n.º de charters que la usan, Activa/Inactiva, subir/bajar orden, menú (desactivar/reactivar, eliminar).
- Color de categoría: **paleta fija de ~8 pares** (`color` punto + `colorFondo` chip) que pasan contraste con texto `tinta`; incluye los 3 actuales y un neutro para Default. Sin selector libre.
- «Agregar categoría» / «Agregar área» al final de cada bloque.
- **Eliminar** solo si nadie la usa (n.º = 0); si no, solo desactivar. Default no se puede eliminar ni desactivar.
- Inactivas: no salen en los formularios (nuevo charter, encabezado de la ficha), pero los charters que ya las tienen las conservan y se ven (comportamiento actual de catálogos inactivos).
- Guardado inmediato por acción (no hay borrador de colección como en complementos); renombrar guarda al salir del campo.

### API (`/api/admin/catalogos`, con `exigirAdmin`)

- `GET /categorias`, `GET /areas` → incluyen inactivas y `charters` (conteo).
- `POST /categorias`, `POST /areas` → crear (nombre obligatorio, único sin distinguir mayúsculas ni tildes: 409 `nombre_repetido`).
- `PATCH /categorias/:id`, `PATCH /areas/:id` → `{ nombre?, color?, activa?, orden? }`; color validado contra la paleta (400). Sobre Default, `activa: false` → 409 `protegida`.
- `DELETE …/:id` → 409 `en_uso` si hay charters; 409 `protegida` para Default.
- Los `GET /api/categorias` y `/api/areas` públicos siguen igual.

### Nuevo charter

- `DialogoNuevoCharter` preselecciona **Default**. Los charters existentes sin categoría no se tocan.

## 3 · Tablero en el portafolio (T7.3)

### Alcance

- **Usuario:** arriba de «Mis charters», el tablero sobre sus charters.
- **Admin:** selector segmentado **«Mis charters / Todos»** junto al título (en la URL: `?ver=todos`). En «Todos», título «Todos los charters», el tablero y la tabla cubren a todos, aparece la columna **Dueño** y el filtro **Dueño**; el botón «Nuevo charter» se mantiene.
- Abrir un charter ajeno lleva a la ficha en solo lectura (ya funciona).

### Tablero (opción A)

Se calcula en la web sobre la lista **ya filtrada** por los filtros del portafolio (salvo el propio clic de barra, ver abajo), con los totales guardados del último corte (`ultimoCorte`), como el resto del portafolio.

- **Cifras** (4):
  1. **Activos:** charters en estado activo.
  2. **En rojo o vencidos:** activos cuyo `estado` global del último corte es `atrasada` o `vencida`.
  3. **Avance:** «X % real de Y % planeado», promedio simple de `ev` y `pv` de los activos con corte. _Call: promedio simple; los charters no tienen peso entre sí._
  4. **Sin corte reciente:** activos sin corte o con último corte de hace más de **30 días** (fecha de hoy de Bogotá). _Call: 30 días fijo, no parametrizable por ahora._
- **Segmentos del semáforo** (por el `estado` global del último corte, el mismo que pinta el chip del portafolio; así las barras suman exactamente los activos). _Call:_
  - verde = `al_dia` y `terminada`; amarillo = `en_atencion`; naranja = `en_riesgo`; rojo = `atrasada`; vencida = `vencida`;
  - **neutro** «Sin corte o sin iniciar» = sin corte, `por_iniciar` y `sin_programar`.
  - Las hojas vencidas dentro de un charter en otro color **no** lo mueven de segmento; eso lo sigue cubriendo el filtro «Con vencidas» y el chip de la fila.
- **Semáforo por área** y **por categoría:** una barra apilada por grupo con los segmentos de arriba y su conteo; «Sin área» / «Sin categoría» como grupo propio si hay. Solo charters activos. Tonos del semáforo existentes (amarillo con borde `amarillo-texto`).
- **Interacción:** clic en un segmento filtra la tabla por ese grupo y ese estado (filtro nuevo `semaforo` en la URL); un chip «Financiera · rojo ×» lo quita. _Call._ Barras accesibles: cada segmento es un botón con etiqueta «Financiera: 2 en rojo».
- Con 0 charters, el tablero no se muestra (queda el estado vacío actual). En celular: cifras en 2 × 2 y barras a todo el ancho.
- Animación: entrada de barras y cifras con `Cifra`/Motion, respetando `prefers-reduced-motion`.

### API

- `GET /api/charters?ver=todos` (solo Admin; un no-Admin con `ver=todos` recibe 403 `solo_admin`). Sin el parámetro, igual que hoy (solo los propios, también para el Admin).
- `CharterResumen` gana `propietario: { id, nombre }` (en ambas vistas; la web solo lo muestra en «Todos»).

### Filtros

- `FiltrosPortafolio` suma `dueno` (`'todos' | id`) y `semaforo` (`{ eje: 'area' | 'categoria', grupo: id | 'ninguna', estado }` o nulo, serializado en la URL). `filtrarCharters` los aplica.

## Restricciones

- Mismo stack y patrones: guardas `exigirAdmin`, `ErrorApi`, Zod compartido en `packages/shared`, pruebas de API con `crearDbPrueba`/`sesionDe`, pruebas web con `simular-api.ts`.
- Migración nueva (`0002_…`): `categoria.protegida` + Default. Revisar el SQL de `drizzle-kit generate`.
- Accesibilidad y contraste como en el resto (DESIGN.md); responsive a 390 px sin desborde.

## Lo que queda al constructor

- Disposición fina de las pantallas de Cuentas y Catálogos dentro del sistema visual existente.
- Paleta exacta de colores de categoría (con prueba de contraste como `contraste.test.ts`).
- Orden de las tareas y reparto en sesiones.

## Calls de Claude (para revisar)

- `categoria.protegida` en vez de comparar con el id fijo.
- Último acceso = último uso de una sesión (si las sesiones se purgan, se pierde; aceptable).
- Avance del tablero = promedio simple; «sin corte reciente» = 30 días fijos.
- Clic en barra filtra la tabla.
- Semáforo del tablero por el estado global del último corte; terminada cuenta como verde; por iniciar y sin programar van con «sin corte» en un segmento neutro.
- No hay borrado de cuentas; no puedes desactivarte ni quitarte el Admin; nunca queda el sistema sin Admin.
- Default es la primera categoría y viene preseleccionada al crear.
