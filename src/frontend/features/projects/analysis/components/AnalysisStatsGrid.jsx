"use client";

import Icon from "@/components/common/Icon";
import { formatAnalysisNumber } from "@/features/projects/analysis/helpers/analysis.helpers";

function pickMetric(overview, keys, fallback = 0) {
  for (const key of keys) {
    if (overview?.[key] !== undefined && overview?.[key] !== null) {
      return overview[key];
    }
  }

  return fallback;
}

function StatBox({ icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#005944]/10 text-[#005944]">
          <Icon name={icon} className="text-xl" />
        </span>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {formatAnalysisNumber(value)}
          </p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function AnalysisStatsGrid({ overview }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatBox
        icon="article"
        label="Documentos"
        value={pickMetric(overview, ["total_documents", "documents_count"])}
      />
      <StatBox
        icon="segment"
        label="Segmentos"
        value={pickMetric(overview, ["total_segments", "segments_count"])}
      />
      <StatBox
        icon="sell"
        label="Códigos"
        value={pickMetric(overview, ["total_codes", "codes_count"])}
      />
      <StatBox
        icon="done_all"
        label="Segmentos codificados"
        value={pickMetric(overview, [
          "coded_segments",
          "coded_segments_count",
          "total_coded_segments",
        ])}
      />
      <StatBox
        icon="radio_button_unchecked"
        label="Segmentos sin codificar"
        value={pickMetric(overview, [
          "uncoded_segments",
          "uncoded_segments_count",
          "total_uncoded_segments",
        ])}
      />
      <StatBox
        icon="edit_note"
        label="Memos"
        value={pickMetric(overview, ["total_memos", "memos_count"])}
      />
      <StatBox
        icon="format_quote"
        label="Citas"
        value={pickMetric(overview, ["total_quotes", "quotes_count"])}
      />
      <StatBox
        icon="emoji_objects"
        label="Hallazgos"
        value={pickMetric(overview, ["total_insights", "insights_count"])}
      />
    </div>
  );
}
