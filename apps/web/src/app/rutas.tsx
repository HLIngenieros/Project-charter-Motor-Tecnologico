import { Navigate, Route, Routes } from 'react-router'
import { Entrar } from '../pantallas/Entrar'
import { Ficha } from '../pantallas/ficha/Ficha'
import { Muestra } from '../pantallas/Muestra'
import { Portafolio } from '../pantallas/portafolio/Portafolio'
import { Registro } from '../pantallas/Registro'
import { RutaProtegida, SoloInvitado } from './RutaProtegida'

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
      {import.meta.env.DEV && <Route path="/muestra" element={<Muestra />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
