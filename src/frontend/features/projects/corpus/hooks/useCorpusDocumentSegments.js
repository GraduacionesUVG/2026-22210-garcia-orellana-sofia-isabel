"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCorpusDocumentSegment,
  deleteCorpusDocumentSegment,
  getCorpusDocumentSegments,
  updateCorpusDocumentSegment,
} from "@/features/projects/corpus/api/corpus.api";

const DEFAULT_SEGMENT_FORM = {
  start_char: 0,
  end_char: 0,
  selected_text: "",
  note: "",
};

function getSegmentsPayload(json) {
  return Array.isArray(json?.segments) ? json.segments : [];
}

function normalizeText(value) {
  return String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function getFriendlySegmentError(error) {
  const message = String(error?.message ?? "");

  if (message.includes("DOCUMENT_REVISION_CONFLICT")) {
    return "El documento cambió desde que lo cargaste. Recarga antes de crear segmentos.";
  }

  if (message.includes("SEGMENT_REVISION_CONFLICT")) {
    return "Este segmento fue modificado. Recarga antes de guardar cambios.";
  }

  if (message.includes("SEGMENT_RANGE_OUTSIDE_DOCUMENT")) {
    return "El rango seleccionado está fuera del documento.";
  }

  if (message.includes("INVALID_SEGMENT_RANGE")) {
    return "La selección no tiene un rango válido.";
  }

  if (message.includes("SELECTED_TEXT_DOES_NOT_MATCH_DOCUMENT")) {
    return "El texto seleccionado no coincide con el contenido guardado. Guarda o recarga el documento antes de segmentar.";
  }

  if (message.includes("SEGMENT_ALREADY_EXISTS")) {
    return "Ya existe un segmento con ese mismo rango.";
  }

  if (message.includes("DOCUMENT_NOT_FOUND")) {
    return "No se encontró el documento.";
  }

  return error?.message ?? "No se pudo completar la acción.";
}

export function useCorpusDocumentSegments({
  projectId,
  documentId,
  documentRevision,
  documentContent,
  enabled = true,
}) {
  const [segments, setSegments] = useState([]);
  const [selection, setSelection] = useState(DEFAULT_SEGMENT_FORM);

  const [editingSegmentId, setEditingSegmentId] = useState("");
  const [editingForm, setEditingForm] = useState({
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const normalizedContent = useMemo(
    () => normalizeText(documentContent),
    [documentContent]
  );

  const segmentCountLabel = useMemo(() => {
    if (segments.length === 1) return "1 segmento";
    return `${segments.length} segmentos`;
  }, [segments.length]);

  const hasSelection = Boolean(
    selection.selected_text &&
      selection.end_char > selection.start_char &&
      selection.selected_text.trim()
  );

  const canCreateSegment = Boolean(enabled && hasSelection && !creating);

  const loadSegments = useCallback(
    async ({ soft = false } = {}) => {
      if (!enabled || !projectId || !documentId) return;

      try {
        if (soft) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMsg("");

        const json = await getCorpusDocumentSegments(projectId, documentId, {
          limit: 200,
          offset: 0,
        });

        setSegments(getSegmentsPayload(json));
      } catch (error) {
        setErrorMsg(error?.message ?? "No se pudieron cargar los segmentos.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled, projectId, documentId]
  );

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  function clearFeedback() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  function updateSelectionFromTextarea(textarea) {
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = normalizedContent.slice(start, end);

    setSelection((prev) => ({
      ...prev,
      start_char: start,
      end_char: end,
      selected_text: selectedText,
    }));

    clearFeedback();
  }

  function setSelectionField(name, value) {
    setSelection((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearFeedback();
  }

  function resetSelection({ preserveFeedback = false } = {}) {
    setSelection(DEFAULT_SEGMENT_FORM);
    if (!preserveFeedback) clearFeedback();
  }

  async function createSegmentFromSelection(input = {}) {
    if (!canCreateSegment) return false;

    try {
      setCreating(true);
      setErrorMsg("");
      setSuccessMsg("");

      await createCorpusDocumentSegment(projectId, documentId, {
        base_document_revision: documentRevision,
        start_char: selection.start_char,
        end_char: selection.end_char,
        selected_text: selection.selected_text,
        note: String(input.note ?? "").trim(),
      });

      setSuccessMsg("El segmento se creó correctamente.");
      resetSelection({ preserveFeedback: true });

      await loadSegments({ soft: true });

      return true;
    } catch (error) {
      setErrorMsg(getFriendlySegmentError(error));
      return false;
    } finally {
      setCreating(false);
    }
  }

  function startEditingSegment(segment) {
    setEditingSegmentId(segment.id);
    setEditingForm({
      note: segment.note ?? "",
    });

    clearFeedback();
  }

  function cancelEditingSegment({ preserveFeedback = false } = {}) {
    setEditingSegmentId("");
    setEditingForm({
      note: "",
    });

    if (!preserveFeedback) clearFeedback();
  }

  function setEditingField(name, value) {
    setEditingForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearFeedback();
  }

  async function saveSegment(segment) {
    if (!segment?.id) return;

    try {
      setUpdatingId(segment.id);
      setErrorMsg("");
      setSuccessMsg("");

      await updateCorpusDocumentSegment(projectId, documentId, segment.id, {
        base_revision: segment.revision,
        note: String(editingForm.note ?? "").trim(),
      });

      setSuccessMsg("El segmento se actualizó correctamente.");
      cancelEditingSegment({ preserveFeedback: true });

      await loadSegments({ soft: true });
    } catch (error) {
      setErrorMsg(getFriendlySegmentError(error));
    } finally {
      setUpdatingId("");
    }
  }

  async function removeSegment(segment) {
    if (!segment?.id) return;

    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar este segmento?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(segment.id);
      setErrorMsg("");
      setSuccessMsg("");

      await deleteCorpusDocumentSegment(projectId, documentId, segment.id);

      setSuccessMsg("El segmento se eliminó correctamente.");
      await loadSegments({ soft: true });
    } catch (error) {
      setErrorMsg(getFriendlySegmentError(error));
    } finally {
      setDeletingId("");
    }
  }

  function scrollSelectionIntoView(segment) {
    if (!segment) return;

    setSelection({
      start_char: segment.start_char,
      end_char: segment.end_char,
      selected_text: segment.selected_text,
      note: segment.note ?? "",
    });
  }

  return {
    segments,
    selection,
    editingSegmentId,
    editingForm,

    loading,
    refreshing,
    creating,
    updatingId,
    deletingId,

    errorMsg,
    successMsg,

    segmentCountLabel,
    hasSelection,
    canCreateSegment,

    setSelectionField,
    updateSelectionFromTextarea,
    resetSelection,

    createSegmentFromSelection,

    startEditingSegment,
    cancelEditingSegment,
    setEditingField,
    saveSegment,
    removeSegment,

    scrollSelectionIntoView,
    refresh: () => loadSegments({ soft: true }),
  };
}
