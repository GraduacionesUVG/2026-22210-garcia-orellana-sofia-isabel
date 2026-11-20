"use client";

import Icon from "@/components/common/Icon";

function PreviewField({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
        {label}
      </p>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">
        {value?.trim() || "—"}
      </p>
    </div>
  );
}

function PreviewList({ label, items }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
        {label}
      </p>

      {items?.length ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${label}-${index}-${item.position ?? index}`}
              className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              {item.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No hay elementos.</p>
      )}
    </div>
  );
}

function triggerLabel(triggerType) {
  if (triggerType === "restore_backup") return "Backup automático";
  if (triggerType === "auto_checkpoint") return "Checkpoint automático";
  return "Versión manual";
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

export default function VersionPreviewPanel({
  detail,
  loading,
  errorMsg,
  restoring,
  onRequestRestore,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Cargando versión...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {errorMsg}
      </div>
    );
  }

  if (!detail?.version) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Selecciona una versión para ver su contenido.
      </div>
    );
  }

  const version = detail.version;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Vista previa
          </p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">
            v{version.version_number}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {version.label?.trim() || "Sin etiqueta"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {triggerLabel(version.trigger_type)} · {formatDate(version.created_at)}
          </p>
        </div>

        <button
          type="button"
          onClick={onRequestRestore}
          disabled={restoring}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#004232] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {restoring ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Restaurando...
            </>
          ) : (
            <>
              <Icon name="restore" className="text-[18px]" />
              Restaurar
            </>
          )}
        </button>
      </div>

      <div className="p-6 space-y-4">
        <PreviewField label="Tema" value={detail?.delim?.topic} />
        <PreviewField label="Lugar / contexto" value={detail?.delim?.context_place} />
        <PreviewField label="Población" value={detail?.delim?.population} />
        <PreviewField label="Periodo de tiempo" value={detail?.delim?.time_period} />
        <PreviewField label="Recursos" value={detail?.delim?.resources} />
        <PreviewList label="Criterios de inclusión" items={detail?.include ?? []} />
        <PreviewList label="Criterios de exclusión" items={detail?.exclude ?? []} />
      </div>
    </div>
  );
}