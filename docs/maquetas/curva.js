/* Curva S grande de la ficha: planeado, real por cortes con su semáforo, brecha sombreada,
   proyección al ritmo actual y lectura al pasar el puntero. Las geometrías se actualizan por CSS
   (d, cx, cy, x, width), así que al recalcular o cambiar el zoom las curvas se transforman. */
(function () {
  const NS = 'http://www.w3.org/2000/svg'
  const N_PLAN = 140, N_PROY = 48, N_TRAMO = 14
  const UMB = { atencion: 10, riesgo: 25, atraso: 50 }
  const estadoPorBrecha = (pv, ev) => {
    if (ev >= 0.9999) return 'terminada'
    if (pv === 0 && ev === 0) return 'por_iniciar'
    const b = (pv - ev) * 100
    return b < UMB.atencion ? 'al_dia' : b < UMB.riesgo ? 'en_atencion' : b < UMB.atraso ? 'en_riesgo' : 'atrasada'
  }
  const el = (tag, attrs = {}, padre) => {
    const n = document.createElementNS(NS, tag)
    for (const k in attrs) n.setAttribute(k, attrs[k])
    if (padre) padre.appendChild(n)
    return n
  }
  const camino = (pts) => `path("${pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')}")`

  window.CurvaS = function (cont, { calcular, CORTES, aDia, aISO, fmtFecha, fmtPct, fmtPts, chip, MESES, lectura }) {
    let zoom = 'proyecto'
    let datos = null
    const svg = el('svg', { class: 'cs-svg', role: 'img', 'aria-label': 'Curva S del proyecto: planeado frente a real, con el semáforo de cada corte' }, cont)
    const defs = el('defs', {}, svg)
    const clip = el('clipPath', { id: 'cs-clip' }, defs)
    const clipR = el('rect', {}, clip)
    const gGrid = el('g', { class: 'cs-grid' }, svg)
    const gMeses = el('g', { class: 'cs-meses' }, svg)
    const plot = el('g', { 'clip-path': 'url(#cs-clip)' }, svg)
    const gBrecha = el('g', { class: 'cs-brecha' }, plot)
    const futuro = el('rect', { class: 'cs-futuro' }, plot)
    const pPlan = el('path', { class: 'cs-plan dibujar', pathLength: 1 }, plot)
    const pProy = el('path', { class: 'cs-proy' }, plot)
    const pReal = el('path', { class: 'cs-real dibujar', pathLength: 1 }, plot)
    const lCorte = el('line', { class: 'cs-corte' }, plot)
    const gPuntos = el('g', { class: 'cs-puntos' }, plot)
    const tCorte = el('text', { class: 'cs-corte-t' }, svg)
    const tFin = el('text', { class: 'cs-fin-t' }, svg)
    const gTira = el('g', { class: 'cs-tira' }, svg)
    const tTira = el('text', { class: 'cs-tira-t' }, svg)
    tTira.textContent = 'Semáforo'
    const cruz = el('line', { class: 'cs-cruz' }, svg)
    const dPlan = el('circle', { class: 'cs-dot-plan', r: 4.5 }, svg)
    const dReal = el('circle', { class: 'cs-dot-real', r: 5.5 }, svg)
    const capa = el('rect', { class: 'cs-capa' }, svg)

    /* Elementos que dependen del número de cortes: se crean una vez. */
    const tramos = [], puntos = [], tiras = []
    for (let i = 0; i < CORTES.length; i++) {
      tramos.push(el('path', {}, gBrecha))
      puntos.push(el('circle', { r: 6, style: `animation-delay:${0.55 + i * 0.09}s` }, gPuntos))
      tiras.push(el('rect', { height: 10, rx: 2 }, gTira))
    }
    const tiraFut = el('rect', { height: 10, rx: 2, class: 'cs-tira-fut' }, gTira)
    const meses = []
    for (let m = 0; m < 16; m++) {
      const iso = `${2025 + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, '0')}-01`
      const t = el('text', {}, gMeses)
      t.textContent = MESES[m % 12] + (m % 12 === 0 ? ` ${2025 + Math.floor(m / 12)}` : '')
      const l = el('line', {}, gGrid)
      meses.push({ d: aDia(iso), t, l })
    }
    const yLineas = [0, 0.25, 0.5, 0.75, 1].map((v) => {
      const l = el('line', {}, gGrid)
      const t = el('text', { class: 'cs-y' }, gGrid)
      t.textContent = v * 100 + ' %'
      return { v, l, t }
    })

    const pvEn = (d) => calcular({}, aISO(Math.round(d))).proyecto.pv

    function calcularDatos() {
      const p = calcular({}, CORTES[CORTES.length - 1].fecha).proyecto
      const ini = p.ini, fin = p.fin
      const plan = []
      for (let i = 0; i < N_PLAN; i++) { const d = ini - 1 + ((fin - ini + 2) * i) / (N_PLAN - 1); plan.push({ d, v: pvEn(d) }) }
      const real = [{ d: ini - 1, v: 0 }, ...CORTES.map((c) => ({ d: aDia(c.fecha), v: c.res.proyecto.ev, pv: c.res.proyecto.pv, estado: c.res.proyecto.estado, venc: c.res.proyecto.vencidas, c }))]
      const ult = real[real.length - 1]
      /* Retraso en días: cuándo planeaba la línea base el avance real de hoy. */
      let te = ult.d
      while (te > ini && pvEn(te) > ult.v + 1e-9) te--
      const retraso = ult.d - te
      const finProy = fin + retraso
      const proy = []
      for (let i = 0; i < N_PROY; i++) { const d = ult.d + ((finProy + 1 - ult.d) * i) / (N_PROY - 1); proy.push({ d, v: Math.min(1, Math.max(ult.v, pvEn(d - retraso))) }) }
      return { ini, fin, plan, real, ult, retraso, finProy, proy }
    }

    function medidas() {
      const w = cont.clientWidth
      const movil = w < 640
      const h = movil ? 260 : 380
      const m = { l: movil ? 38 : 52, r: movil ? 10 : 20, t: 22, b: movil ? 62 : 66 }
      const D = datos
      const d0 = D.ini - 4
      const d1 = zoom === 'cortes' ? D.ult.d + 50 : Math.max(D.fin, D.finProy) + 8
      const x = (d) => m.l + ((d - d0) / (d1 - d0)) * (w - m.l - m.r)
      const y = (v) => m.t + (1 - v) * (h - m.t - m.b)
      const vMax = zoom === 'cortes' ? Math.min(1, Math.ceil((Math.max(...D.plan.filter((p) => p.d <= d1).map((p) => p.v)) * 1.08) * 5) / 5) : 1
      const yz = (v) => m.t + (1 - v / vMax) * (h - m.t - m.b)
      return { w, h, m, d0, d1, x, y: zoom === 'cortes' ? yz : y, vMax, movil }
    }

    let M
    function dibujar() {
      M = medidas()
      const { w, h, m, x, y, d0, d1, vMax } = M
      const D = datos
      const yBase = h - m.b
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      svg.setAttribute('height', h)
      clipR.setAttribute('x', m.l); clipR.setAttribute('y', 0); clipR.setAttribute('width', w - m.l - m.r); clipR.setAttribute('height', yBase + 1)

      yLineas.forEach(({ v, l, t }) => {
        const vv = v * vMax
        l.setAttribute('x1', m.l); l.setAttribute('x2', w - m.r)
        l.style.transform = `translateY(${y(vv)}px)`
        t.setAttribute('x', m.l - 10)
        t.style.transform = `translateY(${y(vv) + 4}px)`
        t.textContent = Math.round(vv * 100) + ' %'
      })
      meses.forEach(({ d, t, l }) => {
        const dentro = d >= d0 && d <= d1
        const paso = zoom === 'proyecto' && M.movil ? 2 : 1
        const visible = dentro && x(d) < w - m.r - (M.movil ? 26 : 8) && (meses.findIndex((q) => q.d === d) % paso === 0)
        t.style.transform = `translateX(${x(d) + 4}px)`
        t.setAttribute('y', yBase + 20)
        t.style.opacity = visible ? 1 : 0
        l.setAttribute('y1', m.t); l.setAttribute('y2', yBase)
        l.style.transform = `translateX(${x(d)}px)`
        l.style.opacity = dentro ? 1 : 0
      })

      pPlan.style.d = camino(D.plan.map((p) => [x(p.d), y(p.v)]))
      pReal.style.d = camino(D.real.map((p) => [x(p.d), y(p.v)]))
      pProy.style.d = camino(D.proy.map((p) => [x(p.d), y(p.v)]))
      const xu = x(D.ult.d)
      futuro.style.x = xu + 'px'; futuro.style.y = m.t + 'px'; futuro.style.width = Math.max(0, w - m.r - xu) + 'px'; futuro.style.height = yBase - m.t + 'px'
      lCorte.setAttribute('y1', m.t - 8); lCorte.setAttribute('y2', yBase)
      lCorte.style.transform = `translateX(${xu}px)`
      tCorte.textContent = 'Corte ' + fmtFecha(CORTES[CORTES.length - 1].fecha, false)
      tCorte.setAttribute('y', m.t - 10)
      tCorte.style.transform = `translateX(${xu + 6}px)`

      /* Brecha entre cortes, del color del semáforo al cerrar el tramo. */
      for (let i = 0; i < CORTES.length; i++) {
        const a = D.real[i], b = D.real[i + 1]
        const arriba = []
        for (let k = 0; k < N_TRAMO; k++) { const d = a.d + ((b.d - a.d) * k) / (N_TRAMO - 1); arriba.push([x(d), y(pvEn(d))]) }
        const abajo = [[x(b.d), y(b.v)], [x(a.d), y(a.v)]]
        tramos[i].style.d = camino([...arriba, ...abajo])
        tramos[i].setAttribute('class', 'g-' + b.estado)
        puntos[i].style.cx = x(b.d) + 'px'
        puntos[i].style.cy = y(b.v) + 'px'
        puntos[i].setAttribute('class', 'cs-punto f-' + b.estado + (b.venc ? ' con-vencidas' : ''))
        const xa = x(a.d), xb = x(b.d)
        tiras[i].style.x = xa + 1 + 'px'; tiras[i].style.width = Math.max(2, xb - xa - 2) + 'px'
        tiras[i].setAttribute('y', h - 30)
        tiras[i].setAttribute('class', 'f-' + b.estado)
      }
      tiraFut.style.x = xu + 1 + 'px'; tiraFut.style.width = Math.max(0, Math.min(x(Math.max(D.fin, D.finProy)), w - m.r) - xu - 1) + 'px'; tiraFut.setAttribute('y', h - 30)
      tTira.setAttribute('x', m.l - 10); tTira.setAttribute('y', h - 21); tTira.style.display = M.movil ? 'none' : ''
      tFin.textContent = D.retraso > 0 ? `Fin proyectado ${fmtFecha(aISO(D.finProy), false)}` : `Fin ${fmtFecha(aISO(D.fin), false)}`
      const xf = x(D.finProy)
      tFin.style.opacity = xf < w - m.r - 4 ? 1 : 0
      tFin.style.transform = `translate(${Math.min(xf, w - m.r - 4)}px, ${y(1) - 8}px)`

      capa.setAttribute('x', m.l); capa.setAttribute('y', 0); capa.setAttribute('width', w - m.l - m.r); capa.setAttribute('height', yBase)
      leer(null)
    }

    /* Lectura: por defecto el último corte; al pasar el puntero, la fecha bajo él. */
    function leer(d) {
      const D = datos, { x, y } = M
      const ult = D.ult
      let fecha, pv, ev, estado, etiqueta, venc = 0, futura = false
      if (d === null) {
        fecha = ult.d; pv = ult.pv; ev = ult.v; estado = ult.estado; venc = ult.venc; etiqueta = 'Último corte'
      } else {
        const cerca = D.real.slice(1).find((p) => Math.abs(x(p.d) - x(d)) < 9)
        if (cerca) { fecha = cerca.d; pv = cerca.pv; ev = cerca.v; estado = cerca.estado; venc = cerca.venc; etiqueta = 'Corte' }
        else if (d <= ult.d) {
          fecha = Math.round(d); pv = pvEn(fecha)
          const i = D.real.findIndex((p) => p.d >= fecha)
          const a = D.real[Math.max(0, i - 1)], b = D.real[i]
          ev = a.v + ((b.v - a.v) * (fecha - a.d)) / Math.max(1, b.d - a.d)
          estado = estadoPorBrecha(pv, ev); etiqueta = 'Entre cortes'
        } else {
          fecha = Math.round(d); pv = pvEn(fecha); futura = true
          ev = Math.min(1, Math.max(ult.v, pvEn(fecha - D.retraso)))
          estado = estadoPorBrecha(pv, ev); etiqueta = 'Proyección'
        }
      }
      const xs = x(fecha)
      cruz.setAttribute('y1', M.m.t); cruz.setAttribute('y2', M.h - M.m.b)
      cruz.style.transform = `translateX(${xs}px)`
      cruz.style.opacity = d === null ? 0 : 1
      dPlan.style.cx = xs + 'px'; dPlan.style.cy = y(pv) + 'px'; dPlan.style.opacity = d === null ? 0 : 1
      dReal.style.cx = xs + 'px'; dReal.style.cy = y(ev) + 'px'; dReal.style.opacity = d === null ? 0 : 1
      dReal.setAttribute('class', 'cs-dot-real' + (futura ? ' proy' : ''))
      lectura({ etiqueta, fecha: fmtFecha(aISO(fecha)), pv: fmtPct(pv), ev: fmtPct(ev), evTitulo: futura ? 'Proyectado' : 'Real', brecha: fmtPts(pv - ev), chip: chip(estado) + (venc ? ` <span class="cs-venc">${venc} vencida${venc > 1 ? 's' : ''}</span>` : ''), finProy: D.retraso > 0 ? `${fmtFecha(aISO(D.finProy))} (+${D.retraso} días)` : fmtFecha(aISO(D.fin)) })
    }

    capa.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect()
      const px = ((e.clientX - r.left) / r.width) * M.w
      leer(M.d0 + ((px - M.m.l) / (M.w - M.m.l - M.m.r)) * (M.d1 - M.d0))
    })
    capa.addEventListener('pointerleave', () => leer(null))

    datos = calcularDatos()
    dibujar()
    new ResizeObserver(() => { if (Math.abs(cont.clientWidth - M.w) > 2) dibujar() }).observe(cont)
    requestAnimationFrame(() => svg.classList.add('lista'))

    return {
      actualizar() { datos = calcularDatos(); dibujar() },
      zoom(z) { zoom = z; dibujar() },
    }
  }
})()
