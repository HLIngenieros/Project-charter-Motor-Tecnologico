import { describe, expect, it } from 'vitest'
import { actividadEntrada } from '../../src/esquemas/actividad'
import {
  DOMINIO_POR_DEFECTO,
  esCorreoPermitido,
  loginEntrada,
  normalizarCorreo,
  registroEntrada,
} from '../../src/esquemas/auth'
import { respuestaError } from '../../src/esquemas/error'

describe('correo permitido', () => {
  it('normaliza espacios y mayúsculas', () => {
    expect(normalizarCorreo(' JUrbina@HLIngenieros.com ')).toBe('jurbina@hlingenieros.com')
    expect(esCorreoPermitido(' JUrbina@HLIngenieros.com ', 'hlingenieros.com')).toBe(true)
  })

  it.each([
    'x@hlingenieros.com.co',
    'x@malhlingenieros.com',
    'x@sub.hlingenieros.com',
    'hlingenieros.com',
    '@hlingenieros.com',
    'a@b@hlingenieros.com',
    'x y@hlingenieros.com',
  ])('rechaza %s', (correo) => {
    expect(esCorreoPermitido(correo, 'hlingenieros.com')).toBe(false)
  })

  it('usa hlingenieros.com por defecto', () => {
    expect(DOMINIO_POR_DEFECTO).toBe('hlingenieros.com')
  })
})

describe('registroEntrada', () => {
  const valido = { correo: ' Ana@HLIngenieros.com', nombre: 'Ana Pérez', clave: '0123456789' }

  it('acepta y normaliza un registro válido', () => {
    expect(registroEntrada.parse(valido)).toEqual({
      correo: 'ana@hlingenieros.com',
      nombre: 'Ana Pérez',
      clave: '0123456789',
    })
  })

  it('acepta una clave de 8 caracteres', () => {
    expect(registroEntrada.safeParse({ ...valido, clave: '01234567' }).success).toBe(true)
  })

  it('rechaza una clave de 7 caracteres con mensaje en español', () => {
    const r = registroEntrada.safeParse({ ...valido, clave: '0123456' })
    expect(r.success).toBe(false)
    const error = r.error!.issues.find((i) => i.path[0] === 'clave')
    expect(error?.message).toBe('La clave debe tener al menos 8 caracteres')
  })

  it('rechaza un nombre de una letra y un correo mal formado', () => {
    const r = registroEntrada.safeParse({ ...valido, nombre: 'A', correo: 'no-es-correo' })
    expect(r.success).toBe(false)
    expect(r.error!.issues.map((i) => i.path[0]).sort()).toEqual(['correo', 'nombre'])
  })

  it('login exige correo y clave', () => {
    expect(loginEntrada.safeParse({ correo: 'a@hlingenieros.com', clave: '' }).success).toBe(false)
  })
})

describe('actividadEntrada y respuestaError', () => {
  it('valida fechas YYYY-MM-DD y peso 0–1', () => {
    const base = { id: 'a', padreId: null, orden: 1, nombre: 'Actividad' }
    expect(actividadEntrada.safeParse({ ...base, inicio: '2025-03-01', peso: 0.5 }).success).toBe(
      true,
    )
    expect(actividadEntrada.safeParse({ ...base, inicio: '01/03/2025' }).success).toBe(false)
    expect(actividadEntrada.safeParse({ ...base, peso: 1.5 }).success).toBe(false)
  })

  it('describe la forma de los errores de la API', () => {
    const cuerpo = { error: { codigo: 'csrf', mensaje: 'x', campos: { clave: 'y' } } }
    expect(respuestaError.parse(cuerpo)).toEqual(cuerpo)
  })
})

describe('fechaISO', () => {
  it('rechaza fechas que no existen y acepta las reales', async () => {
    const { fechaISO } = await import('../../src/esquemas/actividad')
    expect(fechaISO.safeParse('2025-02-29').success).toBe(false)
    expect(fechaISO.safeParse('2025-02-30').success).toBe(false)
    expect(fechaISO.safeParse('2024-02-29').success).toBe(true)
    const r = fechaISO.safeParse('2025-02-30')
    expect(r.error?.issues[0]?.message).toBe('La fecha no existe')
  })
})
