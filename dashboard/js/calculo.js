/* ==========================================================================
   Cálculo del avance · mismas reglas del Project Charter TI 2025
   --------------------------------------------------------------------------
   % planeado de una tarea = días transcurridos hasta la fecha de corte /
                             duración de la tarea (inicio y fin incluidos),
                             entre 0 y 100 %.
   % real                  = el que se registra en el corte (avance.js).
   Épica, frente y Motor   = promedio ponderado por peso de sus hijos.
   Desviación en días      = (% real − % planeado) × duración en días.
                             Negativa = atraso.
   Fecha fin forecast      = fecha fin − desviación en días.
   Estado                  = Al día (desviación ≥ −3 días), Atención (−3 a −10),
                             Atrasada (< −10), Por iniciar, Terminada.
   ========================================================================== */
window.MT_CALC = (function () {
  'use strict';

  const DAY = 86400000;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const toT = s => { const p = String(s).split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); };
  const toISO = t => new Date(t).toISOString().slice(0, 10);
  const fecha = s => { const d = new Date(typeof s === 'number' ? s : toT(s)); return `${String(d.getUTCDate()).padStart(2, '0')}-${MES[d.getUTCMonth()]}-${d.getUTCFullYear()}`; };
  const fechaCorta = s => { const d = new Date(typeof s === 'number' ? s : toT(s)); return `${String(d.getUTCDate()).padStart(2, '0')}-${MES[d.getUTCMonth()]}`; };
  const hoyISO = () => { const d = new Date(); return toISO(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); };
  const clamp = v => Math.max(0, Math.min(1, v));

  /* Árbol Motor → frentes → épicas → tareas a partir de PLAN y CHARTER */
  function build(PLAN, CHARTER) {
    const ini = Object.fromEntries((CHARTER.iniciativas || []).map(x => [x.id, x]));
    const nodes = {}, order = [];
    const motor = { id: 'motor', n: 'Motor Tecnológico', nivel: 0, peso: 1, hijos: [] };
    nodes.motor = motor; order.push(motor);

    PLAN.frentes.forEach(f => {
      const x = ini[f.id];
      const fn = { id: f.id, n: f.nombre || (x && x.nombre) || f.id, corto: f.corto || (x && x.corto) || f.id,
        num: x ? x.num : '00', nivel: 1, peso: f.peso, frente: f.id, padre: 'motor', hijos: [] };
      nodes[fn.id] = fn; order.push(fn); motor.hijos.push(fn);
      f.epicas.forEach(e => {
        const ex = x && x.epicas.find(z => z.id === e.id);
        const en = { id: e.id, n: e.n || (ex && ex.n) || e.id, nivel: 2, peso: e.peso, frente: f.id, padre: fn.id,
          hito: ex ? ex.hito : '', p: ex ? ex.p : 1, hijos: [] };
        nodes[en.id] = en; order.push(en); fn.hijos.push(en);
        e.tareas.forEach(t => {
          const tn = { id: t.id, n: t.n, nivel: 3, peso: t.peso, frente: f.id, padre: en.id, resp: t.resp || '',
            ini: toT(t.ini), fin: toT(t.fin), hijos: [] };
          if (tn.fin < tn.ini) console.warn('plan.js: la tarea ' + t.id + ' termina antes de empezar');
          nodes[tn.id] = tn; order.push(tn); en.hijos.push(tn);
        });
      });
    });

    /* Fechas de los niveles superiores: mínimo inicio y máximo fin de sus hijos */
    (function span(n) {
      if (!n.hijos.length) return;
      n.hijos.forEach(span);
      n.ini = Math.min(...n.hijos.map(h => h.ini));
      n.fin = Math.max(...n.hijos.map(h => h.fin));
    })(motor);
    order.forEach(n => { n.dur = Math.round((n.fin - n.ini) / DAY) + 1; });

    return { nodes, order, motor, tareas: order.filter(n => n.nivel === 3), inicio: toT(PLAN.inicio), fin: toT(PLAN.fin) };
  }

  /* % planeado lineal de una tarea a la fecha de corte t */
  const planTarea = (n, t) => t < n.ini ? 0 : clamp((Math.round((t - n.ini) / DAY) + 1) / n.dur);

  /* Avance de todo el árbol a la fecha de corte (ISO) con un mapa de % real {id: 0..100} */
  function compute(tree, corteISO, real) {
    const t = toT(corteISO), out = {};
    (function walk(n) {
      let plan, rl;
      if (!n.hijos.length) {
        plan = planTarea(n, t);
        rl = clamp((+(real && real[n.id]) || 0) / 100);
      } else {
        n.hijos.forEach(walk);
        const W = n.hijos.reduce((a, h) => a + h.peso, 0) || 1;
        plan = n.hijos.reduce((a, h) => a + h.peso * out[h.id].plan, 0) / W;
        rl = n.hijos.reduce((a, h) => a + h.peso * out[h.id].real, 0) / W;
      }
      const desv = Math.round((rl - plan) * n.dur);
      let estado;
      if (rl >= 0.9995) estado = 'fin';
      else if (plan === 0 && rl === 0) estado = 'pend';
      else if (desv >= -3) estado = 'ok';
      else if (desv >= -10) estado = 'warn';
      else estado = 'crit';
      let fc = null;
      if (estado !== 'fin') { fc = n.fin - desv * DAY; if (fc < t && rl < 1) fc = t; }
      out[n.id] = { plan, real: rl, desv, spi: plan > 0 ? rl / plan : null, estado, forecast: fc };
    })(tree.motor);
    return out;
  }

  /* Corte vigente a una fecha: el último registrado en o antes de ella */
  function corteVigente(cortes, corteISO) {
    let best = null;
    cortes.forEach(c => { if (c.fecha <= corteISO && (!best || c.fecha > best.fecha)) best = c; });
    return best;
  }

  /* Curva S: % planeado semanal y % real de cada corte hasta la fecha de corte */
  function curvaS(tree, cortes, id, corteISO) {
    const plan = [];
    for (let t = tree.inicio; t <= tree.fin + 6 * DAY; t += 7 * DAY) {
      const d = Math.min(t, tree.fin);
      plan.push({ t: d, v: compute(tree, toISO(d), null)[id].plan });
    }
    const real = cortes.filter(c => c.fecha <= corteISO).sort((a, b) => a.fecha < b.fecha ? -1 : 1)
      .map(c => ({ t: toT(c.fecha), v: compute(tree, c.fecha, c.real)[id].real, fecha: c.fecha }));
    return { plan, real };
  }

  const semana = (tree, corteISO) => Math.floor((toT(corteISO) - tree.inicio) / (7 * DAY)) + 1;

  return { DAY, toT, toISO, fecha, fechaCorta, hoyISO, build, compute, corteVigente, curvaS, semana };
})();
