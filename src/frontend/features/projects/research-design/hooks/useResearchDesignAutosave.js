"use client";

import { useEffect, useRef, useState } from "react";
import useDebouncedEffect from "@/features/projects/delimitation/hooks/useDebouncedEffect";
import { saveResearchDesign } from "@/features/projects/research-design/api/researchDesign.api";
import { mergeServerResearchDesignSafely } from "@/features/projects/research-design/helpers/researchDesign.helpers";

function pickDraft(model) {
  return {
    research_question: model?.research_question ?? "",
    general_objective: model?.general_objective ?? "",
  };
}

export function useResearchDesignAutosave({
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
        const saved = await saveResearchDesign(projectId, {
          base_revision: initialRevision,
          ...submittedDraft,
        });

        if (token !== saveTokenRef.current) {
          return;
        }

        setModel((prev) =>
          mergeServerResearchDesignSafely(prev, submittedDraft, saved)
        );
        setAutosaveError("");
        setSavingState("saved");
      } catch (error) {
        if (token !== saveTokenRef.current) {
          return;
        }

        setSavingState("error");
        const message = error?.message ?? "No se pudo guardar.";
        setAutosaveError(message);
        setSavingError(message);
      }
    },
    [
      projectId,
      loading,
      loadError,
      model?.research_question,
      model?.general_objective,
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
