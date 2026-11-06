/* Datos del Project Charter Motor Tecnológico. Editar aquí; la página se dibuja a partir de este objeto. */
window.CHARTER = {
  "meta": {
    "revision": "Rev. 0",
    "fecha": "05-nov-2026",
    "estado": "Borrador para validación",
    "hoy": 0.016
  },
  "trimestres": ["Inicio · nov–dic 2026", "T1 · 2027", "T2 · 2027", "T3 · 2027", "T4 · 2027"],
  "general": {
    "ficha": [
      ["Patrocinador", "Gerencia General", "Por confirmar"],
      ["Director de la palanca", "Líder ID&TI", "Por confirmar"],
      ["Horizonte", "Enero a diciembre de 2027", "Visión 2028"],
      ["Metodología", "Híbrida PMI + Scrum", "Sprints de 2 semanas"],
      ["Área responsable", "Dirección de Innovación Digital & TI", ""],
      ["Marco", "Plan Estratégico Integrado 2026–2030", "Grupo HL"],
      ["Alcance geográfico", "Los cuatro países de operación", ""],
      ["Estado", "Borrador para validación", "Rev. 0 · 05-nov-2026"]
    ],
    "mision": "Convertir la tecnología en ventaja competitiva: registrar la operación una sola vez, decidir con datos confiables y usar la IA para liberar tiempo y proteger el conocimiento.",
    "vision": "Cada proyecto se administra y se decide sobre un dato único y confiable, y la tecnología es un argumento comercial ante clientes mineros y cementeros.",
    "objetivo": "Durante 2027, poner las herramientas, los datos y la IA al servicio de la gestión de los proyectos: que el costo del mes salga de los sistemas sin conciliaciones manuales, que las decisiones se tomen con datos gobernados y que la IA libere tiempo medible. Es la base para la visión 2028.",
    "fueraAlcance": [
      ["Renovación de hardware y software", "Inventario, obsolescencia y compra de equipos. Sigue en el plan de renovación de TI."],
      ["Operación de TI", "Outsourcing TIC, mantenimiento de HW y SW, conectividad y licencias recurrentes."],
      ["Ideas no priorizadas del portafolio de TI", "40 de las 86 ideas identificadas quedaron fuera de los 46 proyectos priorizados."],
      ["Cuarto de control completo", "Es la meta 2028. En 2027 solo entra la primera versión del tablero de control de obra."]
    ],
    "fases": [
      {"n": "Inicio", "d": 0, "h": 0, "w": "nov–dic 2026", "p": "Charter aprobado, patrocinador y Product Owners designados, presupuesto 2027 cerrado."},
      {"n": "Planificación", "d": 0, "h": 1, "w": "dic 2026–ene 2027", "p": "Línea base de hitos, costo e indicadores. Backlog inicial de épicas y matriz de riesgos."},
      {"n": "Ejecución y control", "d": 1, "h": 4, "w": "feb–nov 2027", "p": "Sprints, informe mensual de avance planeado contra real y control de cambios."},
      {"n": "Cierre", "d": 4, "h": 4, "w": "dic 2027", "p": "Valor medido contra metas, lecciones aprendidas y charter 2028."}
    ],
    "scrum": [
      {"n": "Backlog de épicas", "w": "Continuo", "p": "Cada iniciativa ordena sus épicas por valor. El Product Owner decide el orden."},
      {"n": "Planificación del sprint", "w": "Día 1", "p": "El equipo toma lo que puede terminar en 2 semanas."},
      {"n": "Sprint", "w": "2 semanas", "p": "Seguimiento corto 3 veces por semana para ver bloqueos."},
      {"n": "Revisión", "w": "Día 10", "p": "Se muestra el incremento a usuarios clave; se acepta o se devuelve."},
      {"n": "Retrospectiva", "w": "Día 10", "p": "Una mejora concreta para el siguiente sprint."}
    ],
    "puente": "Revisión trimestral con el Comité Directivo: se revisa el valor entregado, se repriorizan épicas y se aprueban los cambios a la línea base.",
    "ceremonias": [
      ["Planificación del sprint", "Cada 2 semanas", "Product Owner, facilitador y equipo", "Compromiso del sprint", "agil"],
      ["Seguimiento corto", "15 min, 3 veces por semana", "Equipo de entrega", "Bloqueos visibles y asignados", "agil"],
      ["Revisión del sprint", "Cada 2 semanas", "Product Owner y usuarios clave", "Incremento aceptado o devuelto", "agil"],
      ["Retrospectiva", "Cada 2 semanas", "Equipo de entrega", "Una mejora concreta", "agil"],
      ["Comité de la palanca", "Mensual", "Director y Product Owners de las 4 iniciativas", "Informe de avance, riesgos y solicitudes de cambio", "pmi"],
      ["Comité Directivo", "Trimestral", "Gerencia General y gerencias", "Repriorización y cambios a la línea base aprobados", "pmi"],
      ["Comité de IA", "Mensual", "12 integrantes, 7 de proyecto y obra", "Ideas de IA evaluadas por impacto y complejidad", "agil"]
    ],
    "roles": [
      ["Patrocinador", "Gerencia General", "pmi", "Aprueba el charter, el presupuesto y los cambios a la línea base. Asigna tiempo formal a los usuarios clave."],
      ["Director de la palanca", "Líder ID&TI", "pmi", "Es dueño del charter. Integra las cuatro iniciativas, controla avance, costo y riesgos y reporta al Comité Directivo."],
      ["Product Owner", "Uno por iniciativa, del negocio", "agil", "Ordena el backlog por valor, acepta o devuelve cada incremento y responde por el indicador de su iniciativa."],
      ["Facilitador Scrum", "ID&TI", "agil", "Cuida la cadencia de sprints, quita bloqueos y mantiene el tablero del equipo al día."],
      ["Equipo de entrega", "ID&TI, proveedores y consultoría", "agil", "4 personas internas de ID&TI, proveedor de Libra, subcontratista TIC y consultoría de transformación digital."],
      ["Líderes funcionales", "Uno por proceso, con suplente", "pmi", "Definen cómo se usa cada módulo en su área y forman a los usuarios. El suplente evita depender de una sola persona."]
    ],
    "dod": [
      "Está en producción, no en piloto.",
      "Los usuarios para los que se hizo lo están usando.",
      "Hay capacitación dictada y un manual o procedimiento.",
      "Su indicador tiene medición contra la línea base."
    ],
    "kpis": [
      {"n": "Costo de administrar los proyectos", "d": "Costo administrativo del proyecto / costo total del proyecto × 100 (fórmula por validar)", "b": "30–35 %", "m27": "Por definir", "m28": "En ruta al 20 %", "o": "pal"},
      {"n": "Iniciativas con valor medido", "d": "Iniciativas con su indicador medido contra la línea base", "b": "0 de 4", "m27": "4 de 4", "m28": "4 de 4", "o": "pro"},
      {"n": "Desviación del avance", "d": "% avance real − % avance planeado del charter (curva S mensual)", "b": "—", "m27": "≤ 10 %", "m28": "—", "o": "c25"},
      {"n": "Cumplimiento del sprint", "d": "Historias terminadas / historias comprometidas", "b": "—", "m27": "≥ 80 %", "m28": "—", "o": "pro"}
    ],
    "riesgos": [
      {"id": "R1", "n": "Financiación 2027 sin cierre formal", "c": "El presupuesto 2027 no está aprobado desde el portafolio. Las iniciativas podrían arrancar sin financiación asegurada.", "m": "Cerrar el presupuesto por iniciativa en la fase de Inicio. Cada épica entra con su beneficio en pesos.", "p": 3, "i": 3},
      {"id": "R2", "n": "Capacidad para ejecutar", "c": "4 personas internas para 15 iniciativas a la vez. Libra ya ocupa 36 de 43 semanas de desarrollo y el proveedor externo cuesta 4 veces más por hora.", "m": "Limitar el trabajo en curso por sprint, priorizar por valor cada trimestre y acordar desde el inicio la capacidad externa.", "p": 3, "i": 3},
      {"id": "R3", "n": "Herramientas implementadas que no se usan", "c": "Solo se usa el 33–42 % de lo contratado en Procore y los usuarios clave no tienen tiempo asignado.", "m": "La definición de terminado exige uso real. Tiempo formal para usuarios clave y un líder con suplente por módulo.", "p": 2, "i": 3},
      {"id": "R4", "n": "Valor sin medir", "c": "Ninguna iniciativa tiene hoy valor medido; la IA no tiene línea base de tiempo.", "m": "Línea base de todos los indicadores en el T1 de 2027 y revisión en cada comité trimestral.", "p": 3, "i": 2},
      {"id": "R5", "n": "Ciberataque", "c": "Libra no exige doble autenticación, ningún sistema tiene monitoreo de amenazas y la seguridad de M365 está en 48 de 100.", "m": "Épica E2.3 de ciberseguridad básica en el primer semestre.", "p": 2, "i": 3},
      {"id": "R6", "n": "Decisiones pendientes que frenan", "c": "Faltan los líderes de los módulos críticos de Procore y la metodología de conciliación de Perú.", "m": "Agenda de decisiones con fecha límite en el comité mensual de la palanca.", "p": 2, "i": 2}
    ],
    "supuestos": [
      "La Gerencia General respalda la palanca de forma visible y asigna tiempo formal a los usuarios clave.",
      "El presupuesto 2027 se aprueba antes de terminar enero de 2027.",
      "Libra, OPUS y Procore pueden integrarse sin cambios estructurales (supuesto del charter 2025 que sigue vigente).",
      "El proveedor de Libra mantiene la capacidad contratada durante 2027.",
      "La consultoría de transformación digital sigue la hoja de ruta a 24 meses que arrancó en octubre de 2026."
    ],
    "restricciones": [
      "Crecer sin crecer de forma sustancial la estructura corporativa.",
      "Equipo interno de ID&TI de 4 personas.",
      "Capacidad de desarrollo de Libra: 43 semanas al año, 36 ya comprometidas.",
      "La ejecución se cierra en el año calendario 2027."
    ],
    "exito": [
      "Las herramientas se usan, no solo se implementan.",
      "Cada iniciativa termina 2027 con valor medido contra su línea base.",
      "El costo del mes sale de los sistemas sin conciliaciones manuales.",
      "La Gerencia decide con datos gobernados y TI tiene un espacio fijo en cada Comité Directivo."
    ],
    "ppto2025": [
      ["Potenciación de herramientas de software", 89398502, true],
      ["Implementación de IA", 13284000, true],
      ["Outsourcing TIC", 135369688, false],
      ["Mantenimiento de HW y SW", 148550000, false],
      ["Plan de renovación de HW y SW", 166644000, false]
    ],
    "ppto2027": [
      ["core", "Horas del proveedor de Libra, desarrollo en Procore y OPUS, licencias de Zoho CRM, formación"],
      ["datos", "Consultoría de transformación digital, herramientas de integración y de seguridad"],
      ["ia", "Licencias de Copilot, consumo de agentes, formación de Champions"],
      ["vigilancia", "Pilotos de tecnología y su medición"]
    ],
    "pendientes": [
      ["Nombres del gobierno", "Patrocinador, director de la palanca y Product Owner de cada iniciativa."],
      ["Presupuesto 2027", "Monto por iniciativa, aprobado desde el portafolio."],
      ["Metas intermedias 2027", "Los indicadores marcados «Por definir»."],
      ["Iniciativa 1 ampliada", "Confirmar que OPUS, Zoho CRM y M365 entran en «Potenciar las herramientas core»."],
      ["Vigilancia Tecnológica", "Confirmar que pasa de propuesta a iniciativa con responsable propio."],
      ["Fórmula del costo de administrar", "Qué entra en el costo administrativo y de dónde sale el dato."],
      ["Fechas de hitos y valoración de riesgos", "Las de este borrador son preliminares."]
    ]
  },
  "iniciativas": [
    {
      "id": "core", "num": "01", "nombre": "Potenciar las herramientas core", "corto": "Herramientas core",
      "tesis": "Que Libra sea donde se decide, Procore donde se gestiona la obra, y que OPUS, Zoho CRM y M365 completen el ciclo del proyecto.",
      "herramientas": ["Libra · ERP y costos", "Procore · obra", "OPUS · presupuestos", "Zoho CRM · comercial", "M365 · colaboración"],
      "estado": "Plan definido; ejecución iniciando",
      "balance": [2, 2, 1, 0],
      "mision": "Ser la fuente única y confiable del costo, la administración y la ejecución de cada proyecto: todo se registra una vez, en el sistema y donde ocurre el trabajo.",
      "vision": "Todo proyecto, en cualquier país, se administra y se cierra en Libra integrado con Procore, y la gerencia decide con el costo del mes sin conciliaciones manuales.",
      "visionAno": "2028",
      "objetivo": "A diciembre de 2027, todo proyecto nuevo de los cuatro países abre con el estándar único en Libra y Procore, los 14 usuarios clave de Libra están formados desde junio y el costo del mes sale de Libra sin nivelar en Excel.",
      "ficha": [
        ["Patrocinador", "Gerencia General", "pmi"],
        ["Product Owner", "Por designar: dueño del proceso de costos y control de proyectos", "agil"],
        ["Facilitador", "ID&TI", "agil"],
        ["Equipo", "ID&TI, proveedor de Libra, subcontratista TIC y líderes funcionales con suplente", "agil"],
        ["Interesados", "Gerencias de proyecto, Contabilidad, Compras, Estimaciones (OPUS) y Comercial (Zoho CRM)", "pmi"],
        ["Depende de", "Integraciones de Data Driven (E2.2) para el costo del mes", "pmi"]
      ],
      "base": [
        {"v": "33–42 %", "t": "de lo contratado en Procore se usa", "s": "En uso desde 2018"},
        {"v": "0", "tono": "crit", "t": "planes de acción salen de 14.900 inspecciones", "s": "Los hallazgos de obra no se cierran en el sistema"},
        {"v": "3 de 14", "t": "usuarios clave de Libra formados", "s": "Meta: los 14 a junio de 2027"},
        {"v": "−52 %", "tono": "ok", "t": "incidencias en Libra", "s": "De 87 a 42, febrero a agosto de 2026"}
      ],
      "incluye": [
        "Libra: estándar de proyecto, formación de usuarios clave, cierre del costo mensual y arranque de Perú.",
        "Procore: módulos críticos con líder, e inspecciones y observaciones que terminan en un plan de acción.",
        "OPUS: catálogos por país y plantilla de costo industrial (pendientes de la fase 2 de 2025).",
        "Zoho CRM: registro de oportunidades y traspaso al arranque del proyecto.",
        "M365: repositorio documental estándar y uso de Teams y SharePoint."
      ],
      "excluye": [
        "Copilot y agentes de IA (iniciativa 3).",
        "Seguridad de M365 e integraciones entre sistemas (iniciativa 2).",
        "Licencias o módulos nuevos sin un caso de negocio aprobado."
      ],
      "epicas": [
        {"id": "E1.1", "n": "Estándar único de proyecto", "d": 1, "h": 2, "e": "Configuración de apertura en Libra y Procore, replicable en los cuatro países.", "p": 1, "hito": "Estándar aprobado"},
        {"id": "E1.2", "n": "Usuarios clave de Libra formados", "d": 1, "h": 2, "e": "Los 14 usuarios clave formados, con tiempo asignado.", "p": 1, "hito": "14 de 14"},
        {"id": "E1.3", "n": "Procore: líderes de módulo e inspecciones que cierran", "d": 1, "h": 3, "e": "Líder y suplente por módulo crítico; hallazgos con plan de acción en el sistema.", "p": 1},
        {"id": "E1.4", "n": "Costo del mes desde Libra", "d": 2, "h": 4, "e": "Cierre mensual integrado con Procore, sin nivelación en Excel.", "p": 1, "hito": "Cierre sin Excel"},
        {"id": "E1.5", "n": "Perú en Libra", "d": 1, "h": 2, "e": "Metodología de conciliación contabilidad–proyectos definida y en operación.", "p": 1},
        {"id": "E1.6", "n": "OPUS: catálogos y costo industrial", "d": 1, "h": 3, "e": "Catálogos de República Dominicana y Perú; plantilla de indirectos en OPUS.", "p": 2},
        {"id": "E1.7", "n": "Zoho CRM: embudo comercial único", "d": 2, "h": 3, "e": "Oportunidades registradas en Zoho y traspaso al arranque del proyecto.", "p": 2},
        {"id": "E1.8", "n": "M365: repositorio documental", "d": 1, "h": 4, "e": "Estructura estándar en SharePoint y Teams, con usuarios formados.", "p": 2}
      ],
      "kpis": [
        {"n": "Aprovechamiento de las herramientas core", "d": "Funcionalidades contratadas en uso / contratadas", "b": "33–42 %", "m27": "Por definir", "m28": "100 %", "o": "pal"},
        {"n": "Usuarios clave de Libra formados", "d": "Formados / 14 usuarios clave × 100", "b": "3 de 14", "m27": "14 de 14 (jun)", "m28": "—", "o": "pal"},
        {"n": "Proyectos con costo del mes sin Excel", "d": "Proyectos cerrados en Libra sin nivelación manual / proyectos activos", "b": "Parcial", "m27": "Todos", "m28": "Todos", "o": "pal"},
        {"n": "Inspecciones con plan de acción", "d": "Hallazgos con plan de acción en Procore / hallazgos registrados", "b": "0 de 252", "m27": "Por definir", "m28": "Por definir", "o": "pal"},
        {"n": "Reducción de incidencias en Libra", "d": "(Incidencias antes − después) / antes × 100", "b": "−52 %", "m27": "Por definir", "m28": "—", "o": "c25"}
      ],
      "riesgos": [
        ["Capacidad de desarrollo justa", "El plan de Libra ocupa 36 de 43 semanas disponibles; el proveedor externo cuesta 4 veces más por hora.", "Priorizar épicas por valor en cada revisión trimestral y reservar capacidad para el costo del mes."],
        ["Arranque de Perú", "Su contabilidad está fuera de Libra y falta la metodología de conciliación entre contabilidad y proyectos.", "Decidir la metodología en el T1 de 2027 (épica E1.5)."],
        ["Decisiones pendientes que frenan", "Faltan líderes de los módulos críticos de Procore; hay desconocimiento y bajo uso de M365 y del repositorio documental.", "Agenda de decisiones con fecha en el comité mensual y un líder con suplente por módulo."]
      ],
      "exito": [
        ["Un estándar único", "Todo proyecto abre con la misma configuración, replicable en los cuatro países."],
        ["Un dueño por proceso", "Líder funcional con suplente en cada módulo, para no depender de personas."],
        ["Respaldo visible de la Gerencia", "Con tiempo formalmente asignado a los usuarios clave."]
      ]
    },
    {
      "id": "datos", "num": "02", "nombre": "Organización Data Driven", "corto": "Data Driven",
      "tesis": "Pasar de un área de soporte a un socio que anticipa con datos.",
      "herramientas": ["Transformación digital con consultoría externa", "Libra · OPUS · Procore"],
      "estado": "Consultoría cerrada; ejecución desde octubre",
      "balance": [2, 2, 1, 0],
      "mision": "Garantizar la continuidad y la seguridad digital de la compañía, y convertir el dato de sus sistemas en decisiones estratégicas.",
      "vision": "ID&TI es socio estratégico del negocio: el dato de Libra, OPUS y Procore está gobernado en un cuarto de control que anticipa desviaciones de costo y cronograma.",
      "visionAno": "2028",
      "objetivo": "En 2027, catalogar y asignar dueño a los datos críticos, automatizar y monitorear las integraciones prioritarias entre Libra, OPUS y Procore, y cerrar las brechas de seguridad más expuestas.",
      "ficha": [
        ["Patrocinador", "Gerencia General", "pmi"],
        ["Product Owner", "Por designar", "agil"],
        ["Facilitador", "ID&TI", "agil"],
        ["Equipo", "ID&TI y consultoría de transformación digital", "agil"],
        ["Interesados", "Comité Directivo, gerentes de proyecto y dueños de datos", "pmi"],
        ["Depende de", "Estándar de proyecto de la iniciativa 1 (E1.1) y presupuesto 2027", "pmi"]
      ],
      "base": [
        {"v": "1 de 5", "t": "es el aporte de TI que percibe la Gerencia", "s": "Meta: 4 de 5 en 2028"},
        {"v": "46", "t": "proyectos priorizados con reglas claras", "s": "De 86 ideas identificadas"},
        {"v": "10 de 10", "tono": "crit", "t": "conexiones entre sistemas son manuales", "s": "Libra, OPUS y Procore se cruzan en Excel"},
        {"v": "48/100", "tono": "crit", "t": "seguridad de Microsoft 365", "s": "Libra sin doble autenticación"}
      ],
      "incluye": [
        "Gobierno y catálogo de los datos críticos, con dueño.",
        "Integraciones entre Libra, OPUS y Procore, automatizadas y monitoreadas.",
        "Ciberseguridad básica: doble autenticación, monitoreo de amenazas y seguridad de M365.",
        "Portafolio de proyectos de TI con presupuesto y beneficio en pesos.",
        "Primera versión del tablero de control de obra."
      ],
      "excluye": [
        "Cuarto de control completo (meta 2028).",
        "Operación de infraestructura y mesa de ayuda."
      ],
      "epicas": [
        {"id": "E2.1", "n": "Gobierno de datos: catálogo y dueños", "d": 1, "h": 3, "e": "Datos críticos catalogados y con dueño (hoy 39 indicadores sin dueño y 11 repositorios sin catálogo).", "p": 1},
        {"id": "E2.2", "n": "Integraciones Libra–OPUS–Procore", "d": 2, "h": 4, "e": "Integraciones prioritarias automatizadas, monitoreadas y con acuerdo de servicio.", "p": 1, "hito": "Primeras integraciones"},
        {"id": "E2.3", "n": "Ciberseguridad básica", "d": 1, "h": 2, "e": "Doble autenticación en Libra, monitoreo de amenazas y plan para subir la seguridad de M365.", "p": 1},
        {"id": "E2.4", "n": "Portafolio de TI con beneficio medido", "d": 0, "h": 1, "e": "Los 46 proyectos con presupuesto y beneficio en pesos, aprobados desde el portafolio.", "p": 1, "hito": "Presupuesto 2027"},
        {"id": "E2.5", "n": "Tablero de control de obra", "d": 3, "h": 4, "e": "Tablero piloto de costo y plazo en un proyecto.", "p": 2, "hito": "Piloto"},
        {"id": "E2.6", "n": "Capacidad de ID&TI", "d": 1, "h": 2, "e": "Modelo operativo con 3 a 5 iniciativas simultáneas por persona y apoyo externo definido.", "p": 2}
      ],
      "kpis": [
        {"n": "Integraciones automatizadas y monitoreadas", "d": "Integraciones automáticas con monitoreo y SLA / 10", "b": "0 de 10", "m27": "Por definir", "m28": "10 de 10 (oct)", "o": "pal"},
        {"n": "Datos críticos catalogados y con dueño", "d": "Datos críticos catalogados con dueño / datos críticos", "b": "0 %", "m27": "Por definir", "m28": "100 %", "o": "pal"},
        {"n": "Aporte de TI percibido por la Gerencia", "d": "Encuesta a la Gerencia, escala 1 a 5", "b": "1 de 5", "m27": "Por definir", "m28": "4 de 5", "o": "pal"},
        {"n": "Seguridad de Microsoft 365", "d": "Puntaje de seguridad de M365 (Secure Score)", "b": "48 de 100", "m27": "Por definir", "m28": "—", "o": "pal"},
        {"n": "Madurez tecnológica promedio", "d": "Evaluación de madurez de la consultoría, escala 1 a 5", "b": "2,1 de 5", "m27": "Por definir", "m28": "—", "o": "pal"}
      ],
      "riesgos": [
        ["Presupuesto 2027 sin cierre formal", "Sin definir y aprobar recursos desde el portafolio, las iniciativas podrían iniciar sin financiación asegurada.", "Cerrar el presupuesto desde el portafolio en la fase de Inicio (épica E2.4)."],
        ["Exposición a ciberataques", "Libra no exige doble autenticación y ningún sistema tiene monitoreo de amenazas. La seguridad de M365 está en 48 de 100.", "Épica E2.3 en el primer semestre de 2027."],
        ["Equipo al límite", "4 personas internas para 15 iniciativas a la vez; lo sano son 3 a 5.", "Limitar el trabajo en curso por sprint y definir el apoyo externo (épica E2.6)."]
      ],
      "exito": [
        ["Patrocinio de la Gerencia General", "TI con un espacio fijo en cada Comité Directivo."],
        ["Presupuesto desde el portafolio", "Cada iniciativa entra con su beneficio en pesos y sale medida."],
        ["Resultados que el negocio use", "Primero la gestión y captura de los datos, luego el tablero de control de obra."]
      ]
    },
    {
      "id": "ia", "num": "03", "nombre": "IA para reducir el costo de administrar", "corto": "IA",
      "tesis": "Que la IA optimice costos y guarde lo que la compañía aprende.",
      "herramientas": ["Adopción y plan de IA", "Copilot · M365"],
      "estado": "2 asistentes en uso; falta medir el ahorro",
      "balance": [2, 2, 1, 0],
      "mision": "Incorporar inteligencia artificial para liberar tiempo, proteger el conocimiento y mejorar las decisiones en obra y oficina, con control de costo, dato y riesgo.",
      "vision": "Consolidar una operación inteligente: cualquier profesional, en cualquier país, gestiona y ejecuta con agilidad, apoyado en lo que la compañía ha aprendido.",
      "visionAno": "2031",
      "objetivo": "En 2027, medir las horas liberadas por cada iniciativa de IA en producción, subir el uso diario del 15 % al 35 % y controlar el costo de los agentes.",
      "ficha": [
        ["Patrocinador", "Gerencia General", "pmi"],
        ["Product Owner", "Por designar, dentro del Comité de IA", "agil"],
        ["Facilitador", "Núcleo de IA (3 personas)", "agil"],
        ["Equipo", "Comité de IA (12 integrantes, 7 de proyecto y obra) y red de Champions", "agil"],
        ["Interesados", "Todas las áreas; 146 usuarios activos de Copilot", "pmi"],
        ["Depende de", "Datos gobernados (E2.1) para la memoria organizacional y seguridad de M365 (E2.3)", "pmi"]
      ],
      "base": [
        {"v": "146", "t": "usuarios activos de Copilot", "s": "+106 % en tres meses"},
        {"v": "15 %", "t": "la usa a diario", "s": "23 de 150 · meta: 35 % en 12 meses"},
        {"v": "2", "t": "asistentes de IA en producción", "s": "Analizador de informes de Procore y asistente del Sistema de Gestión"},
        {"v": "4 de 6", "tono": "crit", "t": "iniciativas siguen en prueba o desarrollo", "s": "Formación: 18 de 24 sesiones"}
      ],
      "incluye": [
        "Línea base y medición de horas liberadas.",
        "Registro, responsable y control de costo de los agentes.",
        "Adopción diaria de Copilot y formación por rol.",
        "Paso a producción de los pilotos priorizados.",
        "Memoria organizacional consultable con IA."
      ],
      "excluye": [
        "Ideas que no pasan por el Comité de IA.",
        "Modelos propios entrenados desde cero."
      ],
      "epicas": [
        {"id": "E3.1", "n": "Línea base de horas liberadas", "d": 1, "h": 1, "e": "Horas por mes medidas en los 2 asistentes en producción y meta fijada.", "p": 1, "hito": "Línea base"},
        {"id": "E3.2", "n": "Control de costo de agentes", "d": 1, "h": 2, "e": "Registro de agentes con responsable y tope de consumo.", "p": 1},
        {"id": "E3.3", "n": "Uso diario: del 15 % al 35 %", "d": 1, "h": 4, "e": "Red de Champions activa y formación completa (24 de 24 sesiones).", "p": 1, "hito": "35 %"},
        {"id": "E3.4", "n": "Pilotos a producción", "d": 2, "h": 4, "e": "Pilotos priorizados en producción con ahorro medido, o cerrados.", "p": 2},
        {"id": "E3.5", "n": "Memoria organizacional", "d": 2, "h": 4, "e": "Lecciones aprendidas consultables con IA desde cualquier país.", "p": 2},
        {"id": "E3.6", "n": "Un resultado visible por trimestre", "d": 1, "h": 4, "e": "Comunicado trimestral con el nombre del área que lo usa.", "p": 2}
      ],
      "kpis": [
        {"n": "Horas liberadas por iniciativa de IA", "d": "Horas por mes ahorradas frente a la línea base de tiempo", "b": "Sin medir", "m27": "Meta fijada en T1", "m28": "Por definir", "o": "pal"},
        {"n": "Uso diario de IA", "d": "Usuarios diarios / usuarios con licencia × 100", "b": "15 %", "m27": "35 %", "m28": "—", "o": "pal"},
        {"n": "Iniciativas de IA en producción", "d": "Iniciativas en producción / iniciativas priorizadas", "b": "2 de 6", "m27": "Por definir", "m28": "—", "o": "pal"},
        {"n": "Procesos optimizados con IA", "d": "Conteo de procesos mejorados con IA", "b": "2", "m27": "Por definir", "m28": "—", "o": "c25"}
      ],
      "riesgos": [
        ["Costo sin control", "Agentes creados sin registro ni responsable consumen todos los días.", "Registro obligatorio de agentes con responsable y tope de consumo (épica E3.2)."],
        ["Uso amplio pero superficial", "146 usuarios activos, pero solo 23 la usan a diario.", "Champions por área y casos de uso por rol."],
        ["Pilotos que no llegan a producción", "4 de las 6 iniciativas siguen en prueba o desarrollo.", "Cada piloto tiene un trimestre para pasar a producción o cerrarse."]
      ],
      "exito": [
        ["Reglas claras para priorizar", "Toda idea entra por el Comité de IA y se evalúa por impacto y complejidad."],
        ["Núcleo pequeño, ejecución amplia", "Tres personas gobiernan; el Comité y la red de Champions ejecutan."],
        ["Un resultado visible por trimestre", "Comunicado con el nombre del área que lo usa."]
      ]
    },
    {
      "id": "vigilancia", "num": "04", "nombre": "Vigilancia Tecnológica", "corto": "Vigilancia",
      "tesis": "Buscar la tecnología emergente que mejora nuestros procesos, antes de que sea obligatoria.",
      "herramientas": ["Radar de Transformación Digital v3.0"],
      "propuesta": true,
      "estado": "Piloto en marcha; proceso por formalizar",
      "balance": [2, 1, 1, 0],
      "mision": "Identificar, evaluar y probar tecnologías emergentes que mejoren los procesos de obra y oficina, con evidencia y no por tendencia.",
      "vision": "Cada año, Grupo HL cuenta con un portafolio de tecnologías evaluadas y probadas en piloto, conectadas con problemas reales de sus procesos.",
      "visionAno": "Anual",
      "objetivo": "En 2027, formalizar la vigilancia como proceso con responsable, actualizar el radar cada trimestre y llevar al menos una tecnología de piloto a operación.",
      "ficha": [
        ["Patrocinador", "Gerencia General", "pmi"],
        ["Product Owner", "Por designar", "agil"],
        ["Facilitador", "ID&TI", "agil"],
        ["Equipo", "Responsable de vigilancia (por designar) y las áreas de obra que prueban", "agil"],
        ["Interesados", "Operaciones, HSE, Estimaciones y clientes mineros y cementeros", "pmi"],
        ["Depende de", "Portafolio de TI (E2.4) para financiar pilotos e integraciones (E2.2)", "pmi"]
      ],
      "base": [
        {"v": "34", "t": "tecnologías evaluadas en el Radar v3.0", "s": "4 adoptar, 10 considerar, 13 explorar, 7 fuera de alcance"},
        {"v": "Piloto", "t": "dentro del portafolio del Gobierno de TI", "s": "Sin responsable ni proceso propio"},
        {"v": "0", "tono": "crit", "t": "tecnologías adoptadas", "s": "Meta: mínimo 1 por año"},
        {"v": "11", "t": "tecnologías mejor puntuadas", "s": "Drones, GNSS, LiDAR, sensores de concreto, BIM 5D…"}
      ],
      "incluye": [
        "Proceso, criterios de evaluación y responsable de la vigilancia.",
        "Radar actualizado cada trimestre.",
        "Pilotos con resultado medido.",
        "Recomendación de adopción al Comité Directivo."
      ],
      "excluye": [
        "Compra a escala de tecnologías no probadas en piloto.",
        "Tecnologías marcadas fuera de alcance en el radar (7 en la v3.0)."
      ],
      "epicas": [
        {"id": "E4.1", "n": "Proceso formal y responsable", "d": 0, "h": 1, "e": "Procedimiento, responsable y criterios de evaluación aprobados.", "p": 1, "hito": "Proceso aprobado"},
        {"id": "E4.2", "n": "Radar trimestral", "d": 1, "h": 4, "e": "Radar actualizado cada trimestre, partiendo de la v3.0.", "p": 1},
        {"id": "E4.3", "n": "Pilotos del anillo Adoptar", "d": 2, "h": 3, "e": "Pilotos con resultado medido, por ejemplo escaneo con drones y sensores de concreto.", "p": 1},
        {"id": "E4.4", "n": "Decisión de adopción", "d": 4, "h": 4, "e": "Al menos una tecnología pasa de piloto a operación.", "p": 1, "hito": "≥ 1 adoptada"}
      ],
      "kpis": [
        {"n": "Tecnologías adoptadas por año", "d": "Tecnologías del radar que pasan de piloto a operación", "b": "0", "m27": "≥ 1", "m28": "≥ 1", "o": "pal"},
        {"n": "Tecnologías evaluadas por trimestre", "d": "Tecnologías nuevas o reevaluadas en el radar", "b": "34 (v3.0)", "m27": "Por definir", "m28": "Por definir", "o": "pal"},
        {"n": "Pilotos con resultado medido", "d": "Pilotos cerrados con métrica de éxito medida", "b": "0", "m27": "Por definir", "m28": "Por definir", "o": "pal"}
      ],
      "riesgos": [
        ["Pilotos que nunca escalan", "Menos del 30 % de los pilotos llega a escalar (Microsoft; McKinsey).", "Cada piloto empieza con un problema costoso y una métrica de éxito acordada."],
        ["Tecnología que no se integra", "El 38 % de las empresas con IoT dice que la complejidad técnica frena su expansión (Microsoft).", "Revisar la integración con Data Driven antes de aprobar el piloto."],
        ["Más puntos de entrada para ciberataques", "En construcción, un incidente deja en promedio 24 días de interrupción (QBE, 2026).", "Evaluación de seguridad como criterio de entrada al radar."]
      ],
      "exito": [
        ["Vigilancia sistemática, no ocasional", "Las empresas que vigilan el futuro de forma estructurada fueron un 33 % más rentables."],
        ["Empezar por el problema más costoso", "Los grandes proyectos superan su costo o plazo entre un 30 % y un 45 % (McKinsey)."],
        ["Invertir en personas tanto como en tecnología", "Un dólar en gestión del cambio por cada dólar en tecnología (McKinsey)."]
      ]
    }
  ]
};
