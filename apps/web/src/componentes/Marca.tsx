/** Sello "HL" y nombre de la plataforma, como en el encabezado del Informe global. */
export function Marca({ tono = 'claro' }: { tono?: 'claro' | 'oscuro' }) {
  const sobreOscuro = tono === 'claro'
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className={[
          'grid size-10 place-items-center rounded-sello font-titulo text-[0.95rem] font-bold tracking-tight',
          sobreOscuro ? 'bg-white text-institucional' : 'bg-institucional text-white',
        ].join(' ')}
      >
        HL
      </span>
      <span className="flex flex-col leading-tight">
        <span className={`text-xs font-medium ${sobreOscuro ? 'text-white/70' : 'text-texto-2'}`}>
          Grupo HL
        </span>
        <span
          className={`font-titulo text-[0.95rem] font-semibold ${sobreOscuro ? 'text-white' : 'text-tinta'}`}
        >
          Project Charters
        </span>
      </span>
    </div>
  )
}
