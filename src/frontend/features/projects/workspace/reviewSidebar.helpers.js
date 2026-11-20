const REVIEW_STATUS_LABELS = {
  aligned: "Alineado",
  partially_aligned: "Parcialmente alineado",
  misaligned: "Desalineado",
  covered: "Cubierto",
  partially_covered: "Parcialmente cubierto",
  not_covered: "No cubierto",
  good: "Adecuado",
  warning: "A revisar",
  critical: "Crítico",
  adequate: "Adecuado",
  supported: "Sustentado",
  clear: "Claro",
  partial: "Parcial",
  partially_supported: "Parcialmente sustentado",
  insufficient: "Insuficiente",
  unsupported: "No sustentado",
  unclear: "Poco claro",
  empty: "Pendiente",
  not_applicable: "No aplica",
};

export function humanizeReviewStatus(status) {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (!normalized) return "Sin dato";

  return (
    REVIEW_STATUS_LABELS[normalized] ||
    normalized.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase())
  );
}

export function buildDelimitationSummaryMetrics(review = {}) {
  const findings = Array.isArray(review?.findings) ? review.findings : [];
  const issues = findings.filter((finding) => finding?.kind !== "fortaleza");
  const fields =
    review?.fields && typeof review.fields === "object" ? review.fields : {};
  const completedFields = Object.values(fields).filter(
    (field) => field?.status && field.status !== "pendiente",
  ).length;

  return [
    {
      label: "Calificación",
      value:
        typeof review?.overall?.score === "number"
          ? `${review.overall.score}/100`
          : "--",
    },
    { label: "Problemas", value: issues.length },
    {
      label: "Críticos",
      value: issues.filter((finding) => finding?.severity === "alta").length,
    },
    { label: "Componentes", value: completedFields },
  ];
}

export function buildDelimitationHeuristicSummary({
  model = {},
  heuristics = {},
} = {}) {
  const fields = [
    "topic",
    "context_place",
    "time_period",
    "population",
    "resources",
  ];
  const completedFields =
    fields.filter((field) => String(model?.[field] ?? "").trim()).length +
    (Array.isArray(model?.include) && model.include.length > 0 ? 1 : 0) +
    (Array.isArray(model?.exclude) && model.exclude.length > 0 ? 1 : 0);
  const totalHighlights = Math.max(0, Number(heuristics?.totalHighlights ?? 0));
  const score = Math.max(
    0,
    Math.round(
      (completedFields / 7) * 90 - Math.min(totalHighlights * 2, 10),
    ),
  );
  const signals = Array.isArray(heuristics?.signals) ? heuristics.signals : [];
  const fieldSignals = signals.filter((signal) => signal?.field !== "overall");
  const criticalSignals = fieldSignals.filter((signal) => {
    const raw = `${signal?.level ?? ""} ${signal?.severity ?? ""}`.toLowerCase();
    return (
      raw.includes("muy amplio") ||
      raw.includes("pendiente") ||
      raw.includes("importante") ||
      raw.includes("alta")
    );
  });
  const problemCount = fieldSignals.length || 7 - completedFields;

  return {
    score,
    verdict: score >= 80 ? "Razonable" : score >= 50 ? "Mejorable" : "Pendiente",
    metrics: [
      { label: "Calificación", value: `${score}/100` },
      { label: "Problemas", value: problemCount },
      { label: "Críticos", value: criticalSignals.length },
      { label: "Componentes", value: completedFields },
    ],
  };
}

export function buildResearchDesignSummaryMetrics(evaluation = {}) {
  const summary = evaluation?.summary ?? {};

  return [
    {
      label: "Calificación",
      value:
        typeof summary.overall_score === "number"
          ? `${summary.overall_score}/100`
          : "--",
    },
    { label: "Problemas", value: summary.total_issues ?? 0 },
    { label: "Críticos", value: summary.critical_issues ?? 0 },
    {
      label: "Obj. específicos",
      value: summary.specific_objectives_count ?? 0,
    },
    { label: "Alineación", value: summary.alignment_issues ?? 0 },
  ];
}
