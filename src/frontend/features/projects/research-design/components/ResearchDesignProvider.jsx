"use client";

import { createContext, useContext, useMemo } from "react";
import { useResearchDesignPage } from "@/features/projects/research-design/hooks/useResearchDesignPage";
import { useResearchDesignReview } from "@/features/projects/research-design/hooks/useResearchDesignReview";
import { useResearchDesignVersions } from "@/features/projects/research-design/hooks/useResearchDesignVersions";
import { buildResearchDesignFieldHighlights } from "@/features/projects/research-design/helpers/researchDesign.helpers";

const ResearchDesignContext = createContext(null);

export function ResearchDesignProvider({ projectId, children }) {
  const page = useResearchDesignPage(projectId);

  const review = useResearchDesignReview({
    projectId,
    model: page.model,
    savingState: page.savingState,
    initialEvaluation: page.initialEvaluation,
    initialEvaluationSignature: page.initialEvaluationSignature,
  });

  const versioning = useResearchDesignVersions({
    projectId,
    reload: page.reload,
  });

  const value = useMemo(
    () => ({
      projectId,
      ...page,
      heuristics: {
        fieldHighlights: buildResearchDesignFieldHighlights(
          review.evaluationResult,
          page.model
        ),
        signals: [],
        jackQuestion:
          "¿Tu pregunta de investigación y tus objetivos responden claramente qué quieres comprender o explicar?",
      },
      review,
      versioning,
    }),
    [projectId, page, review, versioning]
  );

  return (
    <ResearchDesignContext.Provider value={value}>
      {children}
    </ResearchDesignContext.Provider>
  );
}

export function useResearchDesignContext() {
  const context = useContext(ResearchDesignContext);

  if (!context) {
    throw new Error(
      "useResearchDesignContext debe usarse dentro de ResearchDesignProvider."
    );
  }

  return context;
}
