"use client";

import Icon from "@/components/common/Icon";

function triggerBadge(triggerType) {
  if (triggerType === "restore_backup") {
    return {
      label: "Backup",
      className: "border-blue-200 bg-blue-50 text-blue-700",
      icon: "shield",
    };
  }

  if (triggerType === "auto_checkpoint") {
    return {
      label: "Auto",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      icon: "schedule",
    };
  }

  return {
    label: "Manual",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "bookmark",
  };
}

function formatDate(value) {
  if (!value) return "Fecha no disponible";

  try {
    return new Intl.DateTimeFormat("es-GT", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function VersionListItem({
  version,
  active = false,
  onClick,
}) {
  const badge = triggerBadge(version?.trigger_type);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        active
          ? "border-primary/20 bg-primary/5"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            v{version?.version_number}
          </p>

          <p className="mt-1 text-sm text-slate-600 line-clamp-2">
            {version?.label?.trim() || "Sin etiqueta"}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
        >
          <Icon name={badge.icon} className="text-[12px]" />
          {badge.label}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {formatDate(version?.created_at)}
      </p>
    </button>
  );
}