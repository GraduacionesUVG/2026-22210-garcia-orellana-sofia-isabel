"use client";

import Icon from "@/components/common/Icon";

const TONE_META = {
  warning: {
    icon: "warning",
    label: "Revisar",
    iconClass: "text-[#854D0E]",
    pillClass: "border-amber-200 bg-amber-50 text-[#854D0E]",
    noteClass: "border-amber-200 bg-amber-50/70 text-[#854D0E]",
  },
  critical: {
    icon: "error",
    label: "Importante",
    iconClass: "text-[#C2410C]",
    pillClass: "border-orange-200 bg-orange-50 text-[#C2410C]",
    noteClass: "border-orange-200 bg-orange-50/75 text-[#C2410C]",
  },
  info: {
    icon: "info",
    label: "Detalle",
    iconClass: "text-slate-500",
    pillClass: "border-slate-200 bg-slate-50 text-slate-500",
    noteClass: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

export function getFieldStateMeta(tone) {
  return TONE_META[tone] ?? null;
}

export function fieldStateFrameClassName(tone) {
  if (tone === "critical") {
    return "border-orange-300 bg-orange-50/30";
  }

  if (tone === "warning") {
    return "border-amber-300 bg-amber-50/25";
  }

  if (tone === "info") {
    return "border-slate-300 bg-slate-50/40";
  }

  return "border-slate-200 bg-white";
}

export function FieldStateIcon({ state }) {
  const meta = getFieldStateMeta(state?.tone);

  if (!meta) return null;

  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${meta.pillClass}`}
      title={state?.title || meta.label}
    >
      <Icon name={meta.icon} className="text-[13px]" />
    </span>
  );
}

export function FieldStatePill({ state }) {
  const meta = getFieldStateMeta(state?.tone);

  if (!meta) return null;

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${meta.pillClass}`}
    >
      {state?.label || meta.label}
    </span>
  );
}

export default function FieldStateNote({ state, className = "" }) {
  const meta = getFieldStateMeta(state?.tone);

  if (!meta) return null;

  const title = state?.title || "Este campo necesita revisión";
  const body =
    state?.suggestion ||
    state?.message ||
    "Revisa este campo y vuelve la redacción más concreta.";

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${meta.noteClass} ${className}`}
    >
      <div className="flex items-start gap-2">
        <Icon
          name={meta.icon}
          className={`mt-[1px] shrink-0 text-[15px] ${meta.iconClass}`}
        />

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em]">
            {title}
          </p>

          <p className="mt-1 text-xs leading-relaxed text-slate-700">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}