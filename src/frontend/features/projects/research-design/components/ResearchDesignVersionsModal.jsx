"use client";

import { useState } from "react";
import { useResearchDesignContext } from "@/features/projects/research-design/components/ResearchDesignProvider";
import VersionHistoryModal, {
  VersionPreviewField,
} from "@/features/projects/workspace/components/VersionHistoryModal";

export default function ResearchDesignVersionsModal() {
  const { versioning } = useResearchDesignContext();
  const [label, setLabel] = useState("");

  async function handleCreate({ label: nextLabel }) {
    const created = await versioning.createVersion({ label: nextLabel });
    if (created) setLabel("");
    return created;
  }

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
      selectedVersion={versioning.selectedVersion}
      label={label}
      setLabel={setLabel}
      creating={versioning.createVersionLoading}
      createError={versioning.createVersionError}
      onCreate={handleCreate}
      restoring={Boolean(versioning.restoringVersionId)}
      restoreError={versioning.restoreError}
      onRestore={versioning.restoreVersion}
      emptyVersionsText="Aún no hay versiones guardadas para este diseño."
      renderSnapshot={({ snapshot }) => (
        <>
          <VersionPreviewField
            label="Pregunta de investigación"
            value={snapshot?.research_question}
          />
          <VersionPreviewField
            label="Objetivo general"
            value={snapshot?.general_objective}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Objetivos específicos
            </p>
            {snapshot?.specific_objectives?.length ? (
              <div className="space-y-2">
                {snapshot.specific_objectives.map((objective, index) => (
                  <div
                    key={objective.id ?? `objective-${index}`}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Objetivo {index + 1}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {objective.text || "Sin contenido"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sin objetivos específicos en esta versión.</p>
            )}
          </div>
        </>
      )}
      getVersionNumber={(version) => version?.revision ?? "—"}
      getVersionLabel={(version) => version?.label ?? ""}
      getVersionAuthor={(version) => version?.created_by ?? ""}
      getVersionTriggerType={(version) => version?.trigger_type}
    />
  );
}
