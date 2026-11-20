import { FIELD_HELP_REGISTRY } from "@/features/projects/workspace/field-help/fieldHelp.data";

export function getFieldHelp(phase, field) {
  if (!phase || !field) return null;
  return FIELD_HELP_REGISTRY?.[phase]?.fields?.[field] ?? null;
}

export function getFieldHelpByKey(key) {
  if (!key || typeof key !== "string") return null;

  const [phase, field] = key.split(".");
  return getFieldHelp(phase, field);
}

export function getPhaseFieldHelps(phase) {
  if (!phase) return [];

  const phaseData = FIELD_HELP_REGISTRY?.[phase];
  if (!phaseData?.fields) return [];

  return Object.values(phaseData.fields);
}

export function getAllFieldHelps() {
  return Object.values(FIELD_HELP_REGISTRY).flatMap((phase) =>
    Object.values(phase.fields ?? {})
  );
}

export function getFieldHelpTitle(phase, field, fallback = "") {
  return getFieldHelp(phase, field)?.title ?? fallback;
}

export function getFieldHelpShortText(phase, field, fallback = "") {
  return getFieldHelp(phase, field)?.shortHelp ?? fallback;
}

export function getFieldHelpChecklist(phase, field) {
  return getFieldHelp(phase, field)?.quickChecklist ?? [];
}

export function getFieldHelpExamples(phase, field) {
  const help = getFieldHelp(phase, field);

  if (!help) {
    return {
      goodExample: "",
      weakExample: "",
    };
  }

  return {
    goodExample: help.goodExample ?? "",
    weakExample: help.weakExample ?? "",
  };
}

export function getSpecificObjectiveDisplayName(objective, fallbackIndex = 0) {
  const position =
    typeof objective?.position === "number"
      ? objective.position + 1
      : fallbackIndex + 1;

  return `Objetivo específico ${position}`;
}

export function getSpecificObjectiveSnippet(objective, maxLength = 90) {
  const text = String(objective?.text ?? "").trim();

  if (!text) return "Sin texto todavía.";
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength).trim()}...`;
}

export function buildSpecificObjectiveAnchor(objectiveId) {
  if (!objectiveId) return "";
  return `specific-objective-${objectiveId}`;
}

export function buildFieldAnchor(phase, field) {
  if (!phase || !field) return "";
  return `${phase}-${field}`;
}

export function buildFieldIssueLabel({ phase, field, objective, index }) {
  if (phase === "researchDesign" && field === "specific_objective") {
    return getSpecificObjectiveDisplayName(objective, index);
  }

  const help = getFieldHelp(phase, field);
  return help?.title ?? field;
}

export function normalizeFieldHelpIssue(issue = {}) {
  const field = issue.field ?? "";
  const objectiveId = issue.objective_id ?? issue.objectiveId ?? null;

  if (field === "specific_objectives" && objectiveId) {
    return {
      ...issue,
      phase: "researchDesign",
      field: "specific_objective",
      anchor: buildSpecificObjectiveAnchor(objectiveId),
    };
  }

  return {
    ...issue,
    phase: issue.phase ?? null,
    field,
    anchor: issue.phase ? buildFieldAnchor(issue.phase, field) : "",
  };
}