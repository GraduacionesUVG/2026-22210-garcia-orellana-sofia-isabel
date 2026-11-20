"use client";

import ProjectProgressSidebar from "@/features/projects/workspace/components/ProjectProgressSidebar";
import { useCorpusContext } from "@/features/projects/corpus/components/CorpusProvider";

export default function CorpusStatusSidebar() {
  const { projectId } = useCorpusContext();

  return (
    <ProjectProgressSidebar
      projectId={projectId}
      activeStepKey="collection"
    />
  );
}
