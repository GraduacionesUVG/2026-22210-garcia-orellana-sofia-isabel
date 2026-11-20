"use client";

import Icon from "@/components/common/Icon";
import { formatAnalysisNumber } from "@/features/projects/analysis/helpers/analysis.helpers";

export default function AnalysisCodeStatsPanel({ stats = [] }) {
  const topStats = stats.slice(0, 6);

  return (
    <aside>
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <Icon name="bar_chart" className="text-lg text-[#005944]" />
          <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
            Uso
          </p>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {formatAnalysisNumber(stats.length)} códigos
          </span>
        </div>

        <div className="mt-3 space-y-1.5">
          {topStats.length ? (
            topStats.map((item) => (
              <div
                key={item.code_id ?? item.id ?? item.code_name}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-1.5"
              >
                <span className="truncate text-xs font-bold text-slate-700">
                  {item.code_name?.trim() || item.name?.trim() || "Código no disponible"}
                </span>
                <span className="text-[11px] font-black text-[#005944]">
                  {formatAnalysisNumber(
                    item.segment_count ??
                      item.coded_segments_count ??
                      item.usage_count ??
                      item.count ??
                      0
                  )}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              Todavía no hay estadísticas de uso.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
