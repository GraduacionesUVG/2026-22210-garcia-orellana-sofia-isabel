"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAnalysisInsight,
  createAnalysisInsightLink,
  deleteAnalysisInsight,
  deleteAnalysisInsightLink,
  getAnalysisCodes,
  getAnalysisInsightLinks,
  getAnalysisInsights,
  getAllAnalysisMemos,
  updateAnalysisInsight,
} from "@/features/projects/analysis/api/analysis.api";
import {
  INSIGHT_EMPTY_FORM,
  buildInsightCreatePayload,
  buildInsightUpdatePayload,
  getFriendlyAnalysisError,
  normalizeInsightForm,
  validateInsightForm,
} from "@/features/projects/analysis/helpers/analysis.helpers";

function getInsightsPayload(json) {
  return Array.isArray(json?.insights) ? json.insights : [];
}

function getLinksPayload(json) {
  return Array.isArray(json?.links) ? json.links : [];
}

function getCodesPayload(json) {
  return Array.isArray(json?.codes) ? json.codes : [];
}

function getMemosPayload(json) {
  return Array.isArray(json?.memos) ? json.memos : [];
}

export function useAnalysisInsights(projectId) {
  const requestRef = useRef(0);
  const abortRef = useRef(null);
  const [insights, setInsights] = useState([]);
  const [insightLinks, setInsightLinks] = useState([]);
  const [codes, setCodes] = useState([]);
  const [memos, setMemos] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    insight_type: "",
    confidence: "",
    status: "",
    include_deleted: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInsight, setEditingInsight] = useState(null);
  const [form, setForm] = useState(INSIGHT_EMPTY_FORM);
  const [linksInsight, setLinksInsight] = useState(null);
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linkForm, setLinkForm] = useState({
    link_type: "code",
    code_id: "",
    memo_id: "",
    segment_id: "",
  });

  const loadInsights = useCallback(
    async ({ soft = false } = {}) => {
      if (!projectId) return;
      const requestId = ++requestRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        if (soft) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMsg("");

        const [insightsJson, codesJson, memosJson] = await Promise.all([
          getAnalysisInsights(projectId, {
            ...filters,
            include_links: true,
            limit: 200,
            offset: 0,
          }),
          getAnalysisCodes(projectId, { limit: 200, offset: 0 }),
          getAllAnalysisMemos(projectId, {}, { signal: controller.signal }),
        ]);

        if (requestId !== requestRef.current) return;
        setInsights(getInsightsPayload(insightsJson));
        setInsightLinks(getLinksPayload(insightsJson));
        setCodes(getCodesPayload(codesJson));
        setMemos(getMemosPayload(memosJson));
      } catch (error) {
        if (requestId === requestRef.current && !controller.signal.aborted) {
          setErrorMsg(error?.message ?? "No se pudieron cargar los hallazgos.");
        }
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [projectId, filters]
  );

  useEffect(() => {
    loadInsights();
    return () => { requestRef.current++; abortRef.current?.abort(); };
  }, [loadInsights]);

  useEffect(() => {
    setInsights([]);
    setInsightLinks([]);
    setCodes([]);
    setMemos([]);
  }, [projectId]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function openCreateModal() {
    setEditingInsight(null);
    setForm(INSIGHT_EMPTY_FORM);
    setModalOpen(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function openEditModal(insight) {
    setEditingInsight(insight);
    setForm(normalizeInsightForm(insight));
    setModalOpen(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function closeModal() {
    setModalOpen(false);
    setEditingInsight(null);
    setForm(INSIGHT_EMPTY_FORM);
  }

  function setFormField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function saveInsight() {
    const validationError = validateInsightForm(form);

    if (validationError) {
      setErrorMsg(validationError);
      return false;
    }

    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      if (editingInsight) {
        await updateAnalysisInsight(
          projectId,
          editingInsight.id,
          buildInsightUpdatePayload(form, editingInsight.revision)
        );
        setSuccessMsg("El hallazgo se actualizó correctamente.");
      } else {
        await createAnalysisInsight(
          projectId,
          buildInsightCreatePayload(form)
        );
        setSuccessMsg("El hallazgo se creó correctamente.");
      }

      closeModal();
      await loadInsights({ soft: true });
      return true;
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeInsight(insight) {
    if (!insight?.id) return;

    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar este hallazgo?"
    );
    if (!confirmed) return;

    try {
      setDeletingId(insight.id);
      setErrorMsg("");
      setSuccessMsg("");

      await deleteAnalysisInsight(projectId, insight.id);
      setSuccessMsg("El hallazgo se eliminó correctamente.");
      await loadInsights({ soft: true });
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
    } finally {
      setDeletingId("");
    }
  }

  async function openLinksPanel(insight) {
    setLinksInsight(insight);
    setLinks([]);
    setLinkForm({
      link_type: "code",
      code_id: "",
      memo_id: "",
      segment_id: "",
    });

    if (!insight?.id) return;

    try {
      setLinksLoading(true);
      setErrorMsg("");
      const json = await getAnalysisInsightLinks(projectId, insight.id);
      setLinks(getLinksPayload(json));
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
    } finally {
      setLinksLoading(false);
    }
  }

  function closeLinksPanel() {
    setLinksInsight(null);
    setLinks([]);
  }

  function setLinkField(name, value) {
    setLinkForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMsg("");
    setSuccessMsg("");
  }

  function getLinkPayload() {
    if (linkForm.link_type === "memo") {
      return { link_type: "memo", memo_id: linkForm.memo_id };
    }

    if (linkForm.link_type === "segment") {
      return { link_type: "segment", segment_id: linkForm.segment_id };
    }

    return { link_type: "code", code_id: linkForm.code_id };
  }

  async function createLink() {
    if (!linksInsight?.id) return false;

    const payload = getLinkPayload();

    if (!payload.code_id && !payload.memo_id && !payload.segment_id) {
      setErrorMsg("Selecciona un recurso para vincular.");
      return false;
    }

    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await createAnalysisInsightLink(projectId, linksInsight.id, payload);
      setSuccessMsg("El vínculo se creó correctamente.");
      await openLinksPanel(linksInsight);
      await loadInsights({ soft: true });
      return true;
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeLink(link) {
    if (!linksInsight?.id || !link?.id) return;

    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await deleteAnalysisInsightLink(projectId, linksInsight.id, link.id);
      setSuccessMsg("El vínculo se eliminó correctamente.");
      await openLinksPanel(linksInsight);
      await loadInsights({ soft: true });
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
    } finally {
      setSaving(false);
    }
  }

  return {
    insights,
    insightLinks,
    codes,
    memos,
    filters,
    loading,
    refreshing,
    saving,
    deletingId,
    errorMsg,
    successMsg,
    modalOpen,
    editingInsight,
    form,
    linksInsight,
    links,
    linksLoading,
    linkForm,
    updateFilter,
    openCreateModal,
    openEditModal,
    closeModal,
    setFormField,
    saveInsight,
    removeInsight,
    openLinksPanel,
    closeLinksPanel,
    setLinkField,
    createLink,
    removeLink,
    reload: () => loadInsights({ soft: true }),
  };
}
