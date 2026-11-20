import AnnotatedInput from "@/features/projects/delimitation/components/AnnotatedInput";
import { FieldHelpLabel } from "@/features/projects/workspace/field-help";
import FieldStateNote, {
  FieldStateIcon,
  FieldStatePill,
} from "@/features/projects/delimitation/components/FieldStateNote";

export default function FieldContext({
  contextPlace,
  timePeriod,
  contextPlaceHighlights = [],
  timePeriodHighlights = [],
  contextPlaceState = null,
  timePeriodState = null,
  onChangeContextPlace,
  onChangeTimePeriod,
}) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-black text-[#005944] uppercase tracking-wider">
        2. Contexto Espacial y Temporal
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          id="delimitation-context_place"
          data-field-key="context_place"
          className="scroll-mt-28 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FieldHelpLabel
                phase="delimitation"
                field="context_place"
                tooltipPosition="right"
                required
                labelClassName="text-[10px] text-slate-400"
              >
                ¿Dónde? (Ubicación)
              </FieldHelpLabel>

              <FieldStateIcon state={contextPlaceState} />
            </div>

            <FieldStatePill state={contextPlaceState} />
          </div>

          <AnnotatedInput
            value={contextPlace}
            onChange={onChangeContextPlace}
            highlights={contextPlaceHighlights}
            visualState={contextPlaceState?.tone}
            placeholder="Ej: Sololá, Lago de Atitlán..."
          />

          <FieldStateNote state={contextPlaceState} />
        </div>

        <div
          id="delimitation-time_period"
          data-field-key="time_period"
          className="scroll-mt-28 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FieldHelpLabel
                phase="delimitation"
                field="time_period"
                tooltipPosition="right"
                required
                labelClassName="text-[10px] text-slate-400"
              >
                ¿Cuándo? (Periodo)
              </FieldHelpLabel>

              <FieldStateIcon state={timePeriodState} />
            </div>

            <FieldStatePill state={timePeriodState} />
          </div>

          <AnnotatedInput
            value={timePeriod}
            onChange={onChangeTimePeriod}
            highlights={timePeriodHighlights}
            visualState={timePeriodState?.tone}
            placeholder="Ej: 2010 - 2023"
          />

          <FieldStateNote state={timePeriodState} />
        </div>
      </div>
    </div>
  );
}