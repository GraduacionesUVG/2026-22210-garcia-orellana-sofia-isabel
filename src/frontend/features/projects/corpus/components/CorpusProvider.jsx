"use client";

import { createContext, useContext, useMemo } from "react";
import { useCorpusPage } from "@/features/projects/corpus/hooks/useCorpusPage";

const CorpusContext = createContext(null);

export function CorpusProvider({ projectId, children }) {
  const page = useCorpusPage(projectId);

  const value = useMemo(
    () => ({
      projectId,
      ...page,
    }),
    [projectId, page]
  );

  return (
    <CorpusContext.Provider value={value}>{children}</CorpusContext.Provider>
  );
}

export function useCorpusContext() {
  const context = useContext(CorpusContext);

  if (!context) {
    throw new Error("useCorpusContext debe usarse dentro de CorpusProvider.");
  }

  return context;
}