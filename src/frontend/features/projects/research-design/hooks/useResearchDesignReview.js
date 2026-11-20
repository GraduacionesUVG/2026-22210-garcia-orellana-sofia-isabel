"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getResearchDesignEvaluation,
  generateResearchDesignReview,
} from "@/features/projects/research-design/api/researchDesign.review.api";
import {
  buildResearchDesignPersistedSignature,
  hasMeaningfulResearchDesignContent,
  normalizeResearchDesignEvaluationResponse,
  normalizeResearchDesignReviewResponse,
} from "@/features/projects/research-design/helpers/researchDesign.helpers";

function buildDraftSignature(model = {}) {
  return JSON.stringify({
    research_question: String(model?.research_question ?? ""),
    general_objective: String(model?.general_objective ?? ""),
    objectives: Array.isArray(model?.specific_objectives)
      ? model.specific_objectives.map((item) => ({
          id: item?.id ?? "",
          text: String(item?.text ?? ""),
        }))
      : [],
  });
}

export function useResearchDesignReview({
  projectId,
  model,
  savingState = "idle",
  initialEvaluation = null,
  initialEvaluationSignature = "",
}) {
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const evaluatedSignatureRef = useRef("");

  const [reviewResult, setReviewResult] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewMeta, setReviewMeta] = useState({ model: "" });

  const canEvaluate = useMemo(
    () => hasMeaningfulResearchDesignContent(model),
    [model]
  );

  const persistedSignature = useMemo(
    () => buildResearchDesignPersistedSignature(model),
    [model]
  );

  const draftSignature = useMemo(() => buildDraftSignature(model), [model]);

  const refreshEvaluation = useCallback(async () => {
    if (!projectId || !canEvaluate) {
      setEvaluationResult(null);
      return null;
    }

    setEvaluationLoading(true);
    setEvaluationError("");

    try {
      const raw = await getResearchDesignEvaluation(projectId);
      const normalized = normalizeResearchDesignEvaluationResponse(raw);
      setEvaluationResult(normalized);
      evaluatedSignatureRef.current = persistedSignature;
      return normalized;
    } catch (error) {
      setEvaluationError(
        error?.message || "No se pudo evaluar el diseño de investigación."
      );
      return null;
    } finally {
      setEvaluationLoading(false);
    }
  }, [projectId, canEvaluate, persistedSignature]);

  const evaluateReview = useCallback(async () => {
    if (!projectId || !canEvaluate || reviewLoading || savingState === "saving") {
      return null;
    }

    setReviewLoading(true);
    setReviewError("");

    try {
      const raw = await generateResearchDesignReview(projectId, {
        focus: "full",
      });

      const normalized = normalizeResearchDesignReviewResponse(raw);
      setEvaluationResult(normalized.evaluation);
      evaluatedSignatureRef.current = persistedSignature;
      setReviewResult(normalized.ai_review);
      setReviewMeta(normalized.meta);
      return normalized;
    } catch (error) {
      setReviewError(
        error?.message || "No se pudo revisar el diseño de investigación."
      );
      return null;
    } finally {
      setReviewLoading(false);
    }
  }, [projectId, canEvaluate, reviewLoading, savingState, persistedSignature]);

  useEffect(() => {
    if (
      !initialEvaluation ||
      !canEvaluate ||
      initialEvaluationSignature !== persistedSignature
    ) {
      return;
    }

    setEvaluationResult(initialEvaluation);
    setEvaluationError("");
    evaluatedSignatureRef.current = persistedSignature;
  }, [
    initialEvaluation,
    initialEvaluationSignature,
    canEvaluate,
    persistedSignature,
  ]);

  useEffect(() => {
    if (!canEvaluate) {
      setEvaluationResult(null);
      setEvaluationError("");
      evaluatedSignatureRef.current = "";
      return;
    }

    if (savingState === "saving") return;
    if (evaluatedSignatureRef.current === persistedSignature) return;

    refreshEvaluation();
  }, [canEvaluate, persistedSignature, savingState, refreshEvaluation]);

  useEffect(() => {
    setReviewResult(null);
    setReviewError("");
    setReviewMeta({ model: "" });
  }, [draftSignature]);

  return {
    evaluationResult,
    evaluationLoading,
    evaluationError,
    reviewResult,
    reviewLoading,
    reviewError,
    reviewMeta,
    canEvaluate: canEvaluate && savingState !== "saving",
    hasReview: Boolean(reviewResult),
    evaluateReview,
    refreshEvaluation,
  };
}
