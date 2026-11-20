"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateSampleConfigReview } from "@/features/projects/sample-config/api/sampleConfig.review.api";
import {
  buildSampleConfigDraftSignature,
  hasMeaningfulSampleConfigContent,
  normalizeSampleConfigReviewResponse,
} from "@/features/projects/sample-config/helpers/sampleConfig.helpers";
import { computeLiveSampleConfigEvaluation } from "@/features/projects/sample-config/helpers/sampleConfig.review.helpers";

export function useSampleConfigReview({
  projectId,
  model,
  isDirty = false,
  savingState = "idle",
  saveCurrent,
}) {
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewMeta, setReviewMeta] = useState({ model: "" });

  const canEvaluate = useMemo(
    () => hasMeaningfulSampleConfigContent(model),
    [model]
  );

  const evaluationResult = useMemo(() => {
    if (!canEvaluate) return null;
    return computeLiveSampleConfigEvaluation(model);
  }, [canEvaluate, model]);

  const draftSignature = useMemo(
    () => buildSampleConfigDraftSignature(model),
    [model]
  );

  const evaluateReview = useCallback(async () => {
    if (!projectId || !canEvaluate || reviewLoading || savingState === "saving") {
      return null;
    }

    setReviewLoading(true);
    setReviewError("");

    try {
      if (isDirty && typeof saveCurrent === "function") {
        await saveCurrent();
      }

      const raw = await generateSampleConfigReview(projectId, { focus: "full" });
      const normalized = normalizeSampleConfigReviewResponse(raw);

      setReviewResult(normalized.ai_review);
      setReviewMeta(normalized.meta);

      return normalized;
    } catch (error) {
      setReviewError(
        error?.message || "No se pudo revisar la configuración de muestra."
      );
      return null;
    } finally {
      setReviewLoading(false);
    }
  }, [projectId, canEvaluate, reviewLoading, savingState, isDirty, saveCurrent]);

  useEffect(() => {
    setReviewResult(null);
    setReviewError("");
    setReviewMeta({ model: "" });
  }, [draftSignature]);

  return {
    evaluationResult,
    evaluationLoading: false,
    evaluationError: "",
    reviewResult,
    reviewLoading,
    reviewError,
    reviewMeta,
    canEvaluate: canEvaluate && savingState !== "saving",
    canReview: canEvaluate && savingState !== "saving",
    hasReview: Boolean(reviewResult),
    evaluateReview,
    refreshEvaluation: async () => evaluationResult,
  };
}