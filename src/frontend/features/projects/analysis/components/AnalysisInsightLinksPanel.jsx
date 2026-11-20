"use client";

import Icon from "@/components/common/Icon";
import AnalysisInsightLinkForm from "@/features/projects/analysis/components/AnalysisInsightLinkForm";
import { summarizeInsightLinks } from "@/features/projects/analysis/helpers/analysis.helpers";

const LINK_TYPE_LABELS = { code: "Código", memo: "Memo", segment: "Segmento", document: "Documento", participant: "Participante" };

export default function AnalysisInsightLinksPanel({ manager }) {
  if (!manager.linksInsight) return null;

  const evidenceSummary = summarizeInsightLinks(
    manager.links,
    manager.codes,
    manager.memos
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <section className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#005944]">
              Evidencia del hallazgo
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              {manager.linksInsight.title}
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
            <AnalysisInsightLinkForm
              form={manager.linkForm}
              codes={manager.codes}
              memos={manager.memos}
              saving={manager.saving}
              onFieldChange={manager.setLinkField}
              onCreate={manager.createLink}
            />

            {!manager.linksLoading && !manager.links.length ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                Este hallazgo todavía no tiene evidencia vinculada.
              </p>
            ) : null}

            {evidenceSummary.items.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {LINK_TYPE_LABELS[link.link_type] ?? "Recurso"}
                  </p>
                  <p className="mt-1 break-words text-sm font-bold text-slate-700">
                    {link.label}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600"
                  onClick={() => manager.removeLink(link)}
                  aria-label="Eliminar vínculo"
                >
                  <Icon name="delete" className="text-base" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
