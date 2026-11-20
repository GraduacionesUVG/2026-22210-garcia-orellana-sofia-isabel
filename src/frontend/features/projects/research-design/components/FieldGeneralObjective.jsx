"use client";

import AnnotatedTextarea from "@/features/projects/delimitation/components/AnnotatedTextarea";
import { FieldHelpLabel } from "@/features/projects/workspace/field-help";

export default function FieldGeneralObjective({
  value,
  onChange,
  highlights = [],
}) {
  return (
    <div
      id="researchDesign-general_objective"
      data-field-key="general_objective"
      className="scroll-mt-28 space-y-3"
    >
      <div className="flex items-end justify-between gap-4">
        <FieldHelpLabel
          phase="researchDesign"
          field="general_objective"
          tooltipPosition="right"
          required
          labelClassName="text-[#005944]"
        >
          2. Objetivo general
        </FieldHelpLabel>

        <span className="text-[9px] font-bold text-slate-400">Requerido</span>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Debe iniciar con un verbo en infinitivo investigable y responder
        directamente a la pregunta de investigación.
      </p>

      <AnnotatedTextarea
        value={value}
        onChange={onChange}
        highlights={highlights}
        placeholder="Ej: Analizar las percepciones de estudiantes universitarios sobre el uso de inteligencia artificial generativa en sus procesos de aprendizaje."
        minHeightClass="min-h-[110px]"
      />
    </div>
  );
}
