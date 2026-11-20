"use client";

import JackSidebarFrame from "@/features/projects/workspace/components/JackSidebarFrame";
import JackChatMessages from "@/features/projects/research-design/components/JackChatMessages";
import JackChatInput from "@/features/projects/research-design/components/JackChatInput";
import { useResearchDesignContext } from "@/features/projects/research-design/components/ResearchDesignProvider";
import { useResearchDesignChat } from "@/features/projects/research-design/hooks/useResearchDesignChat";

export default function JackSidebar() {
  const { projectId, model, review, loading } = useResearchDesignContext();
  const chat = useResearchDesignChat({
    projectId,
    model,
    evaluationResult: review?.evaluationResult,
    reviewResult: review?.reviewResult,
  });

  return (
    <JackSidebarFrame description="Chat socrático para ayudarte a formular mejor tu diseño de investigación.">
      <JackChatMessages chat={chat} loading={loading} />
      <JackChatInput chat={chat} />
    </JackSidebarFrame>
  );
}
