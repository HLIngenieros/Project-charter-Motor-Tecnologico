import { categoria } from './esquema'
import type { BaseDatos } from './conexion'

/** Los tres ejes del Comité, con ids fijos para que la semilla sea idempotente. */
const CATEGORIAS = [
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

export function sembrar(db: BaseDatos): void {
  db.insert(categoria).values(CATEGORIAS).onConflictDoNothing().run()
}
