import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSesion } from '../api/sesion'
import { Cargando } from '../componentes/Cargando'

/** Solo con sesión; si no, lleva a /entrar y recuerda a dónde se quería ir. */
export function RutaProtegida({ children }: { children: ReactNode }) {
  const sesion = useSesion()
  const ubicacion = useLocation()
  if (sesion.isPending) return <Cargando />
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
