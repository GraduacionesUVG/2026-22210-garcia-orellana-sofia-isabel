"use client";

import Icon from "@/components/common/Icon";
import { formatCorpusNumber } from "@/features/projects/corpus/helpers/corpus.helpers";

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
            {formatCorpusNumber(value)}
          </p>

          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function CorpusStatsGrid({ stats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatBox
        icon="article"
        label="Documentos"
        value={stats?.total_documents ?? 0}
        hint={`${formatCorpusNumber(
          stats?.deleted_documents ?? 0
        )} en papelera`}
      />

      <StatBox
        icon="format_align_left"
        label="Palabras"
        value={stats?.total_words ?? 0}
        hint={`Promedio: ${formatCorpusNumber(
          stats?.average_words_per_document ?? 0
        )} por documento`}
      />

      <StatBox
        icon="notes"
        label="Caracteres"
        value={stats?.total_characters ?? 0}
        hint={`Promedio: ${formatCorpusNumber(
          stats?.average_characters_per_document ?? 0
        )} por documento`}
      />

      <StatBox
        icon="category"
        label="Tipos usados"
        value={stats?.by_type?.length ?? 0}
        hint="Clasificación cualitativa"
      />
    </div>
  );
}