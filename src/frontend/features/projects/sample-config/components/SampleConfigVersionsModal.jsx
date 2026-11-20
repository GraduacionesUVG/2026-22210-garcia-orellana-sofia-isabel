"use client";

import { useState } from "react";
import { useSampleConfigContext } from "@/features/projects/sample-config/components/SampleConfigProvider";
import VersionHistoryModal, {
  VersionPreviewField,
} from "@/features/projects/workspace/components/VersionHistoryModal";

export default function SampleConfigVersionsModal() {
  const { versioning } = useSampleConfigContext();
  const [label, setLabel] = useState("");

  async function handleCreate({ label: nextLabel }) {
    const created = await versioning.createVersionCurrent({ label: nextLabel });
    if (created) setLabel("");
    return created;
  }

  return (
    <VersionHistoryModal
      isOpen={versioning.versionsOpen}
      onClose={versioning.closeVersions}
      versions={versioning.versions}
      loadingVersions={versioning.versionsStatus === "loading"}
      versionsError={versioning.versionsError}
      selectedVersionId={versioning.selectedVersionId}
      onSelectVersion={versioning.setSelectedVersionId}
      onRefresh={() => versioning.loadVersions()}
      selectedVersion={versioning.selectedVersion}
      label={label}
      setLabel={setLabel}
      creating={versioning.versionActionState === "saving"}
      createError={
        versioning.versionActionState === "error"
          ? versioning.versionActionError
          : ""
      }
      onCreate={handleCreate}
      restoring={versioning.versionActionState === "restoring"}
      restoreError={
        versioning.versionActionState === "error"
          ? versioning.versionActionError
          : ""
      }
      onRestore={versioning.restoreVersionCurrent}
      emptyVersionsText="Todavía no hay versiones guardadas para esta muestra."
      renderSnapshot={({ snapshot }) => (
        <>
          <VersionPreviewField
            label="Enfoque principal"
            value={snapshot?.main_approach_code}
          />
          <VersionPreviewField label="Alcance" value={snapshot?.scope_code} />
          <VersionPreviewField
            label="Fase de campo"
            value={snapshot?.field_phase}
          />
          <VersionPreviewField
            label="Tamaño de muestra"
            value={snapshot?.target_sample_size}
          />
          <VersionPreviewField
            label="Justificación del tamaño de muestra"
            value={snapshot?.sample_size_rationale}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Técnicas de recolección
            </p>
            {snapshot?.collection_techniques?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {snapshot.collection_techniques.map((technique, index) => {
                  const techniqueLabel = technique?.is_custom
                    ? technique.custom_label
                    : technique?.technique_code;
                  return (
                    <span
                      key={`${techniqueLabel}-${index}`}
                      className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
                    >
                      {techniqueLabel || "Sin nombre"}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Esta versión no tiene técnicas registradas.
              </p>
            )}
          </div>
        </>
      )}
    />
  );
}
