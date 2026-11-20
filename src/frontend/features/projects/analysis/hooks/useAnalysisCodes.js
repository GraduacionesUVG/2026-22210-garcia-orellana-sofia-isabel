"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAnalysisCode,
  deleteAnalysisCode,
  getAnalysisCodeUsageStats,
  getAnalysisCodes,
  updateAnalysisCode,
} from "@/features/projects/analysis/api/analysis.api";
import {
  CODE_EMPTY_FORM,
  buildCodeCreatePayload,
  buildCodeUpdatePayload,
  getFriendlyAnalysisError,
  normalizeCodeForm,
  validateCodeForm,
} from "@/features/projects/analysis/helpers/analysis.helpers";

function getCodesPayload(json) {
  return Array.isArray(json?.codes) ? json.codes : [];
}

function getStatsPayload(json) {
  return Array.isArray(json?.stats) ? json.stats : [];
}

export function useAnalysisCodes(projectId) {
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    parent_code_id: "",
    include_deleted: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [form, setForm] = useState(CODE_EMPTY_FORM);

  const loadCodes = useCallback(
    async ({ soft = false } = {}) => {
      if (!projectId) return;

      try {
        if (soft) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMsg("");

        const [codesJson, statsJson] = await Promise.all([
          getAnalysisCodes(projectId, {
            ...filters,
            limit: 200,
            offset: 0,
          }),
          getAnalysisCodeUsageStats(projectId, { limit: 200, offset: 0 }),
        ]);

        setCodes(getCodesPayload(codesJson));
        setStats(getStatsPayload(statsJson));
      } catch (error) {
        setErrorMsg(error?.message ?? "No se pudieron cargar los códigos.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId, filters]
  );

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const statsByCodeId = useMemo(() => {
    const map = new Map();

    stats.forEach((item) => {
      const key = item.code_id ?? item.id;
      if (key) map.set(key, item);
    });

    return map;
  }, [stats]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function openCreateModal() {
    setEditingCode(null);
    setForm(CODE_EMPTY_FORM);
    setModalOpen(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function openEditModal(code) {
    setEditingCode(code);
    setForm(normalizeCodeForm(code));
    setModalOpen(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCode(null);
    setForm(CODE_EMPTY_FORM);
  }

  function setFormField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrorMsg("");
    setSuccessMsg("");
  }

  async function saveCode() {
    const validationError = validateCodeForm(form);

    if (validationError) {
      setErrorMsg(validationError);
      return false;
    }

    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      if (editingCode) {
        await updateAnalysisCode(
          projectId,
          editingCode.id,
          buildCodeUpdatePayload(form, editingCode.revision)
        );
        setSuccessMsg("El código se actualizó correctamente.");
      } else {
        await createAnalysisCode(projectId, buildCodeCreatePayload(form));
        setSuccessMsg("El código se creó correctamente.");
      }

      closeModal();
      await loadCodes({ soft: true });
      return true;
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeCode(code) {
    if (!code?.id) return;

    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar este código del codebook?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(code.id);
      setErrorMsg("");
      setSuccessMsg("");

      await deleteAnalysisCode(projectId, code.id);
      setSuccessMsg("El código se eliminó correctamente.");
      await loadCodes({ soft: true });
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
    } finally {
      setDeletingId("");
    }
  }

  async function moveCode(code, patch = {}) {
    if (!code?.id) return false;

    try {
      setMovingId(code.id);
      setErrorMsg("");
      setSuccessMsg("");

      await updateAnalysisCode(
        projectId,
        code.id,
        buildCodeUpdatePayload(
          {
            ...normalizeCodeForm(code),
            parent_code_id: patch.parent_code_id === undefined
              ? code.parent_code_id ?? ""
              : patch.parent_code_id,
            position: patch.position ?? code.position ?? 0,
          },
          code.revision
        )
      );

      setSuccessMsg("El arbol de codigos se actualizo correctamente.");
      await loadCodes({ soft: true });
      return true;
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
      return false;
    } finally {
      setMovingId("");
    }
  }

  return {
    codes,
    stats,
    statsByCodeId,
    filters,
    loading,
    refreshing,
    saving,
    movingId,
    deletingId,
    errorMsg,
    successMsg,
    modalOpen,
    editingCode,
    form,
    updateFilter,
    openCreateModal,
    openEditModal,
    closeModal,
    setFormField,
    saveCode,
    removeCode,
    moveCode,
    reload: () => loadCodes({ soft: true }),
  };
}
