"use client";

import { useResearchDesignQuery } from "@/features/projects/research-design/hooks/useResearchDesignQuery";
import { useResearchDesignAutosave } from "@/features/projects/research-design/hooks/useResearchDesignAutosave";
import { useResearchDesignObjectivesAutosave } from "@/features/projects/research-design/hooks/useResearchDesignObjectivesAutosave";
import { useResearchDesignMutations } from "@/features/projects/research-design/hooks/useResearchDesignMutations";

export function useResearchDesignPage(projectId) {
  const {
    loading,
    loadError,
    model,
    setModel,
    reload,
  } = useResearchDesignQuery(projectId);

  const {
    savingState,
    savingError,
    setSavingState,
    setSavingError,
    autosaveError,
  } = useResearchDesignAutosave({
    projectId,
    model,
    setModel,
    loading,
    loadError,
  });

  const {
    updateField,
    onAddSpecificObjective,
    onDeleteSpecificObjective,
    onUpdateSpecificObjective,
  } = useResearchDesignMutations({
    projectId,
    model,
    setModel,
    setSavingState,
    setSavingError,
  });

  const objectivesAutosave = useResearchDesignObjectivesAutosave({
    projectId,
    model,
    setModel,
    loading,
    loadError,
    setSavingState,
    setSavingError,
  });

  const savingErrors = [...new Set([autosaveError, objectivesAutosave.autosaveError].filter(Boolean))];
  if (!savingErrors.length && savingState === "error" && savingError) savingErrors.push(savingError);

  return {
    projectId,
    loading,
    loadError,
    savingState: savingErrors.length && savingState !== "saving" ? "error" : savingState,
    savingError: savingErrors[0] || savingError,
    savingErrors,
    model,
    setModel,
    updateField,
    onAddSpecificObjective,
    onDeleteSpecificObjective,
    onUpdateSpecificObjective,
    reload,
  };
}
