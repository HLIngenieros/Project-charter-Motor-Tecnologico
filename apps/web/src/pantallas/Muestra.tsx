import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Layout } from '../app/Layout'
import { Aviso } from '../componentes/Aviso'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { Dialogo } from '../componentes/Dialogo'
import { Pestanas } from '../componentes/Pestanas'
import { Tabla } from '../componentes/Tabla'
import { Tarjeta } from '../componentes/Tarjeta'
import { escalonado, sinMovimiento, useMovimientoReducido } from '../movimiento'

/** Pantalla de referencia del sistema de diseño (solo en desarrollo). */

const COLORES = [
  ['institucional', '#003366'],
  ['tinta', '#0B1F33'],
  ['texto', '#3B4B5E'],
  ['texto-2', '#5B6C7E'],
  ['texto-3', '#7C8CA1'],
  ['linea', '#DCE3EC'],
  ['fondo', '#EEF2F6'],
  ['acento', '#00A9E0'],
  ['ok', '#15A06A'],
  ['info', '#1F6FD1'],
  ['neutro', '#7C8CA1'],
  ['alerta', '#C4513C'],
] as const

const GRUPOS = [
  { nombre: 'Automatización', color: '#D98A00', fondo: '#FBF1DF', pv: 0.142, ev: 0.131 },
  { nombre: 'Análisis de Data', color: '#6A55D8', fondo: '#EEEBFB', pv: 0.175, ev: 0.175 },
  { nombre: 'Gestión del Conocimiento', color: '#0A9C9B', fondo: '#E1F4F3', pv: 0.06, ev: 0.03 },
]

interface Fila {
  item: string
  nombre: string
  peso: number
  fin: string
  real: number
}

const ACTIVIDADES: Fila[] = [
  {
    item: '1.1.1',
    nombre: 'Capacitación en el uso del software',
    peso: 0.08,
    fin: '30/04/2025',
    real: 0.6,
  },
  {
    item: '1.1.2',
    nombre: 'Diagnóstico y evaluación del uso',
    peso: 0.01,
    fin: '26/01/2025',
    real: 1,
  },
  {
    item: '1.1.4.3',
    nombre: 'Validación del flujo y requerimientos',
    peso: 0.002,
    fin: '15/03/2025',
    real: 0.8,
  },
]

const pct = (x: number) => `${(x * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

function Barra({ valor, color }: { valor: number; color: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-linea-2">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${valor * 100}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      />
    </div>
  )
}

export function Muestra() {
  const [pestana, setPestana] = useState('definicion')
  const [dialogo, setDialogo] = useState(false)
  const reducido = useMovimientoReducido()
  const v = reducido ? sinMovimiento : escalonado(0)

  return (
    <Layout derecha={<span className="truncate text-white/80">Sistema de diseño</span>}>
      <div className="flex flex-col gap-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold sm:text-4xl">Sistema de diseño</h1>
          <p className="mt-2 text-texto-2">
            Colores, tipografía y componentes tomados del Informe global de priorización.
          </p>
        </div>

        <Seccion titulo="Colores">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {COLORES.map(([nombre, hex]) => (
              <div
                key={nombre}
                className="overflow-hidden rounded-control border border-linea bg-superficie"
              >
                <div className="h-12" style={{ backgroundColor: hex }} />
                <div className="px-2.5 py-2">
                  <p className="text-sm font-semibold text-tinta">{nombre}</p>
                  <p className="cifra text-xs text-texto-2">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Tipografía">
          <Tarjeta>
            <p className="font-titulo text-3xl font-semibold text-tinta">Motor Tecnológico 2025</p>
            <p className="mt-2 max-w-prose">
              Plus Jakarta Sans lleva el texto corrido: objetivos, supuestos, riesgos y notas de
              cada corte. Sora titula y JetBrains Mono alinea las cifras.
            </p>
            <p className="cifra mt-3 text-2xl text-tinta">12,51 % · 12,47 % · −2 días</p>
          </Tarjeta>
        </Seccion>

        <Seccion titulo="Avance por eje">
          <div className="grid gap-4 md:grid-cols-3">
            {GRUPOS.map((g, i) => (
              <motion.div
                key={g.nombre}
                variants={reducido ? sinMovimiento : escalonado(i)}
                initial="oculto"
                animate="visible"
              >
                <Tarjeta acento={g.color} style={{ backgroundColor: g.fondo }} className="h-full">
                  <h3 className="text-base font-semibold" style={{ color: g.color }}>
                    {g.nombre}
                  </h3>
                  <p className="mt-2 font-titulo text-3xl font-semibold text-tinta tabular-nums">
                    {pct(g.ev)}
                  </p>
                  <p className="text-sm text-texto-2">real frente a {pct(g.pv)} planeado</p>
                  <div className="mt-3">
                    <Barra valor={g.ev} color={g.color} />
                  </div>
                </Tarjeta>
              </motion.div>
            ))}
          </div>
        </Seccion>

        <motion.div
          variants={v}
          initial="oculto"
          animate="visible"
          className="grid gap-10 lg:grid-cols-2"
        >
          <Seccion titulo="Botones">
            <div className="flex flex-wrap gap-3">
              <Boton>Registrar corte</Boton>
              <Boton variante="secundario">Cancelar</Boton>
              <Boton variante="fantasma">Ver historial</Boton>
              <Boton variante="peligro" onClick={() => setDialogo(true)}>
                Eliminar actividad
              </Boton>
              <Boton cargando>Guardar</Boton>
            </div>
          </Seccion>

          <Seccion titulo="Campos">
            <div className="flex flex-col gap-4">
              <Campo etiqueta="Nombre del charter" placeholder="Motor Tecnológico 2025" />
              <Campo
                etiqueta="Correo"
                defaultValue="ana@gmail.com"
                error="Usa tu correo @hlingenieros.com"
              />
            </div>
          </Seccion>
        </motion.div>

        <Seccion titulo="Avisos">
          <div className="flex flex-col gap-3">
            <Aviso tono="info">El último corte tiene más de 14 días.</Aviso>
            <Aviso tono="ok">Corte del 13/03/2025 registrado.</Aviso>
            <Aviso tono="alerta">
              Los pesos de las actividades suman 90 % y deberían sumar 100 %.
            </Aviso>
          </div>
        </Seccion>

        <Seccion titulo="Pestañas y tabla">
          <Pestanas
            etiqueta="Secciones del charter"
            pestanas={[
              { id: 'definicion', etiqueta: 'Definición' },
              { id: 'cronograma', etiqueta: 'Cronograma' },
              { id: 'cortes', etiqueta: 'Cortes' },
              { id: 'indicadores', etiqueta: 'Indicadores' },
            ]}
            activa={pestana}
            alCambiar={setPestana}
          />
          <Tabla
            titulo="Actividades del cronograma"
            filas={ACTIVIDADES}
            claveFila={(f) => f.item}
            columnas={[
              { id: 'item', titulo: 'Ítem', celda: (f) => <span className="cifra">{f.item}</span> },
              { id: 'nombre', titulo: 'Actividad', celda: (f) => f.nombre },
              { id: 'peso', titulo: 'Peso', numerica: true, celda: (f) => pct(f.peso) },
              { id: 'fin', titulo: 'Fin', numerica: true, celda: (f) => f.fin },
              { id: 'real', titulo: 'Real', numerica: true, celda: (f) => pct(f.real) },
            ]}
          />
        </Seccion>
      </div>

      <Dialogo
        abierto={dialogo}
        alCerrar={() => setDialogo(false)}
        titulo="¿Eliminar la actividad?"
      >
        <p className="text-texto">
          Se borra del cronograma. Los avances que ya registraste en cortes anteriores se conservan.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setDialogo(false)}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={() => setDialogo(false)}>
            Eliminar
          </Boton>
        </div>
      </Dialogo>
    </Layout>
  )
}
