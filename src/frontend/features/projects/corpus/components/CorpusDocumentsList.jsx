"use client";

import Icon from "@/components/common/Icon";
import CorpusDocumentCard from "@/features/projects/corpus/components/CorpusDocumentCard";

function LoadingState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005944]/10 text-[#005944]">
          <Icon name="hourglass_top" className="text-xl" />
        </span>

        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#005944]">
            Cargando corpus
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Estamos preparando los documentos y métricas del proyecto.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasActiveFilters, onResetFilters, onCreate }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#005944]/10 text-[#005944]">
        <Icon name="inventory_2" className="text-2xl" />
      </div>

      <h3 className="mt-4 text-base font-black text-slate-900">
        {hasActiveFilters
          ? "No hay documentos con estos filtros"
          : "Todavía no hay documentos en el corpus"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {hasActiveFilters
          ? "Puedes limpiar los filtros o ajustar la búsqueda para ver más resultados."
          : "Crea la primera transcripción pegando texto cualitativo y agregando sus metadatos básicos."}
      </p>

      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        {hasActiveFilters ? (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:text-[#005944]"
            onClick={onResetFilters}
          >
            <Icon name="filter_alt_off" className="text-base" />
            Limpiar filtros
          </button>
        ) : null}

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#004232]"
          onClick={onCreate}
        >
          <Icon name="add" className="text-base" />
          Nueva transcripción
        </button>
      </div>
    </div>
  );
}

export default function CorpusDocumentsList({
  projectId,
  documents,
  sources,
  participants,
  loading,
  hasActiveFilters,
  onResetFilters,
  onCreate,
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (!documents.length) {
    return (
      <EmptyState
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
        onCreate={onCreate}
      />
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <CorpusDocumentCard
          key={document.id}
          projectId={projectId}
          document={document}
          sources={sources}
          participants={participants}
        />
      ))}
    </div>
  );
}
