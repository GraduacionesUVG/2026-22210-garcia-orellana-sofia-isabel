export const DOCUMENT_TYPES = [
  { value: "interview", label: "Entrevista" },
  { value: "focus_group", label: "Grupo focal" },
  { value: "field_note", label: "Nota de campo" },
  { value: "observation", label: "Observación" },
  { value: "diary", label: "Diario" },
  { value: "archival_document", label: "Documento de archivo" },
  { value: "open_text", label: "Texto abierto" },
  { value: "other", label: "Otro" },
];

export const DOCUMENT_STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "transcribed", label: "Transcrito" },
  { value: "cleaned", label: "Limpio" },
  { value: "reviewed", label: "Revisado" },
  { value: "ready_for_coding", label: "Listo para codificación" },
  { value: "archived", label: "Archivado" },
];

export const PARTICIPANT_STATUSES = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "withdrawn", label: "Retirado" },
  { value: "archived", label: "Archivado" },
];

export const PARTICIPANT_ATTRIBUTE_FIELDS = [
  {
    key: "sample_group",
    label: "Submuestra o grupo",
    placeholder: "Ej. Mujeres adultas",
    hint: "Grupo analitico usado para comparar patrones.",
  },
  {
    key: "participant_type",
    label: "Tipo de participante",
    placeholder: "Ej. Estudiante, docente, cuidadora",
    hint: "Rol social o relacion con el fenomeno estudiado.",
  },
  {
    key: "community",
    label: "Comunidad o contexto",
    placeholder: "Ej. Urbano, rural, campus central",
    hint: "Contexto territorial o institucional relevante.",
  },
  {
    key: "age_range",
    label: "Rango de edad",
    placeholder: "Ej. 18-24, 25-34",
    hint: "Usa rangos, no edades exactas, para proteger identidad.",
  },
  {
    key: "gender_identity",
    label: "Genero",
    placeholder: "Ej. Mujer, hombre, no reporta",
    hint: "Opcional, solo si es relevante para el estudio.",
  },
  {
    key: "recruitment_channel",
    label: "Canal de reclutamiento",
    placeholder: "Ej. Referido, convocatoria, aula",
    hint: "Ayuda a leer sesgos de acceso a la muestra.",
  },
  {
    key: "socioeconomic_context",
    label: "Contexto socioeconomico",
    placeholder: "Ej. Becado, trabajador, no reporta",
    hint: "Usa categorias amplias si aplica metodologicamente.",
  },
];

export const EMPTY_CORPUS_STATS = {
  total_documents: 0,
  deleted_documents: 0,
  total_words: 0,
  total_characters: 0,
  average_words_per_document: 0,
  average_characters_per_document: 0,
  by_type: [],
  by_status: [],
  by_source: [],
  by_participant: [],
};

export const EMPTY_DOCUMENT_FORM = {
  title: "",
  content: "",
  document_type: "interview",
  source_id: "",
  participant_id: "",
  interview_date: "",
  field_date: "",
  location: "",
  language: "es",
  notes: "",
  metadata: {},
  status: "draft",
};

export const EMPTY_PARTICIPANT_FORM = {
  alias: "",
  display_name: "",
  notes: "",
  attributes: normalizeParticipantAttributes({}),
  status: "active",
};

export const EMPTY_SOURCE_FORM = {
  code: "",
  label: "",
  description: "",
  is_active: true,
  position: 100,
};

export function encodePathValue(value) {
  return encodeURIComponent(String(value));
}

export function getCorpusHref(projectId) {
  return `/projects/${encodePathValue(projectId)}/corpus`;
}

export function getNewDocumentHref(projectId) {
  return `/projects/${encodePathValue(projectId)}/corpus/new`;
}

export function getDocumentHref(projectId, documentId) {
  return `/projects/${encodePathValue(projectId)}/corpus/${encodePathValue(
    documentId
  )}`;
}

export function getProjectApiBase(projectId) {
  return `/api/projects/${encodePathValue(projectId)}`;
}

export function getDocumentsApiBase(projectId) {
  return `${getProjectApiBase(projectId)}/documents`;
}

export function getDocumentApiBase(projectId, documentId) {
  return `${getDocumentsApiBase(projectId)}/${encodePathValue(documentId)}`;
}

export function getParticipantsApiBase(projectId) {
  return `${getProjectApiBase(projectId)}/participants`;
}

export function getSourcesApiBase(projectId) {
  return `${getDocumentsApiBase(projectId)}/sources`;
}

export function getVersionsApiBase(projectId, documentId) {
  return `${getDocumentApiBase(projectId, documentId)}/versions`;
}

export function getSegmentsApiBase(projectId, documentId) {
  return `${getDocumentApiBase(projectId, documentId)}/segments`;
}

export function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (typeof value === "boolean") {
      query.set(key, value ? "true" : "false");
      return;
    }

    query.set(key, String(value));
  });

  const value = query.toString();

  return value ? `?${value}` : "";
}

export function normalizeDocumentContent(value) {
  if (!value) return "";
  return String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function getDocumentTypeLabel(value) {
  return DOCUMENT_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function getDocumentStatusLabel(value) {
  return DOCUMENT_STATUSES.find((item) => item.value === value)?.label ?? value;
}

export function getParticipantStatusLabel(value) {
  return (
    PARTICIPANT_STATUSES.find((item) => item.value === value)?.label ?? value
  );
}

export function formatCorpusNumber(value) {
  return new Intl.NumberFormat("es-GT").format(Number(value ?? 0));
}

export function formatCorpusDate(value) {
  if (!value) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-GT", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Sin fecha";
  }
}

export function getDocumentArchiveDate(document = {}) {
  if (document.field_date) {
    return {
      kind: "field_date",
      label: "Fecha de campo",
      value: document.field_date,
    };
  }

  if (document.interview_date) {
    return {
      kind: "interview_date",
      label: "Fecha de entrevista",
      value: document.interview_date,
    };
  }

  if (document.updated_at) {
    return {
      kind: "updated_at",
      label: "Ultima edicion",
      value: document.updated_at,
    };
  }

  return {
    kind: "missing",
    label: "Sin fecha",
    value: null,
  };
}

export function getDocumentArchiveDateLabel(document = {}) {
  const archiveDate = getDocumentArchiveDate(document);

  if (!archiveDate.value) return archiveDate.label;

  return `${archiveDate.label}: ${formatCorpusDate(archiveDate.value)}`;
}

export function getDocumentNotesPreview(notes = "", maxLength = 140) {
  const normalized = String(notes ?? "").replace(/\s+/g, " ").trim();

  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength).trim()}...`;
}

export function getDocumentArchiveMetadata(document = {}) {
  return {
    typeLabel: getDocumentTypeLabel(document.document_type),
    statusLabel: getDocumentStatusLabel(document.status),
    dateLabel: getDocumentArchiveDateLabel(document),
    locationLabel: String(document.location ?? "").trim() || "Sin lugar",
    languageLabel: String(document.language ?? "").trim() || "Sin idioma",
    notesPreview: getDocumentNotesPreview(document.notes),
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findDocumentTextMatches(content = "", query = "", options = {}) {
  const text = normalizeDocumentContent(content);
  const term = String(query ?? "").trim();
  const context = Number(options.context ?? 42);
  const limit = Number(options.limit ?? 100);

  if (!text || !term) return [];

  const expression = new RegExp(escapeRegExp(term), "gi");
  const matches = [];

  let match = expression.exec(text);

  while (match && matches.length < limit) {
    const start = match.index;
    const end = start + match[0].length;
    const beforeStart = Math.max(0, start - context);
    const afterEnd = Math.min(text.length, end + context);

    matches.push({
      index: matches.length,
      start,
      end,
      text: text.slice(start, end),
      before: text.slice(beforeStart, start),
      after: text.slice(end, afterEnd),
    });

    match = expression.exec(text);
  }

  return matches;
}

function normalizeAttributeText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return value;
  return value.trim();
}

export function normalizeParticipantAttributes(attributes = {}) {
  const base =
    attributes && typeof attributes === "object" && !Array.isArray(attributes)
      ? { ...attributes }
      : {};

  PARTICIPANT_ATTRIBUTE_FIELDS.forEach((field) => {
    base[field.key] = normalizeAttributeText(base[field.key]);
  });

  return base;
}

export function getParticipantGroupLabel(participant = {}) {
  const attributes = normalizeParticipantAttributes(participant.attributes);

  return (
    attributes.sample_group ||
    attributes.participant_type ||
    attributes.community ||
    participant.display_name ||
    participant.alias ||
    "Sin grupo"
  );
}

export function getParticipantOptionLabel(participant = {}) {
  const name = participant.display_name
    ? `${participant.alias} · ${participant.display_name}`
    : participant.alias;
  const group = getParticipantGroupLabel(participant);

  if (!group || group === participant.alias || group === participant.display_name) {
    return name;
  }

  return `${name} · ${group}`;
}

export function getParticipantAttributeChips(participant = {}) {
  const attributes = normalizeParticipantAttributes(participant.attributes);

  return PARTICIPANT_ATTRIBUTE_FIELDS.map((field) => ({
    key: field.key,
    label: field.label,
    value: attributes[field.key],
  })).filter((item) => Boolean(item.value));
}

export function buildDocumentCreatePayload(form = {}) {
  return {
    title: String(form.title ?? "").trim(),
    content: normalizeDocumentContent(form.content ?? "").trim(),
    document_type: form.document_type || "interview",
    source_id: form.source_id || null,
    participant_id: form.participant_id || null,
    interview_date: form.interview_date || null,
    field_date: form.field_date || null,
    location: String(form.location ?? "").trim(),
    language: String(form.language ?? "es").trim(),
    notes: String(form.notes ?? "").trim(),
    metadata: form.metadata ?? {},
    status: form.status || "draft",
  };
}

export function buildDocumentUpdatePayload(form = {}, baseRevision) {
  return {
    ...buildDocumentCreatePayload(form),
    base_revision: baseRevision,
  };
}

export function buildParticipantPayload(form = {}) {
  return {
    alias: String(form.alias ?? "").trim(),
    display_name: String(form.display_name ?? "").trim() || null,
    notes: String(form.notes ?? "").trim(),
    attributes: normalizeParticipantAttributes(form.attributes ?? {}),
    status: form.status || "active",
  };
}

export function buildSourcePayload(form = {}) {
  return {
    code: String(form.code ?? "").trim().toLowerCase().replace(/\s+/g, "_"),
    label: String(form.label ?? "").trim(),
    description: String(form.description ?? "").trim(),
    is_active: Boolean(form.is_active),
    position: Number(form.position ?? 100),
  };
}

export function normalizeParticipantForm(participant = {}) {
  return {
    ...EMPTY_PARTICIPANT_FORM,
    alias: participant.alias ?? "",
    display_name: participant.display_name ?? "",
    notes: participant.notes ?? "",
    attributes: normalizeParticipantAttributes(participant.attributes ?? {}),
    status: participant.status ?? "active",
  };
}

export function normalizeSourceForm(source = {}) {
  return {
    ...EMPTY_SOURCE_FORM,
    code: source.code ?? "",
    label: source.label ?? "",
    description: source.description ?? "",
    is_active: source.is_active ?? true,
    position: source.position ?? 100,
  };
}

export function validateDocumentForm(form = {}) {
  if (!String(form.title ?? "").trim()) {
    return "El título es obligatorio.";
  }

  if (String(form.title ?? "").trim().length > 250) {
    return "El título no puede superar 250 caracteres.";
  }

  if (normalizeDocumentContent(form.content ?? "").length > 1000000) {
    return "El texto es demasiado largo.";
  }

  return null;
}

export function validateParticipantForm(form = {}) {
  if (!String(form.alias ?? "").trim()) {
    return "El alias es obligatorio.";
  }

  if (String(form.alias ?? "").trim().length > 120) {
    return "El alias no puede superar 120 caracteres.";
  }

  if (String(form.display_name ?? "").trim().length > 180) {
    return "El nombre visible no puede superar 180 caracteres.";
  }

  if (String(form.notes ?? "").trim().length > 10000) {
    return "Las notas no pueden superar 10000 caracteres.";
  }

  return null;
}

export function validateSourceForm(form = {}) {
  const code = String(form.code ?? "").trim();
  const label = String(form.label ?? "").trim();

  if (!code) {
    return "El código es obligatorio.";
  }

  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(code.replace(/\s+/g, "_"))) {
    return "El código solo puede usar letras, números, guiones o guiones bajos.";
  }

  if (!label) {
    return "La etiqueta es obligatoria.";
  }

  if (code.length > 80) {
    return "El código no puede superar 80 caracteres.";
  }

  if (label.length > 160) {
    return "La etiqueta no puede superar 160 caracteres.";
  }

  if (String(form.description ?? "").trim().length > 5000) {
    return "La descripción no puede superar 5000 caracteres.";
  }

  return null;
}
