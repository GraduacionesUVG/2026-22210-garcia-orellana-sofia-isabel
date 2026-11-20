"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createSampleConfigVersion,
  getSampleConfigVersions,
  restoreSampleConfigVersion,
} from "@/features/projects/sample-config/api/sampleConfig.versions.api";

export function useSampleConfigVersions({
  projectId,
  reload,
  saveCurrent,
  isDirty,
  isReady,
  onApplyRestoredData,
}) {
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsStatus, setVersionsStatus] = useState("idle");
  const [versionsError, setVersionsError] = useState("");
  const [versions, setVersions] = useState([]);

  const [selectedVersionId, setSelectedVersionId] = useState(null);

  const [versionActionState, setVersionActionState] = useState("idle");
  const [versionActionError, setVersionActionError] = useState("");
  const [restoringVersionId, setRestoringVersionId] = useState(null);

  const loadVersions = useCallback(
    async ({ silent = false } = {}) => {
      if (!projectId) return [];

      if (!silent) {
        setVersionsStatus("loading");
        setVersionsError("");
      }

      try {
        const data = await getSampleConfigVersions(projectId);
        const safeData = Array.isArray(data) ? data : [];
        setVersions(safeData);
        setVersionsStatus("success");
        setVersionsError("");
        return safeData;
      } catch (error) {
        setVersionsStatus("error");
        setVersionsError(
          error?.message || "No se pudieron cargar las versiones."
        );
        throw error;
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (!versionsOpen || versionsStatus !== "idle") return;
    loadVersions().catch(() => {});
  }, [versionsOpen, versionsStatus, loadVersions]);

  useEffect(() => {
    if (!versions.length) {
      setSelectedVersionId(null);
      return;
    }

    const stillExists = versions.some((item) => item.id === selectedVersionId);

    if (!selectedVersionId || !stillExists) {
      setSelectedVersionId(versions[0].id);
    }
  }, [versions, selectedVersionId]);

  const selectedVersion = useMemo(() => {
    if (!versions.length) return null;
    return versions.find((item) => item.id === selectedVersionId) || versions[0];
  }, [versions, selectedVersionId]);

  const openVersions = useCallback(() => {
    setVersionsOpen(true);
  }, []);

  const closeVersions = useCallback(() => {
    setVersionsOpen(false);
  }, []);

  const toggleVersionsOpen = useCallback(() => {
    setVersionsOpen((prev) => !prev);
  }, []);

  const createVersionCurrent = useCallback(async ({ label = "" } = {}) => {
    if (!projectId || !isReady) return null;

    setVersionActionState("saving");
    setVersionActionError("");

    try {
      if (isDirty) {
        await saveCurrent();
      }

      const created = await createSampleConfigVersion(projectId, {
        label: String(label ?? "").trim() || null,
      });
      await loadVersions({ silent: true });
      setSelectedVersionId(created?.id ?? null);
      setVersionsOpen(true);
      setVersionActionState("success");
      return created;
    } catch (error) {
      setVersionActionState("error");
      setVersionActionError(
        error?.message || "No se pudo guardar la versión."
      );
      throw error;
    }
  }, [projectId, isReady, isDirty, saveCurrent, loadVersions]);

  const restoreVersionCurrent = useCallback(
    async (versionId) => {
      if (!projectId || !versionId) return null;

      setVersionActionState("restoring");
      setVersionActionError("");
      setRestoringVersionId(versionId);

      try {
        const restored = await restoreSampleConfigVersion(projectId, versionId, {
          create_backup_of_current: true,
        });

        if (restored?.current && onApplyRestoredData) {
          onApplyRestoredData(restored.current);
        } else {
          await reload();
        }

        await loadVersions({ silent: true });

        setVersionActionState("success");
        setRestoringVersionId(null);
        return restored;
      } catch (error) {
        setVersionActionState("error");
        setVersionActionError(
          error?.message || "No se pudo restaurar la versión."
        );
        setRestoringVersionId(null);
        throw error;
      }
    },
    [projectId, reload, loadVersions, onApplyRestoredData]
  );

  const resetVersionFeedback = useCallback(() => {
    setVersionActionState("idle");
    setVersionActionError("");
  }, []);

  return {
    versionsOpen,
    openVersions,
    closeVersions,
    toggleVersionsOpen,

    versionsStatus,
    versionsError,
    versions,
    loadVersions,

    selectedVersionId,
    setSelectedVersionId,
    selectedVersion,

    versionActionState,
    versionActionError,
    restoringVersionId,

    createVersionCurrent,
    restoreVersionCurrent,
    resetVersionFeedback,
  };
}
