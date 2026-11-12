import { z } from './zod'

// ── Cuentas ─────────────────────────────────────────────────────────────

export interface CuentaAdmin {
  id: string
  nombre: string
  correo: string
  esAdmin: boolean
  activo: boolean
  debeCambiarClave: boolean
  /** Charters de los que es dueño. */
  charters: number
  /** Último uso de alguna de sus sesiones (ISO) o null si nunca entró. */
  ultimoAcceso: string | null
  creadoEn: string
}

const alMenosUnCampo = { error: 'No hay cambios para guardar' }

export const editarCuentaEntrada = z
  .object({ activo: z.boolean().optional(), esAdmin: z.boolean().optional() })
  .strict()
  .refine((d) => Object.keys(d).length > 0, alMenosUnCampo)

export type EditarCuentaEntrada = z.infer<typeof editarCuentaEntrada>

// ── Catálogos ───────────────────────────────────────────────────────────

/**
 * Pares `color` (punto) y `colorFondo` (chip) para las categorías. El texto del chip es
 * `tinta`; el contraste de cada par se verifica en la web (`contraste.test.ts`).
 * El primero es el neutro de «Default».
 */
export const PALETA_CATEGORIAS: readonly { color: string; colorFondo: string }[] = [
  { color: '#5B6773', colorFondo: '#ECEFF2' }, // neutro (Default)
  { color: '#D98A00', colorFondo: '#FBF1DF' }, // Automatización
  { color: '#6A55D8', colorFondo: '#EEEBFB' }, // Análisis de Data
  { color: '#0A9C9B', colorFondo: '#E1F4F3' }, // Gestión del Conocimiento
  { color: '#2E7D32', colorFondo: '#E6F3E7' }, // verde
  { color: '#C2415A', colorFondo: '#FBE7EB' }, // frambuesa
  { color: '#1F6FBF', colorFondo: '#E4EEF9' }, // azul
  { color: '#B5551B', colorFondo: '#FAE9DF' }, // terracota
]

export const colorDePaleta = z
  .string()
  .refine((c) => PALETA_CATEGORIAS.some((p) => p.color === c), {
    error: 'Elige un color de la paleta',
  })

const nombreCatalogo = z
  .string({ error: 'Escribe el nombre' })
  .trim()
  .min(1, { error: 'Escribe el nombre' })
  .max(80, { error: 'El nombre puede tener máximo 80 caracteres' })

export const crearCatalogoEntrada = z.object({ nombre: nombreCatalogo })
export const crearAreaEntrada = crearCatalogoEntrada
export const crearCategoriaEntrada = crearCatalogoEntrada.extend({ color: colorDePaleta })

const orden = z.number({ error: 'Escribe un número' }).int().min(0)

export const editarAreaEntrada = z
  .object({ nombre: nombreCatalogo, activa: z.boolean(), orden })
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, alMenosUnCampo)

export const editarCategoriaEntrada = z
  .object({ nombre: nombreCatalogo, color: colorDePaleta, activa: z.boolean(), orden })
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, alMenosUnCampo)

export type CrearCatalogoEntrada = z.infer<typeof crearCatalogoEntrada>
export type CrearCategoriaEntrada = z.infer<typeof crearCategoriaEntrada>
export type EditarAreaEntrada = z.infer<typeof editarAreaEntrada>
export type EditarCategoriaEntrada = z.infer<typeof editarCategoriaEntrada>

export interface CatalogoAdmin {
  id: string
  nombre: string
  activa: boolean
  orden: number
  /** Charters que la usan. */
  charters: number
}

export interface CategoriaAdmin extends CatalogoAdmin {
  color: string
  colorFondo: string
  /** «Default»: no se puede desactivar ni eliminar. */
  protegida: boolean
}
