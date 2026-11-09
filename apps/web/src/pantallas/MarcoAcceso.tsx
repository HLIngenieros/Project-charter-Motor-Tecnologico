import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Marca } from '../componentes/Marca'
import { entrada, useVariantes } from '../movimiento'

/** Marco de entrar y registro: banda institucional con retícula y una tarjeta centrada. */
export function MarcoAcceso({
  titulo,
  children,
  pie,
}: {
  titulo: string
  children: ReactNode
  pie: ReactNode
}) {
  const variantes = useVariantes(entrada)
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div aria-hidden className="reticula absolute inset-x-0 top-0 h-[22rem] sm:h-[26rem]" />
      <div className="relative mx-auto flex max-w-md flex-col px-4 pb-10 pt-8 sm:pt-14">
        <Marca />
        <p className="mt-8 max-w-xs font-titulo text-xl font-medium leading-snug text-white sm:text-2xl">
          Charters de proyecto con cronograma y cortes de avance.
        </p>
        <motion.div
          variants={variantes}
          initial="oculto"
          animate="visible"
          className="mt-8 rounded-tarjeta border border-linea bg-superficie p-6 shadow-dialogo sm:p-8"
        >
          <h1 className="text-2xl font-semibold">{titulo}</h1>
          <div className="mt-6">{children}</div>
        </motion.div>
        <div className="mt-6 text-center text-sm text-texto-2">{pie}</div>
      </div>
    </div>
  )
}
