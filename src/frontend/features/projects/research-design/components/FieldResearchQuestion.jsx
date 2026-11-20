"use client";

import AnnotatedTextarea from "@/features/projects/delimitation/components/AnnotatedTextarea";
import { FieldHelpLabel } from "@/features/projects/workspace/field-help";

export default function FieldResearchQuestion({
  value,
  onChange,
  highlights = [],
}) {
  return (
    <div
      id="researchDesign-research_question"
      data-field-key="research_question"
      className="scroll-mt-28 space-y-3"
    >
      <div className="flex items-end justify-between gap-4">
        <FieldHelpLabel
          phase="researchDesign"
          field="research_question"
          tooltipPosition="right"
          required
          labelClassName="text-[#005944]"
        >
          1. Pregunta de investigación
        </FieldHelpLabel>

        <span className="text-[9px] font-bold text-slate-400">Requerido</span>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Formula una pregunta investigable que conecte fenómeno, población,
        contexto y, cuando aplique, período de tiempo.
      </p>

      <AnnotatedTextarea
        value={value}
        onChange={onChange}
        highlights={highlights}
        placeholder="Ej: ¿Cómo perciben los estudiantes universitarios el uso de inteligencia artificial generativa en sus procesos de aprendizaje?"
        minHeightClass="min-h-[110px]"
      />
    </div>
  );
}
