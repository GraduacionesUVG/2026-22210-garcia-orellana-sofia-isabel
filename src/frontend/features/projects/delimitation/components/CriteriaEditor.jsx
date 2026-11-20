"use client";

import { useState } from "react";
import Icon from "@/components/common/Icon";
import { FieldHelpLabel } from "@/features/projects/workspace/field-help";
import FieldStateNote, {
  FieldStateIcon,
  FieldStatePill,
  fieldStateFrameClassName,
} from "@/features/projects/delimitation/components/FieldStateNote";

export default function CriteriaEditor({
  include = [],
  exclude = [],
  includeState = null,
  excludeState = null,
  onAddItem,
  onDeleteItem,
}) {
  return (
    <div className="space-y-4">
      <label className="text-xs font-black text-[#005944] uppercase tracking-wider">
        5. Criterios de Inclusión y Exclusión
      </label>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CriteriaColumn
          title="Inclusión"
          icon="add_circle"
          kind="include"
          items={include}
          fieldState={includeState}
          onAddItem={onAddItem}
          onDeleteItem={onDeleteItem}
        />

        <CriteriaColumn
          title="Exclusión"
          icon="do_not_disturb_on"
          kind="exclude"
          items={exclude}
          fieldState={excludeState}
          onAddItem={onAddItem}
          onDeleteItem={onDeleteItem}
        />
      </div>
    </div>
  );
}

function CriteriaColumn({
  title,
  icon,
  kind,
  items,
  fieldState,
  onAddItem,
  onDeleteItem,
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const labelCls = kind === "include" ? "text-[#005944]" : "text-[#C2410C]";
  const btnCls =
    kind === "include"
      ? "bg-[#005944] hover:bg-[#004232]"
      : "bg-[#C2410C] hover:bg-[#9A3412]";

  async function handleAdd() {
    const text = draft.trim();

    if (!text || adding) return;

    setAdding(true);

    try {
      await onAddItem?.(kind, text);
      setDraft("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      id={`delimitation-${kind}`}
      data-field-key={kind}
      className={`min-w-0 scroll-mt-28 space-y-3 rounded-2xl border p-3 transition-all ${fieldStateFrameClassName(
        fieldState?.tone
      )}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`flex items-center gap-1.5 ${labelCls}`}>
          <Icon name={icon} className="text-sm" />

          <FieldHelpLabel
            phase="delimitation"
            field={kind}
            tooltipPosition="right"
            required
            labelClassName={`text-[10px] ${labelCls}`}
          >
            {title}
          </FieldHelpLabel>

          <FieldStateIcon state={fieldState} />
        </div>

        <FieldStatePill state={fieldState} />
      </div>

      <FieldStateNote state={fieldState} />

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2"
          >
            <span className="min-w-0 flex-1 break-words text-xs text-slate-600">{item.text}</span>

            <button
              type="button"
              className="text-slate-300 transition-colors hover:text-red-500"
              onClick={() => onDeleteItem?.(kind, item.id)}
              title="Eliminar"
            >
              <Icon name="close" className="text-sm" />
            </button>
          </div>
        ))}

        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-dashed border-slate-200 bg-white/80 p-2 text-xs outline-none transition-all focus:border-[#005944]/40 focus:bg-white focus:ring-2 focus:ring-[#005944]/10"
            placeholder="Agregar criterio..."
            type="text"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAdd();
              }
            }}
          />

          <button
            type="button"
            className={`${btnCls} flex shrink-0 items-center justify-center rounded-lg p-2 text-white transition-colors disabled:opacity-60`}
            onClick={handleAdd}
            disabled={adding}
            title="Agregar"
          >
            {adding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Icon name="add" className="text-sm" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
