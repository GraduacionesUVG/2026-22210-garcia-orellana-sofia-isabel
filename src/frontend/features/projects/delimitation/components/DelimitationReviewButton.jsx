"use client";

import Icon from "@/components/common/Icon";
import { useDelimitationContext } from "@/features/projects/delimitation/components/DelimitationProvider";

function verdictLabel(verdict) {
  switch (verdict) {
    case "bien_delimitada":
      return "Bien delimitada";
    case "mejorable":
      return "Mejorable";
    case "muy_amplia":
      return "Muy amplia";
    default:
      return "Sin evaluación";
  }
}

export default function DelimitationReviewButton() {
  const { review } = useDelimitationContext();

  const score = review?.reviewResult?.overall?.score ?? null;
  const verdict = review?.reviewResult?.overall?.verdict ?? "";
  const isDisabled = !review?.canEvaluate || review?.reviewLoading;

  return (
    <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4">
      <button
        type="button"
        onClick={review?.evaluateReview}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition-all disabled:cursor-not-allowed disabled:shadow-none ${
          isDisabled
            ? "border-slate-200 bg-slate-100 text-slate-400"
            : "border-[#005944]/15 bg-[#005944] text-white hover:bg-[#004232]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                isDisabled ? "bg-slate-200" : "bg-white/12"
              }`}
            >
              <Icon
                name={review?.reviewLoading ? "autorenew" : "fact_check"}
                className={`text-lg ${review?.reviewLoading ? "animate-spin" : ""}`}
              />
            </span>

            <div>
              <div className="text-[11px] font-black uppercase tracking-widest">
                {review?.reviewLoading
                  ? "Evaluando delimitación..."
                  : review?.hasReview
                  ? "Volver a evaluar"
                  : "Evaluar delimitación"}
              </div>
              <div
                className={`mt-1 text-[11px] ${
                  isDisabled ? "text-slate-500" : "text-white/80"
                }`}
              >
                Revisión estructurada del alcance, precisión y viabilidad.
              </div>
            </div>
          </div>

          <Icon name="arrow_forward" className="text-lg shrink-0" />
        </div>
      </button>

      {!review?.canEvaluate && !review?.reviewLoading ? (
        <p className="mt-2 px-1 text-[11px] leading-5 text-slate-500">
          Completa los cinco campos de delimitación y agrega al menos un criterio de inclusión y uno de exclusión para evaluar.
        </p>
      ) : null}

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
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-[#005944] border border-slate-200">
                {score}/100
              </span>
            ) : null}

            <span className="text-[10px] font-semibold text-slate-500">
              {verdictLabel(verdict)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
