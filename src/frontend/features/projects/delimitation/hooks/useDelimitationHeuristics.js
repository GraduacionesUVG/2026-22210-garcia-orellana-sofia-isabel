"use client";

import { useMemo } from "react";
import { evaluateDelimitationHeuristics } from "@/features/projects/delimitation/helpers/delimitation-heuristics";

export function useDelimitationHeuristics(model) {
  return useMemo(
    () => evaluateDelimitationHeuristics(model),
    [model]
  );
}