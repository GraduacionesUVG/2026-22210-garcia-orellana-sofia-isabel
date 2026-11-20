"use client";

import { useMemo, useState } from "react";
import LoadingCardGrid from "@/components/common/LoadingCardGrid";
import ViewToggle from "@/components/common/ViewToggle";
import EditProjectModal from "@/features/projects/components/EditProjectModal";
import DeleteProjectModal from "@/features/projects/components/DeleteProjectModal";
import ProjectCard from "@/features/dashboard/components/ProjectCard";

export default function ProjectGrid({
  projects = [],
  loading = false,
  errorMsg = "",
  onRefresh,
  heading = "Proyectos Recientes",
  emptyMessage = "Aún no hay proyectos. Crea tu primer proyecto con “Nuevo Proyecto”.",
  destination = "delimitation",
}) {
  const [view, setView] = useState("grid");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const gridClass = useMemo(() => {
    if (view === "list") return "grid grid-cols-1 gap-4";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12";
  }, [view]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-serif font-bold text-gray-800">
          {heading}
        </h2>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {loading ? <LoadingCardGrid /> : null}

      {!loading && errorMsg ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      {!loading && !errorMsg ? (
        <div className={gridClass}>
          {projects.map((p) => (
            <ProjectCard
              key={p.id ?? p.project_id ?? p.uuid ?? p.title ?? p.name}
              project={p}
              view={view}
              destination={destination}
              onEdit={(proj) => {
                setSelected(proj);
                setEditOpen(true);
              }}
              onDelete={(proj) => {
                setSelected(proj);
                setDeleteOpen(true);
              }}
            />
          ))}

          {projects.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
              {emptyMessage}
            </div>
          ) : null}
        </div>
      ) : null}

      <EditProjectModal
        open={editOpen}
        project={selected}
        onClose={() => setEditOpen(false)}
        onUpdated={() => onRefresh?.()}
      />

      <DeleteProjectModal
        open={deleteOpen}
        project={selected}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => onRefresh?.()}
      />
    </>
  );
}
