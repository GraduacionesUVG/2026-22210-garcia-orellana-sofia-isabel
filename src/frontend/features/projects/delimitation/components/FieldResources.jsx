import AnnotatedTextarea from "@/features/projects/delimitation/components/AnnotatedTextarea";
import { FieldHelpLabel } from "@/features/projects/workspace/field-help";
import FieldStateNote, {
  FieldStateIcon,
  FieldStatePill,
} from "@/features/projects/delimitation/components/FieldStateNote";

export default function FieldResources({
  value,
  onChange,
  highlights = [],
  fieldState = null,
}) {
  return (
    <div
      id="delimitation-resources"
      data-field-key="resources"
      className="scroll-mt-28 space-y-3"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FieldHelpLabel
            phase="delimitation"
            field="resources"
            tooltipPosition="right"
            required
            labelClassName="text-[#005944]"
          >
            4. Recursos
          </FieldHelpLabel>

          <FieldStateIcon state={fieldState} />
        </div>

        <div className="flex items-center gap-2">
          <FieldStatePill state={fieldState} />
          <span className="text-[9px] font-bold text-slate-400">Requerido</span>
        </div>
      </div>

      <AnnotatedTextarea
        value={value}
        onChange={onChange}
        highlights={highlights}
        visualState={fieldState?.tone}
        placeholder="Materiales, acceso a datos, herramientas..."
        minHeightClass="min-h-[80px]"
      />

      <FieldStateNote state={fieldState} />
    </div>
  );
}
