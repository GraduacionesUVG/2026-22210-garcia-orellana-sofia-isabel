"use client";

import ProjectProgressSidebar from "@/features/projects/workspace/components/ProjectProgressSidebar";
import { useDelimitationContext } from "@/features/projects/delimitation/components/DelimitationProvider";

export default function DelimitationStatusSidebar() {
  const { projectId } = useDelimitationContext();

  return (
    <ProjectProgressSidebar
      projectId={projectId}
      activeStepKey="delimitation"
    />
  );
}
