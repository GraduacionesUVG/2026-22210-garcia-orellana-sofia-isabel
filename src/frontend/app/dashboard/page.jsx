"use client";

import { Suspense } from "react";
import PageShell from "@/components/common/PageShell";
import Topbar from "@/components/common/Topbar";
import Sidebar from "@/features/dashboard/components/Sidebar";
import DashboardStatsSection from "@/features/dashboard/components/DashboardStatsSection";
import DashboardProjectsSection from "@/features/dashboard/components/DashboardProjectsSection";
import CreateProjectModal from "@/features/projects/components/CreateProjectModal";
import { useDashboardPage } from "@/features/dashboard/hooks/useDashboardPage";

function DashboardContent() {
  const {
    open,
    search,
    setSearch,
    setOpen,
    me,
    firstName,
    stats,
    projects,
    dashboardView,
    pageCopy,
    loadingProjects,
    projectsError,
    formatDashboardDate,
    refetchDashboard,
  } = useDashboardPage();

  return (
    <PageShell>
      <div className="app-shell h-screen flex overflow-hidden">
        <Sidebar user={me} dashboardView={dashboardView} />

        <main className="app-main flex-1 flex flex-col h-full overflow-hidden relative">
          <Topbar
            title={pageCopy.title}
            subtitle={pageCopy.subtitle}
            ctaLabel="Nuevo Proyecto"
            onCtaClick={() => setOpen(true)}
            search={search}
            onSearchChange={(event) => setSearch(event.target.value)}
          />

          <div className="app-content flex-1 overflow-y-auto custom-scrollbar p-8 bg-background-light">
            <DashboardStatsSection
              stats={stats}
              firstName={firstName}
              totalTitle={pageCopy.statsTitle}
              formatDashboardDate={formatDashboardDate}
            />

            <DashboardProjectsSection
              projects={projects}
              loading={loadingProjects}
              errorMsg={projectsError}
              onRefresh={refetchDashboard}
              heading={pageCopy.projectsHeading}
              emptyMessage={search.trim() ? "No hay proyectos que coincidan con tu búsqueda." : pageCopy.emptyMessage}
              destination={pageCopy.destination}
            />
          </div>
        </main>
      </div>

      <CreateProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          refetchDashboard();
        }}
      />
    </PageShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-screen bg-background-light" />}>
      <DashboardContent />
    </Suspense>
  );
}
