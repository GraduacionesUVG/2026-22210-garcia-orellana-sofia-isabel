"use client";

import { useMemo } from "react";
import { useDelimitationContext } from "@/features/projects/delimitation/components/DelimitationProvider";
import VersionHistoryModal, {
  VersionPreviewField,
  VersionPreviewList,
} from "@/features/projects/workspace/components/VersionHistoryModal";

export default function DelimitationVersionsModal() {
  const { versioning } = useDelimitationContext();
  const selectedVersion = useMemo(
    () =>
      versioning.versions.find(
        (version) => version.id === versioning.selectedVersionId
      ) ?? null,
    [versioning.selectedVersionId, versioning.versions]
  );

  return (
    <VersionHistoryModal
      isOpen={versioning.isOpen}
      onClose={versioning.closeVersionsModal}
      versions={versioning.versions}
      loadingVersions={versioning.loadingVersions}
      versionsError={versioning.versionsError}
      selectedVersionId={versioning.selectedVersionId}
      onSelectVersion={versioning.setSelectedVersionId}
      onRefresh={versioning.refreshVersions}
      selectedVersion={selectedVersion}
      detail={versioning.versionDetail}
      loadingDetail={versioning.loadingVersionDetail}
      detailError={versioning.versionDetailError}
      label={versioning.label}
      setLabel={versioning.setLabel}
      creating={versioning.creatingVersion}
      createError={versioning.createVersionError}
      createInfo={versioning.createVersionInfo}
      createSuccess={versioning.createVersionSuccess}
      onCreate={() => versioning.submitCreateVersion()}
      restoring={versioning.restoringVersion}
      restoreError={versioning.restoreVersionError}
      restoreSuccess={versioning.restoreVersionSuccess}
      onRestore={(versionId) => versioning.submitRestoreVersion(versionId)}
      emptyVersionsText="Aún no hay versiones guardadas para esta delimitación."
      renderSnapshot={({ detail: snapshotDetail }) => (
        <>
          <VersionPreviewField label="Tema" value={snapshotDetail?.delim?.topic} />
          <VersionPreviewField
            label="Lugar / contexto"
            value={snapshotDetail?.delim?.context_place}
          />
          <VersionPreviewField
            label="Población"
            value={snapshotDetail?.delim?.population}
          />
          <VersionPreviewField
            label="Periodo de tiempo"
            value={snapshotDetail?.delim?.time_period}
          />
          <VersionPreviewField
            label="Recursos"
            value={snapshotDetail?.delim?.resources}
          />
          <VersionPreviewList
            label="Criterios de inclusión"
            items={snapshotDetail?.include ?? []}
          />
          <VersionPreviewList
            label="Criterios de exclusión"
            items={snapshotDetail?.exclude ?? []}
          />
        </>
      )}
      getVersionNumber={(version) => version?.version_number ?? "—"}
      getVersionLabel={(version) => version?.label ?? ""}
      getVersionAuthor={(version) => version?.created_by ?? ""}
      getVersionTriggerType={(version) => version?.trigger_type}
    />
  );
}
