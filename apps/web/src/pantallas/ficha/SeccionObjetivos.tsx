import type { CharterDetalle } from '@charter/shared'
import { ListaEditable } from './ListaEditable'

/** Objetivos específicos: van en la columna derecha de «Razón de ser». */
export function SeccionObjetivos({
  charter,
  soloLectura,
}: {
  charter: CharterDetalle
  soloLectura: boolean
}) {
  return (
    <div id="objetivos" className="scroll-mt-28">
      <ListaEditable
        charterId={charter.id}
        titulo="Objetivos específicos"
        etiquetaItem="Objetivo"
        tipo="objetivo"
        items={charter.listas.objetivo}
        textoAgregar="Agregar objetivo"
        textoVacio="Aún no hay objetivos específicos."
        numerada
        soloLectura={soloLectura}
      />
    </div>
  )
}
