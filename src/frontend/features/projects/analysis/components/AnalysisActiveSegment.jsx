import Icon from "@/components/common/Icon";
import AnalysisSegmentCodeChips from "@/features/projects/analysis/components/AnalysisSegmentCodeChips";
import { getSegmentCodeNames } from "@/features/projects/analysis/helpers/analysis.helpers";

export default function AnalysisActiveSegment({ segment }) {
  if (!segment) {
    return (
      <section className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div>
          <Icon name="segment" className="text-3xl text-slate-400" />
          <h2 className="mt-3 text-lg font-black text-slate-900">
            Selecciona un segmento
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            El fragmento y su contexto aparecerán aquí para codificarlo.
          </p>
        </div>
      </section>
    );
  }

  const codeNames = getSegmentCodeNames(segment);
  const hasCodes = codeNames.length > 0;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      aria-labelledby="active-segment-title"
    >
      <header className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p
              id="active-segment-title"
              className="text-[10px] font-black uppercase tracking-widest text-[#005944]"
            >
              Segmento activo
            </p>
          </div>
          <span
            className={[
              "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
              segment.is_coded
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800",
            ].join(" ")}
          >
            {segment.is_coded ? "Codificado" : "Pendiente"}
          </span>
        </div>
      </header>

      <div className="p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#005944]">
          Fragmento seleccionado
        </p>
        <blockquote className="mt-3 rounded-xl bg-[#005944]/[0.04] px-4 py-4 text-base leading-7 text-slate-900 sm:text-lg sm:leading-8">
          “{segment.selected_text}”
        </blockquote>

        {segment.note ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Nota de segmentación
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {segment.note}
            </p>
          </div>
        ) : null}
      </div>

      <footer className="border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Icon name="description" className="shrink-0 text-base" />
            <span className="truncate">{segment.document_title || "Documento"}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Icon name="person" className="shrink-0 text-base" />
            <span className="truncate">
              {segment.participant_label || "Sin participante"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="pin" className="shrink-0 text-base" />
            Caracteres {segment.start_char ?? 0}–{segment.end_char ?? 0}
          </span>
        </div>

        {hasCodes ? (
          <details className="group mt-3">
            <summary className="hide-details-marker flex cursor-pointer list-none items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-[#005944] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005944]/30">
              <Icon name="sell" className="text-sm" />
              <span>Códigos aplicados</span>
              <span className="font-semibold normal-case tracking-normal">
                {codeNames.length}
              </span>
              <Icon
                name="expand_more"
                className="ml-auto text-base transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="mt-2">
              <AnalysisSegmentCodeChips segment={segment} compact />
            </div>
          </details>
        ) : null}
      </footer>
    </section>
  );
}
