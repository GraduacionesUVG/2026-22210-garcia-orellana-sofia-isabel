"use client";

import Icon from "@/components/common/Icon";
import AnalysisMemoLinkForm from "@/features/projects/analysis/components/AnalysisMemoLinkForm";
import { truncateAnalysisText } from "@/features/projects/analysis/helpers/analysis.helpers";

const LINK_TYPE_LABELS = {
  code: "Código",
  segment: "Segmento",
  document: "Documento",
  participant: "Participante",
};

function getLinkLabel(link, manager) {
  if (link?.link_type === "code") {
    return (
      manager.codes.find((code) => code.id === link.code_id)?.name ||
      "Código vinculado"
    );
  }

  if (link?.link_type === "document") {
    return (
      manager.linkCatalog.documents.find(
        (document) => document.id === link.document_id
      )?.title || "Documento vinculado"
    );
  }

  if (link?.link_type === "participant") {
    const participant = manager.linkCatalog.participants.find(
      (item) => item.id === link.participant_id
    );
    return participant?.alias || participant?.display_name || "Participante vinculado";
  }

  if (link?.link_type === "segment") {
    const segment = manager.linkCatalog.segments.find(
      (item) => item.id === link.segment_id
    );
    const excerpt = segment?.selected_text || segment?.text || segment?.content;
    return excerpt
      ? truncateAnalysisText(excerpt, 160)
      : "Segmento vinculado";
  }

  return "Recurso vinculado";
}

export default function AnalysisMemoLinksPanel({ manager }) {
  if (!manager.linksMemo) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <section className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
              Vínculos del memo
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              {manager.linksMemo.title}
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
            onClick={manager.closeLinksPanel}
            aria-label="Cerrar"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-white p-5">
          <div className="grid gap-4">
            {manager.errorMsg ? <div><p role="alert" className="text-sm text-amber-900">{manager.errorMsg}</p><button type="button" className="mt-2 text-xs font-bold text-[#005944] underline" onClick={() => manager.openLinksPanel(manager.linksMemo)} disabled={manager.linksLoading || manager.saving}>Reintentar vínculos</button></div> : null}
            {manager.successMsg ? <p role="status" className="text-sm text-[#005944]">{manager.successMsg}</p> : null}
            {manager.canLink ? (
            <AnalysisMemoLinkForm
              form={manager.linkForm}
              codes={manager.codes}
              saving={manager.saving || manager.linksLoading}
              onFieldChange={manager.setLinkField}
              onCreate={manager.createLink}
              resourcePage={manager.linkResourcePage}
              resourceQuery={manager.linkResourceQuery}
              searchDraft={manager.linkSearchDraft}
              onSearchDraftChange={manager.setLinkSearchDraft}
              onSearch={manager.searchLinkResources}
              onPageChange={manager.changeLinkResourcePage}
              onRetry={manager.retryLinkResources}
            />
            ) : null}

            <div className="space-y-2">
              {manager.linksLoading ? (
                <Icon name="sync" className="animate-spin text-xl text-[#005944]" />
              ) : null}

              {!manager.linksLoading && !manager.linksLoadFailed && !manager.links.length ? (
                <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                  Este memo todavía no tiene vínculos.
                </p>
              ) : null}

              {manager.links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {LINK_TYPE_LABELS[link.link_type] ?? "Recurso"}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {getLinkLabel(link, manager)}
                    </p>
                  </div>
                  {manager.canLink ? <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600"
                    onClick={() => manager.removeLink(link)}
                    aria-label="Eliminar vínculo"
                    disabled={manager.saving || manager.linksLoading}
                  >
                    <Icon name="delete" className="text-base" />
                  </button> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
