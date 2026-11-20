"use client";

import { deleteSpecificObjective } from "@/features/projects/research-design/api/researchDesign.api";
import {
  appendLocalSpecificObjective,
  markSpecificObjectiveDirty,
  removeSpecificObjectiveById,
  withDerivedResearchDesignState,
} from "@/features/projects/research-design/helpers/researchDesign.helpers";

export function useResearchDesignMutations({
  projectId,
  model,
  setModel,
  setSavingState,
  setSavingError,
}) {
  function updateField(name, value) {
    setModel((prev) =>
      withDerivedResearchDesignState({
        ...prev,
        [name]: value,
      })
    );
  }

  function onAddSpecificObjective() {
    setModel((prev) => appendLocalSpecificObjective(prev));
  }

  async function onDeleteSpecificObjective(objectiveId) {
    const current = (model?.specific_objectives ?? []).find(
      (item) => item.id === objectiveId
    );

    if (!current) return;

    if (current?._temp) {
      setModel((prev) => removeSpecificObjectiveById(prev, objectiveId));
      return;
    }

    try {
      setSavingState("saving");
      setSavingError("");

      await deleteSpecificObjective(projectId, objectiveId);

      setModel((prev) => removeSpecificObjectiveById(prev, objectiveId));
      setSavingState("saved");
    } catch (error) {
      setSavingState("error");
      setSavingError(
        error?.message ?? "No se pudo eliminar el objetivo específico."
      );
    }
  }

  function onUpdateSpecificObjective(objectiveId, text) {
    setModel((prev) => markSpecificObjectiveDirty(prev, objectiveId, text));
  }

  return {
    updateField,
    onAddSpecificObjective,
    onDeleteSpecificObjective,
    onUpdateSpecificObjective,
  };
}