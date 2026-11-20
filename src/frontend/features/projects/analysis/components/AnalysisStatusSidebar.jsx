"use client";

import ProjectProgressSidebar from "@/features/projects/workspace/components/ProjectProgressSidebar";
import { useAnalysisContext } from "@/features/projects/analysis/components/AnalysisProvider";

export default function AnalysisStatusSidebar({ activeSection = "overview" }) {
  const { projectId } = useAnalysisContext();
  const isSegments = activeSection === "segments";

  return (
    <ProjectProgressSidebar
      projectId={projectId}
      activeStepKey={isSegments ? "segments" : "analysis"}
      activeAnalysisKey={isSegments ? null : activeSection}
    />
  );
}
