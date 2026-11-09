import type { CharterDetalle, CharterEditar } from '@charter/shared'
import type { ReactNode } from 'react'
import { TextoEditable } from '../../componentes/TextoEditable'

type Guardar = <K extends keyof CharterEditar>(campo: K) => (valor: CharterEditar[K]) => void

export function SeccionRazon({
  charter: c,
  guardar,
  soloLectura,
  derecha,
}: {
  charter: CharterDetalle
  guardar: Guardar
  soloLectura: boolean
  /** Columna derecha (los objetivos específicos). */
  derecha: ReactNode
}) {
  return (
    <section id="razon" className="grid scroll-mt-28 gap-7 md:grid-cols-2 md:gap-10">
      <div>
        <h2 className="mb-3 text-lg font-semibold">Razón de ser</h2>
        <TextoEditable
          etiqueta="Razón de ser"
          valor={c.razonDeSer}
          alGuardar={guardar('razonDeSer')}
          placeholder="Qué problema resuelve y por qué ahora"
          maximo={4000}
          multilinea
          soloLectura={soloLectura}
          className="max-w-[70ch]"
        />
        <h2 className="mt-7 mb-3 text-lg font-semibold">Objetivo general</h2>
        <TextoEditable
          etiqueta="Objetivo general"
          valor={c.objetivoGeneral}
          alGuardar={guardar('objetivoGeneral')}
          placeholder="Qué se logra y para cuándo"
          maximo={4000}
          multilinea
          soloLectura={soloLectura}
          className="max-w-[70ch]"
        />
      </div>
      {derecha}
    </section>
  )
}
