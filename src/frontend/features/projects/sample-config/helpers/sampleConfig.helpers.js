"use client";

export const EMPTY_SAMPLE_CONFIG = {
  project_id: "",
  main_approach_code: null,
  scope_code: null,
  field_phase: "",
  target_sample_size: null,
  sample_size_rationale: "",
  revision: 0,
  created_at: "",
  updated_at: "",
  created_by: null,
  updated_by: null,
};

export const EMPTY_SAMPLE_OPTIONS = {
  main_approaches: [],
  scopes: [],
  collection_technique_options: [],
};

function createClientId() {
  return `tmp_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function normalizeSampleConfigResponse(projectId, payload) {
  return {
    config: {
      ...EMPTY_SAMPLE_CONFIG,
      project_id: projectId,
      ...(payload?.config ?? {}),
    },
    collection_techniques: Array.isArray(payload?.collection_techniques)
      ? payload.collection_techniques
      : [],
  };
}

export function normalizeSampleConfigOptions(payload) {
  return {
    main_approaches: Array.isArray(payload?.main_approaches)
      ? payload.main_approaches
      : [],
    scopes: Array.isArray(payload?.scopes) ? payload.scopes : [],
    collection_technique_options: Array.isArray(
      payload?.collection_technique_options
    )
      ? payload.collection_technique_options
      : [],
  };
}

export function normalizeSampleConfigLoadResponse(projectId, payload) {
  return {
    sampleData: normalizeSampleConfigResponse(projectId, payload),
    options: normalizeSampleConfigOptions(payload?.options),
    hasEmbeddedOptions:
      payload?.options && typeof payload.options === "object",
  };
}

export function buildSampleConfigFormModel(sampleData) {
  const config = sampleData?.config ?? {};

  return {
    main_approach_code: config.main_approach_code ?? "",
    scope_code: config.scope_code ?? "",
    field_phase: config.field_phase ?? "",
    target_sample_size:
      config.target_sample_size === null ||
      config.target_sample_size === undefined
        ? ""
        : String(config.target_sample_size),
    sample_size_rationale: config.sample_size_rationale ?? "",
    collection_techniques: Array.isArray(sampleData?.collection_techniques)
      ? sampleData.collection_techniques.map((item) => ({
          clientId: item.id || createClientId(),
          technique_code: item.technique_code ?? null,
          custom_label: item.custom_label ?? null,
          is_custom: !!item.is_custom,
        }))
      : [],
  };
}

export function normalizeSampleTechnique(item) {
  return {
    technique_code: item.is_custom ? null : item.technique_code ?? null,
    custom_label: item.is_custom ? item.custom_label?.trim() || null : null,
    is_custom: !!item.is_custom,
  };
}

export function buildSampleConfigComparableSnapshot(model) {
  return JSON.stringify({
    main_approach_code: model.main_approach_code || null,
    scope_code: model.scope_code || null,
    field_phase: String(model.field_phase ?? "").trim(),
    target_sample_size:
      model.target_sample_size === "" ? null : Number(model.target_sample_size),
    sample_size_rationale: String(model.sample_size_rationale ?? "").trim(),
    collection_techniques: Array.isArray(model.collection_techniques)
      ? model.collection_techniques
          .map(normalizeSampleTechnique)
          .filter(
            (item) =>
              (item.is_custom && item.custom_label) ||
              (!item.is_custom && item.technique_code)
          )
      : [],
  });
}

export function buildSampleConfigPayload(model, serverRevision) {
  return {
    base_revision: serverRevision,
    main_approach_code: model.main_approach_code || null,
    scope_code: model.scope_code || null,
    field_phase: model.field_phase,
    target_sample_size:
      model.target_sample_size === ""
        ? null
        : Number.parseInt(model.target_sample_size, 10),
    sample_size_rationale: model.sample_size_rationale,
    collection_techniques: Array.isArray(model.collection_techniques)
      ? model.collection_techniques
          .map(normalizeSampleTechnique)
          .filter(
            (item) =>
              (item.is_custom && item.custom_label) ||
              (!item.is_custom && item.technique_code)
          )
      : [],
  };
}

export function buildSampleConfigProgressFromModel(model) {
  const checks = [
    !!model.main_approach_code,
    !!model.scope_code,
    Array.isArray(model.collection_techniques) &&
      model.collection_techniques.length > 0,
    String(model.field_phase ?? "").trim().length > 0,
    String(model.target_sample_size ?? "").trim().length > 0,
    String(model.sample_size_rationale ?? "").trim().length > 0,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

export function buildDraftConfigFromModel(projectId, persistedConfig, model) {
  return {
    ...(persistedConfig ?? EMPTY_SAMPLE_CONFIG),
    project_id: projectId,
    main_approach_code: model.main_approach_code || null,
    scope_code: model.scope_code || null,
    field_phase: model.field_phase,
    target_sample_size:
      model.target_sample_size === ""
        ? null
        : Number.parseInt(model.target_sample_size, 10),
    sample_size_rationale: model.sample_size_rationale,
  };
}

export function buildDraftCollectionTechniques(projectId, model) {
  return (Array.isArray(model.collection_techniques)
    ? model.collection_techniques
    : []
  ).map((item, index) => ({
    id: item.clientId,
    project_id: projectId,
    technique_code: item.is_custom ? null : item.technique_code ?? null,
    custom_label: item.is_custom ? item.custom_label ?? null : null,
    is_custom: item.is_custom,
    position: index,
  }));
}

export function hasMeaningfulSampleConfigContent(model = {}) {
  const techniques = Array.isArray(model?.collection_techniques)
    ? model.collection_techniques
    : [];

  return Boolean(
    String(model?.main_approach_code ?? "").trim() ||
      String(model?.scope_code ?? "").trim() ||
      String(model?.field_phase ?? "").trim() ||
      String(model?.target_sample_size ?? "").trim() ||
      String(model?.sample_size_rationale ?? "").trim() ||
      techniques.length > 0
  );
}

export function buildSampleConfigDraftSignature(model = {}) {
  return JSON.stringify({
    main_approach_code: String(model?.main_approach_code ?? ""),
    scope_code: String(model?.scope_code ?? ""),
    field_phase: String(model?.field_phase ?? ""),
    target_sample_size: String(model?.target_sample_size ?? ""),
    sample_size_rationale: String(model?.sample_size_rationale ?? ""),
    collection_techniques: Array.isArray(model?.collection_techniques)
      ? model.collection_techniques.map((item) => ({
          technique_code: item?.technique_code ?? null,
          custom_label: item?.custom_label ?? null,
          is_custom: !!item?.is_custom,
        }))
      : [],
  });
}

export function normalizeSampleConfigReviewResponse(payload) {
  const evaluation = payload?.evaluation ?? null;
  const summary = evaluation?.summary ?? {};
  const completeness =
    typeof summary.completeness_score === "number"
      ? summary.completeness_score
      : 1;
  const critical =
    typeof summary.critical_signals === "number" ? summary.critical_signals : 0;
  const warning =
    typeof summary.warning_signals === "number" ? summary.warning_signals : 0;
  const derivedScore = Math.max(
    1,
    Math.min(100, Math.round(completeness - critical * 10 - warning * 4))
  );

  return {
    evaluation,
    ai_review: payload?.ai_review
      ? {
          ...payload.ai_review,
          overall_score:
            typeof payload.ai_review.overall_score === "number"
              ? Math.max(1, Math.min(100, Math.round(payload.ai_review.overall_score)))
              : derivedScore,
        }
      : null,
    meta: {
      model: payload?.meta?.model ?? "",
    },
  };
}
