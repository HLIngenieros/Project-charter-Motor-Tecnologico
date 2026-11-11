import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSesion } from '../api/sesion'
import { Aviso } from '../componentes/Aviso'
import { Boton } from '../componentes/Boton'
import { Cargando } from '../componentes/Cargando'

/** La API no respondió bien al pedir la sesión: no es que no haya sesión. */
function SinConexion({ reintentar, cargando }: { reintentar: () => void; cargando: boolean }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <Aviso tono="alerta">
        No pudimos comunicarnos con el servidor. Revisa tu conexión e intenta de nuevo.
      </Aviso>
      <Boton variante="secundario" cargando={cargando} onClick={reintentar} className="self-start">
        Reintentar
      </Boton>
    </div>
  )
}

/** Solo con sesión; si no, lleva a /entrar y recuerda a dónde se quería ir. */
export function RutaProtegida({ children }: { children: ReactNode }) {
  const sesion = useSesion()
  const ubicacion = useLocation()
  if (sesion.isPending) return <Cargando />
  if (sesion.isError)
    return <SinConexion reintentar={() => void sesion.refetch()} cargando={sesion.isFetching} />
  if (!sesion.data) return <Navigate to="/entrar" replace state={{ desde: ubicacion.pathname }} />
  return children
}

/** Solo sin sesión (entrar y registro); con sesión lleva al inicio. */
export function SoloInvitado({ children }: { children: ReactNode }) {
  const sesion = useSesion()
  if (sesion.isPending) return <Cargando />
  if (sesion.data) return <Navigate to="/" replace />
  return children
}

/** Solo para Admin (va dentro de `RutaProtegida`); a los demás los lleva al inicio. */
export function SoloAdmin({ children }: { children: ReactNode }) {
  const { data: usuario } = useSesion()
  if (!usuario?.esAdmin) return <Navigate to="/" replace />
  return children
}
