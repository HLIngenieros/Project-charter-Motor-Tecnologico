# Arquitectura · Project Charters Grupo HL

Definición técnica de la plataforma. Complementa el [README](../README.md) (qué hace y por qué) y el [análisis del Excel](analisis-plantilla-excel.md) (contenido y fórmulas). El orden de construcción está en el [plan de implementación](plan-implementacion.md).

> **Versión:** 1.0 · 2026-11-09 · Aprobada en conversación con Juan David Urbina.
> Las decisiones marcadas como *(criterio técnico)* las tomó Claude al redactar; se pueden revisar.

---

## 1. Principios

1. **Sistema independiente.** No comparte base de datos, sesión, usuarios, código ni despliegue con HorasHombre (HH) ni con otro sistema de HL. Usa herramientas conocidas (Node, Fastify, Drizzle), pero no depende de nada externo.
2. **Simple a propósito.** Hay dos perfiles (usuario y Admin), sin flujos de aprobación, sin jerarquías y sin permisos por área. No se debe crecer hacia el modelo de HH.
3. **Cada charter es de su dueño.** Lo crea, lo edita y le hace seguimiento una sola persona. El aislamiento se aplica en el backend.
4. **Multiárea.** La puede usar cualquier área de la empresa. El área es un dato descriptivo del charter, no un permiso.
5. **Web responsive.** Está pensada para escritorio y se puede usar en el celular para consultar un charter y registrar un corte.
6. **Cálculo único.** Las fórmulas viven en un solo paquete que usan el frontend (recálculo inmediato) y el backend (cortes y reportes).

## 2. Perfiles y permisos

| Acción | Usuario | Admin |
|---|---|---|
| Registrarse e iniciar sesión | Sí | Sí |
| Crear, editar y eliminar **sus** charters | Sí | Sí *(criterio técnico: el Admin es un usuario con un permiso extra; también puede tener charters propios)* |
| Ver charters de **otros** | No | Sí, **solo lectura** |
| Editar charters de otros | No | No |
| Gestionar catálogos (categorías, áreas) | No | Sí |
| Gestionar cuentas (ver, desactivar, reactivar, restablecer clave, otorgar o quitar Admin) | No | Sí |

- **Registro libre:** correo y clave. El correo debe terminar en `@hlingenieros.com` (sin distinguir mayúsculas). No se envía correo de confirmación.
- **Primer Admin:** se crea por línea de comandos (`npm run admin -- --promover correo@hlingenieros.com`) sobre una cuenta ya registrada. Desde ahí, un Admin puede otorgar el permiso a otros desde la pantalla de cuentas.
- **Olvido de clave:** como no hay servidor de correo, la clave la restablece un Admin. Se genera una clave temporal y el usuario debe cambiarla al entrar *(criterio técnico)*.
- **Cuenta desactivada:** no puede iniciar sesión y sus sesiones abiertas se cierran. Sus charters se conservan y el Admin los sigue viendo.

## 3. Stack

| Capa | Tecnología | Motivo |
|---|---|---|
| Lenguaje | TypeScript en todo el proyecto | Tipos compartidos entre web, API y cálculo |
| Monorepo | npm workspaces | Sin herramientas extra; Node 24 ya está instalado |
| Frontend | React 19 + Vite + React Router | Estándar, rápido en desarrollo |
| Estilos | Tailwind CSS v4 con tokens de la identidad HL | Coherencia con el Informe global |
| Datos en el cliente | TanStack Query | Caché, recarga y estados de carga |
| Formularios | React Hook Form + Zod | Validación compartida con la API |
| Animación | Motion | Transiciones, entradas escalonadas, contadores |
| Gráficas | Apache ECharts | Curva S, Gantt, avance por grupo e indicadores |
| Backend | Fastify 5 | Liviano, con validación por esquema |
| ORM | Drizzle ORM + migraciones de drizzle-kit | SQL explícito y migrable a PostgreSQL |
| Base de datos | SQLite (better-sqlite3) en un archivo | Cero instalación; basta para el uso esperado |
| Claves | argon2id | Hash recomendado |
| Pruebas | Vitest (cálculo, API) y Playwright (flujos clave) | — |
| Fuentes | Sora, Plus Jakarta Sans y JetBrains Mono, servidas desde el propio proyecto | Funciona sin internet en un servidor interno |

## 4. Estructura del repositorio

```
ProjectCharter/
├── apps/
│   ├── api/                  # Fastify
│   │   ├── src/
│   │   │   ├── db/           # esquema Drizzle, conexión, migraciones
│   │   │   ├── auth/         # registro, login, sesiones, guardas
│   │   │   ├── modulos/      # charters, cronograma, cortes, indicadores, riesgos, presupuesto, admin
│   │   │   ├── cli/          # comandos (promover Admin, respaldo)
│   │   │   └── servidor.ts
│   │   └── test/
│   └── web/                  # React + Vite
│       ├── src/
│       │   ├── app/          # rutas, layout, proveedores
│       │   ├── pantallas/    # login, portafolio, charter, admin
│       │   ├── componentes/  # UI reutilizable (botones, tablas, tarjetas…)
│       │   ├── graficas/     # curva S, Gantt, barras, medidores
│       │   ├── estilos/      # tokens y CSS de impresión
│       │   └── api/          # cliente HTTP y hooks de TanStack Query
│       └── public/fuentes/
├── packages/
│   └── shared/               # @charter/shared
│       ├── src/esquemas/     # Zod: entradas y respuestas de la API
│       ├── src/calculo/      # motor de cálculo (funciones puras)
│       └── test/fixtures/    # cronograma del Excel exportado a JSON
├── data/                     # charters.db (ignorado por git)
├── scripts/                  # extracción del Excel a fixture (Python)
└── docs/
```

## 5. Modelo de datos

Convenciones: identificadores `TEXT` con UUID v7 *(criterio técnico: ordenables y no adivinables)*. Fechas de negocio como texto `YYYY-MM-DD`; marcas de tiempo en ISO UTC. Porcentajes y pesos se guardan como fracción `REAL` de 0 a 1. Montos en `INTEGER` (pesos colombianos, sin decimales). Todas las tablas tienen `creado_en` y `actualizado_en`.

### 5.1 Cuentas y catálogos

| Tabla | Campos |
|---|---|
| `usuario` | id, correo (único, en minúsculas), nombre, hash_clave, es_admin, activo, debe_cambiar_clave |
| `sesion` | id (token aleatorio de 32 bytes; se guarda su hash SHA-256), usuario_id, expira_en, ultimo_uso |
| `categoria` | id, nombre, color, color_fondo, activa, orden |
| `area` | id, nombre, activa, orden |

- Datos iniciales de `categoria`: los tres ejes del Comité (Automatización `#D98A00`/`#FBF1DF`, Análisis de Data `#6A55D8`/`#EEEBFB`, Gestión del Conocimiento `#0A9C9B`/`#E1F4F3`).
- El área es un catálogo administrado, no texto libre, para poder filtrar el portafolio *(criterio técnico)*. Los catálogos se desactivan, no se borran, si algún charter los usa.

### 5.2 Charter

| Tabla | Campos |
|---|---|
| `charter` | id, propietario_id, nombre, codigo (opcional, ej. "A1"), categoria_id?, area_id?, responsable, patrocinador, revision, razon_de_ser, objetivo_general, estado (`activo` · `pausado` · `cerrado` · `cancelado`), umbral_atencion (10), umbral_riesgo (25), umbral_atraso (50) — puntos de brecha, §4.4 del análisis |
| `item_lista` | id, charter_id, tipo (`objetivo` · `supuesto` · `criterio_exito`), texto, orden |
| `riesgo` | id, charter_id, riesgo, causa, mitigacion, orden |
| `indicador` | id, charter_id, nombre, formula, meta_operador (`>=` · `<=` · `=`), meta_valor, meta_unidad, observaciones, orden |
| `medicion` | id, indicador_id, periodo (`YYYY-MM-DD`), valor, nota |
| `rubro` | id, charter_id, descripcion, valor, orden |
| `rubro_detalle` | id, rubro_id, concepto, cantidad, valor_unitario, orden |

- El estado del charter lo cambia el dueño; no implica aprobación. Solo filtra el portafolio.
- Si un rubro tiene detalle, su valor es la suma del detalle. Si no lo tiene, el valor se digita.

### 5.3 Cronograma y cortes

| Tabla | Campos |
|---|---|
| `actividad` | id, charter_id, padre_id?, orden, nombre, entregable?, peso?, inicio?, fin? |
| `actividad_responsable` | actividad_id, nombre, orden |
| `corte` | id, charter_id, fecha (única por charter), nota, pv_proyecto, ev_proyecto, desv_proyecto |
| `avance` | corte_id, actividad_id (sin clave foránea), item, nombre, pct_real, peso, inicio, fin |

`charter.cronograma_version` (entero) sube con cada `PUT` del cronograma y sirve para detectar ediciones simultáneas (ver §7).

- **Árbol:** `padre_id` + `orden`. El ítem (1, 1.1, 1.1.1…) se calcula, no se guarda. Una actividad sin hijas es **hoja**; con hijas, **agrupadora**. Peso, fechas y % real solo aplican a hojas; en una agrupadora esos campos se ignoran.
- **Responsables:** texto libre (personas o roles); no son usuarios del sistema.
- **Un corte es completo:** guarda el % real de **todas** las hojas programadas en ese momento. El formulario se precarga con los valores del corte anterior.
- **Foto de la línea base en cada corte:** `avance` copia el peso, el inicio y el fin de la hoja al momento del corte. El dueño puede editar la línea base libremente, y aun así la curva S real y los reportes de cortes pasados no cambian. Los totales del proyecto (`pv_proyecto`, `ev_proyecto`, `desv_proyecto`) también quedan guardados para listar cortes sin recalcular.
- **Eliminar una hoja** que ya tiene avances: se permite con confirmación. Sus avances históricos se conservan (`actividad_id` queda huérfano y se muestra como "actividad eliminada"). La clave foránea no aplica borrado en cascada sobre `avance`.
- **Editar un corte pasado:** se permite cambiar el % real y la nota; la foto de la línea base no se toca, y los totales del corte se recalculan con esa foto.
- **Una hoja con cortes recibe hijas** (pasa a agrupadora): se permite con aviso. Sus avances pasados quedan en las fotos de esos cortes, de modo que los cortes y la curva real no cambian. Desde el siguiente corte, el % real se registra en las nuevas hijas *(criterio técnico)*.

### 5.4 Qué línea base usa cada cálculo *(criterio técnico)*

| Vista | Línea base | Avances |
|---|---|---|
| Situación de un corte registrado (resumen, lista de cortes, PDF de ese corte) | La **foto** de ese corte | Los de ese corte |
| Situación actual o a una fecha sin corte | La línea base **actual** | Los del último corte con fecha ≤ la consultada |
| Curva S planeada | La línea base **actual** (es el plan vigente) | — |
| Curva S real | — | `ev_proyecto` de cada corte (calculado con su foto) |

El selector de fecha del resumen ofrece "hoy" y las fechas de los cortes registrados. El motor no distingue entre ambos casos: siempre recibe un árbol y unos avances, y quien lo llama arma el árbol con la línea base actual o con la foto del corte.

### 5.5 Estado del charter *(criterio técnico)*

- `activo` y `pausado`: el dueño puede editar.
- `cerrado` y `cancelado`: el charter queda en solo lectura. El único cambio permitido es reabrirlo (volver a `activo`), y solo lo puede hacer el dueño. La guarda de escritura revisa el dueño y el estado.

## 6. Motor de cálculo (`packages/shared/src/calculo`)

Son funciones puras sin dependencias de base de datos ni de React. Implementan exactamente la [§4 del análisis](analisis-plantilla-excel.md#4-cálculos-de-la-plataforma).

```ts
construirArbol(actividades)                  → NodoArbol[]  // con ítem y niveles
calcularCronograma(arbol, avances, fecha)    → ResultadoNodo por actividad
                                               // dur, PV, EV, desv, SPI, forecast, estado
curvaSPlaneada(arbol, desde, hasta)          → { fecha, pv }[] semanal
curvaSReal(cortes)                           → { fecha, ev }[]   // usa las fotos
avancePorGrupo(resultado)                    → PV vs EV por agrupadora de nivel 1
validarCronograma(arbol)                     → avisos (suma de pesos, fechas, sin programar)
cumplimientoIndicador(meta, valor)           → { pct, estado }
hojasProgramadas(arbol)                      → hojas con peso > 0 y fechas válidas (las que entran en un corte)
totalesDeFoto(foto, fecha, terminadas)       → totales del proyecto con la foto de un corte
terminacionesPorHoja(cortes)                 → fecha del primer corte en que cada hoja llegó al 100 %
```

- **Fechas:** se trabaja en días enteros desde una época, sin zona horaria. No se usa `Date` local para restar fechas.
- **Precisión:** se calcula en `number` y se redondea solo al mostrar (2 decimales en %, enteros en días).
- **Prueba de aceptación:** el cronograma de la hoja ID & TI se exporta a JSON con `scripts/extraer_fixture.py` (openpyxl). Al corte del 13-mar-2025 el motor debe dar **planeado 12,51 % y real 12,47 %**, y el % planeado de cada hoja debe coincidir con la columna K. Así lo establece la §4.9 del análisis.

## 7. API

REST con JSON bajo `/api`. Todas las rutas, salvo registro y login, exigen sesión. Las entradas se validan con los esquemas Zod de `@charter/shared`.

| Recurso | Rutas |
|---|---|
| Auth | `POST /auth/registro` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/yo` · `POST /auth/cambiar-clave` |
| Catálogos (lectura) | `GET /categorias` · `GET /areas` |
| Charters | `GET /charters` (los míos) · `POST /charters` · `GET/PATCH/DELETE /charters/:id` |
| Listas | `PUT /charters/:id/listas/:tipo` (reemplaza la lista ordenada) |
| Cronograma | `GET /charters/:id/cronograma` · `PUT /charters/:id/cronograma` (guarda el árbol completo en una transacción) |
| Cortes | `GET /charters/:id/cortes` · `GET/PUT/DELETE /charters/:id/cortes/:fecha` |
| Indicadores | `PUT /charters/:id/indicadores` · `PUT /indicadores/:id/mediciones` |
| Riesgos | `PUT /charters/:id/riesgos` |
| Presupuesto | `PUT /charters/:id/presupuesto` |
| Admin | `GET /admin/charters` (todos, con filtros) · `GET /admin/charters/:id` · `GET/PATCH /admin/usuarios/:id` · `POST /admin/usuarios/:id/restablecer-clave` · CRUD `/admin/categorias` y `/admin/areas` |

- **Guardado por bloques** *(criterio técnico)*: listas, cronograma, riesgos, indicadores y presupuesto se envían completos con `PUT`. Simplifica la edición en línea y el reordenamiento. El volumen es pequeño (un cronograma grande tiene unas 200 filas).
- **Aislamiento:** un solo punto de control, `cargarCharter(id, usuario, modo)`. Con `modo = 'escritura'` exige que el usuario sea el dueño. Con `modo = 'lectura'` acepta al dueño o a un Admin. Si el charter es de otro, responde **404** (no 403), para no revelar que existe. Hay pruebas de API que verifican que un usuario no puede leer ni escribir charters ajenos por ninguna ruta.
- **Concurrencia:** cada charter tiene un solo editor, así que se aplica "el último guardado gana". El `PUT` del cronograma envía `version` (`charter.cronograma_version`); si no coincide, la API responde 409 `cronograma_desactualizado` y la web muestra «El cronograma cambió en otra pestaña» con «Recargar». No se usa `actualizado_en` porque los `PATCH` del encabezado lo cambian y darían falsos 409.
- **Cortes:** `PUT /cortes/:fecha` crea el corte con la foto de la línea base vigente o, si ya existe en esa fecha, edita su % y su nota sin tocar la foto. Códigos propios: `fecha_futura`, `corte_anterior` (un corte nuevo no puede ir antes del último), `sin_hojas_programadas`, `actividad_invalida`; en el cronograma, `id_invalido` (id de otro charter).
- **Errores:** formato único `{ error: { codigo, mensaje, campos? } }`, con mensajes en español.

## 8. Autenticación y seguridad

- **Clave:** mínimo 8 caracteres, sin otras reglas de composición *(decisión del usuario, 2026-11-09)*. Se guarda con argon2id.
- **Sesión:** token aleatorio en una cookie `charter_sesion` con `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` cuando corre en HTTPS. En la base se guarda solo el hash del token. La sesión dura 7 días y se renueva con el uso *(criterio técnico)*. Logout, desactivación y cambio de clave borran las sesiones.
- **CSRF:** la web y la API se sirven en el mismo origen. Con `SameSite=Lax`, y como las mutaciones exigen `Content-Type: application/json` y una cabecera `X-Requested-With`, no hace falta un token adicional.
- **Fuerza bruta:** se limita el login a 10 intentos por 15 minutos por correo y por IP (`@fastify/rate-limit`).
- **Cabeceras:** se usa `@fastify/helmet` con una política CSP propia (las fuentes son locales y no se usan CDN).
- **Registro:** el dominio se valida en la API, no solo en la web. Un correo ya registrado da un error genérico.

## 9. Frontend

### 9.1 Pantallas

| Ruta | Pantalla |
|---|---|
| `/entrar`, `/registro` | Login y registro: una tarjeta centrada con la marca e ingreso animado |
| `/` | **Portafolio:** tarjetas de mis charters con categoría, área, % real frente al planeado, semáforo y último corte. Filtros por estado, categoría y área |
| `/charters/nuevo` | Creación rápida (nombre, categoría, área); después se completa en la ficha |
| `/charters/:id` | **Ficha del charter**: documento vivo en el orden de la hoja ID & TI, con índice lateral (ver `docs/pantallas.md`) |
| `/charters/:id/corte` | **Registrar corte**; con `?fecha=` edita ese corte sobre su foto |
| `/charters/:id/imprimir` | Vista A4 para exportar a PDF |
| `/cuenta` | Cambiar nombre y clave |
| `/admin/charters` | Todos los charters, en solo lectura (reutiliza la ficha sin controles de edición) |
| `/admin/usuarios`, `/admin/catalogos` | Gestión de cuentas, categorías y áreas |

La disposición y el detalle visual de cada pantalla se definen en la tarea T1.3 del plan, con maquetas.

### 9.2 Comportamiento

- **Portafolio:** cada tarjeta muestra la situación **al último corte** (planeado y real a esa misma fecha, para no inventar atrasos). Si el último corte tiene más de 14 días o no hay cortes, se muestra una etiqueta "corte desactualizado". La API calcula y devuelve estos datos en `GET /charters` a partir de los totales guardados *(criterio técnico)*.
- **Resumen:** KPIs animados (planeado, real, desviación, fecha proyectada), curva S, avance por grupo, Gantt compacto y selector de fecha de corte que recalcula todo en el cliente.
- **Cronograma:** tabla-árbol editable en línea (crear, indentar, sacar de nivel, mover, eliminar), con columnas A–J editables y K–N calculadas al instante. El Gantt queda al lado y se sincroniza (arrastre de barras y extremos). Los avisos de validación se muestran en línea. Se **guarda solo**: el árbol completo se envía 800 ms después del último cambio por la cola de guardado de la ficha, y cada `PUT` lleva la versión que devolvió el anterior *(cambio en la Fase 4: la ficha es documento vivo y el Gantt se edita arrastrando)*.
- **Cortes:** historial al final de la ficha (fecha, estado, planeado, real, brecha, nota; editar y eliminar). Registrar un corte muestra «solo lo que toca»: vencidas y en curso a la fecha elegida, el resto plegado, cada hoja precargada con el % del corte anterior y su planeado a esa fecha, y un resumen en vivo. La banda de la ficha muestra la situación actual (línea base vigente + avances del último corte, a la fecha de ese corte).
- **Modo lectura:** el mismo componente de ficha recibe `soloLectura` y oculta los controles. Lo usan el Admin y los charters cerrados o cancelados.
- **Indicadores:** el semáforo usa umbrales fijos (≥ 100 % verde, 80–99 % atención, < 80 % rojo); no se configuran por charter en la v1 *(criterio técnico)*.
- **Responsive:** desde 360 px. En el celular la ficha usa pestañas deslizables, el cronograma muestra columnas reducidas y el Gantt se desplaza en horizontal. Registrar un corte debe ser cómodo en el celular.
- **Movimiento:** se usa Motion para transiciones de ruta, listas escalonadas, contadores y barras que se llenan, y se respeta `prefers-reduced-motion`.
- **Formato:** español de Colombia (`es-CO`): fechas `dd-mmm-aaaa`, porcentajes con coma decimal y montos en COP.

### 9.3 Exportar a PDF

Se usa una ruta de impresión con CSS `@page { size: A4 }`, al estilo del Informe global, y el usuario imprime a PDF desde el navegador *(criterio técnico: no requiere Chromium en el servidor)*. Las gráficas de ECharts se renderizan en SVG para que salgan nítidas.

## 10. Despliegue

### Ahora: local

- `npm install` y `npm run dev` levantan la API (puerto 3100) y Vite (5173) con proxy de `/api`.
- La base queda en `data/charters.db` y las migraciones se aplican al arrancar.
- El perfil Admin se otorga con `npm run admin -- --promover <correo>` (la cuenta debe estar registrada) y se retira con `--quitar`.

### Después: servidor interno

- `npm run build` genera la web estática, y Fastify la sirve junto con la API en **un solo proceso y un solo puerto**.
- Se configura con un `.env` en la raíz (plantilla en `.env.ejemplo`; la API y el CLI lo cargan al arrancar): `PUERTO`, `RUTA_DB`, `DOMINIO_PERMITIDO=hlingenieros.com`, `COOKIE_SEGURA` y `CONFIAR_PROXY`. Detrás de IIS, `CONFIAR_PROXY=true` para que el límite de intentos use la IP real del cliente y no la del proxy.
- En Windows Server se corre como servicio (NSSM o PM2) detrás de IIS o de otro proxy con HTTPS.
- **Respaldo:** `npm run respaldo` usa la API de backup de SQLite para copiar la base en caliente. En el servidor se programa a diario.
- **Migración a PostgreSQL:** solo si el uso lo exige. Drizzle lo permite cambiando el dialecto y regenerando las migraciones.

## 11. Calidad

- **Motor de cálculo:** pruebas unitarias exhaustivas más la prueba de aceptación contra el Excel.
- **API:** pruebas de integración con SQLite en memoria para auth, aislamiento por dueño, permisos de Admin y guardado del cronograma.
- **E2E (Playwright), pocos y valiosos:** registro → crear charter → cronograma → corte → ver curva S; y Admin en solo lectura.
- TypeScript estricto, ESLint y Prettier.

## 12. Fuera de alcance (por ahora)

- Compartir charters o tener varios editores.
- Flujos de aprobación, control de cambios formal y roles intermedios.
- Notificaciones y correos.
- Importar el Excel desde la interfaz (el Excel solo se usa como fixture de pruebas).
- Integración con HH, Libra, Procore u otros sistemas.

## 13. Registro de decisiones

| Fecha | Decisión | Origen |
|---|---|---|
| 2026-11-09 | Sistema totalmente independiente de HH; no escala al modelo de HH | Usuario |
| 2026-11-09 | Multiárea; perfiles: usuario y Admin (lectura de todo + parametrización) | Usuario |
| 2026-11-09 | Registro libre con correo `@hlingenieros.com`, solo validación de dominio | Usuario |
| 2026-11-09 | Sin aprobación de charters: solo creación y seguimiento | Usuario |
| 2026-11-09 | Despliegue local ahora; servidor interno después | Usuario |
| 2026-11-09 | Web responsive, principalmente de escritorio | Usuario |
| 2026-11-09 | Línea base editable; cada corte guarda una foto de pesos y fechas | Claude |
| 2026-11-09 | Área como catálogo administrado; el Admin también puede tener charters propios | Claude |
| 2026-11-09 | El Admin restablece claves (no hay correo) | Claude |
| 2026-11-09 | Guardado por bloques con PUT; cronograma con guardado explícito | Claude |
| 2026-11-10 | Cronograma con guardado automático (800 ms) y concurrencia por `cronograma_version`; reemplaza el guardado explícito | Claude |
| 2026-11-09 | PDF por impresión del navegador | Claude |
| 2026-11-09 | Cortes pasados usan su foto; situación actual y curva planeada usan la línea base vigente | Claude |
| 2026-11-09 | Portafolio muestra la situación al último corte, con aviso si tiene más de 14 días | Claude |
| 2026-11-09 | Charter cerrado o cancelado queda en solo lectura; el dueño lo puede reabrir | Claude |
