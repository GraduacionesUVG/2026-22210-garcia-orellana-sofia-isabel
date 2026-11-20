"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCorpusTrash,
  restoreCorpusDocument,
} from "@/features/projects/corpus/api/corpus.api";

const DEFAULT_TRASH_FILTERS = {
  search: "",
  document_type: "",
  status: "",
  source_id: "",
  participant_id: "",
  limit: 50,
  offset: 0,
};

function getTrashPayload(json) {
  return Array.isArray(json?.documents) ? json.documents : [];
}

export function useCorpusTrash(projectId, isOpen, options = {}) {
  const { onRestored } = options;

  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_TRASH_FILTERS);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [restoringId, setRestoringId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

    if (count === 1) return "1 documento eliminado";
    return `${count} documentos eliminados`;
  }, [documents.length]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      offset: 0,
    }));
  }

  function resetFilters() {
    setFilters(DEFAULT_TRASH_FILTERS);
  }

  const loadTrash = useCallback(
    async ({ soft = false } = {}) => {
      if (!projectId || !isOpen) return;

      try {
        if (soft) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMsg("");

        const json = await getCorpusTrash(projectId, filters);
        setDocuments(getTrashPayload(json));
      } catch (error) {
        setErrorMsg(error?.message ?? "No se pudo cargar la papelera.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId, isOpen, filters]
  );

  useEffect(() => {
    if (!isOpen) return;

    loadTrash();
  }, [isOpen, loadTrash]);

  async function restoreDocument(documentId) {
    if (!projectId || !documentId) return;

    try {
      setRestoringId(documentId);
      setErrorMsg("");
      setSuccessMsg("");

      await restoreCorpusDocument(projectId, documentId);

      setDocuments((prev) =>
        prev.filter((document) => document.id !== documentId)
      );

      setSuccessMsg("El documento se restauró correctamente.");

      if (typeof onRestored === "function") {
        onRestored();
      }
    } catch (error) {
      setErrorMsg(error?.message ?? "No se pudo restaurar el documento.");
    } finally {
      setRestoringId("");
    }
  }

  return {
    documents,
    filters,

    loading,
    refreshing,
    restoringId,
    errorMsg,
    successMsg,

    hasActiveFilters,
    documentCountLabel,

    updateFilter,
    resetFilters,
    refresh: () => loadTrash({ soft: true }),
    restoreDocument,
  };
}