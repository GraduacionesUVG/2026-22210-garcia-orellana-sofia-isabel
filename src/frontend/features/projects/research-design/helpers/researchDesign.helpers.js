function makeTempId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return `temp-objective-${globalThis.crypto.randomUUID()}`;
  }

  return `temp-objective-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function toText(value) {
  return String(value ?? "");
}

function evaluationSeverityStyle(severity) {
  if (severity === "critical") {
    return {
      level: "Importante",
      icon: "warning",
      color: "text-[#C2410C]",
      bg: "bg-orange-50",
      border: "border-[#C2410C]",
    };
  }

  if (severity === "warning") {
    return {
      level: "A revisar",
      icon: "help",
      color: "text-[#854D0E]",
      bg: "bg-yellow-50/50",
      border: "border-[#854D0E]",
    };
  }

  return {
    level: "Detalle",
    icon: "info",
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-300",
  };
}

export function researchDesignStatusMeta(status) {
  switch (status) {
    case "good":
      return {
        label: "Sólido",
        badge: "bg-[#005944]/8 text-[#005944] border-[#005944]/20",
      };
    case "warning":
      return {
        label: "Mejorable",
        badge: "bg-yellow-50 text-[#854D0E] border-yellow-200",
      };
    case "critical":
      return {
        label: "Crítico",
        badge: "bg-orange-50 text-[#C2410C] border-orange-200",
      };
    default:
      return {
        label: "Sin evaluar",
        badge: "bg-slate-50 text-slate-500 border-slate-200",
      };
  }
}

export function humanizeResearchDesignField(field) {
  switch (field) {
    case "research_question":
      return "Pregunta";
    case "general_objective":
      return "Objetivo general";
    case "specific_objectives":
      return "Objetivos específicos";
    case "coherence":
      return "Coherencia";
    case "alignment":
      return "Alineación con delimitación";
    default:
      return "Campo";
  }
}

function normalizeEvaluationIssue(issue = {}, extra = {}) {
  const severity = String(issue?.severity ?? "info").trim();
  const style = evaluationSeverityStyle(severity);

  return {
    code: String(issue?.code ?? "").trim(),
    field: String(issue?.field ?? extra.field ?? "coherence").trim(),
    severity,
    message: String(issue?.message ?? "").trim(),
    suggestion: String(issue?.suggestion ?? "").trim(),
    objective_id: issue?.objective_id ?? extra.objective_id ?? null,
    objective_position:
      typeof extra.objective_position === "number"
        ? extra.objective_position
        : null,
    objective_text: String(extra.objective_text ?? "").trim(),
    matched_terms: Array.isArray(issue?.matched_terms)
      ? issue.matched_terms
      : [],
    level: style.level,
    icon: style.icon,
    color: style.color,
    bg: style.bg,
    border: style.border,
  };
}

function normalizeReviewIssue(issue = {}) {
  const severity = String(issue?.severity ?? "info").trim();
  const style = evaluationSeverityStyle(severity);

  return {
    field: String(issue?.field ?? "coherence").trim(),
    severity,
    title: String(issue?.title ?? "").trim(),
    explanation: String(issue?.explanation ?? "").trim(),
    suggestion: String(issue?.suggestion ?? "").trim(),
    affected_specific_objective_ids: Array.isArray(
      issue?.affected_specific_objective_ids
    )
      ? issue.affected_specific_objective_ids
      : [],
    level: style.level,
    icon: style.icon,
    color: style.color,
    bg: style.bg,
    border: style.border,
    text: [
      String(issue?.title ?? "").trim(),
      String(issue?.explanation ?? "").trim(),
    ]
      .filter(Boolean)
      .join(": "),
  };
}

function normalizeAlignmentCheck(check = {}) {
  return {
    status: String(check?.status ?? "not_applicable").trim(),
    source_text: String(check?.source_text ?? "").trim(),
    matched_terms: Array.isArray(check?.matched_terms)
      ? check.matched_terms
      : [],
  };
}

function normalizeAlignmentField(field = {}) {
  return {
    status: String(field?.status ?? "empty").trim(),
    issues: Array.isArray(field?.issues)
      ? field.issues.map((issue) => normalizeEvaluationIssue(issue))
      : [],
    checks: {
      topic: normalizeAlignmentCheck(field?.checks?.topic),
      population: normalizeAlignmentCheck(field?.checks?.population),
      context_place: normalizeAlignmentCheck(field?.checks?.context_place),
      time_period: normalizeAlignmentCheck(field?.checks?.time_period),
    },
    explanation: String(field?.explanation ?? "").trim(),
  };
}

function clampScore(value) {
  return Math.max(1, Math.min(100, Math.round(Number(value || 0))));
}

function deriveResearchDesignScore(evaluation = {}) {
  const summary = evaluation?.summary ?? {};
  const totalIssues =
    typeof summary.total_issues === "number" ? summary.total_issues : 0;
  const criticalIssues =
    typeof summary.critical_issues === "number" ? summary.critical_issues : 0;
  const warningIssues =
    typeof summary.warning_issues === "number" ? summary.warning_issues : 0;

  if (
    !summary.has_question &&
    !summary.has_general_objective &&
    !summary.specific_objectives_count
  ) {
    return 1;
  }

  if (totalIssues === 0) return 100;

  return clampScore(100 - criticalIssues * 18 - warningIssues * 8);
}

function makeHighlight({ text, term, issue, index }) {
  const sourceText = String(text ?? "");
  const termText = String(term ?? "").trim();
  if (!termText) return null;

  const lowerSource = sourceText.toLowerCase();
  const lowerTerm = termText.toLowerCase();
  const start = sourceText ? lowerSource.indexOf(lowerTerm) : 0;

  if (start < 0) return null;

  return {
    id: `${issue?.code ?? "issue"}-${termText}-${index}`,
    start,
    end: start + termText.length,
    text: sourceText ? sourceText.slice(start, start + termText.length) : termText,
    severity: issue?.severity ?? "warning",
    tooltip: [issue?.message, issue?.suggestion].filter(Boolean).join(" "),
  };
}

function highlightsFromIssues(text, issues = []) {
  const highlights = [];

  issues.forEach((issue, issueIndex) => {
    const terms = Array.isArray(issue?.matched_terms)
      ? issue.matched_terms
      : [];

    terms.forEach((term, termIndex) => {
      const highlight = makeHighlight({
        text,
        term,
        issue,
        index: `${issueIndex}-${termIndex}`,
      });

      if (highlight) highlights.push(highlight);
    });
  });

  return highlights;
}

export function buildResearchDesignFieldHighlights(evaluation = {}, model = {}) {
  const specificItems = Array.isArray(evaluation?.specific_objectives?.items)
    ? evaluation.specific_objectives.items
    : [];

  const specificById = {};

  specificItems.forEach((item) => {
    const itemText =
      String(
        model?.specific_objectives?.find?.((objective) => objective.id === item.id)
          ?.text ?? item?.text ?? ""
      );

    specificById[item.id] = highlightsFromIssues(itemText, item.issues);
  });

  return {
    research_question: highlightsFromIssues(
      model?.research_question ?? "",
      evaluation?.question?.issues
    ),
    general_objective: highlightsFromIssues(
      model?.general_objective ?? "",
      evaluation?.general_objective?.issues
    ),
    specific_objectives: highlightsFromIssues(
      "",
      evaluation?.specific_objectives?.issues
    ),
    specific_objectives_by_id: specificById,
  };
}

export function normalizeSpecificObjective(item = {}, index = 0) {
  const text = toText(item?.text);
  const isTemp =
    Boolean(item?._temp) ||
    !item?.id ||
    String(item?.id ?? "").startsWith("temp-objective-");

  return {
    id: item?.id ?? makeTempId(),
    text,
    position: Number.isInteger(item?.position) ? item.position : index,
    revision: typeof item?.revision === "number" ? item.revision : 0,
    created_at: item?.created_at ?? null,
    updated_at: item?.updated_at ?? null,
    created_by: item?.created_by ?? null,
    updated_by: item?.updated_by ?? null,
    _temp: isTemp,
    _dirty: Boolean(item?._dirty),
    _lastSavedText:
      typeof item?._lastSavedText === "string"
        ? item._lastSavedText
        : isTemp
        ? ""
        : text,
  };
}

export function normalizeSpecificObjectives(items = []) {
  const safeItems = Array.isArray(items) ? items : [];

  return safeItems
    .slice()
    .sort((a, b) => {
      const aPos = Number.isInteger(a?.position) ? a.position : 0;
      const bPos = Number.isInteger(b?.position) ? b.position : 0;
      return aPos - bPos;
    })
    .map((item, index) =>
      normalizeSpecificObjective(
        {
          ...item,
          position: index,
        },
        index
      )
    );
}

export function createLocalSpecificObjective(overrides = {}) {
  return normalizeSpecificObjective({
    id: overrides.id,
    text: overrides.text ?? "",
    position: overrides.position ?? 0,
    revision: overrides.revision ?? 0,
    created_at: overrides.created_at ?? null,
    updated_at: overrides.updated_at ?? null,
    created_by: overrides.created_by ?? null,
    updated_by: overrides.updated_by ?? null,
    _temp: true,
    _dirty: Boolean(overrides._dirty),
    _lastSavedText: "",
  });
}

export function computeResearchDesignProgress(model) {
  const specificObjectives = normalizeSpecificObjectives(
    model?.specific_objectives
  );

  const hasSpecificObjective = specificObjectives.some((item) =>
    String(item?.text ?? "").trim()
  );

  const checkpoints = [
    Boolean(String(model?.research_question ?? "").trim()),
    Boolean(String(model?.general_objective ?? "").trim()),
    hasSpecificObjective,
  ];

  const completed = checkpoints.filter(Boolean).length;
  return Math.round((completed / checkpoints.length) * 100);
}

export function buildResearchDesignPersistedSignature(model = {}) {
  const persistedObjectives = Array.isArray(model?.specific_objectives)
    ? model.specific_objectives.filter((item) => !item?._temp)
    : [];

  return [
    `rev:${typeof model?.revision === "number" ? model.revision : 0}`,
    ...persistedObjectives.map(
      (item) =>
        `${item.id}:${typeof item?.revision === "number" ? item.revision : 0}`
    ),
  ].join("|");
}

export function withDerivedResearchDesignState(model = {}) {
  const normalizedObjectives = normalizeSpecificObjectives(
    model?.specific_objectives
  );

  return {
    ...model,
    research_question: toText(model?.research_question),
    general_objective: toText(model?.general_objective),
    specific_objectives: normalizedObjectives,
    revision: typeof model?.revision === "number" ? model.revision : 0,
    created_at: model?.created_at ?? null,
    updated_at: model?.updated_at ?? null,
    created_by: model?.created_by ?? null,
    updated_by: model?.updated_by ?? null,
    globalProgress: computeResearchDesignProgress({
      ...model,
      specific_objectives: normalizedObjectives,
    }),
    statusBadge: model?.statusBadge ?? "Draft Guardado",
  };
}

export function normalizeResearchDesignResponse(apiDataMaybeWrapped) {
  const payload = apiDataMaybeWrapped?.data ?? apiDataMaybeWrapped ?? {};
  const design = payload?.design ?? payload ?? {};

  return withDerivedResearchDesignState({
    research_question: design?.research_question ?? "",
    general_objective: design?.general_objective ?? "",
    revision: typeof design?.revision === "number" ? design.revision : 0,
    created_at: design?.created_at ?? null,
    updated_at: design?.updated_at ?? null,
    created_by: design?.created_by ?? null,
    updated_by: design?.updated_by ?? null,
    specific_objectives: Array.isArray(payload?.specific_objectives)
      ? payload.specific_objectives
      : [],
  });
}

export function normalizeResearchDesignLoadResponse(apiDataMaybeWrapped) {
  const payload = apiDataMaybeWrapped?.data ?? apiDataMaybeWrapped ?? {};
  const hasEvaluation =
    payload?.evaluation && typeof payload.evaluation === "object";

  return {
    model: normalizeResearchDesignResponse(payload),
    evaluation: hasEvaluation
      ? normalizeResearchDesignEvaluationResponse(payload.evaluation)
      : null,
  };
}

export function mergeServerResearchDesignSafely(
  prev,
  submittedDraft,
  savedDesign
) {
  return withDerivedResearchDesignState({
    ...prev,
    research_question:
      prev.research_question === submittedDraft.research_question
        ? savedDesign?.research_question ?? prev.research_question
        : prev.research_question,
    general_objective:
      prev.general_objective === submittedDraft.general_objective
        ? savedDesign?.general_objective ?? prev.general_objective
        : prev.general_objective,
    revision:
      typeof savedDesign?.revision === "number"
        ? savedDesign.revision
        : prev.revision ?? 0,
    created_at: savedDesign?.created_at ?? prev.created_at ?? null,
    updated_at: savedDesign?.updated_at ?? prev.updated_at ?? null,
    created_by: savedDesign?.created_by ?? prev.created_by ?? null,
    updated_by: savedDesign?.updated_by ?? prev.updated_by ?? null,
  });
}

export function appendLocalSpecificObjective(prev) {
  return withDerivedResearchDesignState({
    ...prev,
    specific_objectives: [
      ...(Array.isArray(prev?.specific_objectives)
        ? prev.specific_objectives
        : []),
      createLocalSpecificObjective({
        position: Array.isArray(prev?.specific_objectives)
          ? prev.specific_objectives.length
          : 0,
      }),
    ],
  });
}

export function markSpecificObjectiveDirty(prev, objectiveId, text) {
  return withDerivedResearchDesignState({
    ...prev,
    specific_objectives: (prev?.specific_objectives ?? []).map((item) =>
      item.id === objectiveId
        ? {
            ...item,
            text,
            _dirty: true,
          }
        : item
    ),
  });
}

export function removeSpecificObjectiveById(prev, objectiveId) {
  return withDerivedResearchDesignState({
    ...prev,
    specific_objectives: (prev?.specific_objectives ?? []).filter(
      (item) => item.id !== objectiveId
    ),
  });
}

export function replaceSpecificObjectivesFromServer(prev, objectives = []) {
  return withDerivedResearchDesignState({
    ...prev,
    specific_objectives: normalizeSpecificObjectives(objectives),
  });
}

export function mergeSavedSpecificObjective(
  prev,
  targetObjectiveId,
  submittedText,
  savedObjective
) {
  const normalizedSaved = normalizeSpecificObjective(savedObjective);
  const previousItem =
    (prev?.specific_objectives ?? []).find(
      (item) => item.id === targetObjectiveId
    ) ??
    (prev?.specific_objectives ?? []).find(
      (item) => item.id === normalizedSaved.id
    ) ??
    null;

  const freshestText = toText(previousItem?.text ?? submittedText);
  const serverText = toText(normalizedSaved.text);

  const mergedItem = {
    ...normalizedSaved,
    text: freshestText,
    _temp: false,
    _dirty: freshestText.trim() !== serverText.trim(),
    _lastSavedText: serverText,
  };

  let replaced = false;

  const nextObjectives = (prev?.specific_objectives ?? []).map((item) => {
    if (item.id !== targetObjectiveId) return item;
    replaced = true;
    return mergedItem;
  });

  if (!replaced) {
    nextObjectives.push(mergedItem);
  }

  return withDerivedResearchDesignState({
    ...prev,
    specific_objectives: nextObjectives,
  });
}

export function hasMeaningfulResearchDesignContent(model = {}) {
  return Boolean(
    String(model?.research_question ?? "").trim() ||
      String(model?.general_objective ?? "").trim() ||
      (Array.isArray(model?.specific_objectives) &&
        model.specific_objectives.some((item) =>
          String(item?.text ?? "").trim()
        ))
  );
}

export function normalizeResearchDesignEvaluationResponse(rawInput) {
  const payload = rawInput?.data ?? rawInput ?? {};
  const evaluation = payload?.evaluation ?? payload ?? {};

  const questionIssues = Array.isArray(evaluation?.question?.issues)
    ? evaluation.question.issues.map((issue) =>
        normalizeEvaluationIssue(issue, { field: "research_question" })
      )
    : [];

  const generalObjectiveIssues = Array.isArray(
    evaluation?.general_objective?.issues
  )
    ? evaluation.general_objective.issues.map((issue) =>
        normalizeEvaluationIssue(issue, { field: "general_objective" })
      )
    : [];

  const specificObjectiveContainerIssues = Array.isArray(
    evaluation?.specific_objectives?.issues
  )
    ? evaluation.specific_objectives.issues.map((issue) =>
        normalizeEvaluationIssue(issue, { field: "specific_objectives" })
      )
    : [];

  const specificObjectiveItems = Array.isArray(
    evaluation?.specific_objectives?.items
  )
    ? evaluation.specific_objectives.items.map((item, index) => {
        const normalizedIssues = Array.isArray(item?.issues)
          ? item.issues.map((issue) =>
              normalizeEvaluationIssue(issue, {
                field: "specific_objectives",
                objective_id: item?.id ?? null,
                objective_position:
                  typeof item?.position === "number" ? item.position : index,
                objective_text: item?.text ?? "",
              })
            )
          : [];

        return {
          id: item?.id ?? `objective-${index + 1}`,
          text: String(item?.text ?? "").trim(),
          position:
            typeof item?.position === "number" ? item.position : index,
          status: String(item?.status ?? "empty").trim(),
          issues: normalizedIssues,
        };
      })
    : [];

  const coherenceIssues = Array.isArray(evaluation?.coherence?.issues)
    ? evaluation.coherence.issues.map((issue) =>
        normalizeEvaluationIssue(issue, { field: "coherence" })
      )
    : [];

  const alignmentIssues = Array.isArray(evaluation?.alignment?.issues)
    ? evaluation.alignment.issues.map((issue) =>
        normalizeEvaluationIssue(issue, { field: "alignment" })
      )
    : [];

  const alignmentByField = {
    research_question: normalizeAlignmentField(
      evaluation?.alignment?.by_field?.research_question
    ),
    general_objective: normalizeAlignmentField(
      evaluation?.alignment?.by_field?.general_objective
    ),
    specific_objectives: normalizeAlignmentField(
      evaluation?.alignment?.by_field?.specific_objectives
    ),
  };

  const signals = [
    ...questionIssues,
    ...generalObjectiveIssues,
    ...specificObjectiveContainerIssues,
    ...specificObjectiveItems.flatMap((item) => item.issues),
    ...coherenceIssues,
    ...alignmentIssues,
  ];

  const summary = {
      has_question: Boolean(evaluation?.summary?.has_question),
      has_general_objective: Boolean(
        evaluation?.summary?.has_general_objective
      ),
      specific_objectives_count:
        typeof evaluation?.summary?.specific_objectives_count === "number"
          ? evaluation.summary.specific_objectives_count
          : 0,
      total_issues:
        typeof evaluation?.summary?.total_issues === "number"
          ? evaluation.summary.total_issues
          : signals.length,
      critical_issues:
        typeof evaluation?.summary?.critical_issues === "number"
          ? evaluation.summary.critical_issues
          : signals.filter((item) => item.severity === "critical").length,
      warning_issues:
        typeof evaluation?.summary?.warning_issues === "number"
          ? evaluation.summary.warning_issues
          : signals.filter((item) => item.severity === "warning").length,
      alignment_issues:
        typeof evaluation?.summary?.alignment_issues === "number"
          ? evaluation.summary.alignment_issues
          : alignmentIssues.length,
      overall_status: String(
        evaluation?.summary?.overall_status ?? "empty"
      ).trim(),
    };

  return {
    summary: {
      ...summary,
      overall_score: deriveResearchDesignScore({ summary }),
    },
    question: {
      status: String(evaluation?.question?.status ?? "empty").trim(),
      issues: questionIssues,
    },
    general_objective: {
      status: String(evaluation?.general_objective?.status ?? "empty").trim(),
      issues: generalObjectiveIssues,
    },
    specific_objectives: {
      status: String(
        evaluation?.specific_objectives?.status ?? "empty"
      ).trim(),
      issues: specificObjectiveContainerIssues,
      items: specificObjectiveItems,
    },
    coherence: {
      status: String(evaluation?.coherence?.status ?? "empty").trim(),
      issues: coherenceIssues,
    },
    alignment: {
      status: String(evaluation?.alignment?.status ?? "empty").trim(),
      issues: alignmentIssues,
      by_field: alignmentByField,
      explanation: String(evaluation?.alignment?.explanation ?? "").trim(),
    },
    signals,
  };
}

export function normalizeResearchDesignAiReviewResponse(rawInput) {
  const payload = rawInput?.data ?? rawInput ?? {};
  const aiReview = payload?.ai_review ?? payload ?? {};
  const coverageCheck =
    aiReview?.coverage_check && typeof aiReview.coverage_check === "object"
      ? aiReview.coverage_check
      : {};

  const delimitationAlignment =
    aiReview?.delimitation_alignment &&
    typeof aiReview.delimitation_alignment === "object"
      ? aiReview.delimitation_alignment
      : {};

  return {
    overall_status: String(aiReview?.overall_status ?? "").trim(),
    concise_summary: String(aiReview?.concise_summary ?? "").trim(),
    issues: Array.isArray(aiReview?.issues)
      ? aiReview.issues.map((issue) => normalizeReviewIssue(issue))
      : [],
    guiding_questions: Array.isArray(aiReview?.guiding_questions)
      ? aiReview.guiding_questions.map((item) => ({
          question: String(item?.question ?? "").trim(),
          purpose: String(item?.purpose ?? "").trim(),
        }))
      : [],
    improvement_suggestions: Array.isArray(aiReview?.improvement_suggestions)
      ? aiReview.improvement_suggestions.map((item) => ({
          field: String(item?.field ?? "").trim(),
          suggestion: String(item?.suggestion ?? "").trim(),
        }))
      : [],
    coverage_check: {
      question_vs_general_objective: String(
        coverageCheck?.question_vs_general_objective ?? ""
      ).trim(),
      specific_objectives_vs_question: String(
        coverageCheck?.specific_objectives_vs_question ?? ""
      ).trim(),
      specific_objectives_vs_general_objective: String(
        coverageCheck?.specific_objectives_vs_general_objective ?? ""
      ).trim(),
      explanation: String(coverageCheck?.explanation ?? "").trim(),
    },
    delimitation_alignment: {
      topic: String(delimitationAlignment?.topic ?? "not_applicable").trim(),
      population: String(
        delimitationAlignment?.population ?? "not_applicable"
      ).trim(),
      context_place: String(
        delimitationAlignment?.context_place ?? "not_applicable"
      ).trim(),
      time_period: String(
        delimitationAlignment?.time_period ?? "not_applicable"
      ).trim(),
      explanation: String(delimitationAlignment?.explanation ?? "").trim(),
    },
    next_step: String(aiReview?.next_step ?? "").trim(),
  };
}

export function normalizeResearchDesignReviewResponse(rawInput) {
  const payload = rawInput?.data ?? rawInput ?? {};
  const evaluation = normalizeResearchDesignEvaluationResponse(payload?.evaluation);
  const aiReview = normalizeResearchDesignAiReviewResponse(payload?.ai_review);

  return {
    evaluation,
    ai_review: {
      ...aiReview,
      overall_score:
        typeof payload?.ai_review?.overall_score === "number"
          ? clampScore(payload.ai_review.overall_score)
          : deriveResearchDesignScore(evaluation),
    },
    meta: {
      model: String(payload?.meta?.model ?? "").trim(),
    },
  };
}

export const EMPTY_RESEARCH_DESIGN = withDerivedResearchDesignState({
  research_question: "",
  general_objective: "",
  specific_objectives: [],
  revision: 0,
  created_at: null,
  updated_at: null,
  created_by: null,
  updated_by: null,
});
