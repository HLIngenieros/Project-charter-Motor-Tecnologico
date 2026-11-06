/* ==========================================================================
   Dashboard · Project Charter Motor Tecnológico
   Dibuja el charter principal y el de cada iniciativa a partir de
   window.CHARTER (js/datos.js). Sin dependencias: JavaScript estándar.
   ========================================================================== */
(function () {
  'use strict';

  const D = window.CHARTER;
  const G = D.general, INI = D.iniciativas, Q = D.trimestres, M = D.meta;
  const byId = Object.fromEntries(INI.map(i => [i.id, i]));

  /* Paleta: un color por iniciativa; el oro identifica al charter principal */
  const COLOR = { motor: '#C08A1E', seguimiento: '#C08A1E', gestion: '#8C6A2C', core: '#1D4F86', datos: '#0A6C87', ia: '#4A4C9C', vigilancia: '#2B7A66', navy: '#0B2A4A' };

  /* ---------- Seguimiento: línea base (plan.js) + avance real por corte (avance.js) ---------- */
  const CALC = window.MT_CALC;
  const TREE = CALC.build(window.PLAN, D);
  const NODES = TREE.nodes;
  const FRENTES = TREE.motor.hijos;
  const AV = { cortes: ((window.AVANCE && window.AVANCE.cortes) || []).slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1) };
  const ultimoCorte = () => AV.cortes.length ? AV.cortes[AV.cortes.length - 1] : null;
  const S = {
    corte: ultimoCorte() ? ultimoCorte().fecha : CALC.hoyISO(),
    edit: null,          // corte en edición: { fecha, nota, real, nuevo }
    vigente: null,       // corte del que sale el % real
    R: {},               // resultados del cálculo por id
    tab: 'motor',
    curva: 'motor',      // frente que muestra la curva S
    fFrente: 'all',      // filtro de la tabla EDT
    soloActivas: false
  };
  function recompute() {
    S.vigente = S.edit ? { fecha: S.edit.fecha, real: S.edit.real, nota: S.edit.nota } : CALC.corteVigente(AV.cortes, S.corte);
    S.R = CALC.compute(TREE, S.corte, S.vigente ? S.vigente.real : null);
  }
  const pct = (v, dec = 1) => (v * 100).toFixed(dec).replace('.', ',') + ' %';
  const ESTADO = { ok: 'Al día', warn: 'Atención', crit: 'Atrasada', pend: 'Por iniciar', fin: 'Terminada' };
  const desvTxt = d => (d > 0 ? '+' : '') + d + ' d';
  const colorOf = id => COLOR[(NODES[id] && NODES[id].frente) || id] || COLOR.motor;

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTbd = s => /por (definir|designar|confirmar)|sin medir/i.test(s);
  const tbd = s => isTbd(s) ? `<span class="tbd">${esc(s)}</span>` : esc(s);
  const badge = m => m === 'pmi' ? '<span class="badge badge-pmi">PMI</span>' : '<span class="badge badge-scrum">SCRUM</span>';
  const ORIG = { pal: ['orig-pal', 'Palanca'], pro: ['orig-pro', 'Propuesta'], c25: ['orig-c25', 'Charter 2025'] };
  const sevOf = (p, i) => (p * i >= 6 ? 3 : p * i >= 3 ? 2 : 1);
  const SEV = { 3: 'Alta', 2: 'Media', 1: 'Baja' };
  const cop = n => (n / 1e6).toFixed(1).replace('.', ',') + ' M';
  const STAGES = ['Diagnóstico', 'Plan', 'Ejecución', 'Valor medido'];

  const TABS = [{ id: 'motor', label: 'Charter principal', sub: 'Motor Tecnológico', num: '00', balance: null },
    { id: 'seguimiento', label: 'Seguimiento', sub: 'Avance por corte semanal', num: 'S', balance: null }]
    .concat(INI.map(i => ({ id: i.id, label: i.corto, sub: `Iniciativa ${i.num}`, num: i.num, balance: i.balance })));

  /* Todos los indicadores, con la iniciativa a la que pertenecen */
  const ALL_KPIS = G.kpis.map(k => Object.assign({ ini: 'general' }, k))
    .concat(...INI.map(x => x.kpis.map(k => Object.assign({ ini: x.id }, k))));

  /* ---------- Componentes ---------- */
  function card(id, nav, kicker, title, body, opts = {}) {
    return `<section id="${id}" data-nav="${esc(nav)}" class="card reveal ${opts.cls || ''}" style="--c:${opts.c || COLOR.motor}">
      <header class="mb-5"><p class="kicker">${kicker}</p><h2 class="card-title">${title}</h2>${opts.lede ? `<p class="card-lede">${opts.lede}</p>` : ''}</header>
      ${body}</section>`;
  }

  function filterBar(group) {
    const opts = [{ id: 'all', n: 'Todas', c: COLOR.navy }].concat(INI.map(i => ({ id: i.id, n: i.corto, c: COLOR[i.id] })));
    return `<div class="flex flex-wrap gap-2 mb-5" data-filter="${group}" role="group" aria-label="Filtrar por iniciativa">
      ${opts.map((f, k) => `<button type="button" class="filter-btn" aria-pressed="${k === 0}" data-f="${f.id}" style="--c:${f.c}"><i></i>${esc(f.n)}</button>`).join('')}</div>`;
  }

  function kpiTable(rows, showIni) {
    return `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Indicador</th>${showIni ? '<th>Iniciativa</th>' : ''}<th>Línea base → meta 2027</th><th>Meta 2028</th><th>Origen</th></tr></thead>
      <tbody>${rows.map(k => {
        const c = k.ini === 'general' ? COLOR.motor : COLOR[k.ini];
        const name = k.ini === 'general' ? 'Palanca' : byId[k.ini].corto;
        return `<tr data-ini="${k.ini}">
          <td><b class="font-semibold">${esc(k.n)}</b><small>${esc(k.d)}</small></td>
          ${showIni ? `<td><span class="ini-pill" style="--c:${c}"><i></i>${esc(name)}</span></td>` : ''}
          <td><span class="bm"><span class="b">${esc(k.b)}</span><i>→</i><span class="m">${tbd(k.m27)}</span></span></td>
          <td class="tnum whitespace-nowrap">${tbd(k.m28)}</td>
          <td><span class="orig ${ORIG[k.o][0]}">${ORIG[k.o][1]}</span></td></tr>`;
      }).join('')}</tbody></table></div>`;
  }

  /* Eje del Gantt: 5 columnas (Inicio nov–dic 2026 y T1–T4 2027), 20 % cada una */
  const COLS = ['2026-11-01', '2027-01-01', '2027-04-01', '2027-07-01', '2027-10-01', '2028-01-01'].map(CALC.toT);
  function posOf(t) {
    if (t <= COLS[0]) return 0;
    for (let k = 0; k < 5; k++) if (t < COLS[k + 1]) return (k + (t - COLS[k]) / (COLS[k + 1] - COLS[k])) * 20;
    return 100;
  }

  function gantt(rows) {
    const today = posOf(CALC.toT(S.corte)).toFixed(2) + '%';
    const head = `<div class="g-row g-head"><div class="g-label">Épica</div>
      <div class="g-track" style="--today:${today}">${Q.map(q => `<span>${esc(q)}</span>`).join('')}<b class="g-today-tag">CORTE</b></div></div>`;
    let n = 0;
    const body = rows.map(r => {
      if (r.group) {
        return `<div class="g-row g-group" data-ini="${r.ini}" style="--c:${r.c}"><div class="g-label"><b>${esc(r.n)}</b></div><div class="g-track" style="--today:${today}"></div></div>`;
      }
      n++;
      let left, right, prog = '', tip = r.e || '';
      const nd = NODES[r.id];
      if (nd) {
        left = posOf(nd.ini); right = posOf(nd.fin + CALC.DAY);
        const v = S.R[r.id];
        prog = `<i class="g-prog" style="width:${(v.real * 100).toFixed(1)}%"></i>`;
        tip = `${r.id} · ${CALC.fechaCorta(nd.ini)} a ${CALC.fechaCorta(nd.fin)} · Planeado ${pct(v.plan, 0)} · Real ${pct(v.real, 0)}${tip ? ' · ' + tip : ''}`;
      } else {
        left = r.d * 20; right = (r.h + 1) * 20;
      }
      const w = right - left;
      const ms = r.hito
        ? `<span class="g-ms pop" style="left:${right}%;--d:${n * 45}ms"></span><span class="g-ms-label ${right > 70 ? 'is-left' : ''}" style="left:${right}%">${esc(r.hito)}</span>`
        : '';
      return `<div class="g-row" data-ini="${r.ini}" style="--c:${r.c}" title="${esc(tip)}">
        <div class="g-label"><b>${esc(r.n)}</b><span>${esc(r.sub || '')}${nd ? ` · real ${pct(S.R[r.id].real, 0)}` : ''}</span></div>
        <div class="g-track" style="--today:${today}"><span class="g-bar grow ${r.phase ? 'is-phase' : ''}" style="left:${left.toFixed(2)}%;width:${w.toFixed(2)}%;--d:${n * 45}ms">${r.phase ? esc(r.n) : prog}</span>${ms}</div></div>`;
    }).join('');
    return `<div class="overflow-x-auto pb-6">${'<div class="gantt">' + head + body + '</div>'}</div>
      <div class="flex flex-wrap gap-5 text-sm text-muted">
        <span class="inline-flex items-center gap-2"><i class="inline-block w-6 h-2.5 rounded" style="background:${COLOR.core};opacity:.35"></i>Épica (fechas de la línea base)</span>
        <span class="inline-flex items-center gap-2"><i class="inline-block w-6 h-2.5 rounded" style="background:${COLOR.core}"></i>Avance real</span>
        <span class="inline-flex items-center gap-2"><i class="inline-block w-2.5 h-2.5 rotate-45" style="background:${COLOR.motor}"></i>Hito</span>
        <span class="inline-flex items-center gap-2"><i class="inline-block w-0.5 h-4" style="background:${COLOR.motor}"></i>Corte: ${esc(CALC.fecha(S.corte))}</span>
      </div>`;
  }

  function epicRows(x) {
    return [{ group: true, n: `${x.num} · ${x.nombre}`, ini: x.id, c: COLOR[x.id] }]
      .concat(x.epicas.map(e => Object.assign({}, e, { ini: x.id, c: COLOR[x.id], sub: e.id })));
  }

  /* ---------- Componentes de avance ---------- */
  const estPill = e => `<span class="st-pill st-${e}"><i></i>${ESTADO[e]}</span>`;

  /* Barra doble: relleno = real, marca = planeado */
  function pv(id, opts = {}) {
    const v = S.R[id];
    return `<div class="pv ${opts.sm ? 'is-sm' : ''}" style="--c:${opts.c || colorOf(id)}" data-pv="${id}" title="Planeado ${pct(v.plan)} · Real ${pct(v.real)}">
      <span class="pv-r grow" style="width:${(v.real * 100).toFixed(2)}%;--d:${opts.d || 0}ms"></span>
      <span class="pv-p" style="left:${(v.plan * 100).toFixed(2)}%"></span></div>`;
  }

  /* Valor que se actualiza en vivo al editar un corte */
  const mv = (id, f) => {
    const v = S.R[id];
    const txt = f === 'plan' ? pct(v.plan) : f === 'real' ? pct(v.real) : f === 'desv' ? desvTxt(v.desv)
      : f === 'estado' ? estPill(v.estado) : f === 'fc' ? (v.forecast ? CALC.fechaCorta(v.forecast) : '—') : '';
    return `<span data-m="${id}|${f}">${txt}</span>`;
  };

  /* Curva S (SVG): planeado semanal vs real de cada corte */
  function curvaSvg(id, anim) {
    const c = CALC.curvaS(TREE, S.edit ? AV.cortes.filter(k => k.fecha !== S.edit.fecha).concat([S.edit]) : AV.cortes, id, S.corte);
    const W = 760, H = 290, L = 46, Rr = 18, T = 14, B = 36;
    const x = t => L + (t - TREE.inicio) / (TREE.fin - TREE.inicio) * (W - L - Rr);
    const y = v => T + (1 - v) * (H - T - B);
    const col = colorOf(id);
    const pPath = c.plan.map((p, k) => `${k ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    const area = `${pPath}L${x(c.plan[c.plan.length - 1].t).toFixed(1)},${y(0)}L${x(c.plan[0].t).toFixed(1)},${y(0)}Z`;
    const rPath = c.real.map((p, k) => `${k ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    const grid = [0, .25, .5, .75, 1].map(v => `<line x1="${L}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}" class="cs-grid"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" class="cs-ax">${v * 100}%</text>`).join('');
    const qx = COLS.slice(0, 5).map((t, k) => {
      const a = x(Math.max(t, TREE.inicio)), b = x(Math.min(COLS[k + 1], TREE.fin));
      return `<line x1="${a}" x2="${a}" y1="${T}" y2="${H - B}" class="cs-grid"/><text x="${(a + b) / 2}" y="${H - B + 20}" text-anchor="middle" class="cs-ax">${['Inicio', 'T1 2027', 'T2', 'T3', 'T4'][k]}</text>`;
    }).join('');
    const tc = x(CALC.toT(S.corte));
    const last = c.real[c.real.length - 1];
    const pNow = S.R[id].plan;
    const dots = c.real.map(p => `<circle cx="${x(p.t).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="4" fill="#fff" stroke="${col}" stroke-width="2.5"><title>Corte ${CALC.fecha(p.fecha)}: real ${pct(p.v)}</title></circle>`).join('');
    return `<svg class="curva ${anim ? '' : 'no-anim'}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva S: avance planeado frente a real">
      ${grid}${qx}
      <path d="${area}" fill="${COLOR.navy}" opacity=".05"/>
      <path d="${pPath}" fill="none" stroke="${COLOR.navy}" stroke-width="2" stroke-dasharray="5 4" class="cs-line"/>
      <line x1="${tc}" x2="${tc}" y1="${T}" y2="${H - B}" stroke="${COLOR.motor}" stroke-width="2"/>
      <circle cx="${tc}" cy="${y(pNow)}" r="4" fill="${COLOR.navy}"><title>Planeado al corte: ${pct(pNow)}</title></circle>
      ${rPath ? `<path d="${rPath}" fill="none" stroke="${col}" stroke-width="3" stroke-linejoin="round" class="cs-line cs-real" pathLength="1"/>` : ''}
      ${dots}
      <text x="${Math.min(tc + 6, W - Rr - 4)}" y="${T + 12}" text-anchor="${tc > W - 140 ? 'end' : 'start'}" class="cs-tag" ${tc > W - 140 ? `transform="translate(-12 0)"` : ''}>Corte ${CALC.fechaCorta(S.corte)}</text>
      ${last ? '' : `<text x="${(L + W) / 2}" y="${H / 2}" text-anchor="middle" class="cs-ax">Sin cortes registrados a esta fecha</text>`}
    </svg>`;
  }

  function curvaLegend(id) {
    return `<div class="flex flex-wrap gap-5 text-sm text-muted mt-2">
      <span class="inline-flex items-center gap-2"><i class="inline-block w-6 border-t-2 border-dashed" style="border-color:${COLOR.navy}"></i>Planeado (línea base)</span>
      <span class="inline-flex items-center gap-2"><i class="inline-block w-6 h-[3px] rounded" style="background:${colorOf(id)}"></i>Real por corte</span>
      <span class="inline-flex items-center gap-2"><i class="inline-block w-0.5 h-4" style="background:${COLOR.motor}"></i>Fecha de corte</span></div>`;
  }

  /* Cifras de cabecera del avance de un nodo */
  function avanceStats(id) {
    const v = S.R[id];
    const tone = { ok: 'is-ok', fin: 'is-ok', warn: 'is-warn', crit: 'is-crit', pend: '' }[v.estado];
    return `<div class="av-stats">
      <div><p class="sub-h">Planeado</p><p class="av-v">${mv(id, 'plan')}</p></div>
      <div><p class="sub-h">Real</p><p class="av-v" style="color:${colorOf(id)}">${mv(id, 'real')}</p></div>
      <div><p class="sub-h">Desviación</p><p class="av-v ${tone}">${mv(id, 'desv')}</p></div>
      <div><p class="sub-h">Estado</p><p class="mt-2">${mv(id, 'estado')}</p></div>
    </div>`;
  }

  /* Filas de avance: nodo con barra doble */
  function avanceRows(ids, opts = {}) {
    return `<div class="grid gap-1">${ids.map((id, k) => {
      const n = NODES[id];
      return `<${opts.go ? `button type="button" data-go="${opts.go(n)}"${opts.go(n) === 'seguimiento' ? ` data-frente="${n.id}"` : ''}` : 'div'} class="av-row ${opts.go ? 'is-link' : ''}" style="--c:${colorOf(id)}">
        <span class="min-w-0"><b>${esc(n.nivel === 1 ? n.corto : n.n)}</b><small>${n.nivel === 1 ? `Peso ${n.peso} %` : `${esc(n.id)} · ${CALC.fechaCorta(n.ini)} a ${CALC.fechaCorta(n.fin)}`}</small></span>
        ${pv(id, { d: k * 60 })}
        <span class="av-num"><b>${mv(id, 'real')}</b><small>plan ${mv(id, 'plan')}</small></span>
        <span class="av-est">${mv(id, 'estado')}</span>
      </${opts.go ? 'button' : 'div'}>`;
    }).join('')}</div>
    <p class="text-xs text-muted mt-3">Barra: avance real · Marca vertical: avance planeado a la fecha de corte.</p>`;
  }

  function donut() {
    const R = 80, C = 2 * Math.PI * R, total = INI.reduce((a, i) => a + i.epicas.length, 0);
    let acc = 0;
    const segs = INI.map((x, k) => {
      const len = x.epicas.length / total * C, gap = 3;
      const s = `<circle class="seg" cx="110" cy="110" r="${R}" stroke="${COLOR[x.id]}" stroke-dasharray="${(len - gap).toFixed(2)} ${(C - len + gap).toFixed(2)}" stroke-dashoffset="${(-acc).toFixed(2)}" style="--C:${C.toFixed(2)};--d:${k * 150}ms"/>`;
      acc += len;
      return s;
    }).join('');
    return `<div class="flex flex-col sm:flex-row lg:flex-col items-center gap-5">
      <svg class="donut" viewBox="0 0 220 220" role="img" aria-label="Épicas 2027 por iniciativa">
        <circle cx="110" cy="110" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="22"/>${segs}
        <text x="110" y="108" text-anchor="middle" fill="#fff" style="font:800 46px Archivo, sans-serif;font-stretch:78%"><tspan class="count" data-to="${total}">${total}</tspan></text>
        <text x="110" y="132" text-anchor="middle" fill="rgba(255,255,255,.6)" style="font:600 12px 'Source Sans 3', sans-serif;letter-spacing:.12em">ÉPICAS 2027</text>
      </svg>
      <ul class="donut-legend grid gap-2">${INI.map(x => `<li style="--c:${COLOR[x.id]}"><i></i><span class="text-white/80">${esc(x.corto)}</span><b class="ml-auto pl-4 font-mono text-sm">${x.epicas.length}</b></li>`).join('')}</ul>
    </div>`;
  }

  function stepper(balance) {
    return `<div class="stepper">${STAGES.map((s, k) => `<div><span class="dot d${balance[k]} pop" style="--d:${k * 90}ms"></span><span>${s}</span></div>`).join('')}</div>`;
  }

  function stat(o, k) {
    return `<div class="card stat reveal sm:col-span-6 xl:col-span-3 flex flex-col gap-3" style="--c:${o.c || COLOR.motor}">
      <p class="sub-h">${esc(o.label)}</p>
      <div class="stat-value ${o.cls || ''}">${o.value}</div>
      <p class="text-sm text-muted leading-snug">${o.note}</p>
      ${o.meter != null ? `<div class="meter mt-auto"><span class="grow" style="width:${o.meter}%;--d:${k * 80}ms"></span></div>` : ''}
    </div>`;
  }

  /* ==========================================================================
     Charter principal
     ========================================================================== */
  function panelMotor() {
    const nEpicas = INI.reduce((a, i) => a + i.epicas.length, 0);
    const conMeta = ALL_KPIS.filter(k => !isTbd(k.m27) && k.m27 !== '—').length;

    const hero = `<section id="m-resumen" data-nav="Resumen" class="hero reveal lg:col-span-12" style="--c:${COLOR.motor}">
      <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] items-center">
        <div class="min-w-0">
          <p class="kicker kicker-dark">Project Charter principal · ${esc(M.revision)} · ${esc(M.fecha)}</p>
          <h1 class="hero-title">Motor Tecnológico</h1>
          <p class="mt-4 text-lg text-white/70 max-w-2xl">Herramientas, datos e IA en los proyectos y en la oficina. Charter 2027 con visión a 2028, gestionado con un modelo híbrido PMI + Scrum.</p>
          <dl class="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10">
            ${G.ficha.map(f => `<div class="ficha-cell"><dt>${esc(f[0])}</dt><dd>${esc(f[1])}${f[2] ? `<small>${esc(f[2])}</small>` : ''}</dd></div>`).join('')}
          </dl>
        </div>
        ${donut()}
      </div></section>`;

    const stats = [
      { label: 'Ingresos a cinco años', value: '48,5<em>→</em><span class="count" data-to="100">100</span>', note: 'Millones de USD, sin crecer sustancialmente la estructura corporativa.', meter: 48.5 },
      { label: 'Costo de administrar', value: '30–35 %<em>→</em><span class="count" data-to="20">20</span> %', note: 'Del costo de los proyectos. Cada punto que baja es competitividad.', meter: 57, c: COLOR.ia },
      { label: 'Metas 2027 definidas', value: `<span class="count" data-to="${conMeta}">${conMeta}</span> de ${ALL_KPIS.length}`, note: `Indicadores con meta 2027. El resto se fija en la fase de Planificación.`, meter: Math.round(conMeta / ALL_KPIS.length * 100), c: COLOR.datos },
      { label: 'Presupuesto 2027', value: 'Pendiente', note: 'Sin cierre formal desde el portafolio. Es la primera tarea de la fase de Inicio.', cls: 'is-crit', c: '#B3261E' }
    ].map(stat).join('');

    const caso = card('m-caso', 'Caso de negocio', 'Caso de negocio', 'El mandato: crecer sin crecer la estructura', `
      <div class="grid gap-5 md:grid-cols-2">
        <div class="flex flex-col gap-3">
          <p class="sub-h">Ingresos en cinco años · MUSD</p>
          <div class="mandate-v">48,5<em>→</em>100</div>
          <div class="grid gap-2 mt-1">
            <div class="bar-row"><span>2026</span><div class="bar-track"><span class="bar-fill grow" style="width:48.5%;background:#B8CFE9"></span></div></div>
            <div class="bar-row"><span>2031</span><div class="bar-track"><span class="bar-fill grow" style="width:100%;background:#0B2A4A;--d:120ms"></span></div></div>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <p class="sub-h">Costo de administrar los proyectos</p>
          <div class="mandate-v">30–35 %<em>→</em>20 %</div>
          <div class="grid gap-2 mt-1">
            <div class="bar-row"><span>Hoy</span><div class="bar-track"><span class="bar-fill grow" style="width:100%;background:#B3261E;opacity:.75"></span></div></div>
            <div class="bar-row"><span>Meta</span><div class="bar-track"><span class="bar-fill grow" style="width:57%;background:#2C7A4B;--d:120ms"></span></div></div>
          </div>
        </div>
      </div>
      <div class="quote mt-6"><p>Hoy el equipo administrativo dedica la mayor parte de su tiempo a <b>reunir datos y producir informes</b>, no a analizarlos. La tecnología debe devolver ese tiempo.</p></div>`,
      { cls: 'lg:col-span-7' });

    const balance = card('m-balance', 'Balance', 'Balance a octubre de 2026', 'Todas tienen rumbo; ninguna tiene valor medido', `
      <div class="grid gap-1">
        <div class="grid grid-cols-[minmax(0,1fr)_repeat(4,44px)] gap-2 pb-2 border-b border-line">
          <span></span>${['Diag.', 'Plan', 'Ejec.', 'Valor'].map((s, k) => `<span class="text-[10.5px] font-semibold uppercase tracking-wide text-muted text-center" title="${STAGES[k]}">${s}</span>`).join('')}
        </div>
        ${INI.map((x, r) => `<button type="button" data-go="${x.id}" class="grid grid-cols-[minmax(0,1fr)_repeat(4,44px)] gap-2 items-center py-3 border-b border-line last:border-0 text-left hover:bg-surface rounded-lg transition-colors" style="--c:${COLOR[x.id]}">
          <span class="min-w-0 pl-1"><b class="block font-semibold text-[15px]" style="color:${COLOR[x.id]}">${esc(x.corto)}</b><span class="block text-[13px] text-muted leading-snug">${esc(x.estado)}</span></span>
          ${x.balance.map((b, k) => `<span class="grid place-items-center"><span class="dot d${b} pop" style="--d:${(r * 4 + k) * 50}ms"></span></span>`).join('')}
        </button>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2 mt-5"><span class="sub-h self-center mr-1" style="color:#B3261E">Falta en todas</span>
        ${['Uso real de las herramientas', 'Medir el valor', 'Capacidad para ejecutar', 'Financiación 2027'].map(g => `<span class="text-[13px] font-semibold px-3 py-1.5 rounded-full" style="background:#FBE7E5;color:#B3261E">${g}</span>`).join('')}
      </div>`, { cls: 'lg:col-span-5' });

    const mv = card('m-mision', 'Misión y visión', 'Misión, visión y objetivo general', 'Hacia dónde va el motor', `
      <div class="grid gap-6">
        <div><p class="sub-h" style="color:#1D4F86">Misión</p><p class="statement mt-2">${esc(G.mision)}</p></div>
        <div><p class="sub-h" style="color:#1D4F86">Visión 2028</p><p class="statement mt-2">${esc(G.vision)}</p></div>
        <div class="rounded-2xl p-5 text-white" style="background:#0B2A4A"><p class="sub-h" style="color:#F5E3B8">Objetivo general 2027</p><p class="statement mt-2">${esc(G.objetivo)}</p></div>
      </div>`, { cls: 'lg:col-span-5' });

    const objetivos = card('m-objetivos', 'Objetivos', 'Objetivos específicos', 'Un objetivo por iniciativa', `
      <div class="grid gap-4 sm:grid-cols-2">${INI.map(x => `<button type="button" class="obj-card" data-go="${x.id}" style="--c:${COLOR[x.id]}">
        <span class="font-display font-extrabold text-3xl leading-none" style="color:${COLOR[x.id]};font-stretch:76%">${x.num}</span>
        <h3 class="font-display font-bold text-lg leading-tight" style="font-stretch:88%">${esc(x.nombre)}</h3>
        <p class="text-sm text-muted leading-relaxed">${esc(x.objetivo)}</p>
        <span class="go">Abrir charter de la iniciativa →</span></button>`).join('')}</div>`,
      { cls: 'lg:col-span-7', lede: 'Cada objetivo tiene su indicador y su backlog en el charter de la iniciativa.' });

    const alcance = card('m-alcance', 'Alcance', 'Alcance', 'Qué entra en 2027 y qué no', `
      <div class="grid gap-8 md:grid-cols-2">
        <div><p class="sub-h mb-4" style="color:#2C7A4B">Dentro del alcance</p>
          ${INI.map(x => `<div class="scope-item" style="--c:${COLOR[x.id]}"><div><b class="font-semibold">${x.num} · ${esc(x.nombre)}</b>
            <div class="flex flex-wrap gap-1.5 mt-2">${x.herramientas.map(h => `<span class="chip">${esc(h)}</span>`).join('')}</div></div></div>`).join('')}</div>
        <div><p class="sub-h mb-4" style="color:#B3261E">Fuera del alcance</p>
          ${G.fueraAlcance.map(f => `<div class="scope-item" style="--c:#B3261E"><div><b class="font-semibold">${esc(f[0])}</b><p class="text-sm text-muted mt-1">${esc(f[1])}</p></div></div>`).join('')}</div>
      </div>`, { cls: 'lg:col-span-12', lede: 'OPUS, Zoho CRM y M365 se suman a Libra y Procore en la iniciativa 1.' });

    const lane = (cls, title, sub, items) => `<div class="lane ${cls}"><div class="lane-h"><b>${title}</b><span>${sub}</span></div>
      <div class="steps">${items.map(s => `<div class="step"><span class="w">${esc(s.w)}</span><h4>${esc(s.n)}</h4><p>${esc(s.p)}</p></div>`).join('')}</div></div>`;
    const modelo = card('m-modelo', 'Modelo híbrido', 'Cómo se gestiona', 'Modelo híbrido: PMI para gobernar, Scrum para entregar', `
      <div class="grid gap-3">
        ${lane('is-pmi', 'PMI', 'Qué, cuánto y cuándo: línea base, costo, riesgos y control de cambios.', G.fases)}
        <div class="bridge"><span class="loop">↻</span><span><b>Punto de unión.</b> ${esc(G.puente)}</span></div>
        ${lane('is-scrum', 'Scrum', 'Cómo se entrega: backlog por iniciativa y un incremento usable cada 2 semanas.', G.scrum)}
      </div>
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] mt-8">
        <div class="min-w-0"><p class="sub-h mb-3">Eventos y cadencia</p>
          <div class="tbl-wrap"><table class="tbl" style="min-width:600px"><thead><tr><th>Evento</th><th>Cadencia</th><th>Participan</th><th>Sale de ahí</th><th></th></tr></thead>
          <tbody>${G.ceremonias.map(c => `<tr><td class="font-semibold">${esc(c[0])}</td><td>${esc(c[1])}</td><td>${esc(c[2])}</td><td>${esc(c[3])}</td><td>${badge(c[4])}</td></tr>`).join('')}</tbody></table></div>
        </div>
        <div class="min-w-0"><p class="sub-h mb-3">Roles</p>
          <div class="grid gap-3 sm:grid-cols-2">${G.roles.map(r => `<div class="role"><div class="flex justify-between items-start gap-2"><h4>${esc(r[0])}</h4>${badge(r[2])}</div><span class="who">${tbd(r[1])}</span><p>${esc(r[3])}</p></div>`).join('')}</div>
        </div>
      </div>
      <div class="dod mt-6"><p class="sub-h" style="color:#2C7A4B">Definición de terminado de una épica</p><ol>${G.dod.map(d => `<li>${esc(d)}</li>`).join('')}</ol></div>`,
      { cls: 'lg:col-span-12', lede: 'El charter, la línea base y el presupuesto se controlan como en PMI. Cada iniciativa entrega por sprints con un Product Owner del negocio.' });

    const rows = [{ group: true, n: 'Fases PMI de la palanca', ini: 'all', c: COLOR.navy }]
      .concat(G.fases.map(f => ({ n: f.n, sub: f.w, d: f.d, h: f.h, phase: true, ini: 'all', c: COLOR.navy, e: f.p })));
    INI.forEach(x => rows.push(...epicRows(x)));
    const ruta = card('m-ruta', 'Hoja de ruta', 'Hoja de ruta 2027', 'Épicas por trimestre y sus hitos', filterBar('ruta') + gantt(rows),
      { cls: 'lg:col-span-12', lede: 'Fechas preliminares. Se fijan como línea base en la fase de Planificación y se revisan cada trimestre.' });

    const kpis = card('m-kpis', 'Indicadores', 'Indicadores', 'Cómo sabremos que funcionó', filterBar('kpi') + kpiTable(ALL_KPIS, true) + `
      <div class="flex flex-wrap gap-5 mt-4 text-sm text-muted">
        <span class="inline-flex items-center gap-2"><span class="orig orig-pal">Palanca</span>Dato de la palanca, oct-2026</span>
        <span class="inline-flex items-center gap-2"><span class="orig orig-c25">Charter 2025</span>Indicador o formato heredado</span>
        <span class="inline-flex items-center gap-2"><span class="orig orig-pro">Propuesta</span>Nuevo en este borrador</span></div>`,
      { cls: 'lg:col-span-12', lede: 'Cada indicador tiene línea base. Las metas «Por definir» se fijan en la fase de Planificación.' });

    const heat = [];
    for (let p = 3; p >= 1; p--) {
      heat.push(`<div class="ax ay">${['', 'Baja', 'Media', 'Alta'][p]}</div>`);
      for (let i = 1; i <= 3; i++) {
        const rs = G.riesgos.filter(r => r.p === p && r.i === i);
        heat.push(`<div class="heat-cell s${sevOf(p, i)}">${rs.map((r, k) => `<button type="button" class="heat-dot pop" data-r="${r.id}" style="--d:${(k + p + i) * 60}ms" aria-label="${esc(r.id + ': ' + r.n)}">${r.id}</button>`).join('')}</div>`);
      }
    }
    heat.push('<div></div><div class="ax">Impacto bajo</div><div class="ax">Medio</div><div class="ax">Alto</div>');
    const riesgos = card('m-riesgos', 'Riesgos', 'Riesgos de la palanca', 'Lo que puede frenar el motor', `
      <div class="grid gap-8 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start">
        <div><div class="heat" role="group" aria-label="Matriz de probabilidad por impacto">${heat.join('')}</div>
          <p class="text-xs text-muted mt-3">Eje vertical: probabilidad. Valoración preliminar, por validar en la Planificación.</p></div>
        <div class="grid gap-3 md:grid-cols-2">${G.riesgos.map(r => { const s = sevOf(r.p, r.i); return `<div class="risk" data-r="${r.id}">
          <div><span class="rid">${r.id}</span><br><span class="sev s${s}">${SEV[s]}</span></div>
          <div><h4>${esc(r.n)}</h4><p>${esc(r.c)}</p><p class="mit"><b>Mitigación:</b> ${esc(r.m)}</p></div></div>`; }).join('')}</div>
      </div>`, { cls: 'lg:col-span-12', lede: 'Riesgos transversales. Los de cada iniciativa están en su charter.' });

    const max25 = Math.max(...G.ppto2025.map(r => r[1]));
    const tot25 = G.ppto2025.reduce((a, r) => a + r[1], 0);
    const ppto = card('m-ppto', 'Presupuesto', 'Presupuesto', 'Financiación 2027: pendiente de cierre', `
      <div class="alert mb-6"><span class="ic">!</span><span><b>No hay presupuesto 2027 aprobado.</b> Sin cerrarlo desde el portafolio, las iniciativas podrían arrancar sin financiación asegurada.</span></div>
      <div class="grid gap-8 md:grid-cols-2">
        <div class="min-w-0"><p class="sub-h mb-3">2027 por iniciativa · COP</p>
          <div class="grid gap-3">${G.ppto2027.map(r => `<div class="flex items-start gap-4 pb-3 border-b border-line last:border-0">
            <div class="min-w-0 flex-1"><span class="ini-pill" style="--c:${COLOR[r[0]]}"><i></i>${esc(byId[r[0]].corto)}</span><p class="text-sm text-muted mt-1">${esc(r[1])}</p></div>
            <span class="tbd text-sm whitespace-nowrap">Por definir</span></div>`).join('')}</div></div>
        <div class="min-w-0"><p class="sub-h mb-3">Referencia: presupuesto TI 2025 · COP</p>
          <div class="grid gap-3">${G.ppto2025.map((r, k) => `<div class="hb-row"><span class="l">${esc(r[0])}<small style="color:${r[2] ? '#2C7A4B' : '#5A6B80'}">${r[2] ? 'Equivale a líneas del Motor' : 'Fuera del alcance'}</small></span>
            <div class="bar-track"><span class="bar-fill grow" style="width:${(r[1] / max25 * 100).toFixed(1)}%;background:${r[2] ? '#1D4F86' : '#B8CFE9'};--d:${k * 80}ms"></span></div><span class="v">${cop(r[1])}</span></div>`).join('')}
            <div class="flex justify-between border-t-2 border-ink pt-2 font-semibold"><span>Total 2025</span><span class="font-mono">${cop(tot25)}</span></div></div></div>
      </div>`, { cls: 'lg:col-span-7' });

    const cond = card('m-condiciones', 'Supuestos', 'Supuestos, restricciones y criterios de éxito', 'Las condiciones del charter', `
      <div class="grid gap-6">
        <div><p class="sub-h mb-3">Supuestos</p><ul class="ck">${G.supuestos.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
        <div><p class="sub-h mb-3" style="color:#B5651D">Restricciones</p><ul class="ck" style="--bc:#B5651D">${G.restricciones.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
        <div><p class="sub-h mb-3" style="color:#2C7A4B">Criterios de éxito</p><ul class="ck" style="--bc:#2C7A4B">${G.exito.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      </div>`, { cls: 'lg:col-span-5' });

    const firmas = ['Patrocinador · Gerencia General', 'Director de la palanca · Líder ID&TI', 'Product Owners de las 4 iniciativas'];
    const aprobacion = card('m-aprobacion', 'Aprobación', 'Validación y aprobación', 'Lo que falta para pasar a Rev. A', `
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ol class="pend">${G.pendientes.map(p => `<li><div><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div></li>`).join('')}</ol>
        <div class="grid gap-3 content-start">${firmas.map(f => `<div class="firma"><span class="st">Pendiente</span><span class="sl">${esc(f)}</span><span class="text-xs text-muted">Firma y fecha</span></div>`).join('')}</div>
      </div>`, { cls: 'lg:col-span-12' });

    const vg = S.vigente;
    const avance = card('m-avance', 'Avance', `Avance a la fecha de corte · Semana ${CALC.semana(TREE, S.corte)}`, `Corte del ${esc(CALC.fecha(S.corte))}`, `
      ${avanceStats('motor')}
      <div class="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] mt-6">
        <div class="min-w-0"><p class="sub-h mb-2">Curva S del Motor</p><div class="curva-wrap" data-curva-id="motor">${curvaSvg('motor', true)}</div>${curvaLegend('motor')}</div>
        <div class="min-w-0"><p class="sub-h mb-3">Por frente</p>${avanceRows(FRENTES.map(f => f.id), { go: n => (byId[n.id] ? n.id : 'seguimiento') })}
          <button type="button" data-go="seguimiento" class="go-link mt-4">Ver el detalle por tarea y registrar el corte →</button></div>
      </div>`,
      { cls: 'lg:col-span-12', lede: vg ? `% real tomado del corte del ${esc(CALC.fecha(vg.fecha))}. El % planeado sale de la línea base (fechas y pesos de cada tarea).` : 'Aún no hay cortes registrados a esta fecha: el % real se muestra en 0.' });

    return `<div class="grid gap-6 lg:grid-cols-12">${hero}
      <div class="lg:col-span-12 grid gap-6 sm:grid-cols-12">${stats}</div>
      ${avance}${caso}${balance}${mv}${objetivos}${alcance}${modelo}${ruta}${kpis}${riesgos}${ppto}${cond}${aprobacion}</div>`;
  }

  /* ==========================================================================
     Charter de cada iniciativa
     ========================================================================== */
  function panelIniciativa(x) {
    const c = COLOR[x.id];
    const pre = x.id;

    const hero = `<section id="${pre}-resumen" data-nav="Resumen" class="hero reveal lg:col-span-12" style="--c:${c}">
      <div class="grid gap-10 lg:grid-cols-2 items-start">
        <div class="min-w-0">
          <div class="flex items-center gap-4"><span class="hero-num">${x.num}</span>${x.propuesta ? '<span class="badge badge-gold">Propuesta</span>' : ''}</div>
          <p class="kicker kicker-dark mt-5">Project Charter · Iniciativa ${x.num} · ${esc(M.revision)}</p>
          <h1 class="hero-title" style="font-size:clamp(36px,4.6vw,60px)">${esc(x.nombre)}</h1>
          <p class="mt-4 text-lg text-white/75 max-w-xl">${esc(x.tesis)}</p>
          <div class="mt-6 flex flex-wrap gap-2">${x.herramientas.map(h => `<span class="tool-tag">${esc(h)}</span>`).join('')}</div>
          <div class="mt-9 max-w-md"><p class="text-[11px] font-semibold uppercase tracking-[.14em] text-white/55 mb-3">Avance del ciclo · ${esc(x.estado)}</p>${stepper(x.balance)}</div>
        </div>
        <div class="grid gap-3">
          <div class="glass"><div class="glass-h">Misión</div><p>${esc(x.mision)}</p></div>
          <div class="glass"><div class="glass-h">Visión <span>${esc(x.visionAno)}</span></div><p>${esc(x.vision)}</p></div>
          <div class="glass is-gold"><div class="glass-h">Objetivo <span>2027</span></div><p>${esc(x.objetivo)}</p></div>
        </div>
      </div></section>`;

    const base = x.base.map((b, k) => `<div class="card stat reveal sm:col-span-6 xl:col-span-3 flex flex-col gap-2" style="--c:${b.tono === 'crit' ? '#B3261E' : b.tono === 'ok' ? '#2C7A4B' : c}">
      ${k === 0 ? `<p class="sub-h" id="${pre}-base" data-nav="Línea base" style="scroll-margin-top:150px">Línea base</p>` : '<p class="sub-h">&nbsp;</p>'}
      <div class="stat-value ${b.tono === 'crit' ? 'is-crit' : b.tono === 'ok' ? 'is-ok' : 'is-c'}">${esc(b.v)}</div>
      <p class="text-[15px] leading-snug">${esc(b.t)}</p><p class="text-sm text-muted leading-snug">${esc(b.s)}</p></div>`).join('');

    const gob = card(`${pre}-gobierno`, 'Gobierno', `Iniciativa ${x.num} · Gobierno`, 'Quién decide y quién entrega', `
      <dl class="grid gap-x-6 gap-y-5 sm:grid-cols-2">${x.ficha.map(f => `<div class="min-w-0"><dt class="flex items-center gap-2 sub-h">${esc(f[0])} ${badge(f[2])}</dt><dd class="mt-1.5 text-[15px] leading-snug">${tbd(f[1])}</dd></div>`).join('')}</dl>`,
      { cls: 'lg:col-span-6', c });

    const alc = card(`${pre}-alcance`, 'Alcance', `Iniciativa ${x.num} · Alcance`, 'Qué incluye y qué no', `
      <div class="grid gap-6">
        <div><p class="sub-h mb-3" style="color:#2C7A4B">Incluye</p><ul class="ck" style="--bc:${c}">${x.incluye.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
        <div><p class="sub-h mb-3" style="color:#B3261E">No incluye</p><ul class="ck" style="--bc:#B3261E">${x.excluye.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      </div>`, { cls: 'lg:col-span-6', c });

    const ruta = card(`${pre}-ruta`, 'Hoja de ruta', `Iniciativa ${x.num} · Hoja de ruta`, 'Épicas 2027 en el tiempo', gantt(epicRows(x)), { cls: 'lg:col-span-12', c });

    const qlab = ['Ini', 'T1', 'T2', 'T3', 'T4'];
    const backlog = card(`${pre}-backlog`, 'Backlog', `Iniciativa ${x.num} · Backlog 2027`, 'Épicas en orden de prioridad', `
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">${x.epicas.map(e => `<div class="epic">
        <div class="flex justify-between items-start gap-3"><div class="min-w-0"><span class="eid">${e.id}</span><h4>${esc(e.n)}</h4></div><span class="prio p${e.p}">${e.p === 1 ? 'Debe' : 'Debería'}</span></div>
        <p><b>Entregable:</b> ${esc(e.e)}</p>
        <div class="mt-auto"><div class="qs">${qlab.map((q, j) => `<span class="${j >= e.d && j <= e.h ? 'act grow' : ''}" style="--d:${j * 60}ms"></span>`).join('')}</div>
          <div class="qs-l">${qlab.map(q => `<span>${q}</span>`).join('')}</div></div>
        ${e.hito ? `<span class="hito"><i></i>Hito: ${esc(e.hito)}</span>` : ''}
        ${NODES[e.id] ? `<div class="pt-3 border-t border-line"><div class="flex justify-between text-[12.5px] mb-1.5"><span class="text-muted">Real <b class="text-ink font-mono">${pct(S.R[e.id].real, 0)}</b> · plan ${pct(S.R[e.id].plan, 0)}</span>${estPill(S.R[e.id].estado)}</div>${pv(e.id, { sm: true })}</div>` : ''}
      </div>`).join('')}</div>`,
      { cls: 'lg:col-span-12', c, lede: 'El Product Owner puede reordenar el backlog en cada revisión trimestral. Cada épica se parte en historias al planificar el sprint.' });

    const kp = card(`${pre}-kpis`, 'Indicadores', `Iniciativa ${x.num} · Indicadores`, 'Cómo se mide el valor', kpiTable(x.kpis.map(k => Object.assign({ ini: x.id }, k)), false), { cls: 'lg:col-span-12', c });

    const rsk = card(`${pre}-riesgos`, 'Riesgos', `Iniciativa ${x.num} · Riesgos`, 'Qué puede salir mal', `
      <div class="grid gap-3">${x.riesgos.map((r, k) => `<div class="risk"><div><span class="rid" style="color:${c}">R${k + 1}</span></div>
        <div><h4>${esc(r[0])}</h4><p>${esc(r[1])}</p><p class="mit"><b>Mitigación:</b> ${esc(r[2])}</p></div></div>`).join('')}</div>`, { cls: 'lg:col-span-7', c });

    const fac = card(`${pre}-exito`, 'Factores de éxito', `Iniciativa ${x.num} · Factores de éxito`, 'Qué lo hace funcionar', `
      <div>${x.exito.map(f => `<div class="factor"><div><h4>${esc(f[0])}</h4><p>${esc(f[1])}</p></div></div>`).join('')}</div>`, { cls: 'lg:col-span-5', c });

    const fr = NODES[x.id];
    const avance = fr ? card(`${pre}-avance`, 'Avance', `Iniciativa ${x.num} · Avance · Semana ${CALC.semana(TREE, S.corte)}`, `Corte del ${esc(CALC.fecha(S.corte))}`, `
      ${avanceStats(x.id)}
      <div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] mt-6">
        <div class="min-w-0"><p class="sub-h mb-2">Curva S de la iniciativa</p><div class="curva-wrap" data-curva-id="${x.id}">${curvaSvg(x.id, true)}</div>${curvaLegend(x.id)}</div>
        <div class="min-w-0"><p class="sub-h mb-3">Por épica</p>${avanceRows(fr.hijos.map(e => e.id))}
          <button type="button" data-go="seguimiento" data-frente="${x.id}" class="go-link mt-4">Ver tareas y registrar el corte →</button></div>
      </div>`, { cls: 'lg:col-span-12', c, lede: `Peso de la iniciativa en el Motor: ${fr.peso} %. ${fr.hijos.reduce((a, e) => a + e.hijos.length, 0)} tareas en la línea base.` }) : '';

    return `<div class="grid gap-6 lg:grid-cols-12">${hero}
      <div class="lg:col-span-12 grid gap-6 sm:grid-cols-12">${base}</div>
      ${avance}${gob}${alc}${ruta}${backlog}${kp}${rsk}${fac}</div>`;
  }

  /* ==========================================================================
     Seguimiento: avance por corte, curva S, EDT y registro del corte semanal
     ========================================================================== */
  const LS_BORRADOR = 'mt-corte-borrador', LS_EXPORT = 'mt-corte-exportado';
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };

  /* % real del corte anterior al que se edita (para comparar) */
  function realAnterior(fecha) {
    let prev = null;
    AV.cortes.forEach(c => { if (c.fecha < fecha) prev = c; });
    return prev ? prev.real : {};
  }

  /* Exportación pendiente: se guardó un corte que todavía no está en avance.js */
  function exportPendiente() {
    const ex = lsGet(LS_EXPORT);
    if (!ex || !ex.corte) return null;
    const enArchivo = (window.AVANCE && window.AVANCE.cortes || []).find(c => c.fecha === ex.corte.fecha);
    if (enArchivo && JSON.stringify(enArchivo.real) === JSON.stringify(ex.corte.real)) { lsSet(LS_EXPORT, null); return null; }
    return ex;
  }

  function panelSeguimiento() {
    const ed = S.edit, vg = S.vigente, ult = ultimoCorte();
    const sem = CALC.semana(TREE, S.corte);
    const dias = ult ? Math.round((CALC.toT(CALC.hoyISO()) - CALC.toT(ult.fecha)) / CALC.DAY) : null;
    const existe = AV.cortes.some(k => k.fecha === S.corte);
    const borrador = !ed && lsGet(LS_BORRADOR);
    const pend = !ed && exportPendiente();

    let aviso = '';
    if (ed) {
      aviso = `<div class="edit-bar lg:col-span-12">
        <div class="min-w-0"><p class="sub-h" style="color:#6B4A0B">${ed.nuevo ? 'Nuevo corte' : 'Editando corte'} · Semana ${sem}</p>
          <p class="font-display font-bold text-xl mt-1" style="font-stretch:88%">Corte del ${esc(CALC.fecha(ed.fecha))}</p>
          <p class="text-sm mt-1">Actualiza el % real de las tareas que avanzaron. Las cifras se recalculan al instante.</p></div>
        <label class="edit-note"><span class="sub-h">Nota del corte</span><textarea id="corte-nota" rows="2" placeholder="Logros, bloqueos o decisiones de la semana">${esc(ed.nota || '')}</textarea></label>
        <div class="flex flex-wrap gap-2 items-center"><button type="button" class="btn btn-gold" data-act="guardar">Guardar corte</button><button type="button" class="btn" data-act="cancelar">Cancelar</button></div>
      </div>`;
    } else if (borrador) {
      aviso = `<div class="note-bar lg:col-span-12"><span class="ic">!</span><span class="min-w-0">Tienes un corte del <b>${esc(CALC.fecha(borrador.fecha))}</b> sin guardar en este navegador.</span>
        <span class="flex gap-2"><button type="button" class="btn btn-gold" data-act="retomar">Retomar</button><button type="button" class="btn" data-act="descartar">Descartar</button></span></div>`;
    } else if (pend) {
      aviso = `<div class="note-bar lg:col-span-12"><span class="ic">!</span><span class="min-w-0">El corte del <b>${esc(CALC.fecha(pend.corte.fecha))}</b> se guardó, pero <b>dashboard/js/avance.js</b> todavía no lo tiene. Reemplaza el archivo por el que descargaste o descárgalo de nuevo.</span>
        <span class="flex gap-2"><button type="button" class="btn btn-gold" data-act="redescargar">Descargar avance.js</button><button type="button" class="btn" data-act="olvidar">Ya lo reemplacé</button></span></div>`;
    } else if (dias != null && dias >= 7) {
      aviso = `<div class="note-bar lg:col-span-12"><span class="ic">!</span><span class="min-w-0">Han pasado <b>${dias} días</b> desde el último corte (${esc(CALC.fecha(ult.fecha))}). Toca registrar el de esta semana.</span>
        <span><button type="button" class="btn btn-gold" data-act="corte-hoy">Registrar corte de hoy</button></span></div>`;
    }

    const head = `<section id="seg-resumen" data-nav="Resumen" class="hero reveal lg:col-span-12" style="--c:${COLOR.motor}">
      <div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] items-end">
        <div class="min-w-0">
          <p class="kicker kicker-dark">Seguimiento · Semana ${sem} · ${esc(window.PLAN.version)}</p>
          <h1 class="hero-title" style="font-size:clamp(34px,4.4vw,56px)">Corte del ${esc(CALC.fecha(S.corte))}</h1>
          <p class="mt-4 text-white/70 max-w-2xl">${ed ? 'Modo edición: las cifras muestran el corte que estás registrando.'
            : vg ? `% real tomado del corte del <b class="text-white">${esc(CALC.fecha(vg.fecha))}</b>${vg.nota ? ` · «${esc(vg.nota)}»` : ''}.`
            : 'No hay cortes registrados en o antes de esta fecha: el % real está en 0.'} El % planeado se calcula con las fechas y los pesos de la línea base.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${ed ? '' : `<button type="button" class="btn btn-gold" data-act="editar">${existe ? 'Editar el corte' : 'Registrar corte'} del ${esc(CALC.fechaCorta(S.corte))}</button>`}
          <button type="button" class="btn btn-ghost" data-act="csv">Descargar CSV para Excel</button>
        </div>
      </div>
      <div class="hero-stats mt-8">${['plan', 'real', 'desv', 'estado'].map((f, k) => `<div><p>${['Planeado', 'Real', 'Desviación', 'Estado'][k]}</p><b>${mv('motor', f)}</b></div>`).join('')}</div>
    </section>`;

    const curva = card('seg-curva', 'Curva S', 'Curva S', 'Planeado frente a real, semana a semana', `
      <div class="flex flex-wrap gap-2 mb-4" role="group" aria-label="Frente de la curva">
        ${[TREE.motor].concat(FRENTES).map(n => `<button type="button" class="filter-btn" data-curva="${n.id}" aria-pressed="${S.curva === n.id}" style="--c:${colorOf(n.id)}"><i></i>${esc(n.nivel ? n.corto : 'Motor')}</button>`).join('')}
      </div>
      <div class="curva-wrap" data-curva-id="${S.curva}">${curvaSvg(S.curva, true)}</div>${curvaLegend(S.curva)}`,
      { cls: 'lg:col-span-7', lede: 'Un punto real por cada corte registrado. La línea punteada es la línea base.' });

    const frentes = card('seg-frentes', 'Por frente', 'Resumen', 'Avance por frente', avanceRows(FRENTES.map(f => f.id), { go: n => (byId[n.id] ? n.id : 'seguimiento') }),
      { cls: 'lg:col-span-5', lede: 'El Motor es el promedio ponderado de los frentes.' });

    /* Tabla EDT */
    const prev = ed ? realAnterior(ed.fecha) : {};
    const rowsEdt = TREE.order.filter(n => n.nivel > 0).map(n => {
      const v = S.R[n.id], c = colorOf(n.id);
      const activa = (v.plan > 0 || v.real > 0) && v.real < 0.9995;
      if (n.nivel < 3) {
        return `<tr class="edt-l${n.nivel}" data-fr="${n.frente}" style="--c:${c}">
          <td class="font-mono">${n.nivel === 1 ? esc(n.num) : esc(n.id)}</td>
          <td colspan="4"><b>${esc(n.nivel === 1 ? n.n : n.n)}</b>${n.nivel === 1 ? `<small>Peso en el Motor: ${n.peso} %</small>` : `<small>Peso en la iniciativa: ${n.peso} · ${CALC.fechaCorta(n.ini)} a ${CALC.fechaCorta(n.fin)}</small>`}</td>
          <td class="num">${mv(n.id, 'plan')}</td><td class="num"><b>${mv(n.id, 'real')}</b></td>
          <td class="num">${mv(n.id, 'desv')}</td><td class="num">${mv(n.id, 'fc')}</td><td>${mv(n.id, 'estado')}</td></tr>`;
      }
      const rv = ed ? (+ed.real[n.id] || 0) : Math.round(v.real * 1000) / 10;
      const pv0 = +prev[n.id] || 0;
      const realCell = ed
        ? `<input type="number" class="real-in ${rv < pv0 ? 'is-down' : ''}" min="0" max="100" step="5" value="${rv}" data-t="${n.id}" aria-label="% real de ${esc(n.id)}">${pv0 ? `<small>antes ${pv0}</small>` : ''}`
        : mv(n.id, 'real');
      return `<tr class="edt-t" data-fr="${n.frente}" data-activa="${activa ? 1 : 0}" style="--c:${c}">
        <td class="font-mono">${esc(n.id)}</td>
        <td><span class="block">${esc(n.n)}</span><small>${esc(n.resp)}</small></td>
        <td class="num">${n.peso}</td><td class="num">${CALC.fechaCorta(n.ini)}</td><td class="num">${CALC.fechaCorta(n.fin)}</td>
        <td class="num">${mv(n.id, 'plan')}</td><td class="num real-cell">${realCell}</td>
        <td class="num">${mv(n.id, 'desv')}</td><td class="num">${mv(n.id, 'fc')}</td><td>${mv(n.id, 'estado')}</td></tr>`;
    }).join('');
    const edt = card('seg-edt', 'Tareas (EDT)', 'Estructura de desglose del trabajo', ed ? 'Registra el % real de cada tarea' : 'Avance por tarea', `
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por frente">
          ${[{ id: 'all', corto: 'Todos' }].concat(FRENTES).map(f => `<button type="button" class="filter-btn" data-fseg="${f.id}" aria-pressed="${S.fFrente === f.id}" style="--c:${f.id === 'all' ? COLOR.navy : colorOf(f.id)}"><i></i>${esc(f.corto)}</button>`).join('')}
        </div>
        <label class="toggle ml-auto"><input type="checkbox" data-act="activas" ${S.soloActivas ? 'checked' : ''}><span></span>Solo tareas en curso o pendientes a la fecha</label>
      </div>
      <div class="tbl-wrap"><table class="tbl edt" style="min-width:1080px">
        <thead><tr><th>Ítem</th><th>Actividad · responsable</th><th class="num">Peso</th><th class="num">Inicio</th><th class="num">Fin</th><th class="num">% Plan</th><th class="num">% Real</th><th class="num">Desv.</th><th class="num">Fin forecast</th><th>Estado</th></tr></thead>
        <tbody>${rowsEdt}</tbody></table></div>
      <p class="text-xs text-muted mt-3">Desviación = (% real − % planeado) × duración en días; negativa es atraso. Estado: Al día ≥ −3 días · Atención −3 a −10 · Atrasada &lt; −10.</p>`,
      { cls: 'lg:col-span-12', lede: ed ? 'Escribe el % (0 a 100) y pasa a la siguiente con Enter o Tab. Si un valor baja frente al corte anterior se marca en rojo.' : `${TREE.tareas.length} tareas de la línea base, agrupadas por frente y épica.` });

    /* Historial */
    const hist = AV.cortes.slice().reverse().map(k => {
      const r = CALC.compute(TREE, k.fecha, k.real).motor;
      return `<tr class="${k.fecha === (vg && vg.fecha) ? 'is-cur' : ''}"><td class="font-mono whitespace-nowrap">${esc(CALC.fecha(k.fecha))}</td><td class="num">S${CALC.semana(TREE, k.fecha)}</td>
        <td class="num">${pct(r.plan)}</td><td class="num"><b>${pct(r.real)}</b></td><td class="num">${desvTxt(r.desv)}</td><td>${estPill(r.estado)}</td>
        <td class="text-sm text-muted">${esc(k.nota || '')}</td><td><button type="button" class="btn btn-sm" data-ver="${k.fecha}">Ver</button></td></tr>`;
    }).join('');
    const historial = card('seg-historial', 'Historial', 'Historial de cortes', `${AV.cortes.length} ${AV.cortes.length === 1 ? 'corte registrado' : 'cortes registrados'}`, `
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Corte</th><th class="num">Semana</th><th class="num">Plan Motor</th><th class="num">Real Motor</th><th class="num">Desv.</th><th>Estado</th><th>Nota</th><th></th></tr></thead>
      <tbody>${hist || '<tr><td colspan="8" class="text-muted">Sin cortes todavía.</td></tr>'}</tbody></table></div>`, { cls: 'lg:col-span-12' });

    const pasos = [
      ['Elige la fecha de corte', 'Arriba, en «Fecha de corte». Lo habitual es el viernes de cada semana.'],
      ['Registra el corte', '«Registrar corte» abre la tabla de tareas con el % real del corte anterior.'],
      ['Actualiza lo que avanzó', 'Solo cambia las tareas que se movieron. El planeado, la desviación y la curva S se recalculan al instante.'],
      ['Guarda el archivo', '«Guardar corte» genera avance.js. En Edge o Chrome eliges directamente dashboard/js/avance.js; en otros navegadores se descarga y lo reemplazas a mano.'],
      ['Haz commit', 'En GitHub Desktop, con el mensaje «Corte semana N». Así queda el historial de cada semana.']
    ];
    const cadencia = [
      ['Semanal', 'Corte de avance real por tarea', 'Director de la palanca con los PO'],
      ['Cada 2 semanas', 'Revisión de sprint: el backlog alimenta el % real', 'Product Owners'],
      ['Mensual', 'Medición de indicadores (KPI) e informe al Patrocinador', 'Director de la palanca'],
      ['Trimestral', 'Comité: aprueba cambios a la línea base (plan.js)', 'Comité Directivo']
    ];
    const guia = card('seg-guia', 'Cómo actualizar', 'Rutina de actualización', 'Cómo se actualiza el charter', `
      <div class="grid gap-8 lg:grid-cols-2">
        <ol class="pend">${pasos.map(p => `<li><div><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div></li>`).join('')}</ol>
        <div><p class="sub-h mb-3">Cadencia</p><div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Cuándo</th><th>Qué se actualiza</th><th>Quién</th></tr></thead>
          <tbody>${cadencia.map(c => `<tr><td class="font-semibold whitespace-nowrap">${esc(c[0])}</td><td>${esc(c[1])}</td><td class="text-muted">${esc(c[2])}</td></tr>`).join('')}</tbody></table></div>
          <p class="text-sm text-muted mt-3">Archivos: <b>plan.js</b> es la línea base (fechas, pesos y tareas; solo cambia con aprobación del Comité) y <b>avance.js</b> guarda los cortes.</p></div>
      </div>`, { cls: 'lg:col-span-12' });

    return `<div class="grid gap-6 lg:grid-cols-12">${aviso}${head}${curva}${frentes}${edt}${historial}${guia}</div>`;
  }

  /* ---------- Actualización en vivo durante la edición ---------- */
  function mvText(id, f) { const tmp = document.createElement('div'); tmp.innerHTML = mv(id, f); return tmp.firstChild.innerHTML; }
  function refreshLive() {
    recompute();
    $$('[data-m]').forEach(el => { const [id, f] = el.dataset.m.split('|'); if (S.R[id]) el.innerHTML = mvText(id, f); });
    $$('[data-pv]').forEach(el => {
      const v = S.R[el.dataset.pv];
      $('.pv-r', el).style.width = (v.real * 100).toFixed(2) + '%';
      $('.pv-p', el).style.left = (v.plan * 100).toFixed(2) + '%';
      el.title = `Planeado ${pct(v.plan)} · Real ${pct(v.real)}`;
    });
    $$('.curva-wrap').forEach(w => { w.innerHTML = curvaSvg(w.dataset.curvaId, false); });
    renderNav();
  }

  /* ---------- Archivos ---------- */
  function archivoAvance(cortes) {
    return `/* ==========================================================================
   Avance real del Motor Tecnológico · un registro por corte semanal
   --------------------------------------------------------------------------
   Lo genera el dashboard: pestaña Seguimiento → «Registrar corte» →
   «Guardar corte». Reemplaza este archivo por el que descargas y haz commit.
   Cada corte guarda el % real (0 a 100) de las tareas con avance; las que
   no aparecen van en 0. El historial alimenta la curva S.
   Última actualización: ${CALC.fecha(CALC.hoyISO())}
   ========================================================================== */
window.AVANCE = ${JSON.stringify({ cortes }, null, 2)};
`;
  }

  function descargar(txt, nombre, tipo) {
    const url = URL.createObjectURL(new Blob([txt], { type: tipo }));
    const a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function guardarArchivo(txt) {
    if (window.showSaveFilePicker) {
      try {
        const h = await window.showSaveFilePicker({ suggestedName: 'avance.js', types: [{ description: 'Avance del Motor (JavaScript)', accept: { 'text/javascript': ['.js'] } }] });
        const w = await h.createWritable(); await w.write(txt); await w.close();
        return 'archivo';
      } catch (e) {
        if (e && e.name === 'AbortError') return null;
      }
    }
    descargar(txt, 'avance.js', 'text/javascript');
    return 'descarga';
  }

  let toastT = null;
  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = msg; t.hidden = false; t.classList.remove('out');
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.classList.add('out'); setTimeout(() => { t.hidden = true; }, 400); }, 7000);
  }

  function csv() {
    const n2 = v => (v * 100).toFixed(1).replace('.', ',');
    const head = ['Ítem', 'Actividad', 'Nivel', 'Responsable', 'Peso', 'Inicio', 'Fin', '% Planeado', '% Real', 'Desviación (días)', 'Fin forecast', 'Estado'];
    const lines = TREE.order.map(n => {
      const v = S.R[n.id];
      return [n.nivel === 1 ? n.num : n.id, n.n, ['Motor', 'Frente', 'Épica', 'Tarea'][n.nivel], n.resp || '', n.peso, CALC.toISO(n.ini), CALC.toISO(n.fin),
        n2(v.plan), n2(v.real), v.desv, v.forecast ? CALC.toISO(v.forecast) : '', ESTADO[v.estado]];
    });
    const cell = s => /[;"\n]/.test(String(s)) ? `"${String(s).replace(/"/g, '""')}"` : String(s);
    const txt = '﻿' + [[`Corte ${S.corte}`, `Real del corte ${S.vigente ? S.vigente.fecha : '—'}`]].concat([head], lines).map(r => r.map(cell).join(';')).join('\r\n');
    descargar(txt, `seguimiento-motor-${S.corte}.csv`, 'text/csv;charset=utf-8');
  }

  /* ---------- Acciones del corte ---------- */
  function iniciarCorte(fecha) {
    if (fecha) S.corte = fecha;
    const ex = AV.cortes.find(k => k.fecha === S.corte);
    const base = ex || CALC.corteVigente(AV.cortes, S.corte);
    S.edit = { fecha: S.corte, nota: ex ? (ex.nota || '') : '', real: Object.assign({}, base ? base.real : {}), nuevo: !ex };
    lsSet(LS_BORRADOR, S.edit);
    renderAll();
    const t = document.getElementById('seg-edt');
    if (t) t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  }

  async function guardarCorte() {
    const ed = S.edit;
    const real = {};
    Object.keys(ed.real).forEach(k => { const v = Math.round(Math.max(0, Math.min(100, +ed.real[k] || 0)) * 10) / 10; if (v > 0 && NODES[k]) real[k] = v; });
    const corte = { fecha: ed.fecha, nota: (ed.nota || '').trim(), real };
    const cortes = AV.cortes.filter(k => k.fecha !== ed.fecha).concat([corte]).sort((a, b) => a.fecha < b.fecha ? -1 : 1);
    const modo = await guardarArchivo(archivoAvance(cortes));
    if (!modo) return;
    AV.cortes = cortes;
    S.edit = null; S.corte = corte.fecha;
    lsSet(LS_BORRADOR, null);
    lsSet(LS_EXPORT, modo === 'descarga' ? { corte, cortes } : null);
    renderAll();
    toast(modo === 'archivo'
      ? `<b>Corte del ${esc(CALC.fecha(corte.fecha))} guardado.</b> Haz commit de avance.js en GitHub Desktop.`
      : `<b>Se descargó avance.js.</b> Reemplaza con él <code>dashboard/js/avance.js</code> y haz commit.`);
  }

  /* ==========================================================================
     Montaje
     ========================================================================== */
  function renderNav() {
    const avOf = id => NODES[id] ? `<span class="nav-av"><span><i style="width:${(S.R[id].real * 100).toFixed(1)}%"></i><em style="left:${(S.R[id].plan * 100).toFixed(1)}%"></em></span><span>${pct(S.R[id].real, 0)}</span></span>` : '';
    $('#side-nav').innerHTML = TABS.map(t => `<button type="button" class="nav-item" role="tab" data-tab="${t.id}" aria-selected="${t.id === S.tab}" style="--c:${COLOR[t.id]}">
      <span class="nav-num">${t.num}</span>
      <span class="min-w-0"><b>${esc(t.label)}</b><small>${t.id === 'seguimiento' ? `Semana ${CALC.semana(TREE, S.corte)} · ${S.edit ? 'editando corte' : 'corte ' + CALC.fechaCorta(S.corte)}` : esc(t.sub)}</small>${avOf(t.id)}</span>
    </button>`).join('');
    $('#top-nav').innerHTML = TABS.map(t => `<button type="button" class="top-tab" role="tab" data-tab="${t.id}" aria-selected="${t.id === S.tab}" style="--c:${COLOR[t.id]}"><i></i>${esc(t.label)}</button>`).join('');
  }

  function renderChrome() {
    renderNav();
    const ult = ultimoCorte();
    $('#side-foot').innerHTML = `<p class="font-semibold text-white/80">${esc(M.revision)} · ${esc(M.estado)}</p><p>Charter actualizado el ${esc(M.fecha)}</p><p>Último corte: ${ult ? esc(CALC.fecha(ult.fecha)) : 'sin cortes'}</p><p class="mt-2">Horizonte 2027 · visión 2028</p>`;
    $('#estado').textContent = M.estado;
    $('#rev').textContent = `${M.revision} · ${M.fecha}`;
    const inp = $('#corte-input');
    inp.value = S.corte; inp.disabled = !!S.edit;
    $('#corte-sem').textContent = `S${CALC.semana(TREE, S.corte)}`;
    $('#foot').textContent = `Dirección de Innovación Digital & TI · Fuentes: Palanca Motor Tecnológico (resúmenes ejecutivos de Libra, Procore, Transformación Digital e IA, 16-oct-2026) y Project Charter TI 2025 Rev. B. Las metas «Por definir», las fechas de la línea base y la valoración de riesgos son preliminares.`;
  }

  function applyEdtFilter() {
    $$('#seg-edt [data-fseg]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fseg === S.fFrente)));
    $$('#seg-edt tbody tr').forEach(r => {
      const okF = S.fFrente === 'all' || r.dataset.fr === S.fFrente;
      const okA = !S.soloActivas || !r.classList.contains('edt-t') || r.dataset.activa === '1';
      r.hidden = !(okF && okA);
    });
  }

  function bindPanels() {
    /* Filtros por iniciativa */
    $$('[data-filter]').forEach(bar => {
      const scope = bar.closest('.card');
      bar.addEventListener('click', e => {
        const b = e.target.closest('.filter-btn');
        if (!b) return;
        $$('.filter-btn', bar).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        const f = b.dataset.f;
        $$('[data-ini]', scope).forEach(r => {
          const ini = r.dataset.ini;
          r.hidden = !(f === 'all' || ini === f || ini === 'all');
        });
      });
    });

    /* Matriz de riesgos ↔ lista */
    const hl = (id, on) => $$(`[data-r="${id}"]`).forEach(el => el.classList.toggle('hl', on));
    $$('.heat-dot').forEach(d => {
      ['mouseenter', 'focus'].forEach(ev => d.addEventListener(ev, () => hl(d.dataset.r, true)));
      ['mouseleave', 'blur'].forEach(ev => d.addEventListener(ev, () => hl(d.dataset.r, false)));
      d.addEventListener('click', () => {
        const it = $(`.risk[data-r="${d.dataset.r}"]`);
        if (it) it.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      });
    });
    $$('.risk[data-r]').forEach(it => {
      it.addEventListener('mouseenter', () => hl(it.dataset.r, true));
      it.addEventListener('mouseleave', () => hl(it.dataset.r, false));
    });

    /* Edición del % real */
    $$('.real-in').forEach(inp => {
      inp.addEventListener('input', () => {
        const v = inp.value === '' ? 0 : Math.max(0, Math.min(100, +inp.value));
        S.edit.real[inp.dataset.t] = v;
        const prev = +realAnterior(S.edit.fecha)[inp.dataset.t] || 0;
        inp.classList.toggle('is-down', v < prev);
        lsSet(LS_BORRADOR, S.edit);
        refreshLive();
      });
      inp.addEventListener('blur', () => { if (inp.value !== '' && (+inp.value < 0 || +inp.value > 100)) inp.value = Math.max(0, Math.min(100, +inp.value)); });
      inp.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const all = $$('.real-in').filter(x => !x.closest('tr').hidden);
        const nx = all[all.indexOf(inp) + 1];
        if (nx) { nx.focus(); nx.select(); }
      });
    });
    const nota = $('#corte-nota');
    if (nota) nota.addEventListener('input', () => { S.edit.nota = nota.value; lsSet(LS_BORRADOR, S.edit); });

    applyEdtFilter();
  }

  function renderAll() {
    recompute();
    renderChrome();
    $('#app').innerHTML =
      `<div class="panel" id="p-motor" role="tabpanel" hidden>${panelMotor()}</div>` +
      `<div class="panel" id="p-seguimiento" role="tabpanel" hidden>${panelSeguimiento()}</div>` +
      INI.map(x => `<div class="panel" id="p-${x.id}" role="tabpanel" hidden>${panelIniciativa(x)}</div>`).join('');
    bindPanels();
    show(S.tab);
  }

  /* Acciones del seguimiento (delegadas) */
  document.addEventListener('click', async e => {
    const a = e.target.closest('[data-act]');
    const ver = e.target.closest('[data-ver]');
    const cv = e.target.closest('[data-curva]');
    const fs = e.target.closest('[data-fseg]');
    if (cv) {
      S.curva = cv.dataset.curva;
      $$('[data-curva]').forEach(b => b.setAttribute('aria-pressed', String(b === cv)));
      const w = $('#seg-curva .curva-wrap');
      w.dataset.curvaId = S.curva; w.innerHTML = curvaSvg(S.curva, true);
      w.nextElementSibling.outerHTML = curvaLegend(S.curva);
      return;
    }
    if (fs) { S.fFrente = fs.dataset.fseg; applyEdtFilter(); return; }
    if (ver) { S.corte = ver.dataset.ver; renderAll(); window.scrollTo({ top: 0 }); return; }
    if (!a || a.tagName === 'INPUT') return;
    const act = a.dataset.act;
    if (act === 'editar') iniciarCorte();
    else if (act === 'corte-hoy') iniciarCorte(CALC.hoyISO());
    else if (act === 'guardar') await guardarCorte();
    else if (act === 'cancelar' || act === 'descartar') { S.edit = null; lsSet(LS_BORRADOR, null); renderAll(); }
    else if (act === 'retomar') { const b = lsGet(LS_BORRADOR); if (b) { S.edit = b; S.corte = b.fecha; renderAll(); } }
    else if (act === 'csv') csv();
    else if (act === 'redescargar') { const ex = lsGet(LS_EXPORT); if (ex) descargar(archivoAvance(ex.cortes), 'avance.js', 'text/javascript'); }
    else if (act === 'olvidar') { lsSet(LS_EXPORT, null); renderAll(); }
  });
  document.addEventListener('change', e => {
    if (e.target.matches('[data-act="activas"]')) { S.soloActivas = e.target.checked; applyEdtFilter(); }
  });
  $('#corte-input').addEventListener('change', e => {
    const v = e.target.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || S.edit) return;
    S.corte = v; renderAll();
  });
  window.addEventListener('beforeunload', e => { if (S.edit) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Contadores ---------- */
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  function countUp(scope) {
    if (RM) return;
    $$('.count[data-to]', scope).forEach(el => {
      const to = +el.dataset.to, t0 = performance.now() + 250, dur = 1000;
      const step = t => {
        const p = Math.max(0, Math.min(1, (t - t0) / dur));
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- Animación al entrar en pantalla ---------- */
  let io = null;
  function arm(panel) {
    if (io) io.disconnect();
    const els = $$('.reveal', panel);
    els.forEach((el, k) => { el.classList.remove('play'); el.style.setProperty('--stagger', `${(k % 4) * 70}ms`); });
    if (RM || !('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('play'); countUp(en.target); io.unobserve(en.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    requestAnimationFrame(() => els.forEach(el => io.observe(el)));
  }

  /* ---------- Navegación por secciones ---------- */
  let spy = null;
  function buildSecNav(panel, color) {
    const secs = $$('[data-nav]', panel);
    $('#sec-nav').innerHTML = secs.map(s => `<button type="button" class="sec-chip" data-target="${s.id}" style="--c:${color}">${esc(s.dataset.nav)}</button>`).join('');
    $$('#sec-nav .sec-chip').forEach(b => b.addEventListener('click', () => {
      const t = document.getElementById(b.dataset.target);
      if (t) t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    }));
    if (spy) window.removeEventListener('scroll', spy);
    spy = () => {
      let current = secs[0];
      secs.forEach(s => { if (s.getBoundingClientRect().top < 170) current = s; });
      $$('#sec-nav .sec-chip').forEach(b => b.classList.toggle('is-active', current && b.dataset.target === current.id));
    };
    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  /* ---------- Pestañas ---------- */
  const ids = TABS.map(t => t.id);
  function show(id, opts = {}) {
    if (!ids.includes(id)) id = ids[0];
    S.tab = id;
    const t = TABS.find(x => x.id === id);
    $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
    $$('.panel').forEach(p => { p.hidden = p.id !== 'p-' + id; });
    $('#crumb').textContent = id === 'motor' ? 'Charter principal · Motor Tecnológico' : id === 'seguimiento' ? `Seguimiento · Corte del ${CALC.fecha(S.corte)}` : `Iniciativa ${t.num} · ${byId[id].nombre}`;
    document.title = `${id === 'motor' ? 'Charter principal' : id === 'seguimiento' ? 'Seguimiento' : byId[id].corto} · Project Charter Motor Tecnológico`;
    const top = $(`#top-nav [data-tab="${id}"]`);
    if (top) top.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (opts.scroll) window.scrollTo({ top: 0, behavior: 'auto' });
    if (opts.hash) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// puede bloquearlo */ } }
    const panel = $('#p-' + id);
    arm(panel);
    buildSecNav(panel, COLOR[id]);
  }

  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { show(tab.dataset.tab, { hash: true, scroll: true }); return; }
    const go = e.target.closest('[data-go]');
    if (go) {
      if (go.dataset.go === 'seguimiento') S.fFrente = go.dataset.frente || 'all';
      show(go.dataset.go, { hash: true, scroll: true });
      if (go.dataset.go === 'seguimiento') {
        applyEdtFilter();
        if (go.dataset.frente) { const t = document.getElementById('seg-edt'); if (t) t.scrollIntoView({ behavior: 'auto', block: 'start' }); }
      }
    }
  });
  document.addEventListener('keydown', e => {
    const tab = e.target.closest && e.target.closest('[role="tab"]');
    if (!tab || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    e.preventDefault();
    const list = $$('[role="tab"]', tab.parentElement);
    const i = list.indexOf(tab), dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
    const next = list[(i + dir + list.length) % list.length];
    next.focus(); next.click();
  });

  const start = (location.hash || '').slice(1);
  S.tab = ids.includes(start) ? start : ids[0];
  renderAll();
  window.addEventListener('hashchange', () => { const k = location.hash.slice(1); if (ids.includes(k)) show(k, { scroll: true }); });
})();
