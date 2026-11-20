"use client";

import Icon from "@/components/common/Icon";
import {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
} from "@/features/projects/corpus/helpers/corpus.helpers";

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

export default function CorpusFiltersBar({
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
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
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
                onChange={(event) =>
                  onFilterChange("search", event.target.value)
                }
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

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
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

          <div className="corpus-filter-actions flex items-end gap-2">
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
    </div>
  );
}
