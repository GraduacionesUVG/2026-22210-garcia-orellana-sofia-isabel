import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import FieldResearchQuestion from "@/features/projects/research-design/components/FieldResearchQuestion";
import FieldGeneralObjective from "@/features/projects/research-design/components/FieldGeneralObjective";
import FieldSpecificObjectives from "@/features/projects/research-design/components/FieldSpecificObjectives";
import { getNextProjectStepLabel } from "@/features/projects/workspace/workspaceWorkflowNavigation";

export default function EditorCard({
  model,
  setModel,
  savingState,
  savingError,
  savingErrors = [],
  onAddSpecificObjective,
  onDeleteSpecificObjective,
  onUpdateSpecificObjective,
  fieldHighlights,
  onOpenVersions,
  onOpenCreateVersion,
  onPrimaryAction,
}) {
  return (
    <WorkspaceEditorCard
      title="Editor de Diseño"
      savingState={savingState}
      savingError={savingError}
      secondaryActions={[
        {
          icon: "history",
          label: "Versiones anteriores",
          onClick: onOpenVersions,
        },
        {
          icon: "bookmark_add",
          label: "Guardar versión",
          onClick: onOpenCreateVersion,
        },
      ]}
      primaryActionLabel={getNextProjectStepLabel("design")}
      onPrimaryAction={onPrimaryAction}
      primaryActionDisabled={savingState === "saving"}
    >
      <FieldResearchQuestion
        value={model.research_question}
        highlights={fieldHighlights?.research_question ?? []}
        onChange={(value) =>
          setModel((prev) => ({
            ...prev,
            research_question: value,
          }))
        }
      />

      <FieldGeneralObjective
        value={model.general_objective}
        highlights={fieldHighlights?.general_objective ?? []}
        onChange={(value) =>
          setModel((prev) => ({
            ...prev,
            general_objective: value,
          }))
        }
      />

      <FieldSpecificObjectives
        items={model.specific_objectives}
        highlights={fieldHighlights}
        onAddItem={onAddSpecificObjective}
        onDeleteItem={onDeleteSpecificObjective}
        onChangeItem={onUpdateSpecificObjective}
      />

      {(savingErrors.length ? savingErrors : [savingError]).filter(Boolean).map(message => (
        <div key={message} role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      ))}
    </WorkspaceEditorCard>
  );
}
