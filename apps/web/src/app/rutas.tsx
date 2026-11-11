import { Navigate, Route, Routes } from 'react-router'
import { AreaAdmin } from '../pantallas/admin/AreaAdmin'
import { Parametrizacion } from '../pantallas/admin/Parametrizacion'
import { RegistrarCorte } from '../pantallas/corte/RegistrarCorte'
import { Entrar } from '../pantallas/Entrar'
import { Ficha } from '../pantallas/ficha/Ficha'
import { Imprimir } from '../pantallas/imprimir/Imprimir'
import { Muestra } from '../pantallas/Muestra'
import { Portafolio } from '../pantallas/portafolio/Portafolio'
import { Registro } from '../pantallas/Registro'
import { RutaProtegida, SoloAdmin, SoloInvitado } from './RutaProtegida'

export function Rutas() {
  return (
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
              <Navigate to="/admin/parametros" replace />
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
  )
}
