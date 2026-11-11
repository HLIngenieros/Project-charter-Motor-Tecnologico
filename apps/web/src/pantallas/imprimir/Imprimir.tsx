import type { CharterDetalle, CorteResumen, ItemLista } from '@charter/shared'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useAreas, useCategorias, useCharter } from '../../api/charters'
import { useCortes } from '../../api/cronograma'
import { Aviso } from '../../componentes/Aviso'
import { Boton, clasesBoton } from '../../componentes/Boton'
import { Cargando } from '../../componentes/Cargando'
import { Chip } from '../../componentes/Chip'
import { fechaCorta, hoyISO, porcentaje, puntos } from '../../formato'
import { chipDe } from '../ficha/cronograma/estados'
import { useBorradorCronograma } from '../ficha/cronograma/useBorradorCronograma'
import { SeccionCurvaS } from '../ficha/curva/SeccionCurvaS'
import { useVistaCronograma, type VistaCronograma } from '../ficha/useVistaCronograma'
import { CronogramaImpresion } from './CronogramaImpresion'
import './imprimir.css'

/** La vista no edita: lo que se encole no se envía. */
const SIN_COLA = () => {}

/** Ancho útil de un A4 con márgenes de 14 mm, en px CSS (182 mm). */
const ANCHO_CURVA = 688

const SIN_REGISTRAR = <p className="text-texto-2">Sin registrar</p>

function Seccion({
  titulo,
  larga = false,
  children,
}: {
  titulo: string
  /** Se puede partir entre hojas (cronograma, historial). */
  larga?: boolean
  children: ReactNode
}) {
  return (
    <section className={`seccion-impresion ${larga ? 'seccion-impresion-larga' : ''}`}>
      <h2 className="mb-2 font-titulo text-[1.0625rem] font-semibold text-tinta">{titulo}</h2>
      {children}
    </section>
  )
}

function Texto({ valor }: { valor: string }) {
  return valor.trim() ? (
    <p className="max-w-[75ch] whitespace-pre-line text-texto">{valor}</p>
  ) : (
    SIN_REGISTRAR
  )
}

function Lista({ items }: { items: ItemLista[] }) {
  const llenos = items.filter((i) => i.texto.trim())
  if (llenos.length === 0) return SIN_REGISTRAR
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5 text-texto marker:text-texto-3">
      {llenos.map((i) => (
        <li key={i.id}>{i.texto}</li>
      ))}
    </ul>
  )
}

function Campo({ titulo, valor }: { titulo: string; valor: string | null | undefined }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 bg-superficie px-3 py-2">
      <dt className="text-xs text-texto-2">{titulo}</dt>
      <dd className="truncate font-semibold text-tinta">{valor?.trim() || '—'}</dd>
    </div>
  )
}

function Cifra({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-xs text-texto-2">{titulo}</span>
      <b className="font-titulo text-xl font-semibold text-tinta tabular-nums">{children}</b>
    </div>
  )
}

function Encabezado({ charter: c, vista }: { charter: CharterDetalle; vista: VistaCronograma }) {
  const categorias = useCategorias()
  const areas = useAreas()
  const categoria = categorias.data?.find((x) => x.id === c.categoriaId)?.nombre
  const area = areas.data?.find((x) => x.id === c.areaId)?.nombre
  const p = vista.calculo.proyecto
  const conCorte = vista.fechaCorte !== null && vista.arbol.length > 0
  const chip = conCorte ? chipDe(p, false) : { tono: 'neutro' as const, texto: 'Sin cortes' }

  return (
    <header className="seccion-impresion flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold tracking-wide text-texto-2 uppercase">
          Project Charter{c.codigo ? ` · ${c.codigo}` : ''}
        </p>
        <h1 className="mt-1 font-titulo text-[1.625rem] leading-tight font-semibold text-tinta">
          {c.nombre}
        </h1>
        <p className="mt-1 text-[0.8125rem] text-texto-2">
          {[area, `creado el ${fechaCorta(c.creadoEn)}`].filter(Boolean).join(' · ')}
        </p>
      </div>
      <dl className="grid grid-cols-4 gap-px overflow-hidden rounded-control border border-linea bg-linea">
        <Campo titulo="Responsable" valor={c.responsable} />
        <Campo titulo="Patrocinador" valor={c.patrocinador} />
        <Campo titulo="Categoría" valor={categoria} />
        <Campo titulo="Revisión" valor={c.revision} />
      </dl>
      <div
        role="group"
        aria-label="Resumen del avance"
        className="flex flex-wrap items-end gap-x-7 gap-y-2 rounded-control border border-linea px-4 py-3"
      >
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-texto-2">
            {vista.historica ? 'Corte elegido' : 'Último corte'}
          </span>
          <b className="font-titulo text-[0.9375rem] font-semibold text-tinta">
            {vista.fechaCorte ? `Corte del ${fechaCorta(vista.fechaCorte)}` : 'Sin cortes'}
          </b>
        </div>
        {conCorte && (
          <>
            <Cifra titulo="Planeado">{porcentaje(p.pv)}</Cifra>
            <Cifra titulo="Real">{porcentaje(p.ev)}</Cifra>
            <Cifra titulo="Brecha">{puntos(Math.max(0, p.pv - p.ev))}</Cifra>
          </>
        )}
        <div className="pb-0.5">
          <Chip tono={chip.tono}>{chip.texto}</Chip>
        </div>
        {conCorte && p.forecast && (
          <div className="ml-auto flex flex-col text-right leading-tight">
            <span className="text-xs text-texto-2">Fin proyectado</span>
            <b className="font-titulo text-[0.9375rem] font-semibold text-tinta">
              {fechaCorta(p.forecast)}
            </b>
          </div>
        )}
      </div>
    </header>
  )
}

function Historial({ cortes, elegido }: { cortes: CorteResumen[]; elegido: string | null }) {
  if (cortes.length === 0) return SIN_REGISTRAR
  return (
    <table
      aria-label="Historial de cortes"
      className="tabla-impresion w-full border-collapse text-[8.5pt]"
    >
      <thead>
        <tr className="border-b border-linea text-left text-texto-2">
          <th className="py-1.5 pr-2 font-semibold">Corte</th>
          <th className="py-1.5 pr-2 font-semibold">Estado</th>
          <th className="py-1.5 pr-2 text-right font-semibold">Planeado</th>
          <th className="py-1.5 pr-2 text-right font-semibold">Real</th>
          <th className="py-1.5 pr-2 text-right font-semibold">Brecha</th>
          <th className="w-[45%] py-1.5 font-semibold">Nota</th>
        </tr>
      </thead>
      <tbody>
        {[...cortes].reverse().map((c) => {
          const chip = chipDe(c, false)
          return (
            <tr key={c.fecha} className="fila-impresion border-b border-linea-2 align-top">
              <td className="py-1.5 pr-2 font-semibold whitespace-nowrap text-tinta">
                {fechaCorta(c.fecha)}
                {c.fecha === elegido && (
                  <span className="font-normal text-texto-2"> · elegido</span>
                )}
              </td>
              <td className="py-1.5 pr-2">
                <Chip tono={chip.tono}>{chip.texto}</Chip>
              </td>
              <td className="py-1.5 pr-2 text-right font-cifra">{porcentaje(c.pv)}</td>
              <td className="py-1.5 pr-2 text-right font-cifra">{porcentaje(c.ev)}</td>
              <td className="py-1.5 pr-2 text-right font-cifra">
                {puntos(Math.max(0, c.pv - c.ev))}
              </td>
              <td className="py-1.5 whitespace-pre-line text-texto">{c.nota || '—'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** Texto CSS entre comillas para `content:` (JSON escapa comillas y barras igual que CSS). */
const cadenaCss = (t: string) => JSON.stringify(t)

function Documento({ charter }: { charter: CharterDetalle }) {
  const borrador = useBorradorCronograma(charter.id, SIN_COLA, charter.reglas)
  const vista = useVistaCronograma(charter.id, borrador, charter.reglas)
  const cortes = useCortes(charter.id)
  const listo = !vista.cargando && !vista.resolviendoCorte && cortes.isSuccess
  const hoy = fechaCorta(hoyISO())
  const pie = [
    charter.nombre,
    vista.fechaCorte ? `Corte del ${fechaCorta(vista.fechaCorte)}` : 'Sin cortes',
    `Generado el ${hoy}`,
  ].join(' · ')
  const volver = `/charters/${charter.id}${vista.corteElegido ? `?corte=${vista.corteElegido}` : ''}`

  // Una sola vez, cuando todo cargó. La marca va dentro del temporizador: así el doble efecto
  // del modo estricto no la deja puesta sin haber impreso.
  const impreso = useRef(false)
  useEffect(() => {
    if (!listo) return
    const t = setTimeout(() => {
      if (impreso.current) return
      impreso.current = true
      const fuentes = document.fonts?.ready ?? Promise.resolve()
      void fuentes.then(() => window.print())
    }, 300)
    return () => clearTimeout(t)
  }, [listo])

  return (
    <div className="min-h-dvh bg-fondo print:bg-white">
      {/* jsdom no entiende las cajas de margen de @page: en pruebas se omite. */}
      {import.meta.env.MODE !== 'test' && (
        <style>{`@page {
  @bottom-left { content: ${cadenaCss(pie)}; font: 7.5pt 'Plus Jakarta Sans Variable', sans-serif; color: #5b6b7d; }
  @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 7.5pt 'Plus Jakarta Sans Variable', sans-serif; color: #5b6b7d; }
}`}</style>
      )}
      <div className="sticky top-0 z-10 border-b border-linea bg-superficie print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-3 px-4 py-2.5">
          <p className="mr-auto text-sm text-texto-2">Vista de impresión · A4 vertical</p>
          <Link to={volver} className={clasesBoton('secundario')}>
            Volver a la ficha
          </Link>
          <Boton onClick={() => window.print()} disabled={!listo}>
            Imprimir o guardar como PDF
          </Boton>
        </div>
      </div>

      <article className="hoja-impresion mx-auto my-6 flex w-[210mm] max-w-full flex-col gap-7 border border-linea bg-superficie p-[14mm] text-[0.875rem] shadow-sm max-sm:my-0 max-sm:p-4">
        {vista.avisoCorte && <Aviso tono="alerta">{vista.avisoCorte}</Aviso>}
        <Encabezado charter={charter} vista={vista} />
        <Seccion titulo="Razón de ser">
          <Texto valor={charter.razonDeSer} />
        </Seccion>
        <Seccion titulo="Objetivo general">
          <Texto valor={charter.objetivoGeneral} />
        </Seccion>
        <Seccion titulo="Objetivos específicos">
          <Lista items={charter.listas.objetivo} />
        </Seccion>
        <div className="curva-impresion">
          <SeccionCurvaS
            vista={vista}
            cortes={vista.cortes}
            reglas={charter.reglas}
            estatica
            ancho={ANCHO_CURVA}
          />
        </div>
        <Seccion titulo="Cronograma" larga>
          {vista.cargando ? <Cargando /> : <CronogramaImpresion vista={vista} />}
        </Seccion>
        <Seccion titulo="Supuestos">
          <Lista items={charter.listas.supuesto} />
        </Seccion>
        <Seccion titulo="Criterios de éxito">
          <Lista items={charter.listas.criterio_exito} />
        </Seccion>
        <Seccion titulo="Historial de cortes" larga>
          <Historial cortes={vista.cortes} elegido={vista.corteElegido} />
        </Seccion>
        <footer className="border-t border-linea pt-3 text-xs text-texto-2 print:hidden">
          {pie}
        </footer>
      </article>
    </div>
  )
}

/** `/charters/:id/imprimir[?corte=]`: la ficha completa como documento A4. */
export function Imprimir() {
  const { id = '' } = useParams()
  const charter = useCharter(id)
  if (charter.isPending) return <Cargando />
  if (charter.isError)
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Aviso tono="alerta">{charter.error.message}</Aviso>
      </div>
    )
  return <Documento charter={charter.data} />
}
