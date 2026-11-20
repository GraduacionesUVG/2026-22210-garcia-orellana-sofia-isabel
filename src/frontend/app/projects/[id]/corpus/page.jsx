import ProjectWorkspaceLayout from "@/features/projects/workspace/components/ProjectWorkspaceLayout";
import { CorpusProvider } from "@/features/projects/corpus/components/CorpusProvider";
import CorpusHeader from "@/features/projects/corpus/components/CorpusHeader";
import CorpusStatusSidebar from "@/features/projects/corpus/components/CorpusStatusSidebar";
import CorpusEditorSection from "@/features/projects/corpus/components/CorpusEditorSection";
import CorpusAssistantSidebar from "@/features/projects/corpus/components/CorpusAssistantSidebar";

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <CorpusProvider projectId={id}>
      <ProjectWorkspaceLayout
        statusSidebar={<CorpusStatusSidebar />}
        header={<CorpusHeader />}
        editor={<CorpusEditorSection />}
        assistantSidebar={<CorpusAssistantSidebar />}
        contentMaxClass="max-w-5xl"
      />
    </CorpusProvider>
  );
}
