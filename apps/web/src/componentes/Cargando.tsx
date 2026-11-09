/** Indicador de carga; `pantalla` ocupa todo el alto, si no, un bloque. */
export function Cargando({ pantalla = true }: { pantalla?: boolean }) {
  return (
    <div role="status" className={`grid place-items-center ${pantalla ? 'min-h-dvh' : 'py-20'}`}>
      <span
        aria-hidden
        className="size-6 animate-spin rounded-full border-2 border-institucional border-r-transparent"
      />
      <span className="sr-only">Cargando</span>
    </div>
  )
}
