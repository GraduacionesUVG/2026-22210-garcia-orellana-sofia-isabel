"use client";

import JackSidebarFrame from "@/features/projects/workspace/components/JackSidebarFrame";
import JackChatMessages from "@/features/projects/sample-config/components/JackChatMessages";
import JackChatInput from "@/features/projects/sample-config/components/JackChatInput";
import { useSampleConfigContext } from "@/features/projects/sample-config/components/SampleConfigProvider";
import { useSampleConfigChat } from "@/features/projects/sample-config/hooks/useSampleConfigChat";

export default function JackSidebar() {
  const { projectId, model, options, review, bootstrapping, loadError } =
    useSampleConfigContext();
  const chat = useSampleConfigChat({
    projectId,
    model,
    options,
    evaluationResult: review?.evaluationResult,
    reviewResult: review?.reviewResult,
  });

  return (
    <JackSidebarFrame description="Chat socrático para ayudarte a mejorar la coherencia metodológica de tu muestra.">
      <JackChatMessages
        chat={chat}
        bootstrapping={bootstrapping}
        loadError={loadError}
      />
      <JackChatInput chat={chat} />
    </JackSidebarFrame>
  );
}
