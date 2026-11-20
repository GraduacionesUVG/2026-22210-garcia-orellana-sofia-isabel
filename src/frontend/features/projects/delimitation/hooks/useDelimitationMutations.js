"use client";

import {
  addCriteriaItem,
  deleteCriteriaItem,
} from "@/features/projects/delimitation/api/delimitation.api";
import { withDerivedDelimitationState } from "@/features/projects/delimitation/helpers/delimitation.helpers";

export function useDelimitationMutations({
  projectId,
  setModel,
  setSavingState,
  setSavingError,
}) {
  async function onAddItem(kind, text) {
    const trimmed = String(text ?? "").trim();
    if (!trimmed) return;

    try {
      setSavingError("");

      const created = await addCriteriaItem(projectId, {
        kind,
        text: trimmed,
      });

      setModel((prev) =>
        withDerivedDelimitationState({
          ...prev,
          include: kind === "include" ? [...prev.include, created] : prev.include,
          exclude: kind === "exclude" ? [...prev.exclude, created] : prev.exclude,
        })
      );

      setSavingState("saved");
    } catch (e) {
      setSavingState("error");
      setSavingError(e?.message ?? "No se pudo agregar el criterio.");
    }
  }

  async function onDeleteItem(kind, itemId) {
    try {
      setSavingError("");

      await deleteCriteriaItem(projectId, itemId);

      setModel((prev) =>
        withDerivedDelimitationState({
          ...prev,
          include:
            kind === "include"
              ? prev.include.filter((item) => item.id !== itemId)
              : prev.include,
          exclude:
            kind === "exclude"
              ? prev.exclude.filter((item) => item.id !== itemId)
              : prev.exclude,
        })
      );

      setSavingState("saved");
    } catch (e) {
      setSavingState("error");
      setSavingError(e?.message ?? "No se pudo eliminar el criterio.");
    }
  }

  function updateField(name, value) {
    setModel((prev) =>
      withDerivedDelimitationState({
        ...prev,
        [name]: value,
      })
    );
  }

  return {
    onAddItem,
    onDeleteItem,
    updateField,
  };
}