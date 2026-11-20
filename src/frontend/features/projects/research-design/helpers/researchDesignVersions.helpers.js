import { normalizeSpecificObjectives } from "@/features/projects/research-design/helpers/researchDesign.helpers";

function toText(value) {
  return String(value ?? "");
}

function normalizeCreatedBy(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.full_name ||
    value?.name ||
    value?.email ||
    value?.username ||
    ""
  );
}

function normalizeSnapshot(rawSnapshot) {
  if (!rawSnapshot || typeof rawSnapshot !== "object") {
    return null;
  }

  const design =
    rawSnapshot?.design ??
    rawSnapshot?.research_design ??
    rawSnapshot;

  const specificObjectives =
    rawSnapshot?.specific_objectives ??
    design?.specific_objectives ??
    [];

  return {
    research_question: toText(design?.research_question),
    general_objective: toText(design?.general_objective),
    specific_objectives: normalizeSpecificObjectives(specificObjectives),
  };
}

export function normalizeResearchDesignVersion(item = {}, index = 0) {
  return {
    id: item?.id ?? item?.version_id ?? `version-${index + 1}`,
    label:
      toText(item?.label).trim() ||
      toText(item?.title).trim() ||
      `Versión ${index + 1}`,
    revision:
      typeof item?.version_number === "number"
        ? item.version_number
        : typeof item?.revision === "number"
        ? item.revision
        : typeof item?.base_revision === "number"
        ? item.base_revision
        : 0,
    created_at: item?.created_at ?? item?.timestamp ?? null,
    created_by: normalizeCreatedBy(item?.created_by),
    snapshot: normalizeSnapshot(
      item?.snapshot ??
        item?.design_snapshot ??
        item?.payload ??
        item?.data
    ),
  };
}

export function normalizeResearchDesignVersionsResponse(rawVersions) {
  const safeItems = Array.isArray(rawVersions) ? rawVersions : [];

  return safeItems
    .map((item, index) => normalizeResearchDesignVersion(item, index))
    .sort((a, b) => {
      const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
}