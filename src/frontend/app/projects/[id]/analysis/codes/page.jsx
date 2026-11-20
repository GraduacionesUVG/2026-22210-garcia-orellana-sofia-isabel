import ProjectWorkspaceLayout from "@/features/projects/workspace/components/ProjectWorkspaceLayout";
import { AnalysisProvider } from "@/features/projects/analysis/components/AnalysisProvider";
import AnalysisHeader from "@/features/projects/analysis/components/AnalysisHeader";
import AnalysisStatusSidebar from "@/features/projects/analysis/components/AnalysisStatusSidebar";
import AnalysisCodesSection from "@/features/projects/analysis/components/AnalysisCodesSection";
import { normalizeCodingView } from "@/features/projects/analysis/helpers/analysis.helpers";

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const initialView = normalizeCodingView(firstQueryValue(query?.view));
  const initialSegmentId = firstQueryValue(query?.segmentId) ?? "";

  return (
    <AnalysisProvider projectId={id}>
      <ProjectWorkspaceLayout
        statusSidebar={<AnalysisStatusSidebar activeSection="codes" />}
        header={<AnalysisHeader projectId={id} activeSection="codes" />}
        editor={
          <AnalysisCodesSection
            initialView={initialView}
            initialSegmentId={initialSegmentId}
          />
        }
        contentMaxClass="max-w-[1440px]"
      />
    </AnalysisProvider>
  );
}
