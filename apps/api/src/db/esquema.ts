import { ESTADOS_CHARTER, REGLAS_POR_DEFECTO, TIPOS_LISTA } from '@charter/shared'
import {
  type AnyPgColumn,
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/** Marca de tiempo ISO UTC. */
const ahora = () => new Date().toISOString()

const tiempos = {
  creadoEn: text('creado_en').notNull().$defaultFn(ahora),
  actualizadoEn: text('actualizado_en').notNull().$defaultFn(ahora).$onUpdateFn(ahora),
}

const booleano = (nombre: string) => boolean(nombre)

/** Reglas de fábrica sin los umbrales, como texto JSON (default de `charter.reglas`). */
export const REGLAS_CHARTER_DEFECTO = JSON.stringify({ ...REGLAS_POR_DEFECTO, umbrales: undefined })

// ── 5.1 Cuentas y catálogos ─────────────────────────────────────────────

export const usuario = pgTable('usuario', {
  id: text('id').primaryKey(),
  correo: text('correo').notNull().unique(),
  nombre: text('nombre').notNull(),
  hashClave: text('hash_clave').notNull(),
  esAdmin: booleano('es_admin').notNull().default(false),
  activo: booleano('activo').notNull().default(true),
  debeCambiarClave: booleano('debe_cambiar_clave').notNull().default(false),
  ...tiempos,
})

export const sesion = pgTable(
  'sesion',
  {
    /** SHA-256 (hex) del token; el token en claro solo viaja en la cookie. */
    id: text('id').primaryKey(),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'cascade' }),
    expiraEn: text('expira_en').notNull(),
    ultimoUso: text('ultimo_uso').notNull(),
    ...tiempos,
  },
  (t) => [index('sesion_usuario_idx').on(t.usuarioId)],
)

export const categoria = pgTable('categoria', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  color: text('color').notNull(),
  colorFondo: text('color_fondo').notNull(),
  activa: booleano('activa').notNull().default(true),
  orden: integer('orden').notNull().default(0),
  /** «Default»: no se puede desactivar ni eliminar. */
  protegida: booleano('protegida').notNull().default(false),
  ...tiempos,
})

export const area = pgTable('area', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  activa: booleano('activa').notNull().default(true),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

// ── 5.2 Charter ─────────────────────────────────────────────────────────

export const charter = pgTable(
  'charter',
  {
    id: text('id').primaryKey(),
    propietarioId: text('propietario_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'restrict' }),
    nombre: text('nombre').notNull(),
    codigo: text('codigo'),
    categoriaId: text('categoria_id').references(() => categoria.id, { onDelete: 'restrict' }),
    areaId: text('area_id').references(() => area.id, { onDelete: 'restrict' }),
    responsable: text('responsable').notNull().default(''),
    patrocinador: text('patrocinador').notNull().default(''),
    revision: text('revision').notNull().default(''),
    razonDeSer: text('razon_de_ser').notNull().default(''),
    objetivoGeneral: text('objetivo_general').notNull().default(''),
    estado: text('estado', { enum: ESTADOS_CHARTER }).notNull().default('activo'),
    // Brecha (planeado − real) en puntos porcentuales; spec §4.4.
    umbralAtencion: doublePrecision('umbral_atencion').notNull().default(10),
    umbralRiesgo: doublePrecision('umbral_riesgo').notNull().default(25),
    umbralAtraso: doublePrecision('umbral_atraso').notNull().default(50),
    // Reglas de cálculo copiadas al crear el charter, sin los umbrales (van en sus columnas).
    // JSON de `ReglasCharter`; el default son las reglas de fábrica (los charters de antes).
    reglas: text('reglas').notNull().default(REGLAS_CHARTER_DEFECTO),
    // Sube con cada PUT del cronograma; detecta ediciones desde otra pestaña (409).
    cronogramaVersion: integer('cronograma_version').notNull().default(0),
    ...tiempos,
  },
  (t) => [index('charter_propietario_idx').on(t.propietarioId)],
)

const charterId = () =>
  text('charter_id')
    .notNull()
    .references(() => charter.id, { onDelete: 'cascade' })

export const itemLista = pgTable('item_lista', {
  id: text('id').primaryKey(),
  charterId: charterId(),
  tipo: text('tipo', { enum: TIPOS_LISTA }).notNull(),
  texto: text('texto').notNull(),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

export const riesgo = pgTable('riesgo', {
  id: text('id').primaryKey(),
  charterId: charterId(),
  riesgo: text('riesgo').notNull(),
  causa: text('causa').notNull().default(''),
  mitigacion: text('mitigacion').notNull().default(''),
  /** 1–5; nulo = sin calificar. */
  probabilidad: integer('probabilidad'),
  impacto: integer('impacto'),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

export const indicador = pgTable('indicador', {
  id: text('id').primaryKey(),
  charterId: charterId(),
  nombre: text('nombre').notNull(),
  formula: text('formula').notNull().default(''),
  metaOperador: text('meta_operador', { enum: ['>=', '<=', '='] })
    .notNull()
    .default('>='),
  /** Nulo = sin meta. */
  metaValor: doublePrecision('meta_valor'),
  metaUnidad: text('meta_unidad').notNull().default(''),
  observaciones: text('observaciones').notNull().default(''),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

export const medicion = pgTable(
  'medicion',
  {
    id: text('id').primaryKey(),
    indicadorId: text('indicador_id')
      .notNull()
      .references(() => indicador.id, { onDelete: 'cascade' }),
    periodo: text('periodo').notNull(),
    valor: doublePrecision('valor').notNull(),
    nota: text('nota').notNull().default(''),
    ...tiempos,
  },
  (t) => [index('medicion_indicador_idx').on(t.indicadorId)],
)

export const rubro = pgTable('rubro', {
  id: text('id').primaryKey(),
  charterId: charterId(),
  descripcion: text('descripcion').notNull(),
  valor: bigint('valor', { mode: 'number' }).notNull().default(0),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

export const rubroDetalle = pgTable('rubro_detalle', {
  id: text('id').primaryKey(),
  rubroId: text('rubro_id')
    .notNull()
    .references(() => rubro.id, { onDelete: 'cascade' }),
  concepto: text('concepto').notNull(),
  cantidad: doublePrecision('cantidad').notNull().default(1),
  valorUnitario: bigint('valor_unitario', { mode: 'number' }).notNull().default(0),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

// ── 5.3 Cronograma y cortes ─────────────────────────────────────────────

export const actividad = pgTable(
  'actividad',
  {
    id: text('id').primaryKey(),
    charterId: charterId(),
    padreId: text('padre_id').references((): AnyPgColumn => actividad.id, {
      onDelete: 'cascade',
    }),
    orden: integer('orden').notNull(),
    nombre: text('nombre').notNull(),
    entregable: text('entregable'),
    peso: doublePrecision('peso'),
    inicio: text('inicio'),
    fin: text('fin'),
    ...tiempos,
  },
  (t) => [
    index('actividad_charter_idx').on(t.charterId),
    index('actividad_padre_idx').on(t.padreId),
  ],
)

export const actividadResponsable = pgTable(
  'actividad_responsable',
  {
    actividadId: text('actividad_id')
      .notNull()
      .references(() => actividad.id, { onDelete: 'cascade' }),
    nombre: text('nombre').notNull(),
    orden: integer('orden').notNull(),
    ...tiempos,
  },
  (t) => [primaryKey({ columns: [t.actividadId, t.orden] })],
)

export const corte = pgTable(
  'corte',
  {
    id: text('id').primaryKey(),
    charterId: charterId(),
    fecha: text('fecha').notNull(),
    nota: text('nota').notNull().default(''),
    pvProyecto: doublePrecision('pv_proyecto').notNull().default(0),
    evProyecto: doublePrecision('ev_proyecto').notNull().default(0),
    desvProyecto: doublePrecision('desv_proyecto').notNull().default(0),
    ...tiempos,
  },
  (t) => [uniqueIndex('corte_charter_fecha_unq').on(t.charterId, t.fecha)],
)

/** Foto de cada hoja en un corte. `actividad_id` no tiene clave foránea: sobrevive al borrado. */
export const avance = pgTable(
  'avance',
  {
    corteId: text('corte_id')
      .notNull()
      .references(() => corte.id, { onDelete: 'cascade' }),
    actividadId: text('actividad_id').notNull(),
    item: text('item').notNull(),
    nombre: text('nombre').notNull(),
    pctReal: doublePrecision('pct_real').notNull().default(0),
    peso: doublePrecision('peso'),
    inicio: text('inicio'),
    fin: text('fin'),
    ...tiempos,
  },
  (t) => [primaryKey({ columns: [t.corteId, t.actividadId] })],
)

export type FilaUsuario = typeof usuario.$inferSelect
export type FilaCharter = typeof charter.$inferSelect

// ── Parámetros globales (una sola fila, id = 1) ─────────────────────────

export const parametros = pgTable('parametros', {
  id: integer('id').primaryKey(),
  /** JSON de `Reglas` vigentes para los charters nuevos. */
  reglas: text('reglas').notNull(),
  actualizadoPor: text('actualizado_por').references(() => usuario.id, { onDelete: 'set null' }),
  actualizadoEn: text('actualizado_en').notNull(),
})
