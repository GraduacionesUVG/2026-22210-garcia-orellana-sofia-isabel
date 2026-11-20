"use client";

import Icon from "@/components/common/Icon";

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

export default function AnalysisCodeFormModal({
  open,
  form,
  codes = [],
  editingCode,
  saving,
  onClose,
  onFieldChange,
  onSave,
}) {
  if (!open) return null;

  const title = editingCode ? "Editar código" : "Nuevo código";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <section className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
                Codebook
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {title}
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
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          <div className="grid gap-4">
            <Field label="Nombre">
              <input
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                value={form.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                maxLength={180}
              />
            </Field>

            <Field label="Descripción">
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  onFieldChange("description", event.target.value)
                }
              />
            </Field>

            <Field label="Definición">
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                rows={4}
                value={form.definition}
                onChange={(event) =>
                  onFieldChange("definition", event.target.value)
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Criterios de inclusión">
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                  rows={3}
                  value={form.inclusion_criteria}
                  onChange={(event) =>
                    onFieldChange("inclusion_criteria", event.target.value)
                  }
                />
              </Field>
              <Field label="Criterios de exclusión">
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
                  rows={3}
                  value={form.exclusion_criteria}
                  onChange={(event) =>
                    onFieldChange("exclusion_criteria", event.target.value)
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Código padre">
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944]"
                  value={form.parent_code_id}
                  onChange={(event) =>
                    onFieldChange("parent_code_id", event.target.value)
                  }
                >
                  <option value="">Sin padre</option>
                  {codes
                    .filter((code) => code.id !== editingCode?.id)
                    .map((code) => (
                      <option key={code.id} value={code.id}>
                        {code.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Color">
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944]"
                  type="color"
                  value={form.color}
                  onChange={(event) =>
                    onFieldChange("color", event.target.value)
                  }
                />
              </Field>
              <Field label="Posición">
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#005944]"
                  type="number"
                  min="0"
                  value={form.position}
                  onChange={(event) =>
                    onFieldChange("position", event.target.value)
                  }
                />
              </Field>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white p-5">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
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
