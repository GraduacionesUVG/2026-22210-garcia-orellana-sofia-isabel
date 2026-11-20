"use client";

import Icon from "@/components/common/Icon";
import {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  formatCorpusDate,
  formatCorpusNumber,
  getDocumentArchiveMetadata,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
} from "@/features/projects/corpus/helpers/corpus.helpers";
import { useCorpusTrash } from "@/features/projects/corpus/hooks/useCorpusTrash";

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>

      <select
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function TrashFilters({
  filters,
  sourceOptions,
  participantOptions,
  refreshing,
  hasActiveFilters,
  onFilterChange,
  onResetFilters,
  onRefresh,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px]">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Buscar
          </span>

          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
            />

            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
              value={filters.search}
              onChange={(event) => onFilterChange("search", event.target.value)}
              placeholder="Buscar título, texto, notas o lugar"
            />
          </div>
        </label>

        <SelectField
          label="Tipo"
          value={filters.document_type}
          onChange={(value) => onFilterChange("document_type", value)}
        >
          <option value="">Todos</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Estado"
          value={filters.status}
          onChange={(value) => onFilterChange("status", value)}
        >
          <option value="">Todos</option>
          {DOCUMENT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
        <SelectField
          label="Fuente"
          value={filters.source_id}
          onChange={(value) => onFilterChange("source_id", value)}
        >
          <option value="">Todas</option>
          {sourceOptions.map((source) => (
            <option key={source.value} value={source.value}>
              {source.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Participante"
          value={filters.participant_id}
          onChange={(value) => onFilterChange("participant_id", value)}
        >
          <option value="">Todos</option>
          {participantOptions.map((participant) => (
            <option key={participant.value} value={participant.value}>
              {participant.label}
            </option>
          ))}
        </SelectField>

        <div className="flex items-end gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:text-[#005944] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onResetFilters}
            disabled={!hasActiveFilters}
          >
            <Icon name="filter_alt_off" className="text-base" />
            Limpiar
          </button>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#005944]/20 bg-white px-3 text-xs font-bold text-[#005944] transition hover:bg-[#005944]/5"
            onClick={onRefresh}
          >
            <Icon
              name="sync"
              className={`text-base ${refreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
}

function findSourceLabel(sources, sourceId) {
  if (!sourceId) return "Sin fuente";
  return sources.find((source) => source.id === sourceId)?.label ?? "Fuente";
}

function findParticipantLabel(participants, participantId) {
  if (!participantId) return "Sin participante";

  const participant = participants.find((item) => item.id === participantId);

  if (!participant) return "Participante";

  return participant.display_name
    ? `${participant.alias} · ${participant.display_name}`
    : participant.alias;
}

function TrashDocumentCard({
  document,
  sources,
  participants,
  restoringId,
  onRestore,
}) {
  const isRestoring = restoringId === document.id;
  const archiveMeta = getDocumentArchiveMetadata(document);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-700">
              En papelera
            </span>

            <span className="rounded-full bg-[#005944]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]">
              {getDocumentTypeLabel(document.document_type)}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {getDocumentStatusLabel(document.status)}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 text-base font-black text-slate-900">
            {document.title}
          </h3>

          <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Icon name="source" className="text-base text-slate-400" />
              <span className="truncate">
                {findSourceLabel(sources, document.source_id)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Icon name="person" className="text-base text-slate-400" />
              <span className="truncate">
                {findParticipantLabel(participants, document.participant_id)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Icon
                name="format_align_left"
                className="text-base text-slate-400"
              />
              <span>{formatCorpusNumber(document.word_count)} palabras</span>
            </div>

            <div className="flex items-center gap-2">
              <Icon name="delete" className="text-base text-slate-400" />
              <span>Eliminado: {formatCorpusDate(document.deleted_at)}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              {archiveMeta.dateLabel}
            </span>
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              Lugar: {archiveMeta.locationLabel}
            </span>
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              Idioma: {archiveMeta.languageLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => onRestore(document.id)}
          disabled={Boolean(restoringId)}
        >
          <Icon
            name={isRestoring ? "sync" : "restore"}
            className={`text-base ${isRestoring ? "animate-spin" : ""}`}
          />
          {isRestoring ? "Restaurando..." : "Restaurar"}
        </button>
      </div>
    </article>
  );
}

function EmptyTrashState({ hasActiveFilters, onResetFilters }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon name="delete_sweep" className="text-2xl" />
      </div>

      <h3 className="mt-4 text-base font-black text-slate-900">
        {hasActiveFilters
          ? "No hay documentos eliminados con estos filtros"
          : "La papelera está vacía"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {hasActiveFilters
          ? "Puedes limpiar filtros para ver otros documentos eliminados."
          : "Cuando envíes documentos a la papelera, aparecerán aquí para poder restaurarlos."}
      </p>

      {hasActiveFilters ? (
        <button
          type="button"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:text-[#005944]"
          onClick={onResetFilters}
        >
          <Icon name="filter_alt_off" className="text-base" />
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}

export default function CorpusTrashModal({
  projectId,
  open,
  onClose,
  onRestored,
  sources = [],
  participants = [],
  sourceOptions = [],
  participantOptions = [],
}) {
  const {
    documents,
    filters,
    loading,
    refreshing,
    restoringId,
    errorMsg,
    successMsg,
    hasActiveFilters,
    documentCountLabel,
    updateFilter,
    resetFilters,
    refresh,
    restoreDocument,
  } = useCorpusTrash(projectId, open, { onRestored });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
      <section className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-600">
                Papelera del corpus
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                {documentCountLabel}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Restaura documentos eliminados para devolverlos al corpus activo.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
              onClick={onClose}
              aria-label="Cerrar papelera"
            >
              <Icon name="close" className="text-xl" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          <div className="space-y-4">
            <TrashFilters
              filters={filters}
              sourceOptions={sourceOptions}
              participantOptions={participantOptions}
              refreshing={refreshing}
              hasActiveFilters={hasActiveFilters}
              onFilterChange={updateFilter}
              onResetFilters={resetFilters}
              onRefresh={refresh}
            />

            {errorMsg ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-700">
                    <Icon name="error" className="text-lg" />
                  </span>

                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-red-800">
                      Error
                    </p>
                    <p className="mt-1 text-sm text-red-900">{errorMsg}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {successMsg ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#005944]">
                    <Icon name="check_circle" className="text-lg" />
                  </span>

                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-[#005944]">
                      Restaurado
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{successMsg}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005944]/10 text-[#005944]">
                    <Icon name="hourglass_top" className="text-xl" />
                  </span>

                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-[#005944]">
                      Cargando papelera
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Buscando documentos eliminados.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {!loading && !documents.length ? (
              <EmptyTrashState
                hasActiveFilters={hasActiveFilters}
                onResetFilters={resetFilters}
              />
            ) : null}

            {!loading && documents.length ? (
              <div className="space-y-3">
                {documents.map((document) => (
                  <TrashDocumentCard
                    key={document.id}
                    document={document}
                    sources={sources}
                    participants={participants}
                    restoringId={restoringId}
                    onRestore={restoreDocument}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
