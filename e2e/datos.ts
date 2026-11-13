export const PUERTO_API = 3300
export const PUERTO_WEB = 5300

export const ADMIN = {
  correo: 'admin.e2e@hlingenieros.com',
  nombre: 'Admin E2E',
  clave: 'clave-admin-e2e',
}

/** Cuenta nueva por prueba: la base vive mientras corra la API, y un correo no se repite. */
export function cuentaNueva(prefijo: string) {
  const sufijo = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  return {
    correo: `${prefijo}.${sufijo}@hlingenieros.com`,
    nombre: `Usuario ${prefijo}`,
    clave: 'clave-e2e-123',
  }
}
