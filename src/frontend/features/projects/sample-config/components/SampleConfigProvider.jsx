"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useSampleConfigPage } from "@/features/projects/sample-config/hooks/useSampleConfigPage";
import { useSampleConfigVersions } from "@/features/projects/sample-config/hooks/useSampleConfigVersions";
import { useSampleConfigReview } from "@/features/projects/sample-config/hooks/useSampleConfigReview";
import { buildSampleConfigFieldHighlights } from "@/features/projects/sample-config/helpers/sampleConfig.review.helpers";

const SampleConfigContext = createContext(null);

export function SampleConfigProvider({ projectId, children }) {
  const [reviewOpen] = useState(true);
  const [jackOpen] = useState(true);

  const page = useSampleConfigPage(projectId);

  const versions = useSampleConfigVersions({
    projectId,
    reload: page.reload,
    saveCurrent: page.saveCurrent,
    isDirty: page.isDirty,
    isReady: page.isReady,
    onApplyRestoredData: page.applyServerSampleConfigData,
  });

  const review = useSampleConfigReview({
    projectId,
    model: page.model,
    isDirty: page.isDirty,
    savingState: page.savingState,
    saveCurrent: page.saveCurrent,
  });

  const value = useMemo(
    () => ({
      projectId,
      reviewOpen,
      jackOpen,

      ...page,
      fieldHighlights: buildSampleConfigFieldHighlights(
        page.model,
        review.evaluationResult
      ),

      review,

      versioning: {
        versionsOpen: versions.versionsOpen,
        openVersions: versions.openVersions,
        closeVersions: versions.closeVersions,
        toggleVersionsOpen: versions.toggleVersionsOpen,

        versionsStatus: versions.versionsStatus,
        versionsError: versions.versionsError,
        versions: versions.versions,
        loadVersions: versions.loadVersions,

        selectedVersionId: versions.selectedVersionId,
        setSelectedVersionId: versions.setSelectedVersionId,
        selectedVersion: versions.selectedVersion,

        versionActionState: versions.versionActionState,
        versionActionError: versions.versionActionError,
        restoringVersionId: versions.restoringVersionId,
        createVersionCurrent: versions.createVersionCurrent,
        restoreVersionCurrent: versions.restoreVersionCurrent,
        resetVersionFeedback: versions.resetVersionFeedback,
      },

      versionsOpen: versions.versionsOpen,
      openVersions: versions.openVersions,
      closeVersions: versions.closeVersions,
      toggleVersionsOpen: versions.toggleVersionsOpen,

      versionsStatus: versions.versionsStatus,
      versionsError: versions.versionsError,
      versions: versions.versions,
      loadVersions: versions.loadVersions,

      selectedVersionId: versions.selectedVersionId,
      setSelectedVersionId: versions.setSelectedVersionId,
      selectedVersion: versions.selectedVersion,

      versionActionState: versions.versionActionState,
      versionActionError: versions.versionActionError,
      restoringVersionId: versions.restoringVersionId,
      createVersionCurrent: versions.createVersionCurrent,
      restoreVersionCurrent: versions.restoreVersionCurrent,
      resetVersionFeedback: versions.resetVersionFeedback,
    }),
    [projectId, reviewOpen, jackOpen, page, review, versions]
  );

  return (
    <SampleConfigContext.Provider value={value}>
      {children}
    </SampleConfigContext.Provider>
  );
}

export function useSampleConfigContext() {
  const context = useContext(SampleConfigContext);

  if (!context) {
    throw new Error(
      "useSampleConfigContext debe usarse dentro de SampleConfigProvider."
    );
  }

  return context;
}
