import ProjectWorkspaceLayout from "@/features/projects/workspace/components/ProjectWorkspaceLayout";
import { ResearchDesignProvider } from "@/features/projects/research-design/components/ResearchDesignProvider";
import ResearchDesignHeader from "@/features/projects/research-design/components/ResearchDesignHeader";
import ResearchDesignStatusSidebar from "@/features/projects/research-design/components/ResearchDesignStatusSidebar";
import ResearchDesignEditorSection from "@/features/projects/research-design/components/ResearchDesignEditorSection";
import ResearchDesignAssistantSidebar from "@/features/projects/research-design/components/ResearchDesignAssistantSidebar";

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <ResearchDesignProvider projectId={id}>
      <ProjectWorkspaceLayout
        statusSidebar={<ResearchDesignStatusSidebar />}
        header={<ResearchDesignHeader />}
        editor={<ResearchDesignEditorSection />}
        assistantSidebar={<ResearchDesignAssistantSidebar />}
      />
    </ResearchDesignProvider>
  );
}
