"use client";

import FieldHelpTooltip from "@/features/projects/workspace/field-help/components/FieldHelpTooltip";
import {
  getFieldHelp,
  getFieldHelpByKey,
} from "@/features/projects/workspace/field-help";

export default function FieldHelpLabel({
  children,
  label,
  phase,
  field,
  helpKey,
  help,
  tooltipPosition = "right",
  required = false,
  className = "",
  labelClassName = "",
}) {
  const resolvedHelp =
    help || (helpKey ? getFieldHelpByKey(helpKey) : getFieldHelp(phase, field));

  return (
    <div className={`inline-flex items-center gap-1.5 align-middle ${className}`}>
      <label
        className={`text-[11px] font-black uppercase tracking-widest text-[#005944] ${labelClassName}`}
      >
        {children || label || resolvedHelp?.title}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>

      {resolvedHelp ? (
        <FieldHelpTooltip help={resolvedHelp} position={tooltipPosition} />
      ) : null}
    </div>
  );
}