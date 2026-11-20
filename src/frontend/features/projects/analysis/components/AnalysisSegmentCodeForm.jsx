"use client";

import Icon from "@/components/common/Icon";

function QuickCodeFields({ manager, onAssigned }) {
  async function handleCreateAndAssign() {
    const saved = await manager.createQuickCodeAndAssign();

    if (saved && typeof onAssigned === "function") {
      await onAssigned();
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
        Crear código rápido
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
        <input
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
          value={manager.quickCodeForm.name}
          onChange={(event) =>
            manager.setQuickCodeField("name", event.target.value)
          }
          placeholder="Nombre del código"
          disabled={manager.saving}
        />
        <input
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          type="color"
          value={manager.quickCodeForm.color}
          onChange={(event) =>
            manager.setQuickCodeField("color", event.target.value)
          }
          disabled={manager.saving}
          aria-label="Color del código"
        />
      </div>
      <textarea
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10"
        rows={2}
        value={manager.quickCodeForm.description}
        onChange={(event) =>
          manager.setQuickCodeField("description", event.target.value)
        }
        placeholder="Descripción breve"
        disabled={manager.saving}
      />
      <button
        type="button"
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleCreateAndAssign}
        disabled={manager.saving}
      >
        <Icon
          name={manager.saving ? "sync" : "add"}
          className={`text-base ${manager.saving ? "animate-spin" : ""}`}
        />
        Crear y asignar
      </button>
    </div>
  );
}

export default function AnalysisSegmentCodeForm({
  manager,
  workspaceMode = false,
  onAssigned,
}) {
  const isEditing = Boolean(manager.editingSegmentCode);
  const hasCodebook = Boolean(manager.codebook.length);
  const assignmentLocked = !isEditing && !hasCodebook;

  return (
    <div className="grid gap-4">
      {assignmentLocked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
              <Icon name="lock" className="text-lg" />
            </span>
            <div>
              <p className="text-sm font-black text-amber-950">
                Primero crea un código para poder codificar.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">
                Los campos de asignación están bloqueados hasta que exista al
                menos un código. Crea uno aquí y se asignará a este segmento.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {assignmentLocked ? (
        <QuickCodeFields manager={manager} onAssigned={onAssigned} />
      ) : null}

      {!isEditing ? (
        <label>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Código
          </span>
          <select
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            value={manager.form.code_id}
            onChange={(event) =>
              manager.setFormField("code_id", event.target.value)
            }
            disabled={assignmentLocked || manager.saving}
          >
            <option value="">
              {assignmentLocked
                ? "Crea un código arriba primero"
                : "Selecciona un código"}
            </option>
            {manager.codebook.map((code) => (
              <option key={code.id} value={code.id}>
                {code.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Nota analítica
        </span>
        <textarea
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          rows={4}
          value={manager.form.analytic_note}
          onChange={(event) =>
            manager.setFormField("analytic_note", event.target.value)
          }
          disabled={assignmentLocked || manager.saving}
          placeholder={
            assignmentLocked
              ? "Disponible después de crear un código"
              : "Nota opcional sobre por qué este código aplica"
          }
        />
      </label>

      <label
        className={[
          "flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 transition",
          assignmentLocked ? "bg-slate-100 text-slate-400" : "",
        ].join(" ")}
      >
        <input
          type="checkbox"
          checked={manager.form.is_quote}
          onChange={(event) =>
            manager.setFormField("is_quote", event.target.checked)
          }
          disabled={assignmentLocked || manager.saving}
        />
        <span className="text-sm font-bold text-slate-700">Cita textual</span>
      </label>

      <label>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Etiqueta de cita
        </span>
        <input
          className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#005944] focus:ring-2 focus:ring-[#005944]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          value={manager.form.quote_label}
          onChange={(event) =>
            manager.setFormField("quote_label", event.target.value)
          }
          placeholder={
            assignmentLocked
              ? "Disponible después de crear un código"
              : "Ej. cita clave, tensión, testimonio"
          }
          disabled={assignmentLocked || manager.saving}
        />
      </label>

      {!isEditing && !assignmentLocked && !workspaceMode ? (
        <QuickCodeFields manager={manager} onAssigned={onAssigned} />
      ) : null}

      {!isEditing && !assignmentLocked && workspaceMode ? (
        <details className="rounded-xl border border-slate-200 bg-slate-50">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-slate-600 hover:text-[#005944]">
            <span>¿No encuentras el código?</span>
            <span className="text-xs font-black text-[#005944]">
              Crear uno nuevo
            </span>
          </summary>
          <div className="border-t border-slate-200 p-3">
            <QuickCodeFields manager={manager} onAssigned={onAssigned} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
