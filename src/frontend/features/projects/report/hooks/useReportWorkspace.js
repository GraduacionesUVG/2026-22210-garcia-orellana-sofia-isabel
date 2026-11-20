"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProjectWorkflow } from "@/features/projects/workspace/api/projectWorkflow.api";
import {
  getAnalysisDashboard,
  getAllAnalysisInsights,
  getAllAnalysisMemos,
} from "@/features/projects/analysis/api/analysis.api";
import { normalizeAnalysisDashboardPayload } from "@/features/projects/analysis/helpers/analysis.helpers";

const EMPTY_REPORT_DATA = {
  workflow: {
    progress: 0,
    phases: [],
    phaseMap: {},
    evidence: {},
  },
  overview: null,
  memos: [],
  insights: [],
};

function getArray(json, key) {
  return Array.isArray(json?.[key]) ? json[key] : [];
}

function getFriendlyReportError(error) {
  const message = String(error?.message ?? "").trim();
  if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
    return "No tienes acceso a los datos del reporte. Vuelve a iniciar sesión e inténtalo de nuevo.";
  }

  return message || "No se pudo cargar la síntesis del proyecto.";
}

export function useReportWorkspace(projectId) {
  const requestRef = useRef(0);
  const abortRef = useRef(null);
  const [data, setData] = useState(EMPTY_REPORT_DATA);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async ({ soft = false } = {}) => {
      const requestId = ++requestRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      if (!projectId) {
        setData(EMPTY_REPORT_DATA);
        setLoading(false);
        return;
      }

      try {
        if (soft) setRefreshing(true);
        else setLoading(true);

        setError("");
        const results = await Promise.allSettled([
            getProjectWorkflow(projectId),
            getAnalysisDashboard(projectId),
            getAllAnalysisMemos(projectId, {
              include_deleted: false,
            }, { signal: controller.signal }),
            getAllAnalysisInsights(projectId, {
              include_deleted: false,
              include_links: true,
            }, { signal: controller.signal }),
          ]);

        if (requestId !== requestRef.current || controller.signal.aborted) return;
        const [workflowResult, dashboardResult, memosResult, insightsResult] =
          results;
        const failedCount = results.filter(
          (result) => result.status === "rejected"
        ).length;

        if (failedCount === results.length) {
          throw new Error(getFriendlyReportError(workflowResult.reason));
        }

        const workflowJson =
          workflowResult.status === "fulfilled" ? workflowResult.value : null;
        const dashboardJson =
          dashboardResult.status === "fulfilled" ? dashboardResult.value : null;
        const memosJson =
          memosResult.status === "fulfilled" ? memosResult.value : null;
        const insightsJson =
          insightsResult.status === "fulfilled" ? insightsResult.value : null;
        const dashboard = normalizeAnalysisDashboardPayload(dashboardJson ?? {});
        setData({
          workflow: workflowJson?.workflow ?? EMPTY_REPORT_DATA.workflow,
          overview: dashboard.overview,
          memos: getArray(memosJson, "memos"),
          insights: getArray(insightsJson, "insights"),
        });
        if (failedCount > 0) {
          setError("Algunas fuentes del reporte no están disponibles. Puedes reintentar.");
        }
      } catch (loadError) {
        if (requestId === requestRef.current && !controller.signal.aborted) setError(getFriendlyReportError(loadError));
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [projectId]
  );

  useEffect(() => {
    setData(EMPTY_REPORT_DATA);
    load();
    return () => { requestRef.current++; abortRef.current?.abort(); };
  }, [load]);

  return {
    ...data,
    loading,
    refreshing,
    error,
    reload: () => load({ soft: true }),
  };
}
