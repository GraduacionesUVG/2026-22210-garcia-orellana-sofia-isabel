"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCorpusDocumentVersion,
  getCorpusDocumentVersion,
  getCorpusDocumentVersions,
  restoreCorpusDocumentVersion,
} from "@/features/projects/corpus/api/corpus.api";

function getVersionsPayload(json) {
  return Array.isArray(json?.versions) ? json.versions : [];
}

function getFriendlyVersionError(error) {
  const message = String(error?.message ?? "");

  if (message.includes("DOCUMENT_REVISION_CONFLICT")) {
    return "Este documento fue modificado desde que lo cargaste. Recarga antes de restaurar una versión.";
  }

  if (message.includes("DOCUMENT_VERSION_NOT_FOUND")) {
    return "No se encontró la versión seleccionada.";
  }

  if (message.includes("DOCUMENT_NOT_FOUND")) {
    return "No se encontró el documento.";
  }

  return error?.message ?? "No se pudo completar la acción.";
}

export function useCorpusDocumentVersions({
  projectId,
  documentId,
  documentRevision,
  enabled = true,
  onRestored,
}) {
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const [label, setLabel] = useState("");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadingVersionId, setLoadingVersionId] = useState("");
  const [restoringVersionId, setRestoringVersionId] = useState("");

  const [versionsError, setVersionsError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState("");

  const versionCountLabel = useMemo(() => {
    if (versions.length === 1) return "1 versión";
    return `${versions.length} versiones`;
  }, [versions.length]);

  const hasVersions = versions.length > 0;

  const loadVersions = useCallback(
    async ({ soft = false } = {}) => {
      if (!enabled || !projectId || !documentId) return;

      try {
        if (soft) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setVersionsError("");

        const json = await getCorpusDocumentVersions(projectId, documentId, {
          limit: 50,
          offset: 0,
        });

        const nextVersions = getVersionsPayload(json);
        setVersions(nextVersions);
        setSelectedVersionId((currentId) =>
          currentId && nextVersions.some((version) => version.id === currentId)
            ? currentId
            : null
        );
        setSelectedVersion((currentVersion) =>
          currentVersion &&
          nextVersions.some((version) => version.id === currentVersion.id)
            ? currentVersion
            : null
        );
      } catch (error) {
        setVersionsError(
          error?.message ?? "No se pudieron cargar las versiones del documento."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled, projectId, documentId]
  );

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  async function createVersion({ label: nextLabel } = {}) {
    if (!projectId || !documentId) return;

    try {
      setCreating(true);
      setCreateError("");
      setCreateSuccess("");

      await createCorpusDocumentVersion(projectId, documentId, {
        label: String(nextLabel ?? label).trim() || null,
        trigger_type: "manual",
      });

      setLabel("");
      setCreateSuccess("La versión se guardó correctamente.");

      await loadVersions({ soft: true });
      return true;
    } catch (error) {
      setCreateError(getFriendlyVersionError(error));
      return false;
    } finally {
      setCreating(false);
    }
  }

  const selectVersion = useCallback(
    async (versionId) => {
      if (!projectId || !documentId || !versionId) return;

      try {
        setSelectedVersionId(versionId);
        setLoadingVersionId(versionId);
        setDetailError("");

        const json = await getCorpusDocumentVersion(
          projectId,
          documentId,
          versionId
        );

        setSelectedVersion(json?.version ?? null);
        return true;
      } catch (error) {
        setSelectedVersion(null);
        setDetailError(getFriendlyVersionError(error));
        return false;
      } finally {
        setLoadingVersionId("");
      }
    },
    [documentId, projectId]
  );

  useEffect(() => {
    if (!enabled || loading || selectedVersionId || !versions.length) return;

    selectVersion(versions[0].id);
  }, [enabled, loading, selectVersion, selectedVersionId, versions]);

  function clearSelectedVersion() {
    setSelectedVersionId(null);
    setSelectedVersion(null);
  }

  async function restoreVersion(versionId) {
    if (!projectId || !documentId || !versionId) return;

    try {
      setRestoringVersionId(versionId);
      setRestoreError("");
      setRestoreSuccess("");

      await restoreCorpusDocumentVersion(projectId, documentId, versionId, {
        base_revision: documentRevision,
      });

      clearSelectedVersion();
      setRestoreSuccess("La versión se restauró correctamente.");

      await loadVersions({ soft: true });

      if (typeof onRestored === "function") {
        onRestored();
      }
      return true;
    } catch (error) {
      setRestoreError(getFriendlyVersionError(error));
      return false;
    } finally {
      setRestoringVersionId("");
    }
  }

  return {
    versions,
    selectedVersionId,
    selectedVersion,
    label,

    loading,
    refreshing,
    creating,
    loadingVersionId,
    restoringVersionId,

    versionsError,
    detailError,
    createError,
    createSuccess,
    restoreError,
    restoreSuccess,

    hasVersions,
    versionCountLabel,

    setLabel,
    refresh: () => loadVersions({ soft: true }),
    createVersion,
    selectVersion,
    clearSelectedVersion,
    restoreVersion,
  };
}
