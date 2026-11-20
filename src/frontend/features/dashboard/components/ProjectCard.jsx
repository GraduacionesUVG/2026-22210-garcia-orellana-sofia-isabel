"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/common/Icon";
import { formatProjectTimestamp } from "@/lib/format/date";
import { getInitials } from "@/lib/format/user";
import {
  getProjectId,
  resolveProjectActive,
} from "@/features/projects/helpers/project.helpers";

function tagStyles(tag) {
  const t = (tag ?? "").toLowerCase();
  if (t.includes("etno")) return "bg-green-100 text-green-700";
  if (t.includes("ux")) return "bg-teal-100 text-teal-700";
  return "bg-emerald-100 text-emerald-800";
}

function statusStyles(isActive) {
  if (isActive) {
    return {
      text: "text-secondary",
      dot: "bg-secondary",
      label: "Activo",
    };
  }

  return {
    text: "text-gray-500",
    dot: "bg-gray-400",
    label: "Inactivo",
  };
}

function memberDisplayName(member) {
  return (
    member?.full_name?.trim() ||
    member?.username?.trim() ||
    member?.email?.trim() ||
    "Colaborador"
  );
}

function memberInitial(member) {
  const displayName = memberDisplayName(member);
  return getInitials(displayName).slice(0, 1) || "C";
}

export default function ProjectCard({
  project,
  view = "grid",
  destination = "delimitation",
  onEdit,
  onDelete,
}) {
  const router = useRouter();

  const title = project.title ?? project.name ?? "Proyecto";
  const desc = project.description ?? project.summary ?? "";
  const tag = project.tag ?? project.type ?? project.category ?? "Cualitativo";
  const updatedRaw =
    project.updated_at ??
    project.updatedAt ??
    project.last_updated ??
    project.created_at ??
    null;

  const updated = formatProjectTimestamp(updatedRaw);
  const isActive = resolveProjectActive(project);
  const st = statusStyles(isActive);
  const projectId = getProjectId(project);
  const members = Array.isArray(project.members) ? project.members : [];

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function goToDelimitation() {
    if (!projectId) return;
    router.push(
      destination === "report"
        ? `/projects/${projectId}/report`
        : `/projects/${projectId}/delimitation`
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToDelimitation}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDelimitation();
        }
      }}
      className="bg-surface-light rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full cursor-pointer"
    >
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase ${tagStyles(tag)}`}
          >
            {tag}
          </span>

          <div className="relative" ref={menuRef}>
            <button
              className="text-gray-400 hover:text-gray-600"
              type="button"
              title="Acciones"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
            >
              <Icon name="more_horiz" className="text-lg" />
            </button>

            {menuOpen ? (
              <div
                className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(project);
                  }}
                  className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Icon name="edit" className="text-[18px] text-gray-500" />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(project);
                  }}
                  className="w-full px-3 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <Icon name="delete" className="text-[18px] text-red-600" />
                  Eliminar
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <h3 className="font-serif text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        <p className="text-gray-500 text-sm line-clamp-3 mb-4">{desc}</p>

        {view === "grid" ? (
          <div className="flex -space-x-2 mb-4" aria-label="Usuarios del proyecto">
            {members.length ? (
              <>
                {members.slice(0, 4).map((member, index) => (
                  <div
                    key={member.user_id ?? `${projectId}-member-${index}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${
                      index === 0
                        ? "bg-primary"
                        : index === 1
                        ? "bg-teal-700"
                        : index === 2
                        ? "bg-slate-600"
                        : "bg-amber-700"
                    }`}
                    title={memberDisplayName(member)}
                  >
                    {memberInitial(member)}
                  </div>
                ))}
                {members.length > 4 ? (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-medium text-gray-600"
                    title={`${members.length - 4} usuarios más`}
                  >
                    +{members.length - 4}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex items-center justify-between gap-4">
        <span className="text-xs text-gray-500 font-medium truncate">
          {updated}
        </span>

        <div className={`flex items-center gap-1 text-xs font-bold ${st.text}`}>
          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
          {st.label}
        </div>
      </div>
    </div>
  );
}
