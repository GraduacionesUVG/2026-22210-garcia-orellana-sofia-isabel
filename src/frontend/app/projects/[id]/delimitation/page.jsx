import ProjectWorkspaceLayout from "@/features/projects/workspace/components/ProjectWorkspaceLayout";
import { DelimitationProvider } from "@/features/projects/delimitation/components/DelimitationProvider";
import DelimitationHeader from "@/features/projects/delimitation/components/DelimitationHeader";
import DelimitationStatusSidebar from "@/features/projects/delimitation/components/DelimitationStatusSidebar";
import DelimitationEditorSection from "@/features/projects/delimitation/components/DelimitationEditorSection";
import DelimitationAssistantSidebar from "@/features/projects/delimitation/components/DelimitationAssistantSidebar";

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <DelimitationProvider projectId={id}>
      <ProjectWorkspaceLayout
        statusSidebar={<DelimitationStatusSidebar />}
        header={<DelimitationHeader />}
        editor={<DelimitationEditorSection />}
        assistantSidebar={<DelimitationAssistantSidebar />}
      />
    </DelimitationProvider>
  );
}
