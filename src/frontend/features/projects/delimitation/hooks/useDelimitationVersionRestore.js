"use client";

import { useCallback, useState } from "react";
import { restoreDelimitationVersion } from "@/features/projects/delimitation/api/delimitation.versions.api";

export function useDelimitationVersionRestore(projectId, onRestored) {
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [restoreVersionError, setRestoreVersionError] = useState("");
  const [restoreVersionSuccess, setRestoreVersionSuccess] = useState("");

  const resetRestoreVersionState = useCallback(() => {
    setRestoreVersionError("");
    setRestoreVersionSuccess("");
  }, []);

  const submitRestoreVersion = useCallback(
    async (versionId) => {
      if (!projectId || !versionId) return null;

      try {
        setRestoringVersion(true);
        resetRestoreVersionState();

        const result = await restoreDelimitationVersion(projectId, versionId);

        setRestoreVersionSuccess("Versión restaurada correctamente.");
        await onRestored?.(result);

        return result;
      } catch (e) {
        setRestoreVersionError(e?.message ?? "No se pudo restaurar la versión.");
        throw e;
      } finally {
        setRestoringVersion(false);
      }
    },
    [onRestored, projectId, resetRestoreVersionState]
  );

  return {
    restoringVersion,
    restoreVersionError,
    restoreVersionSuccess,
    resetRestoreVersionState,
    submitRestoreVersion,
  };
}