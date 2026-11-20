import { requestJson } from "@/lib/api/http";
import {
  buildQueryString,
  encodePathValue,
  getDocumentApiBase,
  getDocumentsApiBase,
} from "@/features/projects/corpus/helpers/corpus.helpers";

export async function getCorpusDocuments(projectId, query = {}) {
  return requestJson(
    `${getDocumentsApiBase(projectId)}${buildQueryString(query)}`,
    { cache: "no-store" },
    "No se pudieron cargar los documentos del corpus."
  );
}

export async function getCorpusDocument(projectId, documentId) {
  return requestJson(
    getDocumentApiBase(projectId, documentId),
    { cache: "no-store" },
    "No se pudo cargar el documento."
  );
}

export async function createCorpusDocument(projectId, payload) {
  return requestJson(
    getDocumentsApiBase(projectId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo crear el documento."
  );
}

export async function updateCorpusDocument(projectId, documentId, payload) {
  return requestJson(
    getDocumentApiBase(projectId, documentId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo actualizar el documento."
  );
}

export async function deleteCorpusDocument(projectId, documentId) {
  return requestJson(
    getDocumentApiBase(projectId, documentId),
    { method: "DELETE" },
    "No se pudo eliminar el documento."
  );
}

export async function duplicateCorpusDocument(projectId, documentId) {
  return requestJson(
    `${getDocumentApiBase(projectId, documentId)}/duplicate`,
    { method: "POST" },
    "No se pudo duplicar el documento."
  );
}

export function getCorpusDocumentExportUrl(projectId, documentId, format = "txt") {
  return `${getDocumentApiBase(projectId, documentId)}/export${buildQueryString({
    format,
  })}`;
}

export async function getCorpusTrash(projectId, query = {}) {
  return requestJson(
    `${getDocumentsApiBase(projectId)}/trash${buildQueryString(query)}`,
    { cache: "no-store" },
    "No se pudo cargar la papelera del corpus."
  );
}

export async function restoreCorpusDocument(projectId, documentId) {
  return requestJson(
    `${getDocumentApiBase(projectId, documentId)}/restore`,
    { method: "POST" },
    "No se pudo restaurar el documento."
  );
}

export async function getCorpusStats(projectId) {
  return requestJson(
    `${getDocumentsApiBase(projectId)}/stats`,
    { cache: "no-store" },
    "No se pudieron cargar las métricas del corpus."
  );
}

export async function getCorpusDocumentVersions(projectId, documentId, query = {}) {
  return requestJson(
    `${getDocumentApiBase(projectId, documentId)}/versions${buildQueryString(
      query
    )}`,
    { cache: "no-store" },
    "No se pudieron cargar las versiones."
  );
}

export async function createCorpusDocumentVersion(projectId, documentId, payload = {}) {
  return requestJson(
    `${getDocumentApiBase(projectId, documentId)}/versions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo crear la versión."
  );
}

export async function getCorpusDocumentVersion(projectId, documentId, versionId) {
  return requestJson(
    `${getDocumentApiBase(projectId, documentId)}/versions/${encodePathValue(
      versionId
    )}`,
    { cache: "no-store" },
    "No se pudo cargar la versión."
  );
}

export async function restoreCorpusDocumentVersion(
  projectId,
  documentId,
  versionId,
  payload
) {
  return requestJson(
    `${getDocumentApiBase(projectId, documentId)}/versions/${encodePathValue(
      versionId
    )}/restore`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo restaurar la versión."
  );
}

export async function getCorpusDocumentSegments(projectId, documentId, query = {}) {
  return requestJson(
    `${getDocumentApiBase(projectId, documentId)}/segments${buildQueryString(
      query
    )}`,
    { cache: "no-store" },
    "No se pudieron cargar los segmentos."
  );
}

export async function createCorpusDocumentSegment(projectId, documentId, payload) {
  return requestJson(
    `${getDocumentApiBase(projectId, documentId)}/segments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo crear el segmento."
  );
}

export async function updateCorpusDocumentSegment(
  projectId,
  documentId,
  segmentId,
  payload
) {
  return requestJson(
    `${getDocumentApiBase(projectId, documentId)}/segments/${encodePathValue(
      segmentId
    )}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo actualizar el segmento."
  );
}

export async function deleteCorpusDocumentSegment(projectId, documentId, segmentId) {
  return requestJson(
    `${getDocumentApiBase(projectId, documentId)}/segments/${encodePathValue(
      segmentId
    )}`,
    { method: "DELETE" },
    "No se pudo eliminar el segmento."
  );
}
