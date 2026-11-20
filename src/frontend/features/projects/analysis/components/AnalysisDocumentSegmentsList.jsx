"use client";

import Link from "next/link";
import Icon from "@/components/common/Icon";
import {
  getAnalysisCodesHref,
  getSegmentCodeNames,
  truncateAnalysisText,
} from "@/features/projects/analysis/helpers/analysis.helpers";

function SegmentEditor({ segment, manager }) {
  return (
    <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3">
      <label className="block">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Nota
        </span>
        <textarea
          value={manager.editingForm.note}
          onChange={(event) =>
            manager.setEditingField("note", event.target.value)
          }
          rows={3}
          className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => manager.saveSegment(segment)}
          disabled={manager.updatingId === segment.id}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#005944] px-3 text-xs font-bold text-white disabled:opacity-60"
        >
          <Icon name="save" className="text-base" />
          {manager.updatingId === segment.id ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={manager.cancelEditingSegment}
          className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function AnalysisDocumentSegmentsList({
  projectId,
  manager,
  codesBySegmentId = {},
}) {
  return (
    <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
            3 · Revisar y codificar
          </p>
          <h2 className="mt-1 text-base font-black text-slate-950">
            Segmentos del archivo
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#005944]">
          {manager.segments.length}
        </span>
      </div>

      {manager.errorMsg ? (
        <div
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"
          role="alert"
        >
          {manager.errorMsg}
        </div>
      ) : null}
      {manager.successMsg ? (
        <div
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
          role="status"
        >
          {manager.successMsg}
        </div>
      ) : null}

      {manager.loading ? (
        <div
          className="flex min-h-40 items-center justify-center gap-2 text-sm font-semibold text-slate-500"
          role="status"
        >
          <Icon name="sync" className="animate-spin text-xl text-[#005944]" />
          Cargando segmentos…
        </div>
      ) : manager.segments.length ? (
        <div className="mt-4 max-h-[44rem] space-y-3 overflow-y-auto pr-1">
          {manager.segments.map((segment) => {
            const segmentWithCodes = {
              ...segment,
              codes: codesBySegmentId[segment.id] ?? segment.codes ?? [],
            };
            const codeNames = getSegmentCodeNames(segmentWithCodes);

            return (
              <article
                key={segment.id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <blockquote className="text-sm leading-6 text-slate-700">
                      “{truncateAnalysisText(segment.selected_text ?? "", 220)}”
                    </blockquote>
                    <p className="mt-2 text-[11px] font-semibold text-slate-400">
                      Caracteres {segment.start_char}–{segment.end_char}
                    </p>
                    {codeNames.length ? (
                      <details className="group mt-2 min-w-0">
                        <summary className="hide-details-marker flex min-w-0 cursor-pointer list-none items-center gap-1.5 rounded-lg py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition hover:text-[#005944] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944]/30">
                          <Icon
                            name="sell"
                            className="shrink-0 text-sm text-slate-300 transition group-open:text-[#005944]"
                          />
                          <span className="shrink-0">Códigos</span>
                          <span className="font-semibold normal-case tracking-normal text-slate-400">
                            {codeNames.length}
                          </span>
                          <Icon
                            name="expand_more"
                            className="ml-auto shrink-0 text-base transition-transform group-open:rotate-180"
                          />
                        </summary>
                        <div
                          className="mt-2 flex flex-wrap gap-1.5 rounded-lg bg-slate-50 p-2"
                          aria-label={`Códigos del segmento: ${codeNames.join(", ")}`}
                        >
                          {codeNames.map((name) => (
                            <span
                              key={name}
                              className="inline-flex max-w-full items-center rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200"
                            >
                              <span className="truncate">{name}</span>
                            </span>
                          ))}
                        </div>
                      </details>
                    ) : (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <Icon name="sell" className="text-sm text-slate-300" />
                        <span>Sin codificar</span>
                      </div>
                    )}
                    {segment.note ? (
                      <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-600">
                        {segment.note}
                      </p>
                    ) : null}
                  </div>
                </div>

                {manager.editingSegmentId === segment.id ? (
                  <SegmentEditor segment={segment} manager={manager} />
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={getAnalysisCodesHref(projectId, {
                        view: "coding",
                        segmentId: segment.id,
                      })}
                      className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#005944] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#004232] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
                    >
                      Codificar
                      <Icon name="arrow_forward" className="text-base" />
                    </Link>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => manager.startEditingSegment(segment)}
                        aria-label="Editar segmento"
                        title="Editar segmento"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#005944] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2"
                      >
                        <Icon name="edit" className="text-base" />
                      </button>
                      <button
                        type="button"
                        onClick={() => manager.removeSegment(segment)}
                        disabled={manager.deletingId === segment.id}
                        aria-label="Eliminar segmento"
                        title="Eliminar segmento"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-400 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Icon name="delete" className="text-base" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center">
          <Icon name="segment" className="text-3xl text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-700">
            Sin segmentos todavía
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Selecciona un fragmento del documento para preparar la primera
            evidencia.
          </p>
        </div>
      )}
    </aside>
  );
}
