import { lazy, Suspense, type ComponentType } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Entrar } from '../pantallas/Entrar'
import { Portafolio } from '../pantallas/portafolio/Portafolio'
import { Registro } from '../pantallas/Registro'
import { RUTA_CLAVE, RutaProtegida, SoloAdmin, SoloInvitado } from './RutaProtegida'

/** Carga una pantalla en su propio archivo (exportación con nombre). */
function diferida<M, K extends keyof M>(cargar: () => Promise<M>, nombre: K) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Componente = M[K] extends ComponentType<any> ? M[K] : never
  return lazy(async () => ({ default: (await cargar())[nombre] as Componente }))
}

// Entrar, Registro y el portafolio van en el paquete inicial; el resto se carga al visitarlo.
const Ficha = diferida(() => import('../pantallas/ficha/Ficha'), 'Ficha')
const RegistrarCorte = diferida(() => import('../pantallas/corte/RegistrarCorte'), 'RegistrarCorte')
const Imprimir = diferida(() => import('../pantallas/imprimir/Imprimir'), 'Imprimir')
const CambiarClave = diferida(() => import('../pantallas/CambiarClave'), 'CambiarClave')
const AreaAdmin = diferida(() => import('../pantallas/admin/AreaAdmin'), 'AreaAdmin')
const Cuentas = diferida(() => import('../pantallas/admin/Cuentas'), 'Cuentas')
const Catalogos = diferida(() => import('../pantallas/admin/Catalogos'), 'Catalogos')
const Parametrizacion = diferida(
  () => import('../pantallas/admin/Parametrizacion'),
  'Parametrizacion',
)
const Muestra = diferida(() => import('../pantallas/Muestra'), 'Muestra')

export function Rutas() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route
          path="/entrar"
          element={
            <SoloInvitado>
              <Entrar />
            </SoloInvitado>
          }
        />
        <Route
          path="/registro"
          element={
            <SoloInvitado>
              <Registro />
            </SoloInvitado>
          }
        />
        <Route
          path="/"
          element={
            <RutaProtegida>
              <Portafolio />
            </RutaProtegida>
          }
        />
        <Route
          path={RUTA_CLAVE}
          element={
            <RutaProtegida>
              <CambiarClave />
            </RutaProtegida>
          }
        />
        <Route
          path="/charters/:id"
          element={
            <RutaProtegida>
              <Ficha />
            </RutaProtegida>
          }
        />
        <Route
          path="/charters/:id/corte"
          element={
            <RutaProtegida>
              <RegistrarCorte />
            </RutaProtegida>
          }
        />
        <Route
          path="/charters/:id/imprimir"
          element={
            <RutaProtegida>
              <Imprimir />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin"
          element={
            <RutaProtegida>
              <SoloAdmin>
                <Navigate to="/admin/cuentas" replace />
              </SoloAdmin>
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/cuentas"
          element={
            <RutaProtegida>
              <SoloAdmin>
                <AreaAdmin>
                  <Cuentas />
                </AreaAdmin>
              </SoloAdmin>
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/catalogos"
          element={
            <RutaProtegida>
              <SoloAdmin>
                <AreaAdmin>
                  <Catalogos />
                </AreaAdmin>
              </SoloAdmin>
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/parametros"
          element={
            <RutaProtegida>
              <SoloAdmin>
                <AreaAdmin>
                  <Parametrizacion />
                </AreaAdmin>
              </SoloAdmin>
            </RutaProtegida>
          }
        />
        {import.meta.env.DEV && <Route path="/muestra" element={<Muestra />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
