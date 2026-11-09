import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './Layout'
import { Muestra } from '../pantallas/Muestra'

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          {import.meta.env.DEV && <Route path="/muestra" element={<Muestra />} />}
          <Route
            path="*"
            element={
              <Layout>
                <h1 className="text-2xl font-semibold">Inicio</h1>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
