"use client";

import Icon from "@/components/common/Icon";
import EvaluationSummaryCard from "@/features/projects/workspace/components/EvaluationSummaryCard";
import {
  humanizeResearchDesignField,
  researchDesignStatusMeta,
} from "@/features/projects/research-design/helpers/researchDesign.helpers";
import {
  getResearchDesignFieldTarget,
  getSpecificObjectiveTarget,
  navigateToWorkspaceField,
} from "@/features/projects/workspace/field-navigation";
import {
  buildResearchDesignSummaryMetrics,
  humanizeReviewStatus,
} from "@/features/projects/workspace/reviewSidebar.helpers";

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

function SmallStatusPill({ value }) {
  const meta = researchDesignStatusMeta(value);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}

function DimensionPill({ label, status }) {
  let tone = "border-slate-200 bg-slate-50 text-slate-600";

  if (status === "aligned" || status === "covered" || status === "good") {
    tone = "border-[#005944]/20 bg-[#005944]/8 text-[#005944]";
  } else if (
    status === "partially_aligned" ||
    status === "partially_covered" ||
    status === "warning"
  ) {
    tone = "border-yellow-200 bg-yellow-50 text-[#854D0E]";
  } else if (
    status === "misaligned" ||
    status === "not_covered" ||
    status === "critical"
  ) {
    tone = "border-orange-200 bg-orange-50 text-[#C2410C]";
  }

  return (
    <div className="rounded-xl border border-slate-200 p-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${tone}`}
      >
        {humanizeReviewStatus(status)}
      </p>
    </div>
  );
}

function AlignmentFieldCard({ title, data }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{title}</p>
        </div>

        <SmallStatusPill value={data?.status} />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <DimensionPill label="Tema" status={data?.checks?.topic?.status} />
        <DimensionPill
          label="Población"
          status={data?.checks?.population?.status}
        />
        <DimensionPill
          label="Contexto"
          status={data?.checks?.context_place?.status}
        />
        <DimensionPill
          label="Tiempo"
          status={data?.checks?.time_period?.status}
        />
      </div>

    </div>
  );
}

function getIssueTone(severity) {
  if (severity === "critical") {
    return {
      label: "Importante",
      icon: "warning",
      card: "border-orange-200 bg-orange-50/60",
      badge: "border-orange-200 bg-orange-50 text-[#C2410C]",
      iconColor: "text-[#C2410C]",
    };
  }

  if (severity === "warning") {
    return {
      label: "A revisar",
      icon: "help",
      card: "border-yellow-200 bg-yellow-50/70",
      badge: "border-yellow-200 bg-yellow-50 text-[#854D0E]",
      iconColor: "text-[#854D0E]",
    };
  }

  return {
    label: "Detalle",
    icon: "info",
    card: "border-slate-200 bg-slate-50",
    badge: "border-slate-200 bg-slate-50 text-slate-500",
    iconColor: "text-slate-500",
  };
}

function normalizeId(value) {
  return String(value ?? "").trim();
}

function getObjectiveNumber(item, fallbackIndex = 0) {
  const position = Number.isInteger(item?.position)
    ? item.position
    : fallbackIndex;

  return position + 1;
}

function getObjectiveText(objective, evaluationItem) {
  return String(objective?.text ?? evaluationItem?.text ?? "").trim();
}

function issueTargetsObjective(issue, objective, position) {
  const objectiveId = normalizeId(objective?.id);

  if (objectiveId && normalizeId(issue?.objective_id) === objectiveId) {
    return true;
  }

  const affectedIds = Array.isArray(issue?.affected_specific_objective_ids)
    ? issue.affected_specific_objective_ids.map((id) => normalizeId(id))
    : [];

  if (objectiveId && affectedIds.includes(objectiveId)) {
    return true;
  }

  if (
    typeof issue?.objective_position === "number" &&
    issue.objective_position === position
  ) {
    return true;
  }

  return false;
}

function findEvaluationItem(evaluationItems, objective, fallbackIndex) {
  const objectiveId = normalizeId(objective?.id);
  const objectivePosition = Number.isInteger(objective?.position)
    ? objective.position
    : fallbackIndex;

  return (
    evaluationItems.find((item) => {
      const itemId = normalizeId(item?.id);
      return objectiveId && itemId && itemId === objectiveId;
    }) ??
    evaluationItems.find((item) => item?.position === objectivePosition) ??
    null
  );
}

function normalizePanelIssue(issue = {}, source = "Revisión") {
  const rawTitle = String(issue?.title ?? "").trim();
  const rawMessage = String(issue?.message ?? issue?.text ?? "").trim();
  const rawExplanation = String(issue?.explanation ?? "").trim();

  const title =
    rawTitle || (rawMessage.length <= 90 ? rawMessage : "Problema detectado");

  const explanation =
    rawExplanation || (rawMessage && rawMessage !== title ? rawMessage : "");

  return {
    ...issue,
    source,
    severity: String(issue?.severity ?? "info").trim(),
    title,
    explanation,
    suggestion: String(issue?.suggestion ?? "").trim(),
  };
}

function buildSpecificObjectiveCards({
  specificObjectives,
  evaluation,
  review,
}) {
  const objectives = Array.isArray(specificObjectives)
    ? specificObjectives
    : [];

  const evaluationItems = Array.isArray(evaluation?.specific_objectives?.items)
    ? evaluation.specific_objectives.items
    : [];

  const baseObjectives = objectives.length ? objectives : evaluationItems;

  const reviewIssues = Array.isArray(review?.issues) ? review.issues : [];

  return baseObjectives
    .map((objective, index) => {
      const position = Number.isInteger(objective?.position)
        ? objective.position
        : index;

      const evaluationItem = findEvaluationItem(
        evaluationItems,
        objective,
        index,
      );

      const evaluationIssues = Array.isArray(evaluationItem?.issues)
        ? evaluationItem.issues.map((issue) =>
            normalizePanelIssue(issue, "Evaluación estructural"),
          )
        : [];

      const aiIssues = reviewIssues
        .filter(
          (issue) =>
            issue?.field === "specific_objectives" &&
            issueTargetsObjective(issue, objective, position),
        )
        .map((issue) => normalizePanelIssue(issue, "Evaluación IA"));

      const issues = [...evaluationIssues, ...aiIssues];

      if (!issues.length) return null;

      return {
        id: normalizeId(objective?.id) || `objective-${index + 1}`,
        number: getObjectiveNumber(objective, index),
        text: getObjectiveText(objective, evaluationItem),
        status: evaluationItem?.status || "",
        issues,
      };
    })
    .filter(Boolean);
}

function buildGeneralSpecificObjectiveIssues({ evaluation, review }) {
  const evaluationContainerIssues = Array.isArray(
    evaluation?.specific_objectives?.issues,
  )
    ? evaluation.specific_objectives.issues.map((issue) =>
        normalizePanelIssue(issue, "Evaluación estructural"),
      )
    : [];

  const alignmentIssues = Array.isArray(evaluation?.alignment?.issues)
    ? evaluation.alignment.issues
        .filter((issue) => issue?.field === "specific_objectives")
        .map((issue) => normalizePanelIssue(issue, "Alineación"))
    : [];

  const specificAlignmentIssues = Array.isArray(
    evaluation?.alignment?.by_field?.specific_objectives?.issues,
  )
    ? evaluation.alignment.by_field.specific_objectives.issues.map((issue) =>
        normalizePanelIssue(issue, "Alineación"),
      )
    : [];

  const reviewGeneralIssues = Array.isArray(review?.issues)
    ? review.issues
        .filter((issue) => {
          const hasAffectedIds =
            Array.isArray(issue?.affected_specific_objective_ids) &&
            issue.affected_specific_objective_ids.length > 0;

          return issue?.field === "specific_objectives" && !hasAffectedIds;
        })
        .map((issue) => normalizePanelIssue(issue, "Evaluación IA"))
    : [];

  const reviewSuggestions = Array.isArray(review?.improvement_suggestions)
    ? review.improvement_suggestions
        .filter((item) => item?.field === "specific_objectives")
        .map((item) =>
          normalizePanelIssue(
            {
              severity: "info",
              title: "Sugerencia general",
              explanation: item?.suggestion,
            },
            "Sugerencia IA",
          ),
        )
    : [];

  return [
    ...evaluationContainerIssues,
    ...alignmentIssues,
    ...specificAlignmentIssues,
    ...reviewGeneralIssues,
    ...reviewSuggestions,
  ];
}

function ObservationCard({
  source = "Revisión",
  severity = "info",
  title = "",
  explanation = "",
  suggestion = "",
  canNavigate = false,
  navigateLabel = "Ir al campo",
}) {
  const tone = getIssueTone(severity);
  const shouldShowExplanation =
    explanation && explanation.toLowerCase() !== title.toLowerCase();

  return (
    <div className={`rounded-2xl border p-3.5 ${tone.card}`}>
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-white/80 ${tone.badge}`}
        >
          <Icon name={tone.icon} className={`text-[15px] ${tone.iconColor}`} />
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
            {source}
          </span>

          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${tone.badge}`}
          >
            {tone.label}
          </span>

          {canNavigate ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#005944]/10 bg-[#005944]/5 px-2 py-0.5 text-[9px] font-black text-[#005944]">
              <Icon name="ads_click" className="text-[12px]" />
              {navigateLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2">
        <p className="text-xs font-bold leading-relaxed text-slate-900">
          {title || "Problema detectado"}
        </p>

        {shouldShowExplanation ? (
          <p className="mt-2 font-serif text-xs leading-relaxed text-slate-700">
            {explanation}
          </p>
        ) : null}

        {suggestion ? (
          <div className="mt-3 rounded-xl border border-white/70 bg-white/75 px-3 py-2.5">
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Sugerencia
            </p>

            <p className="text-xs leading-relaxed text-slate-600">
              {suggestion}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IssueBlock({ issue }) {
  return (
    <ObservationCard
      source={issue?.source || "Revisión"}
      severity={issue?.severity}
      title={String(issue?.title ?? "").trim()}
      explanation={String(issue?.explanation ?? "").trim()}
      suggestion={String(issue?.suggestion ?? "").trim()}
    />
  );
}

function SpecificObjectiveCard({ card }) {
  function handleNavigate() {
    navigateToWorkspaceField(getSpecificObjectiveTarget(card.id));
  }

  return (
    <button
      type="button"
      onClick={handleNavigate}
      className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#005944]/25 hover:shadow-md"
      title={`Ir al objetivo específico ${card.number}`}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-sm font-black text-slate-900">
              Objetivo específico {card.number}
            </p>

            <span className="inline-flex items-center gap-1 rounded-full border border-[#005944]/10 bg-[#005944]/5 px-2 py-0.5 text-[9px] font-black text-[#005944] opacity-0 transition-opacity group-hover:opacity-100">
              <Icon name="ads_click" className="text-[12px]" />
              Ir al objetivo
            </span>
          </div>

          <span className="shrink-0 rounded-full border border-slate-200 bg-[#FCFCFA] px-2.5 py-1 text-[10px] font-black text-slate-500">
            {card.issues.length} {card.issues.length === 1 ? "señal" : "señales"}
          </span>
        </div>

        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Este bloque muestra problemas asociados a este objetivo específico, no a
          todos los objetivos en general.
        </p>
      </div>

      {card.text ? (
        <div className="mb-3 rounded-xl border border-slate-200 bg-[#FCFCFA] px-3 py-2">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Texto actual
          </p>
          <p className="font-serif text-xs leading-relaxed text-slate-700">
            {card.text}
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {card.issues.map((issue, index) => (
          <IssueBlock
            key={`${card.id}-${issue.source}-${issue.title}-${index}`}
            issue={issue}
          />
        ))}
      </div>
    </button>
  );
}

function GeneralSpecificObjectivesCard({ issues }) {
  if (!issues.length) return null;

  function handleNavigate() {
    navigateToWorkspaceField(
      getResearchDesignFieldTarget("specific_objective"),
    );
  }

  return (
    <button
      type="button"
      onClick={handleNavigate}
      className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#005944]/25 hover:shadow-md"
      title="Ir a objetivos específicos"
    >
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <Icon name="format_list_numbered" className="text-[#005944]" />
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-sm font-black text-slate-900">
              Objetivos específicos en general
            </p>

            <span className="inline-flex items-center gap-1 rounded-full border border-[#005944]/10 bg-[#005944]/5 px-2 py-0.5 text-[9px] font-black text-[#005944] opacity-0 transition-opacity group-hover:opacity-100">
              <Icon name="ads_click" className="text-[12px]" />
              Ir al campo
            </span>
          </div>
        </div>

        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Estas señales afectan al conjunto de objetivos, no a un objetivo
          específico individual.
        </p>
      </div>

      <div className="space-y-3">
        {issues.map((issue, index) => (
          <IssueBlock
            key={`general-specific-objectives-${issue.source}-${issue.title}-${index}`}
            issue={issue}
          />
        ))}
      </div>
    </button>
  );
}

function DetailSignalCard({ signal, index }) {
  const canNavigate = Boolean(
    signal?.field &&
      ["research_question", "general_objective", "specific_objectives"].includes(
        signal.field,
      ),
  );

  const targetField =
    signal?.field === "specific_objectives"
      ? "specific_objective"
      : signal?.field;

  const title = String(
    signal?.title ?? signal?.message ?? signal?.text ?? "",
  ).trim();
  const explanation = String(signal?.explanation ?? "").trim();
  const source =
    signal?.displayLabel || signal?.source ||
    (signal?.field
      ? humanizeResearchDesignField(signal.field)
      : "Revisión");

  function handleNavigate() {
    if (!canNavigate) return;

    navigateToWorkspaceField(getResearchDesignFieldTarget(targetField));
  }

  return (
    <button
      key={`${signal?.field || "signal"}-${index}`}
      type="button"
      onClick={handleNavigate}
      disabled={!canNavigate}
      className={`w-full rounded-2xl p-0 text-left transition-colors ${
        canNavigate
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm"
          : "cursor-default"
      }`}
      title={canNavigate ? "Ir al campo" : undefined}
    >
      <ObservationCard
        source={source}
        severity={signal?.severity}
        title={title || "Señal detectada"}
        explanation={explanation}
        suggestion={String(signal?.suggestion ?? "").trim()}
        canNavigate={canNavigate}
      />
    </button>
  );
}

function DetailSignalGroup({ title, signals }) {
  if (!signals.length) return null;

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {title}
      </p>

      {signals.map((signal, index) => (
        <DetailSignalCard
          key={`${signal?.field || "signal"}-${index}`}
          signal={signal}
          index={index}
        />
      ))}
    </div>
  );
}

export default function ResearchDesignQualityPanel({
  evaluationLoading = false,
  evaluationError = "",
  evaluation = null,
  review = null,
  reviewMeta = null,
  specificObjectives = [],
}) {
  const evaluationStatusMeta = researchDesignStatusMeta(
    evaluation?.summary?.overall_status,
  );

  const reviewStatusMeta = researchDesignStatusMeta(review?.overall_status);

  const evaluationSignals = Array.isArray(evaluation?.signals)
    ? evaluation.signals
    : [];
  const reviewSignals = Array.isArray(review?.issues) ? review.issues : [];
  const activeSignals = [...evaluationSignals, ...reviewSignals].filter(
    (signal, index, allSignals) => {
      const signalKey = (candidate) =>
        [
          candidate?.field,
          candidate?.code,
          candidate?.message,
          candidate?.text,
          candidate?.title,
          candidate?.explanation,
          candidate?.suggestion,
        ]
          .map((value) => String(value ?? "").trim().toLowerCase())
          .join("|");

      const key = signalKey(signal);
      const firstMatch = allSignals.findIndex((candidate) => {
        return signalKey(candidate) === key;
      });

      return index === firstMatch;
    },
  );

  const detailSignals = activeSignals.filter(
    (signal) => signal?.field !== "specific_objectives",
  );

  const buildAlignmentFieldSignals = (field) =>
    Array.isArray(evaluation?.alignment?.by_field?.[field]?.issues)
      ? evaluation.alignment.by_field[field].issues.map((signal) => ({
          ...signal,
          field,
          displayLabel: "Alineación con delimitación",
        }))
      : [];

  const questionAlignmentSignals = buildAlignmentFieldSignals(
    "research_question",
  );
  const generalObjectiveAlignmentSignals = buildAlignmentFieldSignals(
    "general_objective",
  );
  const specificObjectiveAlignmentSignals = buildAlignmentFieldSignals(
    "specific_objectives",
  );
  const alignmentIssueCodes = new Set(
    [
      ...questionAlignmentSignals,
      ...generalObjectiveAlignmentSignals,
      ...specificObjectiveAlignmentSignals,
    ]
      .map((signal) => signal?.code)
      .filter(Boolean),
  );

  const questionSignals = [
    ...detailSignals.filter((signal) => signal?.field === "research_question"),
    ...questionAlignmentSignals,
  ];
  const generalObjectiveSignals = [
    ...detailSignals.filter((signal) => signal?.field === "general_objective"),
    ...generalObjectiveAlignmentSignals,
  ];
  const coherenceSignals = detailSignals.filter(
    (signal) => signal?.field === "coherence",
  );
  const alignmentSignals = detailSignals.filter(
    (signal) =>
      signal?.field === "alignment" && !alignmentIssueCodes.has(signal?.code),
  );

  const specificObjectiveCards = buildSpecificObjectiveCards({
    specificObjectives,
    evaluation,
    review,
  });

  const generalSpecificObjectiveIssues = buildGeneralSpecificObjectiveIssues({
    evaluation,
    review,
  });

  const nonSpecificImprovementSuggestions = Array.isArray(
    review?.improvement_suggestions,
  )
    ? review.improvement_suggestions.filter(
        (item) => item?.field !== "specific_objectives",
      )
    : [];
  const summaryMetrics = buildResearchDesignSummaryMetrics(evaluation);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-100 p-6">
        <Icon name="analytics" className="text-[#005944]" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          Señales de calidad
        </h3>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {evaluationError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            {evaluationError}
          </div>
        ) : null}

        {evaluationLoading ? (
          <>
            <LoadingSignalCard icon="help" />
            <LoadingSignalCard icon="track_changes" />
            <LoadingSignalCard icon="checklist" />
          </>
        ) : (
          <>
            {evaluation ? (
              <EvaluationSummaryCard
                statusTitle="Estado general del diseño"
                statusLabel={evaluationStatusMeta.label}
                statusBadge={evaluationStatusMeta.badge}
                metrics={summaryMetrics}
              />
            ) : null}

            {evaluation?.alignment?.by_field ? (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <Icon name="hub" className="text-[#005944]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Observaciones por campo
                  </p>
                </div>

                <div className="space-y-3">
                  <AlignmentFieldCard
                    title="Pregunta de investigación"
                    data={evaluation.alignment.by_field.research_question}
                  />
                  <DetailSignalGroup
                    title="Observaciones de la pregunta"
                    signals={questionSignals}
                  />
                </div>

                <div className="space-y-3">
                  <AlignmentFieldCard
                    title="Objetivo general"
                    data={evaluation.alignment.by_field.general_objective}
                  />
                  <DetailSignalGroup
                    title="Observaciones del objetivo general"
                    signals={generalObjectiveSignals}
                  />
                </div>

                <div className="space-y-3">
                  <AlignmentFieldCard
                    title="Objetivos específicos"
                    data={evaluation.alignment.by_field.specific_objectives}
                  />

                  <GeneralSpecificObjectivesCard
                    issues={generalSpecificObjectiveIssues}
                  />

                  {specificObjectiveCards.map((card) => (
                    <SpecificObjectiveCard key={card.id} card={card} />
                  ))}
                </div>

                <DetailSignalGroup
                  title="Problemas de coherencia"
                  signals={coherenceSignals}
                />
                <DetailSignalGroup
                  title="Observaciones de alineación"
                  signals={alignmentSignals}
                />
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
                      Lectura global del diseño
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

                {reviewMeta?.model ? (
                  <p className="mt-3 text-[10px] text-slate-400">
                    Modelo: {reviewMeta.model}
                  </p>
                ) : null}
              </div>
            ) : null}

            {review?.coverage_check?.explanation ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Icon name="track_changes" className="text-[#005944]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Cobertura interna
                  </p>
                </div>

                <div className="grid gap-3">
                  <DimensionPill
                    label="Pregunta vs objetivo general"
                    status={review.coverage_check.question_vs_general_objective}
                  />
                  <DimensionPill
                    label="Objetivos vs pregunta"
                    status={
                      review.coverage_check.specific_objectives_vs_question
                    }
                  />
                  <DimensionPill
                    label="Objetivos vs objetivo general"
                    status={
                      review.coverage_check
                        .specific_objectives_vs_general_objective
                    }
                  />
                </div>

                <p className="mt-4 font-serif text-xs leading-relaxed text-slate-700">
                  {review.coverage_check.explanation}
                </p>
              </div>
            ) : null}

            {review?.delimitation_alignment?.explanation ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Icon name="schema" className="text-[#005944]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Lectura IA de alineación entre fases
                  </p>
                </div>

                <div className="grid gap-3">
                  <DimensionPill
                    label="Tema"
                    status={review.delimitation_alignment.topic}
                  />
                  <DimensionPill
                    label="Población"
                    status={review.delimitation_alignment.population}
                  />
                  <DimensionPill
                    label="Contexto"
                    status={review.delimitation_alignment.context_place}
                  />
                  <DimensionPill
                    label="Tiempo"
                    status={review.delimitation_alignment.time_period}
                  />
                </div>

                <p className="mt-4 font-serif text-xs leading-relaxed text-slate-700">
                  {review.delimitation_alignment.explanation}
                </p>
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

            {nonSpecificImprovementSuggestions.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Icon name="tips_and_updates" className="text-[#005944]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Sugerencias de mejora
                  </p>
                </div>

                <div className="space-y-3">
                  {nonSpecificImprovementSuggestions
                    .slice(0, 4)
                    .map((item, index) => (
                      <div
                        key={`${item.field}-${index}`}
                        className="rounded-xl border border-slate-200 bg-[#FCFCFA] p-3"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                          {humanizeResearchDesignField(item.field)}
                        </p>
                        <p className="mt-1 font-serif text-xs leading-relaxed text-slate-700">
                          {item.suggestion}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
