"use client";

import SearchInput from "@/components/common/SearchInput";
import Icon from "@/components/common/Icon";

export default function Topbar({
  title,
  subtitle,
  ctaLabel,
  onCtaClick,           
  search,
  onSearchChange,
}) {
  return (
    <header className="dashboard-topbar h-20 bg-background-light backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="dashboard-topbar-actions flex items-center gap-4">
        <div className="dashboard-search hidden sm:block">
          <SearchInput placeholder="Buscar proyectos..." value={search} onChange={onSearchChange} />
        </div>

        <button
          type="button"
          onClick={onCtaClick}
          className="bg-primary hover:bg-[#004030] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-green-900/20 transition-all transform hover:-translate-y-0.5"
        >
          <Icon name="add" className="text-lg" />
          {ctaLabel}
        </button>
      </div>
    </header>
  );
}
