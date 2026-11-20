"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/common/Icon";
import { createProjectExportAction } from "@/features/projects/exports/helpers/projectExports.helpers";
import { useReportWorkspace } from "@/features/projects/report/hooks/useReportWorkspace";

function getCount(value) {
  return Math.max(0, Number(value ?? 0));
}

function getExcerpt(value, length = 190) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}...`;
}

function getStatusLabel(phase, fallback = "Pendiente") {
  if (phase?.state === "completed") return "Completado";
  if (phase?.state === "in_progress") return "En progreso";
  return fallback;
}

function Metric({ label, value, detail }) {
  return (
    <div className="min-w-0 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0">
      <p className="text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-600">{label}</p>
      {detail ? <p className="mt-1 text-[11px] text-slate-400">{detail}</p> : null}
    </div>
  );
}

function StageRow({ number, title, description, status, href }) {
  const content = (
    <div className="flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#005944]/10 text-xs font-black text-[#005944]">
        {number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{title}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {status}
          </span>
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-500">
          {description}
        </span>
      </span>
      {href ? <Icon name="arrow_forward" className="mt-1 text-base text-slate-400" /> : null}
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  ) : (
    content
  );
}

function MemoPreview({ memo }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#005944]/30">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-sm font-bold text-slate-900">{memo.title || "Memo sin título"}</h3>
        <span className="shrink-0 rounded-full bg-[#005944]/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#005944]">
          {memo.status === "confirmed" ? "Listo" : "Borrador"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {getExcerpt(memo.body, 180) || "Este memo todavía no tiene contenido."}
      </p>
    </article>
  );
}

function InsightPreview({ insight }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#005944]/30">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-sm font-bold text-slate-900">
          {insight.title || "Hallazgo sin título"}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
            insight.status === "confirmed"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {insight.status === "confirmed" ? "Confirmado" : "En revisión"}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">
        {getExcerpt(insight.summary || insight.interpretation, 180) ||
          "Añade una síntesis para que este hallazgo pueda entrar al reporte."}
      </p>
    </article>
  );
}

function ReportLoading() {
  return (
    <div className="space-y-5" aria-label="Cargando reporte" aria-busy="true">
      <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)]">
        <div className="space-y-5">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function ExportRow({ action, icon, title, description, primary = false }) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "bg-[#005944] text-white hover:bg-[#004735]"
          : "border border-slate-200 bg-white text-slate-900 hover:border-[#005944]/30"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          primary ? "bg-white/15" : "bg-[#005944]/10 text-[#005944]"
        }`}
      >
        <Icon name={icon} className="text-[19px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className={`mt-0.5 block text-xs ${primary ? "text-white/75" : "text-slate-500"}`}>
          {description}
        </span>
      </span>
      <Icon name="download" className="text-[18px] opacity-70" />
    </button>
  );
}

export default function ReportEditorSection({ projectId }) {
  const [exportError, setExportError] = useState("");
  const { workflow, overview, memos, insights, loading, error, refreshing, reload } =
    useReportWorkspace(projectId);

  if (loading) return <ReportLoading />;

  const evidence = workflow.evidence ?? {};
  const phaseMap = workflow.phaseMap ?? {};
  const documents = getCount(evidence.documents ?? overview?.documents_count);
  const segments = getCount(evidence.segments ?? overview?.segments_count);
  const codes = getCount(evidence.codes ?? overview?.codes_count);
  const assignments = getCount(evidence.assignments ?? overview?.coded_segments_count);
  const memoCount = getCount(evidence.memos ?? memos.length);
  const insightCount = getCount(evidence.insights ?? insights.length);
  const confirmedInsights = getCount(
    evidence.confirmedInsights ??
      insights.filter((insight) => insight.status === "confirmed").length
  );
  const reportReady = confirmedInsights > 0;

  const exports = {
    bundle: createProjectExportAction({
      projectId,
      exportType: "bundle",
      format: "zip",
      label: "Paquete analítico",
      onError: setExportError,
      query: { scope: "report" },
    }),
    insights: createProjectExportAction({
      projectId,
      exportType: "insights",
      format: "docx",
      label: "Hallazgos DOCX",
      onError: setExportError,
    }),
    quotes: createProjectExportAction({
      projectId,
      exportType: "quotes",
      format: "docx",
      label: "Citas DOCX",
      onError: setExportError,
    }),
  };

  const readiness = [
    {
      label: "Protocolo metodológico",
      ready: phaseMap.delimitation?.state === "completed" && phaseMap.design?.state === "completed",
      detail: "Delimitación y diseño",
    },
    {
      label: "Evidencia organizada",
      ready: documents > 0 && segments > 0,
      detail: `${documents} documentos, ${segments} segmentos`,
    },
    {
      label: "Lectura interpretativa",
      ready: codes > 0 && memoCount > 0,
      detail: `${codes} códigos, ${memoCount} memos`,
    },
    {
      label: "Hallazgos confirmados",
      ready: reportReady,
      detail: `${confirmedInsights} confirmados`,
    },
  ];
  const readinessCount = readiness.filter((item) => item.ready).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#005944]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#005944]">
                {reportReady ? "Listo para compartir" : "Borrador de síntesis"}
              </span>
              {refreshing ? <span className="text-xs text-slate-400">Actualizando...</span> : null}
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              Síntesis del proyecto
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              Reúne el recorrido metodológico, la evidencia y los memos que sostienen tus hallazgos.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={exports.bundle.onClick}
              disabled={exports.bundle.disabled}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#005944] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#004735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="download" className="text-[18px]" />
              Descargar paquete
            </button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Documentos" value={documents} detail="en el corpus" />
          <Metric label="Segmentos" value={segments} detail="seleccionados" />
          <Metric label="Códigos" value={codes} detail="en el codebook" />
          <Metric label="Asignaciones" value={assignments} detail="segmentos codificados" />
          <Metric label="Memos" value={memoCount} detail="interpretaciones" />
          <Metric label="Hallazgos" value={insightCount} detail={`${confirmedInsights} confirmados`} />
        </div>
      </section>

      {exportError ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{exportError}</p> : null}
      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={reload}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 font-bold text-amber-900 shadow-sm hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
          >
            <Icon name="refresh" className="text-[17px]" />
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(270px,0.7fr)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="report-route-title">
            <div>
              <h2 id="report-route-title" className="text-lg font-black text-slate-950">
                Ruta de lectura
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                El reporte conserva la trazabilidad desde el protocolo hasta la interpretación.
              </p>
            </div>
            <div className="mt-5 space-y-1">
              <StageRow
                number="1"
                title="Protocolo"
                description="Delimitación, diseño y muestra que enmarcan la pregunta."
                status={getStatusLabel(phaseMap.design)}
                href={`/projects/${projectId}/research-design`}
              />
              <StageRow
                number="2"
                title="Evidencia"
                description="Documentos y segmentos que sostienen la lectura del corpus."
                status={documents > 0 && segments > 0 ? "Completado" : "Pendiente"}
                href={`/projects/${projectId}/analysis/segments`}
              />
              <StageRow
                number="3"
                title="Interpretación"
                description="Códigos y memos que convierten fragmentos en una lectura analítica."
                status={codes > 0 && memoCount > 0 ? "Completado" : "En construcción"}
                href={`/projects/${projectId}/analysis/memos`}
              />
              <StageRow
                number="4"
                title="Síntesis"
                description="Hallazgos confirmados que ya pueden entrar al reporte final."
                status={reportReady ? "Completado" : "En revisión"}
                href={`/projects/${projectId}/analysis/insights`}
              />
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
              Segmento <span className="mx-1 text-slate-400">›</span> Código <span className="mx-1 text-slate-400">›</span> Memo <span className="mx-1 text-slate-400">›</span> Hallazgo
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6" aria-labelledby="report-memos-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="report-memos-title" className="text-lg font-black text-slate-950">
                  Memos que sostienen la interpretación
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Usa estas notas como puente entre la evidencia y los hallazgos.
                </p>
              </div>
              <Link
                href={`/projects/${projectId}/analysis/memos`}
                className="inline-flex min-h-9 items-center gap-1 self-start rounded-lg px-2 text-xs font-bold text-[#005944] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
              >
                Abrir todos
                <Icon name="arrow_forward" className="text-[16px]" />
              </Link>
            </div>
            {memos.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {memos.slice(0, 4).map((memo) => (
                  <MemoPreview key={memo.id} memo={memo} />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-7 text-center">
                <Icon name="edit_note" className="text-2xl text-[#005944]" />
                <p className="mt-2 text-sm font-bold text-slate-800">Todavía no hay memos.</p>
                <p className="mt-1 text-xs text-slate-500">Crea una interpretación para darle contexto a tus hallazgos.</p>
                <Link
                  href={`/projects/${projectId}/analysis/memos`}
                  className="mt-4 inline-flex min-h-9 items-center rounded-lg bg-[#005944] px-3 text-xs font-bold text-white hover:bg-[#004735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
                >
                  Crear memo
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="report-insights-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="report-insights-title" className="text-lg font-black text-slate-950">
                  Hallazgos para el documento final
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Solo los hallazgos confirmados están listos para presentar como resultado.
                </p>
              </div>
              <Link
                href={`/projects/${projectId}/analysis/insights`}
                className="inline-flex min-h-9 items-center gap-1 self-start rounded-lg px-2 text-xs font-bold text-[#005944] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
              >
                Revisar hallazgos
                <Icon name="arrow_forward" className="text-[16px]" />
              </Link>
            </div>
            {insights.length ? (
              <div className="mt-5 space-y-3">
                {insights.slice(0, 4).map((insight) => (
                  <InsightPreview key={insight.id} insight={insight} />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-7 text-center">
                <Icon name="emoji_objects" className="text-2xl text-slate-400" />
                <p className="mt-2 text-sm font-bold text-slate-800">Aún no hay hallazgos.</p>
                <p className="mt-1 text-xs text-slate-500">Consolida un hallazgo cuando tus memos tengan suficiente evidencia.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="report-readiness-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="report-readiness-title" className="text-lg font-black text-slate-950">Estado de cierre</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{readinessCount} de {readiness.length} bases listas</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#005944]/10 text-sm font-black text-[#005944]">{Math.round((readinessCount / readiness.length) * 100)}%</span>
            </div>
            <div className="mt-5 space-y-3">
              {readiness.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <Icon name={item.ready ? "check_circle" : "radio_button_unchecked"} className={`mt-0.5 text-[19px] ${item.ready ? "text-[#005944]" : "text-slate-300"}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${item.ready ? "text-slate-900" : "text-slate-500"}`}>{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6" aria-labelledby="report-exports-title">
            <div>
              <h2 id="report-exports-title" className="text-lg font-black text-slate-950">Exportar</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">Descarga la versión actual con la información guardada.</p>
            </div>
            <div className="mt-5 space-y-2">
              <ExportRow action={exports.insights} icon="description" title="Hallazgos" description="Documento editable en DOCX" />
              <ExportRow action={exports.quotes} icon="format_quote" title="Citas textuales" description="Evidencia literal en DOCX" />
            </div>
          </section>

          <section className="rounded-2xl border border-[#005944]/15 bg-[#f0f8f5] p-5" aria-labelledby="report-trace-title">
            <h2 id="report-trace-title" className="text-sm font-black text-[#005944]">Trazabilidad</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">Cada lectura del reporte puede volver al segmento que la originó.</p>
            <Link
              href={`/projects/${projectId}/analysis`}
              className="mt-4 inline-flex min-h-9 items-center gap-1 text-xs font-bold text-[#005944] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
            >
              Explorar evidencia
              <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
