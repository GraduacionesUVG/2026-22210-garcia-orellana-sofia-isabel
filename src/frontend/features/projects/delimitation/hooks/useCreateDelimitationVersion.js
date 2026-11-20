"use client";

import { useCallback, useState } from "react";
import { createDelimitationVersion } from "@/features/projects/delimitation/api/delimitation.versions.api";

export function useCreateDelimitationVersion(projectId, onCreated) {
  const [label, setLabel] = useState("");
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [createVersionError, setCreateVersionError] = useState("");
  const [createVersionInfo, setCreateVersionInfo] = useState("");
  const [createVersionSuccess, setCreateVersionSuccess] = useState("");

  const resetCreateVersionState = useCallback(() => {
    setCreateVersionError("");
    setCreateVersionInfo("");
    setCreateVersionSuccess("");
  }, []);

  const submitCreateVersion = useCallback(async () => {
    if (!projectId) return null;

    try {
      setCreatingVersion(true);
      resetCreateVersionState();

      const result = await createDelimitationVersion(projectId, {
        label: label.trim() || null,
      });

      if (result?.created) {
        setCreateVersionSuccess(
          `Versión v${result?.version?.version_number ?? ""} guardada correctamente.`
        );
        setLabel("");
      } else if (result?.reason === "duplicate_snapshot") {
        setCreateVersionInfo(
          "No se creó una nueva versión porque no hay cambios desde la última guardada."
        );
      }

      await onCreated?.(result);
      return result;
    } catch (e) {
      setCreateVersionError(e?.message ?? "No se pudo guardar la versión.");
      throw e;
    } finally {
      setCreatingVersion(false);
    }
  }, [label, onCreated, projectId, resetCreateVersionState]);

  return {
    label,
    setLabel,
    creatingVersion,
    createVersionError,
    createVersionInfo,
    createVersionSuccess,
    resetCreateVersionState,
    submitCreateVersion,
  };
}