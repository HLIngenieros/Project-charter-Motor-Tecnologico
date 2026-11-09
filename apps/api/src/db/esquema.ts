import {
  type AnySQLiteColumn,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core'

/** Marca de tiempo ISO UTC. */
const ahora = () => new Date().toISOString()

const tiempos = {
  creadoEn: text('creado_en').notNull().$defaultFn(ahora),
  actualizadoEn: text('actualizado_en').notNull().$defaultFn(ahora).$onUpdateFn(ahora),
}

const booleano = (nombre: string) => integer(nombre, { mode: 'boolean' })

// ── 5.1 Cuentas y catálogos ─────────────────────────────────────────────

export const usuario = sqliteTable('usuario', {
  id: text('id').primaryKey(),
  correo: text('correo').notNull().unique(),
  nombre: text('nombre').notNull(),
  hashClave: text('hash_clave').notNull(),
  esAdmin: booleano('es_admin').notNull().default(false),
  activo: booleano('activo').notNull().default(true),
  debeCambiarClave: booleano('debe_cambiar_clave').notNull().default(false),
  ...tiempos,
})

export const sesion = sqliteTable(
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

export const categoria = sqliteTable('categoria', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  color: text('color').notNull(),
  colorFondo: text('color_fondo').notNull(),
  activa: booleano('activa').notNull().default(true),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

export const area = sqliteTable('area', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  activa: booleano('activa').notNull().default(true),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

// ── 5.2 Charter ─────────────────────────────────────────────────────────

export const ESTADOS_CHARTER = ['activo', 'pausado', 'cerrado', 'cancelado'] as const

export const charter = sqliteTable(
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
    umbralAtencion: real('umbral_atencion').notNull().default(10),
    umbralRiesgo: real('umbral_riesgo').notNull().default(25),
    umbralAtraso: real('umbral_atraso').notNull().default(50),
    ...tiempos,
  },
  (t) => [index('charter_propietario_idx').on(t.propietarioId)],
)

const charterId = () =>
  text('charter_id')
    .notNull()
    .references(() => charter.id, { onDelete: 'cascade' })

export const itemLista = sqliteTable('item_lista', {
  id: text('id').primaryKey(),
  charterId: charterId(),
  tipo: text('tipo', { enum: ['objetivo', 'supuesto', 'criterio_exito'] }).notNull(),
  texto: text('texto').notNull(),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

export const riesgo = sqliteTable('riesgo', {
  id: text('id').primaryKey(),
  charterId: charterId(),
  riesgo: text('riesgo').notNull(),
  causa: text('causa').notNull().default(''),
  mitigacion: text('mitigacion').notNull().default(''),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

export const indicador = sqliteTable('indicador', {
  id: text('id').primaryKey(),
  charterId: charterId(),
  nombre: text('nombre').notNull(),
  formula: text('formula').notNull().default(''),
  metaOperador: text('meta_operador', { enum: ['>=', '<=', '='] })
    .notNull()
    .default('>='),
  metaValor: real('meta_valor').notNull().default(0),
  metaUnidad: text('meta_unidad').notNull().default(''),
  observaciones: text('observaciones').notNull().default(''),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

export const medicion = sqliteTable(
  'medicion',
  {
    id: text('id').primaryKey(),
    indicadorId: text('indicador_id')
      .notNull()
      .references(() => indicador.id, { onDelete: 'cascade' }),
    periodo: text('periodo').notNull(),
    valor: real('valor').notNull(),
    nota: text('nota').notNull().default(''),
    ...tiempos,
  },
  (t) => [index('medicion_indicador_idx').on(t.indicadorId)],
)

export const rubro = sqliteTable('rubro', {
  id: text('id').primaryKey(),
  charterId: charterId(),
  descripcion: text('descripcion').notNull(),
  valor: integer('valor').notNull().default(0),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

export const rubroDetalle = sqliteTable('rubro_detalle', {
  id: text('id').primaryKey(),
  rubroId: text('rubro_id')
    .notNull()
    .references(() => rubro.id, { onDelete: 'cascade' }),
  concepto: text('concepto').notNull(),
  cantidad: real('cantidad').notNull().default(1),
  valorUnitario: integer('valor_unitario').notNull().default(0),
  orden: integer('orden').notNull().default(0),
  ...tiempos,
})

// ── 5.3 Cronograma y cortes ─────────────────────────────────────────────

export const actividad = sqliteTable(
  'actividad',
  {
    id: text('id').primaryKey(),
    charterId: charterId(),
    padreId: text('padre_id').references((): AnySQLiteColumn => actividad.id, {
      onDelete: 'cascade',
    }),
    orden: integer('orden').notNull(),
    nombre: text('nombre').notNull(),
    entregable: text('entregable'),
    peso: real('peso'),
    inicio: text('inicio'),
    fin: text('fin'),
    ...tiempos,
  },
  (t) => [
    index('actividad_charter_idx').on(t.charterId),
    index('actividad_padre_idx').on(t.padreId),
  ],
)

export const actividadResponsable = sqliteTable(
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

export const corte = sqliteTable(
  'corte',
  {
    id: text('id').primaryKey(),
    charterId: charterId(),
    fecha: text('fecha').notNull(),
    nota: text('nota').notNull().default(''),
    pvProyecto: real('pv_proyecto').notNull().default(0),
    evProyecto: real('ev_proyecto').notNull().default(0),
    desvProyecto: real('desv_proyecto').notNull().default(0),
    ...tiempos,
  },
  (t) => [uniqueIndex('corte_charter_fecha_unq').on(t.charterId, t.fecha)],
)

/** Foto de cada hoja en un corte. `actividad_id` no tiene clave foránea: sobrevive al borrado. */
export const avance = sqliteTable(
  'avance',
  {
    corteId: text('corte_id')
      .notNull()
      .references(() => corte.id, { onDelete: 'cascade' }),
    actividadId: text('actividad_id').notNull(),
    item: text('item').notNull(),
    nombre: text('nombre').notNull(),
    pctReal: real('pct_real').notNull().default(0),
    peso: real('peso'),
    inicio: text('inicio'),
    fin: text('fin'),
    ...tiempos,
  },
  (t) => [primaryKey({ columns: [t.corteId, t.actividadId] })],
)

export type FilaUsuario = typeof usuario.$inferSelect
export type FilaCharter = typeof charter.$inferSelect
