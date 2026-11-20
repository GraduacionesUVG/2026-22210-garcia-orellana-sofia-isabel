"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchDelimitationVersions } from "@/features/projects/delimitation/api/delimitation.versions.api";

export function useDelimitationVersions(projectId) {
  const [isOpen, setIsOpen] = useState(false);
  const [openMode, setOpenMode] = useState("browse");
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versionsError, setVersionsError] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState(null);

  const refreshVersions = useCallback(async () => {
    if (!projectId) return [];

    try {
      setLoadingVersions(true);
      setVersionsError("");

      const data = await fetchDelimitationVersions(projectId);
      setVersions(data);

      setSelectedVersionId((prev) => {
        if (prev && data.some((item) => item.id === prev)) {
          return prev;
        }

        return data[0]?.id ?? null;
      });

      return data;
    } catch (e) {
      setVersions([]);
      setVersionsError(e?.message ?? "No se pudo cargar el historial.");
      return [];
    } finally {
      setLoadingVersions(false);
    }
  }, [projectId]);

  const openVersionsModal = useCallback(
    async (mode = "browse") => {
      setOpenMode(mode);
      setIsOpen(true);
      await refreshVersions();
    },
    [refreshVersions]
  );

  const closeVersionsModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    refreshVersions();
  }, [isOpen, projectId, refreshVersions]);

  return {
    isOpen,
    openMode,
    versions,
    loadingVersions,
    versionsError,
    selectedVersionId,
    setSelectedVersionId,
    openVersionsModal,
    closeVersionsModal,
    refreshVersions,
  };
}