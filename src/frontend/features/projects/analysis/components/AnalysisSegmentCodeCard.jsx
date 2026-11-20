"use client";

import Icon from "@/components/common/Icon";
import { truncateAnalysisText } from "@/features/projects/analysis/helpers/analysis.helpers";

export default function AnalysisSegmentCodeCard({
  segmentCode,
  code,
  deleting,
  onEdit,
  onDelete,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border border-slate-200"
              style={{ backgroundColor: code?.color || "#0f766e" }}
            />
            <span className="text-xs font-black text-slate-900">
              {code?.name?.trim() || "Código no disponible"}
            </span>
            {segmentCode.is_quote ? (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-blue-700">
                Cita textual
              </span>
            ) : null}
          </div>
          {segmentCode.analytic_note ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {truncateAnalysisText(segmentCode.analytic_note, 110)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#005944] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944]/30 focus-visible:ring-offset-1"
            onClick={() => onEdit(segmentCode)}
            aria-label="Editar codificación"
            title="Editar codificación"
          >
            <Icon name="edit" className="text-sm" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onDelete(segmentCode)}
            disabled={deleting}
            aria-label="Quitar código"
            title="Quitar código"
          >
            <Icon
              name={deleting ? "sync" : "delete"}
              className={`text-sm ${deleting ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
