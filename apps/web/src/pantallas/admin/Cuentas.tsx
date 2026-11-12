import { normalizar, type CuentaAdmin } from '@charter/shared'
import { useMemo, useState } from 'react'
import { useCuentas, useEditarCuenta, useRestablecerClave } from '../../api/admin'
import { ErrorCliente } from '../../api/cliente'
import { useSesion } from '../../api/sesion'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Campo } from '../../componentes/Campo'
import { Cargando } from '../../componentes/Cargando'
import { Chip } from '../../componentes/Chip'
import { Dialogo } from '../../componentes/Dialogo'
import { MenuAcciones, type Accion } from '../../componentes/MenuAcciones'
import { Selector } from '../../componentes/Selector'

type FiltroEstado = 'activas' | 'desactivadas' | 'todas'

type Operacion =
  { tipo: 'restablecer' } | { tipo: 'editar'; cambios: { activo?: boolean; esAdmin?: boolean } }

interface Confirmacion {
  cuenta: CuentaAdmin
  operacion: Operacion
  titulo: string
  texto: string
  boton: string
  peligro?: boolean
}

const COLUMNAS = 'md:grid-cols-[minmax(0,2.2fr)_6rem_7.5rem_5.5rem_8rem_2.25rem]'

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

const mensajeDe = (error: unknown) =>
  error instanceof ErrorCliente ? error.message : 'Algo falló. Intenta de nuevo.'

function acciones(c: CuentaAdmin, propia: boolean, pedir: (k: Confirmacion) => void): Accion[] {
  const lista: Accion[] = [
    {
      etiqueta: 'Restablecer clave',
      alElegir: () =>
        pedir({
          cuenta: c,
          operacion: { tipo: 'restablecer' },
          titulo: 'Restablecer clave',
          texto: `Se generará una clave temporal para ${c.nombre} y se cerrarán sus sesiones abiertas.`,
          boton: 'Restablecer clave',
        }),
    },
  ]
  if (!propia || !c.esAdmin) {
    lista.push(
      c.esAdmin
        ? {
            etiqueta: 'Quitar Admin',
            alElegir: () =>
              pedir({
                cuenta: c,
                operacion: { tipo: 'editar', cambios: { esAdmin: false } },
                titulo: 'Quitar Admin',
                texto: `${c.nombre} dejará de ver la administración y los charters de los demás.`,
                boton: 'Quitar Admin',
              }),
          }
        : {
            etiqueta: 'Dar Admin',
            alElegir: () =>
              pedir({
                cuenta: c,
                operacion: { tipo: 'editar', cambios: { esAdmin: true } },
                titulo: 'Dar Admin',
                texto: `${c.nombre} podrá administrar cuentas, catálogos y parámetros, y leer todos los charters.`,
                boton: 'Dar Admin',
              }),
          },
    )
  }
  if (!propia) {
    lista.push(
      c.activo
        ? {
            etiqueta: 'Desactivar',
            peligro: true,
            alElegir: () =>
              pedir({
                cuenta: c,
                operacion: { tipo: 'editar', cambios: { activo: false } },
                titulo: 'Desactivar cuenta',
                texto: `${c.nombre} no podrá entrar y se cerrarán sus sesiones. Sus charters se conservan.`,
                boton: 'Desactivar',
                peligro: true,
              }),
          }
        : {
            etiqueta: 'Reactivar',
            alElegir: () =>
              pedir({
                cuenta: c,
                operacion: { tipo: 'editar', cambios: { activo: true } },
                titulo: 'Reactivar cuenta',
                texto: `${c.nombre} podrá volver a entrar con su clave.`,
                boton: 'Reactivar',
              }),
          },
    )
  }
  return lista
}

/** Diálogo que muestra la clave temporal una sola vez. */
function DialogoClave({ clave, alCerrar }: { clave: string | null; alCerrar: () => void }) {
  const [copiada, setCopiada] = useState(false)
  const cerrar = () => {
    setCopiada(false)
    alCerrar()
  }
  return (
    <Dialogo abierto={clave !== null} alCerrar={cerrar} titulo="Clave temporal">
      <p className="text-[0.9375rem] text-texto">
        Pásasela a la persona; al entrar deberá cambiarla.
      </p>
      <div className="mt-4 flex items-center gap-3 rounded-control border border-linea bg-fondo px-4 py-3">
        <code className="flex-1 font-mono text-lg tracking-wider text-tinta select-all">
          {clave}
        </code>
        <Boton
          variante="secundario"
          onClick={() => {
            if (!clave) return
            void navigator.clipboard?.writeText(clave).then(() => setCopiada(true))
          }}
        >
          Copiar
        </Boton>
      </div>
      <p aria-live="polite" className="mt-2 h-5 text-sm text-ok-texto">
        {copiada ? 'Copiada al portapapeles.' : ''}
      </p>
      <div className="mt-4 flex justify-end">
        <Boton onClick={cerrar}>Listo</Boton>
      </div>
    </Dialogo>
  )
}

/** Admin › Cuentas: buscar, restablecer clave, activar y dar o quitar el rol de Admin. */
export function Cuentas() {
  const cuentas = useCuentas()
  const { data: yo } = useSesion()
  const restablecer = useRestablecerClave()
  const editar = useEditarCuenta()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<FiltroEstado>('activas')
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null)
  const [clave, setClave] = useState<string | null>(null)

  const visibles = useMemo(() => {
    const q = normalizar(texto)
    return (cuentas.data ?? []).filter((c) => {
      if (estado === 'activas' && !c.activo) return false
      if (estado === 'desactivadas' && c.activo) return false
      return !q || normalizar(`${c.nombre} ${c.correo}`).includes(q)
    })
  }, [cuentas.data, texto, estado])

  const pedir = (k: Confirmacion) => {
    restablecer.reset()
    editar.reset()
    setConfirmacion(k)
  }

  const confirmar = async () => {
    if (!confirmacion) return
    const { cuenta, operacion } = confirmacion
    try {
      if (operacion.tipo === 'restablecer') {
        const r = await restablecer.mutateAsync(cuenta.id)
        setConfirmacion(null)
        setClave(r.claveTemporal)
      } else {
        await editar.mutateAsync({ id: cuenta.id, cambios: operacion.cambios })
        setConfirmacion(null)
      }
    } catch {
      // El error se muestra en el diálogo.
    }
  }

  if (cuentas.isPending) return <Cargando pantalla={false} />
  if (cuentas.isError) return <Aviso tono="alerta">{mensajeDe(cuentas.error)}</Aviso>

  const error = restablecer.error ?? editar.error
  const enCurso = restablecer.isPending || editar.isPending

  return (
    <section aria-labelledby="titulo-cuentas">
      <h2 id="titulo-cuentas" className="sr-only">
        Cuentas
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <Campo
          etiqueta="Buscar"
          type="search"
          placeholder="Nombre o correo"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full sm:w-72"
        />
        <Selector
          etiqueta="Estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value as FiltroEstado)}
          className="w-full sm:w-44"
        >
          <option value="activas">Activas</option>
          <option value="desactivadas">Desactivadas</option>
          <option value="todas">Todas</option>
        </Selector>
        <p className="ml-auto pb-3 text-sm text-texto-2 max-sm:ml-0">
          {visibles.length} {visibles.length === 1 ? 'cuenta' : 'cuentas'}
        </p>
      </div>

      <div className="mt-4 rounded-tarjeta border border-linea bg-superficie">
        <div
          aria-hidden
          className={`hidden border-b border-linea bg-fondo/60 px-5 py-2.5 text-xs font-semibold text-texto-2 md:grid md:gap-4 ${COLUMNAS}`}
        >
          <div>Cuenta</div>
          <div>Rol</div>
          <div>Estado</div>
          <div className="text-right">Charters</div>
          <div>Último acceso</div>
          <div />
        </div>
        {visibles.length === 0 ? (
          <p className="px-5 py-10 text-center text-texto-2">Ninguna cuenta coincide.</p>
        ) : (
          <ul>
            {visibles.map((c) => {
              const propia = c.id === yo?.id
              return (
                <li
                  key={c.id}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 border-b border-linea-2 px-5 py-3 last:border-0 md:gap-y-0 ${COLUMNAS}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-tinta">
                      {c.nombre}
                      {propia && <span className="font-normal text-texto-2"> (tú)</span>}
                    </p>
                    <p className="truncate text-sm text-texto-2">{c.correo}</p>
                  </div>
                  {/* Arriba a la derecha en celular; última columna desde md. */}
                  <div className="col-start-2 row-start-1 md:col-start-6">
                    <MenuAcciones
                      etiqueta={`Acciones de ${c.nombre}`}
                      acciones={acciones(c, propia, pedir)}
                    />
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center gap-2 md:contents">
                    <div>{c.esAdmin ? <Chip tono="terminada">Admin</Chip> : null}</div>
                    <div>
                      <Chip tono={c.activo ? 'neutro' : 'atrasada'}>
                        {c.activo ? 'Activa' : 'Desactivada'}
                      </Chip>
                    </div>
                    <div className="text-sm text-texto-2 md:text-right">
                      <span className="cifra text-tinta">{c.charters}</span>
                      <span className="md:hidden"> charters</span>
                    </div>
                    <div className="text-sm text-texto-2">
                      <span className="md:hidden">Último acceso: </span>
                      {c.ultimoAcceso ? fecha(c.ultimoAcceso) : 'nunca'}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Dialogo
        abierto={confirmacion !== null}
        alCerrar={() => setConfirmacion(null)}
        titulo={confirmacion?.titulo ?? ''}
      >
        <p className="text-[0.9375rem] text-texto">{confirmacion?.texto}</p>
        {error && (
          <Aviso tono="alerta" className="mt-4">
            {mensajeDe(error)}
          </Aviso>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setConfirmacion(null)}>
            Volver
          </Boton>
          <Boton
            variante={confirmacion?.peligro ? 'peligro' : 'primario'}
            cargando={enCurso}
            onClick={() => void confirmar()}
          >
            {confirmacion?.boton}
          </Boton>
        </div>
      </Dialogo>
      <DialogoClave clave={clave} alCerrar={() => setClave(null)} />
    </section>
  )
}
