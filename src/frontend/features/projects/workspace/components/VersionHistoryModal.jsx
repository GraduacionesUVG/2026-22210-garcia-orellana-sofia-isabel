"use client";

import { useState } from "react";
import Icon from "@/components/common/Icon";

function formatDate(value) {
  if (!value) return "Fecha no disponible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function triggerBadge(triggerType) {
  if (triggerType === "restore_backup") {
    return { label: "Respaldo", className: "border-blue-200 bg-blue-50 text-blue-700", icon: "shield" };
  }

  if (triggerType === "auto_checkpoint") {
    return { label: "Automática", className: "border-amber-200 bg-amber-50 text-amber-700", icon: "schedule" };
  }

  return { label: "Manual", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: "bookmark" };
}

export function VersionPreviewField({ label, value, emptyText = "Sin contenido" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {String(value ?? "").trim() || emptyText}
      </p>
    </div>
  );
}

export function VersionPreviewList({ label, items, emptyText = "No hay elementos." }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {items?.length ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${label}-${item?.id ?? item?.position ?? index}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              {item?.text || "Sin contenido"}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

function VersionListItem({
  version,
  active,
  onClick,
  getVersionNumber,
  getVersionLabel,
  getVersionDate,
  getVersionTriggerType,
}) {
  const badge = triggerBadge(getVersionTriggerType(version));

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
            v{getVersionNumber(version)}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {getVersionLabel(version) || "Sin etiqueta"}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
        >
          <Icon name={badge.icon} className="text-[12px]" />
          {badge.label}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{getVersionDate(version)}</p>
    </button>
  );
}

function CreateVersionForm({
  label,
  setLabel,
  creating,
  createError,
  createInfo,
  createSuccess,
  onCreate,
}) {
  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await onCreate({ label });
    } catch {
                                                               
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        Guardar un punto de control
      </p>
      <h3 className="mt-1 text-base font-bold text-slate-900">
        Crea una versión antes de hacer cambios importantes.
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Podrás revisarla y restaurarla después sin perder el trabajo actual.
      </p>

      <label className="mt-4 block text-[10px] font-black uppercase tracking-widest text-slate-400">
        Nombre de la versión
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Ej. Antes de ajustar la delimitación"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-primary/40"
        />
      </label>

      {createError ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {createError}
        </p>
      ) : null}
      {createInfo ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {createInfo}
        </p>
      ) : null}
      {createSuccess ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {createSuccess}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={creating}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon
          name={creating ? "autorenew" : "bookmark_add"}
          className={creating ? "animate-spin text-base" : "text-base"}
        />
        {creating ? "Guardando..." : "Guardar versión"}
      </button>
    </form>
  );
}

function RestoreVersionDialog({ version, loading, error, onCancel, onConfirm, getVersionNumber }) {
  if (!version) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Restaurar versión
        </p>
        <h3 className="mt-2 text-lg font-bold text-slate-900">
          ¿Quieres reemplazar el borrador actual?
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Se restaurará la versión {getVersionNumber(version)}. El estado actual
          quedará guardado como respaldo cuando la fase lo permita.
        </p>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Icon name="autorenew" className="animate-spin text-base" /> : <Icon name="restore" className="text-base" />}
            {loading ? "Restaurando..." : "Restaurar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({
  selectedVersion,
  detail,
  loadingDetail,
  detailError,
  restoring,
  onRequestRestore,
  renderSnapshot,
  getVersionNumber,
  getVersionLabel,
  getVersionDate,
  getVersionAuthor,
  getVersionTriggerType,
}) {
  if (loadingDetail) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Cargando versión...
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {detailError}
      </div>
    );
  }

  const version = detail?.version ?? selectedVersion;

  if (!version) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Selecciona una versión para ver su contenido.
      </div>
    );
  }

  const snapshot = detail?.snapshot ?? version?.snapshot ?? detail;
  const badge = triggerBadge(getVersionTriggerType(version));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Vista previa
          </p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">
            v{getVersionNumber(version)}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {getVersionLabel(version) || "Sin etiqueta"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>{getVersionDate(version)}</span>
            {getVersionAuthor(version) ? <span>· Por: {getVersionAuthor(version)}</span> : null}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
              <Icon name={badge.icon} className="text-[11px]" />
              {badge.label}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRequestRestore}
          disabled={restoring}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004232] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {restoring ? <Icon name="autorenew" className="animate-spin text-base" /> : <Icon name="restore" className="text-base" />}
          {restoring ? "Restaurando..." : "Restaurar"}
        </button>
      </div>
      <div className="space-y-4 p-6">
        {snapshot ? renderSnapshot({ snapshot, detail, version }) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Esta versión no trae contenido para mostrar.
          </div>
        )}
      </div>
    </div>
  );
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  versions = [],
  loadingVersions = false,
  versionsError = "",
  selectedVersionId,
  onSelectVersion,
  onRefresh,
  selectedVersion = null,
  detail = null,
  loadingDetail = false,
  detailError = "",
  onCreate,
  label = "",
  setLabel,
  creating = false,
  createError = "",
  createInfo = "",
  createSuccess = "",
  onRestore,
  restoring = false,
  restoreError = "",
  restoreSuccess = "",
  renderSnapshot,
  emptyVersionsText = "Aún no hay versiones guardadas.",
  getVersionNumber = (version) => version?.version_number ?? version?.revision ?? "—",
  getVersionLabel = (version) => version?.label ?? "",
  getVersionDate = (version) => formatDate(version?.created_at),
  getVersionAuthor = (version) => {
    const author = version?.created_by;
    if (typeof author === "string") return author;
    return author?.full_name || author?.name || author?.email || "";
  },
  getVersionTriggerType = (version) => version?.trigger_type,
}) {
  const [pendingRestoreVersion, setPendingRestoreVersion] = useState(null);

  if (!isOpen) return null;

  async function confirmRestore() {
    if (!pendingRestoreVersion) return;
    try {
      const result = await onRestore(pendingRestoreVersion.id);
      if (result !== false) setPendingRestoreVersion(null);
    } catch {
                                                          
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60]">
        <button type="button" className="absolute inset-0 bg-black/35" onClick={onClose} aria-label="Cerrar" />
        <div className="relative mx-auto mt-8 w-[96%] max-w-7xl">
          <div className="flex h-[80vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-[#f8fafc] shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-900">Historial de versiones</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Guarda puntos de control manuales, revisa versiones anteriores y restaura el borrador cuando lo necesites.
                </p>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 xl:grid-cols-[380px_minmax(0,1fr)]">
              <div className="min-h-0 overflow-y-auto border-r border-slate-200 p-5 custom-scrollbar">
                <div className="space-y-5">
                  <CreateVersionForm
                    label={label}
                    setLabel={setLabel}
                    creating={creating}
                    createError={createError}
                    createInfo={createInfo}
                    createSuccess={createSuccess}
                    onCreate={onCreate}
                  />

                  {restoreError ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{restoreError}</p> : null}
                  {restoreSuccess ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{restoreSuccess}</p> : null}

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Historial</h3>
                        <p className="mt-1 text-xs text-slate-500">Versiones más recientes primero.</p>
                      </div>
                      <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        <Icon name="refresh" className="text-[18px]" />
                        Recargar
                      </button>
                    </div>

                    {loadingVersions ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Cargando historial...</div> : null}
                    {!loadingVersions && versionsError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                        <p>{versionsError}</p>
                        <button type="button" onClick={onRefresh} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                          <Icon name="refresh" className="text-[18px]" />
                          Reintentar
                        </button>
                      </div>
                    ) : null}
                    {!loadingVersions && !versionsError && !versions.length ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">{emptyVersionsText}</div> : null}
                    {!loadingVersions && !versionsError ? (
                      <div className="space-y-3">
                        {versions.map((version) => (
                          <VersionListItem
                            key={version.id}
                            version={version}
                            active={selectedVersionId === version.id}
                            onClick={() => onSelectVersion(version.id)}
                            getVersionNumber={getVersionNumber}
                            getVersionLabel={getVersionLabel}
                            getVersionDate={getVersionDate}
                            getVersionTriggerType={getVersionTriggerType}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="min-h-0 overflow-y-auto p-5 custom-scrollbar">
                <PreviewPanel
                  selectedVersion={selectedVersion}
                  detail={detail}
                  loadingDetail={loadingDetail}
                  detailError={detailError}
                  restoring={restoring}
                  onRequestRestore={() => setPendingRestoreVersion(selectedVersion)}
                  renderSnapshot={renderSnapshot}
                  getVersionNumber={getVersionNumber}
                  getVersionLabel={getVersionLabel}
                  getVersionDate={getVersionDate}
                  getVersionAuthor={getVersionAuthor}
                  getVersionTriggerType={getVersionTriggerType}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <RestoreVersionDialog
        version={pendingRestoreVersion}
        loading={restoring}
        error={restoreError}
        onCancel={() => setPendingRestoreVersion(null)}
        onConfirm={confirmRestore}
        getVersionNumber={getVersionNumber}
      />
    </>
  );
}
