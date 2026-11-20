import ProjectWorkspaceLayout from "@/features/projects/workspace/components/ProjectWorkspaceLayout";
import { AnalysisProvider } from "@/features/projects/analysis/components/AnalysisProvider";
import AnalysisHeader from "@/features/projects/analysis/components/AnalysisHeader";
import AnalysisStatusSidebar from "@/features/projects/analysis/components/AnalysisStatusSidebar";
import AnalysisSegmentsSection from "@/features/projects/analysis/components/AnalysisSegmentsSection";

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const initialDocumentId = firstQueryValue(query?.documentId) ?? "";

  return (
    <AnalysisProvider projectId={id}>
      <ProjectWorkspaceLayout
        statusSidebar={<AnalysisStatusSidebar activeSection="segments" />}
        header={<AnalysisHeader projectId={id} activeSection="segments" />}
        editor={<AnalysisSegmentsSection initialDocumentId={initialDocumentId} />}
        contentMaxClass="max-w-[1680px]"
      />
    </AnalysisProvider>
  );
}
