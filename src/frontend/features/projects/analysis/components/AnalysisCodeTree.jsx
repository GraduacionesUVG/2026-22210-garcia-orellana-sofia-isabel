"use client";

import Icon from "@/components/common/Icon";
import AnalysisCodeCard from "@/features/projects/analysis/components/AnalysisCodeCard";

export default function AnalysisCodeTree({
  codes = [],
  statsByCodeId,
  deletingId,
  onEdit,
  onDelete,
  onCreate,
  getKeywords,
}) {
  if (!codes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#005944]/30 bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#005944]/10 text-[#005944]">
          <Icon name="account_tree" className="text-2xl" />
        </div>
        <p className="mt-4 text-sm font-black text-slate-900">
          Empieza tu codebook con el primer tema recurrente.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Un codigo es una etiqueta analitica que podras asignar a segmentos del
          corpus. Puedes crear pocos codigos iniciales y refinarlos conforme
          avances.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#004232]"
          onClick={onCreate}
        >
          <Icon name="add" className="text-base" />
          Crear primer codigo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {codes.map((code) => (
        <AnalysisCodeCard
          key={code.id}
          code={code}
          stats={statsByCodeId.get(code.id)}
          keywords={getKeywords?.(code) ?? []}
          deleting={deletingId === code.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
