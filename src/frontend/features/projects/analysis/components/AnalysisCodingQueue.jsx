"use client";

import Icon from "@/components/common/Icon";
import {
  getSegmentCodeNames,
  truncateAnalysisText,
} from "@/features/projects/analysis/helpers/analysis.helpers";
import AnalysisSegmentCodeChips from "@/features/projects/analysis/components/AnalysisSegmentCodeChips";

function SegmentCodesDisclosure({ segment }) {
  const codeNames = getSegmentCodeNames(segment);

  if (!codeNames.length) return null;

  return (
    <details className="group px-4 pb-3">
      <summary
        className="hide-details-marker flex cursor-pointer list-none items-center gap-1.5 rounded-lg py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition hover:text-[#005944] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944]/30"
        aria-label={`Mostrar códigos del segmento (${codeNames.length})`}
      >
        <Icon
          name="sell"
          className="shrink-0 text-sm text-slate-300 transition group-open:text-[#005944]"
        />
        <span>Códigos</span>
        <span className="font-semibold normal-case tracking-normal text-slate-400">
          {codeNames.length}
        </span>
        <Icon
          name="expand_more"
          className="ml-auto shrink-0 text-base transition-transform group-open:rotate-180"
        />
      </summary>
      <div
        className="mt-2 rounded-lg bg-slate-50 p-2"
        aria-label={`Códigos del segmento: ${codeNames.join(", ")}`}
      >
        <AnalysisSegmentCodeChips segment={segment} compact />
      </div>
    </details>
  );
}

export default function AnalysisCodingQueue({
  manager,
  selectedSegmentId,
  onSelect,
}) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white xl:sticky xl:top-0 xl:max-h-[calc(100vh-3rem)]">
      <div className="border-b border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
              Cola de evidencia
            </p>
            <p className="mt-1 text-sm font-black text-slate-950">
              {manager.counts.uncoded} pendientes
            </p>
          </div>
          {manager.refreshing ? (
            <Icon
              name="sync"
              className="animate-spin text-lg text-[#005944]"
              aria-label="Actualizando"
            />
          ) : null}
        </div>

        <label className="mt-3 block">
          <span className="sr-only">Buscar segmentos</span>
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
            />
            <input
              type="search"
              value={manager.filters.search}
              onChange={(event) =>
                manager.updateFilter("search", event.target.value)
              }
              placeholder="Texto, código o participante"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
            />
          </div>
        </label>

        <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" aria-label="Filtrar cola por estado">
          {[
            { value: "all", label: "Todos" },
            { value: "uncoded", label: "Pendientes" },
            { value: "coded", label: "Listos" },
          ].map((option) => {
            const active = manager.filters.status === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => manager.updateFilter("status", option.value)}
                aria-pressed={active}
                className={[
                  "min-h-9 rounded-lg px-2 text-[11px] font-bold transition",
                  active
                    ? "bg-white text-[#005944] shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="custom-scrollbar max-h-72 overflow-y-auto xl:max-h-[calc(100vh-15rem)]">
        {manager.loading ? (
          <div className="flex min-h-36 items-center justify-center gap-2 p-5 text-sm font-bold text-slate-500">
            <Icon name="sync" className="animate-spin text-lg" />
            Cargando…
          </div>
        ) : manager.errorMsg ? (
          <div className="m-3 rounded-xl bg-amber-50 p-3" role="alert">
            <p className="text-xs leading-5 text-amber-950">{manager.errorMsg}</p>
            <button
              type="button"
              onClick={manager.reload}
              className="mt-2 min-h-11 text-xs font-black text-amber-900 underline"
            >
              Reintentar
            </button>
          </div>
        ) : manager.segments.length ? (
          <ul aria-label="Segmentos disponibles">
            {manager.segments.map((segment) => {
              const active = segment.id === selectedSegmentId;
              return (
                <li
                  key={segment.id}
                  className={[
                    "border-b border-slate-100 transition last:border-b-0",
                    active
                      ? "bg-[#005944]/8"
                      : "bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelect(segment.id)}
                    className="block min-h-20 w-full px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#005944]"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {segment.is_coded ? "Codificado" : "Pendiente"}
                      </span>
                      <span
                        className={[
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          segment.is_coded ? "bg-emerald-500" : "bg-amber-400",
                        ].join(" ")}
                        aria-label={segment.is_coded ? "Codificado" : "Pendiente"}
                      />
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-slate-700">
                      {truncateAnalysisText(segment.selected_text ?? "", 92)}
                    </span>
                    <span className="mt-1 block truncate text-[10px] font-semibold text-slate-400">
                      {segment.document_title || "Documento"}
                    </span>
                  </button>
                  <SegmentCodesDisclosure segment={segment} />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-6 text-center">
            <Icon name="done_all" className="text-2xl text-[#005944]" />
            <p className="mt-2 text-sm font-bold text-slate-700">
              No hay segmentos con este filtro.
            </p>
            {manager.hasActiveFilters ? (
              <button
                type="button"
                onClick={manager.resetFilters}
                className="mt-2 min-h-11 text-xs font-black text-[#005944] underline"
              >
                Ver toda la evidencia
              </button>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}
