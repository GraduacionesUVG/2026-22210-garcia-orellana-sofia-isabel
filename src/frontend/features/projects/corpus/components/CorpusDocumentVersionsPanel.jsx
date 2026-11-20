"use client";

import {
  VersionPreviewField,
} from "@/features/projects/workspace/components/VersionHistoryModal";
import VersionHistoryModal from "@/features/projects/workspace/components/VersionHistoryModal";
import {
  formatCorpusDate,
  formatCorpusNumber,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
} from "@/features/projects/corpus/helpers/corpus.helpers";
import { useCorpusDocumentVersions } from "@/features/projects/corpus/hooks/useCorpusDocumentVersions";

function DocumentVersionSnapshot({ snapshot }) {
  const formatSnapshotDate = (value) =>
    value ? formatCorpusDate(value) : "Sin fecha";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <VersionPreviewField label="Título" value={snapshot?.snapshot_title} />
        <VersionPreviewField
          label="Tipo de documento"
          value={getDocumentTypeLabel(snapshot?.snapshot_document_type)}
        />
        <VersionPreviewField
          label="Estado"
          value={getDocumentStatusLabel(snapshot?.snapshot_status)}
        />
        <VersionPreviewField
          label="Revisión"
          value={snapshot?.snapshot_revision}
        />
        <VersionPreviewField
          label="Palabras"
          value={formatCorpusNumber(snapshot?.snapshot_word_count)}
        />
        <VersionPreviewField
          label="Caracteres"
          value={formatCorpusNumber(snapshot?.snapshot_character_count)}
        />
        <VersionPreviewField
          label="Fecha de entrevista"
          value={formatSnapshotDate(snapshot?.snapshot_interview_date)}
        />
        <VersionPreviewField
          label="Fecha de campo"
          value={formatSnapshotDate(snapshot?.snapshot_field_date)}
        />
        <VersionPreviewField label="Lugar" value={snapshot?.snapshot_location} />
        <VersionPreviewField label="Idioma" value={snapshot?.snapshot_language} />
      </div>

      <VersionPreviewField
        label="Notas contextuales"
        value={snapshot?.snapshot_notes}
        emptyText="Esta versión no tenía notas contextuales."
      />

      <VersionPreviewField
        label="Contenido"
        value={snapshot?.snapshot_content}
        emptyText="Esta versión no tiene contenido."
      />
    </>
  );
}

export default function CorpusDocumentVersionsPanel({
  projectId,
  documentId,
  documentRevision,
  open,
  onClose,
  disabled = false,
  onRestored,
}) {
  const versions = useCorpusDocumentVersions({
    projectId,
    documentId,
    documentRevision,
    enabled: open && !disabled,
    onRestored,
  });

  if (!open) return null;

  return (
    <VersionHistoryModal
      isOpen={open}
      onClose={onClose}
      versions={versions.versions}
      loadingVersions={versions.loading}
      versionsError={versions.versionsError}
      selectedVersionId={versions.selectedVersionId}
      onSelectVersion={versions.selectVersion}
      onRefresh={versions.refresh}
      selectedVersion={versions.selectedVersion}
      detail={versions.selectedVersion}
      loadingDetail={Boolean(versions.loadingVersionId)}
      detailError={versions.detailError}
      label={versions.label}
      setLabel={versions.setLabel}
      creating={disabled || versions.creating}
      createError={versions.createError}
      createSuccess={versions.createSuccess}
      onCreate={versions.createVersion}
      restoring={disabled || Boolean(versions.restoringVersionId)}
      restoreError={versions.restoreError}
      restoreSuccess={versions.restoreSuccess}
      onRestore={versions.restoreVersion}
      emptyVersionsText="Aún no hay versiones guardadas para este documento."
      renderSnapshot={({ snapshot }) => (
        <DocumentVersionSnapshot snapshot={snapshot} />
      )}
      getVersionNumber={(version) => version?.version_number ?? "—"}
      getVersionLabel={(version) =>
        version?.label || version?.snapshot_title || ""
      }
      getVersionAuthor={(version) => version?.created_by ?? ""}
      getVersionTriggerType={(version) => version?.trigger_type}
    />
  );
}
