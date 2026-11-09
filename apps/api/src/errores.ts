import type { FastifyError, FastifyInstance } from 'fastify'
import { ZodError } from 'zod'

/** Error de negocio que la API devuelve como `{ error: { codigo, mensaje, campos? } }`. */
export class ErrorApi extends Error {
  constructor(
    public readonly estado: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly campos?: Record<string, string>,
  ) {
    super(mensaje)
    this.name = 'ErrorApi'
  }
}

function cuerpo(codigo: string, mensaje: string, campos?: Record<string, string>) {
  return { error: campos ? { codigo, mensaje, campos } : { codigo, mensaje } }
}

/** Primer mensaje de Zod por campo (raíz del path). */
function camposDe(error: ZodError): Record<string, string> {
  const campos: Record<string, string> = {}
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? '_')
    campos[campo] ??= issue.message
  }
  return campos
}

export function registrarErrores(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | ErrorApi | ZodError, request, reply) => {
    if (error instanceof ErrorApi) {
      return reply.status(error.estado).send(cuerpo(error.codigo, error.message, error.campos))
    }
    if (error instanceof ZodError) {
      return reply
        .status(400)
        .send(cuerpo('datos_invalidos', 'Revisa los datos del formulario', camposDe(error)))
    }
    const estado = error.statusCode ?? 500
    if (estado === 429) {
      return reply
        .status(429)
        .send(cuerpo('demasiados_intentos', 'Demasiados intentos. Espera unos minutos.'))
    }
    if (estado >= 400 && estado < 500) {
      return reply.status(estado).send(cuerpo('solicitud_invalida', 'La solicitud no es válida'))
    }
    request.log.error(error)
    return reply
      .status(500)
      .send(cuerpo('error_interno', 'Algo falló de nuestro lado. Intenta de nuevo.'))
  })

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send(cuerpo('no_encontrado', 'No encontramos lo que buscas'))
  })
}
