"use client";

import Icon from "@/components/common/Icon";
import { useSampleConfigContext } from "@/features/projects/sample-config/components/SampleConfigProvider";
import { sampleConfigStatusMeta } from "@/features/projects/sample-config/helpers/sampleConfig.review.helpers";

export default function SampleConfigReviewButton() {
  const { review } = useSampleConfigContext();

  const status = review?.reviewResult?.overall_status ?? "";
  const statusMeta = sampleConfigStatusMeta(status);
  const score = review?.reviewResult?.overall_score ?? null;

  return (
    <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4">
      <button
        type="button"
        onClick={review?.evaluateReview}
        disabled={!review?.canEvaluate || review?.reviewLoading}
        className="w-full rounded-2xl border border-[#005944]/15 bg-[#005944] px-4 py-3 text-left text-white shadow-sm transition-all hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12">
              <Icon
                name={review?.reviewLoading ? "autorenew" : "fact_check"}
                className={`text-lg ${review?.reviewLoading ? "animate-spin" : ""}`}
              />
            </span>

            <div>
              <div className="text-[11px] font-black uppercase tracking-widest">
                {review?.reviewLoading
                  ? "Evaluando muestra..."
                  : review?.hasReview
                  ? "Volver a evaluar muestra"
                  : "Evaluar muestra"}
              </div>
              <div className="mt-1 text-[11px] text-white/80">
                Revisión breve de enfoque, alcance, técnicas, fase de campo y justificación.
              </div>
            </div>
          </div>

          <Icon name="arrow_forward" className="shrink-0 text-lg" />
        </div>
      </button>

      {review?.reviewError ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {review.reviewError}
        </div>
      ) : null}

      {review?.hasReview && !review?.reviewLoading ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-[#FCFCFA] px-3 py-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Última evaluación
          </span>

          <div className="flex items-center gap-2">
            {score !== null ? (
              <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-[#005944]">
                {score}/100
              </span>
            ) : null}
            <span
              className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusMeta.badge}`}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
