"use client";

import { createPortal } from "react-dom";
import Icon from "@/components/common/Icon";
import AnalysisSegmentCodeCard from "@/features/projects/analysis/components/AnalysisSegmentCodeCard";
import AnalysisSegmentCodeForm from "@/features/projects/analysis/components/AnalysisSegmentCodeForm";
import { useAnalysisSegmentCodes } from "@/features/projects/analysis/hooks/useAnalysisSegmentCodes";
import {
  MEMO_STATUSES,
  MEMO_TYPES,
  getAnalysisCodesHref,
} from "@/features/projects/analysis/helpers/analysis.helpers";

function CodingModal({ manager, onSaved }) {
  const saveDisabled =
    manager.saving ||
    (!manager.editingSegmentCode && !manager.codebook.length);

  if (!manager.modalOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <section className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
              Codificación
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              {manager.editingSegmentCode
                ? "Editar codificación"
                : "Asignar código"}
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:text-slate-900"
            onClick={manager.closeModal}
            aria-label="Cerrar"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          <AnalysisSegmentCodeForm manager={manager} />
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 p-5">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
            onClick={manager.closeModal}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={async () => {
              const saved = await manager.saveSegmentCode();
              if (saved && typeof onSaved === "function") await onSaved();
            }}
            disabled={saveDisabled}
          >
            <Icon
              name={manager.saving ? "sync" : "save"}
              className={`text-base ${manager.saving ? "animate-spin" : ""}`}
            />
            Guardar
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}

function WorkspaceCodingPanel({
  manager,
  segment,
  onSaved,
  onSaveAndContinue,
}) {
  const hasCodebook = Boolean(manager.codebook.length);
  const saveDisabled =
    manager.saving || manager.loading || !hasCodebook || !manager.form.code_id;

  async function handleSave(continueAfter = false) {
    const saved = await manager.saveSegmentCode();
    if (!saved) return;

    if (continueAfter && typeof onSaveAndContinue === "function") {
      await onSaveAndContinue();
      return;
    }

    if (typeof onSaved === "function") await onSaved();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-labelledby="coding-panel-title">
      <header className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
              Codificación
            </p>
            <h2 id="coding-panel-title" className="mt-1 text-lg font-black text-slate-950">
              Aplica categorías a esta evidencia
            </h2>
          </div>
          <button
            type="button"
            onClick={() => manager.openMemoModal(segment)}
            disabled={manager.saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:text-[#005944] disabled:opacity-50"
          >
            <Icon name="edit_note" className="text-base" />
            Escribir memo
          </button>
        </div>
      </header>

      <div className="space-y-5 p-4 sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Códigos aplicados
            </p>
            <span className="text-xs font-bold text-slate-500">
              {manager.segmentCodes.length}
            </span>
          </div>

          {manager.loading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500" role="status">
              <Icon name="sync" className="animate-spin text-lg" />
              Cargando códigos…
            </div>
          ) : manager.segmentCodes.length ? (
            <div className="mt-3 space-y-2">
              {manager.segmentCodes.map((item) => (
                <AnalysisSegmentCodeCard
                  key={item.id}
                  segmentCode={item}
                  code={manager.codesById.get(item.code_id)}
                  deleting={manager.deletingId === item.id}
                  onEdit={manager.openEditModal}
                  onDelete={async (item) => {
                    const removed = await manager.removeSegmentCode(item);
                    if (removed && typeof onSaved === "function") await onSaved();
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
              Este segmento todavía no tiene códigos. Selecciona uno abajo para
              comenzar.
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-5">
          <AnalysisSegmentCodeForm
            manager={manager}
            workspaceMode
            onAssigned={onSaved}
          />
        </div>

        {manager.errorMsg ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
            {manager.errorMsg}
          </p>
        ) : null}
        {manager.successMsg ? (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900" role="status" aria-live="polite">
            {manager.successMsg}
          </p>
        ) : null}

        {hasCodebook ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saveDisabled}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#005944]/25 bg-white px-4 text-sm font-bold text-[#005944] transition hover:bg-[#005944]/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name={manager.saving ? "sync" : "save"} className={manager.saving ? "animate-spin text-base" : "text-base"} />
              Guardar
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saveDisabled}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Guardar y continuar
              <Icon name="arrow_forward" className="text-base" />
            </button>
          </div>
        ) : null}
      </div>

      <CodingModal manager={manager} onSaved={onSaved} />
      <MemoModal manager={manager} />
    </section>
  );
}

function MemoModal({ manager }) {
  if (!manager.memoModalOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <section className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
              Memo interpretativo
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Escribir interpretacion del segmento
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
              Registra que significa este fragmento, que tension revela o que
              pregunta abre para el análisis.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:text-slate-900"
            onClick={manager.closeMemoModal}
            aria-label="Cerrar memo"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Segmento
              </p>
              <blockquote className="mt-2 max-h-28 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                {manager.memoSegment?.selected_text ?? ""}
              </blockquote>
            </div>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Titulo del memo
              </span>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                value={manager.memoForm.title}
                onChange={(event) =>
                  manager.setMemoField("title", event.target.value)
                }
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Interpretacion del investigador
              </span>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                rows={10}
                value={manager.memoForm.body}
                onChange={(event) =>
                  manager.setMemoField("body", event.target.value)
                }
                placeholder="Escribe aquí tu lectura del segmento, posibles patrones, dudas o relaciones con otros casos."
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tipo
                </span>
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={manager.memoForm.memo_type}
                  onChange={(event) =>
                    manager.setMemoField("memo_type", event.target.value)
                  }
                >
                  {MEMO_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Estado
                </span>
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={manager.memoForm.status}
                  onChange={(event) =>
                    manager.setMemoField("status", event.target.value)
                  }
                >
                  {MEMO_STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tags
                </span>
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={manager.memoForm.tags}
                  onChange={(event) =>
                    manager.setMemoField("tags", event.target.value)
                  }
                  placeholder="segmento, interpretacion"
                />
              </label>
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 p-5">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
            onClick={manager.closeMemoModal}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={manager.saveMemoFromSegment}
            disabled={manager.saving}
          >
            <Icon
              name={manager.saving ? "sync" : "save"}
              className={`text-base ${manager.saving ? "animate-spin" : ""}`}
            />
            Guardar memo
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}

export default function AnalysisSegmentCodingPanel({
  projectId,
  segment,
  disabled = false,
  className = "",
  workspaceMode = false,
  onSaved,
  onSaveAndContinue,
}) {
  const manager = useAnalysisSegmentCodes({
    projectId,
    segmentId: segment.id,
    enabled: !disabled,
  });
  const hasCodebook = Boolean(manager.codebook.length);
  const assignedCodeCount = manager.segmentCodes.length;

  if (workspaceMode) {
    return (
      <WorkspaceCodingPanel
        manager={manager}
        segment={segment}
        onSaved={onSaved}
        onSaveAndContinue={onSaveAndContinue}
      />
    );
  }

  return (
    <div
      className={[
        "min-h-[186px] rounded-xl border border-slate-200 bg-white p-3",
        className || "mt-4",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Códigos
            </p>
            {assignedCodeCount ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                {assignedCodeCount}
              </span>
            ) : null}
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:text-[#005944] disabled:opacity-60"
              onClick={manager.openAssignModal}
              disabled={disabled || manager.loading}
            >
              <Icon name="add" className="text-base" />
              {manager.loading || hasCodebook
                ? "Asignar código"
                : "Crear código"}
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:text-[#005944] disabled:opacity-60"
              onClick={() => manager.openMemoModal(segment)}
              disabled={disabled || manager.saving}
              title="Crear un memo analitico vinculado a este segmento"
            >
              <Icon name="edit_note" className="text-base" />
              Interpretar
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {manager.loading ? (
              <>
                <span className="h-6 w-36 animate-pulse rounded-full bg-slate-100" />
                <span className="h-6 w-44 animate-pulse rounded-full bg-slate-100" />
              </>
            ) : manager.segmentCodes.length ? (
              manager.segmentCodes.map((item) => {
                const code = manager.codesById.get(item.code_id);
                return (
                  <span
                    key={item.id}
                    className="inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full bg-[#005944]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: code?.color || "#0f766e" }}
                    />
              <span className="truncate">{code?.name ?? "Código"}</span>
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-slate-500">Sin códigos</span>
            )}
            {manager.segmentCodes.some((item) => item.is_quote) ? (
              <span className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                Cita textual
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {!hasCodebook && !manager.loading ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm leading-relaxed text-amber-950">
            Todavía no hay códigos en el libro de códigos. Puedes crear uno rápido
            desde aquí o abrir el libro completo para organizar la estructura.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[#005944] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#004232] disabled:opacity-60"
              onClick={manager.openAssignModal}
              disabled={disabled}
            >
              <Icon name="add" className="text-base" />
              Crear código rápido
            </button>
            <a
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-[#005944]"
              href={getAnalysisCodesHref(projectId)}
            >
              Abrir libro de códigos
              <Icon name="arrow_forward" className="text-sm" />
            </a>
          </div>
        </div>
      ) : null}

      {manager.errorMsg ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          {manager.errorMsg}
        </p>
      ) : null}
      {manager.successMsg ? (
        <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-slate-700">
          {manager.successMsg}
        </p>
      ) : null}

      {manager.segmentCodes.length ? (
        <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-bold text-slate-600 transition hover:text-[#005944]">
            <span>Ver notas de codificación</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {assignedCodeCount}
              <Icon name="expand_more" className="text-base" />
            </span>
          </summary>
          <div className="space-y-2 border-t border-slate-200 p-2">
          {manager.segmentCodes.map((item) => (
            <AnalysisSegmentCodeCard
              key={item.id}
              segmentCode={item}
              code={manager.codesById.get(item.code_id)}
              deleting={manager.deletingId === item.id}
              onEdit={manager.openEditModal}
              onDelete={manager.removeSegmentCode}
            />
          ))}
          </div>
        </details>
      ) : null}

      <CodingModal manager={manager} onSaved={onSaved} />
      <MemoModal manager={manager} />
    </div>
  );
}
