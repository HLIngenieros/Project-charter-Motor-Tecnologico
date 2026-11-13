import { Link, useNavigate } from 'react-router'
import { useSalir, useSesion } from '../api/sesion'
import { Boton } from '../componentes/Boton'
import { MenuAcciones, type Accion } from '../componentes/MenuAcciones'

const ENLACE =
  'rounded-control px-2 py-1.5 font-semibold text-white/90 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white'

function Flecha() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/**
 * Administración, nombre, «Cambiar clave» y «Salir», a la derecha de la banda institucional.
 * En celular van juntos en el menú «Cuenta»: con la marca completa no caben a 360 px.
 */
export function MenuUsuario() {
  const { data: usuario } = useSesion()
  const salir = useSalir()
  const navegar = useNavigate()
  if (!usuario) return null

  const cerrarSesion = () => salir.mutate(undefined, { onSettled: () => navegar('/entrar') })
  const acciones: Accion[] = [
    ...(usuario.esAdmin ? [{ etiqueta: 'Administración', alElegir: () => navegar('/admin') }] : []),
    { etiqueta: 'Cambiar clave', alElegir: () => navegar('/cuenta/clave') },
    { etiqueta: 'Salir', alElegir: cerrarSesion },
  ]

  return (
    <>
      <div className="contents max-sm:hidden">
        {usuario.esAdmin && (
          <Link to="/admin" className={ENLACE}>
            Administración
          </Link>
        )}
        <span className="truncate text-white/80">{usuario.nombre}</span>
        <Link to="/cuenta/clave" className={ENLACE}>
          Cambiar clave
        </Link>
        <Boton
          variante="fantasma"
          cargando={salir.isPending}
          onClick={cerrarSesion}
          className="min-h-9 text-white hover:bg-white/10"
        >
          Salir
        </Boton>
      </div>
      <div className="sm:hidden">
        <MenuAcciones
          etiqueta={`Cuenta de ${usuario.nombre}`}
          acciones={acciones}
          claseBoton={`${ENLACE} flex min-h-9 items-center gap-1`}
          boton={
            <>
              Cuenta
              <Flecha />
            </>
          }
        />
      </div>
    </>
  )
}
