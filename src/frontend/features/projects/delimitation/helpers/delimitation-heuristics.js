const FIELD_LABELS = {
  topic: "tema",
  context_place: "contexto espacial",
  time_period: "periodo",
  population: "población",
  resources: "recursos",
};

const TOPIC_PATTERNS = [
  {
    regex: /\bimpacto\b/gi,
    tooltip:
      '“Impacto” es muy amplio. Conviene precisar qué efecto o cambio vas a observar.',
  },
  {
    regex: /\ban[aá]lisis\b/gi,
    tooltip:
      '“Análisis” no delimita por sí solo el enfoque. Aclara qué dimensión analizarás.',
  },
  {
    regex: /\bestudio\b/gi,
    tooltip:
      '“Estudio” es una palabra muy general. Conviene especificar el fenómeno exacto.',
  },
  {
    regex: /\bproblem[aá]tica\b/gi,
    tooltip:
      '“Problemática” sigue siendo amplia. Conviene acotar qué problema específico investigarás.',
  },
  {
    regex: /\bsituaci[oó]n\b/gi,
    tooltip:
      '“Situación” es un término abierto. Precisa qué aspecto concreto quieres observar.',
  },
  {
    regex: /\bdesarrollo\b/gi,
    tooltip:
      '“Desarrollo” es muy amplio. Conviene definir qué tipo de desarrollo te interesa.',
  },
  {
    regex: /\bmejora\b/gi,
    tooltip:
      '“Mejora” necesita un criterio claro. Indica qué cambiaría y cómo lo notarías.',
  },
  {
    regex: /\btecnolog[ií]a\b/gi,
    tooltip:
      '“Tecnología” es muy general. Precisa cuál tecnología o uso concreto te interesa.',
  },
  {
    regex: /\beducaci[oó]n\b/gi,
    tooltip:
      '“Educación” puede abarcar demasiado. Conviene indicar nivel, área o contexto específico.',
  },
  {
    regex: /\bsalud\b/gi,
    tooltip:
      '“Salud” es un campo muy amplio. Conviene acotar problema, población o servicio.',
  },
  {
    regex: /\bmedio ambiente\b/gi,
    tooltip:
      '“Medio ambiente” sigue siendo muy amplio. Define qué variable ambiental observarás.',
  },
  {
    regex: /\betc\.?\b/gi,
    tooltip:
      '“Etc.” deja el alcance abierto. Conviene cerrar la idea con elementos concretos.',
  },
  {
    regex: /\bdivers[oa]s?\b/gi,
    tooltip:
      '“Diversos” abre demasiado el alcance. Conviene listar o acotar esos elementos.',
  },
  {
    regex: /\bvari[oa]s?\b/gi,
    tooltip:
      '“Varios” deja el campo abierto. Conviene indicar exactamente cuáles.',
  },
  {
    regex: /\bgeneral\b/gi,
    tooltip:
      '“General” sugiere poco foco. Conviene pasar de lo general a lo específico.',
  },
  {
    regex: /\balgo\b/gi,
    tooltip:
      '“Algo” es demasiado indeterminado. Conviene especificar exactamente qué efecto, relación o cambio te interesa.',
  },
  {
    regex: /\bcosas\b/gi,
    tooltip:
      '“Cosas” es demasiado vago. Conviene sustituirlo por una variable o fenómeno concreto.',
  },
];

const LOCATION_PATTERNS = [
  {
    regex: /\bcentroam[eé]rica\b/gi,
    tooltip:
      '“Centroamérica” es un alcance regional muy amplio. Conviene precisar un país o territorio.',
  },
  {
    regex: /\blatinoam[eé]rica\b|\bam[eé]rica latina\b/gi,
    tooltip:
      '“Latinoamérica” es un alcance espacial muy amplio. Conviene delimitar mejor el lugar.',
  },
  {
    regex: /\bregi[oó]n\b/gi,
    tooltip:
      '“Región” sigue siendo vaga si no indicas cuál. Conviene precisar el territorio.',
  },
  {
    regex: /\bmunicipio\b/gi,
    tooltip:
      '“Municipio” es insuficiente si no dices cuál. Conviene nombrarlo.',
  },
  {
    regex: /\bcomunidad\b/gi,
    tooltip:
      '“Comunidad” es vaga si no indicas cuál. Conviene precisar el lugar exacto.',
  },
  {
    regex: /\bzona rural\b/gi,
    tooltip:
      '“Zona rural” sigue siendo amplia. Conviene acotar a una comunidad o municipio.',
  },
  {
    regex: /\b[aá]rea urbana\b|\bzona urbana\b/gi,
    tooltip:
      '“Zona urbana” sigue siendo amplia. Conviene indicar ciudad, barrio o institución.',
  },
];

const TIME_PATTERNS = [
  {
    regex: /\bactualidad\b/gi,
    tooltip:
      '“Actualidad” no define fechas concretas. Conviene indicar un rango temporal preciso.',
  },
  {
    regex: /\brecientemente\b/gi,
    tooltip:
      '“Recientemente” es ambiguo. Conviene convertirlo en fechas o años.',
  },
  {
    regex: /\bhoy en d[ií]a\b/gi,
    tooltip:
      '“Hoy en día” no delimita bien el periodo. Conviene indicar fechas concretas.',
  },
  {
    regex: /\b[aúu]ltimos? a[nñ]os\b/gi,
    tooltip:
      '“Últimos años” sigue siendo ambiguo. Conviene especificar cuáles años.',
  },
  {
    regex: /\bdesde hace tiempo\b/gi,
    tooltip:
      '“Desde hace tiempo” no define un rango claro. Conviene precisar fechas.',
  },
  {
    regex: /\bactualmente\b/gi,
    tooltip:
      '“Actualmente” sigue siendo abierto. Conviene indicar el periodo exacto.',
  },
];

const POPULATION_PATTERNS = [
  {
    regex: /\bjóvenes\b/gi,
    tooltip:
      '“Jóvenes” necesita más precisión. Conviene indicar edad, contexto o institución.',
  },
  {
    regex: /\bniñ[oa]s?\b/gi,
    tooltip:
      '“Niños” sigue siendo general. Conviene precisar edad, grado o contexto.',
  },
  {
    regex: /\badult[oa]s?\b/gi,
    tooltip:
      '“Adultos” es una categoría amplia. Conviene precisar rango etario o condición.',
  },
  {
    regex: /\bmujeres\b/gi,
    tooltip:
      '“Mujeres” puede ser muy amplio si no defines edad, lugar o condición.',
  },
  {
    regex: /\bhombres\b/gi,
    tooltip:
      '“Hombres” puede ser muy amplio si no defines edad, lugar o condición.',
  },
  {
    regex: /\bpersonas\b/gi,
    tooltip:
      '“Personas” es demasiado general. Conviene especificar quiénes exactamente.',
  },
  {
    regex: /\bestudiantes\b/gi,
    tooltip:
      '“Estudiantes” necesita más precisión. Conviene indicar nivel, institución o sede.',
  },
  {
    regex: /\bpacientes\b/gi,
    tooltip:
      '“Pacientes” sigue siendo amplio. Conviene precisar diagnóstico, servicio o rango de edad.',
  },
  {
    regex: /\btrabajadores\b/gi,
    tooltip:
      '“Trabajadores” es una categoría amplia. Conviene precisar sector, cargo o lugar.',
  },
  {
    regex: /\bdocentes\b/gi,
    tooltip:
      '“Docentes” puede ser amplio. Conviene indicar nivel educativo, institución o zona.',
  },
];

const RESOURCE_PATTERNS = [
  {
    regex: /\binternet\b/gi,
    tooltip:
      '“Internet” es una fuente demasiado general. Conviene decir qué bases, sitios o repositorios usarás.',
  },
  {
    regex: /\bart[ií]culos\b/gi,
    tooltip:
      '“Artículos” es genérico. Conviene indicar tipo de base o fuentes concretas.',
  },
  {
    regex: /\bencuestas\b/gi,
    tooltip:
      '“Encuestas” necesita más detalle. Conviene indicar a quiénes, cómo y con qué acceso.',
  },
  {
    regex: /\bentrevistas\b/gi,
    tooltip:
      '“Entrevistas” necesita más precisión. Conviene indicar con quiénes y si tendrás acceso.',
  },
  {
    regex: /\bdatos\b/gi,
    tooltip:
      '“Datos” es demasiado general. Conviene indicar qué datos concretos y de dónde saldrán.',
  },
  {
    regex: /\bestad[ií]sticas\b/gi,
    tooltip:
      '“Estadísticas” es una fuente amplia. Conviene indicar institución o base específica.',
  },
  {
    regex: /\blibros\b/gi,
    tooltip:
      '“Libros” es muy general. Conviene indicar qué tipo de bibliografía o colección usarás.',
  },
];

function normalizeLoose(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactWords(text) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function uniqueByRange(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.field}:${item.start}:${item.end}:${item.tooltip}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortAndClipOverlaps(items) {
  const sortedBySpecificity = [...items].sort((a, b) => {
    const aLength = a.end - a.start;
    const bLength = b.end - b.start;

    if (aLength !== bLength) return aLength - bLength;
    return a.start - b.start;
  });

  const selected = [];

  for (const item of sortedBySpecificity) {
    const overlapsExisting = selected.some(
      (existing) => item.start < existing.end && item.end > existing.start
    );

    if (!overlapsExisting) {
      selected.push(item);
    }
  }

  return selected.sort((a, b) => a.start - b.start);
}

function getHighlightGuidance(field, highlightedText, tooltip) {
  const text = String(highlightedText ?? "").trim();

  const guidanceByField = {
    topic: {
      title: "Este fragmento abre demasiado el tema",
      suggestion:
        "Cámbialo por una dimensión investigable. Por ejemplo: efecto, relación, percepción, uso, experiencia, incidencia, comparación o desempeño.",
      checklist: [
        "Fenómeno específico",
        "Dimensión observable",
        "Relación con población o contexto",
      ],
    },
    context_place: {
      title: "Este fragmento no delimita suficiente el lugar",
      suggestion:
        "Sustitúyelo o complétalo con un espacio más concreto: ciudad, municipio, comunidad, institución, sede o zona.",
      checklist: [
        "Lugar exacto",
        "Institución o comunidad si aplica",
        "Alcance espacial manejable",
      ],
    },
    time_period: {
      title: "Este fragmento no cierra bien el periodo",
      suggestion:
        "Cámbialo por fechas, meses, ciclos o años concretos para que el alcance temporal quede verificable.",
      checklist: [
        "Fecha o año inicial",
        "Fecha o año final",
        "Periodo claro y acotado",
      ],
    },
    population: {
      title: "Este fragmento deja la población muy abierta",
      suggestion:
        "Agrega rasgos que diferencien al grupo: edad, grado, rol, institución, condición, cargo, sector o ubicación.",
      checklist: [
        "Quiénes son exactamente",
        "Qué rasgo los delimita",
        "Dónde pertenecen o se ubican",
      ],
    },
    resources: {
      title: "Este recurso está descrito de forma muy general",
      suggestion:
        "Indica fuentes, bases, documentos, instituciones, herramientas o accesos concretos que sí usarás.",
      checklist: [
        "Fuente concreta",
        "Acceso realista",
        "Tipo de dato o material",
      ],
    },
  };

  const base = guidanceByField[field] ?? {
    title: "Este fragmento necesita más precisión",
    suggestion:
      "Reformula el fragmento para que sea más concreto, verificable y delimitado.",
    checklist: [
      "Qué significa exactamente",
      "Cómo se observará",
      "Qué límite reduce el alcance",
    ],
  };

  return {
    title: base.title,
    message:
      String(tooltip ?? "").trim() ||
      `El fragmento “${text}” necesita más precisión para que el alcance no quede abierto.`,
    suggestion: base.suggestion,
    checklist: base.checklist,
  };
}

function createHighlight(field, start, end, text, tooltip) {
  const guidance = getHighlightGuidance(field, text, tooltip);

  return {
    id: `${field}-${start}-${end}`,
    field,
    start,
    end,
    text,
    tooltip: guidance.message,
    title: guidance.title,
    message: guidance.message,
    suggestion: guidance.suggestion,
    checklist: guidance.checklist,
    severity: "warning",
  };
}

function collectMatches(text, field, patterns, predicate = () => true) {
  if (!text?.trim()) return [];
  if (!predicate(text)) return [];

  const matches = [];

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;

    for (const found of text.matchAll(pattern.regex)) {
      const matchText = found[0];
      const start = found.index ?? -1;
      const end = start + matchText.length;

      if (start < 0) continue;

      matches.push(createHighlight(field, start, end, matchText, pattern.tooltip));
    }
  }

  return sortAndClipOverlaps(uniqueByRange(matches));
}

function hasSpecificDelimiter(text) {
  return /,|\d|\bde\b|\bdel\b|\ben\b/i.test(text);
}

function hasConcreteTimeRange(text) {
  const years = text.match(/\b(19|20)\d{2}\b/g) ?? [];
  return years.length >= 2 || /\b\d{4}\s*[-–a]\s*\d{4}\b/i.test(text);
}

function isBroadGuatemalaReference(text) {
  const normalized = normalizeLoose(text);

  const exactBroadCases = new Set([
    "guatemala",
    "en guatemala",
    "toda guatemala",
    "a nivel nacional en guatemala",
    "nivel nacional en guatemala",
    "ambito nacional en guatemala",
    "guatemala a nivel nacional",
  ]);

  if (exactBroadCases.has(normalized)) {
    return true;
  }

  if (normalized.includes("ciudad de guatemala")) {
    return false;
  }

  if (normalized.includes("departamento de guatemala")) {
    return false;
  }

  if (/guatemala\s*,\s*[a-záéíóúñ]/i.test(text)) {
    return false;
  }

  if (/\bzona\s+\d+\b/i.test(normalized)) {
    return false;
  }

  return normalized === "guatemala" || normalized === "en guatemala";
}

function isGenericPopulation(text) {
  const words = compactWords(text);
  return words.length <= 5 && !hasSpecificDelimiter(text);
}

function isGenericResources(text) {
  const words = compactWords(text);

  return (
    words.length <= 8 &&
    !/\b(scielo|pubmed|redalyc|dialnet|inei|ine|mineduc|inacif|pnc|observatorio|archivo|base de datos|repositorio|encuesta propia|entrevista semiestructurada)\b/i.test(
      text
    )
  );
}

function isBroadLocationOnly(text) {
  const words = compactWords(text);
  return words.length <= 5 && !text.includes(",");
}

function collectTopicHighlights(text) {
  if (!text?.trim()) return [];

  const matches = collectMatches(text, "topic", TOPIC_PATTERNS, () => true);

  const words = compactWords(text);
  const normalized = normalizeLoose(text);

  if (words.length <= 6) {
    matches.push(
      createHighlight(
        "topic",
        0,
        text.length,
        text,
        "El tema todavía es muy corto o general. Conviene indicar mejor qué variable, relación o fenómeno exacto vas a investigar."
      )
    );
  }

  if (
    !/\b(efecto|relacion|relación|percepcion|percepción|influencia|incidencia|comparacion|comparación|experiencia|uso|rendimiento|desempeño|practicas|prácticas|estrategias)\b/i.test(
      normalized
    )
  ) {
    matches.push(
      createHighlight(
        "topic",
        0,
        text.length,
        text,
        "El tema todavía no deja clara la dimensión específica que vas a observar. Conviene precisar mejor qué aspecto analizarás."
      )
    );
  }

  return sortAndClipOverlaps(uniqueByRange(matches));
}

function collectContextHighlights(text) {
  if (!text?.trim()) return [];

  const matches = collectMatches(
    text,
    "context_place",
    LOCATION_PATTERNS,
    isBroadLocationOnly
  );

  if (isBroadGuatemalaReference(text)) {
    const foundIndex = text.toLowerCase().indexOf("guatemala");

    if (foundIndex >= 0) {
      matches.push(
        createHighlight(
          "context_place",
          foundIndex,
          foundIndex + "guatemala".length,
          text.slice(foundIndex, foundIndex + "guatemala".length),
          '“Guatemala” como único alcance espacial puede ser demasiado amplio. Conviene bajar a una ciudad, municipio, comunidad o institución específica.'
        )
      );
    }
  }

  return sortAndClipOverlaps(uniqueByRange(matches));
}

function buildFieldHighlights(model) {
  return {
    topic: collectTopicHighlights(model?.topic),
    context_place: collectContextHighlights(model?.context_place),
    time_period: collectMatches(
      model?.time_period,
      "time_period",
      TIME_PATTERNS,
      (text) => !hasConcreteTimeRange(text)
    ),
    population: collectMatches(
      model?.population,
      "population",
      POPULATION_PATTERNS,
      isGenericPopulation
    ),
    resources: collectMatches(
      model?.resources,
      "resources",
      RESOURCE_PATTERNS,
      isGenericResources
    ),
  };
}

function buildSignal({ field, level, icon, color, bg, border, text }) {
  return {
    field,
    level,
    icon,
    color,
    bg,
    border,
    text,
  };
}

function countHighlights(fieldHighlights) {
  return Object.values(fieldHighlights).reduce(
    (acc, list) => acc + list.length,
    0
  );
}

function buildSignals(model, fieldHighlights) {
  const signals = [];

  if (!model?.topic?.trim()) {
    signals.push(
      buildSignal({
        field: "topic",
        level: "Pendiente",
        icon: "edit_note",
        color: "text-[#854D0E]",
        bg: "bg-yellow-50/50",
        border: "border-[#854D0E]",
        text: "Todavía no hay un tema escrito. Empieza definiendo con claridad qué fenómeno exacto quieres investigar.",
      })
    );
  } else if (fieldHighlights.topic.length) {
    signals.push(
      buildSignal({
        field: "topic",
        level: "Muy amplio",
        icon: "warning",
        color: "text-[#C2410C]",
        bg: "bg-orange-50",
        border: "border-[#C2410C]",
        text: "El tema todavía usa palabras o formulaciones amplias. Conviene pasar del concepto general a una variable o relación más concreta.",
      })
    );
  }

  if (!model?.context_place?.trim()) {
    signals.push(
      buildSignal({
        field: "context_place",
        level: "Pendiente",
        icon: "location_on",
        color: "text-[#854D0E]",
        bg: "bg-yellow-50/50",
        border: "border-[#854D0E]",
        text: "Aún falta el contexto espacial. Conviene indicar el lugar exacto donde se observará el fenómeno.",
      })
    );
  } else if (fieldHighlights.context_place.length) {
    signals.push(
      buildSignal({
        field: "context_place",
        level: "Aún difuso",
        icon: "help",
        color: "text-[#854D0E]",
        bg: "bg-yellow-50/50",
        border: "border-[#854D0E]",
        text: "El alcance espacial sigue siendo amplio. Conviene bajar a una ciudad, comunidad, municipio, institución o zona concreta.",
      })
    );
  }

  if (!model?.time_period?.trim()) {
    signals.push(
      buildSignal({
        field: "time_period",
        level: "Pendiente",
        icon: "event",
        color: "text-[#854D0E]",
        bg: "bg-yellow-50/50",
        border: "border-[#854D0E]",
        text: "Todavía no hay un periodo definido. Conviene indicar años o fechas para cerrar el alcance temporal.",
      })
    );
  } else if (fieldHighlights.time_period.length) {
    signals.push(
      buildSignal({
        field: "time_period",
        level: "Aún difuso",
        icon: "help",
        color: "text-[#854D0E]",
        bg: "bg-yellow-50/50",
        border: "border-[#854D0E]",
        text: "El periodo todavía está expresado de forma ambigua. Conviene convertirlo en fechas o años concretos.",
      })
    );
  }

  if (!model?.population?.trim()) {
    signals.push(
      buildSignal({
        field: "population",
        level: "Pendiente",
        icon: "groups",
        color: "text-[#854D0E]",
        bg: "bg-yellow-50/50",
        border: "border-[#854D0E]",
        text: "Aún falta la población de estudio. Conviene indicar exactamente quiénes participarán o serán observados.",
      })
    );
  } else if (fieldHighlights.population.length) {
    signals.push(
      buildSignal({
        field: "population",
        level: "Muy amplio",
        icon: "warning",
        color: "text-[#C2410C]",
        bg: "bg-orange-50",
        border: "border-[#C2410C]",
        text: "La población todavía es general. Conviene añadir edad, rol, institución, condición o ubicación.",
      })
    );
  }

  if (model?.resources?.trim() && fieldHighlights.resources.length) {
    signals.push(
      buildSignal({
        field: "resources",
        level: "Aún difuso",
        icon: "help",
        color: "text-[#854D0E]",
        bg: "bg-yellow-50/50",
        border: "border-[#854D0E]",
        text: "Los recursos todavía se describen de forma general. Conviene indicar fuentes, bases o accesos concretos.",
      })
    );
  }

  if (!signals.length) {
    signals.push(
      buildSignal({
        field: "overall",
        level: "Razonable",
        icon: "check_circle",
        color: "text-[#005944]",
        bg: "bg-[#005944]/5",
        border: "border-[#005944]",
        text: "Por heurística, tu delimitación ya evita las ambigüedades más comunes. Ahora puedes seguir refinando con preguntas socráticas.",
      })
    );
  }

  return signals.slice(0, 4);
}

function buildJackQuestion(model, fieldHighlights) {
  if (!model?.topic?.trim()) {
    return "¿Qué fenómeno exacto quieres investigar y qué parte de ese fenómeno te interesa realmente?";
  }

  if (fieldHighlights.topic.length) {
    return "¿Qué aspecto concreto de tu tema quieres observar: efecto, relación, percepción, uso, cambio o comparación?";
  }

  if (!model?.context_place?.trim() || fieldHighlights.context_place.length) {
    return "¿En qué lugar exacto ocurrirá tu estudio: ciudad, comunidad, municipio, institución o espacio específico?";
  }

  if (!model?.time_period?.trim() || fieldHighlights.time_period.length) {
    return "¿Qué rango de años o fechas exactas haría que tu estudio fuera más manejable?";
  }

  if (!model?.population?.trim() || fieldHighlights.population.length) {
    return "¿Quiénes exactamente integran tu población y qué rasgos la vuelven diferente de un grupo más amplio?";
  }

  if (model?.resources?.trim() && fieldHighlights.resources.length) {
    return "¿Qué fuentes concretas sí tienes a tu alcance y cuáles serían demasiado difíciles de conseguir?";
  }

  if (!Array.isArray(model?.include) || model.include.length === 0) {
    return "¿Qué casos o participantes sí deberían entrar en tu estudio para que el alcance quede claro?";
  }

  if (!Array.isArray(model?.exclude) || model.exclude.length === 0) {
    return "¿Qué casos o participantes quedarán fuera de tu estudio para evitar que el alcance se abra demasiado?";
  }

  return "¿Qué parte de tu delimitación todavía podría acotarse un poco más sin perder relevancia para tu investigación?";
}

export function evaluateDelimitationHeuristics(model) {
  const safeModel = model ?? {};
  const fieldHighlights = buildFieldHighlights(safeModel);
  const signals = buildSignals(safeModel, fieldHighlights);
  const jackQuestion = buildJackQuestion(safeModel, fieldHighlights);

  return {
    fieldLabels: FIELD_LABELS,
    fieldHighlights,
    signals,
    jackQuestion,
    totalHighlights: countHighlights(fieldHighlights),
  };
}