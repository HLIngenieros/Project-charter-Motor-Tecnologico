import { PALETA_CATEGORIAS } from '@charter/shared'
import { categoria } from './esquema'
import type { BaseDatos } from './conexion'

/** Categoría «Default»: protegida (no se desactiva ni se elimina) y preseleccionada al crear. */
export const ID_DEFAULT = '019a6a00-0000-7000-8000-000000000000'

/** «Default» y los tres ejes del Comité, con ids fijos para que la semilla sea idempotente. */
const CATEGORIAS = [
  {
    id: ID_DEFAULT,
    nombre: 'Default',
    ...PALETA_CATEGORIAS[0]!,
    orden: 0,
    protegida: true,
  },
  {
    id: '019a6a00-0000-7000-8000-000000000001',
    nombre: 'Automatización',
    color: '#D98A00',
    colorFondo: '#FBF1DF',
    orden: 1,
  },
  {
    id: '019a6a00-0000-7000-8000-000000000002',
    nombre: 'Análisis de Data',
    color: '#6A55D8',
    colorFondo: '#EEEBFB',
    orden: 2,
  },
  {
    id: '019a6a00-0000-7000-8000-000000000003',
    nombre: 'Gestión del Conocimiento',
    color: '#0A9C9B',
    colorFondo: '#E1F4F3',
    orden: 3,
  },
]

export async function sembrar(db: BaseDatos): Promise<void> {
  await db.insert(categoria).values(CATEGORIAS).onConflictDoNothing()
}
