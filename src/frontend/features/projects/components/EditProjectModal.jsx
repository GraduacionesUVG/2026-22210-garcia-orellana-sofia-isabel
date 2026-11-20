"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/common/Icon";
import { resolveProjectActive } from "@/features/projects/helpers/project.helpers";
import { useUpdateProjectMutation } from "@/features/projects/hooks/useProjectMutations";

export default function EditProjectModal({ open, project, onClose, onUpdated }) {
  const initialName = project?.title ?? project?.name ?? "";
  const initialDesc = project?.description ?? project?.summary ?? "";
  const initialActive = resolveProjectActive(project);

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDesc);
  const [isActive, setIsActive] = useState(initialActive);

  const {
    loading,
    errorMsg,
    reset,
    submit,
  } = useUpdateProjectMutation();

  useEffect(() => {
    if (!open) return;

    reset();
    setName(initialName);
    setDescription(initialDesc);
    setIsActive(initialActive);
  }, [open, initialName, initialDesc, initialActive, reset]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && !loading;
  }, [name, loading]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      name: name.trim(),
      description: description.trim(),
      is_active: isActive,
    };

    try {
      const updated = await submit(project, payload);
      onUpdated?.(updated);
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

      <div className="relative mx-auto mt-24 w-[92%] max-w-lg">
        <div className="rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-900">
                Editar Proyecto
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Actualiza el nombre, la descripción y el estado.
              </p>
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

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del proyecto
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="edit" className="text-gray-400" />
                </div>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm"
                  placeholder="Nombre del proyecto"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm min-h-[110px] resize-none"
                placeholder="Descripción…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado del proyecto
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="toggle_on" className="text-gray-400" />
                </div>

                <select
                  value={isActive ? "true" : "false"}
                  onChange={(e) => setIsActive(e.target.value === "true")}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm bg-white"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
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
                type="submit"
                disabled={!canSubmit}
                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-[#004030] text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Icon name="save" className="text-lg" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}