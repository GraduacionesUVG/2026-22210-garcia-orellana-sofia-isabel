"use client";

function text(value) {
  return String(value ?? "").trim();
}

function safeTechniques(model = {}) {
  return Array.isArray(model?.collection_techniques)
    ? model.collection_techniques.filter((item) => {
        const label = String(item?.custom_label ?? "").trim();
        const code = String(item?.technique_code ?? "").trim();
        return item?.is_custom ? Boolean(label) : Boolean(code);
      })
    : [];
}

function clampScore(value) {
  return Math.max(1, Math.min(100, Math.round(Number(value || 0))));
}

function deriveSampleConfigScore(summary = {}) {
  const completeness =
    typeof summary.completeness_score === "number"
      ? summary.completeness_score
      : 1;
  const critical =
    typeof summary.critical_signals === "number" ? summary.critical_signals : 0;
  const warning =
    typeof summary.warning_signals === "number" ? summary.warning_signals : 0;

  return clampScore(completeness - critical * 10 - warning * 4);
}

export function buildSampleConfigFieldHighlights(model = {}, evaluation = {}) {
  const highlights = {
    field_phase: [],
    sample_size_rationale: [],
  };

  const textFields = new Set(["field_phase", "sample_size_rationale"]);
  const signals = Array.isArray(evaluation?.signals) ? evaluation.signals : [];

  signals.forEach((signal, index) => {
    if (!textFields.has(signal?.field)) return;
    if (!["warning", "critical"].includes(signal?.severity)) return;

    const value = String(model?.[signal.field] ?? "");
    if (!value.trim()) return;

    highlights[signal.field].push({
      id: `${signal.field}-${signal.severity}-${index}`,
      start: 0,
      end: value.length,
      text: value,
      severity: signal.severity,
      tooltip: [signal.message, signal.suggestion].filter(Boolean).join(" "),
    });
  });

  return highlights;
}

export function sampleConfigStatusMeta(status) {
  switch (status) {
    case "good":
      return {
        label: "Sólida",
        badge: "bg-[#005944]/8 text-[#005944] border-[#005944]/20",
      };
    case "warning":
      return {
        label: "Mejorable",
        badge: "bg-yellow-50 text-[#854D0E] border-yellow-200",
      };
    case "critical":
      return {
        label: "Crítica",
        badge: "bg-orange-50 text-[#C2410C] border-orange-200",
      };
    default:
      return {
        label: "Sin evaluar",
        badge: "bg-slate-50 text-slate-500 border-slate-200",
      };
  }
}

export function humanizeSampleConfigField(field) {
  switch (field) {
    case "main_approach":
      return "Enfoque principal";
    case "scope":
      return "Alcance";
    case "collection_techniques":
      return "Técnicas de recolección";
    case "field_phase":
      return "Fase de campo";
    case "target_sample_size":
      return "Tamaño de muestra";
    case "sample_size_rationale":
      return "Justificación del tamaño";
    case "coherence":
      return "Coherencia";
    default:
      return "Campo";
  }
}

export function computeLiveSampleConfigEvaluation(model = {}) {
  const mainApproach = text(model?.main_approach_code);
  const scope = text(model?.scope_code);
  const fieldPhase = text(model?.field_phase);
  const sampleSize = text(model?.target_sample_size);
  const rationale = text(model?.sample_size_rationale);
  const techniques = safeTechniques(model);

  const hasMainApproach = Boolean(mainApproach);
  const hasScope = Boolean(scope);
  const hasFieldPhase = Boolean(fieldPhase);
  const hasSampleSize = Boolean(sampleSize);
  const hasRationale = Boolean(rationale);
  const hasTechniques = techniques.length > 0;

  const completenessChecks = [
    hasMainApproach,
    hasScope,
    hasTechniques,
    hasFieldPhase,
    hasSampleSize,
    hasRationale,
  ];

  const completenessScore = Math.round(
    (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100
  );

  const fieldPhaseStatus =
    fieldPhase.length >= 50 ? "clear" : fieldPhase.length > 0 ? "partial" : "unclear";

  const techniquesStatus =
    techniques.length >= 2 ? "adequate" : techniques.length === 1 ? "partial" : "insufficient";

  const rationaleStatus =
    hasSampleSize && rationale.length >= 40
      ? "supported"
      : (hasSampleSize && rationale.length > 0) || (!hasSampleSize && rationale.length >= 40)
      ? "partially_supported"
      : "unsupported";

  const approachScopeStatus =
    hasMainApproach && hasScope
      ? "aligned"
      : hasMainApproach || hasScope
      ? "partially_aligned"
      : "misaligned";

  const signals = [];

  signals.push({
    field: "main_approach",
    severity: hasMainApproach ? "info" : "warning",
    message: hasMainApproach
      ? "El enfoque principal ya está definido."
      : "Todavía falta definir el enfoque principal de la muestra.",
    suggestion: hasMainApproach
      ? ""
      : "Define con claridad desde qué enfoque metodológico se construye la muestra.",
  });

  signals.push({
    field: "scope",
    severity: hasScope ? "info" : "warning",
    message: hasScope
      ? "El alcance ya está definido."
      : "Todavía falta definir el alcance de esta fase.",
    suggestion: hasScope
      ? ""
      : "Aclara si el alcance de esta fase ya está suficientemente delimitado.",
  });

  signals.push({
    field: "collection_techniques",
    severity:
      techniques.length >= 2 ? "info" : techniques.length === 1 ? "warning" : "critical",
    message:
      techniques.length >= 2
        ? `Ya hay ${techniques.length} técnicas registradas.`
        : techniques.length === 1
        ? "Solo hay una técnica registrada; conviene revisar si basta para sostener la muestra."
        : "No se han definido técnicas de recolección todavía.",
    suggestion:
      techniques.length >= 2
        ? ""
        : "Revisa si las técnicas elegidas realmente permiten acceder al tipo de evidencia que necesitas.",
  });

  signals.push({
    field: "field_phase",
    severity:
      fieldPhase.length >= 50 ? "info" : fieldPhase.length > 0 ? "warning" : "critical",
    message:
      fieldPhase.length >= 50
        ? "La fase de campo ya tiene contexto suficiente para una primera lectura."
        : fieldPhase.length > 0
        ? "La fase de campo está descrita, pero todavía puede ganar contexto."
        : "Falta describir la fase de campo.",
    suggestion:
      fieldPhase.length >= 50
        ? ""
        : "Explica mejor en qué momento del trabajo de campo está la muestra y qué acceso real existe.",
  });

  signals.push({
    field: "target_sample_size",
    severity: hasSampleSize ? "info" : "warning",
    message: hasSampleSize
      ? `El tamaño de muestra ya está definido en ${sampleSize}.`
      : "Todavía no se ha definido el tamaño de muestra.",
    suggestion: hasSampleSize
      ? ""
      : "Indica un tamaño preliminar para poder evaluar su viabilidad y coherencia.",
  });

  signals.push({
    field: "sample_size_rationale",
    severity:
      rationale.length >= 40 ? "info" : rationale.length > 0 ? "warning" : "critical",
    message:
      rationale.length >= 40
        ? "La justificación del tamaño de muestra ya tiene desarrollo inicial."
        : rationale.length > 0
        ? "La justificación existe, pero todavía es corta o poco defendible."
        : "Falta justificar el tamaño de muestra.",
    suggestion:
      rationale.length >= 40
        ? ""
        : "Explica por qué ese tamaño es razonable para el acceso, el tipo de evidencia y el momento del estudio.",
  });

  const criticalCount = signals.filter((item) => item.severity === "critical").length;
  const warningCount = signals.filter((item) => item.severity === "warning").length;

  const overallStatus =
    criticalCount > 0
      ? "critical"
      : warningCount > 0 || completenessScore < 85
      ? "warning"
      : "good";

  let conciseSummary =
    "La configuración de muestra ya tiene una base útil para seguir afinándose.";

  if (overallStatus === "critical") {
    conciseSummary =
      "La muestra todavía tiene vacíos importantes que conviene resolver antes de confiar en su coherencia metodológica.";
  } else if (overallStatus === "warning") {
    conciseSummary =
      "La muestra va tomando forma, pero todavía hay decisiones que necesitan más claridad o mejor justificación.";
  }

  const coverageCheck = {
    approach_scope_alignment: approachScopeStatus,
    techniques_alignment: techniquesStatus,
    sample_size_rationale_alignment: rationaleStatus,
    field_phase_context: fieldPhaseStatus,
    explanation:
      overallStatus === "good"
        ? "La estructura básica de la muestra se ve consistente a nivel formal."
        : overallStatus === "warning"
        ? "La muestra ya tiene varios elementos definidos, pero aún hay partes que deben afinarse para que la decisión metodológica se sostenga mejor."
        : "La muestra todavía no ofrece suficiente base estructural para considerarla metodológicamente sólida.",
  };

  return {
    summary: {
      overall_status: overallStatus,
      completeness_score: completenessScore,
      overall_score: deriveSampleConfigScore({
        completeness_score: completenessScore,
        warning_signals: warningCount,
        critical_signals: criticalCount,
      }),
      total_signals: signals.length,
      warning_signals: warningCount,
      critical_signals: criticalCount,
      collection_techniques_count: techniques.length,
      target_sample_size: hasSampleSize ? sampleSize : "No definido",
    },
    signals,
    coverage_check: coverageCheck,
    concise_summary: conciseSummary,
  };
}
