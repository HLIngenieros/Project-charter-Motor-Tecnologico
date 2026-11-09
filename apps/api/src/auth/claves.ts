import { hash, verify } from '@node-rs/argon2'

// Algorithm.Argon2id = 2 (los enums const de @node-rs/argon2 no se pueden importar con isolatedModules).
const OPCIONES = { algorithm: 2 } as const

export function cifrarClave(clave: string): Promise<string> {
  return hash(clave, OPCIONES)
}

export async function verificarClave(hashClave: string, clave: string): Promise<boolean> {
  try {
    return await verify(hashClave, clave)
  } catch {
    return false
  }
}

/** Hash de relleno para que verificar un correo inexistente tarde lo mismo que uno real. */
let hashRelleno: Promise<string> | undefined
export function hashDeRelleno(): Promise<string> {
  hashRelleno ??= cifrarClave('clave-de-relleno-que-nunca-coincide')
  return hashRelleno
}
