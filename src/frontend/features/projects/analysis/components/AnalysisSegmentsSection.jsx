"use client";

import { useAnalysisContext } from "@/features/projects/analysis/components/AnalysisProvider";
import AnalysisSegmentationWorkspace from "@/features/projects/analysis/components/AnalysisSegmentationWorkspace";

export default function AnalysisSegmentsSection({ initialDocumentId = "" }) {
  const { projectId } = useAnalysisContext();

  return (
    <section aria-label="Segmentos del análisis">
      <AnalysisSegmentationWorkspace
        projectId={projectId}
        initialDocumentId={initialDocumentId}
      />
    </section>
  );
}
