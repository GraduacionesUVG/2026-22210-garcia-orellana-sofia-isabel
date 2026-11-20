import {
  getSegmentCodeNames,
  UNCODED_SEGMENT_LABEL,
} from "@/features/projects/analysis/helpers/analysis.helpers";

export default function AnalysisSegmentCodeChips({ segment = {}, compact = false }) {
  const codes = Array.isArray(segment.codes) ? segment.codes : [];
  const names = getSegmentCodeNames(segment);

  if (!names.length) {
    return (
      <span
        className={`inline-flex max-w-full items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-800 ${compact ? "" : "mb-1"}`}
      >
        {UNCODED_SEGMENT_LABEL}
      </span>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5" aria-label="Códigos del segmento">
      {names.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#005944]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#005944]"
          title={name}
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: codes[index]?.color || "#0f766e" }}
          />
          <span className="max-w-[14rem] truncate">{name}</span>
        </span>
      ))}
    </div>
  );
}
