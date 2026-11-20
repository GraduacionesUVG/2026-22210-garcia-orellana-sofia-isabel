"use client";

export default function ReviewSidebarFrame({ children }) {
  return (
    <aside className="w-[320px] bg-white border-l border-slate-200 flex flex-col min-h-0">
      {children}
    </aside>
  );
}