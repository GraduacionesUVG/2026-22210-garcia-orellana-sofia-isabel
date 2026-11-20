"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchDelimitationVersionDetail } from "@/features/projects/delimitation/api/delimitation.versions.api";

export function useDelimitationVersionDetail(projectId, versionId, enabled = true) {
  const [versionDetail, setVersionDetail] = useState(null);
  const [loadingVersionDetail, setLoadingVersionDetail] = useState(false);
  const [versionDetailError, setVersionDetailError] = useState("");

  const reloadVersionDetail = useCallback(async () => {
    if (!enabled || !projectId || !versionId) {
      setVersionDetail(null);
      return null;
    }

    try {
      setLoadingVersionDetail(true);
      setVersionDetailError("");

      const data = await fetchDelimitationVersionDetail(projectId, versionId);
      setVersionDetail(data);
      return data;
    } catch (e) {
      setVersionDetail(null);
      setVersionDetailError(e?.message ?? "No se pudo cargar el detalle.");
      return null;
    } finally {
      setLoadingVersionDetail(false);
    }
  }, [enabled, projectId, versionId]);

  useEffect(() => {
    reloadVersionDetail();
  }, [reloadVersionDetail]);

  return {
    versionDetail,
    loadingVersionDetail,
    versionDetailError,
    reloadVersionDetail,
  };
}