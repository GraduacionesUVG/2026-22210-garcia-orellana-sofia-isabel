"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAnalysisCode,
  createAnalysisMemo,
  createAnalysisMemoLink,
  createSegmentCode,
  deleteSegmentCode,
  getAnalysisCodes,
  getSegmentCodes,
  updateSegmentCode,
} from "@/features/projects/analysis/api/analysis.api";
import {
  CODE_EMPTY_FORM,
  MEMO_EMPTY_FORM,
  SEGMENT_CODE_EMPTY_FORM,
  buildCodeCreatePayload,
  buildMemoCreatePayload,
  buildSegmentCodePayload,
  buildSegmentCodeUpdatePayload,
  buildSegmentMemoDraft,
  getFriendlyAnalysisError,
  validateCodeForm,
} from "@/features/projects/analysis/helpers/analysis.helpers";

function getSegmentCodesPayload(json) {
  return Array.isArray(json?.segment_codes) ? json.segment_codes : [];
}

function getCodesPayload(json) {
  return Array.isArray(json?.codes) ? json.codes : [];
}

export function useAnalysisSegmentCodes({
  projectId,
  segmentId,
  enabled = true,
}) {
  const [segmentCodes, setSegmentCodes] = useState([]);
  const [codebook, setCodebook] = useState([]);
  const [form, setForm] = useState(SEGMENT_CODE_EMPTY_FORM);
  const [quickCodeForm, setQuickCodeForm] = useState(CODE_EMPTY_FORM);
  const [memoForm, setMemoForm] = useState(MEMO_EMPTY_FORM);
  const [memoSegment, setMemoSegment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [editingSegmentCode, setEditingSegmentCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadCoding = useCallback(
    async ({ soft = false } = {}) => {
      if (!enabled || !projectId || !segmentId) return;

      try {
        if (soft) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMsg("");

        const [assignedJson, codesJson] = await Promise.all([
          getSegmentCodes(projectId, segmentId, { limit: 100, offset: 0 }),
          getAnalysisCodes(projectId, { limit: 200, offset: 0 }),
        ]);

        setSegmentCodes(getSegmentCodesPayload(assignedJson));
        setCodebook(getCodesPayload(codesJson));
      } catch (error) {
        setErrorMsg(
          error?.message ?? "No se pudo cargar la codificación del segmento."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled, projectId, segmentId]
  );

  useEffect(() => {
    loadCoding();
  }, [loadCoding]);

  useEffect(() => {
    setForm(SEGMENT_CODE_EMPTY_FORM);
    setQuickCodeForm(CODE_EMPTY_FORM);
    setEditingSegmentCode(null);
    setModalOpen(false);
    setErrorMsg("");
    setSuccessMsg("");
  }, [segmentId]);

  const codesById = useMemo(() => {
    const map = new Map();
    codebook.forEach((code) => map.set(code.id, code));
    return map;
  }, [codebook]);

  function clearFeedback() {
    setErrorMsg("");
    setSuccessMsg("");
  }

  function openAssignModal() {
    setEditingSegmentCode(null);
    setForm(SEGMENT_CODE_EMPTY_FORM);
    setQuickCodeForm(CODE_EMPTY_FORM);
    setModalOpen(true);
    clearFeedback();
  }

  function openEditModal(segmentCode) {
    setEditingSegmentCode(segmentCode);
    setForm({
      code_id: segmentCode.code_id ?? "",
      analytic_note: segmentCode.analytic_note ?? "",
      is_quote: Boolean(segmentCode.is_quote),
      quote_label: segmentCode.quote_label ?? "",
    });
    setQuickCodeForm(CODE_EMPTY_FORM);
    setModalOpen(true);
    clearFeedback();
  }

  function closeModal() {
    setModalOpen(false);
    setEditingSegmentCode(null);
    setForm(SEGMENT_CODE_EMPTY_FORM);
    setQuickCodeForm(CODE_EMPTY_FORM);
  }

  function openMemoModal(segment) {
    if (!segment?.id) return;

    setMemoSegment(segment);
    setMemoForm(buildSegmentMemoDraft(segment));
    setMemoModalOpen(true);
    clearFeedback();
  }

  function closeMemoModal() {
    setMemoModalOpen(false);
    setMemoSegment(null);
    setMemoForm(MEMO_EMPTY_FORM);
  }

  function setFormField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearFeedback();
  }

  function setQuickCodeField(name, value) {
    setQuickCodeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearFeedback();
  }

  function setMemoField(name, value) {
    setMemoForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearFeedback();
  }

  async function saveSegmentCode() {
    if (!editingSegmentCode && !form.code_id) {
      setErrorMsg("Selecciona un código para asignarlo al segmento.");
      return false;
    }

    try {
      setSaving(true);
      clearFeedback();

      if (editingSegmentCode) {
        await updateSegmentCode(
          projectId,
          segmentId,
          editingSegmentCode.id,
          buildSegmentCodeUpdatePayload(form, editingSegmentCode.revision)
        );
        setSuccessMsg("La codificación se actualizó correctamente.");
      } else {
        await createSegmentCode(
          projectId,
          segmentId,
          buildSegmentCodePayload(form)
        );
        setSuccessMsg("El código se asignó al segmento.");
      }

      closeModal();
      await loadCoding({ soft: true });
      return true;
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function createQuickCodeAndAssign() {
    const validationError = validateCodeForm(quickCodeForm);

    if (validationError) {
      setErrorMsg(validationError);
      return false;
    }

    try {
      setSaving(true);
      clearFeedback();

      const createdJson = await createAnalysisCode(
        projectId,
        buildCodeCreatePayload(quickCodeForm)
      );
      const code = createdJson?.code ?? null;

      if (!code?.id) {
        throw new Error("No se recibió el código creado.");
      }

      await createSegmentCode(projectId, segmentId, {
        ...buildSegmentCodePayload(form),
        code_id: code.id,
      });

      setSuccessMsg("Se creó el código y quedó asignado al segmento.");
      closeModal();
      await loadCoding({ soft: true });
      return true;
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeSegmentCode(segmentCode) {
    if (!segmentCode?.id) return;

    try {
      setDeletingId(segmentCode.id);
      clearFeedback();

      await deleteSegmentCode(projectId, segmentId, segmentCode.id);
      setSuccessMsg("Se quitó el código del segmento.");
      await loadCoding({ soft: true });
      return true;
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
      return false;
    } finally {
      setDeletingId("");
    }
  }

  async function saveMemoFromSegment() {
    if (!memoSegment?.id) return false;

    try {
      setSaving(true);
      clearFeedback();

      const memoJson = await createAnalysisMemo(
        projectId,
        buildMemoCreatePayload(memoForm)
      );
      const memo = memoJson?.memo ?? null;

      if (memo?.id) {
        await createAnalysisMemoLink(projectId, memo.id, {
          link_type: "segment",
          segment_id: memoSegment.id,
        });
      }

      setSuccessMsg("Se guardó el memo interpretativo vinculado al segmento.");
      closeMemoModal();
      return true;
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    segmentCodes,
    codebook,
    codesById,
    form,
    quickCodeForm,
    memoForm,
    memoSegment,
    modalOpen,
    memoModalOpen,
    editingSegmentCode,
    loading,
    refreshing,
    saving,
    deletingId,
    errorMsg,
    successMsg,
    openAssignModal,
    openEditModal,
    closeModal,
    openMemoModal,
    closeMemoModal,
    setFormField,
    setQuickCodeField,
    setMemoField,
    saveSegmentCode,
    createQuickCodeAndAssign,
    removeSegmentCode,
    saveMemoFromSegment,
    reload: () => loadCoding({ soft: true }),
  };
}
