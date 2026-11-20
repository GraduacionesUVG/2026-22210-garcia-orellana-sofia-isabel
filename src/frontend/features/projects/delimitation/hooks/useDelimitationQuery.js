"use client";

import { useCallback, useEffect, useState } from "react";
import { getDelimitation } from "@/features/projects/delimitation/api/delimitation.api";
import { normalizeDelimitationResponse } from "@/features/projects/delimitation/helpers/delimitation.helpers";

const EMPTY_DELIMITATION = normalizeDelimitationResponse({
  delim: {
    topic: "",
    context_place: "",
    time_period: "",
    population: "",
    resources: "",
  },
  include: [],
  exclude: [],
});

export function useDelimitationQuery(projectId) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [model, setModel] = useState(EMPTY_DELIMITATION);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadDelimitation() {
      try {
        setLoading(true);
        setLoadError("");

        if (!projectId) {
          throw new Error("No se encontró el proyecto.");
        }

        const data = await getDelimitation(projectId);
        if (!mounted) return;

        setModel(normalizeDelimitationResponse(data));
      } catch (e) {
        if (!mounted) return;
        setLoadError(e?.message ?? "Error cargando delimitación.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDelimitation();

    return () => {
      mounted = false;
    };
  }, [projectId, reloadTick]);

  return {
    loading,
    loadError,
    model,
    setModel,
    reload,
  };
}