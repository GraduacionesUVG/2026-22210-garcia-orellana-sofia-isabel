"use client";

import Link from "next/link";
import Icon from "@/components/common/Icon";
import AnalysisMemoCard from "@/features/projects/analysis/components/AnalysisMemoCard";
import AnalysisMemoFormModal from "@/features/projects/analysis/components/AnalysisMemoFormModal";
import AnalysisMemoLinksPanel from "@/features/projects/analysis/components/AnalysisMemoLinksPanel";
import {
  MEMO_STATUSES,
  MEMO_TYPES,
  formatAnalysisNumber,
  getAnalysisInsightsHref,
  getMemoStatusLabel,
} from "@/features/projects/analysis/helpers/analysis.helpers";

function getStatusCounts(memos) {
  return MEMO_STATUSES.map((status) => ({
    ...status,
    count: memos.filter((memo) => memo.status === status.value).length,
  }));
}

export default function AnalysisMemosDashboardView({ projectId, manager }) {
  const statusCounts = getStatusCounts(manager.memos);
  const maxStatusCount = Math.max(1, ...statusCounts.map((item) => item.count));

  return (
    <>
      <section className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
              Memos analíticos
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Convierte evidencia en interpretación
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
              Escribe ideas, tensiones y preguntas antes de consolidar hallazgos.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-[#005944]/30 hover:text-[#005944] disabled:opacity-50"
              onClick={manager.reload}
              disabled={manager.loading || manager.refreshing}
            >
              <Icon
                name="refresh"
                className={manager.refreshing ? "animate-spin text-base" : "text-base"}
              />
              Actualizar
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#004232] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
              onClick={manager.openCreateModal}
            >
              <Icon name="add" className="text-base" />
              Nuevo memo
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)]">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Estado de interpretación
                </p>
                <p className="mt-1 text-sm font-black text-slate-900">
                  {formatAnalysisNumber(manager.memos.length)} memos
                </p>
              </div>
              <Icon name="edit_note" className="text-xl text-[#005944]" />
            </div>

            <div
              className="mt-4 space-y-2"
              role="img"
              aria-label="Distribución de memos por estado"
            >
              {statusCounts.map((item) => (
                <div key={item.value} className="grid grid-cols-[76px_minmax(0,1fr)_28px] items-center gap-2">
                  <span className="truncate text-xs font-bold text-slate-600">
                    {getMemoStatusLabel(item.value)}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[#005944] transition-[width] duration-300"
                      style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-right text-xs font-black text-slate-700">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#005944]/15 bg-[#005944]/[0.04] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
              Antes del hallazgo
            </p>
            <p className="mt-2 text-sm font-black leading-relaxed text-slate-900">
              Un memo conserva la lectura mientras todavía está tomando forma.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Vincúlalo a segmentos o códigos para no perder la evidencia que sostiene la interpretación.
            </p>
          </div>
        </div>
      </section>

      <section className="analysis-reveal rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Bitácora de interpretación
            </p>
            <h3 className="mt-1 text-lg font-black text-slate-950">
              Tus memos de trabajo
            </h3>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-3 lg:max-w-2xl">
            <input
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944]"
              value={manager.filters.search}
              onChange={(event) => manager.updateFilter("search", event.target.value)}
              placeholder="Buscar memo"
              aria-label="Buscar memo"
            />
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={manager.filters.memo_type}
              onChange={(event) => manager.updateFilter("memo_type", event.target.value)}
              aria-label="Filtrar por tipo de memo"
            >
              <option value="">Todos los tipos</option>
              {MEMO_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={manager.filters.status}
              onChange={(event) => manager.updateFilter("status", event.target.value)}
              aria-label="Filtrar por estado de memo"
            >
              <option value="">Todos los estados</option>
              {MEMO_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {manager.errorMsg ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {manager.errorMsg}
          </div>
        ) : null}
        {manager.successMsg ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            {manager.successMsg}
          </div>
        ) : null}

        {manager.loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500" role="status">
            <Icon name="sync" className="animate-spin text-lg" />
            Cargando memos…
          </div>
        ) : null}

        {!manager.loading && !manager.memos.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-black text-slate-900">
              Todavía no hay memos.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Registra una lectura antes de convertirla en hallazgo.
            </p>
          </div>
        ) : null}

        {!manager.loading && manager.memos.length ? (
          <div className="mt-4 space-y-3">
            {manager.memos.map((memo) => (
              <AnalysisMemoCard
                key={memo.id}
                memo={memo}
                deleting={manager.deletingId === memo.id}
                onEdit={manager.openEditModal}
                onDelete={manager.removeMemo}
                onLinks={manager.openLinksPanel}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-slate-500">
            Cuando una interpretación esté suficientemente apoyada, podrás convertirla en hallazgo.
          </p>
          <Link
            href={getAnalysisInsightsHref(projectId)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-[#005944]/30 hover:text-[#005944]"
          >
            Ver hallazgos
            <Icon name="arrow_forward" className="text-base" />
          </Link>
        </div>
      </section>

      <AnalysisMemoFormModal
        open={manager.modalOpen}
        form={manager.form}
        editingMemo={manager.editingMemo}
        saving={manager.saving}
        onClose={manager.closeModal}
        onFieldChange={manager.setFormField}
        onSave={manager.saveMemo}
      />
      <AnalysisMemoLinksPanel manager={manager} />
    </>
  );
}
