"use client";

import dynamic from "next/dynamic";
import AssistantSidebarContainer from "@/features/projects/workspace/components/AssistantSidebarContainer";
import JackSidebarFallback from "@/features/projects/workspace/components/JackSidebarFallback";
import ReviewSidebar from "@/features/projects/sample-config/components/ReviewSidebar";

const JackSidebar = dynamic(
  () => import("@/features/projects/sample-config/components/JackSidebar"),
  {
    ssr: false,
    loading: () => <JackSidebarFallback />,
  }
);

export default function SampleConfigAssistantSidebar() {
  return (
    <AssistantSidebarContainer>
      <ReviewSidebar />
      <JackSidebar />
    </AssistantSidebarContainer>
  );
}
