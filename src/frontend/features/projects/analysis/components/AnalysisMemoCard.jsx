"use client";

import Icon from "@/components/common/Icon";
import {
  formatAnalysisDate,
  getMemoStatusLabel,
  getMemoTypeLabel,
  truncateAnalysisText,
} from "@/features/projects/analysis/helpers/analysis.helpers";

export default function AnalysisMemoCard({
  memo,
  deleting,
  onEdit,
  onDelete,
  onLinks,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#005944]/30 hover:shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#005944]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]">
              {getMemoTypeLabel(memo.memo_type)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {getMemoStatusLabel(memo.status)}
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
              {formatAnalysisDate(memo.updated_at)}
            </span>
          </div>
          <h3 className="mt-3 text-base font-black text-slate-900">
            {memo.title}
          </h3>
          {memo.body ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {truncateAnalysisText(memo.body, 220)}
            </p>
          ) : null}
          {memo.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {memo.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:text-[#005944]"
            onClick={() => onLinks(memo)}
          >
            <Icon name="link" className="text-base" />
            Vínculos
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:text-[#005944]"
            onClick={() => onEdit(memo)}
          >
            <Icon name="edit" className="text-base" />
            Editar
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
            onClick={() => onDelete(memo)}
            disabled={deleting}
          >
            <Icon
              name={deleting ? "sync" : "delete"}
              className={`text-base ${deleting ? "animate-spin" : ""}`}
            />
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}
