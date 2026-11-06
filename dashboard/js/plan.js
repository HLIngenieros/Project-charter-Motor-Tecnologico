/* ==========================================================================
   Línea base del cronograma (PMI) · Motor Tecnológico 2027
   --------------------------------------------------------------------------
   Estructura: frente → épica → tarea. Cada tarea tiene fecha de inicio, fecha
   de fin, peso y responsable. El dashboard calcula con estos datos el % de
   avance planeado a la fecha de corte (lineal entre inicio y fin, como el
   Project Charter TI 2025) y lo consolida por pesos.

   - Los pesos son relativos dentro de su grupo: no hace falta que sumen 100,
     el cálculo los normaliza. Se dejan en base 100 para leerlos fácil.
   - Fechas en formato AAAA-MM-DD.
   - Este archivo es la LÍNEA BASE: se cambia solo con control de cambios
     aprobado en la revisión trimestral. El avance real va en avance.js.
   - El nombre de las épicas de las iniciativas sale de datos.js (por su id).
   ========================================================================== */
window.PLAN = {
  version: 'Línea base preliminar · Rev. 0',
  inicio: '2026-11-02',
  fin: '2027-12-31',
  diaCorte: 'viernes',

  frentes: [
    {
      id: 'gestion', nombre: 'Gestión de la palanca (PMI)', corto: 'Gestión PMI', peso: 10,
      epicas: [
        { id: 'G1', n: 'Inicio y aprobación del charter', peso: 40, tareas: [
          { id: 'G1.1', n: 'Borrador del charter (Rev. 0) y tablero de seguimiento', ini: '2026-11-02', fin: '2026-11-13', peso: 25, resp: 'Director de la palanca' },
          { id: 'G1.2', n: 'Validar el gobierno: patrocinador, director y Product Owners', ini: '2026-11-09', fin: '2026-11-27', peso: 20, resp: 'Patrocinador' },
          { id: 'G1.3', n: 'Fijar metas 2027 y fórmula del costo de administrar', ini: '2026-11-16', fin: '2026-12-04', peso: 20, resp: 'Director de la palanca' },
          { id: 'G1.4', n: 'Aprobar el charter (Rev. A) en Comité Directivo', ini: '2026-12-07', fin: '2026-12-18', peso: 35, resp: 'Comité Directivo' }
        ] },
        { id: 'G2', n: 'Planificación y línea base', peso: 25, tareas: [
          { id: 'G2.1', n: 'Línea base de alcance y cronograma (esta EDT)', ini: '2026-12-01', fin: '2026-12-18', peso: 35, resp: 'Director de la palanca' },
          { id: 'G2.2', n: 'Presupuesto 2027 de la palanca aprobado', ini: '2026-12-01', fin: '2027-01-15', peso: 40, resp: 'Patrocinador' },
          { id: 'G2.3', n: 'Backlogs priorizados y primer sprint planificado', ini: '2027-01-04', fin: '2027-01-29', peso: 25, resp: 'Facilitador Scrum' }
        ] },
        { id: 'G3', n: 'Seguimiento y control trimestral', peso: 25, tareas: [
          { id: 'G3.1', n: 'Revisión trimestral T1 con el Comité', ini: '2027-03-22', fin: '2027-03-31', peso: 25, resp: 'Director de la palanca' },
          { id: 'G3.2', n: 'Revisión trimestral T2 con el Comité', ini: '2027-06-21', fin: '2027-06-30', peso: 25, resp: 'Director de la palanca' },
          { id: 'G3.3', n: 'Revisión trimestral T3 con el Comité', ini: '2027-09-20', fin: '2027-09-30', peso: 25, resp: 'Director de la palanca' },
          { id: 'G3.4', n: 'Revisión T4 y metas 2028', ini: '2027-11-29', fin: '2027-12-10', peso: 25, resp: 'Director de la palanca' }
        ] },
        { id: 'G4', n: 'Cierre', peso: 10, tareas: [
          { id: 'G4.1', n: 'Informe de cierre con el valor medido', ini: '2027-12-01', fin: '2027-12-17', peso: 60, resp: 'Director de la palanca' },
          { id: 'G4.2', n: 'Lecciones aprendidas y charter 2028', ini: '2027-12-06', fin: '2027-12-23', peso: 40, resp: 'Director de la palanca' }
        ] }
      ]
    },

    {
      id: 'core', peso: 30,
      epicas: [
        { id: 'E1.1', peso: 15, tareas: [
          { id: 'E1.1.1', n: 'Inventario de la configuración de apertura en Libra y Procore', ini: '2027-01-11', fin: '2027-02-05', peso: 20, resp: 'PO Herramientas core' },
          { id: 'E1.1.2', n: 'Diseño del estándar de apertura de proyecto', ini: '2027-02-08', fin: '2027-03-19', peso: 30, resp: 'PO Herramientas core' },
          { id: 'E1.1.3', n: 'Piloto del estándar en un proyecto nuevo', ini: '2027-03-22', fin: '2027-05-07', peso: 30, resp: 'Líder funcional de proyectos' },
          { id: 'E1.1.4', n: 'Aprobación y despliegue en los cuatro países', ini: '2027-05-10', fin: '2027-06-25', peso: 20, resp: 'PO Herramientas core' }
        ] },
        { id: 'E1.2', peso: 15, tareas: [
          { id: 'E1.2.1', n: 'Diagnóstico de brechas de uso de los 14 usuarios clave', ini: '2027-01-11', fin: '2027-01-29', peso: 15, resp: 'Equipo ID&TI' },
          { id: 'E1.2.2', n: 'Plan de formación con tiempo asignado', ini: '2027-02-01', fin: '2027-02-19', peso: 15, resp: 'PO Herramientas core' },
          { id: 'E1.2.3', n: 'Formación oleada 1 (7 de 14)', ini: '2027-02-22', fin: '2027-04-16', peso: 35, resp: 'Equipo ID&TI' },
          { id: 'E1.2.4', n: 'Formación oleada 2 y evaluación (14 de 14)', ini: '2027-04-19', fin: '2027-06-18', peso: 35, resp: 'Equipo ID&TI' }
        ] },
        { id: 'E1.3', peso: 15, tareas: [
          { id: 'E1.3.1', n: 'Designar líder y suplente por módulo crítico', ini: '2027-01-11', fin: '2027-02-12', peso: 20, resp: 'PO Herramientas core' },
          { id: 'E1.3.2', n: 'Configurar inspecciones con plan de acción', ini: '2027-02-15', fin: '2027-04-30', peso: 35, resp: 'Líderes de módulo Procore' },
          { id: 'E1.3.3', n: 'Seguimiento de hallazgos hasta su cierre en el sistema', ini: '2027-05-03', fin: '2027-09-24', peso: 45, resp: 'Líderes de módulo Procore' }
        ] },
        { id: 'E1.4', peso: 15, tareas: [
          { id: 'E1.4.1', n: 'Mapa del cierre mensual actual y sus nivelaciones en Excel', ini: '2027-04-05', fin: '2027-05-14', peso: 15, resp: 'Líder funcional de costos' },
          { id: 'E1.4.2', n: 'Integración del costo Libra–Procore para el cierre', ini: '2027-05-17', fin: '2027-08-27', peso: 40, resp: 'Equipo ID&TI' },
          { id: 'E1.4.3', n: 'Cierres en paralelo (Excel y Libra)', ini: '2027-09-01', fin: '2027-10-29', peso: 25, resp: 'Líder funcional de costos' },
          { id: 'E1.4.4', n: 'Primer cierre mensual sin Excel', ini: '2027-11-01', fin: '2027-12-10', peso: 20, resp: 'PO Herramientas core' }
        ] },
        { id: 'E1.5', peso: 15, tareas: [
          { id: 'E1.5.1', n: 'Metodología de conciliación contabilidad–proyectos', ini: '2027-01-11', fin: '2027-03-05', peso: 35, resp: 'Líder funcional Perú' },
          { id: 'E1.5.2', n: 'Puesta en operación y conciliación mensual', ini: '2027-03-08', fin: '2027-06-25', peso: 65, resp: 'Líder funcional Perú' }
        ] },
        { id: 'E1.6', peso: 9, tareas: [
          { id: 'E1.6.1', n: 'Catálogo OPUS de República Dominicana', ini: '2027-01-11', fin: '2027-04-09', peso: 35, resp: 'Líder funcional de presupuestos' },
          { id: 'E1.6.2', n: 'Catálogo OPUS de Perú', ini: '2027-04-12', fin: '2027-07-09', peso: 35, resp: 'Líder funcional de presupuestos' },
          { id: 'E1.6.3', n: 'Plantilla de indirectos (costo industrial)', ini: '2027-07-12', fin: '2027-09-24', peso: 30, resp: 'Líder funcional de presupuestos' }
        ] },
        { id: 'E1.7', peso: 8, tareas: [
          { id: 'E1.7.1', n: 'Etapas del embudo comercial único', ini: '2027-04-05', fin: '2027-05-07', peso: 25, resp: 'Líder comercial' },
          { id: 'E1.7.2', n: 'Registro de oportunidades en Zoho CRM', ini: '2027-05-10', fin: '2027-07-30', peso: 45, resp: 'Líder comercial' },
          { id: 'E1.7.3', n: 'Traspaso de la oportunidad al arranque del proyecto', ini: '2027-08-02', fin: '2027-09-24', peso: 30, resp: 'PO Herramientas core' }
        ] },
        { id: 'E1.8', peso: 8, tareas: [
          { id: 'E1.8.1', n: 'Estructura estándar en SharePoint y Teams', ini: '2027-01-11', fin: '2027-03-26', peso: 30, resp: 'Equipo ID&TI' },
          { id: 'E1.8.2', n: 'Migración de repositorios por área', ini: '2027-04-05', fin: '2027-09-24', peso: 45, resp: 'Equipo ID&TI' },
          { id: 'E1.8.3', n: 'Formación de usuarios en M365', ini: '2027-10-04', fin: '2027-12-10', peso: 25, resp: 'Equipo ID&TI' }
        ] }
      ]
    },

    {
      id: 'datos', peso: 25,
      epicas: [
        { id: 'E2.1', peso: 20, tareas: [
          { id: 'E2.1.1', n: 'Inventario de datos críticos y repositorios', ini: '2027-01-11', fin: '2027-03-05', peso: 30, resp: 'PO Data Driven' },
          { id: 'E2.1.2', n: 'Asignar dueño a los 39 indicadores', ini: '2027-03-08', fin: '2027-05-28', peso: 35, resp: 'PO Data Driven' },
          { id: 'E2.1.3', n: 'Catálogo de los 11 repositorios publicado', ini: '2027-06-01', fin: '2027-09-24', peso: 35, resp: 'Equipo ID&TI' }
        ] },
        { id: 'E2.2', peso: 20, tareas: [
          { id: 'E2.2.1', n: 'Priorizar integraciones y acordar niveles de servicio', ini: '2027-04-05', fin: '2027-05-14', peso: 20, resp: 'PO Data Driven' },
          { id: 'E2.2.2', n: 'Primeras integraciones automatizadas', ini: '2027-05-17', fin: '2027-08-27', peso: 45, resp: 'Equipo ID&TI' },
          { id: 'E2.2.3', n: 'Monitoreo y alertas de las integraciones', ini: '2027-09-01', fin: '2027-12-10', peso: 35, resp: 'Equipo ID&TI' }
        ] },
        { id: 'E2.3', peso: 20, tareas: [
          { id: 'E2.3.1', n: 'Doble autenticación en Libra', ini: '2027-01-11', fin: '2027-03-05', peso: 35, resp: 'Outsourcing TIC' },
          { id: 'E2.3.2', n: 'Monitoreo de amenazas', ini: '2027-03-08', fin: '2027-05-14', peso: 35, resp: 'Outsourcing TIC' },
          { id: 'E2.3.3', n: 'Plan para subir la seguridad de M365', ini: '2027-05-17', fin: '2027-06-25', peso: 30, resp: 'Equipo ID&TI' }
        ] },
        { id: 'E2.4', peso: 20, tareas: [
          { id: 'E2.4.1', n: 'Ficha de los 46 proyectos con presupuesto', ini: '2026-11-09', fin: '2026-12-11', peso: 35, resp: 'Líder ID&TI' },
          { id: 'E2.4.2', n: 'Beneficio en pesos de cada proyecto', ini: '2026-11-23', fin: '2027-01-29', peso: 35, resp: 'Líder ID&TI' },
          { id: 'E2.4.3', n: 'Aprobación del portafolio en Comité', ini: '2027-02-01', fin: '2027-03-19', peso: 30, resp: 'Comité Directivo' }
        ] },
        { id: 'E2.5', peso: 10, tareas: [
          { id: 'E2.5.1', n: 'Indicadores de costo y plazo del tablero', ini: '2027-07-05', fin: '2027-08-13', peso: 30, resp: 'PO Data Driven' },
          { id: 'E2.5.2', n: 'Construcción del tablero', ini: '2027-08-16', fin: '2027-10-29', peso: 40, resp: 'Equipo ID&TI' },
          { id: 'E2.5.3', n: 'Piloto en un proyecto', ini: '2027-11-01', fin: '2027-12-10', peso: 30, resp: 'Director de proyecto piloto' }
        ] },
        { id: 'E2.6', peso: 10, tareas: [
          { id: 'E2.6.1', n: 'Medir la carga actual del equipo ID&TI', ini: '2027-01-11', fin: '2027-02-26', peso: 40, resp: 'Líder ID&TI' },
          { id: 'E2.6.2', n: 'Modelo operativo y apoyo externo definidos', ini: '2027-03-01', fin: '2027-06-11', peso: 60, resp: 'Líder ID&TI' }
        ] }
      ]
    },

    {
      id: 'ia', peso: 25,
      epicas: [
        { id: 'E3.1', peso: 20, tareas: [
          { id: 'E3.1.1', n: 'Medir horas por mes en los 2 asistentes en producción', ini: '2027-01-11', fin: '2027-02-26', peso: 60, resp: 'PO IA' },
          { id: 'E3.1.2', n: 'Fijar la meta 2027 de horas liberadas', ini: '2027-03-01', fin: '2027-03-26', peso: 40, resp: 'PO IA' }
        ] },
        { id: 'E3.2', peso: 20, tareas: [
          { id: 'E3.2.1', n: 'Registro de agentes con responsable', ini: '2027-01-11', fin: '2027-03-12', peso: 50, resp: 'Equipo ID&TI' },
          { id: 'E3.2.2', n: 'Tope de consumo y reporte mensual', ini: '2027-03-15', fin: '2027-06-11', peso: 50, resp: 'Equipo ID&TI' }
        ] },
        { id: 'E3.3', peso: 20, tareas: [
          { id: 'E3.3.1', n: 'Red de Champions activa', ini: '2027-01-11', fin: '2027-03-12', peso: 20, resp: 'PO IA' },
          { id: 'E3.3.2', n: 'Formación: sesiones 1 a 12', ini: '2027-03-15', fin: '2027-06-25', peso: 35, resp: 'Champions IA' },
          { id: 'E3.3.3', n: 'Formación: sesiones 13 a 24', ini: '2027-07-05', fin: '2027-10-29', peso: 35, resp: 'Champions IA' },
          { id: 'E3.3.4', n: 'Medición del uso diario', ini: '2027-11-01', fin: '2027-12-10', peso: 10, resp: 'PO IA' }
        ] },
        { id: 'E3.4', peso: 15, tareas: [
          { id: 'E3.4.1', n: 'Priorizar pilotos por ahorro esperado', ini: '2027-04-05', fin: '2027-05-14', peso: 20, resp: 'PO IA' },
          { id: 'E3.4.2', n: 'Llevar a producción o cerrar cada piloto', ini: '2027-05-17', fin: '2027-10-29', peso: 55, resp: 'Equipo ID&TI' },
          { id: 'E3.4.3', n: 'Medir el ahorro', ini: '2027-11-01', fin: '2027-12-10', peso: 25, resp: 'PO IA' }
        ] },
        { id: 'E3.5', peso: 15, tareas: [
          { id: 'E3.5.1', n: 'Reunir y estructurar las lecciones aprendidas', ini: '2027-04-05', fin: '2027-07-30', peso: 45, resp: 'PO IA' },
          { id: 'E3.5.2', n: 'Consulta con IA desde cualquier país', ini: '2027-08-02', fin: '2027-12-10', peso: 55, resp: 'Equipo ID&TI' }
        ] },
        { id: 'E3.6', peso: 10, tareas: [
          { id: 'E3.6.1', n: 'Comunicado de resultados T1', ini: '2027-03-15', fin: '2027-03-31', peso: 25, resp: 'PO IA' },
          { id: 'E3.6.2', n: 'Comunicado de resultados T2', ini: '2027-06-14', fin: '2027-06-30', peso: 25, resp: 'PO IA' },
          { id: 'E3.6.3', n: 'Comunicado de resultados T3', ini: '2027-09-13', fin: '2027-09-30', peso: 25, resp: 'PO IA' },
          { id: 'E3.6.4', n: 'Comunicado de resultados T4', ini: '2027-12-01', fin: '2027-12-15', peso: 25, resp: 'PO IA' }
        ] }
      ]
    },

    {
      id: 'vigilancia', peso: 10,
      epicas: [
        { id: 'E4.1', peso: 20, tareas: [
          { id: 'E4.1.1', n: 'Procedimiento y criterios de evaluación', ini: '2026-11-16', fin: '2027-01-29', peso: 60, resp: 'PO Vigilancia' },
          { id: 'E4.1.2', n: 'Designar responsable y aprobar el proceso', ini: '2027-02-01', fin: '2027-03-19', peso: 40, resp: 'Comité Directivo' }
        ] },
        { id: 'E4.2', peso: 25, tareas: [
          { id: 'E4.2.1', n: 'Radar T1 (desde la v3.0)', ini: '2027-01-11', fin: '2027-03-26', peso: 25, resp: 'PO Vigilancia' },
          { id: 'E4.2.2', n: 'Radar T2', ini: '2027-04-05', fin: '2027-06-25', peso: 25, resp: 'PO Vigilancia' },
          { id: 'E4.2.3', n: 'Radar T3', ini: '2027-07-05', fin: '2027-09-24', peso: 25, resp: 'PO Vigilancia' },
          { id: 'E4.2.4', n: 'Radar T4', ini: '2027-10-04', fin: '2027-12-10', peso: 25, resp: 'PO Vigilancia' }
        ] },
        { id: 'E4.3', peso: 35, tareas: [
          { id: 'E4.3.1', n: 'Diseño de los pilotos (drones, sensores de concreto)', ini: '2027-04-05', fin: '2027-05-14', peso: 25, resp: 'PO Vigilancia' },
          { id: 'E4.3.2', n: 'Ejecución de los pilotos', ini: '2027-05-17', fin: '2027-08-27', peso: 50, resp: 'Director de proyecto piloto' },
          { id: 'E4.3.3', n: 'Resultado medido de cada piloto', ini: '2027-08-30', fin: '2027-09-24', peso: 25, resp: 'PO Vigilancia' }
        ] },
        { id: 'E4.4', peso: 20, tareas: [
          { id: 'E4.4.1', n: 'Caso de negocio de la tecnología candidata', ini: '2027-10-04', fin: '2027-11-12', peso: 50, resp: 'PO Vigilancia' },
          { id: 'E4.4.2', n: 'Decisión del Comité y paso a operación', ini: '2027-11-15', fin: '2027-12-10', peso: 50, resp: 'Comité Directivo' }
        ] }
      ]
    }
  ]
};
