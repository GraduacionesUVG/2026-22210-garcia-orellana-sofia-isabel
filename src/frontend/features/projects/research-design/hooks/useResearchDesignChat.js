"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

function sanitizeDraft(model = {}) {
  return {
    research_question: model?.research_question ?? "",
    general_objective: model?.general_objective ?? "",
    specific_objectives: Array.isArray(model?.specific_objectives)
      ? model.specific_objectives.map((item, index) => ({
          id: item?.id,
          text: item?.text ?? "",
          position:
            typeof item?.position === "number" ? item.position : index,
        }))
      : [],
  };
}

function sanitizeHeuristics({ evaluationResult, reviewResult } = {}) {
  const reviewSignals = Array.isArray(reviewResult?.issues)
    ? reviewResult.issues.slice(0, 4).map((issue) => ({
        field: issue?.field ?? "",
        level: issue?.level ?? "",
        text: issue?.text ?? issue?.explanation ?? issue?.title ?? "",
      }))
    : [];

  const evaluationSignals =
    reviewSignals.length === 0 && Array.isArray(evaluationResult?.signals)
      ? evaluationResult.signals.slice(0, 4).map((signal) => ({
          field: signal?.field ?? "",
          level: signal?.level ?? "",
          text: signal?.message ?? signal?.text ?? "",
        }))
      : [];

  const finalSignals =
    reviewSignals.length > 0 ? reviewSignals : evaluationSignals;

  return {
    totalHighlights: finalSignals.length,
    jackQuestion:
      reviewResult?.next_step ??
      "¿Tu pregunta, tu objetivo general y tus objetivos específicos están alineados entre sí?",
    signals: finalSignals,
  };
}

export function useResearchDesignChat({
  projectId,
  model,
  evaluationResult,
  reviewResult,
}) {
  const latestDraftRef = useRef(sanitizeDraft(model));
  const latestHeuristicsRef = useRef(
    sanitizeHeuristics({ evaluationResult, reviewResult })
  );

  useEffect(() => {
    latestDraftRef.current = sanitizeDraft(model);
  }, [model]);

  useEffect(() => {
    latestHeuristicsRef.current = sanitizeHeuristics({
      evaluationResult,
      reviewResult,
    });
  }, [evaluationResult, reviewResult]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/projects/${projectId}/research-design/chat`,
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