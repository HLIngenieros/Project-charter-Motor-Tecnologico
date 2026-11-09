import { BrowserRouter } from 'react-router'
import { Proveedores } from './Proveedores'
import { Rutas } from './rutas'

export function App() {
  return (
    <Proveedores>
      <BrowserRouter>
        <Rutas />
      </BrowserRouter>
    </Proveedores>
  )
}
