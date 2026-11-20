"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/common/Icon";
import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import CorpusDocumentForm from "@/features/projects/corpus/components/CorpusDocumentForm";
import { useCorpusContext } from "@/features/projects/corpus/components/CorpusProvider";
import { useCorpusNewDocument } from "@/features/projects/corpus/hooks/useCorpusNewDocument";

export default function CorpusNewDocumentSection() {
  const router = useRouter();
  const { projectId, routes } = useCorpusContext();

  const {
    form,
    sourceOptions,
    participantOptions,
    metrics,

    catalogStatus,
    catalogError,
    savingState,
    savingError,
    successMsg,

    isSaving,
    canSave,

    setField,
    resetForm,
    submit,
    reloadCatalogs,
  } = useCorpusNewDocument(projectId);

  return (
    <WorkspaceEditorCard
      title="Nueva transcripción"
      icon="note_add"
      savingState={savingState}
      savingError={savingError}
      secondaryActions={[
        {
          icon: "arrow_back",
          label: "Volver al corpus",
          onClick: () => router.push(routes.corpusHref),
          disabled: isSaving,
        },
        {
          icon: "restart_alt",
          label: "Limpiar formulario",
          onClick: resetForm,
          disabled: isSaving,
        },
      ]}
      primaryActionLabel={isSaving ? "Guardando..." : "Guardar transcripción"}
      primaryActionIcon="save"
      primaryActionDisabled={!canSave}
      onPrimaryAction={submit}
    >
      <div className="rounded-2xl border border-[#005944]/15 bg-[#005944]/5 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#005944]">
            <Icon name="description" className="text-xl" />
          </span>

          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#005944]">
              Ingesta por texto pegado
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Crea un documento del corpus pegando una transcripción, nota de
              campo, observación o texto cualitativo. Más adelante podrás
              revisarlo, crear versiones y marcar segmentos relevantes.
            </p>
          </div>
        </div>
      </div>

      <CorpusDocumentForm
        form={form}
        sourceOptions={sourceOptions}
        participantOptions={participantOptions}
        metrics={metrics}
        catalogStatus={catalogStatus}
        catalogError={catalogError}
        savingError={savingError}
        successMsg={successMsg}
        onFieldChange={setField}
        onReloadCatalogs={reloadCatalogs}
      />
    </WorkspaceEditorCard>
  );
}