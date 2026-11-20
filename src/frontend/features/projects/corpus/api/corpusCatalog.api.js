import { requestJson } from "@/lib/api/http";
import {
  buildQueryString,
  encodePathValue,
  getParticipantsApiBase,
  getSourcesApiBase,
} from "@/features/projects/corpus/helpers/corpus.helpers";

export async function getCorpusParticipants(projectId, query = {}) {
  return requestJson(
    `${getParticipantsApiBase(projectId)}${buildQueryString(query)}`,
    { cache: "no-store" },
    "No se pudieron cargar los participantes."
  );
}

export async function getCorpusParticipant(projectId, participantId) {
  return requestJson(
    `${getParticipantsApiBase(projectId)}/${encodePathValue(participantId)}`,
    { cache: "no-store" },
    "No se pudo cargar el participante."
  );
}

export async function createCorpusParticipant(projectId, payload) {
  return requestJson(
    getParticipantsApiBase(projectId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo crear el participante."
  );
}

export async function updateCorpusParticipant(projectId, participantId, payload) {
  return requestJson(
    `${getParticipantsApiBase(projectId)}/${encodePathValue(participantId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo actualizar el participante."
  );
}

export async function deleteCorpusParticipant(projectId, participantId) {
  return requestJson(
    `${getParticipantsApiBase(projectId)}/${encodePathValue(participantId)}`,
    { method: "DELETE" },
    "No se pudo eliminar el participante."
  );
}

export async function getCorpusSources(projectId, query = {}) {
  return requestJson(
    `${getSourcesApiBase(projectId)}${buildQueryString(query)}`,
    { cache: "no-store" },
    "No se pudieron cargar las fuentes del corpus."
  );
}

export async function createCorpusSource(projectId, payload) {
  return requestJson(
    getSourcesApiBase(projectId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo crear la fuente."
  );
}

export async function updateCorpusSource(projectId, sourceId, payload) {
  return requestJson(
    `${getSourcesApiBase(projectId)}/${encodePathValue(sourceId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "No se pudo actualizar la fuente."
  );
}

export async function deleteCorpusSource(projectId, sourceId) {
  return requestJson(
    `${getSourcesApiBase(projectId)}/${encodePathValue(sourceId)}`,
    { method: "DELETE" },
    "No se pudo eliminar la fuente."
  );
}
