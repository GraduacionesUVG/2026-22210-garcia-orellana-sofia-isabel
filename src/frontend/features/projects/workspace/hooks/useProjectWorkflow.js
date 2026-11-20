"use client";

import { useCallback, useEffect, useState } from "react";
import { getProjectWorkflow } from "@/features/projects/workspace/api/projectWorkflow.api";

const EMPTY_WORKFLOW = {
  progress: 0,
  phases: [],
  phaseMap: {},
  evidence: {},
};

export function useProjectWorkflow(projectId) {
  const [workflow, setWorkflow] = useState(EMPTY_WORKFLOW);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [error, setError] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!projectId) {
      setWorkflow(EMPTY_WORKFLOW);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await getProjectWorkflow(projectId, controller.signal);
        setWorkflow(response?.workflow ?? EMPTY_WORKFLOW);
      } catch (loadError) {
        if (loadError?.name === "AbortError") return;
        setError(
          loadError?.message ?? "No se pudo cargar el avance del proyecto."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [projectId, refreshIndex]);

  const refresh = useCallback(() => {
    setRefreshIndex((value) => value + 1);
  }, []);

  return { workflow, loading, error, refresh };
}
