"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCorpusParticipant,
  createCorpusSource,
  deleteCorpusParticipant,
  deleteCorpusSource,
  getCorpusParticipants,
  getCorpusSources,
  updateCorpusParticipant,
  updateCorpusSource,
} from "@/features/projects/corpus/api/corpusCatalog.api";
import {
  buildParticipantPayload,
  buildSourcePayload,
  EMPTY_PARTICIPANT_FORM,
  EMPTY_SOURCE_FORM,
  normalizeParticipantForm,
  normalizeSourceForm,
  validateParticipantForm,
  validateSourceForm,
} from "@/features/projects/corpus/helpers/corpus.helpers";

function getSourcesPayload(json) {
  return Array.isArray(json?.sources) ? json.sources : [];
}

function getParticipantsPayload(json) {
  return Array.isArray(json?.participants) ? json.participants : [];
}

function getFriendlyError(error, fallback) {
  const message = String(error?.message ?? "");

  if (message.includes("PARTICIPANT_ALIAS_ALREADY_EXISTS")) {
    return "Ya existe un participante con ese alias en este proyecto.";
  }

  if (message.includes("DOCUMENT_SOURCE_CODE_ALREADY_EXISTS")) {
    return "Ya existe una fuente con ese código en este proyecto.";
  }

  if (message.includes("DEFAULT_SOURCE_CANNOT_BE_DELETED")) {
    return "Las fuentes predeterminadas no se pueden eliminar.";
  }

  if (message.includes("DEFAULT_SOURCE_CODE_CANNOT_BE_CHANGED")) {
    return "No se puede cambiar el código de una fuente predeterminada.";
  }

  return error?.message ?? fallback;
}

export function useCorpusCatalogManager(projectId, open, options = {}) {
  const {
    onChanged,
    initialTab = "participants",
  } = options;

  const [activeTab, setActiveTab] = useState(
    initialTab === "sources" ? "sources" : "participants"
  );

  const [participants, setParticipants] = useState([]);
  const [sources, setSources] = useState([]);

  const [participantForm, setParticipantForm] = useState(EMPTY_PARTICIPANT_FORM);
  const [sourceForm, setSourceForm] = useState(EMPTY_SOURCE_FORM);

  const [editingParticipantId, setEditingParticipantId] = useState("");
  const [editingSourceId, setEditingSourceId] = useState("");

  const [loading, setLoading] = useState(false);
  const [savingParticipant, setSavingParticipant] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activeParticipants = useMemo(() => {
    return participants.filter((item) => item.deleted_at === null);
  }, [participants]);

  const activeSources = useMemo(() => {
    return sources.filter((item) => item.deleted_at === null);
  }, [sources]);

  const isEditingParticipant = Boolean(editingParticipantId);
  const isEditingSource = Boolean(editingSourceId);

  const loadCatalogs = useCallback(async () => {
    if (!projectId || !open) return;

    try {
      setLoading(true);
      setErrorMsg("");

      const [participantsJson, sourcesJson] = await Promise.all([
        getCorpusParticipants(projectId, {
          limit: 100,
          offset: 0,
        }),
        getCorpusSources(projectId, {
          limit: 100,
          offset: 0,
        }),
      ]);

      setParticipants(getParticipantsPayload(participantsJson));
      setSources(getSourcesPayload(sourcesJson));
    } catch (error) {
      setErrorMsg(
        error?.message ?? "No se pudieron cargar los catálogos del corpus."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, open]);

  useEffect(() => {
    if (!open) return;

    loadCatalogs();
  }, [open, loadCatalogs]);

  function clearFeedback() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  function setParticipantField(name, value) {
    setParticipantForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearFeedback();
  }

  function setSourceField(name, value) {
    setSourceForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    clearFeedback();
  }

  function resetParticipantForm() {
    setParticipantForm(EMPTY_PARTICIPANT_FORM);
    setEditingParticipantId("");
    clearFeedback();
  }

  function resetSourceForm() {
    setSourceForm(EMPTY_SOURCE_FORM);
    setEditingSourceId("");
    clearFeedback();
  }

  function editParticipant(participant) {
    setActiveTab("participants");
    setEditingParticipantId(participant.id);
    setParticipantForm(normalizeParticipantForm(participant));
    clearFeedback();
  }

  function editSource(source) {
    setActiveTab("sources");
    setEditingSourceId(source.id);
    setSourceForm(normalizeSourceForm(source));
    clearFeedback();
  }

  async function saveParticipant() {
    const validationError = validateParticipantForm(participantForm);

    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setSavingParticipant(true);
      setErrorMsg("");
      setSuccessMsg("");

      const payload = buildParticipantPayload(participantForm);

      if (editingParticipantId) {
        await updateCorpusParticipant(projectId, editingParticipantId, payload);
        setSuccessMsg("El participante se actualizó correctamente.");
      } else {
        await createCorpusParticipant(projectId, payload);
        setSuccessMsg("El participante se creó correctamente.");
      }

      resetParticipantForm();
      await loadCatalogs();

      if (typeof onChanged === "function") {
        onChanged();
      }
    } catch (error) {
      setErrorMsg(
        getFriendlyError(error, "No se pudo guardar el participante.")
      );
    } finally {
      setSavingParticipant(false);
    }
  }

  async function saveSource() {
    const validationError = validateSourceForm(sourceForm);

    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setSavingSource(true);
      setErrorMsg("");
      setSuccessMsg("");

      const payload = buildSourcePayload(sourceForm);

      if (editingSourceId) {
        await updateCorpusSource(projectId, editingSourceId, payload);
        setSuccessMsg("La fuente se actualizó correctamente.");
      } else {
        await createCorpusSource(projectId, payload);
        setSuccessMsg("La fuente se creó correctamente.");
      }

      resetSourceForm();
      await loadCatalogs();

      if (typeof onChanged === "function") {
        onChanged();
      }
    } catch (error) {
      setErrorMsg(getFriendlyError(error, "No se pudo guardar la fuente."));
    } finally {
      setSavingSource(false);
    }
  }

  async function removeParticipant(participant) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar el participante "${participant.alias}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(participant.id);
      setErrorMsg("");
      setSuccessMsg("");

      await deleteCorpusParticipant(projectId, participant.id);

      setSuccessMsg("El participante se eliminó correctamente.");
      await loadCatalogs();

      if (typeof onChanged === "function") {
        onChanged();
      }
    } catch (error) {
      setErrorMsg(
        getFriendlyError(error, "No se pudo eliminar el participante.")
      );
    } finally {
      setDeletingId("");
    }
  }

  async function removeSource(source) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar la fuente "${source.label}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(source.id);
      setErrorMsg("");
      setSuccessMsg("");

      await deleteCorpusSource(projectId, source.id);

      setSuccessMsg("La fuente se eliminó correctamente.");
      await loadCatalogs();

      if (typeof onChanged === "function") {
        onChanged();
      }
    } catch (error) {
      setErrorMsg(getFriendlyError(error, "No se pudo eliminar la fuente."));
    } finally {
      setDeletingId("");
    }
  }

  return {
    activeTab,
    setActiveTab,

    participants: activeParticipants,
    sources: activeSources,

    participantForm,
    sourceForm,

    editingParticipantId,
    editingSourceId,
    isEditingParticipant,
    isEditingSource,

    loading,
    savingParticipant,
    savingSource,
    deletingId,

    errorMsg,
    successMsg,

    setParticipantField,
    setSourceField,

    resetParticipantForm,
    resetSourceForm,

    editParticipant,
    editSource,

    saveParticipant,
    saveSource,

    removeParticipant,
    removeSource,

    refresh: loadCatalogs,
  };
}
