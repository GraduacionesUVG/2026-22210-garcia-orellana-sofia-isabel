import AnnotatedTextarea from "@/features/projects/delimitation/components/AnnotatedTextarea";
import { FieldHelpLabel } from "@/features/projects/workspace/field-help";
import FieldStateNote, {
  FieldStateIcon,
  FieldStatePill,
} from "@/features/projects/delimitation/components/FieldStateNote";

export default function FieldTopic({
  value,
  onChange,
  highlights = [],
  fieldState = null,
}) {
  return (
    <div
      id="delimitation-topic"
      data-field-key="topic"
      className="scroll-mt-28 space-y-3"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <FieldHelpLabel
            phase="delimitation"
            field="topic"
            tooltipPosition="right"
            required
            labelClassName="text-[#005944]"
          >
            1. Tema de Investigación
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

      <AnnotatedTextarea
        value={value}
        onChange={onChange}
        highlights={highlights}
        visualState={fieldState?.tone}
        placeholder="Describe tu tema central..."
        minHeightClass="min-h-[100px]"
      />

      <FieldStateNote state={fieldState} />
    </div>
  );
}