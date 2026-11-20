"use client";

import ProjectProgressSidebar from "@/features/projects/workspace/components/ProjectProgressSidebar";
import { useSampleConfigContext } from "@/features/projects/sample-config/components/SampleConfigProvider";

export default function SampleConfigStatusSidebar() {
  const { projectId } = useSampleConfigContext();

  return (
    <ProjectProgressSidebar
      projectId={projectId}
      activeStepKey="sample"
    />
  );
}
