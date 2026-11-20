"use client";

import Icon from "@/components/common/Icon";
import AssistantSidebarContainer from "@/features/projects/workspace/components/AssistantSidebarContainer";

const NOTES = [
  {
    icon: "admin_panel_settings",
    title: "Propietario",
    body: "Puede invitar, revocar accesos y cambiar permisos.",
  },
  {
    icon: "edit_square",
    title: "Editor",
    body: "Puede modificar corpus, codigos, memos y hallazgos.",
  },
  {
    icon: "visibility",
    title: "Lectura",
    body: "Puede revisar el proyecto sin cambiar datos.",
  },
];

export default function TeamAssistantSidebar() {
  return (
    <AssistantSidebarContainer mobileLabels={["Permisos"]}>
    <aside className="hidden min-h-0 w-[340px] shrink-0 flex-col border-l border-slate-200 bg-white xl:flex">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#005944]/10 text-[#005944]">
            <Icon name="groups" className="text-xl" />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#005944]">
              Permisos
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              La colaboracion se controla por proyecto. El texto fuente usa
              presencia y revisiones para evitar sobrescrituras.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[#FCFCFA] p-5">
        {NOTES.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#005944]">
                <Icon name={item.icon} className="text-lg" />
              </span>
              <div>
                <p className="text-sm font-black text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {item.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
    </AssistantSidebarContainer>
  );
}
