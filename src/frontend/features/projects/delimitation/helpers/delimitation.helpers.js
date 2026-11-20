function severityToSignalStyle(kind, severity) {
  if (kind === "fortaleza") {
    return {
      level: "Fortaleza",
      icon: "check_circle",
      color: "text-[#005944]",
      bg: "bg-[#005944]/5",
      border: "border-[#005944]",
    };
  }

  if (severity === "alta") {
    return {
      level: "Importante",
      icon: "warning",
      color: "text-[#C2410C]",
      bg: "bg-orange-50",
      border: "border-[#C2410C]",
    };
  }

  if (severity === "media") {
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

export function computeDelimitationProgress(model) {
  const checkpoints = [
    Boolean(model?.topic?.trim()),
    Boolean(model?.context_place?.trim()),
    Boolean(model?.time_period?.trim()),
    Boolean(model?.population?.trim()),
    Boolean(model?.resources?.trim()),
    Array.isArray(model?.include) && model.include.length > 0,
    Array.isArray(model?.exclude) && model.exclude.length > 0,
  ];

  const completed = checkpoints.filter(Boolean).length;
  return Math.round((completed / checkpoints.length) * 100);
}

export function isDelimitationComplete(model = {}) {
  const requiredTextFields = [
    "topic",
    "context_place",
    "time_period",
    "population",
    "resources",
  ];

  return (
    requiredTextFields.every((field) => Boolean(String(model?.[field] ?? "").trim())) &&
    Array.isArray(model?.include) &&
    model.include.length > 0 &&
    Array.isArray(model?.exclude) &&
    model.exclude.length > 0
  );
}

export function withDerivedDelimitationState(model) {
  return {
    ...model,
    globalProgress: computeDelimitationProgress(model),
    statusBadge: model?.statusBadge ?? "Draft Guardado",
  };
}

export function normalizeDelimitationResponse(apiDataMaybeWrapped) {
  const payload = apiDataMaybeWrapped?.data ?? apiDataMaybeWrapped ?? {};
  const delim = payload.delim ?? payload ?? {};

  return withDerivedDelimitationState({
    topic: delim.topic ?? "",
    context_place: delim.context_place ?? "",
    time_period: delim.time_period ?? "",
    population: delim.population ?? "",
    resources: delim.resources ?? "",
    revision: Number.isInteger(delim.revision) && delim.revision >= 0
      ? delim.revision
      : 0,
    include: Array.isArray(payload.include) ? payload.include : [],
    exclude: Array.isArray(payload.exclude) ? payload.exclude : [],
    signals: Array.isArray(payload.signals) ? payload.signals : [],
    jackQuestion:
      payload.jackQuestion ??
      "¿Tu delimitación responde claramente qué, dónde, cuándo y con quién vas a investigar?",
  });
}

function normalizeFinding(finding = {}) {
  const style = severityToSignalStyle(finding?.kind, finding?.severity);

  const title = String(finding?.title ?? "").trim();
  const message = String(finding?.message ?? "").trim();
  const suggestion = String(finding?.suggestion ?? "").trim();

  return {
    field: String(finding?.field ?? "overall").trim(),
    level: style.level,
    icon: style.icon,
    color: style.color,
    bg: style.bg,
    border: style.border,
    title,
    message,
    suggestion,
    text: [title, message].filter(Boolean).join(": "),
  };
}

export function normalizeDelimitationReviewResponse(rawReview) {
  const review = rawReview ?? {};
  const findings = Array.isArray(review?.findings) ? review.findings : [];

  return {
    source: review?.source === "heuristic" ? "heuristic" : "ai",
    summary: String(review?.summary ?? "").trim(),
    overall: {
      score:
        typeof review?.overall?.score === "number"
          ? review.overall.score
          : null,
      verdict: String(review?.overall?.verdict ?? "").trim(),
      rationale: String(review?.overall?.rationale ?? "").trim(),
    },
    fields:
      review?.fields && typeof review.fields === "object" ? review.fields : {},
    findings,
    signals: findings.map(normalizeFinding),
    jackQuestion: String(review?.jackQuestion ?? "").trim(),
    suggestedNextStep: String(review?.suggestedNextStep ?? "").trim(),
  };
}
