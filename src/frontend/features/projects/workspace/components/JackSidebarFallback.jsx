"use client";

import Icon from "@/components/common/Icon";

export default function JackSidebarFallback() {
  return (
    <aside className="flex min-h-0 w-[340px] flex-col border-l border-slate-200 bg-white">
      <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#005944]/8 text-[#005944]">
            <Icon name="smart_toy" className="text-xl" />
          </span>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#005944]">
              Jack
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Preparando guía socrática...
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 bg-[#FCFCFA] p-5">
        <div className="h-20 rounded-2xl border border-slate-200 bg-white" />
        <div className="h-24 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </aside>
  );
}
