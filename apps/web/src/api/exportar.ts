import type { ExportacionCharter, FechaISO } from '@charter/shared'
import { hoyISO } from '../formato'
import { api } from './cliente'

const conCorte = (ruta: string, corte: FechaISO | null) =>
  corte ? `${ruta}?corte=${encodeURIComponent(corte)}` : ruta

/** 'Plan TI 2026' → 'plan-ti-2026': minúsculas, sin tildes y con guiones. */
export function slug(texto: string): string {
  return (
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'charter'
  )
}

/** Ruta de la vista de impresión (PDF) del charter, en el corte elegido. */
export function rutaImpresion(id: string, corte: FechaISO | null): string {
  return conCorte(`/charters/${id}/imprimir`, corte)
}

/** Pide el charter completo a la API y lo descarga como archivo JSON. */
export async function descargarJson(
  charter: { id: string; nombre: string; codigo: string | null },
  corte: FechaISO | null,
): Promise<void> {
  const datos = await api<ExportacionCharter>(conCorte(`/charters/${charter.id}/exportar`, corte))
  const archivo = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `charter-${slug(charter.codigo || charter.nombre)}-${datos.corte ?? hoyISO()}.json`
  document.body.append(enlace)
  enlace.click()
  enlace.remove()
  // Algunos navegadores leen el blob después del clic: se libera en la siguiente vuelta.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
