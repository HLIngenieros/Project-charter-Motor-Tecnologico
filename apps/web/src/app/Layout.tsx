import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { transicionRuta, useVariantes } from '../movimiento'
import { EncabezadoApp } from './EncabezadoApp'

export function Layout({ derecha, children }: { derecha?: ReactNode; children: ReactNode }) {
  const variantes = useVariantes(transicionRuta)
  return (
    <div className="flex min-h-dvh flex-col">
      <EncabezadoApp derecha={derecha} />
      <motion.main
        variants={variantes}
        initial="oculto"
        animate="visible"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6"
      >
        {children}
      </motion.main>
    </div>
  )
}
