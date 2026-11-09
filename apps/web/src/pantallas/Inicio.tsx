import { useNavigate } from 'react-router'
import { useSalir, useSesion } from '../api/sesion'
import { Layout } from '../app/Layout'
import { Aviso } from '../componentes/Aviso'
import { Boton } from '../componentes/Boton'

export function Inicio() {
  const { data: usuario } = useSesion()
  const salir = useSalir()
  const navegar = useNavigate()
  if (!usuario) return null

  const primerNombre = usuario.nombre.split(/\s+/)[0]

  return (
    <Layout
      derecha={
        <>
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
      }
    >
      <div className="flex max-w-2xl flex-col gap-4">
        <h1 className="text-3xl font-semibold">Hola, {primerNombre}</h1>
        {usuario.debeCambiarClave && (
          <Aviso tono="alerta">
            Debes cambiar tu clave antes de seguir. La opción llega con la pantalla de cuenta.
          </Aviso>
        )}
        <p className="text-texto-2">Aquí verás tus charters con su avance al último corte.</p>
      </div>
    </Layout>
  )
}
