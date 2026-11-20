"use client";

import { useResearchDesignContext } from "@/features/projects/research-design/components/ResearchDesignProvider";
import EditorCard from "@/features/projects/research-design/components/EditorCard";
import ResearchDesignVersionsModal from "@/features/projects/research-design/components/ResearchDesignVersionsModal";
import { useRouter } from "next/navigation";

export default function ResearchDesignEditorSection() {
  const router = useRouter();
  const {
    projectId,
    loading,
    loadError,
    model,
    setModel,
    savingState,
    savingError,
    savingErrors,
    onAddSpecificObjective,
    onDeleteSpecificObjective,
    onUpdateSpecificObjective,
    versioning,
    heuristics,
  } = useResearchDesignContext();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-sm text-slate-500">
        Cargando diseño de investigación...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  return (
    <>
      <EditorCard
        model={model}
        setModel={setModel}
        savingState={savingState}
        savingError={savingError}
        savingErrors={savingErrors}
        onAddSpecificObjective={onAddSpecificObjective}
        onDeleteSpecificObjective={onDeleteSpecificObjective}
        onUpdateSpecificObjective={onUpdateSpecificObjective}
        fieldHighlights={heuristics?.fieldHighlights}
        onOpenVersions={() => versioning.openVersionsModal("browse")}
        onOpenCreateVersion={() => versioning.openVersionsModal("create")}
        onPrimaryAction={() =>
          router.push(`/projects/${encodeURIComponent(projectId)}/sample-config`)
        }
      />

      <ResearchDesignVersionsModal />
    </>
  );
}
