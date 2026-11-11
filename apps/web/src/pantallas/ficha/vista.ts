import {
  construirArbol,
  recorrerHojas,
  type ActividadEntrada,
  type AvanceFoto,
  type AvancesPorHoja,
} from '@charter/shared'

export interface ArbolHistorico {
  /** Estructura actual; las hojas de la foto, con el peso y las fechas que tenían en el corte. */
  acts: ActividadEntrada[]
  /** Avance de la foto por hoja (sin fecha de terminación: el detalle del corte no la trae). */
  avances: AvancesPorHoja
  /** Hojas actuales que no están en la foto: quedan sin peso y no entran en el cálculo. */
  noExistia: Set<string>
  /** Filas de la foto cuya actividad ya no existe en el cronograma. */
  eliminadas: AvanceFoto[]
}

/** El cronograma actual tal como estaba en un corte pasado, a partir de su foto. */
export function arbolHistorico(acts: ActividadEntrada[], foto: AvanceFoto[]): ArbolHistorico {
  const porId = new Map(foto.filter((f) => !f.eliminada).map((f) => [f.actividadId, f]))
  const hojas = new Set(recorrerHojas(construirArbol(acts)).map((h) => h.id))
  const noExistia = new Set<string>()
  const avances: AvancesPorHoja = {}

  const salida = acts.map((a) => {
    if (!hojas.has(a.id)) return a
    const f = porId.get(a.id)
    if (!f) {
      noExistia.add(a.id)
      return { ...a, peso: null }
    }
    avances[a.id] = { pct: f.pct, terminadaEn: null }
    return { ...a, peso: f.peso, inicio: f.inicio, fin: f.fin }
  })

  return { acts: salida, avances, noExistia, eliminadas: foto.filter((f) => f.eliminada) }
}
