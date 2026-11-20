"use client";

import ProjectProgressSidebar from "@/features/projects/workspace/components/ProjectProgressSidebar";

export default function TeamStatusSidebar({ projectId }) {
  return (
    <ProjectProgressSidebar
      projectId={projectId}
      activeStepKey={null}
      activeUtilityKey="team"
    />
  );
}
