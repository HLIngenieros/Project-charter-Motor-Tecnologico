import type { CharterDetalle } from '@charter/shared'
import { ListaEditable } from './ListaEditable'

/** Supuestos y criterios de éxito, a dos columnas. */
export function SeccionSupuestos({
  charter,
  soloLectura,
}: {
  charter: CharterDetalle
  soloLectura: boolean
}) {
  return (
    <section id="supuestos" className="grid scroll-mt-28 gap-7 md:grid-cols-2 md:gap-10">
      <ListaEditable
        charterId={charter.id}
        titulo="Supuestos"
        etiquetaItem="Supuesto"
        tipo="supuesto"
        items={charter.listas.supuesto}
        textoAgregar="Agregar supuesto"
        textoVacio="Aún no hay supuestos."
        soloLectura={soloLectura}
      />
      <ListaEditable
        charterId={charter.id}
        titulo="Criterios de éxito"
        etiquetaItem="Criterio"
        tipo="criterio_exito"
        items={charter.listas.criterio_exito}
        textoAgregar="Agregar criterio"
        textoVacio="Aún no hay criterios de éxito."
        soloLectura={soloLectura}
      />
    </section>
  )
}
