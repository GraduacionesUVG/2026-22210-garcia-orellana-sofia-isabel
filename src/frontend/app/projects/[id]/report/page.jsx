import ProjectWorkspaceLayout from "@/features/projects/workspace/components/ProjectWorkspaceLayout";
import ProjectProgressSidebar from "@/features/projects/workspace/components/ProjectProgressSidebar";
import ReportHeader from "@/features/projects/report/components/ReportHeader";
import ReportEditorSection from "@/features/projects/report/components/ReportEditorSection";

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <ProjectWorkspaceLayout
      statusSidebar={
        <ProjectProgressSidebar projectId={id} activeStepKey="report" />
      }
      header={<ReportHeader />}
      editor={<ReportEditorSection projectId={id} />}
      assistantSidebar={null}
      contentMaxClass="max-w-5xl"
    />
  );
}
