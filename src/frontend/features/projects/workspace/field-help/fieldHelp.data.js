export const FIELD_HELP_TONES = {
  action: "action",
  topic: "topic",
  population: "population",
  context: "context",
  time: "time",
  resources: "resources",
  method: "method",
  technique: "technique",
  sample: "sample",
  rationale: "rationale",
  warning: "warning",
};

export const FIELD_HELP_REGISTRY = {
  delimitation: {
    label: "Delimitación",
    fields: {
      topic: {
        phase: "delimitation",
        field: "topic",
        inputKind: "textarea",
        title: "Tema de investigación",
        shortHelp:
          "Debe expresar el fenómeno central que se quiere estudiar, sin ser demasiado amplio.",
        expectedStructure: [
          {
            label: "Fenómeno o tema central",
            tone: FIELD_HELP_TONES.topic,
            text: "Qué situación, problema, práctica o experiencia se quiere estudiar.",
          },
          {
            label: "Enfoque inicial",
            tone: FIELD_HELP_TONES.method,
            text: "Desde qué ángulo se observará el fenómeno.",
          },
          {
            label: "Delimitación implícita",
            tone: FIELD_HELP_TONES.context,
            text: "Evita escribir un tema tan amplio que no pueda investigarse dentro del proyecto.",
          },
        ],
        goodExample:
          "Percepciones de estudiantes universitarios sobre el uso de inteligencia artificial generativa en procesos de aprendizaje académico.",
        weakExample:
          "La inteligencia artificial en la educación.",
        commonMistakes: [
          "Escribir un tema demasiado general.",
          "Confundir tema con objetivo.",
          "Plantear una solución antes de describir el fenómeno.",
          "Usar frases muy amplias como “la educación en Guatemala” sin delimitar.",
        ],
        quickChecklist: [
          "¿Se entiende qué fenómeno se estudiará?",
          "¿Es suficientemente específico?",
          "¿Puede investigarse con el tiempo y recursos disponibles?",
        ],
      },

      context_place: {
        phase: "delimitation",
        field: "context_place",
        inputKind: "textarea",
        title: "Contexto o lugar",
        shortHelp:
          "Debe indicar dónde ocurre el fenómeno y qué características del entorno importan.",
        expectedStructure: [
          {
            label: "Lugar",
            tone: FIELD_HELP_TONES.context,
            text: "Institución, comunidad, municipio, ciudad o entorno donde ocurre el estudio.",
          },
          {
            label: "Condición relevante",
            tone: FIELD_HELP_TONES.topic,
            text: "Algo del contexto que ayude a entender por qué ese lugar importa.",
          },
        ],
        goodExample:
          "Estudiantes de una universidad privada en Ciudad de Guatemala, dentro de cursos donde se utilizan herramientas digitales para actividades académicas.",
        weakExample: "Guatemala.",
        commonMistakes: [
          "Poner solo el país o ciudad sin explicar el contexto.",
          "No conectar el lugar con el tema de investigación.",
          "Escribir un contexto demasiado grande para el alcance del estudio.",
        ],
        quickChecklist: [
          "¿Se sabe dónde se hará el estudio?",
          "¿El contexto está conectado con el tema?",
          "¿El lugar es realista para acceder a participantes o datos?",
        ],
      },

      population: {
        phase: "delimitation",
        field: "population",
        inputKind: "textarea",
        title: "Población",
        shortHelp:
          "Debe explicar quiénes serán observados, entrevistados o considerados en el estudio.",
        expectedStructure: [
          {
            label: "Grupo principal",
            tone: FIELD_HELP_TONES.population,
            text: "Personas, actores, usuarios, estudiantes, docentes, comunidades, etc.",
          },
          {
            label: "Características clave",
            tone: FIELD_HELP_TONES.context,
            text: "Rasgos que los hacen relevantes para el tema.",
          },
          {
            label: "Criterio general",
            tone: FIELD_HELP_TONES.method,
            text: "Qué condición deben cumplir para formar parte del estudio.",
          },
        ],
        goodExample:
          "Estudiantes universitarios de pregrado que han utilizado herramientas de inteligencia artificial generativa en actividades académicas durante el último semestre.",
        weakExample: "Estudiantes.",
        commonMistakes: [
          "Nombrar un grupo demasiado amplio.",
          "No indicar qué característica los vuelve relevantes.",
          "Confundir población con muestra específica.",
        ],
        quickChecklist: [
          "¿Se entiende quiénes son?",
          "¿Tienen relación directa con el fenómeno?",
          "¿La población es accesible para el proyecto?",
        ],
      },

      time_period: {
        phase: "delimitation",
        field: "time_period",
        inputKind: "textarea",
        title: "Período de tiempo",
        shortHelp:
          "Debe aclarar el rango temporal que delimita el fenómeno o la recolección de información.",
        expectedStructure: [
          {
            label: "Rango temporal",
            tone: FIELD_HELP_TONES.time,
            text: "Semestre, año, ciclo académico, período de campo o etapa específica.",
          },
          {
            label: "Relación con el fenómeno",
            tone: FIELD_HELP_TONES.topic,
            text: "Por qué ese período es relevante para estudiar el tema.",
          },
        ],
        goodExample:
          "Durante el segundo semestre de 2026, período en el que los estudiantes ya han tenido exposición continua a herramientas de IA en actividades académicas.",
        weakExample: "Este año.",
        commonMistakes: [
          "Usar expresiones vagas como “actualmente” o “hoy en día”.",
          "No explicar por qué ese período importa.",
          "Definir un período que no coincide con la fase de campo.",
        ],
        quickChecklist: [
          "¿Hay un rango de tiempo claro?",
          "¿Ese período se relaciona con el fenómeno?",
          "¿Es viable recolectar información en ese tiempo?",
        ],
      },

      resources: {
        phase: "delimitation",
        field: "resources",
        inputKind: "textarea",
        title: "Recursos disponibles",
        shortHelp:
          "Debe describir los recursos reales con los que cuenta el proyecto para hacerlo viable.",
        expectedStructure: [
          {
            label: "Acceso",
            tone: FIELD_HELP_TONES.resources,
            text: "A qué personas, lugares, documentos o datos se puede acceder.",
          },
          {
            label: "Tiempo",
            tone: FIELD_HELP_TONES.time,
            text: "Cuánto tiempo hay para investigar.",
          },
          {
            label: "Herramientas",
            tone: FIELD_HELP_TONES.method,
            text: "Instrumentos, plataformas o apoyo disponible.",
          },
        ],
        goodExample:
          "Se cuenta con acceso a estudiantes de la universidad, disponibilidad para realizar entrevistas durante cuatro semanas y herramientas digitales para registrar y analizar la información.",
        weakExample: "Internet y computadora.",
        commonMistakes: [
          "Mencionar recursos sin conectarlos con la investigación.",
          "Sobreestimar acceso a participantes.",
          "No reconocer limitaciones de tiempo o alcance.",
        ],
        quickChecklist: [
          "¿Los recursos hacen viable el estudio?",
          "¿Se menciona acceso a la población o datos?",
          "¿Se reconocen límites reales?",
        ],
      },

      include: {
        phase: "delimitation",
        field: "include",
        inputKind: "text-list",
        title: "Criterio de inclusión",
        shortHelp:
          "Debe indicar qué condición permite que alguien o algo forme parte del estudio.",
        expectedStructure: [
          {
            label: "Condición observable",
            tone: FIELD_HELP_TONES.method,
            text: "Una característica verificable del participante, caso o documento.",
          },
          {
            label: "Relación con el tema",
            tone: FIELD_HELP_TONES.topic,
            text: "Por qué esa condición importa para el fenómeno.",
          },
        ],
        goodExample:
          "Estudiantes que hayan utilizado herramientas de IA generativa en al menos una actividad académica durante el semestre.",
        weakExample: "Personas interesadas.",
        commonMistakes: [
          "Escribir criterios demasiado subjetivos.",
          "Usar condiciones difíciles de verificar.",
          "Repetir la población sin agregar precisión.",
        ],
        quickChecklist: [
          "¿El criterio se puede verificar?",
          "¿Ayuda a seleccionar casos relevantes?",
          "¿Está conectado con el tema?",
        ],
      },

      exclude: {
        phase: "delimitation",
        field: "exclude",
        inputKind: "text-list",
        title: "Criterio de exclusión",
        shortHelp:
          "Debe indicar qué condición deja fuera a alguien o algo del estudio.",
        expectedStructure: [
          {
            label: "Condición de exclusión",
            tone: FIELD_HELP_TONES.warning,
            text: "Una razón clara para no incluir un caso.",
          },
          {
            label: "Justificación metodológica",
            tone: FIELD_HELP_TONES.method,
            text: "Por qué esa exclusión ayuda a mantener coherencia en el estudio.",
          },
        ],
        goodExample:
          "Estudiantes que no hayan utilizado herramientas de IA generativa en actividades académicas durante el período definido.",
        weakExample: "Personas que no sirven.",
        commonMistakes: [
          "Usar criterios discriminatorios o poco éticos.",
          "Excluir sin justificar metodológicamente.",
          "Duplicar el criterio de inclusión en negativo sin claridad.",
        ],
        quickChecklist: [
          "¿La exclusión es clara y verificable?",
          "¿Tiene sentido metodológico?",
          "¿Evita ambigüedad en la selección?",
        ],
      },
    },
  },

  researchDesign: {
    label: "Diseño de investigación",
    fields: {
      research_question: {
        phase: "researchDesign",
        field: "research_question",
        inputKind: "textarea",
        title: "Pregunta de investigación",
        shortHelp:
          "Debe expresar qué se quiere comprender o analizar, conectando fenómeno, población y contexto.",
        expectedStructure: [
          {
            label: "Pregunta guía",
            tone: FIELD_HELP_TONES.action,
            text: "Normalmente inicia con ¿Cómo?, ¿De qué manera?, ¿Qué significados?, ¿Cuáles son...?",
          },
          {
            label: "Fenómeno",
            tone: FIELD_HELP_TONES.topic,
            text: "El tema central que se investigará.",
          },
          {
            label: "Población",
            tone: FIELD_HELP_TONES.population,
            text: "El grupo o sujetos del estudio.",
          },
          {
            label: "Contexto",
            tone: FIELD_HELP_TONES.context,
            text: "Dónde ocurre el fenómeno.",
          },
          {
            label: "Tiempo o delimitación",
            tone: FIELD_HELP_TONES.time,
            text: "Período relevante si aplica.",
          },
        ],
        goodExample:
          "¿Cómo perciben los estudiantes universitarios de pregrado el uso de inteligencia artificial generativa en sus procesos de aprendizaje durante el segundo semestre de 2026?",
        weakExample:
          "¿La inteligencia artificial afecta la educación?",
        commonMistakes: [
          "Hacer una pregunta demasiado amplia.",
          "Preguntar algo que se responde solo con sí/no.",
          "No incluir población o contexto.",
          "No conectar con la delimitación previa.",
        ],
        quickChecklist: [
          "¿La pregunta busca comprender, analizar o describir?",
          "¿Incluye fenómeno, población y contexto?",
          "¿Evita respuestas de sí/no?",
          "¿Está alineada con la delimitación?",
        ],
      },

      general_objective: {
        phase: "researchDesign",
        field: "general_objective",
        inputKind: "textarea",
        title: "Objetivo general",
        shortHelp:
          "Debe convertir la pregunta de investigación en una acción investigativa amplia.",
        expectedStructure: [
          {
            label: "Verbo en infinitivo",
            tone: FIELD_HELP_TONES.action,
            text: "Analizar, comprender, describir, identificar, explorar, interpretar.",
          },
          {
            label: "Fenómeno",
            tone: FIELD_HELP_TONES.topic,
            text: "Qué se investigará.",
          },
          {
            label: "Población",
            tone: FIELD_HELP_TONES.population,
            text: "Con quiénes o sobre quiénes se investigará.",
          },
          {
            label: "Contexto",
            tone: FIELD_HELP_TONES.context,
            text: "Dónde ocurre el estudio.",
          },
        ],
        goodExample:
          "Analizar las percepciones de estudiantes universitarios de pregrado sobre el uso de inteligencia artificial generativa en sus procesos de aprendizaje durante el segundo semestre de 2026.",
        weakExample:
          "Mejorar el uso de inteligencia artificial en estudiantes.",
        commonMistakes: [
          "Usar verbos de intervención como mejorar, implementar o crear.",
          "Plantear una solución en vez de una acción investigativa.",
          "No alinearlo con la pregunta de investigación.",
          "Hacerlo más amplio que la delimitación.",
        ],
        quickChecklist: [
          "¿Empieza con verbo en infinitivo?",
          "¿Responde a la pregunta de investigación?",
          "¿No promete resolver el problema?",
          "¿Mantiene población y contexto?",
        ],
      },

      specific_objective: {
        phase: "researchDesign",
        field: "specific_objective",
        inputKind: "text-list",
        title: "Objetivo específico",
        shortHelp:
          "Debe ser una acción concreta que ayude a cumplir el objetivo general.",
        expectedStructure: [
          {
            label: "Verbo en infinitivo",
            tone: FIELD_HELP_TONES.action,
            text: "Identificar, describir, analizar, comparar, caracterizar, explorar.",
          },
          {
            label: "Acción concreta",
            tone: FIELD_HELP_TONES.method,
            text: "Una sola acción investigativa, no varias a la vez.",
          },
          {
            label: "Elemento del fenómeno",
            tone: FIELD_HELP_TONES.topic,
            text: "Una dimensión específica relacionada con la pregunta general.",
          },
        ],
        goodExample:
          "Identificar los usos académicos más frecuentes de la inteligencia artificial generativa entre estudiantes universitarios de pregrado.",
        weakExample:
          "Entender todo sobre la inteligencia artificial y mejorar su uso.",
        commonMistakes: [
          "Escribir más de una acción en el mismo objetivo.",
          "Usar verbos poco observables como conocer o entender.",
          "No alinearlo con el objetivo general.",
          "Redactarlo como actividad y no como objetivo investigativo.",
        ],
        quickChecklist: [
          "¿Inicia con verbo en infinitivo?",
          "¿Tiene una sola acción?",
          "¿Ayuda a cumplir el objetivo general?",
          "¿Es evaluable dentro del estudio?",
        ],
      },
    },
  },

  sampleConfig: {
    label: "Configuración de muestra",
    fields: {
      field_phase: {
        phase: "sampleConfig",
        field: "field_phase",
        inputKind: "textarea",
        title: "Fase de campo",
        shortHelp:
          "Debe describir en qué etapa del trabajo de campo se ubica la muestra.",
        expectedStructure: [
          {
            label: "Momento o etapa",
            tone: FIELD_HELP_TONES.time,
            text: "Inicial, exploratoria, principal, cierre, validación, etc.",
          },
          {
            label: "Actividad de campo",
            tone: FIELD_HELP_TONES.method,
            text: "Qué se hará durante esa fase.",
          },
          {
            label: "Contexto de aplicación",
            tone: FIELD_HELP_TONES.context,
            text: "Dónde o con quién se realizará.",
          },
        ],
        goodExample:
          "Fase inicial de trabajo de campo, orientada a realizar entrevistas exploratorias con estudiantes universitarios que han utilizado IA generativa en actividades académicas.",
        weakExample: "Primera fase.",
        commonMistakes: [
          "Escribir solo una etiqueta sin explicar la fase.",
          "Confundir fase de campo con cronograma completo.",
          "No conectar la fase con la muestra o las técnicas.",
        ],
        quickChecklist: [
          "¿Se entiende en qué momento del campo ocurre?",
          "¿Se explica qué se hará?",
          "¿Está conectado con técnicas y muestra?",
        ],
      },

      target_sample_size: {
        phase: "sampleConfig",
        field: "target_sample_size",
        inputKind: "number",
        title: "Tamaño de muestra",
        shortHelp:
          "Debe indicar el número estimado de participantes, casos o unidades de análisis.",
        expectedStructure: [
          {
            label: "Número estimado",
            tone: FIELD_HELP_TONES.sample,
            text: "Cantidad preliminar de participantes, casos, documentos o unidades.",
          },
          {
            label: "Tipo de unidad",
            tone: FIELD_HELP_TONES.population,
            text: "Participantes, entrevistas, grupos focales, documentos, casos, etc.",
          },
        ],
        goodExample:
          "12 participantes",
        weakExample: "Muchos.",
        commonMistakes: [
          "No definir un número estimado.",
          "Elegir un número sin relación con las técnicas.",
          "Confundir tamaño de muestra con población total.",
        ],
        quickChecklist: [
          "¿Hay un número claro?",
          "¿Ese número es viable?",
          "¿Tiene relación con la técnica elegida?",
        ],
      },

      sample_size_rationale: {
        phase: "sampleConfig",
        field: "sample_size_rationale",
        inputKind: "textarea",
        title: "Justificación del tamaño de muestra",
        shortHelp:
          "Debe explicar por qué el tamaño propuesto es razonable para el estudio.",
        expectedStructure: [
          {
            label: "Criterio metodológico",
            tone: FIELD_HELP_TONES.method,
            text: "Saturación esperada, profundidad cualitativa, diversidad de casos o viabilidad.",
          },
          {
            label: "Relación con técnicas",
            tone: FIELD_HELP_TONES.technique,
            text: "Por qué ese tamaño funciona para entrevistas, grupos focales, observación, etc.",
          },
          {
            label: "Viabilidad",
            tone: FIELD_HELP_TONES.resources,
            text: "Tiempo, acceso a participantes y recursos disponibles.",
          },
        ],
        goodExample:
          "Se propone trabajar con 12 participantes porque permite obtener información en profundidad mediante entrevistas semiestructuradas, manteniendo viabilidad dentro del tiempo disponible y buscando una saturación temática preliminar.",
        weakExample:
          "Porque creo que es suficiente.",
        commonMistakes: [
          "Justificar solo por conveniencia.",
          "No mencionar la técnica de recolección.",
          "No explicar por qué ese número es suficiente o viable.",
          "Confundir muestra cualitativa con representatividad estadística.",
        ],
        quickChecklist: [
          "¿Explica por qué ese número es razonable?",
          "¿Conecta con las técnicas?",
          "¿Reconoce viabilidad y profundidad?",
        ],
      },

      custom_technique: {
        phase: "sampleConfig",
        field: "custom_technique",
        inputKind: "text",
        title: "Técnica personalizada",
        shortHelp:
          "Debe nombrar una técnica de recolección válida que no esté en el listado estándar.",
        expectedStructure: [
          {
            label: "Nombre de técnica",
            tone: FIELD_HELP_TONES.technique,
            text: "Debe ser una técnica clara, no una actividad vaga.",
          },
          {
            label: "Uso metodológico",
            tone: FIELD_HELP_TONES.method,
            text: "Debe servir para recolectar información del fenómeno.",
          },
        ],
        goodExample:
          "Cartografía social",
        weakExample:
          "Preguntar cosas",
        commonMistakes: [
          "Escribir una actividad y no una técnica.",
          "Agregar técnicas duplicadas.",
          "Usar nombres demasiado vagos.",
        ],
        quickChecklist: [
          "¿Es una técnica reconocible?",
          "¿Sirve para recolectar información?",
          "¿No está duplicada con otra técnica ya seleccionada?",
        ],
      },
    },
  },
};