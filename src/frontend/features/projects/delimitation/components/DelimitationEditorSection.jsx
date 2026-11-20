"use client";

import EditorCard from "@/features/projects/delimitation/components/EditorCard";
import DelimitationVersionsModal from "@/features/projects/delimitation/components/DelimitationVersionsModal";
import { useDelimitationContext } from "@/features/projects/delimitation/components/DelimitationProvider";

export default function DelimitationEditorSection() {
  const {
    projectId,
    loading,
    loadError,
    model,
    setModel,
    savingState,
    savingError,
    onAddItem,
    onDeleteItem,
    versioning,
    heuristics,
    review,
  } = useDelimitationContext();

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
        Cargando delimitación...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  return (
    <>
      <EditorCard
        projectId={projectId}
        model={model}
        heuristics={heuristics}
        review={review?.reviewResult ?? null}
        setModel={setModel}
        savingState={savingState}
        savingError={savingError}
        onAddItem={onAddItem}
        onDeleteItem={onDeleteItem}
        onOpenVersions={() => versioning.openVersionsModal("browse")}
        onOpenCreateVersion={() => versioning.openVersionsModal("create")}
      />

      <DelimitationVersionsModal />
    </>
  );
}