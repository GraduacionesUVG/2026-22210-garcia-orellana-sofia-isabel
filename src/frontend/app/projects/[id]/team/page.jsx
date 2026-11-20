import ProjectWorkspaceLayout from "@/features/projects/workspace/components/ProjectWorkspaceLayout";
import TeamAssistantSidebar from "@/features/projects/team/components/TeamAssistantSidebar";
import TeamHeader from "@/features/projects/team/components/TeamHeader";
import TeamSection from "@/features/projects/team/components/TeamSection";
import TeamStatusSidebar from "@/features/projects/team/components/TeamStatusSidebar";

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <ProjectWorkspaceLayout
      statusSidebar={<TeamStatusSidebar projectId={id} />}
      header={<TeamHeader />}
      editor={<TeamSection projectId={id} />}
      assistantSidebar={<TeamAssistantSidebar />}
      contentMaxClass="max-w-6xl"
    />
  );
}
