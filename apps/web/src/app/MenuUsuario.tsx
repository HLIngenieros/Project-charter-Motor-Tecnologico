import { Link, useNavigate } from 'react-router'
import { useSalir, useSesion } from '../api/sesion'
import { Boton } from '../componentes/Boton'

/** Nombre del usuario y «Salir», a la derecha de la banda institucional. */
export function MenuUsuario() {
  const { data: usuario } = useSesion()
  const salir = useSalir()
  const navegar = useNavigate()
  if (!usuario) return null
  return (
    <>
      {usuario.esAdmin && (
        <Link
          to="/admin/parametros"
          className="rounded-control px-2 py-1.5 font-semibold text-white/90 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          Administración
        </Link>
      )}
      <span className="hidden truncate text-white/80 sm:inline">{usuario.nombre}</span>
      <Boton
        variante="fantasma"
        cargando={salir.isPending}
        onClick={() => salir.mutate(undefined, { onSettled: () => navegar('/entrar') })}
        className="min-h-9 text-white hover:bg-white/10"
      >
        Salir
      </Boton>
    </>
  )
}
