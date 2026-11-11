import {
  arbolHistorico,
  calcularCronograma,
  construirArbol,
  type ExportacionCharter,
  type FechaISO,
} from '@charter/shared'
import type { UsuarioSesion } from '../../auth/sesiones'
import type { BaseDatos } from '../../db/conexion'
import type { FilaCharter } from '../../db/esquema'
import { ErrorApi } from '../../errores'
import { hoyISO } from '../../util/hoy'
import { leerCronograma } from '../cronograma/servicio'
import { detalleCorte, listarCortes } from '../cortes/servicio'
import { detalleCharter } from './servicio'

/**
 * El charter completo a una fecha: la vista actual (último corte, recalculado con el cronograma
 * de hoy, como la ficha) o un corte pasado (con su foto y lo guardado en ese corte).
 */
export async function exportarCharter(
  db: BaseDatos,
  fila: FilaCharter,
  yo: UsuarioSesion,
  pedido?: FechaISO,
): Promise<ExportacionCharter> {
  const charter = await detalleCharter(db, fila, yo)
  const { reglas } = charter
  const crono = await leerCronograma(db, fila)
  const resumenes = await listarCortes(db, fila)
  if (pedido && !resumenes.some((c) => c.fecha === pedido)) {
    throw new ErrorApi(404, 'no_encontrado', 'No hay un corte en esa fecha.')
  }
  const cortes = await Promise.all(resumenes.map((c) => detalleCorte(db, fila, c.fecha)))
  const ultimo = resumenes.at(-1)
  const pasado = pedido && pedido !== ultimo?.fecha ? cortes.find((c) => c.fecha === pedido)! : null

  let actividades = crono.actividades
  let calculo
  if (pasado) {
    const h = arbolHistorico(crono.actividades, pasado.avances)
    actividades = h.acts
    const r = calcularCronograma(construirArbol(h.acts), h.avances, pasado.fecha, reglas)
    const { pv, ev, desv, estado, vencidas } = pasado
    calculo = { ...r, proyecto: { ...r.proyecto, pv, ev, desv, estado, vencidas } }
  } else {
    const fecha = crono.ultimoCorte?.fecha ?? hoyISO()
    calculo = calcularCronograma(
      construirArbol(actividades),
      crono.ultimoCorte?.avances ?? {},
      fecha,
      reglas,
    )
  }

  return {
    formato: 'project-charter',
    version: 1,
    generadoEn: new Date().toISOString(),
    corte: pasado?.fecha ?? ultimo?.fecha ?? null,
    charter,
    cronograma: { actividades, calculo: calculo.nodos, proyecto: calculo.proyecto },
    cortes,
  }
}
