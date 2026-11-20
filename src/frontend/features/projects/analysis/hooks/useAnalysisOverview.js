"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAnalysisDashboard,
} from "@/features/projects/analysis/api/analysis.api";
import { normalizeAnalysisDashboardPayload } from "@/features/projects/analysis/helpers/analysis.helpers";

export function useAnalysisOverview(projectId) {
  const [overview, setOverview] = useState(null);
  const [codeStats, setCodeStats] = useState([]);
  const [codes, setCodes] = useState([]);
  const [codeRelationships, setCodeRelationships] = useState([]);
  const [documentPatterns, setDocumentPatterns] = useState({
    documents: [],
    patterns: [],
  });
  const [groupComparisons, setGroupComparisons] = useState({
    attribute: "sample_group",
    groups: [],
    rows: [],
  });
  const [uncodedSegments, setUncodedSegments] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadOverview = useCallback(
    async ({ soft = false } = {}) => {
      if (!projectId) return;

      try {
        if (soft) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMsg("");

        const dashboardJson = await getAnalysisDashboard(projectId);
        const snapshot = normalizeAnalysisDashboardPayload(dashboardJson);

        setOverview(snapshot.overview);
        setCodeStats(snapshot.codeStats);
        setCodes(snapshot.codes);
        setUncodedSegments(snapshot.uncodedSegments);
        setInsights(snapshot.insights);
        setCodeRelationships(snapshot.codeRelationships);
        setDocumentPatterns(snapshot.documentPatterns);
        setGroupComparisons(snapshot.groupComparisons);
      } catch (error) {
        setErrorMsg(
          error?.message ?? "No se pudo cargar el resumen de análisis."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const hasUncodedSegments = uncodedSegments.length > 0;

  const stats = useMemo(
    () => ({
      overview,
      codeStats,
      codes,
      codeRelationships,
      documentPatterns,
      groupComparisons,
      uncodedSegments,
      insights,
    }),
    [
      overview,
      codeStats,
      codes,
      codeRelationships,
      documentPatterns,
      groupComparisons,
      uncodedSegments,
      insights,
    ]
  );

  return {
    overview,
    codeStats,
    codes,
    codeRelationships,
    documentPatterns,
    groupComparisons,
    uncodedSegments,
    insights,
    stats,
    loading,
    refreshing,
    errorMsg,
    hasUncodedSegments,
    reload: () => loadOverview({ soft: true }),
  };
}
