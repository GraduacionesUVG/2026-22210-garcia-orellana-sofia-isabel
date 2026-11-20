"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteCorpusDocument,
  getCorpusDocument,
  updateCorpusDocument,
} from "@/features/projects/corpus/api/corpus.api";
import {
  getCorpusParticipants,
  getCorpusSources,
} from "@/features/projects/corpus/api/corpusCatalog.api";
import {
  buildDocumentCreatePayload,
  buildDocumentUpdatePayload,
  EMPTY_DOCUMENT_FORM,
  getCorpusHref,
  getParticipantGroupLabel,
  normalizeDocumentContent,
  validateDocumentForm,
} from "@/features/projects/corpus/helpers/corpus.helpers";

function getSourcesPayload(json) {
  return Array.isArray(json?.sources) ? json.sources : [];
}

function getParticipantsPayload(json) {
  return Array.isArray(json?.participants) ? json.participants : [];
}

function normalizeDateInput(value) {
  if (!value) return "";
  if (typeof value !== "string") return "";

  return value.slice(0, 10);
}

function normalizeDocumentForm(document = {}) {
  return {
    ...EMPTY_DOCUMENT_FORM,
    title: document.title ?? "",
    content: document.content ?? "",
    document_type: document.document_type ?? "interview",
    source_id: document.source_id ?? "",
    participant_id: document.participant_id ?? "",
    interview_date: normalizeDateInput(document.interview_date),
    field_date: normalizeDateInput(document.field_date),
    location: document.location ?? "",
    language: document.language ?? "es",
    notes: document.notes ?? "",
    metadata: document.metadata ?? {},
    status: document.status ?? "draft",
  };
}

function countWords(value) {
  const text = normalizeDocumentContent(value).trim();

  if (!text) return 0;

  return text.split(/\s+/).filter(Boolean).length;
}

function countCharacters(value) {
  return normalizeDocumentContent(value).length;
}

function getComparablePayload(form = {}) {
  return buildDocumentCreatePayload(form);
}

function isSamePayload(a, b) {
  return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
}

function getFriendlySaveError(error) {
  const message = String(error?.message ?? "");

  if (message.includes("DOCUMENT_REVISION_CONFLICT")) {
    return "Este documento fue modificado en otra pestaña o por otro usuario. Recarga el documento antes de guardar.";
  }

  if (message.includes("INVALID_DOCUMENT_SOURCE_FOR_PROJECT")) {
    return "La fuente seleccionada no pertenece a este proyecto o ya no está activa.";
  }

  if (message.includes("INVALID_PARTICIPANT_FOR_PROJECT")) {
    return "El participante seleccionado no pertenece a este proyecto o fue eliminado.";
  }

  return error?.message ?? "No se pudo guardar el documento.";
}

export function useCorpusDocumentEditor(projectId, documentId) {
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_DOCUMENT_FORM);
  const [originalForm, setOriginalForm] = useState(null);
  const [document, setDocument] = useState(null);

  const [sources, setSources] = useState([]);
  const [participants, setParticipants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [catalogError, setCatalogError] = useState("");

  const [savingState, setSavingState] = useState("idle");
  const [savingError, setSavingError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [deleting, setDeleting] = useState(false);

  const corpusHref = useMemo(() => getCorpusHref(projectId), [projectId]);

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

  const metrics = useMemo(() => {
    return {
      words: countWords(form.content),
      characters: countCharacters(form.content),
    };
  }, [form.content]);

  const validationError = useMemo(() => validateDocumentForm(form), [form]);

  const hasChanges = useMemo(() => {
    if (!originalForm) return false;

    return !isSamePayload(
      getComparablePayload(form),
      getComparablePayload(originalForm)
    );
  }, [form, originalForm]);

  const isSaving = savingState === "saving";

  const canSave =
    !loading && !isSaving && !deleting && !validationError && hasChanges;

  const loadEditor = useCallback(async () => {
    if (!projectId || !documentId) return;

    try {
      setLoading(true);
      setLoadingError("");
      setCatalogStatus("loading");
      setCatalogError("");

      const [documentJson, sourcesJson, participantsJson] = await Promise.all([
        getCorpusDocument(projectId, documentId),
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

      const nextDocument = documentJson?.document ?? null;

      if (!nextDocument) {
        setLoadingError("No se encontró el documento.");
        setDocument(null);
        setOriginalForm(null);
        setForm(EMPTY_DOCUMENT_FORM);
        return;
      }

      const nextForm = normalizeDocumentForm(nextDocument);

      setDocument(nextDocument);
      setForm(nextForm);
      setOriginalForm(nextForm);

      setSources(getSourcesPayload(sourcesJson));
      setParticipants(getParticipantsPayload(participantsJson));

      setCatalogStatus("success");
      setSavingState("idle");
      setSavingError("");
      setSuccessMsg("");
    } catch (error) {
      setLoadingError(error?.message ?? "No se pudo cargar el documento.");
      setCatalogStatus("error");
      setCatalogError(
        error?.message ?? "No se pudieron cargar las opciones del corpus."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, documentId]);

  const reloadCatalogs = useCallback(async () => {
    if (!projectId) return;

    try {
      setCatalogStatus("loading");
      setCatalogError("");

      const [sourcesJson, participantsJson] = await Promise.all([
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

      setSources(getSourcesPayload(sourcesJson));
      setParticipants(getParticipantsPayload(participantsJson));
      setCatalogStatus("success");
    } catch (error) {
      setCatalogStatus("error");
      setCatalogError(
        error?.message ?? "No se pudieron cargar las opciones del corpus."
      );
    }
  }, [projectId]);

  useEffect(() => {
    loadEditor();
  }, [loadEditor]);

  function setField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (savingState !== "idle") {
      setSavingState("idle");
    }

    if (savingError) {
      setSavingError("");
    }

    if (successMsg) {
      setSuccessMsg("");
    }
  }

  function resetChanges() {
    if (!originalForm) return;

    setForm(originalForm);
    setSavingState("idle");
    setSavingError("");
    setSuccessMsg("");
  }

  async function save() {
    const error = validateDocumentForm(form);

    if (error) {
      setSavingState("error");
      setSavingError(error);
      return;
    }

    if (!document) {
      setSavingState("error");
      setSavingError("No se encontró el documento para guardar.");
      return;
    }

    try {
      setSavingState("saving");
      setSavingError("");
      setSuccessMsg("");

      const payload = buildDocumentUpdatePayload(form, document.revision);

      const json = await updateCorpusDocument(projectId, documentId, payload);
      const updatedDocument = json?.document ?? null;

      if (!updatedDocument) {
        throw new Error("No se recibió el documento actualizado.");
      }

      const nextForm = normalizeDocumentForm(updatedDocument);

      setDocument(updatedDocument);
      setForm(nextForm);
      setOriginalForm(nextForm);
      setSavingState("success");
      setSuccessMsg("Los cambios se guardaron correctamente.");
    } catch (error) {
      setSavingState("error");
      setSavingError(getFriendlySaveError(error));
    }
  }

  async function remove() {
    if (!document) return;

    const confirmed = window.confirm(
      "¿Seguro que quieres enviar este documento a la papelera?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setSavingError("");
      setSuccessMsg("");

      await deleteCorpusDocument(projectId, documentId);

      router.push(corpusHref);
      router.refresh();
    } catch (error) {
      setSavingState("error");
      setSavingError(error?.message ?? "No se pudo eliminar el documento.");
    } finally {
      setDeleting(false);
    }
  }

  return {
    form,
    originalForm,
    document,

    sources,
    participants,
    sourceOptions,
    participantOptions,
    metrics,

    loading,
    loadingError,

    catalogStatus,
    catalogError,

    savingState,
    savingError,
    successMsg,

    deleting,
    isSaving,
    canSave,
    hasChanges,
    validationError,
    corpusHref,

    setField,
    save,
    remove,
    resetChanges,
    reload: loadEditor,
    reloadCatalogs,
  };
}
