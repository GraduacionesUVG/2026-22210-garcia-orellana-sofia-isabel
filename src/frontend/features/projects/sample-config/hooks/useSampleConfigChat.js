"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

function sanitizeDraft(model = {}, options = {}) {
  const mainApproachLabel =
    options?.main_approaches?.find(
      (item) => item?.code === model?.main_approach_code
    )?.label ?? "";

  const scopeLabel =
    options?.scopes?.find((item) => item?.code === model?.scope_code)?.label ??
    "";

  const collectionTechniques = Array.isArray(model?.collection_techniques)
    ? model.collection_techniques.map((item, index) => {
        const optionLabel =
          options?.collection_technique_options?.find(
            (opt) => opt?.code === item?.technique_code
          )?.label ?? "";

        return {
          id: item?.clientId ?? item?.id ?? `tech_${index}`,
          technique_code: item?.is_custom ? null : item?.technique_code ?? null,
          label: item?.is_custom
            ? item?.custom_label ?? ""
            : optionLabel || item?.technique_code || "",
          custom_label: item?.is_custom ? item?.custom_label ?? "" : "",
          is_custom: !!item?.is_custom,
          position:
            typeof item?.position === "number" ? item.position : index,
        };
      })
    : [];

  return {
    main_approach_code: model?.main_approach_code ?? "",
    main_approach_label: mainApproachLabel,
    scope_code: model?.scope_code ?? "",
    scope_label: scopeLabel,
    field_phase: model?.field_phase ?? "",
    target_sample_size:
      model?.target_sample_size === "" || model?.target_sample_size === null
        ? ""
        : String(model?.target_sample_size ?? ""),
    sample_size_rationale: model?.sample_size_rationale ?? "",
    collection_techniques: collectionTechniques,
  };
}

function sanitizeHeuristics({ evaluationResult, reviewResult } = {}) {
  const reviewSignals = Array.isArray(reviewResult?.issues)
    ? reviewResult.issues.slice(0, 4).map((issue) => ({
        field: issue?.field ?? "",
        level: issue?.severity ?? "warning",
        text:
          issue?.explanation ??
          issue?.title ??
          "Hay una observación metodológica por revisar.",
      }))
    : [];

  const evaluationSignals =
    reviewSignals.length === 0 && Array.isArray(evaluationResult?.signals)
      ? evaluationResult.signals.slice(0, 4).map((signal) => ({
          field: signal?.field ?? "",
          level: signal?.status ?? "warning",
          text: signal?.message ?? "",
        }))
      : [];

  const finalSignals =
    reviewSignals.length > 0 ? reviewSignals : evaluationSignals;

  return {
    totalHighlights: finalSignals.length,
    conciseSummary:
      reviewResult?.concise_summary ??
      "Jack puede ayudarte a revisar si tu muestra está bien justificada.",
    jackQuestion:
      reviewResult?.next_step ??
      reviewResult?.guiding_questions?.[0]?.question ??
      "¿Tu enfoque, tus técnicas y tu tamaño de muestra realmente se sostienen entre sí?",
    signals: finalSignals,
  };
}

export function useSampleConfigChat({
  projectId,
  model,
  options,
  evaluationResult,
  reviewResult,
}) {
  const latestDraftRef = useRef(sanitizeDraft(model, options));
  const latestHeuristicsRef = useRef(
    sanitizeHeuristics({ evaluationResult, reviewResult })
  );

  useEffect(() => {
    latestDraftRef.current = sanitizeDraft(model, options);
  }, [model, options]);

  useEffect(() => {
    latestHeuristicsRef.current = sanitizeHeuristics({
      evaluationResult,
      reviewResult,
    });
  }, [evaluationResult, reviewResult]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/projects/${projectId}/sample-config/chat`,
        prepareSendMessagesRequest: ({ id, messages }) => {
          return {
            body: {
              id,
              messages,
              draft: latestDraftRef.current,
              heuristics: latestHeuristicsRef.current,
            },
          };
        },
      }),
    [projectId]
  );

  return useChat({
    transport,
  });
}