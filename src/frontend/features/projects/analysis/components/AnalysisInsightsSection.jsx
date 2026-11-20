"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/common/Icon";
import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import AnalysisInsightCard from "@/features/projects/analysis/components/AnalysisInsightCard";
import AnalysisInsightFormModal from "@/features/projects/analysis/components/AnalysisInsightFormModal";
import AnalysisInsightLinksPanel from "@/features/projects/analysis/components/AnalysisInsightLinksPanel";
import { useAnalysisContext } from "@/features/projects/analysis/components/AnalysisProvider";
import { useAnalysisInsights } from "@/features/projects/analysis/hooks/useAnalysisInsights";
import { createProjectExportAction } from "@/features/projects/exports/helpers/projectExports.helpers";
import {
  INSIGHT_CONFIDENCE_LEVELS,
  INSIGHT_STATUSES,
  INSIGHT_TYPES,
  buildInsightTimelineGroups,
  getInsightStatusLabel,
  getAnalysisMemosHref,
  getMemoStatusLabel,
  summarizeInsightLinks,
} from "@/features/projects/analysis/helpers/analysis.helpers";

export default function AnalysisInsightsSection() {
  const { projectId } = useAnalysisContext();
  const manager = useAnalysisInsights(projectId);
  const [exportError, setExportError] = useState("");
  const linksByInsight = useMemo(() => {
    const groups = new Map();

    manager.insightLinks.forEach((link) => {
      groups.set(link.insight_id, [...(groups.get(link.insight_id) ?? []), link]);
    });

    return groups;
  }, [manager.insightLinks]);
  const timelineGroups = useMemo(
    () => buildInsightTimelineGroups(manager.insights),
    [manager.insights]
  );
  const statusCounts = useMemo(
    () =>
      manager.insights.reduce((acc, insight) => {
        acc[insight.status] = (acc[insight.status] ?? 0) + 1;
        return acc;
      }, {}),
    [manager.insights]
  );

  function getEvidenceSummary(insight) {
    return summarizeInsightLinks(
      linksByInsight.get(insight.id) ?? [],
      manager.codes,
      manager.memos
    );
  }

  return (
    <>
      <WorkspaceEditorCard
        title="Hallazgos"
        icon="emoji_objects"
        savingState={manager.refreshing ? "saving" : "idle"}
        savingError={exportError || manager.errorMsg}
        secondaryActions={[
          {
            icon: "refresh",
            label: "Actualizar",
            onClick: manager.reload,
            disabled: manager.loading || manager.refreshing,
          },
          createProjectExportAction({
            projectId,
            exportType: "insights",
            format: "docx",
            label: "Exportar bitacora",
            onError: setExportError,
          }),
          createProjectExportAction({
            projectId,
            exportType: "quotes",
            format: "docx",
            label: "Citas textuales",
            onError: setExportError,
          }),
        ]}
        primaryActionLabel="Nuevo hallazgo"
        primaryActionIcon="add"
        onPrimaryAction={manager.openCreateModal}
      >
        {exportError ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{exportError}</p> : null}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600">
          Un hallazgo debe estar conectado a evidencia, no solo a una intuición.
        </div>

        <section className="rounded-2xl border border-[#005944]/15 bg-[#f8fbfa] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
                Memos que lo sostienen
              </p>
              <h2 className="mt-1 text-base font-black text-slate-950">
                Parte de tus memos para construir el hallazgo
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Revisa primero las interpretaciones y después consolida una lectura.
              </p>
            </div>
            <Link
              href={getAnalysisMemosHref(projectId)}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#005944]/20 bg-white px-3 text-xs font-bold text-[#005944] transition hover:bg-[#005944]/5"
            >
              Ver memos
              <Icon name="arrow_forward" className="text-base" />
            </Link>
          </div>

          {manager.memos.length ? (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {manager.memos.map((memo) => (
                <article
                  key={memo.id}
                  className="rounded-xl border border-white bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 break-words text-sm font-black text-slate-900">
                      {memo.title}
                    </p>
                    <span className="shrink-0 rounded-full bg-[#005944]/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]">
                      {getMemoStatusLabel(memo.status)}
                    </span>
                  </div>
                  {memo.body ? (
                    <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600">
                      {memo.body}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-[#005944]/20 bg-white p-4 text-sm text-slate-600">
              Todavía no hay memos. Registra una interpretación antes de crear un hallazgo.
            </p>
          )}
        </section>

        <div className="grid gap-3 sm:grid-cols-4">
          <input
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944]"
            value={manager.filters.search}
            onChange={(event) =>
              manager.updateFilter("search", event.target.value)
            }
            placeholder="Buscar hallazgo"
          />
          <select
            aria-label="Tipo de hallazgo"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={manager.filters.insight_type}
            onChange={(event) =>
              manager.updateFilter("insight_type", event.target.value)
            }
          >
            <option value="">Todos los tipos</option>
            {INSIGHT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Estado de hallazgo"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={manager.filters.status}
            onChange={(event) =>
              manager.updateFilter("status", event.target.value)
            }
          >
            <option value="">Todos los estados</option>
            {INSIGHT_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Confianza del hallazgo"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={manager.filters.confidence}
            onChange={(event) =>
              manager.updateFilter("confidence", event.target.value)
            }
          >
            <option value="">Toda confianza</option>
            {INSIGHT_CONFIDENCE_LEVELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {manager.errorMsg ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {manager.errorMsg}
          </div>
        ) : null}
        {manager.successMsg ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-slate-700">
            {manager.successMsg}
          </div>
        ) : null}

        {manager.loading ? (
          <Icon name="sync" className="animate-spin text-xl text-[#005944]" />
        ) : null}

        {!manager.loading && manager.insights.length ? (
          <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Estados de la bitacora
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {INSIGHT_STATUSES.filter((status) =>
                  ["draft", "confirmed", "archived"].includes(status.value)
                ).map((status) => (
                  <div
                    key={status.value}
                    className="rounded-xl border border-white bg-white p-3 shadow-sm"
                  >
                    <p className="text-2xl font-black text-slate-950">
                      {statusCounts[status.value] ?? 0}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {status.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
                Timeline cronologico
              </p>
              <div className="mt-3 max-h-52 space-y-3 overflow-y-auto pr-1">
                {timelineGroups.map((group) => (
                  <div key={group.dateKey} className="border-l-2 border-emerald-100 pl-3">
                    <p className="text-xs font-black text-slate-500">
                      {group.label}
                    </p>
                    <div className="mt-2 space-y-2">
                      {group.items.map((insight) => (
                        <button
                          key={insight.id}
                          type="button"
                          className="block w-full rounded-xl bg-slate-50 px-3 py-2 text-left transition hover:bg-emerald-50"
                          onClick={() => manager.openEditModal(insight)}
                        >
                          <span className="block text-sm font-black text-slate-900">
                            {insight.title}
                          </span>
                          <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                            {getInsightStatusLabel(insight.status)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {!manager.loading && !manager.insights.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-black text-slate-900">
              Todavía no hay hallazgos. Consolida un hallazgo cuando tengas
              evidencia suficiente.
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          {manager.insights.map((insight) => (
            <AnalysisInsightCard
              key={insight.id}
              insight={insight}
              evidenceSummary={getEvidenceSummary(insight)}
              deleting={manager.deletingId === insight.id}
              onEdit={manager.openEditModal}
              onDelete={manager.removeInsight}
              onLinks={manager.openLinksPanel}
            />
          ))}
        </div>
      </WorkspaceEditorCard>

      <AnalysisInsightFormModal
        open={manager.modalOpen}
        form={manager.form}
        editingInsight={manager.editingInsight}
        saving={manager.saving}
        onClose={manager.closeModal}
        onFieldChange={manager.setFormField}
        onSave={manager.saveInsight}
      />

      <AnalysisInsightLinksPanel manager={manager} />
    </>
  );
}
