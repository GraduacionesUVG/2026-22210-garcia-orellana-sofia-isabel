"use client";

import { useEffect, useRef, useState } from "react";
import useDebouncedEffect from "@/features/projects/delimitation/hooks/useDebouncedEffect";
import { saveDelimitation } from "@/features/projects/delimitation/api/delimitation.api";
import { withDerivedDelimitationState } from "@/features/projects/delimitation/helpers/delimitation.helpers";

function pickDraft(model) {
  return {
    topic: model.topic ?? "",
    context_place: model.context_place ?? "",
    time_period: model.time_period ?? "",
    population: model.population ?? "",
    resources: model.resources ?? "",
  };
}

function mergeServerResponseSafely(prev, submittedDraft, saved) {
  return withDerivedDelimitationState({
    ...prev,
    topic:
      prev.topic === submittedDraft.topic
        ? (saved?.topic ?? prev.topic)
        : prev.topic,
    context_place:
      prev.context_place === submittedDraft.context_place
        ? (saved?.context_place ?? prev.context_place)
        : prev.context_place,
    time_period:
      prev.time_period === submittedDraft.time_period
        ? (saved?.time_period ?? prev.time_period)
        : prev.time_period,
    population:
      prev.population === submittedDraft.population
        ? (saved?.population ?? prev.population)
        : prev.population,
    resources:
      prev.resources === submittedDraft.resources
        ? (saved?.resources ?? prev.resources)
        : prev.resources,

    revision:
      typeof saved?.revision === "number"
        ? saved.revision
        : (prev.revision ?? 0),

    created_at: saved?.created_at ?? prev.created_at ?? null,
    updated_at: saved?.updated_at ?? prev.updated_at ?? null,
    created_by: saved?.created_by ?? prev.created_by ?? null,
    updated_by: saved?.updated_by ?? prev.updated_by ?? null,
  });
}

export function useDelimitationAutosave({
  projectId,
  model,
  setModel,
  loading,
  loadError,
}) {
  const [savingState, setSavingState] = useState("idle");
  const [savingError, setSavingError] = useState("");
  const [autosaveError, setAutosaveError] = useState("");

  const latestModelRef = useRef(model);
  const saveTokenRef = useRef(0);

  useEffect(() => {
    latestModelRef.current = model;
  }, [model]);

  useEffect(() => { setAutosaveError(""); }, [projectId, loading]);

  useDebouncedEffect(
    async () => {
      if (loading || loadError) return;
      if (!projectId) return;

      const currentModel = latestModelRef.current;
      const initialDraft = pickDraft(currentModel);
      const initialRevision =
        typeof currentModel?.revision === "number" ? currentModel.revision : 0;

      const hasSomethingToSave = Object.values(initialDraft).some(
        (value) => String(value ?? "").trim() !== ""
      );

      if (!hasSomethingToSave && initialRevision === 0) {
        return;
      }

      const token = ++saveTokenRef.current;

      setSavingState("saving");
      setSavingError("");

      try {
                                                                                 
                                                                               
        const submittedDraft = initialDraft;
        const saved = await saveDelimitation(projectId, {
          base_revision: initialRevision,
          ...submittedDraft,
        });

        if (token !== saveTokenRef.current) {
          return;
        }

        setModel((prev) => mergeServerResponseSafely(prev, submittedDraft, saved));
        setAutosaveError("");
        setSavingState("saved");
      } catch (e) {
        if (token !== saveTokenRef.current) {
          return;
        }

        setSavingState("error");
        const message = e?.message ?? "No se pudo guardar.";
        setAutosaveError(message);
        setSavingError(message);
      }
    },
    [
      projectId,
      loading,
      loadError,
      model.topic,
      model.context_place,
      model.time_period,
      model.population,
      model.resources,
    ],
    900
  );

  return {
    savingState: autosaveError && savingState !== "saving" ? "error" : savingState,
    savingError: autosaveError || savingError,
    autosaveError,
    setSavingState,
    setSavingError,
  };
}
