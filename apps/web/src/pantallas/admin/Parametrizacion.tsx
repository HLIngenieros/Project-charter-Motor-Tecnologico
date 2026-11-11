import { REGLAS_POR_DEFECTO, type Reglas, type ReglasEntrada } from '@charter/shared'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useGuardarParametros, useParametros } from '../../api/admin'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Cargando } from '../../componentes/Cargando'

/** Lo que se edita: las cifras van como texto para poder borrarlas mientras se escribe. */
interface Formulario {
  sumaPesos: Reglas['sumaPesos']
  sinPeso: Reglas['sinPeso']
  reparto: Reglas['reparto']
  proyeccion: Reglas['proyeccion']
  atencion: string
  riesgo: string
  atraso: string
  diasGracia: string
}

const aFormulario = (r: Reglas): Formulario => ({
  sumaPesos: r.sumaPesos,
  sinPeso: r.sinPeso,
  reparto: r.reparto,
  proyeccion: r.proyeccion,
  atencion: String(r.umbrales.atencion),
  riesgo: String(r.umbrales.riesgo),
  atraso: String(r.umbrales.atraso),
  diasGracia: String(r.diasGracia),
})

const numero = (t: string) => (t.trim() === '' ? NaN : Number(t.replace(',', '.')))

const aReglas = (f: Formulario): ReglasEntrada => ({
  sumaPesos: f.sumaPesos,
  sinPeso: f.sinPeso,
  umbrales: { atencion: numero(f.atencion), riesgo: numero(f.riesgo), atraso: numero(f.atraso) },
  reparto: f.reparto,
  proyeccion: f.proyeccion,
  diasGracia: numero(f.diasGracia),
})

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

function Bloque({
  titulo,
  descripcion,
  ejemplo,
  children,
}: {
  titulo: string
  descripcion: string
  ejemplo: string
  children: ReactNode
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-tarjeta border border-linea bg-superficie p-5">
      <legend className="float-left w-full text-base font-semibold text-tinta">{titulo}</legend>
      <p className="text-sm text-texto">{descripcion}</p>
      {children}
      <p className="mt-auto border-t border-linea-2 pt-3 text-[0.8125rem] text-texto-2">
        <span className="font-semibold text-texto">Ejemplo:</span> {ejemplo}
      </p>
    </fieldset>
  )
}

function Opciones<T extends string>({
  nombre,
  valor,
  opciones,
  alCambiar,
}: {
  nombre: string
  valor: T
  opciones: { valor: T; etiqueta: string }[]
  alCambiar(v: T): void
}) {
  return (
    <div className="flex flex-col gap-2">
      {opciones.map((o) => {
        const elegida = o.valor === valor
        return (
          <label
            key={o.valor}
            className={[
              'flex min-h-11 cursor-pointer items-center gap-3 rounded-control border px-3 text-[0.9375rem] transition-colors duration-150',
              'has-[:focus-visible]:shadow-foco',
              elegida
                ? 'border-institucional bg-institucional/[0.04] font-semibold text-tinta'
                : 'border-linea text-texto hover:border-texto-3',
            ].join(' ')}
          >
            <input
              type="radio"
              name={nombre}
              value={o.valor}
              checked={elegida}
              onChange={() => alCambiar(o.valor)}
              className="size-4 accent-institucional focus:outline-none"
            />
            {o.etiqueta}
          </label>
        )
      })}
    </div>
  )
}

function Numero({
  etiqueta,
  valor,
  sufijo,
  min,
  max,
  alCambiar,
}: {
  etiqueta: string
  valor: string
  sufijo: string
  min: number
  max: number
  alCambiar(v: string): void
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-tinta">
        {etiqueta}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          className="min-h-11 w-full min-w-0 rounded-control border border-linea bg-superficie px-3 text-right font-mono text-[0.9375rem] text-tinta tabular-nums hover:border-texto-3 focus:border-acento focus:shadow-foco focus:outline-none"
        />
        <span className="shrink-0 text-[0.8125rem] text-texto-2">{sufijo}</span>
      </div>
    </div>
  )
}

/** Pestaña Parametrización: reglas de cálculo que copian los charters al crearse. */
export function Parametrizacion() {
  const consulta = useParametros()
  const guardar = useGuardarParametros()
  /** null mientras no se toca nada: manda lo que trae la API. */
  const [borrador, setBorrador] = useState<Formulario | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState<string>()

  if (consulta.isPending) return <Cargando />
  if (consulta.isError) return <Aviso tono="alerta">{consulta.error.message}</Aviso>

  const { reglas, actualizadoPor, actualizadoEn } = consulta.data
  const f = borrador ?? aFormulario(reglas)
  const cambiado = JSON.stringify(aReglas(f)) !== JSON.stringify(aReglas(aFormulario(reglas)))

  const cambiar = (cambios: Partial<Formulario>) => {
    setBorrador({ ...f, ...cambios })
    setGuardado(false)
    setError(undefined)
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!cambiado || guardar.isPending) return
    const entrada = aReglas(f)
    const cifras = [...Object.values(entrada.umbrales), entrada.diasGracia]
    if (cifras.some((n) => !Number.isFinite(n))) {
      setError('Escribe un número en cada campo.')
      return
    }
    try {
      await guardar.mutateAsync(entrada)
      setBorrador(null)
      setGuardado(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los parámetros.')
    }
  }

  return (
    <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Reglas de cálculo</h2>
        <p className="max-w-[68ch] text-texto-2">
          Definen cómo se calcula el avance, el semáforo y el fin proyectado de cada charter.
        </p>
      </div>
      <Aviso tono="info">
        Los cambios aplican a los charters que se creen desde ahora. Los charters existentes
        conservan sus reglas.
      </Aviso>

      <div className="grid gap-4 md:grid-cols-2">
        <Bloque
          titulo="Suma de pesos"
          descripcion="Qué pasa si los pesos de las actividades programadas no suman 100 %."
          ejemplo="con 90 % asignado, «Obligatoria» no deja registrar el corte hasta completar el 100 %."
        >
          <Opciones
            nombre="sumaPesos"
            valor={f.sumaPesos}
            alCambiar={(sumaPesos) => cambiar({ sumaPesos })}
            opciones={[
              { valor: 'aviso', etiqueta: 'Solo avisar' },
              { valor: 'obligatoria', etiqueta: 'Obligatoria para registrar un corte' },
            ]}
          />
        </Bloque>

        <Bloque
          titulo="Actividades sin peso"
          descripcion="Qué hacer con las actividades que tienen fechas pero no peso."
          ejemplo="si hay 80 % asignado y dos actividades sin peso, cada una recibe 10 %."
        >
          <Opciones
            nombre="sinPeso"
            valor={f.sinPeso}
            alCambiar={(sinPeso) => cambiar({ sinPeso })}
            opciones={[
              { valor: 'fuera', etiqueta: 'Dejarlas fuera del cálculo' },
              { valor: 'repartir', etiqueta: 'Repartir lo que falte en partes iguales' },
            ]}
          />
        </Bloque>

        <Bloque
          titulo="Semáforo"
          descripcion="Desde cuántos puntos de brecha (planeado menos real) cambia el estado."
          ejemplo="con 10 / 25 / 50, una brecha de 12 puntos queda «En atención»."
        >
          <div className="grid grid-cols-3 gap-3">
            <Numero
              etiqueta="Atención"
              valor={f.atencion}
              sufijo="pts"
              min={0}
              max={100}
              alCambiar={(atencion) => cambiar({ atencion })}
            />
            <Numero
              etiqueta="Riesgo"
              valor={f.riesgo}
              sufijo="pts"
              min={0}
              max={100}
              alCambiar={(riesgo) => cambiar({ riesgo })}
            />
            <Numero
              etiqueta="Atraso"
              valor={f.atraso}
              sufijo="pts"
              min={0}
              max={100}
              alCambiar={(atraso) => cambiar({ atraso })}
            />
          </div>
        </Bloque>

        <Bloque
          titulo="Reparto del planeado"
          descripcion="Cómo avanza el planeado de una actividad entre su inicio y su fin."
          ejemplo="una actividad de lunes a lunes en días hábiles no suma planeado el fin de semana."
        >
          <Opciones
            nombre="reparto"
            valor={f.reparto}
            alCambiar={(reparto) => cambiar({ reparto })}
            opciones={[
              { valor: 'calendario', etiqueta: 'Días calendario' },
              { valor: 'habiles', etiqueta: 'Días hábiles (lunes a viernes)' },
            ]}
          />
        </Bloque>

        <Bloque
          titulo="Proyección del fin"
          descripcion="Cómo se estima la fecha en que terminará el proyecto."
          ejemplo="con la mitad del ritmo planeado (SPI 0,5), una actividad de 10 días se proyecta a 20."
        >
          <Opciones
            nombre="proyeccion"
            valor={f.proyeccion}
            alCambiar={(proyeccion) => cambiar({ proyeccion })}
            opciones={[
              { valor: 'desviacion', etiqueta: 'Por la desviación' },
              { valor: 'ritmo', etiqueta: 'Al ritmo actual (SPI)' },
            ]}
          />
        </Bloque>

        <Bloque
          titulo="Vencida"
          descripcion="Días que se esperan después del fin antes de marcar una actividad como vencida."
          ejemplo="con 3 días, una actividad que termina el lunes sin el 100 % se marca vencida el jueves."
        >
          <div className="max-w-40">
            <Numero
              etiqueta="Días de gracia"
              valor={f.diasGracia}
              sufijo="días"
              min={0}
              max={365}
              alCambiar={(diasGracia) => cambiar({ diasGracia })}
            />
          </div>
        </Bloque>
      </div>

      {error && <Aviso tono="alerta">{error}</Aviso>}
      {guardado && <Aviso tono="ok">Parámetros guardados.</Aviso>}

      <div className="flex flex-wrap items-center gap-3 border-t border-linea pt-4">
        <Boton type="submit" disabled={!cambiado} cargando={guardar.isPending}>
          Guardar
        </Boton>
        <Boton
          type="button"
          variante="secundario"
          onClick={() => cambiar(aFormulario(REGLAS_POR_DEFECTO))}
        >
          Restablecer valores de fábrica
        </Boton>
        {actualizadoPor && actualizadoEn && (
          <p className="ml-auto text-[0.8125rem] text-texto-2 max-sm:ml-0">
            Modificado por {actualizadoPor.nombre} el {fechaHora(actualizadoEn)}
          </p>
        )}
      </div>
    </form>
  )
}
