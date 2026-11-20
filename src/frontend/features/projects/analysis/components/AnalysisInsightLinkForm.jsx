"use client";

import Icon from "@/components/common/Icon";

export default function AnalysisInsightLinkForm({
  form,
  codes = [],
  memos = [],
  saving,
  onFieldChange,
  onCreate,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
        Nuevo vínculo
      </p>
      <div className="mt-3 grid gap-3">
        <select
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          value={form.link_type}
          onChange={(event) => onFieldChange("link_type", event.target.value)}
        >
          <option value="code">Código</option>
          <option value="memo">Memo</option>
          <option value="segment">Segmento</option>
        </select>

        {form.link_type === "code" ? (
          <select
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={form.code_id}
            onChange={(event) => onFieldChange("code_id", event.target.value)}
          >
            <option value="">Selecciona código</option>
            {codes.map((code) => (
              <option key={code.id} value={code.id}>
                {code.name}
              </option>
            ))}
          </select>
        ) : null}

        {form.link_type === "memo" ? (
          <select
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={form.memo_id}
            onChange={(event) => onFieldChange("memo_id", event.target.value)}
          >
            <option value="">Selecciona memo</option>
            {memos.map((memo) => (
              <option key={memo.id} value={memo.id}>
                {memo.title}
              </option>
            ))}
          </select>
        ) : null}

        {form.link_type === "segment" ? (
          <input
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={form.segment_id}
            onChange={(event) => onFieldChange("segment_id", event.target.value)}
            placeholder="ID del segmento"
          />
        ) : null}

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          onClick={onCreate}
          disabled={saving}
        >
          <Icon name="add_link" className="text-base" />
          Vincular
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Prioridad actual: código, memo y segmento. TODO: agregar selectores de
        documentos y participantes.
      </p>
    </div>
  );
}
