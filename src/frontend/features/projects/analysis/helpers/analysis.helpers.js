export const CODE_EMPTY_FORM = {
  name: "",
  description: "",
  definition: "",
  inclusion_criteria: "",
  exclusion_criteria: "",
  parent_code_id: "",
  color: "#0f766e",
  position: 0,
};

export const SEGMENT_CODE_EMPTY_FORM = {
  code_id: "",
  analytic_note: "",
  is_quote: false,
  quote_label: "",
};

export const UNCODED_SEGMENT_LABEL = "Sin codificar";

export const MEMO_EMPTY_FORM = {
  title: "",
  body: "",
  memo_type: "analytic",
  status: "draft",
  tags: "",
};

export const INSIGHT_EMPTY_FORM = {
  title: "",
  summary: "",
  interpretation: "",
  insight_type: "pattern",
  confidence: "medium",
  status: "draft",
  tags: "",
};

export const MEMO_TYPES = [
  { value: "analytic", label: "Analítico" },
  { value: "methodological", label: "Metodológico" },
  { value: "reflexive", label: "Reflexivo" },
  { value: "field", label: "Campo" },
  { value: "theoretical", label: "Teórico" },
];

export const MEMO_STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "reviewed", label: "Revisado" },
  { value: "confirmed", label: "Confirmado" },
  { value: "archived", label: "Archivado" },
];

export const INSIGHT_TYPES = [
  { value: "pattern", label: "Patrón" },
  { value: "contrast", label: "Contraste" },
  { value: "tension", label: "Tensión" },
  { value: "exception", label: "Excepción" },
  { value: "question", label: "Pregunta abierta" },
  { value: "recommendation", label: "Recomendación" },
  { value: "other", label: "Otro" },
];

export const INSIGHT_STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "reviewed", label: "En revision" },
  { value: "confirmed", label: "Confirmado" },
  { value: "archived", label: "Descartado" },
];

export const INSIGHT_CONFIDENCE_LEVELS = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

export function encodePathValue(value) {
  return encodeURIComponent(String(value));
}

export function getAnalysisHref(projectId) {
  return `/projects/${encodePathValue(projectId)}/analysis`;
}

export function getAnalysisSegmentsHref(projectId, options = {}) {
  return `${getAnalysisHref(projectId)}/segments${buildQueryString({
    documentId: options.documentId,
  })}`;
}

export function getAnalysisCodesHref(projectId, options = {}) {
  return `${getAnalysisHref(projectId)}/codes${buildQueryString({
    view:
      options.view === "codebook" || options.view === "coding"
        ? options.view
        : "",
    segmentId: options.segmentId,
  })}`;
}

export function normalizeCodingView(value) {
  return value === "coding" ? "coding" : "codebook";
}

export function pickCodingSegmentId(segments = [], requestedId = "") {
  if (!segments.length) return "";

  const requestedExists = segments.some(
    (segment) => String(segment?.id ?? "") === String(requestedId ?? "")
  );

  return requestedExists ? String(requestedId) : String(segments[0]?.id ?? "");
}

export function pickSegmentationDocumentId(documents = [], requestedId = "") {
  if (!documents.length) return "";

  const requestedExists = documents.some(
    (document) => String(document?.id ?? "") === String(requestedId ?? "")
  );

  return requestedExists
    ? String(requestedId)
    : String(documents[0]?.id ?? "");
}

export function getAdjacentCodingSegmentId(
  segments = [],
  currentId = "",
  direction = 1
) {
  const currentIndex = segments.findIndex(
    (segment) => String(segment?.id ?? "") === String(currentId ?? "")
  );

  if (currentIndex < 0) return "";

  const nextIndex = currentIndex + (direction < 0 ? -1 : 1);

  if (nextIndex < 0 || nextIndex >= segments.length) return "";

  return String(segments[nextIndex]?.id ?? "");
}

export function getAnalysisMemosHref(projectId) {
  return `${getAnalysisHref(projectId)}/memos`;
}

export function getAnalysisInsightsHref(projectId) {
  return `${getAnalysisHref(projectId)}/insights`;
}

export const ANALYSIS_WORKFLOW_STEPS = [
  {
    key: "segments",
    label: "Segmentos",
    icon: "segment",
    description: "Preparar evidencia",
    href: getAnalysisSegmentsHref,
  },
  {
    key: "codes",
    label: "Codificación",
    icon: "account_tree",
    description: "Organizar evidencia",
    href: getAnalysisCodesHref,
  },
  {
    key: "overview",
    label: "Explorar",
    icon: "analytics",
    description: "Leer patrones",
    href: getAnalysisHref,
  },
  {
    key: "memos",
    label: "Memos",
    icon: "edit_note",
    description: "Interpretar",
    href: getAnalysisMemosHref,
  },
  {
    key: "insights",
    label: "Hallazgos",
    icon: "emoji_objects",
    description: "Sintetizar",
    href: getAnalysisInsightsHref,
  },
];

export function getCorpusHref(projectId) {
  return `/projects/${encodePathValue(projectId)}/corpus`;
}

export function getCorpusDocumentHref(projectId, documentId) {
  return `${getCorpusHref(projectId)}/${encodePathValue(documentId)}`;
}

export function getProjectApiBase(projectId) {
  return `/api/projects/${encodePathValue(projectId)}`;
}

export function getAnalysisApiBase(projectId) {
  return `${getProjectApiBase(projectId)}/analysis`;
}

export function getAnalysisDashboardApiBase(projectId) {
  return `${getAnalysisApiBase(projectId)}/dashboard`;
}

export function getAnalysisCodesApiBase(projectId) {
  return `${getAnalysisApiBase(projectId)}/codes`;
}

export function getAnalysisCodeApiBase(projectId, codeId) {
  return `${getAnalysisCodesApiBase(projectId)}/${encodePathValue(codeId)}`;
}

export function getSegmentCodesApiBase(projectId, segmentId) {
  return `${getAnalysisApiBase(projectId)}/segments/${encodePathValue(
    segmentId
  )}/codes`;
}

export function getSegmentCodeApiBase(projectId, segmentId, segmentCodeId) {
  return `${getSegmentCodesApiBase(projectId, segmentId)}/${encodePathValue(
    segmentCodeId
  )}`;
}

export function getAnalysisMemosApiBase(projectId) {
  return `${getAnalysisApiBase(projectId)}/memos`;
}

export function getAnalysisMemoApiBase(projectId, memoId) {
  return `${getAnalysisMemosApiBase(projectId)}/${encodePathValue(memoId)}`;
}

export function getAnalysisMemoLinksApiBase(projectId, memoId) {
  return `${getAnalysisMemoApiBase(projectId, memoId)}/links`;
}

export function getAnalysisMemoLinkApiBase(projectId, memoId, linkId) {
  return `${getAnalysisMemoLinksApiBase(projectId, memoId)}/${encodePathValue(
    linkId
  )}`;
}

export function getAnalysisInsightsApiBase(projectId) {
  return `${getAnalysisApiBase(projectId)}/insights`;
}

export function getAnalysisInsightApiBase(projectId, insightId) {
  return `${getAnalysisInsightsApiBase(projectId)}/${encodePathValue(insightId)}`;
}

export function getAnalysisInsightLinksApiBase(projectId, insightId) {
  return `${getAnalysisInsightApiBase(projectId, insightId)}/links`;
}

export function getAnalysisInsightLinkApiBase(projectId, insightId, linkId) {
  return `${getAnalysisInsightLinksApiBase(
    projectId,
    insightId
  )}/${encodePathValue(linkId)}`;
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

export function normalizeAnalysisDashboardPayload(payload = {}) {
  return {
    overview: payload?.overview ?? null,
    codeStats: Array.isArray(payload?.stats) ? payload.stats : [],
    codes: Array.isArray(payload?.codes) ? payload.codes : [],
    uncodedSegments: Array.isArray(payload?.uncodedSegments)
      ? payload.uncodedSegments
      : [],
    insights: Array.isArray(payload?.insights) ? payload.insights : [],
    codeRelationships: Array.isArray(payload?.relationships)
      ? payload.relationships
      : [],
    documentPatterns: {
      documents: Array.isArray(payload?.documentPatterns?.documents)
        ? payload.documentPatterns.documents
        : [],
      patterns: Array.isArray(payload?.documentPatterns?.patterns)
        ? payload.documentPatterns.patterns
        : [],
    },
    groupComparisons: {
      attribute: payload?.groupComparisons?.attribute ?? "sample_group",
      groups: Array.isArray(payload?.groupComparisons?.groups)
        ? payload.groupComparisons.groups
        : [],
      rows: Array.isArray(payload?.groupComparisons?.rows)
        ? payload.groupComparisons.rows
        : [],
    },
  };
}

function findLabel(items, value) {
  return items.find((item) => item.value === value)?.label ?? value;
}

export function getMemoTypeLabel(value) {
  return findLabel(MEMO_TYPES, value);
}

export function getMemoStatusLabel(value) {
  return findLabel(MEMO_STATUSES, value);
}

export function getInsightTypeLabel(value) {
  return findLabel(INSIGHT_TYPES, value);
}

export function getInsightStatusLabel(value) {
  return findLabel(INSIGHT_STATUSES, value);
}

export function getInsightConfidenceLabel(value) {
  return findLabel(INSIGHT_CONFIDENCE_LEVELS, value);
}

function getInsightTimelineDate(value) {
  const date = value ? new Date(value) : new Date(0);

  if (Number.isNaN(date.getTime())) return new Date(0);

  return date;
}

function getTimelineDateKey(value) {
  return getInsightTimelineDate(value).toISOString().slice(0, 10);
}

export function buildInsightTimelineGroups(insights = []) {
  const groups = new Map();

  [...insights]
    .sort(
      (a, b) =>
        getInsightTimelineDate(b.updated_at ?? b.created_at).getTime() -
        getInsightTimelineDate(a.updated_at ?? a.created_at).getTime()
    )
    .forEach((insight) => {
      const key = getTimelineDateKey(insight.updated_at ?? insight.created_at);
      const group = groups.get(key) ?? {
        dateKey: key,
        label: formatAnalysisDate(key),
        items: [],
      };

      group.items.push(insight);
      groups.set(key, group);
    });

  return Array.from(groups.values());
}

function countByType(links = []) {
  return links.reduce((acc, link) => {
    const type = link?.link_type || "otro";
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
}

function linkLabel(link, codesById, memosById) {
  if (typeof link?.target_label === "string" && link.target_label.trim()) {
    return truncateAnalysisText(link.target_label.trim(), 160);
  }

  if (link?.link_type === "code") {
    return codesById.get(link.code_id)?.name?.trim() || "Código no disponible";
  }

  if (link?.link_type === "memo") {
    return memosById.get(link.memo_id)?.title?.trim() || "Memo no disponible";
  }

  if (link?.link_type === "segment") return "Segmento no disponible";
  if (link?.link_type === "document") return "Documento no disponible";
  if (link?.link_type === "participant") return "Participante no disponible";

  return "Evidencia";
}

export function summarizeInsightLinks(links = [], codes = [], memos = []) {
  const codesById = new Map(codes.map((code) => [code.id, code]));
  const memosById = new Map(memos.map((memo) => [memo.id, memo]));

  return {
    total: links.length,
    byType: countByType(links),
    items: links.map((link) => ({
      ...link,
      label: linkLabel(link, codesById, memosById),
    })),
  };
}

export function formatAnalysisDate(value) {
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

export function formatAnalysisNumber(value) {
  return new Intl.NumberFormat("es-GT").format(Number(value ?? 0));
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function tagsToInput(tags = []) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

export function truncateAnalysisText(value, length = 160) {
  const text = String(value ?? "").trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}...`;
}

export function buildCodeCreatePayload(form = {}) {
  return {
    name: String(form.name ?? "").trim(),
    description: String(form.description ?? "").trim() || null,
    definition: String(form.definition ?? "").trim() || null,
    inclusion_criteria: String(form.inclusion_criteria ?? "").trim() || null,
    exclusion_criteria: String(form.exclusion_criteria ?? "").trim() || null,
    parent_code_id: form.parent_code_id || null,
    color: String(form.color ?? "#0f766e").trim() || "#0f766e",
    position: Number(form.position ?? 0),
    metadata: {},
  };
}

export function buildCodeUpdatePayload(form = {}, baseRevision) {
  return {
    ...buildCodeCreatePayload(form),
    base_revision: baseRevision,
    is_active: form.is_active ?? true,
  };
}

export function buildSegmentCodePayload(form = {}) {
  return {
    code_id: form.code_id,
    analytic_note: String(form.analytic_note ?? "").trim(),
    is_quote: Boolean(form.is_quote),
    quote_label: String(form.quote_label ?? "").trim(),
    metadata: {},
  };
}

export function buildSegmentCodeUpdatePayload(form = {}, baseRevision) {
  return {
    analytic_note: String(form.analytic_note ?? "").trim(),
    is_quote: Boolean(form.is_quote),
    quote_label: String(form.quote_label ?? "").trim(),
    metadata: {},
    base_revision: baseRevision,
  };
}

export function buildMemoCreatePayload(form = {}) {
  return {
    title: String(form.title ?? "").trim(),
    body: String(form.body ?? "").trim(),
    memo_type: form.memo_type || "analytic",
    status: form.status || "draft",
    tags: normalizeTags(form.tags),
    metadata: {},
  };
}

export function getSegmentCodeNames(segment = {}) {
  const source = Array.isArray(segment.codes)
    ? segment.codes
    : Array.isArray(segment.code_names)
      ? segment.code_names
      : [];

  return source
    .map((code) =>
      typeof code === "string" ? code : String(code?.name ?? "").trim()
    )
    .map((name) => String(name).trim())
    .filter(Boolean);
}

export function getSegmentDisplayTitle(segment = {}) {
  const names = getSegmentCodeNames(segment);
  return names.length ? names.join(" · ") : UNCODED_SEGMENT_LABEL;
}

export function buildSegmentMemoDraft(segment = {}) {
  const codeNames = getSegmentCodeNames(segment);
  const selectedText = String(
    segment.selected_text ?? segment.text ?? ""
  ).trim();

  return {
    title: codeNames.length
      ? `Memo sobre ${codeNames.join(", ")}`
      : "Memo interpretativo desde segmento",
    body: `Interpretacion inicial:\n\n\n\nEvidencia del segmento:\n\n${selectedText}`,
    memo_type: "analytic",
    status: "draft",
    tags: "segmento, interpretacion",
  };
}

export function buildMemoUpdatePayload(form = {}, baseRevision) {
  return {
    ...buildMemoCreatePayload(form),
    base_revision: baseRevision,
  };
}

export function buildInsightCreatePayload(form = {}) {
  return {
    title: String(form.title ?? "").trim(),
    summary: String(form.summary ?? "").trim(),
    interpretation: String(form.interpretation ?? "").trim(),
    insight_type: form.insight_type || "pattern",
    confidence: form.confidence || "medium",
    status: form.status || "draft",
    tags: normalizeTags(form.tags),
    metadata: {},
  };
}

export function buildInsightUpdatePayload(form = {}, baseRevision) {
  return {
    ...buildInsightCreatePayload(form),
    base_revision: baseRevision,
  };
}

export function normalizeCodeForm(code = {}) {
  return {
    ...CODE_EMPTY_FORM,
    name: code.name ?? "",
    description: code.description ?? "",
    definition: code.definition ?? "",
    inclusion_criteria: code.inclusion_criteria ?? "",
    exclusion_criteria: code.exclusion_criteria ?? "",
    parent_code_id: code.parent_code_id ?? "",
    color: code.color ?? "#0f766e",
    position: code.position ?? 0,
    is_active: code.is_active ?? true,
  };
}

export function normalizeMemoForm(memo = {}) {
  return {
    ...MEMO_EMPTY_FORM,
    title: memo.title ?? "",
    body: memo.body ?? "",
    memo_type: memo.memo_type ?? "analytic",
    status: memo.status ?? "draft",
    tags: tagsToInput(memo.tags),
  };
}

export function normalizeInsightForm(insight = {}) {
  return {
    ...INSIGHT_EMPTY_FORM,
    title: insight.title ?? "",
    summary: insight.summary ?? "",
    interpretation: insight.interpretation ?? "",
    insight_type: insight.insight_type ?? "pattern",
    confidence: insight.confidence ?? "medium",
    status: insight.status ?? "draft",
    tags: tagsToInput(insight.tags),
  };
}

export function validateCodeForm(form = {}) {
  const name = String(form.name ?? "").trim();
  if (!name) return "El nombre del código es obligatorio.";
  if (name.length > 180) return "El nombre no puede superar 180 caracteres.";
  if (String(form.description ?? "").length > 10000) {
    return "La descripción no puede superar 10000 caracteres.";
  }
  if (String(form.definition ?? "").length > 20000) {
    return "La definición no puede superar 20000 caracteres.";
  }
  return null;
}

export function validateMemoForm(form = {}) {
  const title = String(form.title ?? "").trim();
  if (!title) return "El título del memo es obligatorio.";
  if (title.length > 250) return "El título no puede superar 250 caracteres.";
  if (String(form.body ?? "").length > 200000) {
    return "El cuerpo del memo es demasiado largo.";
  }
  return null;
}

export function validateInsightForm(form = {}) {
  const title = String(form.title ?? "").trim();
  if (!title) return "El título del hallazgo es obligatorio.";
  if (title.length > 250) return "El título no puede superar 250 caracteres.";
  if (String(form.summary ?? "").length > 50000) {
    return "El resumen es demasiado largo.";
  }
  if (String(form.interpretation ?? "").length > 200000) {
    return "La interpretación es demasiado larga.";
  }
  return null;
}

export function getFriendlyAnalysisError(error) {
  const message = String(error?.message ?? "");

  if (
    message.includes("CODE_REVISION_CONFLICT") ||
    message.includes("SEGMENT_CODE_REVISION_CONFLICT") ||
    message.includes("MEMO_REVISION_CONFLICT") ||
    message.includes("INSIGHT_REVISION_CONFLICT")
  ) {
    return "Este elemento fue modificado en otra pestaña. Recarga antes de guardar para evitar sobrescribir cambios.";
  }

  if (message.includes("CODE_ALREADY_EXISTS")) {
    return "Ya existe un código activo con ese nombre.";
  }

  if (message.includes("CODE_PARENT_CYCLE")) {
    return "Ese movimiento crearia un ciclo en el arbol. Elige otro codigo padre.";
  }

  if (message.includes("SEGMENT_CODE_ALREADY_EXISTS")) {
    return "Este segmento ya tiene asignado ese código.";
  }

  if (message.includes("INVALID_LINK_TARGET")) {
    return "El vínculo no corresponde a un recurso válido de este proyecto.";
  }

  if (message.includes("NOT_FOUND")) {
    return "No se encontró el elemento solicitado.";
  }

  return error?.message ?? "No se pudo completar la acción.";
}

                                                                             
                                                                             
export function getReadonlySelectionRange({ text, start, end, direction, key, shiftKey, boundaries = null }) {
  if (key !== "ArrowLeft" && key !== "ArrowRight") return null;
  const right = key === "ArrowRight";
  if (!shiftKey && start !== end) {
    const caret = right ? end : start;
    return { start: caret, end: caret, direction: "none" };
  }
  const anchor = direction === "backward" ? end : start;
  const focus = direction === "backward" ? start : end;
  const stops = boundaries ?? [0, ...Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), item => item.index + item.segment.length)];
                                                                     
  let low = 0, high = stops.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (right ? stops[mid] <= focus : stops[mid] < focus) low = mid + 1;
    else high = mid;
  }
  const caret = right ? (stops[low] ?? text.length) : (stops[low - 1] ?? 0);
  if (!shiftKey) return { start: caret, end: caret, direction: "none" };
  return { start: Math.min(anchor, caret), end: Math.max(anchor, caret), direction: caret === anchor ? "none" : caret < anchor ? "backward" : "forward" };
}
