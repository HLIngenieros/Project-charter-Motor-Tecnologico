import type {
  AreaPublica,
  CategoriaPublica,
  CharterCrear,
  CharterDetalle,
  CharterEditar,
  CharterResumen,
  ItemLista,
  TipoLista,
} from '@charter/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './cliente'

export const CLAVES = {
  charters: ['charters'] as const,
  charter: (id: string) => ['charter', id] as const,
  categorias: ['categorias'] as const,
  areas: ['areas'] as const,
}

const CINCO_MIN = 5 * 60_000

export function useCharters() {
  return useQuery({
    queryKey: CLAVES.charters,
    queryFn: () => api<CharterResumen[]>('/charters'),
  })
}

export function useCharter(id: string) {
  return useQuery({
    queryKey: CLAVES.charter(id),
    queryFn: () => api<CharterDetalle>(`/charters/${id}`),
    retry: false,
  })
}

export function useCategorias() {
  return useQuery({
    queryKey: CLAVES.categorias,
    queryFn: () => api<CategoriaPublica[]>('/categorias'),
    staleTime: CINCO_MIN,
  })
}

export function useAreas() {
  return useQuery({
    queryKey: CLAVES.areas,
    queryFn: () => api<AreaPublica[]>('/areas'),
    staleTime: CINCO_MIN,
  })
}

export function useCrearCharter() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (datos: CharterCrear) =>
      api<{ id: string }>('/charters', { metodo: 'POST', cuerpo: datos }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVES.charters }),
  })
}

export function useEditarCharter(id: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (cambios: CharterEditar) =>
      api<CharterDetalle>(`/charters/${id}`, { metodo: 'PATCH', cuerpo: cambios }),
    onSuccess: (detalle) => {
      cliente.setQueryData(CLAVES.charter(id), detalle)
      void cliente.invalidateQueries({ queryKey: CLAVES.charters })
    },
  })
}

export function useGuardarLista(id: string, tipo: TipoLista) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (items: { texto: string }[]) =>
      api<ItemLista[]>(`/charters/${id}/listas/${tipo}`, { metodo: 'PUT', cuerpo: { items } }),
    onSuccess: (items) => {
      cliente.setQueryData<CharterDetalle>(CLAVES.charter(id), (previo) =>
        previo ? { ...previo, listas: { ...previo.listas, [tipo]: items } } : previo,
      )
    },
  })
}

export function useEliminarCharter() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/charters/${id}`, { metodo: 'DELETE' }),
    onSuccess: (_, id) => {
      cliente.removeQueries({ queryKey: CLAVES.charter(id) })
      void cliente.invalidateQueries({ queryKey: CLAVES.charters })
    },
  })
}
