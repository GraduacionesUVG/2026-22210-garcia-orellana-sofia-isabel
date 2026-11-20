"use client";

import JackSidebarFrame from "@/features/projects/workspace/components/JackSidebarFrame";
import JackChatMessages from "@/features/projects/delimitation/components/JackChatMessages";
import JackChatInput from "@/features/projects/delimitation/components/JackChatInput";
import { useDelimitationContext } from "@/features/projects/delimitation/components/DelimitationProvider";
import { useDelimitationChat } from "@/features/projects/delimitation/hooks/useDelimitationChat";

export default function JackSidebar() {
  const { projectId, model, heuristics, loading } = useDelimitationContext();
  const chat = useDelimitationChat({
    projectId,
    model,
    heuristics,
  });

  return (
    <JackSidebarFrame description="Chat socrático para ayudarte a delimitar mejor tu investigación.">
      <JackChatMessages chat={chat} loading={loading} />
      <JackChatInput chat={chat} />
    </JackSidebarFrame>
  );
}
