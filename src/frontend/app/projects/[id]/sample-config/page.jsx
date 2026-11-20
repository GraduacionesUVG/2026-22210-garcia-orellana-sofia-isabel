import ProjectWorkspaceLayout from "@/features/projects/workspace/components/ProjectWorkspaceLayout";
import { SampleConfigProvider } from "@/features/projects/sample-config/components/SampleConfigProvider";
import SampleConfigHeader from "@/features/projects/sample-config/components/SampleConfigHeader";
import SampleConfigStatusSidebar from "@/features/projects/sample-config/components/SampleConfigStatusSidebar";
import SampleConfigEditorSection from "@/features/projects/sample-config/components/SampleConfigEditorSection";
import SampleConfigAssistantSidebar from "@/features/projects/sample-config/components/SampleConfigAssistantSidebar";

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <SampleConfigProvider projectId={id}>
      <ProjectWorkspaceLayout
        statusSidebar={<SampleConfigStatusSidebar />}
        header={<SampleConfigHeader />}
        editor={<SampleConfigEditorSection />}
        assistantSidebar={<SampleConfigAssistantSidebar />}
      />
    </SampleConfigProvider>
  );
}
