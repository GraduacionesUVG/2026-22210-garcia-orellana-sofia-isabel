"use client";

import Icon from "@/components/common/Icon";
import {
  INSIGHT_CONFIDENCE_LEVELS,
  INSIGHT_STATUSES,
  INSIGHT_TYPES,
} from "@/features/projects/analysis/helpers/analysis.helpers";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function AnalysisInsightFormModal({
  open,
  form,
  editingInsight,
  saving,
  onClose,
  onFieldChange,
  onSave,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <section className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
              Hallazgos
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              {editingInsight ? "Editar hallazgo" : "Nuevo hallazgo"}
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600">
            Un hallazgo debe estar conectado a evidencia, no solo a una
            intuición.
          </div>
          <div className="grid gap-4">
            <Field label="Título">
              <input
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944]"
                value={form.title}
                onChange={(event) => onFieldChange("title", event.target.value)}
              />
            </Field>
            <Field label="Resumen">
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed outline-none focus:border-[#005944]"
                rows={4}
                value={form.summary}
                onChange={(event) =>
                  onFieldChange("summary", event.target.value)
                }
              />
            </Field>
            <Field label="Interpretación">
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed outline-none focus:border-[#005944]"
                rows={8}
                value={form.interpretation}
                onChange={(event) =>
                  onFieldChange("interpretation", event.target.value)
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Tipo">
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={form.insight_type}
                  onChange={(event) =>
                    onFieldChange("insight_type", event.target.value)
                  }
                >
                  {INSIGHT_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Confianza">
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={form.confidence}
                  onChange={(event) =>
                    onFieldChange("confidence", event.target.value)
                  }
                >
                  {INSIGHT_CONFIDENCE_LEVELS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estado">
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={form.status}
                  onChange={(event) =>
                    onFieldChange("status", event.target.value)
                  }
                >
                  {INSIGHT_STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tags">
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={form.tags}
                  onChange={(event) => onFieldChange("tags", event.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 p-5">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
            onClick={onSave}
            disabled={saving}
          >
            <Icon
              name={saving ? "sync" : "save"}
              className={`text-base ${saving ? "animate-spin" : ""}`}
            />
            Guardar
          </button>
        </footer>
      </section>
    </div>
  );
}
