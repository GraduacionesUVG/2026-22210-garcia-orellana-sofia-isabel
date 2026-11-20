"use client";

import Icon from "@/components/common/Icon";

export default function AnalysisDocumentPicker({ manager, onSelectDocument }) {
  return (
    <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
            1 · Elegir archivo
          </p>
          <h2 className="mt-1 text-base font-black text-slate-950">
            Archivos del corpus
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
          {manager.documents.length}
        </span>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Buscar archivo</span>
        <span className="relative block">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
          />
          <input
            type="search"
            value={manager.search}
            onChange={(event) => manager.setSearch(event.target.value)}
            placeholder="Título, tipo o participante"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#005944] focus:bg-white focus:ring-2 focus:ring-[#005944]/10"
          />
        </span>
      </label>

      {manager.documentsError ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3" role="alert">
          <p className="text-sm leading-5 text-amber-950">
            {manager.documentsError}
          </p>
          <button
            type="button"
            onClick={manager.reloadDocuments}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-800 px-3 text-xs font-bold text-white"
          >
            <Icon name="refresh" className="text-base" />
            Reintentar
          </button>
        </div>
      ) : manager.loadingDocuments ? (
        <div className="flex min-h-40 items-center justify-center gap-2 text-sm font-semibold text-slate-500" role="status">
          <Icon name="sync" className="animate-spin text-xl text-[#005944]" />
          Cargando archivos…
        </div>
      ) : manager.filteredDocuments.length ? (
        <div className="mt-3 max-h-[38rem] space-y-2 overflow-y-auto pr-1">
          {manager.filteredDocuments.map((document) => {
            const active = document.id === manager.selectedDocumentId;
            return (
              <button
                key={document.id}
                type="button"
                onClick={() => onSelectDocument(document.id)}
                aria-pressed={active}
                className={`w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944] focus-visible:ring-offset-2 ${
                  active
                    ? "border-[#005944]/30 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-[#005944]/20 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      active
                        ? "bg-[#005944] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon name="description" className="text-lg" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-normal break-words text-sm font-bold leading-5 text-slate-900">
                      {document.title || "Documento sin título"}
                    </span>
                    <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#005944] ring-1 ring-slate-200">
                      {document.segment_count} {document.segment_count === 1 ? "segmento" : "segmentos"}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center">
          <Icon name={manager.documents.length ? "search_off" : "inventory_2"} className="text-3xl text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-700">
            {manager.documents.length
              ? "No hay archivos con esa búsqueda"
              : "Todavía no hay archivos"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {manager.documents.length
              ? "Prueba con otro título, tipo o participante."
              : "Sube o crea un documento en Corpus para comenzar."}
          </p>
        </div>
      )}
    </aside>
  );
}
