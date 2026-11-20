"use client";

import Icon from "@/components/common/Icon";
import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import AnalysisMemoCard from "@/features/projects/analysis/components/AnalysisMemoCard";
import AnalysisMemoFormModal from "@/features/projects/analysis/components/AnalysisMemoFormModal";
import AnalysisMemoLinksPanel from "@/features/projects/analysis/components/AnalysisMemoLinksPanel";
import { useAnalysisContext } from "@/features/projects/analysis/components/AnalysisProvider";
import { useAnalysisMemos } from "@/features/projects/analysis/hooks/useAnalysisMemos";
import {
  MEMO_STATUSES,
  MEMO_TYPES,
} from "@/features/projects/analysis/helpers/analysis.helpers";

export default function AnalysisMemosSection() {
  const { projectId } = useAnalysisContext();
  const manager = useAnalysisMemos(projectId);

  return (
    <>
      <WorkspaceEditorCard
        title="Memos analíticos"
        icon="edit_note"
        savingState={manager.refreshing ? "saving" : "idle"}
        savingError={manager.errorMsg}
        secondaryActions={[
          {
            icon: "refresh",
            label: "Actualizar",
            onClick: manager.reload,
            disabled: manager.loading || manager.refreshing,
          },
        ]}
        primaryActionLabel="Nuevo memo"
        primaryActionIcon="add"
        onPrimaryAction={manager.openCreateModal}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944]"
            value={manager.filters.search}
            onChange={(event) =>
              manager.updateFilter("search", event.target.value)
            }
            placeholder="Buscar memo"
          />
          <select
            aria-label="Tipo de memo"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={manager.filters.memo_type}
            onChange={(event) =>
              manager.updateFilter("memo_type", event.target.value)
            }
          >
            <option value="">Todos los tipos</option>
            {MEMO_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Estado de memo"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={manager.filters.status}
            onChange={(event) =>
              manager.updateFilter("status", event.target.value)
            }
          >
            <option value="">Todos los estados</option>
            {MEMO_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {manager.errorMsg ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {manager.errorMsg}
          </div>
        ) : null}
        {manager.successMsg ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-slate-700">
            {manager.successMsg}
          </div>
        ) : null}

        {manager.loading ? (
          <Icon name="sync" className="animate-spin text-xl text-[#005944]" />
        ) : null}

        {!manager.loading && !manager.memos.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-black text-slate-900">
              Todavía no hay memos. Usa memos para registrar interpretaciones,
              dudas metodológicas o reflexiones de campo.
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          {manager.memos.map((memo) => (
            <AnalysisMemoCard
              key={memo.id}
              memo={memo}
              deleting={manager.deletingId === memo.id}
              onEdit={manager.openEditModal}
              onDelete={manager.removeMemo}
              onLinks={manager.openLinksPanel}
            />
          ))}
        </div>
      </WorkspaceEditorCard>

      <AnalysisMemoFormModal
        open={manager.modalOpen}
        form={manager.form}
        editingMemo={manager.editingMemo}
        saving={manager.saving}
        onClose={manager.closeModal}
        onFieldChange={manager.setFormField}
        onSave={manager.saveMemo}
      />

      <AnalysisMemoLinksPanel manager={manager} />
    </>
  );
}
