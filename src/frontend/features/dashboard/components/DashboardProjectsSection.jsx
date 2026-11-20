import ProjectGrid from "@/features/dashboard/components/ProjectGrid";

export default function DashboardProjectsSection({
  projects,
  loading,
  errorMsg,
  onRefresh,
  heading,
  emptyMessage,
  destination,
}) {
  return (
    <ProjectGrid
      projects={projects}
      loading={loading}
      errorMsg={errorMsg}
      onRefresh={onRefresh}
      heading={heading}
      emptyMessage={emptyMessage}
      destination={destination}
    />
  );
}
