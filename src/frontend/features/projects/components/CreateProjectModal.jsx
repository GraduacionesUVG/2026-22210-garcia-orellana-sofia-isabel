"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/common/Icon";
import { fetchProjects } from "@/features/projects/api/projects.api";
import { normalizeProjectsResponse } from "@/features/projects/helpers/project.helpers";

function verifiedProjects(payload) {
  if (!Array.isArray(payload) && !Array.isArray(payload?.projects)) throw new Error("Lista de proyectos inválida.");
  const rows = normalizeProjectsResponse(payload);
  if (rows.some((row) => row?.id == null || typeof row.name !== "string")) throw new Error("Lista de proyectos inválida.");
  return rows;
}

export default function CreateProjectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const generation = useRef(0);
  const pending = useRef(new Map());
  const unresolved = useRef(new Map());
  const uncertainAttempt = useRef(null);

  const canSubmit = useMemo(() => name.trim().length >= 2 && !loading && !uncertain, [name, loading, uncertain]);

  useLayoutEffect(() => {
    generation.current += 1;
    setLoading(false);
    uncertainAttempt.current = null;
    if (open) {
      setErrorMsg("");
      setName("");
      setDescription("");
      setUncertain(false);
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") closeModal();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function closeModal() {
    generation.current += 1;
    onClose?.();
  }

  async function reconcile(attempt) {
    const rows = verifiedProjects(await fetchProjects());
    const matches = rows.filter((project) =>
      !attempt.before.has(project.id) && project.name === attempt.payload.name &&
      String(project.description ?? "").trim() === attempt.payload.description
    );
                                                                                
                                                                               
    if (matches.length !== 1) return false;
    onCreated?.();
    if (attempt.generation === generation.current) {
      uncertainAttempt.current = attempt;
      setUncertain(true);
      setErrorMsg("Hay un proyecto coincidente en la lista. Revisa sus datos antes de decidir; no podemos confirmar que sea este envío.");
    }
    return true;
  }

  async function verifyCreation() {
    const attempt = uncertainAttempt.current;
    if (!attempt || loading) return;
    if (pending.current.has(attempt.key)) {
      setErrorMsg("La creación sigue en curso. Espera a que termine el envío pendiente.");
      return;
    }
    const currentGeneration = generation.current;
    setLoading(true);
    try {
      if (await reconcile({ ...attempt, generation: currentGeneration })) return;
      if (currentGeneration === generation.current) setErrorMsg("No se pudo confirmar una única creación. Revisa la lista de proyectos; el envío sigue bloqueado para evitar duplicados.");
    } catch {
      if (currentGeneration === generation.current) setErrorMsg("No se pudo comprobar la creación. Revisa tu conexión y vuelve a comprobarla.");
    } finally {
      if (currentGeneration === generation.current) setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading || uncertain) return;
    setErrorMsg("");

    const payload = {
      name: name.trim(),
      description: description.trim(),
    };

    if (payload.name.length < 2) {
      setErrorMsg("El nombre es requerido.");
      return;
    }

    const attempt = { generation: generation.current, payload, key: JSON.stringify(payload), before: new Set() };
    const previous = pending.current.get(attempt.key) ?? unresolved.current.get(attempt.key);
    if (previous) {
      uncertainAttempt.current = previous;
      setUncertain(true);
      setErrorMsg(pending.current.has(attempt.key)
        ? "La creación anterior sigue en curso. Espera a que termine el envío pendiente."
        : "La creación anterior sigue sin confirmar. Revisa la lista de proyectos antes de volver a crearla.");
      onCreated?.();
      return;
    }
    pending.current.set(attempt.key, attempt);
    let sent = false;
    setLoading(true);
    try {
      const before = verifiedProjects(await fetchProjects());
      attempt.before = new Set(before.map((project) => project.id));
      sent = true;
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json?.ok === false) {
        if (attempt.generation === generation.current) setErrorMsg(json?.error || "No se pudo crear el proyecto.");
        return;
      }

      const created = json?.project ?? json;
      if (!created?.id) throw new Error("Respuesta de creación inválida.");

      onCreated?.(created);
      if (attempt.generation === generation.current) closeModal();
    } catch {
      if (sent) {
        unresolved.current.set(attempt.key, attempt);
        if (attempt.generation === generation.current) uncertainAttempt.current = attempt;
        try { if (await reconcile(attempt)) return; } catch {                                                           }
      }
      if (attempt.generation === generation.current) {
        setUncertain(sent);
        setErrorMsg(sent
          ? "No pudimos confirmar la creación. Revisa la lista de proyectos; no repetiremos el envío para evitar duplicados."
          : "No se pudo comprobar la lista de proyectos. Intenta de nuevo.");
      }
      if (sent) onCreated?.();
    } finally {
      if (pending.current.get(attempt.key) === attempt) pending.current.delete(attempt.key);
      if (attempt.generation === generation.current) setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/30"
        onClick={closeModal}
      />

      <div className="relative mx-auto mt-24 w-[92%] max-w-lg">
        <div className="rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-900">
                Nuevo Proyecto
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Agrega un nombre y una descripción para empezar.
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
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
                  readOnly={uncertain}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm"
                  placeholder="Ej. Análisis Etnográfico: Biblioteca"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Mínimo 2 caracteres.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                readOnly={uncertain}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm min-h-[110px] resize-none"
                placeholder="Describe el objetivo del proyecto…"
              />
            </div>

            {errorMsg ? (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            ) : null}

            {uncertain ? (
              <button type="button" disabled={loading} onClick={verifyCreation}
                className="text-sm font-medium text-primary underline disabled:opacity-60">
                Comprobar creación
              </button>
            ) : null}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
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
                    Creando...
                  </>
                ) : (
                  <>
                    <Icon name="add" className="text-lg" />
                    Crear
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
