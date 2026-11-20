"use client";

import Icon from "@/components/common/Icon";

export default function JackSidebarFrame({
  title = "Jack",
  description,
  children,
}) {
  return (
    <aside className="w-[340px] bg-white border-l border-slate-200 flex flex-col min-h-0">
      <div className="shrink-0 px-5 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#005944]/8 text-[#005944]">
            <Icon name="smart_toy" className="text-xl" />
          </span>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#005944]">
              {title}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>

      {children}
    </aside>
  );
}