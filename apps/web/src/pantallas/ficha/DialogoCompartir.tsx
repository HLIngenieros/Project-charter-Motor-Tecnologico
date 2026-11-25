import { accesoEntrada, type AccesoCharter, type RolAcceso } from '@charter/shared'
import { useRef, useState, type FormEvent } from 'react'
import { useAccesos, useCompartir } from '../../api/charters'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Campo } from '../../componentes/Campo'
import { Cargando } from '../../componentes/Cargando'
import { Dialogo } from '../../componentes/Dialogo'
import { Selector } from '../../componentes/Selector'
import { camposDeZod, separarError, type ErroresCampos } from '../errores'

export const NOMBRE_ROL: Record<RolAcceso, string> = { lector: 'Lector', editor: 'Editor' }

const OPCIONES_ROL = (
  <>
    <option value="editor">Editor</option>
    <option value="lector">Lector</option>
  </>
)

function IconoCompartir() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  )
}

function FilaAcceso({
  acceso,
  cambiarRol,
  quitar,
  ocupado,
}: {
  acceso: AccesoCharter
  cambiarRol(rol: RolAcceso): void
  quitar(): void
  ocupado: boolean
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-linea-2 py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9375rem] font-semibold text-tinta">
          {acceso.nombre ?? acceso.correo}
        </p>
        <p className="truncate text-[0.8125rem] text-texto-2">
          {acceso.nombre ? acceso.correo : 'Pendiente de registro'}
        </p>
      </div>
      <Selector
        etiqueta={`Rol de ${acceso.correo}`}
        etiquetaOculta
        value={acceso.rol}
        disabled={ocupado}
        onChange={(e) => cambiarRol(e.target.value as RolAcceso)}
        className="w-32"
      >
        <option value="editor">Editor</option>
        <option value="lector">Lector</option>
      </Selector>
      <Boton
        variante="fantasma"
        disabled={ocupado}
        onClick={quitar}
        aria-label={`Quitar el acceso de ${acceso.correo}`}
      >
        Quitar
      </Boton>
    </li>
  )
}

/** Botón «Compartir» de la banda (solo el dueño) con su diálogo. */
export function BotonCompartir({ charterId, nombre }: { charterId: string; nombre: string }) {
  const [abierto, setAbierto] = useState(false)
  const [correo, setCorreo] = useState('')
  const [rol, setRol] = useState<RolAcceso>('editor')
  const [errores, setErrores] = useState<ErroresCampos>({})
  const [general, setGeneral] = useState<string>()
  const [copiado, setCopiado] = useState(false)
  const enviando = useRef(false)
  const accesos = useAccesos(charterId, abierto)
  const { compartir, quitar } = useCompartir(charterId)
  const ocupado = compartir.isPending || quitar.isPending

  const cerrar = () => {
    setAbierto(false)
    setCorreo('')
    setErrores({})
    setGeneral(undefined)
    setCopiado(false)
  }

  const fallo = (error: unknown) => {
    const r = separarError(error)
    setErrores(r.campos)
    setGeneral(r.general)
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (enviando.current) return
    const validado = accesoEntrada.safeParse({ correo, rol })
    if (!validado.success) return setErrores(camposDeZod(validado.error))
    setErrores({})
    setGeneral(undefined)
    enviando.current = true
    compartir.mutate(validado.data, {
      onSuccess: () => setCorreo(''),
      onError: fallo,
      onSettled: () => {
        enviando.current = false
      },
    })
  }

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/charters/${charterId}`)
      setCopiado(true)
    } catch {
      setGeneral('No se pudo copiar el enlace. Cópialo desde la barra del navegador.')
    }
  }

  const lista = accesos.data ?? []

  return (
    <>
      {/* Mismo trazo que «Exportar» y el estado, sus vecinos en la banda. */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="relative inline-flex min-h-9 items-center gap-2 rounded-control border border-linea bg-superficie px-3 text-sm font-semibold text-tinta transition-colors duration-150 hover:border-texto-3 focus-visible:outline-2 focus-visible:outline-acento max-sm:px-2.5"
      >
        <IconoCompartir />
        {/* En celular, solo el ícono: así «Registrar corte» no se parte en dos líneas. */}
        <span className="max-sm:sr-only">Compartir</span>
      </button>
      <Dialogo abierto={abierto} alCerrar={cerrar} titulo="Compartir charter">
        <p className="-mt-1 mb-4 text-sm text-texto-2">
          <b className="font-semibold text-tinta">{nombre}</b>. Si la persona aún no tiene cuenta,
          verá el charter apenas se registre con ese correo. Avísale tú: la herramienta no envía
          correos.
        </p>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-3">
          {general && <Aviso tono="alerta">{general}</Aviso>}
          <Campo
            etiqueta="Correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            error={errores.correo}
            placeholder="nombre@hlingenieros.com"
            autoComplete="off"
          />
          <div className="flex flex-wrap items-end gap-3">
            <Selector
              etiqueta="Rol"
              value={rol}
              onChange={(e) => setRol(e.target.value as RolAcceso)}
              className="min-w-0 flex-1"
            >
              {OPCIONES_ROL}
            </Selector>
            <Boton type="submit" cargando={compartir.isPending} className="min-h-11">
              Compartir
            </Boton>
          </div>
          <p className="text-[0.8125rem] text-texto-2">
            Editor: edita la ficha y registra cortes. Lector: solo consulta y exporta.
          </p>
        </form>

        <h3 className="mt-6 text-sm font-semibold text-tinta">Personas con acceso</h3>
        {accesos.isPending ? (
          <Cargando pantalla={false} />
        ) : lista.length === 0 ? (
          <p className="mt-2 text-sm text-texto-2">Aún no lo compartes con nadie.</p>
        ) : (
          <ul className="mt-1">
            {lista.map((a) => (
              <FilaAcceso
                key={a.correo}
                acceso={a}
                ocupado={ocupado}
                cambiarRol={(nuevo) =>
                  compartir.mutate({ correo: a.correo, rol: nuevo }, { onError: fallo })
                }
                quitar={() => quitar.mutate(a.correo, { onError: fallo })}
              />
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-linea-2 pt-4">
          <Boton variante="fantasma" onClick={() => void copiarEnlace()}>
            {copiado ? 'Enlace copiado' : 'Copiar enlace'}
          </Boton>
          <Boton variante="secundario" onClick={cerrar}>
            Listo
          </Boton>
        </div>
      </Dialogo>
    </>
  )
}
