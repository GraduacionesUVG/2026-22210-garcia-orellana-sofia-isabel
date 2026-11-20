"use client";

import { useCallback, useState } from "react";
import {
  updateProject,
  deleteProject,
} from "@/features/projects/api/projects.api";

export function useUpdateProjectMutation() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const reset = useCallback(() => {
    setLoading(false);
    setErrorMsg("");
  }, []);

  const submit = useCallback(async (project, input) => {
    try {
      setLoading(true);
      setErrorMsg("");

      const updated = await updateProject(project, input);
      return updated;
    } catch (err) {
      const message = err?.message || "No se pudo guardar.";
      setErrorMsg(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    errorMsg,
    reset,
    submit,
  };
}

export function useDeleteProjectMutation() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const reset = useCallback(() => {
    setLoading(false);
    setErrorMsg("");
  }, []);

  const submit = useCallback(async (project) => {
    try {
      setLoading(true);
      setErrorMsg("");

      const result = await deleteProject(project);
      return result;
    } catch (err) {
      const message = err?.message || "No se pudo eliminar.";
      setErrorMsg(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    errorMsg,
    reset,
    submit,
  };
}