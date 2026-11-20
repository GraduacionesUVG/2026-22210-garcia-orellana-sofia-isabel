"use client";

import Icon from "@/components/common/Icon";

export default function RestoreVersionDialog({
  open,
  version,
  loading,
  errorMsg,
  onCancel,
  onConfirm,
}) {
  if (!open || !version) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-label="Cerrar"
      />

      <div className="relative mx-auto mt-28 w-[92%] max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Icon name="warning" className="text-[20px]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Restaurar versión
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Se reemplazará el borrador actual con el contenido de esta versión.
              </p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Vas a restaurar <span className="font-semibold">v{version.version_number}</span>
              {version.label ? <> — "{version.label}"</> : null}.
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Antes de restaurar, el backend generará un backup automático del borrador actual cuando corresponda.
            </div>

            {errorMsg ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#004232] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <Icon name="restore" className="text-[18px]" />
                    Confirmar restauración
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}