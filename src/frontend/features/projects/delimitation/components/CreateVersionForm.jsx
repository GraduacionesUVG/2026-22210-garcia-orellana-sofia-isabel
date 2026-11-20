"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/common/Icon";

export default function CreateVersionForm({
  label,
  setLabel,
  loading,
  errorMsg,
  infoMsg,
  successMsg,
  onSubmit,
  openMode = "browse",
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (openMode === "create") {
      inputRef.current?.focus();
    }
  }, [openMode]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon name="bookmark_add" className="text-[20px]" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">Guardar nueva versión</h3>
          <p className="text-xs text-slate-500 mt-1">
            Crea un checkpoint manual del estado actual de la delimitación.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Etiqueta opcional
          </label>
          <input
            ref={inputRef}
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={120}
            placeholder="Ej. Versión previa a la revisión del asesor"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {errorMsg ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        {infoMsg ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {infoMsg}
          </div>
        ) : null}

        {successMsg ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMsg}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#004232] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Icon name="save" className="text-[18px]" />
              Guardar versión
            </>
          )}
        </button>
      </div>
    </div>
  );
}