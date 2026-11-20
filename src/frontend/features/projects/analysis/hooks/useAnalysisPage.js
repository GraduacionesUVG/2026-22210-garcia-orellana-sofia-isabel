"use client";

import { useMemo } from "react";
import {
  getAnalysisCodesHref,
  getAnalysisHref,
  getAnalysisInsightsHref,
  getAnalysisMemosHref,
  getAnalysisSegmentsHref,
} from "@/features/projects/analysis/helpers/analysis.helpers";

export function useAnalysisPage(projectId) {
  const routes = useMemo(
    () => ({
      analysisHref: getAnalysisHref(projectId),
      segmentsHref: getAnalysisSegmentsHref(projectId),
      codesHref: getAnalysisCodesHref(projectId),
      memosHref: getAnalysisMemosHref(projectId),
      insightsHref: getAnalysisInsightsHref(projectId),
    }),
    [projectId]
  );

  const workflowItems = useMemo(
    () => [
      {
        title: "Segmentos",
        description:
          "Revisa las unidades de evidencia antes de organizarlas e interpretarlas.",
        state: "Activo",
      },
      {
        title: "Codificación",
        description:
          "Asigna códigos a segmentos y marca citas textuales que sostienen ideas importantes.",
        state: "Activo",
      },
      {
        title: "Memos",
        description:
          "Registra interpretaciones, dudas metodológicas y reflexiones de campo mientras avanzas.",
        state: "Activo",
      },
      {
        title: "Hallazgos",
        description:
          "Sintetiza patrones respaldados por evidencia y vuelve al ciclo cuando haga falta.",
        state: "En progreso",
      },
    ],
    []
  );

  return {
    projectId,
    routes,
    workflowItems,
  };
}
