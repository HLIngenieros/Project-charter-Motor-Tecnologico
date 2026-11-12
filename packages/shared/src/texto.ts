/** Texto sin tildes ni mayúsculas, recortado: para buscar y comparar nombres. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}
