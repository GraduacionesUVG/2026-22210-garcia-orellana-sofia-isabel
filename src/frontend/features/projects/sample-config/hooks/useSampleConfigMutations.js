"use client";

import { useCallback, useState } from "react";
import { updateSampleConfig } from "@/features/projects/sample-config/api/sampleConfig.api";

export function useSampleConfigMutations() {
  const [savingState, setSavingState] = useState("idle");
  const [savingError, setSavingError] = useState("");

  const resetSaveFeedback = useCallback(() => {
    setSavingState("idle");
    setSavingError("");
  }, []);

  const saveSampleConfig = useCallback(async (projectId, payload) => {
    setSavingState("saving");
    setSavingError("");

    try {
      const data = await updateSampleConfig(projectId, payload);
      setSavingState("success");
      setSavingError("");
      return data;
    } catch (error) {
      if (error?.status === 409) {
        setSavingState("conflict");
        setSavingError(
          "Hubo un conflicto de revisión. Recargamos la versión más reciente del servidor para evitar sobrescribir cambios."
        );
      } else {
        setSavingState("error");
        setSavingError(
          error?.message ||
            "No se pudo guardar la configuración de muestra."
        );
      }

      throw error;
    }
  }, []);

  return {
    savingState,
    savingError,
    saveSampleConfig,
    resetSaveFeedback,
  };
}