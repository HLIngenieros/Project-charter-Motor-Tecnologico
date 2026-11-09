import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { transicionRuta, useVariantes } from '../movimiento'
import { EncabezadoApp } from './EncabezadoApp'
import { MenuUsuario } from './MenuUsuario'

export type AnchoLayout = 'portafolio' | 'ficha' | 'texto'

export const ANCHOS: Record<AnchoLayout, string> = {
  portafolio: 'max-w-[1280px]',
  ficha: 'max-w-[1360px]',
  texto: 'max-w-6xl',
}

export function Layout({
  ancho = 'texto',
  derecha = <MenuUsuario />,
  arriba,
  children,
}: {
  ancho?: AnchoLayout
  derecha?: ReactNode
  /** Banda pegada bajo el encabezado (p. ej. la banda de estado de la ficha). */
  arriba?: ReactNode
  children: ReactNode
}) {
  const variantes = useVariantes(transicionRuta)
  return (
    <div className="flex min-h-dvh flex-col">
      <EncabezadoApp derecha={derecha} ancho={ANCHOS[ancho]} />
      {arriba}
      <motion.main
        variants={variantes}
        initial="oculto"
        animate="visible"
        className={`mx-auto w-full ${ANCHOS[ancho]} flex-1 px-4 py-8 sm:px-6`}
      >
        {children}
      </motion.main>
    </div>
  )
}
