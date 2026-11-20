"use client";

import Icon from "@/components/common/Icon";
import { truncateAnalysisText } from "@/features/projects/analysis/helpers/analysis.helpers";

export default function AnalysisCodeCard({
  code,
  stats,
  keywords = [],
  deleting = false,
  onEdit,
  onDelete,
}) {
  const segmentCount =
    stats?.coded_segments_count ??
    stats?.segment_count ??
    stats?.usage_count ??
    stats?.count ??
    0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-[#005944]/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="h-4 w-4 rounded-full border border-slate-200"
              style={{ backgroundColor: code.color || "#0f766e" }}
            />
            <h3 className="min-w-0 text-base font-black text-slate-900">
              {code.name}
            </h3>
            <span className="rounded-full bg-[#005944]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]">
              {segmentCount} segmentos
            </span>
            {code.parent_code_id ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Subcódigo
              </span>
            ) : null}
          </div>

          {code.description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {truncateAnalysisText(code.description, 180)}
            </p>
          ) : null}
          {code.definition ? (
            <p className="mt-3 max-w-2xl rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">
              {truncateAnalysisText(code.definition, 220)}
            </p>
          ) : null}
          {keywords.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Terminos
              </span>
              {keywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-[#005944]/10 px-2 py-1 text-[10px] font-black text-[#005944]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:text-[#005944]"
            onClick={() => onEdit(code)}
            aria-label="Editar codigo"
            title="Editar codigo"
          >
            <Icon name="edit" className="text-base" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            onClick={() => onDelete(code)}
            disabled={deleting}
            aria-label="Eliminar codigo"
            title="Eliminar codigo"
          >
            <Icon
              name={deleting ? "sync" : "delete"}
              className={`text-base ${deleting ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
