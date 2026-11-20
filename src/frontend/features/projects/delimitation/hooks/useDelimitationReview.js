"use client";

import { useCallback, useMemo, useState } from "react";
import { evaluateDelimitationReview } from "@/features/projects/delimitation/api/delimitation.review.api";
import {
  isDelimitationComplete,
  normalizeDelimitationReviewResponse,
} from "@/features/projects/delimitation/helpers/delimitation.helpers";

export function useDelimitationReview({ projectId, model, heuristics }) {
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const canEvaluate = useMemo(() => isDelimitationComplete(model), [model]);

  const evaluateReview = useCallback(async () => {
    if (!canEvaluate || reviewLoading) return null;

    setReviewLoading(true);
    setReviewError("");

    try {
      const raw = await evaluateDelimitationReview(projectId, {
        model,
        heuristics,
      });

      const normalized = normalizeDelimitationReviewResponse(raw);
      setReviewResult(normalized);
      return normalized;
    } catch (error) {
      setReviewError(
        error?.message || "No se pudo evaluar la delimitación."
      );
      return null;
    } finally {
      setReviewLoading(false);
    }
  }, [canEvaluate, heuristics, model, projectId, reviewLoading]);

  const resetReview = useCallback(() => {
    setReviewResult(null);
    setReviewError("");
  }, []);

  return {
    reviewResult,
    reviewLoading,
    reviewError,
    canEvaluate,
    hasReview: Boolean(reviewResult),
    evaluateReview,
    resetReview,
  };
}
