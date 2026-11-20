"use client";

import Link from "next/link";
import Icon from "@/components/common/Icon";
import {
  getAnalysisCodesHref,
  getAnalysisHref,
  getCorpusHref,
  truncateAnalysisText,
} from "@/features/projects/analysis/helpers/analysis.helpers";
import AnalysisSegmentCodeChips from "@/features/projects/analysis/components/AnalysisSegmentCodeChips";

function SummaryItem({ label, value, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800"
      : tone === "pending"
        ? "bg-amber-50 text-amber-800"
        : "bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-xl px-4 py-3 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function SegmentRow({ projectId, segment }) {
  const isCoded = Boolean(segment.is_coded);

  return (
    <article className="border-b border-slate-200 px-4 py-4 last:border-b-0 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                isCoded
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800",
              ].join(" ")}
            >
              {isCoded ? "Codificado" : "Pendiente"}
            </span>
            <AnalysisSegmentCodeChips segment={segment} compact />
          </div>

          <blockquote className="mt-3 text-sm leading-6 text-slate-700">
            “{truncateAnalysisText(segment.selected_text ?? "", 280)}”
          </blockquote>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="description" className="text-base" />
              {segment.document_title || "Documento"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="person" className="text-base" />
              {segment.participant_label || "Sin participante"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="sell" className="text-base" />
              {segment.code_count || 0} {segment.code_count === 1 ? "código" : "códigos"}
            </span>
          </div>
        </div>

        <Link
          href={getAnalysisCodesHref(projectId, {
            view: "coding",
            segmentId: segment.id,
          })}
          className={[
            "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2",
            isCoded
              ? "border border-slate-200 bg-white text-slate-700 hover:border-[#005944]/30 hover:text-[#005944]"
              : "bg-[#005944] text-white shadow-sm hover:bg-[#004232]",
          ].join(" ")}
        >
          {isCoded ? "Revisar codificación" : "Codificar segmento"}
          <Icon name="arrow_forward" className="text-base" />
        </Link>
      </div>
    </article>
  );
}

export default function AnalysisSegmentsQueue({ projectId, manager }) {
  const firstPending = manager.segments.find((segment) => !segment.is_coded);
  const primaryHref = getAnalysisCodesHref(projectId, {
    view: "coding",
    segmentId: firstPending?.id,
  });

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#005944]/15 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#005944]">
              Evidencia preparada
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              Revisa los fragmentos antes de interpretar patrones
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Cada segmento conserva su documento y participante. Puedes
              codificarlo directamente sin volver a buscarlo en el corpus.
            </p>
          </div>

          {manager.counts.uncoded > 0 ? (
            <Link
              href={primaryHref}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#004232] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
            >
              <Icon name="play_arrow" className="text-lg" />
              Codificar pendientes
            </Link>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <SummaryItem label="Segmentos" value={manager.counts.all} />
          <SummaryItem
            label="Codificados"
            value={manager.counts.coded}
            tone="success"
          />
          <SummaryItem
            label="Pendientes"
            value={manager.counts.uncoded}
            tone="pending"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px_auto] lg:items-end">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Buscar evidencia
              </span>
              <div className="relative mt-1">
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
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Estado
              </span>
              <select
                value={manager.filters.status}
                onChange={(event) =>
                  manager.updateFilter("status", event.target.value)
                }
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
              >
                <option value="all">Todos</option>
                <option value="uncoded">Pendientes</option>
                <option value="coded">Codificados</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Documento
              </span>
              <select
                value={manager.filters.document_id}
                onChange={(event) =>
                  manager.updateFilter("document_id", event.target.value)
                }
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
              >
                <option value="">Todos los documentos</option>
                {manager.documentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {manager.hasActiveFilters ? (
              <button
                type="button"
                onClick={manager.resetFilters}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:text-[#005944]"
              >
                <Icon name="filter_alt_off" className="text-lg" />
                Limpiar
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              {manager.total} {manager.total === 1 ? "resultado" : "resultados"}
            </span>
            {manager.refreshing ? (
              <span className="inline-flex items-center gap-1.5" role="status">
                <Icon name="sync" className="animate-spin text-base" />
                Actualizando
              </span>
            ) : null}
          </div>
        </div>

        {manager.errorMsg ? (
          <div
            className="m-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="text-sm text-amber-950">{manager.errorMsg}</p>
            <button
              type="button"
              onClick={manager.reload}
              className="min-h-11 rounded-xl bg-amber-800 px-4 text-sm font-bold text-white"
            >
              Reintentar
            </button>
          </div>
        ) : manager.loading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 p-8 text-sm font-bold text-slate-600">
            <Icon name="sync" className="animate-spin text-xl text-[#005944]" />
            Cargando segmentos…
          </div>
        ) : manager.segments.length ? (
          <div>
            {manager.segments.map((segment) => (
              <SegmentRow
                key={segment.id}
                projectId={projectId}
                segment={segment}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#005944]/10 text-[#005944]">
              <Icon
                name={manager.counts.all ? "search_off" : "segment"}
                className="text-2xl"
              />
            </span>
            <h3 className="mt-4 text-base font-black text-slate-950">
              {manager.counts.all
                ? "No hay segmentos con estos filtros"
                : "Todavía no hay segmentos preparados"}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              {manager.counts.all
                ? "Prueba otra búsqueda o limpia los filtros para recuperar toda la evidencia."
                : "Abre un documento del corpus, selecciona un fragmento relevante y guárdalo como segmento."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {manager.counts.all ? (
                <button
                  type="button"
                  onClick={manager.resetFilters}
                  className="min-h-11 rounded-xl bg-[#005944] px-4 text-sm font-bold text-white"
                >
                  Limpiar filtros
                </button>
              ) : (
                <Link
                  href={getCorpusHref(projectId)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#005944] px-4 text-sm font-bold text-white"
                >
                  Ir al corpus
                </Link>
              )}
              {manager.counts.all > 0 && manager.counts.uncoded === 0 ? (
                <Link
                  href={getAnalysisHref(projectId)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"
                >
                  Explorar patrones
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
