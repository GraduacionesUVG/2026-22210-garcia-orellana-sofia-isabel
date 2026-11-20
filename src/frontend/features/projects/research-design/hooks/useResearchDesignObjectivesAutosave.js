"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useDebouncedEffect from "@/features/projects/delimitation/hooks/useDebouncedEffect";
import {
  createSpecificObjective,
  updateSpecificObjective,
} from "@/features/projects/research-design/api/researchDesign.api";
import { mergeSavedSpecificObjective } from "@/features/projects/research-design/helpers/researchDesign.helpers";

function buildObjectivesSignature(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) =>
      [
        item?.id ?? "",
        item?.text ?? "",
        item?.revision ?? 0,
        item?._temp ? "1" : "0",
        item?._dirty ? "1" : "0",
      ].join("::")
    )
    .join("||");
}

function getAutosaveCandidates(objectives = []) {
  return (Array.isArray(objectives) ? objectives : []).filter((item) => {
    const trimmed = String(item?.text ?? "").trim();

    if (item?._temp) {
      return Boolean(trimmed);
    }

    if (!item?._dirty) {
      return false;
    }

    return trimmed && trimmed !== String(item?._lastSavedText ?? "").trim();
  });
}

export function useResearchDesignObjectivesAutosave({
  projectId,
  model,
  setModel,
  loading,
  loadError,
  setSavingState,
  setSavingError,
}) {
  const latestObjectivesRef = useRef(model?.specific_objectives ?? []);
  const processingRef = useRef(false);
  const runTokenRef = useRef(0);
  const [objectiveSaveError, setObjectiveSaveError] = useState(null);

  useEffect(() => {
    latestObjectivesRef.current = Array.isArray(model?.specific_objectives)
      ? model.specific_objectives
      : [];
    setObjectiveSaveError((previous) => previous && !latestObjectivesRef.current.some(item => item.id === previous.id) ? null : previous);
  }, [model?.specific_objectives]);

  useEffect(() => { setObjectiveSaveError(null); }, [projectId, loading]);

  const objectivesSignature = useMemo(
    () => buildObjectivesSignature(model?.specific_objectives),
    [model?.specific_objectives]
  );

  useDebouncedEffect(
    async () => {
      if (loading || loadError) return;
      if (!projectId) return;
      if (processingRef.current) return;

      const candidates = getAutosaveCandidates(latestObjectivesRef.current);

      if (!candidates.length) {
        return;
      }

      const token = ++runTokenRef.current;
      processingRef.current = true;

      setSavingState("saving");
      setSavingError("");
      let savingObjectiveId = null;

      try {
        for (const candidate of candidates) {
          if (token !== runTokenRef.current) {
            return;
          }

          const liveItem = latestObjectivesRef.current.find(
            (item) => item.id === candidate.id
          );

          if (!liveItem) continue;
          savingObjectiveId = liveItem.id;

          const trimmedText = String(liveItem?.text ?? "").trim();
          if (!trimmedText) continue;

          let saved = null;
          const submittedText = trimmedText;

          if (liveItem._temp) {
            saved = await createSpecificObjective(projectId, {
              text: submittedText,
            });
          } else {
            saved = await updateSpecificObjective(projectId, liveItem.id, {
              base_revision:
                typeof liveItem?.revision === "number" ? liveItem.revision : 0,
              text: submittedText,
            });
          }

          if (!saved) continue;
          if (token !== runTokenRef.current) {
            return;
          }

          setModel((prev) =>
            mergeSavedSpecificObjective(prev, liveItem.id, submittedText, saved)
          );
        }

        if (token === runTokenRef.current) {
          setObjectiveSaveError(null);
          setSavingState("saved");
        }
      } catch (error) {
        if (token !== runTokenRef.current) {
          return;
        }

        setSavingState("error");
        const message = error?.message ?? "No se pudieron guardar los objetivos específicos.";
        setObjectiveSaveError({ id: savingObjectiveId, message });
        setSavingError(message);
      } finally {
        processingRef.current = false;
      }
    },
    [projectId, loading, loadError, objectivesSignature],
    900
  );
  return { autosaveError: objectiveSaveError?.message ?? "" };
}
