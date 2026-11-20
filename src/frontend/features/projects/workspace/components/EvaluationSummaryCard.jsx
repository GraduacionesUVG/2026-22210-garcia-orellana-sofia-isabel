"use client";

export default function EvaluationSummaryCard({
  statusTitle,
  statusLabel,
  statusBadge,
  metrics = [],
}) {
  const hasOddMetricCount = metrics.length % 2 === 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Evaluación estructural
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-700">
            {statusTitle}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${statusBadge}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`rounded-xl border border-slate-200 bg-[#FCFCFA] px-3 py-2.5 ${
              hasOddMetricCount && index === metrics.length - 1
                ? "col-span-2"
                : ""
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              {metric.label}
            </p>
            <p className="mt-1 text-base font-bold text-slate-800">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
