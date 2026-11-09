import type { RespuestaError } from '@charter/shared'

/** Error de la API con el formato `{ error: { codigo, mensaje, campos? } }`. */
export class ErrorCliente extends Error {
  constructor(
    public readonly estado: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly campos?: Record<string, string>,
  ) {
    super(mensaje)
    this.name = 'ErrorCliente'
  }
}

export interface OpcionesApi {
  metodo?: string
  cuerpo?: unknown
}

/** Llama a la API del mismo origen con la sesión y la cabecera anti-CSRF. */
export async function api<T>(
  ruta: string,
  { metodo = 'GET', cuerpo }: OpcionesApi = {},
): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'charter',
        ...(cuerpo === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ErrorCliente(0, 'sin_conexion', 'No hay conexión con el servidor. Intenta de nuevo.')
  }

  const texto = await respuesta.text()
  let datos: unknown
  try {
    datos = texto ? JSON.parse(texto) : undefined
  } catch {
    throw new ErrorCliente(
      respuesta.status,
      'respuesta_invalida',
      'El servidor respondió algo inesperado. Intenta de nuevo.',
    )
  }
  if (!respuesta.ok) {
    const error = (datos as Partial<RespuestaError> | undefined)?.error
    throw new ErrorCliente(
      respuesta.status,
      error?.codigo ?? 'error_desconocido',
      error?.mensaje ?? 'Algo falló. Intenta de nuevo.',
      error?.campos,
    )
  }
  return datos as T
}
