import type { ParametrosRespuesta, ReglasEntrada } from '@charter/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './cliente'

const CLAVE_PARAMETROS = ['admin', 'parametros'] as const

/** Reglas vigentes para los charters nuevos (solo Admin). */
export function useParametros() {
  return useQuery({
    queryKey: CLAVE_PARAMETROS,
    queryFn: () => api<ParametrosRespuesta>('/admin/parametros'),
  })
}

export function useGuardarParametros() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (reglas: ReglasEntrada) =>
      api<ParametrosRespuesta>('/admin/parametros', { metodo: 'PUT', cuerpo: reglas }),
    onSuccess: (datos) => cliente.setQueryData(CLAVE_PARAMETROS, datos),
  })
}
