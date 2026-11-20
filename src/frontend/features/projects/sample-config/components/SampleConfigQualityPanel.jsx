"use client";

import Icon from "@/components/common/Icon";
import EvaluationSummaryCard from "@/features/projects/workspace/components/EvaluationSummaryCard";
import {
  humanizeSampleConfigField,
  sampleConfigStatusMeta,
} from "@/features/projects/sample-config/helpers/sampleConfig.review.helpers";
import {
  getSampleConfigFieldTarget,
  navigateToWorkspaceField,
} from "@/features/projects/workspace/field-navigation";
import { humanizeReviewStatus } from "@/features/projects/workspace/reviewSidebar.helpers";

function LoadingSignalCard({ icon }) {
  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
        <Icon name={icon} className="text-lg text-slate-300" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-[86%] animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-[68%] animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function DimensionPill({ label, status }) {
  let tone = "border-slate-200 bg-slate-50 text-slate-600";

  if (
    status === "aligned" ||
    status === "adequate" ||
    status === "supported" ||
    status === "clear"
  ) {
    tone = "border-[#005944]/20 bg-[#005944]/8 text-[#005944]";
  } else if (
    status === "partially_aligned" ||
    status === "partial" ||
    status === "partially_supported"
  ) {
    tone = "border-yellow-200 bg-yellow-50 text-[#854D0E]";
  } else if (
    status === "misaligned" ||
    status === "insufficient" ||
    status === "unsupported" ||
    status === "unclear"
  ) {
    tone = "border-orange-200 bg-orange-50 text-[#C2410C]";
  }

  return (
    <div className="rounded-xl border p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${tone}`}
      >
        {humanizeReviewStatus(status)}
      </p>
    </div>
  );
}

function EmptyCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="analytics" className="text-[#005944]" />
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
          Señales de calidad
        </p>
      </div>

      <p className="font-serif text-xs leading-relaxed text-slate-700">
        Completa más campos de la muestra para que aparezca la evaluación
        heurística y luego puedas correr la revisión completa.
      </p>
    </div>
  );
}

function SampleSignalCard({ signal }) {
  const canNavigate = Boolean(
    signal?.field &&
      signal.field !== "coherence" &&
      signal.field !== "alignment",
  );

  function handleNavigate() {
    if (!canNavigate) return;

    navigateToWorkspaceField(getSampleConfigFieldTarget(signal.field));
  }

  return (
    <button
      type="button"
      onClick={handleNavigate}
      disabled={!canNavigate}
      className={`w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 text-left transition-colors ${
        canNavigate
          ? "cursor-pointer hover:border-[#005944]/25 hover:shadow-sm"
          : "cursor-default"
      }`}
      title={canNavigate ? "Ir al campo" : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
          {signal?.field ? humanizeSampleConfigField(signal.field) : "Señal"}
        </p>

        {canNavigate ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#005944]/10 bg-[#005944]/5 px-2 py-0.5 text-[9px] font-black text-[#005944]">
            <Icon name="ads_click" className="text-[12px]" />
            Ir al campo
          </span>
        ) : null}
      </div>

      <p className="mt-2 font-serif text-sm leading-relaxed text-slate-800">
        {signal?.message || signal?.text || signal?.title || "Sin detalle"}
      </p>

      {signal?.suggestion ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Sugerencia: {signal.suggestion}
        </p>
      ) : null}
    </button>
  );
}

function SampleSignalGroup({ title, signals }) {
  if (!signals.length) return null;

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {title}
      </p>

      {signals.map((signal, index) => (
        <SampleSignalCard
          key={`${signal?.field || "signal"}-${index}`}
          signal={signal}
        />
      ))}
    </div>
  );
}

export default function SampleConfigQualityPanel({
  loading = false,
  evaluation = null,
  review = null,
}) {
  const evaluationStatusMeta = sampleConfigStatusMeta(
    evaluation?.summary?.overall_status,
  );
  const reviewStatusMeta = sampleConfigStatusMeta(review?.overall_status);

  const activeSignals = [
    ...(Array.isArray(evaluation?.signals) ? evaluation.signals : []),
    ...(Array.isArray(review?.issues) ? review.issues : []),
  ];

  const fieldGroups = [
    ["Enfoque principal", "main_approach"],
    ["Alcance", "scope"],
    ["Técnicas de recolección", "collection_techniques"],
    ["Fase de campo", "field_phase"],
    ["Tamaño de muestra", "target_sample_size"],
    ["Justificación del tamaño", "sample_size_rationale"],
    ["Coherencia", "coherence"],
    ["Alineación", "alignment"],
  ].map(([title, field]) => ({
    title,
    signals: activeSignals.filter((signal) => signal?.field === field),
  }));

  const summaryMetrics = evaluation
    ? [
        {
          label: "Calificación",
          value: `${evaluation.summary.overall_score ?? "--"}/100`,
        },
        {
          label: "Problemas",
          value:
            (evaluation.summary.warning_signals ?? 0) +
            (evaluation.summary.critical_signals ?? 0),
        },
        { label: "Críticos", value: evaluation.summary.critical_signals ?? 0 },
        {
          label: "Completitud",
          value: `${evaluation.summary.completeness_score ?? 0}%`,
        },
        {
          label: "Técnicas",
          value: evaluation.summary.collection_techniques_count ?? 0,
        },
      ]
    : [];

  if (loading) {
    return (
      <>
        <div className="flex items-center gap-3 border-b border-slate-100 p-6">
          <Icon name="analytics" className="text-[#005944]" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Señales de calidad
          </h3>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <LoadingSignalCard icon="help" />
          <LoadingSignalCard icon="track_changes" />
          <LoadingSignalCard icon="checklist" />
        </div>
      </>
    );
  }

  if (!evaluation && !review) {
    return (
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
        <EmptyCard />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-100 p-6">
        <Icon name="analytics" className="text-[#005944]" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          Señales de calidad
        </h3>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {evaluation ? (
          <EvaluationSummaryCard
            statusTitle="Estado general de la muestra"
            statusLabel={evaluationStatusMeta.label}
            statusBadge={evaluationStatusMeta.badge}
            metrics={summaryMetrics}
          />
        ) : null}

        {evaluation?.concise_summary ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-serif text-xs leading-relaxed text-slate-700">
              {evaluation.concise_summary}
            </p>
          </div>
        ) : null}

        {evaluation?.coverage_check?.explanation ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Icon name="track_changes" className="text-[#005944]" />
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Cobertura interna
              </p>
            </div>

            <div className="grid gap-3">
              <DimensionPill
                label="Enfoque y alcance"
                status={evaluation.coverage_check.approach_scope_alignment}
              />
              <DimensionPill
                label="Técnicas"
                status={evaluation.coverage_check.techniques_alignment}
              />
              <DimensionPill
                label="Justificación del tamaño"
                status={
                  evaluation.coverage_check.sample_size_rationale_alignment
                }
              />
              <DimensionPill
                label="Fase de campo"
                status={evaluation.coverage_check.field_phase_context}
              />
            </div>

            <p className="mt-4 font-serif text-xs leading-relaxed text-slate-700">
              {evaluation.coverage_check.explanation}
            </p>
          </div>
        ) : null}

        {review ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Evaluación IA
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  Lectura global de la configuración de muestra
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${reviewStatusMeta.badge}`}
              >
                {reviewStatusMeta.label}
              </span>
            </div>

            <p className="font-serif text-xs leading-relaxed text-slate-700">
              {review.concise_summary}
            </p>

            {review.next_step ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-[#FCFCFA] px-3 py-2">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Siguiente paso sugerido
                </p>
                <p className="font-serif text-xs leading-relaxed text-slate-600">
                  {review.next_step}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeSignals.length ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="hub" className="text-[#005944]" />
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Observaciones por campo
              </p>
            </div>

            <div className="space-y-4">
              {fieldGroups.map((group) => (
                <SampleSignalGroup
                  key={group.title}
                  title={group.title}
                  signals={group.signals}
                />
              ))}
            </div>
          </div>
        ) : null}

        {review?.guiding_questions?.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Icon name="psychology" className="text-[#005944]" />
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Preguntas guía
              </p>
            </div>

            <div className="space-y-3">
              {review.guiding_questions.slice(0, 4).map((item, index) => (
                <div
                  key={`${item.question}-${index}`}
                  className="rounded-xl border border-slate-200 bg-[#FCFCFA] p-3"
                >
                  <p className="text-xs font-semibold text-slate-800">
                    {item.question}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    {item.purpose}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {review?.improvement_suggestions?.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Icon name="tips_and_updates" className="text-[#005944]" />
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Sugerencias de mejora
              </p>
            </div>

            <div className="space-y-3">
              {review.improvement_suggestions.slice(0, 4).map((item, index) => (
                <div
                  key={`${item.field}-${index}`}
                  className="rounded-xl border border-slate-200 bg-[#FCFCFA] p-3"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    {humanizeSampleConfigField(item.field)}
                  </p>
                  <p className="mt-1 font-serif text-xs leading-relaxed text-slate-700">
                    {item.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
