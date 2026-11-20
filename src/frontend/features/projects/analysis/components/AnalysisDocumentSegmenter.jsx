"use client";

import { useEffect, useMemo, useRef } from "react";
import { getReadonlySelectionRange } from "@/features/projects/analysis/helpers/analysis.helpers";
import Icon from "@/components/common/Icon";
import AnalysisDocumentSegmentsList from "@/features/projects/analysis/components/AnalysisDocumentSegmentsList";
import { useAnalysisDocumentSegmentCodes } from "@/features/projects/analysis/hooks/useAnalysisDocumentSegmentCodes";
import { useCorpusDocumentSegments } from "@/features/projects/corpus/hooks/useCorpusDocumentSegments";
import { getDocumentTypeLabel } from "@/features/projects/corpus/helpers/corpus.helpers";

export default function AnalysisDocumentSegmenter({
  projectId,
  document,
  onPendingSelectionChange,
  onSegmentCountChange,
}) {
  const textareaRef = useRef(null);
  const graphemeBoundaries = useMemo(() => [0, ...Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(document.content ?? ""),
    item => item.index + item.segment.length
  )], [document.content]);
  const manager = useCorpusDocumentSegments({
    projectId,
    documentId: document.id,
    documentRevision: document.revision,
    documentContent: document.content,
  });
  const codeSummary = useAnalysisDocumentSegmentCodes(projectId, document.id);

  useEffect(() => {
    onPendingSelectionChange(manager.hasSelection);
  }, [manager.hasSelection, onPendingSelectionChange]);

  useEffect(() => {
    onSegmentCountChange(manager.segments.length);
  }, [manager.segments.length, onSegmentCountChange]);

  async function handleCreateSegment() {
    const created = await manager.createSegmentFromSelection({
      note: manager.selection.note,
    });

    if (created && textareaRef.current) {
      textareaRef.current.setSelectionRange(0, 0);
      textareaRef.current.focus();
    }
  }

  function handleResetSelection() {
    manager.resetSelection();
    textareaRef.current?.setSelectionRange(0, 0);
  }

  function captureSelection() {
    manager.updateSelectionFromTextarea(textareaRef.current);
  }

  function handleSelectionKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const source = event.currentTarget;
    const range = getReadonlySelectionRange({ text: source.value, start: source.selectionStart,
      end: source.selectionEnd, direction: source.selectionDirection, key: event.key,
      shiftKey: event.shiftKey, boundaries: graphemeBoundaries });
    if (!range) return;
                                                                             
                                                                                
    event.preventDefault();
    source.setSelectionRange(range.start, range.end, range.direction);
    captureSelection();
  }

  return (
    <>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
              2 · Seleccionar evidencia
            </p>
            <h2 className="mt-1 truncate text-lg font-black text-slate-950">
              {document.title || "Documento sin título"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {getDocumentTypeLabel(document.document_type)} · Revisión {document.revision}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#005944]">
            <Icon name="touch_app" className="text-base" />
            Texto seleccionable
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p id="segment-selection-help" className="mb-3 flex items-start gap-2 text-xs leading-5 text-slate-600">
            <Icon name="info" className="mt-0.5 shrink-0 text-base text-[#005944]" />
            Selecciona con el mouse o con Shift + flechas izquierda/derecha. El texto se copia al formulario sin modificar el documento.
          </p>
          <textarea
            ref={textareaRef}
            readOnly
            value={document.content ?? ""}
            aria-describedby="segment-selection-help"
            aria-label="Texto del documento para seleccionar evidencia"
            onKeyDown={handleSelectionKey}
            onSelect={captureSelection}
            onMouseUp={captureSelection}
            onKeyUp={captureSelection}
            spellCheck={false}
            className="min-h-[28rem] w-full resize-y rounded-lg border border-slate-200 bg-white p-4 font-serif text-[15px] leading-7 text-slate-800 outline-none selection:bg-amber-200 focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
          />
        </div>

        <div className={`mt-4 rounded-xl border p-4 ${manager.hasSelection ? "border-[#005944]/25 bg-emerald-50/60" : "border-dashed border-slate-200 bg-slate-50"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
                Fragmento seleccionado
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {manager.hasSelection
                  ? `Caracteres ${manager.selection.start_char}–${manager.selection.end_char}`
                  : "Selecciona texto arriba para crear un segmento."}
              </p>
            </div>
            {manager.hasSelection ? (
              <button
                type="button"
                onClick={handleResetSelection}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-800"
              >
                <Icon name="close" className="text-base" />
                Limpiar
              </button>
            ) : null}
          </div>

          {manager.hasSelection ? (
            <blockquote className="mt-3 max-h-32 overflow-y-auto rounded-lg bg-white p-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
              “{manager.selection.selected_text}”
            </blockquote>
          ) : null}

          <div className="mt-4">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Nota opcional
              </span>
              <input
                value={manager.selection.note}
                onChange={(event) => manager.setSelectionField("note", event.target.value)}
                placeholder="Por qué este fragmento importa"
                disabled={!manager.hasSelection}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10 disabled:bg-slate-100"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleCreateSegment}
            disabled={!manager.canCreateSegment}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Icon name="add" className="text-lg" />
            {manager.creating ? "Creando segmento…" : "Crear segmento"}
          </button>
        </div>
      </section>

      <AnalysisDocumentSegmentsList
        projectId={projectId}
        manager={manager}
        codesBySegmentId={codeSummary.codesBySegmentId}
      />
    </>
  );
}
