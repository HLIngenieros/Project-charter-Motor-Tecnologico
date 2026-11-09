import type { LoginEntrada, RegistroEntrada, UsuarioPublico } from '@charter/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ErrorCliente } from './cliente'

export const CLAVE_SESION = ['sesion'] as const

/** Usuario de la sesión actual, o null si no hay sesión. */
export function useSesion() {
  return useQuery({
    queryKey: CLAVE_SESION,
    queryFn: async () => {
      try {
        return await api<UsuarioPublico>('/auth/yo')
      } catch (error) {
        if (error instanceof ErrorCliente && error.estado === 401) return null
        throw error
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useEntrar() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (datos: LoginEntrada) =>
      api<UsuarioPublico>('/auth/login', { metodo: 'POST', cuerpo: datos }),
    onSuccess: (usuario) => cliente.setQueryData(CLAVE_SESION, usuario),
  })
}

export function useRegistrar() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (datos: RegistroEntrada) =>
      api<UsuarioPublico>('/auth/registro', { metodo: 'POST', cuerpo: datos }),
    onSuccess: (usuario) => cliente.setQueryData(CLAVE_SESION, usuario),
  })
}

export function useSalir() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { metodo: 'POST' }),
    onSettled: () => {
      cliente.setQueryData(CLAVE_SESION, null)
      cliente.removeQueries({ predicate: (q) => q.queryKey[0] !== CLAVE_SESION[0] })
    },
  })
}
