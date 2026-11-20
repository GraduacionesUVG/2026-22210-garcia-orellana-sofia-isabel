"use client";

import { useEffect } from "react";
import Icon from "@/components/common/Icon";
import { useDeleteProjectMutation } from "@/features/projects/hooks/useProjectMutations";

export default function DeleteProjectModal({ open, project, onClose, onDeleted }) {
  const title = project?.title ?? project?.name ?? "este proyecto";

  const {
    loading,
    errorMsg,
    reset,
    submit,
  } = useDeleteProjectMutation();

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleDelete() {
    try {
      await submit(project);
      onDeleted?.();
      onClose?.();
    } catch {
                                        
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      <div className="relative mx-auto mt-28 w-[92%] max-w-lg">
        <div className="rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <Icon name="delete" className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-gray-900">
                  Eliminar proyecto
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Cerrar"
            >
              <Icon name="close" className="text-lg" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              ¿Seguro que quieres eliminar <span className="font-semibold">"{title}"</span>?
            </div>

            {errorMsg ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            ) : null}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Icon name="delete" className="text-lg" />
                    Eliminar
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