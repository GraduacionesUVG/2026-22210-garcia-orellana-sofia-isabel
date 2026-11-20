"use client";

import Icon from "@/components/common/Icon";
import {
  truncateAnalysisText,
  getAnalysisCodesHref,
} from "@/features/projects/analysis/helpers/analysis.helpers";
import AnalysisSegmentCodeChips from "@/features/projects/analysis/components/AnalysisSegmentCodeChips";

export default function AnalysisUncodedSegmentsPanel({
  projectId,
  segments = [],
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <Icon name="sync" className="animate-spin text-xl text-[#005944]" />
          <p className="text-sm font-bold text-slate-600">
            Cargando segmentos sin codificar...
          </p>
        </div>
      </div>
    );
  }

  if (!segments.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#005944]/10 text-[#005944]">
          <Icon name="done_all" className="text-2xl" />
        </div>
        <p className="mt-4 text-sm font-black text-slate-900">
          Todos los segmentos actuales ya tienen al menos un código.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {segments.map((segment) => {
        const documentLabel =
          segment.document_title?.trim() ||
          segment.title?.trim() ||
          "Documento no disponible";
        const codingHref = getAnalysisCodesHref(projectId, {
          view: "coding",
          segmentId: segment.id,
        });

        return (
          <article
            key={segment.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AnalysisSegmentCodeChips segment={segment} compact />
                  <span className="max-w-full break-words rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 [overflow-wrap:anywhere]" title={documentLabel}>
                    {documentLabel}
                  </span>
                </div>

                {segment.participant_label && segment.participant_label !== "Sin participante" ? (
                  <p className="mt-2 break-words text-xs text-slate-500">{segment.participant_label}</p>
                ) : null}

                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {truncateAnalysisText(
                    segment.selected_text ?? segment.text ?? "",
                    190
                  )}
                </p>
              </div>

              <a
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#004232]"
                href={codingHref}
              >
                Codificar
                <Icon name="arrow_forward" className="text-sm" />
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
