/** Texto del aviso: «Se corrieron 3 actividades 5 días hábiles después». */
export function textoCorrimiento(corridas: number, delta: number): string {
  const verbo = corridas === 1 ? 'Se corrió 1 actividad' : `Se corrieron ${corridas} actividades`
  const dias = Math.abs(delta)
  return `${verbo} ${dias} ${dias === 1 ? 'día hábil' : 'días hábiles'} ${delta > 0 ? 'después' : 'antes'}`
}

/** Avisa que un cambio de fin corrió las actividades de abajo y permite deshacerlo. */
export function AvisoCorrimiento({
  corridas,
  delta,
  alDeshacer,
}: {
  corridas: number
  delta: number
  alDeshacer(): void
}) {
  return (
    <div
      role="status"
      className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-control bg-info-suave px-3 py-2 text-[0.8125rem] text-tinta"
    >
      <span>{textoCorrimiento(corridas, delta)}</span>
      <button
        type="button"
        onClick={alDeshacer}
        className="rounded-sm font-semibold text-institucional underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-acento"
      >
        Deshacer
      </button>
    </div>
  )
}
