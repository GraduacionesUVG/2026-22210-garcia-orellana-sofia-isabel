"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCorpusDocuments,
  getCorpusStats,
} from "@/features/projects/corpus/api/corpus.api";
import {
  getCorpusParticipants,
  getCorpusSources,
} from "@/features/projects/corpus/api/corpusCatalog.api";
import {
  EMPTY_CORPUS_STATS,
  getParticipantGroupLabel,
} from "@/features/projects/corpus/helpers/corpus.helpers";

const DEFAULT_FILTERS = {
  search: "",
  document_type: "",
  status: "",
  source_id: "",
  participant_id: "",
  limit: 50,
  offset: 0,
};

function getDocumentsPayload(json) {
  return Array.isArray(json?.documents) ? json.documents : [];
}

function getSourcesPayload(json) {
  return Array.isArray(json?.sources) ? json.sources : [];
}

function getParticipantsPayload(json) {
  return Array.isArray(json?.participants) ? json.participants : [];
}

export function useCorpusDashboard(projectId) {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(EMPTY_CORPUS_STATS);
  const [sources, setSources] = useState([]);
  const [participants, setParticipants] = useState([]);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const requestSequenceRef = useRef(0);

  const sourceOptions = useMemo(() => {
    return sources
      .filter((source) => source?.deleted_at === null)
      .map((source) => ({
        value: source.id,
        label: source.label,
        code: source.code,
        isDefault: Boolean(source.is_default),
      }));
  }, [sources]);

  const participantOptions = useMemo(() => {
    return participants
      .filter((participant) => participant?.deleted_at === null)
      .map((participant) => ({
        value: participant.id,
        label: participant.display_name
          ? `${participant.alias} · ${participant.display_name}`
          : participant.alias,
        alias: participant.alias,
        groupLabel: getParticipantGroupLabel(participant),
        linkedDocumentCount: participant.linked_document_count ?? 0,
      }));
  }, [participants]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
        filters.document_type ||
        filters.status ||
        filters.source_id ||
        filters.participant_id
    );
  }, [filters]);

  const documentCountLabel = useMemo(() => {
    const count = documents.length;

    if (count === 1) return "1 documento";
    return `${count} documentos`;
  }, [documents.length]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      offset: 0,
    }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const loadDashboard = useCallback(
    async ({ soft = false } = {}) => {
      if (!projectId) return;
      const requestSequence = ++requestSequenceRef.current;
      const isCurrentRequest = () => requestSequence === requestSequenceRef.current;

      try {
        if (soft) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMsg("");

        const query = {
          search: filters.search,
          document_type: filters.document_type,
          status: filters.status,
          source_id: filters.source_id,
          participant_id: filters.participant_id,
          limit: filters.limit,
          offset: filters.offset,
        };

        const [documentsJson, statsJson, sourcesJson, participantsJson] =
          await Promise.all([
            getCorpusDocuments(projectId, query),
            getCorpusStats(projectId),
            getCorpusSources(projectId, {
              active: true,
              limit: 100,
              offset: 0,
            }),
            getCorpusParticipants(projectId, {
              limit: 100,
              offset: 0,
            }),
          ]);

        if (!isCurrentRequest()) return;
        setDocuments(getDocumentsPayload(documentsJson));
        setStats(statsJson?.stats ?? EMPTY_CORPUS_STATS);
        setSources(getSourcesPayload(sourcesJson));
        setParticipants(getParticipantsPayload(participantsJson));
      } catch (error) {
        if (isCurrentRequest()) {
          setErrorMsg(error?.message ?? "No se pudo cargar el corpus.");
        }
      } finally {
        if (isCurrentRequest()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [projectId, filters]
  );

  useEffect(() => {
    loadDashboard();
                                                                                
                                                                  
    return () => { requestSequenceRef.current += 1; };
  }, [loadDashboard]);

  return {
    documents,
    stats,
    sources,
    participants,
    sourceOptions,
    participantOptions,
    filters,
    loading,
    refreshing,
    errorMsg,
    hasActiveFilters,
    documentCountLabel,
    updateFilter,
    resetFilters,
    refresh: () => loadDashboard({ soft: true }),
  };
}
