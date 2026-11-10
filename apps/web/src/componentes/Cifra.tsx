import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect } from 'react'
import { useMovimientoReducido } from '../movimiento'

/** Número que se anima de su valor anterior al nuevo en 400 ms (salvo movimiento reducido). */
export function Cifra({
  valor,
  formato,
  className,
}: {
  valor: number
  formato: (n: number) => string
  className?: string
}) {
  const actual = useMotionValue(valor)
  const texto = useTransform(actual, formato)
  const reducido = useMovimientoReducido()

  useEffect(() => {
    if (reducido) {
      actual.set(valor)
      return
    }
    const control = animate(actual, valor, { duration: 0.4, ease: [0.22, 1, 0.36, 1] })
    return () => control.stop()
  }, [actual, valor, reducido])

  return <motion.span className={className}>{texto}</motion.span>
}
