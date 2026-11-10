import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { razonContraste } from '../src/estilos/contraste'

// Se lee de disco: Vitest no entrega el CSS crudo con ?raw.
const css = readFileSync(resolve(__dirname, '../src/estilos/tokens.css'), 'utf8')
const token = (nombre: string) => {
  const m = css.match(new RegExp(`--color-${nombre}: *(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`Falta el token ${nombre}`)
  return m[1]!
}

/** [texto, fondo suave, relleno] de cada tono del semáforo. */
const SEMAFORO: Record<string, [string, string, string]> = {
  al_dia: ['ok-texto', 'ok-suave', 'ok'],
  en_atencion: ['amarillo-texto', 'amarillo-suave', 'amarillo'],
  en_riesgo: ['naranja-texto', 'naranja-suave', 'naranja'],
  atrasada: ['alerta-texto', 'alerta-suave', 'alerta'],
  vencida: ['vencida', 'vencida-suave', 'vencida'],
}

describe('contraste', () => {
  it('calcula la razón WCAG', () => {
    expect(razonContraste('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(razonContraste('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })

  it.each(Object.entries(SEMAFORO))('%s: el texto del chip llega a 4,5:1', (_, [t, f]) => {
    expect(razonContraste(token(t), token(f))).toBeGreaterThanOrEqual(4.5)
  })

  // El amarillo no llega a 3:1 sin volverse café: en la curva lleva borde de amarillo-texto,
  // y el estado siempre se dice también en texto.
  it.each(Object.entries(SEMAFORO).filter(([k]) => k !== 'en_atencion'))(
    '%s: el relleno llega a 3:1 sobre la superficie',
    (_, [, , r]) => {
      expect(razonContraste(token(r), token('superficie'))).toBeGreaterThanOrEqual(3)
    },
  )

  it('el borde del amarillo llega a 3:1 sobre la superficie', () => {
    expect(razonContraste(token('amarillo-texto'), token('superficie'))).toBeGreaterThanOrEqual(3)
  })
})
