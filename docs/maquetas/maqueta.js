/* Maquetas T1.3 · datos de ejemplo y port mínimo del motor (packages/shared/src/calculo/cronograma.ts).
   Las actividades vienen del Excel ID & TI 2025; el grupo 1.2 y algunas fechas son de ejemplo. */
(function () {
  const DIA = 86400000
  const aDia = (s) => Math.round(Date.parse(s + 'T00:00:00Z') / DIA)
  const aISO = (d) => new Date(d * DIA).toISOString().slice(0, 10)
  const UMB = { atencion: 10, riesgo: 25, atraso: 50 }
  const EPS = 1e-9
  const recortar = (x) => Math.min(1, Math.max(0, x))

  const h = (item, nombre, peso, inicio, fin, resp, real = 0, entregable = '') => ({ id: item, item, nombre, peso, inicio, fin, resp, real, entregable, hijos: [] })
  const g = (item, nombre, hijos, resp = 'Líder ID&TI') => ({ id: item, item, nombre, resp, hijos })

  const ARBOL = [
    g('1', 'Potenciación de herramientas de software actuales', [
      g('1.1', 'ERP Libra (453 Fase 2)', [
        g('1.1.1', 'Capacitación y actualización en el uso del software', [
          h('1.1.1.1', 'Entrevista con usuarios del software', 0.01, '2025-01-15', '2025-01-23', 'Líder ID&TI', 1, 'Matriz de uso del software'),
          h('1.1.1.2', 'Diagnóstico y evaluación del uso del software', 0.01, '2025-01-23', '2025-01-25', 'Líder ID&TI', 1),
          h('1.1.1.3', 'Lista de priorización de actividades', 0.01, '2025-01-25', '2025-01-26', 'Líder ID&TI', 1, 'Lista de priorización'),
        ]),
        g('1.1.2', 'Gestión de relaciones CRM (desarrollo e implementación)', [
          h('1.1.2.1', 'Aprobación de la cotización', 0.004, '2025-02-07', '2025-02-08', 'Líder ID&TI', 1),
          h('1.1.2.2', 'Elaborar requisición y OC del desarrollo', 0.004, '2025-02-08', '2025-02-12', 'Subcontratista TIC', 1),
          h('1.1.2.3', 'Validación del diagrama de flujo y requerimientos', 0.008, '2025-02-12', '2025-03-14', 'Comercial, Líder ID&TI', 0.8, 'Diagrama de flujo y requerimientos'),
          h('1.1.2.4', 'Revisión del cronograma detallado', 0.008, '2025-03-14', '2025-03-21', 'Subcontratista TIC', 0, 'Cronograma detallado'),
          h('1.1.2.5', 'Reunión de arranque del desarrollo', 0.008, '2025-03-21', '2025-03-22', 'Edisa'),
          h('1.1.2.6', 'Seguimiento de avance y pruebas', 0.02, '2025-03-28', '2025-06-07', 'Subcontratista TIC'),
          h('1.1.2.7', 'Pruebas finales del módulo CRM', 0.012, '2025-06-13', '2025-06-18', 'Comercial', 0, 'Módulo CRM funcionando'),
          h('1.1.2.8', 'Comunicación y capacitación del módulo CRM', 0.004, '2025-06-20', '2025-06-24', 'Líder ID&TI', 0, 'Capacitación'),
          h('1.1.2.9', 'Gestión del cambio CRM', 0.004, '2025-06-27', '2025-07-01', 'Líder ID&TI', 0, 'Manual y procedimiento'),
        ]),
        g('1.1.3', 'Gestionar recursos tecnológicos', [
          h('1.1.3.1', 'Mesa de trabajo con las áreas', 0.008, '2025-02-05', '2025-02-09', 'Todas las áreas', 1),
          h('1.1.3.2', 'Modificación de la matriz de perfiles de LIBRA', 0.008, '2025-02-12', '2025-02-16', 'Líder ID&TI', 1, 'F-TI-001 modificado'),
          h('1.1.3.3', 'Definir responsables y solicitud de perfiles', 0.008, '2025-02-19', '2025-02-26', 'Líder ID&TI', 0.6, 'Diagrama de flujo del proceso'),
          h('1.1.3.4', 'Definir responsables y solicitud de usuarios', 0.008, '2025-03-01', '2025-03-08', 'Líder ID&TI', 1),
          h('1.1.3.5', 'Crear flujo «Creación, modificación y baja de usuario»', 0.012, '2025-03-11', '2025-03-18', 'Todas las áreas', 0.2),
          h('1.1.3.6', 'Desarrollo BPM «Baja de usuario»', 0.012, '2025-03-21', '2025-04-11', 'Subcontratista TIC', 0, 'BPM funcionando'),
          h('1.1.3.7', 'Pruebas BPM «Baja de usuario»', 0.004, '2025-04-12', '2025-04-19', 'Subcontratista TIC'),
          h('1.1.3.8', 'Gestión del cambio «Baja de usuario»', 0.008, '2025-05-02', '2025-05-09', 'Líder ID&TI', 0, 'Manual y procedimiento'),
        ]),
        g('1.1.4', 'Gestión de recursos humanos', [
          h('1.1.4.1', 'Mesa de trabajo de control de acceso', 0.012, '2025-05-05', '2025-05-07', 'GH'),
          h('1.1.4.2', 'Revisar control de acceso con el biométrico', 0.012, '2025-05-05', '2025-05-09', 'GH'),
          h('1.1.4.3', 'Implementar a gran escala en proyectos', 0.008, '2025-05-26', '2025-06-02', 'Subcontratista TIC'),
          h('1.1.4.4', 'Desarrollo BPM «Creación de empleados»', 0.008, '2025-05-26', '2025-06-16', 'Subcontratista TIC', 0, 'BPM funcionando'),
          h('1.1.4.5', 'Gestión del cambio del módulo RRHH', 0.006, '2025-07-17', '2025-07-24', 'GH', 0, 'Manual y procedimiento'),
        ]),
        g('1.1.5', 'Gestionar suministros', [
          h('1.1.5.1', 'Mesa de trabajo con Compras', 0.02, '2025-06-12', '2025-06-14', 'Compras', 0, 'Diagrama de flujo del proceso'),
          h('1.1.5.2', 'Flujo de requisiciones en LIBRA', 0.016, '2025-06-16', '2025-07-04', 'Subcontratista TIC'),
          h('1.1.5.3', 'Gestión del cambio de suministros', 0.012, '2025-08-11', '2025-08-24', 'Compras'),
        ]),
      ]),
      g('1.2', 'Gestión del conocimiento', [
        h('1.2.1', 'Inventario de documentos técnicos', 0.06, '2025-07-07', '2025-08-29', 'Líder ID&TI'),
        h('1.2.2', 'Repositorio y consulta de especificaciones', 0.08, '2025-09-01', '2025-11-14', 'Subcontratista TIC', 0, 'Repositorio en producción'),
        h('1.2.3', 'Capacitación y cierre', 0.04, '2025-11-17', '2025-12-19', 'Líder ID&TI', 0, 'Acta de cierre'),
      ]),
    ]),
  ]

  const CORTE = '2025-03-13'
  const hojas = []
  const padre = {}
  const recorrer = (n, p, nivel) => {
    n.nivel = nivel
    padre[n.id] = p
    if (n.hijos.length) n.hijos.forEach((c) => recorrer(c, n, nivel + 1))
    else hojas.push(n)
  }
  ARBOL.forEach((n) => recorrer(n, null, 0))

  function estadoDe(pv, ev, t, fin) {
    if (ev >= 1 - EPS) return 'terminada'
    if (t > fin) return 'vencida'
    if (pv === 0 && ev === 0) return 'por_iniciar'
    const b = (pv - ev) * 100 + EPS
    if (b < UMB.atencion) return 'al_dia'
    if (b < UMB.riesgo) return 'en_atencion'
    if (b < UMB.atraso) return 'en_riesgo'
    return 'atrasada'
  }

  /** avances: { id: fracción }. Devuelve { id: resultado } más 'proyecto'. */
  function calcular(avances, fecha) {
    const t = aDia(fecha)
    const r = {}
    const visitar = (n) => {
      if (!n.hijos.length) {
        const ini = aDia(n.inicio), fin = aDia(n.fin)
        const dur = fin - ini + 1
        const pv = recortar((t - ini + 1) / dur)
        const ev = recortar(avances[n.id] ?? 0)
        const estado = estadoDe(pv, ev, t, fin)
        r[n.id] = { pv, ev, estado, ini, fin, peso: n.peso, vencidas: estado === 'vencida' ? 1 : 0 }
        return { peso: n.peso, pp: n.peso * pv, pe: n.peso * ev, ini, fin, venc: r[n.id].vencidas }
      }
      const acc = n.hijos.map(visitar).reduce((a, b) => ({ peso: a.peso + b.peso, pp: a.pp + b.pp, pe: a.pe + b.pe, ini: Math.min(a.ini, b.ini), fin: Math.max(a.fin, b.fin), venc: a.venc + b.venc }), { peso: 0, pp: 0, pe: 0, ini: Infinity, fin: -Infinity, venc: 0 })
      const pv = acc.pp / acc.peso, ev = acc.pe / acc.peso
      r[n.id] = { pv, ev, estado: estadoDe(pv, ev, t, acc.fin), ini: acc.ini, fin: acc.fin, peso: acc.peso, vencidas: acc.venc }
      return acc
    }
    const tot = ARBOL.map(visitar).reduce((a, b) => ({ peso: a.peso + b.peso, pp: a.pp + b.pp, pe: a.pe + b.pe, ini: Math.min(a.ini, b.ini), fin: Math.max(a.fin, b.fin), venc: a.venc + b.venc }))
    const pv = tot.pp / tot.peso, ev = tot.pe / tot.peso
    r.proyecto = { pv, ev, estado: estadoDe(pv, ev, t, tot.fin), ini: tot.ini, fin: tot.fin, peso: tot.peso, vencidas: tot.venc }
    return r
  }

  const avancesActuales = () => Object.fromEntries(hojas.map((n) => [n.id, n.real]))

  /* Historial: en cada corte pasado, cada hoja iba en lo planeado o en su real de hoy, lo menor. */
  const FECHAS_CORTE = ['2025-01-17', '2025-01-31', '2025-02-14', '2025-02-28', CORTE]
  const NOTAS = [
    'Arranque: entrevistas con usuarios del ERP.',
    'Entrevistas atrasadas: los usuarios del ERP no tuvieron agenda.',
    'Diagnóstico sin cerrar; la cotización del CRM sigue en revisión.',
    'Plan de choque con las áreas; perfiles de LIBRA pendientes de firma.',
    'Recuperado: diagnóstico, cotización y usuarios cerrados. Perfiles LIBRA sigue pendiente de firma.',
  ]
  /* Historia de ejemplo: se atrasa en febrero y se recupera en marzo. */
  const REZAGO = { '2025-01-31': 0.2, '2025-02-14': 0.12, '2025-02-28': 0.3 }
  const CORTES = FECHAS_CORTE.map((fecha, i) => {
    const t = aDia(fecha)
    const av = {}
    hojas.forEach((n) => {
      const ini = aDia(n.inicio), fin = aDia(n.fin)
      const pv = recortar((t - ini + 1) / (fin - ini + 1))
      av[n.id] = fecha === CORTE ? n.real : Math.min(n.real, Math.round(pv * 20) / 20) * (REZAGO[fecha] ?? 1)
    })
    return { fecha, nota: NOTAS[i], avances: av, res: calcular(av, fecha) }
  })

  function curvaPlaneada() {
    const res = calcular({}, CORTE).proyecto
    const pts = []
    for (let d = res.ini - 1; d <= res.fin + 7; d += 7) pts.push({ d, v: calcular({}, aISO(d)).proyecto.pv })
    return pts
  }

  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const fmtFecha = (iso, anio = true) => { const [y, m, d] = iso.split('-'); return `${+d} ${MESES[m - 1]}${anio ? ' ' + y : ''}` }
  const fmtPct = (x, dec = 1) => (x * 100).toFixed(dec).replace('.', ',') + ' %'
  const fmtPts = (x) => Math.abs(x * 100).toFixed(1).replace('.', ',') + ' pts'
  const ESTADO = { terminada: 'Terminada', vencida: 'Vencida', por_iniciar: 'Por iniciar', al_dia: 'Al día', en_atencion: 'En atención', en_riesgo: 'En riesgo', atrasada: 'Atrasada', sin_programar: 'Sin programar', sin_cortes: 'Sin cortes' }
  const chip = (estado, texto) => `<span class="chip e-${estado}"><i></i>${texto ?? ESTADO[estado]}</span>`

  /** Curva S en SVG. planeada: [{d,v}], real: [{d,v}], corte: día. */
  function curvaS({ planeada, real, corte, w = 640, h = 240, mini = false }) {
    const m = mini ? { l: 2, r: 2, t: 4, b: 4 } : { l: 40, r: 12, t: 16, b: 26 }
    const d0 = planeada[0].d, d1 = planeada[planeada.length - 1].d
    const x = (d) => m.l + ((d - d0) / (d1 - d0)) * (w - m.l - m.r)
    const y = (v) => h - m.b - v * (h - m.t - m.b)
    const linea = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ')
    let s = `<svg viewBox="0 0 ${w} ${h}" width="100%" ${mini ? `height="${h}" preserveAspectRatio="none"` : ''} role="img" aria-label="Curva S: planeado frente a real">`
    if (!mini) {
      ;[0, 0.25, 0.5, 0.75, 1].forEach((v) => { s += `<line x1="${m.l}" x2="${w - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#E3E8EF"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" font-family="JetBrains Mono" font-size="11" fill="#5B6C7E">${v * 100}</text>` })
      for (let mm = 0; mm < 12; mm += 2) { const d = aDia(`2025-${String(mm + 1).padStart(2, '0')}-01`); if (d >= d0 && d <= d1) s += `<text x="${x(d)}" y="${h - 6}" font-size="11" fill="#5B6C7E" font-family="Plus Jakarta Sans">${MESES[mm]}</text>` }
    }
    s += `<path d="${linea(planeada)}" fill="none" stroke="#003366" stroke-width="${mini ? 1.5 : 2.25}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
    if (real.length) s += `<path d="${linea(real)}" fill="none" stroke="#00A9E0" stroke-width="${mini ? 2 : 3}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`
    if (corte && !mini) {
      const ult = real[real.length - 1]
      s += `<line x1="${x(corte)}" x2="${x(corte)}" y1="${m.t}" y2="${h - m.b}" stroke="#00A9E0" stroke-dasharray="4 4"/>`
      real.forEach((p) => { s += `<circle cx="${x(p.d)}" cy="${y(p.v)}" r="3.5" fill="#fff" stroke="#00A9E0" stroke-width="2"/>` })
      if (ult) s += `<circle cx="${x(ult.d)}" cy="${y(ult.v)}" r="5" fill="#00A9E0"/>`
    }
    return s + '</svg>'
  }

  window.M = { ARBOL, hojas, padre, CORTE, CORTES, calcular, avancesActuales, curvaPlaneada, curvaS, aDia, aISO, fmtFecha, fmtPct, fmtPts, ESTADO, chip, MESES }
})()
