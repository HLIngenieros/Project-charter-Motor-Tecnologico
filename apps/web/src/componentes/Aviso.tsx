import type { ReactNode } from 'react'

export type TonoAviso = 'info' | 'ok' | 'alerta'

const TONOS: Record<TonoAviso, string> = {
  info: 'border-info/30 bg-info-suave text-[#17549f]',
  ok: 'border-ok/30 bg-ok-suave text-[#0f7a50]',
  alerta: 'border-alerta/30 bg-alerta-suave text-[#9c3d2b]',
}

export function Aviso({
  tono = 'info',
  children,
  className = '',
}: {
  tono?: TonoAviso
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role={tono === 'alerta' ? 'alert' : 'status'}
      className={`flex gap-2.5 rounded-control border px-3.5 py-2.5 text-sm font-medium ${TONOS[tono]} ${className}`}
    >
      <span aria-hidden className="mt-[0.4rem] size-1.5 shrink-0 rounded-full bg-current" />
      <div>{children}</div>
    </div>
  )
}
