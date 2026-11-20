"use client";

import { createContext, useContext, useMemo } from "react";
import { useDelimitationPage } from "@/features/projects/delimitation/hooks/useDelimitationPage";
import { useDelimitationVersions } from "@/features/projects/delimitation/hooks/useDelimitationVersions";
import { useCreateDelimitationVersion } from "@/features/projects/delimitation/hooks/useCreateDelimitationVersion";
import { useDelimitationVersionDetail } from "@/features/projects/delimitation/hooks/useDelimitationVersionDetail";
import { useDelimitationVersionRestore } from "@/features/projects/delimitation/hooks/useDelimitationVersionRestore";
import { useDelimitationHeuristics } from "@/features/projects/delimitation/hooks/useDelimitationHeuristics";
import { useDelimitationReview } from "@/features/projects/delimitation/hooks/useDelimitationReview";

const DelimitationContext = createContext(null);

export function DelimitationProvider({ projectId, children }) {
  const page = useDelimitationPage(projectId);
  const heuristics = useDelimitationHeuristics(page.model);

  const review = useDelimitationReview({
    projectId,
    model: page.model,
    heuristics,
  });

  const versions = useDelimitationVersions(projectId);

  const createVersion = useCreateDelimitationVersion(projectId, async (result) => {
    await versions.refreshVersions();

    if (result?.version?.id) {
      versions.setSelectedVersionId(result.version.id);
    }
  });

  const versionDetail = useDelimitationVersionDetail(
    projectId,
    versions.selectedVersionId,
    versions.isOpen
  );

  const restoreVersion = useDelimitationVersionRestore(projectId, async (result) => {
    await page.reload();
    await versions.refreshVersions();

    const selectedId =
      result?.restoredFromVersion?.id ??
      versions.selectedVersionId ??
      null;

    if (selectedId) {
      versions.setSelectedVersionId(selectedId);
    }
  });

  const value = useMemo(
    () => ({
      projectId,
      ...page,
      heuristics,
      review,
      versioning: {
        isOpen: versions.isOpen,
        openMode: versions.openMode,
        versions: versions.versions,
        loadingVersions: versions.loadingVersions,
        versionsError: versions.versionsError,
        selectedVersionId: versions.selectedVersionId,
        setSelectedVersionId: versions.setSelectedVersionId,
        openVersionsModal: versions.openVersionsModal,
        closeVersionsModal: versions.closeVersionsModal,
        refreshVersions: versions.refreshVersions,

        label: createVersion.label,
        setLabel: createVersion.setLabel,
        creatingVersion: createVersion.creatingVersion,
        createVersionError: createVersion.createVersionError,
        createVersionInfo: createVersion.createVersionInfo,
        createVersionSuccess: createVersion.createVersionSuccess,
        resetCreateVersionState: createVersion.resetCreateVersionState,
        submitCreateVersion: createVersion.submitCreateVersion,

        versionDetail: versionDetail.versionDetail,
        loadingVersionDetail: versionDetail.loadingVersionDetail,
        versionDetailError: versionDetail.versionDetailError,
        reloadVersionDetail: versionDetail.reloadVersionDetail,

        restoringVersion: restoreVersion.restoringVersion,
        restoreVersionError: restoreVersion.restoreVersionError,
        restoreVersionSuccess: restoreVersion.restoreVersionSuccess,
        resetRestoreVersionState: restoreVersion.resetRestoreVersionState,
        submitRestoreVersion: restoreVersion.submitRestoreVersion,
      },
    }),
    [
      projectId,
      page,
      heuristics,
      review,
      versions.isOpen,
      versions.openMode,
      versions.versions,
      versions.loadingVersions,
      versions.versionsError,
      versions.selectedVersionId,
      versions.setSelectedVersionId,
      versions.openVersionsModal,
      versions.closeVersionsModal,
      versions.refreshVersions,
      createVersion.label,
      createVersion.setLabel,
      createVersion.creatingVersion,
      createVersion.createVersionError,
      createVersion.createVersionInfo,
      createVersion.createVersionSuccess,
      createVersion.resetCreateVersionState,
      createVersion.submitCreateVersion,
      versionDetail.versionDetail,
      versionDetail.loadingVersionDetail,
      versionDetail.versionDetailError,
      versionDetail.reloadVersionDetail,
      restoreVersion.restoringVersion,
      restoreVersion.restoreVersionError,
      restoreVersion.restoreVersionSuccess,
      restoreVersion.resetRestoreVersionState,
      restoreVersion.submitRestoreVersion,
    ]
  );

  return (
    <DelimitationContext.Provider value={value}>
      {children}
    </DelimitationContext.Provider>
  );
}

export function useDelimitationContext() {
  const context = useContext(DelimitationContext);

  if (!context) {
    throw new Error(
      "useDelimitationContext debe usarse dentro de DelimitationProvider."
    );
  }

  return context;
}
