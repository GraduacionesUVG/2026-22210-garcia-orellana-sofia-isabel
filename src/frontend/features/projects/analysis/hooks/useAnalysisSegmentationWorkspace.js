"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAnalysisSegments } from "@/features/projects/analysis/api/analysis.api";
import {
  getCorpusDocument,
  getCorpusDocuments,
} from "@/features/projects/corpus/api/corpus.api";
import { getCorpusParticipants } from "@/features/projects/corpus/api/corpusCatalog.api";
import { pickSegmentationDocumentId } from "@/features/projects/analysis/helpers/analysis.helpers";

function list(value, key) {
  return Array.isArray(value?.[key]) ? value[key] : [];
}

function decorateDocuments(documents, participants, segments) {
  const participantsById = new Map(
    participants.map((participant) => [participant.id, participant])
  );
  const segmentCounts = new Map();

  segments.forEach((segment) => {
    if (!segment?.document_id) return;
    segmentCounts.set(
      segment.document_id,
      Number(segmentCounts.get(segment.document_id) ?? 0) + 1
    );
  });

  return documents.map((document) => {
    const participant = document.participant_id
      ? participantsById.get(document.participant_id)
      : null;

    return {
      ...document,
      participant_label:
        participant?.display_name || participant?.alias || "Sin participante",
      segment_count: Number(segmentCounts.get(document.id) ?? 0),
    };
  });
}

export function useAnalysisSegmentationWorkspace({
  projectId,
  initialDocumentId = "",
}) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [activeDocument, setActiveDocument] = useState(null);
  const [search, setSearch] = useState("");
  const [loadingDocuments, setLoadingDocuments] = useState(Boolean(projectId));
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [documentError, setDocumentError] = useState("");

  const loadDocuments = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoadingDocuments(true);
      setDocumentsError("");

      const [documentsJson, participantsJson, segmentsJson] = await Promise.all([
        getCorpusDocuments(projectId, { limit: 100, offset: 0 }),
        getCorpusParticipants(projectId, { limit: 100, offset: 0 }),
        getAnalysisSegments(projectId, {
          status: "all",
          limit: 200,
          offset: 0,
        }),
      ]);

      const nextDocuments = decorateDocuments(
        list(documentsJson, "documents"),
        list(participantsJson, "participants"),
        list(segmentsJson, "segments")
      );
      setDocuments(nextDocuments);
      setSelectedDocumentId((current) =>
        pickSegmentationDocumentId(
          nextDocuments,
          current || initialDocumentId
        )
      );
      if (!nextDocuments.length) setActiveDocument(null);
    } catch (error) {
      setDocumentsError(
        error?.message ?? "No se pudieron cargar los archivos del corpus."
      );
      setDocuments([]);
      setSelectedDocumentId("");
      setActiveDocument(null);
    } finally {
      setLoadingDocuments(false);
    }
  }, [initialDocumentId, projectId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const loadDocument = useCallback(async () => {
    if (!projectId || !selectedDocumentId) {
      setActiveDocument(null);
      return;
    }

    try {
      setLoadingDocument(true);
      setDocumentError("");
      const json = await getCorpusDocument(projectId, selectedDocumentId);
      setActiveDocument(json?.document ?? null);

      if (!json?.document) {
        setDocumentError("No se encontró el documento seleccionado.");
      }
    } catch (error) {
      setActiveDocument(null);
      setDocumentError(error?.message ?? "No se pudo cargar el documento.");
    } finally {
      setLoadingDocument(false);
    }
  }, [projectId, selectedDocumentId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    if (!query) return documents;

    return documents.filter((document) =>
      [
        document.title,
        document.document_type,
        document.participant_label,
        document.location,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("es").includes(query))
    );
  }, [documents, search]);

  const selectDocument = useCallback(
    (documentId) => {
      if (!documents.some((document) => document.id === documentId)) return;
      setSelectedDocumentId(documentId);
    },
    [documents]
  );

  const updateActiveSegmentCount = useCallback((count) => {
    setDocuments((current) =>
      current.map((document) => {
        if (document.id !== selectedDocumentId) return document;
        const nextCount = Number(count ?? 0);
        return document.segment_count === nextCount
          ? document
          : { ...document, segment_count: nextCount };
      })
    );
  }, [selectedDocumentId]);

  return {
    documents,
    filteredDocuments,
    activeDocument,
    selectedDocumentId,
    search,
    loadingDocuments,
    loadingDocument,
    documentsError,
    documentError,
    setSearch,
    selectDocument,
    updateActiveSegmentCount,
    reloadDocuments: loadDocuments,
    reloadDocument: loadDocument,
  };
}
