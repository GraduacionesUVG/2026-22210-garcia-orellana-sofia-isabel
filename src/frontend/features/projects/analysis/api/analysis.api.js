import { requestJson } from "@/lib/api/http";
import {
  buildQueryString,
  encodePathValue,
  getAnalysisApiBase,
  getAnalysisCodeApiBase,
  getAnalysisCodesApiBase,
  getAnalysisDashboardApiBase,
  getAnalysisInsightApiBase,
  getAnalysisInsightLinkApiBase,
  getAnalysisInsightLinksApiBase,
  getAnalysisInsightsApiBase,
  getAnalysisMemoApiBase,
  getAnalysisMemoLinkApiBase,
  getAnalysisMemoLinksApiBase,
  getAnalysisMemosApiBase,
  getSegmentCodeApiBase,
  getSegmentCodesApiBase,
} from "@/features/projects/analysis/helpers/analysis.helpers";

const analysisSegmentsInFlight = new Map();

                                                                           
                                                                             
async function getCompleteCatalog(projectId, key, base, query, options) {
  const rows = [];
  const links = new Map();
  const seen = new Set();
  let offset = 0;
  let lastPage;
  while (true) {
    options.signal?.throwIfAborted();
    lastPage = await requestJson(
      `${base(projectId)}${buildQueryString({ ...query, limit: 200, offset })}`,
      { cache: "no-store", signal: options.signal },
      "No se pudo cargar el catálogo completo de análisis."
    );
    options.signal?.throwIfAborted();
    const page = lastPage?.[key];
    if (!Array.isArray(page)) throw new Error("El catálogo de análisis está incompleto. Reintenta.");
    for (const row of page) {
      if (row?.id == null || seen.has(row.id)) throw new Error("El catálogo de análisis cambió durante la carga. Reintenta.");
      seen.add(row.id);
      rows.push(row);
    }
    for (const link of lastPage.links ?? []) links.set(link.id, link);
    offset += page.length;
    const total = Number.isInteger(lastPage.total) && lastPage.total >= 0 ? lastPage.total : null;
    if (total !== null ? offset >= total : page.length < 200) break;
    if (!page.length) throw new Error("El catálogo de análisis está incompleto. Reintenta.");
  }
  return { ...lastPage, [key]: rows, total: rows.length, ...(key === "insights" ? { links: [...links.values()] } : {}) };
}

export function getAllAnalysisMemos(projectId, query = {}, options = {}) {
  return getCompleteCatalog(projectId, "memos", getAnalysisMemosApiBase, query, options);
}

export function getAllAnalysisInsights(projectId, query = {}, options = {}) {
  return getCompleteCatalog(projectId, "insights", getAnalysisInsightsApiBase, query, options);
}

function jsonOptions(method, payload) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

export async function getAnalysisOverview(projectId) {
  return requestJson(
    `${getAnalysisApiBase(projectId)}/overview`,
    { cache: "no-store" },
    "No se pudieron cargar las métricas de análisis."
  );
}

export async function getAnalysisDashboard(projectId) {
  return requestJson(
    getAnalysisDashboardApiBase(projectId),
    { cache: "no-store" },
    "No se pudo cargar el dashboard de análisis."
  );
}

export async function getAnalysisCodeUsageStats(projectId, query = {}) {
  return requestJson(
    `${getAnalysisCodesApiBase(projectId)}/stats${buildQueryString(query)}`,
    { cache: "no-store" },
    "No se pudieron cargar las estadísticas de códigos."
  );
}

export async function getAnalysisCodeRelationships(projectId, query = {}) {
  return requestJson(
    `${getAnalysisApiBase(projectId)}/relationships${buildQueryString(query)}`,
    { cache: "no-store" },
    "No se pudieron cargar las relaciones entre codigos."
  );
}

export async function getAnalysisDocumentPatterns(projectId, query = {}) {
  return requestJson(
    `${getAnalysisApiBase(projectId)}/document-patterns${buildQueryString(
      query
    )}`,
    { cache: "no-store" },
    "No se pudieron cargar los patrones entre documentos."
  );
}

export async function getAnalysisUncodedSegments(projectId, query = {}) {
  return requestJson(
    `${getAnalysisApiBase(projectId)}/segments/uncoded${buildQueryString(
      query
    )}`,
    { cache: "no-store" },
    "No se pudieron cargar los segmentos sin codificar."
  );
}

export async function getAnalysisSegments(projectId, query = {}, options = {}) {
  const url = `${getAnalysisApiBase(projectId)}/segments${buildQueryString(query)}`;
  const existingRequest = analysisSegmentsInFlight.get(url);
  if (existingRequest) return existingRequest;

  const request = requestJson(
    url,
    { cache: "no-store", signal: options.signal },
    "No se pudieron cargar los segmentos del análisis."
  ).finally(() => {
    analysisSegmentsInFlight.delete(url);
  });

  analysisSegmentsInFlight.set(url, request);
  return request;
}

export async function getAnalysisCodes(projectId, query = {}) {
  return requestJson(
    `${getAnalysisCodesApiBase(projectId)}${buildQueryString(query)}`,
    { cache: "no-store" },
    "No se pudieron cargar los códigos."
  );
}

export async function getAnalysisCode(projectId, codeId) {
  return requestJson(
    getAnalysisCodeApiBase(projectId, codeId),
    { cache: "no-store" },
    "No se pudo cargar el código."
  );
}

export async function createAnalysisCode(projectId, payload) {
  return requestJson(
    getAnalysisCodesApiBase(projectId),
    jsonOptions("POST", payload),
    "No se pudo crear el código."
  );
}

export async function updateAnalysisCode(projectId, codeId, payload) {
  return requestJson(
    getAnalysisCodeApiBase(projectId, codeId),
    jsonOptions("PATCH", payload),
    "No se pudo actualizar el código."
  );
}

export async function deleteAnalysisCode(projectId, codeId) {
  return requestJson(
    getAnalysisCodeApiBase(projectId, codeId),
    { method: "DELETE" },
    "No se pudo eliminar el código."
  );
}

export async function getSegmentCodes(projectId, segmentId, query = {}) {
  return requestJson(
    `${getSegmentCodesApiBase(projectId, segmentId)}${buildQueryString(query)}`,
    { cache: "no-store" },
    "No se pudieron cargar los códigos del segmento."
  );
}

export async function createSegmentCode(projectId, segmentId, payload) {
  return requestJson(
    getSegmentCodesApiBase(projectId, segmentId),
    jsonOptions("POST", payload),
    "No se pudo asignar el código."
  );
}

export async function updateSegmentCode(
  projectId,
  segmentId,
  segmentCodeId,
  payload
) {
  return requestJson(
    getSegmentCodeApiBase(projectId, segmentId, segmentCodeId),
    jsonOptions("PATCH", payload),
    "No se pudo actualizar la codificación."
  );
}

export async function deleteSegmentCode(projectId, segmentId, segmentCodeId) {
  return requestJson(
    getSegmentCodeApiBase(projectId, segmentId, segmentCodeId),
    { method: "DELETE" },
    "No se pudo quitar la codificación."
  );
}

export async function getAnalysisMemos(projectId, query = {}) {
  return requestJson(
    `${getAnalysisMemosApiBase(projectId)}${buildQueryString(query)}`,
    { cache: "no-store" },
    "No se pudieron cargar los memos."
  );
}

export async function getAnalysisMemo(projectId, memoId) {
  return requestJson(
    getAnalysisMemoApiBase(projectId, memoId),
    { cache: "no-store" },
    "No se pudo cargar el memo."
  );
}

export async function createAnalysisMemo(projectId, payload) {
  return requestJson(
    getAnalysisMemosApiBase(projectId),
    jsonOptions("POST", payload),
    "No se pudo crear el memo."
  );
}

export async function updateAnalysisMemo(projectId, memoId, payload) {
  return requestJson(
    getAnalysisMemoApiBase(projectId, memoId),
    jsonOptions("PATCH", payload),
    "No se pudo actualizar el memo."
  );
}

export async function deleteAnalysisMemo(projectId, memoId) {
  return requestJson(
    getAnalysisMemoApiBase(projectId, memoId),
    { method: "DELETE" },
    "No se pudo eliminar el memo."
  );
}

export async function getAnalysisMemoLinks(projectId, memoId) {
  return requestJson(
    getAnalysisMemoLinksApiBase(projectId, memoId),
    { cache: "no-store" },
    "No se pudieron cargar los vínculos del memo."
  );
}

export async function createAnalysisMemoLink(projectId, memoId, payload) {
  return requestJson(
    getAnalysisMemoLinksApiBase(projectId, memoId),
    jsonOptions("POST", payload),
    "No se pudo crear el vínculo del memo."
  );
}

export async function deleteAnalysisMemoLink(projectId, memoId, linkId) {
  return requestJson(
    getAnalysisMemoLinkApiBase(projectId, memoId, linkId),
    { method: "DELETE" },
    "No se pudo eliminar el vínculo del memo."
  );
}

export async function getAnalysisInsights(projectId, query = {}) {
  return requestJson(
    `${getAnalysisInsightsApiBase(projectId)}${buildQueryString(query)}`,
    { cache: "no-store" },
    "No se pudieron cargar los hallazgos."
  );
}

export async function getAnalysisInsight(projectId, insightId) {
  return requestJson(
    getAnalysisInsightApiBase(projectId, insightId),
    { cache: "no-store" },
    "No se pudo cargar el hallazgo."
  );
}

export async function createAnalysisInsight(projectId, payload) {
  return requestJson(
    getAnalysisInsightsApiBase(projectId),
    jsonOptions("POST", payload),
    "No se pudo crear el hallazgo."
  );
}

export async function updateAnalysisInsight(projectId, insightId, payload) {
  return requestJson(
    getAnalysisInsightApiBase(projectId, insightId),
    jsonOptions("PATCH", payload),
    "No se pudo actualizar el hallazgo."
  );
}

export async function deleteAnalysisInsight(projectId, insightId) {
  return requestJson(
    getAnalysisInsightApiBase(projectId, insightId),
    { method: "DELETE" },
    "No se pudo eliminar el hallazgo."
  );
}

export async function getAnalysisInsightLinks(projectId, insightId) {
  return requestJson(
    getAnalysisInsightLinksApiBase(projectId, insightId),
    { cache: "no-store" },
    "No se pudieron cargar los vínculos del hallazgo."
  );
}

export async function createAnalysisInsightLink(projectId, insightId, payload) {
  return requestJson(
    getAnalysisInsightLinksApiBase(projectId, insightId),
    jsonOptions("POST", payload),
    "No se pudo crear el vínculo del hallazgo."
  );
}

export async function deleteAnalysisInsightLink(projectId, insightId, linkId) {
  return requestJson(
    getAnalysisInsightLinkApiBase(projectId, insightId, linkId),
    { method: "DELETE" },
    "No se pudo eliminar el vínculo del hallazgo."
  );
}

export function getSegmentCodeRoute(projectId, segmentId, segmentCodeId) {
  return `${getSegmentCodesApiBase(projectId, segmentId)}/${encodePathValue(
    segmentCodeId
  )}`;
}
