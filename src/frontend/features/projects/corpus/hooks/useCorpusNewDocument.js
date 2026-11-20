"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createCorpusDocument } from "@/features/projects/corpus/api/corpus.api";
import {
  getCorpusParticipants,
  getCorpusSources,
} from "@/features/projects/corpus/api/corpusCatalog.api";
import {
  buildDocumentCreatePayload,
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

function countWords(value) {
  const text = normalizeDocumentContent(value).trim();

  if (!text) return 0;

  return text.split(/\s+/).filter(Boolean).length;
}

function countCharacters(value) {
  return normalizeDocumentContent(value).length;
}

export function useCorpusNewDocument(projectId) {
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_DOCUMENT_FORM);

  const [sources, setSources] = useState([]);
  const [participants, setParticipants] = useState([]);

  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [catalogError, setCatalogError] = useState("");

  const [savingState, setSavingState] = useState("idle");
  const [savingError, setSavingError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const isSaving = savingState === "saving";

  const validationError = useMemo(() => validateDocumentForm(form), [form]);

  const canSave = !isSaving && !validationError;

  const loadCatalogs = useCallback(async () => {
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
    const timeoutId = window.setTimeout(() => {
      loadCatalogs();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCatalogs]);

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

  function resetForm() {
    setForm(EMPTY_DOCUMENT_FORM);
    setSavingState("idle");
    setSavingError("");
    setSuccessMsg("");
  }

  async function submit() {
    const error = validateDocumentForm(form);

    if (error) {
      setSavingState("error");
      setSavingError(error);
      return;
    }

    try {
      setSavingState("saving");
      setSavingError("");
      setSuccessMsg("");

      const payload = buildDocumentCreatePayload(form);
      await createCorpusDocument(projectId, payload);

      setSavingState("success");
      setSuccessMsg("La transcripción se guardó correctamente.");

      router.push(corpusHref);
      router.refresh();
    } catch (error) {
      setSavingState("error");

      const message =
        error?.message ?? "No se pudo guardar la transcripción.";

      setSavingError(message);
    }
  }

  return {
    form,
    sources,
    participants,
    sourceOptions,
    participantOptions,
    metrics,

    catalogStatus,
    catalogError,
    savingState,
    savingError,
    successMsg,

    isSaving,
    canSave,
    validationError,

    corpusHref,

    setField,
    resetForm,
    submit,
    reloadCatalogs: loadCatalogs,
  };
}
