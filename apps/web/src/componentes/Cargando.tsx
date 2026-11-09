/** Indicador de carga de pantalla completa. */
export function Cargando() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center">
      <span
        aria-hidden
        className="size-6 animate-spin rounded-full border-2 border-institucional border-r-transparent"
      />
      <span className="sr-only">Cargando</span>
    </div>
  )
}
