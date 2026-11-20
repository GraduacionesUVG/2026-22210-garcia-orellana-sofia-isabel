"use client";

import Icon from "@/components/common/Icon";
import SaveStateBadge from "@/features/projects/workspace/components/SaveStateBadge";

export default function WorkspaceEditorCard({
  title,
  icon = "edit_square",
  savingState,
  savingError,
  secondaryActions = [],
  primaryActionLabel,
  primaryActionIcon = "arrow_forward",
  onPrimaryAction,
  primaryActionDisabled = false,
  children,
}) {
  const isPrimaryDisabled = primaryActionDisabled || !onPrimaryAction;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="workspace-editor-heading flex items-center justify-between border-b border-slate-100 bg-[#005944]/5 px-6 py-4">
        <div className="flex items-center gap-2">
          <Icon name={icon} className="text-[#005944]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#005944]">
            {title}
          </span>
        </div>

        <SaveStateBadge savingState={savingState} savingError={savingError} />
      </div>

      <div className="workspace-editor-body space-y-8 p-8">{children}</div>

      <div className="workspace-editor-footer flex items-center justify-between border-t border-slate-100 bg-slate-50 p-6">
        <div className="flex flex-wrap items-center gap-5">
          {secondaryActions.map((action) => (
            <button
              key={action.label}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 transition-colors hover:text-[#005944] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              <Icon name={action.icon} className="text-lg" />
              {action.label}
            </button>
          ))}
        </div>

        {primaryActionLabel ? (
          <button
            className="flex items-center gap-2 rounded-lg bg-[#005944] px-8 py-3 text-xs font-bold text-white shadow-md shadow-[#005944]/20 transition-all hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onPrimaryAction}
            disabled={isPrimaryDisabled}
          >
            <span>{primaryActionLabel}</span>
            <Icon name={primaryActionIcon} className="text-sm" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
