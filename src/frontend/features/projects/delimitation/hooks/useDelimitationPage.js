"use client";

import { useDelimitationQuery } from "@/features/projects/delimitation/hooks/useDelimitationQuery";
import { useDelimitationAutosave } from "@/features/projects/delimitation/hooks/useDelimitationAutosave";
import { useDelimitationMutations } from "@/features/projects/delimitation/hooks/useDelimitationMutations";

export function useDelimitationPage(projectId) {
  const {
    loading,
    loadError,
    model,
    setModel,
    reload,
  } = useDelimitationQuery(projectId);

  const {
    savingState,
    savingError,
    setSavingState,
    setSavingError,
  } = useDelimitationAutosave({
    projectId,
    model,
    setModel,
    loading,
    loadError,
  });

  const {
    onAddItem,
    onDeleteItem,
    updateField,
  } = useDelimitationMutations({
    projectId,
    setModel,
    setSavingState,
    setSavingError,
  });

  return {
    projectId,
    loading,
    loadError,
    savingState,
    savingError,
    model,
    setModel,
    updateField,
    onAddItem,
    onDeleteItem,
    reload,
  };
}