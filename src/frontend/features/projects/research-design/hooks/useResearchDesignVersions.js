"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createResearchDesignVersion,
  getResearchDesignVersions,
  restoreResearchDesignVersion,
} from "@/features/projects/research-design/api/researchDesign.versions.api";
import { normalizeResearchDesignVersionsResponse } from "@/features/projects/research-design/helpers/researchDesignVersions.helpers";

export function useResearchDesignVersions({ projectId, reload }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openMode, setOpenMode] = useState("browse");

  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versionsError, setVersionsError] = useState("");

  const [selectedVersionId, setSelectedVersionId] = useState(null);

  const [createVersionLoading, setCreateVersionLoading] = useState(false);
  const [createVersionError, setCreateVersionError] = useState("");

  const [restoringVersionId, setRestoringVersionId] = useState(null);
  const [restoreError, setRestoreError] = useState("");

  const refreshVersions = useCallback(async () => {
    if (!projectId) return [];

    try {
      setLoadingVersions(true);
      setVersionsError("");

      const raw = await getResearchDesignVersions(projectId);
      const normalized = normalizeResearchDesignVersionsResponse(raw);

      setVersions(normalized);
      setSelectedVersionId((prev) => {
        if (prev && normalized.some((item) => item.id === prev)) {
          return prev;
        }

        return normalized[0]?.id ?? null;
      });

      return normalized;
    } catch (error) {
      setVersionsError(error?.message ?? "No se pudieron cargar las versiones.");
      return [];
    } finally {
      setLoadingVersions(false);
    }
  }, [projectId]);

  const openVersionsModal = useCallback(
    async (mode = "browse") => {
      setOpenMode(mode);
      setIsOpen(true);
      setRestoreError("");
      setCreateVersionError("");
      await refreshVersions();
    },
    [refreshVersions]
  );

  const closeVersionsModal = useCallback(() => {
    setIsOpen(false);
    setOpenMode("browse");
    setCreateVersionError("");
    setRestoreError("");
  }, []);

  const createVersion = useCallback(
    async ({ label }) => {
      if (!projectId) return null;

      try {
        setCreateVersionLoading(true);
        setCreateVersionError("");

        const created = await createResearchDesignVersion(projectId, {
          label,
        });

        const refreshed = await refreshVersions();

        if (created?.id) {
          setSelectedVersionId(created.id);
        } else if (refreshed[0]?.id) {
          setSelectedVersionId(refreshed[0].id);
        }

        setOpenMode("browse");
        return created;
      } catch (error) {
        setCreateVersionError(error?.message ?? "No se pudo crear la versión.");
        return null;
      } finally {
        setCreateVersionLoading(false);
      }
    },
    [projectId, refreshVersions]
  );

  const restoreVersion = useCallback(
    async (versionId) => {
      if (!projectId || !versionId) return false;

      try {
        setRestoringVersionId(versionId);
        setRestoreError("");

        await restoreResearchDesignVersion(projectId, versionId);

        if (typeof reload === "function") {
          await reload();
        }

        await refreshVersions();
        closeVersionsModal();
        return true;
      } catch (error) {
        setRestoreError(error?.message ?? "No se pudo restaurar la versión.");
        return false;
      } finally {
        setRestoringVersionId(null);
      }
    },
    [projectId, reload, refreshVersions, closeVersionsModal]
  );

  const selectedVersion = useMemo(
    () => versions.find((item) => item.id === selectedVersionId) ?? null,
    [versions, selectedVersionId]
  );

  return {
    isOpen,
    openMode,
    versions,
    loadingVersions,
    versionsError,
    selectedVersionId,
    selectedVersion,
    setSelectedVersionId,
    openVersionsModal,
    closeVersionsModal,
    refreshVersions,
    createVersion,
    createVersionLoading,
    createVersionError,
    restoreVersion,
    restoringVersionId,
    restoreError,
  };
}