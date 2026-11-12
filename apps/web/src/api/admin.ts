import type {
  CatalogoAdmin,
  CategoriaAdmin,
  CuentaAdmin,
  EditarCuentaEntrada,
  ParametrosRespuesta,
  ReglasEntrada,
} from '@charter/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CLAVES } from './charters'
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

// ── Catálogos ───────────────────────────────────────────────────────────

export type TipoCatalogo = 'categorias' | 'areas'

/** Fila del catálogo según su tipo (las categorías traen color y `protegida`). */
export type FilaCatalogo<T extends TipoCatalogo> = T extends 'categorias'
  ? CategoriaAdmin
  : CatalogoAdmin

export type CambiosCatalogo = { nombre?: string; color?: string; activa?: boolean; orden?: number }

const claveCatalogo = (tipo: TipoCatalogo) => ['admin', 'catalogos', tipo] as const

/** Tras cambiar un catálogo, se refrescan la lista del Admin y la pública (formularios). */
function useRefrescarCatalogo(tipo: TipoCatalogo) {
  const cliente = useQueryClient()
  return () => {
    void cliente.invalidateQueries({ queryKey: claveCatalogo(tipo) })
    void cliente.invalidateQueries({ queryKey: CLAVES[tipo] })
  }
}

/** Catálogo completo con inactivas y conteo de charters (solo Admin). */
export function useCatalogoAdmin<T extends TipoCatalogo>(tipo: T) {
  return useQuery({
    queryKey: claveCatalogo(tipo),
    queryFn: () => api<FilaCatalogo<T>[]>(`/admin/catalogos/${tipo}`),
  })
}

export function useCrearCatalogo(tipo: TipoCatalogo) {
  const refrescar = useRefrescarCatalogo(tipo)
  return useMutation({
    mutationFn: (datos: { nombre: string; color?: string }) =>
      api<CatalogoAdmin>(`/admin/catalogos/${tipo}`, { metodo: 'POST', cuerpo: datos }),
    onSuccess: refrescar,
  })
}

export function useEditarCatalogo(tipo: TipoCatalogo) {
  const refrescar = useRefrescarCatalogo(tipo)
  return useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: CambiosCatalogo }) =>
      api<CatalogoAdmin>(`/admin/catalogos/${tipo}/${id}`, { metodo: 'PATCH', cuerpo: cambios }),
    onSuccess: refrescar,
  })
}

export function useEliminarCatalogo(tipo: TipoCatalogo) {
  const refrescar = useRefrescarCatalogo(tipo)
  return useMutation({
    mutationFn: (id: string) => api<void>(`/admin/catalogos/${tipo}/${id}`, { metodo: 'DELETE' }),
    onSuccess: refrescar,
  })
}
