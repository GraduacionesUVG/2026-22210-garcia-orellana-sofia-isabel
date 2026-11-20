"use client";

import { createContext, useContext, useMemo } from "react";
import { useAnalysisPage } from "@/features/projects/analysis/hooks/useAnalysisPage";

const AnalysisContext = createContext(null);

export function AnalysisProvider({ projectId, children }) {
  const page = useAnalysisPage(projectId);

  const value = useMemo(
    () => ({
      projectId,
      ...page,
    }),
    [projectId, page]
  );

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext);

  if (!context) {
    throw new Error("useAnalysisContext debe usarse dentro de AnalysisProvider.");
  }

  return context;
}
