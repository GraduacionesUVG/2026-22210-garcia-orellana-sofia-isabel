import AnnotatedInput from "@/features/projects/delimitation/components/AnnotatedInput";
import { FieldHelpLabel } from "@/features/projects/workspace/field-help";
import FieldStateNote, {
  FieldStateIcon,
  FieldStatePill,
} from "@/features/projects/delimitation/components/FieldStateNote";

export default function FieldPopulation({
  value,
  onChange,
  highlights = [],
  fieldState = null,
}) {
  return (
    <div
      id="delimitation-population"
      data-field-key="population"
      className="scroll-mt-28 space-y-3"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <FieldHelpLabel
            phase="delimitation"
            field="population"
            tooltipPosition="right"
            required
            labelClassName="text-[#005944]"
          >
            3. Población de Estudio
          </FieldHelpLabel>

          <FieldStateIcon state={fieldState} />
        </div>

        <div className="flex items-center gap-2">
          <FieldStatePill state={fieldState} />
          <span className="text-[9px] font-bold text-slate-400">
            Requerido
          </span>
        </div>
      </div>

      <AnnotatedInput
        value={value}
        onChange={onChange}
        highlights={highlights}
        visualState={fieldState?.tone}
        placeholder="¿Quiénes son tus sujetos?"
      />

      <FieldStateNote state={fieldState} />
    </div>
  );
}