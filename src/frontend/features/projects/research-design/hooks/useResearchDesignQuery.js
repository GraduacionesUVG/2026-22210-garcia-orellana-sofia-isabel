"use client";

import { useCallback, useEffect, useState } from "react";
import { getResearchDesign } from "@/features/projects/research-design/api/researchDesign.api";
import {
  buildResearchDesignPersistedSignature,
  EMPTY_RESEARCH_DESIGN,
  normalizeResearchDesignLoadResponse,
} from "@/features/projects/research-design/helpers/researchDesign.helpers";

export function useResearchDesignQuery(projectId) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [model, setModel] = useState(EMPTY_RESEARCH_DESIGN);
  const [initialEvaluation, setInitialEvaluation] = useState(null);
  const [initialEvaluationSignature, setInitialEvaluationSignature] =
    useState("");
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadResearchDesign() {
      try {
        setLoading(true);
        setLoadError("");

        if (!projectId) {
          throw new Error("No se encontró el proyecto.");
        }

        const data = await getResearchDesign(projectId);

        if (!mounted) return;
        const normalized = normalizeResearchDesignLoadResponse(data);
        setModel(normalized.model);
        setInitialEvaluation(normalized.evaluation);
        setInitialEvaluationSignature(
          normalized.evaluation
            ? buildResearchDesignPersistedSignature(normalized.model)
            : ""
        );
      } catch (error) {
        if (!mounted) return;
        setLoadError(
          error?.message ?? "Error cargando el diseño de investigación."
        );
        setInitialEvaluation(null);
        setInitialEvaluationSignature("");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadResearchDesign();

    return () => {
      mounted = false;
    };
  }, [projectId, reloadTick]);

  return {
    loading,
    loadError,
    model,
    setModel,
    initialEvaluation,
    initialEvaluationSignature,
    reload,
  };
}
