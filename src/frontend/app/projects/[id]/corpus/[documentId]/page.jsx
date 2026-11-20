import ProjectWorkspaceLayout from "@/features/projects/workspace/components/ProjectWorkspaceLayout";
import { CorpusProvider } from "@/features/projects/corpus/components/CorpusProvider";
import CorpusHeader from "@/features/projects/corpus/components/CorpusHeader";
import CorpusStatusSidebar from "@/features/projects/corpus/components/CorpusStatusSidebar";
import CorpusAssistantSidebar from "@/features/projects/corpus/components/CorpusAssistantSidebar";
import CorpusDocumentEditorSection from "@/features/projects/corpus/components/CorpusDocumentEditorSection";

export default async function Page({ params }) {
  const { id, documentId } = await params;

  return (
    <CorpusProvider projectId={id}>
      <ProjectWorkspaceLayout
        statusSidebar={<CorpusStatusSidebar />}
        header={<CorpusHeader />}
        editor={<CorpusDocumentEditorSection documentId={documentId} />}
        assistantSidebar={<CorpusAssistantSidebar />}
        contentMaxClass="max-w-5xl"
      />
    </CorpusProvider>
  );
}
