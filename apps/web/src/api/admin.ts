import type {
  CuentaAdmin,
  EditarCuentaEntrada,
  ParametrosRespuesta,
  ReglasEntrada,
} from '@charter/shared'
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

// ── Cuentas ─────────────────────────────────────────────────────────────

const CLAVE_CUENTAS = ['admin', 'cuentas'] as const

/** Todas las cuentas, con su conteo de charters y último acceso (solo Admin). */
export function useCuentas() {
  return useQuery({
    queryKey: CLAVE_CUENTAS,
    queryFn: () => api<CuentaAdmin[]>('/admin/cuentas'),
  })
}

/** Clave temporal nueva; la cuenta queda obligada a cambiarla. */
export function useRestablecerClave() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api<{ claveTemporal: string }>(`/admin/cuentas/${id}/restablecer-clave`, { metodo: 'POST' }),
    onSuccess: () => void cliente.invalidateQueries({ queryKey: CLAVE_CUENTAS }),
  })
}

export function useEditarCuenta() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: EditarCuentaEntrada }) =>
      api<CuentaAdmin>(`/admin/cuentas/${id}`, { metodo: 'PATCH', cuerpo: cambios }),
    onSuccess: (cuenta) =>
      cliente.setQueryData<CuentaAdmin[]>(CLAVE_CUENTAS, (lista) =>
        lista?.map((c) => (c.id === cuenta.id ? cuenta : c)),
      ),
  })
}
