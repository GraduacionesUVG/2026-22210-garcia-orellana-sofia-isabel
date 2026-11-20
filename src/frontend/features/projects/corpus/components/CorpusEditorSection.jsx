"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/common/Icon";
import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import CorpusStatsGrid from "@/features/projects/corpus/components/CorpusStatsGrid";
import CorpusFiltersBar from "@/features/projects/corpus/components/CorpusFiltersBar";
import CorpusDocumentsList from "@/features/projects/corpus/components/CorpusDocumentsList";
import CorpusTrashModal from "@/features/projects/corpus/components/CorpusTrashModal";
import CorpusCatalogModal from "@/features/projects/corpus/components/CorpusCatalogModal";
import { useCorpusContext } from "@/features/projects/corpus/components/CorpusProvider";
import { useCorpusDashboard } from "@/features/projects/corpus/hooks/useCorpusDashboard";

function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
            <Icon name="warning" className="text-lg" />
          </span>

          <div>
            <p className="text-sm font-black uppercase tracking-widest text-amber-800">
              No se pudo cargar el corpus
            </p>
            <p className="mt-1 text-sm text-amber-900">{message}</p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-800"
          onClick={onRetry}
        >
          <Icon name="refresh" className="text-base" />
          Reintentar
        </button>
      </div>
    </div>
  );
}

function CatalogQuickActions({
  participantsCount,
  sourcesCount,
  disabled,
  onOpen,
}) {
  const actions = [
    {
      key: "participants",
      icon: "groups",
      title: "Participantes",
      description: "Crea alias y grupos antes de registrar documentos.",
      count: participantsCount,
    },
    {
      key: "sources",
      icon: "source",
      title: "Fuentes",
      description: "Define el origen de entrevistas, notas y observaciones.",
      count: sourcesCount,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-[#FCFCFA] p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
            Preparación del corpus
          </p>
          <h3 className="mt-1 text-base font-black text-slate-900">
            Organiza catálogos antes de crear documentos
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Estos datos estarán disponibles al registrar cada documento.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={(event) => onOpen(action.key, event.currentTarget)}
            disabled={disabled}
            className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-[#005944]/30 hover:bg-[#005944]/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#005944]/10 text-[#005944]">
              <Icon name={action.icon} className="text-xl" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  {action.title}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                  {action.count}
                </span>
              </span>
              <span className="mt-1 block truncate text-xs text-slate-500">
                {action.description}
              </span>
            </span>

            <Icon
              name="arrow_forward"
              className="shrink-0 text-lg text-slate-300 transition-colors group-hover:text-[#005944]"
            />
          </button>
        ))}
      </div>
    </section>
  );
}

export default function CorpusEditorSection() {
  const router = useRouter();
  const { projectId, routes } = useCorpusContext();

  const [trashOpen, setTrashOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogInitialTab, setCatalogInitialTab] = useState("participants");
  const catalogReturnFocus = useRef(null);

  function openCatalog(tab, trigger) {
    catalogReturnFocus.current = trigger;
    setCatalogInitialTab(tab);
    setCatalogOpen(true);
  }

  const {
    documents,
    stats,
    sources,
    participants,
    sourceOptions,
    participantOptions,
    filters,
    loading,
    refreshing,
    errorMsg,
    hasActiveFilters,
    documentCountLabel,
    updateFilter,
    resetFilters,
    refresh,
  } = useCorpusDashboard(projectId);

  return (
    <>
      <WorkspaceEditorCard
        title="Corpus del proyecto"
        icon="inventory_2"
        savingState={refreshing ? "saving" : "idle"}
        savingError={errorMsg}
        secondaryActions={[
          {
            icon: "delete",
            label: "Papelera",
            onClick: () => setTrashOpen(true),
            disabled: loading,
          },
          {
            icon: "refresh",
            label: "Actualizar",
            onClick: refresh,
            disabled: loading || refreshing,
          },
        ]}
        primaryActionLabel="Nueva transcripción"
        primaryActionIcon="add"
        onPrimaryAction={() => router.push(routes.newDocumentHref)}
      >

        <ErrorBanner message={errorMsg} onRetry={refresh} />

        <CatalogQuickActions
          participantsCount={participants.length}
          sourcesCount={sources.length}
          disabled={loading}
          onOpen={openCatalog}
        />

        <CorpusStatsGrid stats={stats} />

        <div className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Documentos
              </p>
              <h3 className="mt-1 text-xl font-black text-slate-900">
                {documentCountLabel}
              </h3>
            </div>

            <p className="text-sm text-slate-500">
              Busca en título, texto, notas y lugar. Filtra por tipo, estado,
              fuente o participante.
            </p>
          </div>

          <CorpusFiltersBar
            filters={filters}
            sourceOptions={sourceOptions}
            participantOptions={participantOptions}
            refreshing={refreshing}
            hasActiveFilters={hasActiveFilters}
            onFilterChange={updateFilter}
            onResetFilters={resetFilters}
            onRefresh={refresh}
          />

          <CorpusDocumentsList
            projectId={projectId}
            documents={documents}
            sources={sources}
            participants={participants}
            loading={loading}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
            onCreate={() => router.push(routes.newDocumentHref)}
          />
        </div>
      </WorkspaceEditorCard>

      <CorpusTrashModal
        projectId={projectId}
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        onRestored={refresh}
        sources={sources}
        participants={participants}
        sourceOptions={sourceOptions}
        participantOptions={participantOptions}
      />

      <CorpusCatalogModal
        key={`${catalogInitialTab}-${catalogOpen ? "open" : "closed"}`}
        projectId={projectId}
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onChanged={refresh}
        initialTab={catalogInitialTab}
        returnFocusRef={catalogReturnFocus}
      />
    </>
  );
}
