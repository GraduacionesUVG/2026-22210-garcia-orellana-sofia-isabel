"use client";

import Icon from "@/components/common/Icon";
import AnnotatedTextarea from "@/features/projects/delimitation/components/AnnotatedTextarea";
import { FieldHelpLabel } from "@/features/projects/workspace/field-help";

export default function FieldSpecificObjectives({
  items = [],
  onAddItem,
  onDeleteItem,
  onChangeItem,
  highlights = {},
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div
      id="researchDesign-specific_objective"
      data-field-key="specific_objective"
      className="scroll-mt-28 space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <FieldHelpLabel
            phase="researchDesign"
            field="specific_objective"
            tooltipPosition="right"
            required
            labelClassName="text-[#005944]"
          >
            3. Objetivos específicos
          </FieldHelpLabel>

          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Cada objetivo debe iniciar con un verbo en infinitivo y expresar una
            sola acción investigativa.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-[#005944] transition-colors hover:bg-slate-50"
        >
          <Icon name="add" className="text-base" />
          Agregar objetivo
        </button>
      </div>

      {safeItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          Aún no has agregado objetivos específicos.
        </div>
      ) : (
        <div className="space-y-4">
          {safeItems.map((item, index) => (
            <div
              key={item.id}
              id={`specific-objective-${item.id}`}
              data-field-key="specific_objective"
              data-objective-id={item.id}
              className="scroll-mt-28 rounded-2xl border border-slate-200 bg-[#FCFCFA] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#005944]/10 px-2 text-[10px] font-black text-[#005944]">
                    {index + 1}
                  </span>

                  <FieldHelpLabel
                    phase="researchDesign"
                    field="specific_objective"
                    tooltipPosition="right"
                    labelClassName="text-[#005944]"
                  >
                    Objetivo específico {index + 1}
                  </FieldHelpLabel>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 transition-colors hover:text-red-600"
                >
                  <Icon name="delete" className="text-base" />
                  Eliminar
                </button>
              </div>

              <AnnotatedTextarea
                value={item.text}
                onChange={(value) => onChangeItem(item.id, value)}
                highlights={highlights?.specific_objectives_by_id?.[item.id] ?? []}
                placeholder="Ej: Identificar los usos académicos más frecuentes de la inteligencia artificial generativa entre estudiantes universitarios."
                minHeightClass="min-h-[96px]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
