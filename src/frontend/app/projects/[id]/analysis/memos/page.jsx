import ProjectWorkspaceLayout from "@/features/projects/workspace/components/ProjectWorkspaceLayout";
import { AnalysisProvider } from "@/features/projects/analysis/components/AnalysisProvider";
import AnalysisHeader from "@/features/projects/analysis/components/AnalysisHeader";
import AnalysisStatusSidebar from "@/features/projects/analysis/components/AnalysisStatusSidebar";
import AnalysisAssistantSidebar from "@/features/projects/analysis/components/AnalysisAssistantSidebar";
import AnalysisMemosSection from "@/features/projects/analysis/components/AnalysisMemosSection";

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <AnalysisProvider projectId={id}>
      <ProjectWorkspaceLayout
        statusSidebar={<AnalysisStatusSidebar activeSection="memos" />}
        header={<AnalysisHeader projectId={id} activeSection="memos" />}
        editor={<AnalysisMemosSection />}
        assistantSidebar={<AnalysisAssistantSidebar showVisualContext={false} />}
        contentMaxClass="max-w-5xl"
      />
    </AnalysisProvider>
  );
}
