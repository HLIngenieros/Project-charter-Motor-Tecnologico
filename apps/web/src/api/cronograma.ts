import type {
  CorteDetalle,
  CorteEntrada,
  CorteResumen,
  CronogramaEntrada,
  CronogramaRespuesta,
  FechaISO,
} from '@charter/shared'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { CLAVES } from './charters'
import { api } from './cliente'

export function useCronograma(id: string) {
  return useQuery({
    queryKey: CLAVES.cronograma(id),
    queryFn: () => api<CronogramaRespuesta>(`/charters/${id}/cronograma`),
    retry: false,
  })
}

export function useGuardarCronograma(id: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (entrada: CronogramaEntrada) =>
      api<CronogramaRespuesta>(`/charters/${id}/cronograma`, { metodo: 'PUT', cuerpo: entrada }),
    onSuccess: (r) => {
      cliente.setQueryData(CLAVES.cronograma(id), r)
      void cliente.invalidateQueries({ queryKey: CLAVES.charters })
    },
  })
}

export function useCortes(id: string) {
  return useQuery({
    queryKey: CLAVES.cortes(id),
    queryFn: () => api<CorteResumen[]>(`/charters/${id}/cortes`),
  })
}

export function useCorte(id: string, fecha: FechaISO | null) {
  return useQuery({
    queryKey: CLAVES.corte(id, fecha ?? ''),
    queryFn: () => api<CorteDetalle>(`/charters/${id}/cortes/${fecha}`),
    enabled: !!fecha,
    retry: false,
  })
}

/** Un corte cambia la situación del charter: refresca todo lo que la muestra. */
function refrescarTrasCorte(cliente: QueryClient, id: string) {
  void cliente.invalidateQueries({ queryKey: CLAVES.cortes(id) })
  void cliente.invalidateQueries({ queryKey: ['corte', id] })
  void cliente.invalidateQueries({ queryKey: CLAVES.cronograma(id) })
  void cliente.invalidateQueries({ queryKey: CLAVES.charter(id) })
  void cliente.invalidateQueries({ queryKey: CLAVES.charters })
}

export function useGuardarCorte(id: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ fecha, entrada }: { fecha: FechaISO; entrada: CorteEntrada }) =>
      api<CorteDetalle>(`/charters/${id}/cortes/${fecha}`, { metodo: 'PUT', cuerpo: entrada }),
    onSuccess: () => refrescarTrasCorte(cliente, id),
  })
}

export function useEliminarCorte(id: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (fecha: FechaISO) =>
      api<void>(`/charters/${id}/cortes/${fecha}`, { metodo: 'DELETE' }),
    onSuccess: () => refrescarTrasCorte(cliente, id),
  })
}
