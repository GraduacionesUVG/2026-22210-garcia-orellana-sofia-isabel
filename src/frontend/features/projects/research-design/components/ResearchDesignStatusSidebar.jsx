"use client";

import ProjectProgressSidebar from "@/features/projects/workspace/components/ProjectProgressSidebar";
import { useResearchDesignContext } from "@/features/projects/research-design/components/ResearchDesignProvider";

export default function ResearchDesignStatusSidebar() {
  const { projectId } = useResearchDesignContext();

  return (
    <ProjectProgressSidebar
      projectId={projectId}
      activeStepKey="design"
    />
  );
}
