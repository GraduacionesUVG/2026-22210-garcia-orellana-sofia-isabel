"use client";

import Icon from "@/components/common/Icon";
import VersionListItem from "@/features/projects/delimitation/components/VersionListItem";

export default function VersionsList({
  versions,
  loading,
  errorMsg,
  selectedVersionId,
  onSelect,
  onRefresh,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Cargando historial...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">{errorMsg}</p>

        <button
          type="button"
          onClick={onRefresh}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          <Icon name="refresh" className="text-[18px]" />
          Reintentar
        </button>
      </div>
    );
  }

  if (!versions?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Aún no hay versiones guardadas para esta delimitación.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <VersionListItem
          key={version.id}
          version={version}
          active={selectedVersionId === version.id}
          onClick={() => onSelect(version.id)}
        />
      ))}
    </div>
  );
}