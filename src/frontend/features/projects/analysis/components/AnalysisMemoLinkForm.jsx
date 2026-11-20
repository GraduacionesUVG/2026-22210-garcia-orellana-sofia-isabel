"use client";

import Icon from "@/components/common/Icon";

export default function AnalysisMemoLinkForm({
  form,
  codes = [],
  saving,
  onFieldChange,
  onCreate,
  resourcePage,
  resourceQuery,
  searchDraft,
  onSearchDraftChange,
  onSearch,
  onPageChange,
  onRetry,
}) {
  const isCatalog = form.link_type === "document" || form.link_type === "participant";
  const resourceLabel = form.link_type === "document" ? "Documento" : "Participante";
  return (
    <form className="rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={event => { event.preventDefault(); onCreate(); }}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
        Nuevo vínculo
      </p>
      <div className="mt-3 grid gap-3">
        <div className="grid gap-1 text-xs font-bold text-slate-600">
          <label htmlFor="memo-link-type">Tipo de vínculo</label>
          <select
          id="memo-link-type"
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          value={form.link_type}
          onChange={(event) => onFieldChange("link_type", event.target.value)}
          disabled={saving}
        >
          <option value="code">Código</option>
          <option value="segment">Segmento</option>
          <option value="document">Documento</option>
          <option value="participant">Participante</option>
        </select>
        </div>

        {form.link_type === "code" ? (
          <div className="grid gap-1 text-xs font-bold text-slate-600"><label htmlFor="memo-link-code">Código</label>
          <select
            id="memo-link-code"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={form.code_id}
            onChange={(event) => onFieldChange("code_id", event.target.value)}
            disabled={saving}
          >
            <option value="">Selecciona código</option>
            {codes.map((code) => (
              <option key={code.id} value={code.id}>
                {code.name}
              </option>
            ))}
          </select>
          </div>
        ) : isCatalog ? (
          <>
            <div className="flex items-end gap-2">
              <label className="grid min-w-0 flex-1 gap-1 text-xs font-bold text-slate-600">
                Buscar recurso
                <input className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={searchDraft} maxLength={120}
                  onChange={event => onSearchDraftChange(event.target.value)} disabled={saving}
                  onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); onSearch(); } }} />
              </label>
              <button type="button" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700" disabled={saving} onClick={onSearch}>Buscar</button>
            </div>
            <div className="grid gap-1 text-xs font-bold text-slate-600"><label htmlFor="memo-link-resource">{resourceLabel}</label>
              <select className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                id="memo-link-resource"
                value={form[`${form.link_type}_id`]} onChange={event => onFieldChange(`${form.link_type}_id`, event.target.value)}
                disabled={saving || resourcePage.loading || Boolean(resourcePage.error)}>
                <option value="">Selecciona {resourceLabel.toLowerCase()}</option>
                {resourcePage.items.map(item => <option key={item.id} value={item.id}>{form.link_type === "document" ? item.title || "Documento sin título" : item.alias || item.display_name || "Participante sin alias"}</option>)}
              </select>
            </div>
            {resourcePage.loading ? <p role="status" className="text-xs text-slate-500">Cargando catálogo…</p> : null}
            {resourcePage.error ? <div><p role="alert" className="text-sm text-amber-900">{resourcePage.error}</p><button type="button" className="mt-2 text-xs font-bold text-[#005944] underline" onClick={onRetry}>Reintentar catálogo</button></div> : null}
            {!resourcePage.loading && !resourcePage.error && !resourcePage.items.length ? <p className="text-xs text-slate-500">No hay resultados. Prueba otra búsqueda.</p> : null}
            <div className="flex items-center justify-between text-xs text-slate-600">
              <button type="button" onClick={() => onPageChange(-1)} disabled={saving || resourcePage.loading || resourceQuery.offset === 0} className="px-2 py-2 font-bold disabled:opacity-40">Anterior</button>
              <span>Página {Math.floor(resourceQuery.offset / 50) + 1}</span>
              <button type="button" onClick={() => onPageChange(1)} disabled={saving || resourcePage.loading || !resourcePage.hasMore} className="px-2 py-2 font-bold disabled:opacity-40">Siguiente</button>
            </div>
          </>
        ) : (
          <label className="grid gap-1 text-xs font-bold text-slate-600">Segmento
          <input
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            value={form.segment_id}
            onChange={(event) => onFieldChange("segment_id", event.target.value)}
            placeholder="ID del segmento"
            disabled={saving}
          />
          </label>
        )}

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          disabled={saving || (isCatalog && (resourcePage.loading || Boolean(resourcePage.error)))}
        >
          <Icon name="add_link" className="text-base" />
          Vincular
        </button>
      </div>
    </form>
  );
}
