"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAnalysisMemo,
  createAnalysisMemoLink,
  deleteAnalysisMemo,
  deleteAnalysisMemoLink,
  getAnalysisCodes,
  getAnalysisMemoLinks,
  getAnalysisMemos,
  updateAnalysisMemo,
  getAnalysisSegments,
} from "@/features/projects/analysis/api/analysis.api";
import { getCorpusDocument, getCorpusDocuments } from "@/features/projects/corpus/api/corpus.api";
import { getCorpusParticipant, getCorpusParticipants } from "@/features/projects/corpus/api/corpusCatalog.api";
import { requestJson } from "@/lib/api/http";
import {
  MEMO_EMPTY_FORM,
  buildMemoCreatePayload,
  buildMemoUpdatePayload,
  getFriendlyAnalysisError,
  normalizeMemoForm,
  validateMemoForm,
} from "@/features/projects/analysis/helpers/analysis.helpers";

function getMemosPayload(json) {
  return Array.isArray(json?.memos) ? json.memos : [];
}

function getLinksPayload(json) {
  return Array.isArray(json?.links) ? json.links : [];
}

function getCodesPayload(json) {
  return Array.isArray(json?.codes) ? json.codes : [];
}

export function useAnalysisMemos(projectId) {
  const [memos, setMemos] = useState([]);
  const [codes, setCodes] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    memo_type: "",
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
  const [editingMemo, setEditingMemo] = useState(null);
  const [form, setForm] = useState(MEMO_EMPTY_FORM);
  const [linksMemo, setLinksMemo] = useState(null);
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksLoadFailed, setLinksLoadFailed] = useState(false);
  const [linkCatalog, setLinkCatalog] = useState({
    documents: [],
    participants: [],
    segments: [],
  });
  const linkCatalogLoadedRef = useRef(false);
  const linkRequestRef = useRef(0);
  const linkMutationRef = useRef(false);
  const [canLink, setCanLink] = useState(false);
  const [linkSearchDraft, setLinkSearchDraft] = useState("");
  const [linkResourceQuery, setLinkResourceQuery] = useState({ search: "", offset: 0 });
  const [linkResourcePage, setLinkResourcePage] = useState({ items: [], loading: false, error: "", hasMore: false });
  const [linkForm, setLinkForm] = useState({
    link_type: "code",
    code_id: "",
    segment_id: "",
    document_id: "",
    participant_id: "",
  });

  useEffect(() => {
    linkCatalogLoadedRef.current = false;
    linkRequestRef.current += 1;
    setLinksMemo(null);
    setLinks([]);
    setLinksLoadFailed(false);
    setCanLink(false);
    setLinkCatalog({ documents: [], participants: [], segments: [] });
    return () => { linkRequestRef.current += 1; };
  }, [projectId]);

  useEffect(() => {
    const type = linkForm.link_type;
    if (!linksMemo || (type !== "document" && type !== "participant")) return undefined;
    let cancelled = false;
    const key = type === "document" ? "documents" : "participants";
    const getPage = type === "document" ? getCorpusDocuments : getCorpusParticipants;
    setLinkResourcePage({ items: [], loading: true, error: "", hasMore: false });
    getPage(projectId, { ...linkResourceQuery, limit: 50 }).then(json => {
      if (cancelled) return;
      if (!Array.isArray(json?.[key])) throw new Error("No se pudo leer el catálogo. Reintenta la carga.");
      const items = json[key];
      setLinkResourcePage({ items, loading: false, error: "", hasMore: typeof json.total === "number" ? linkResourceQuery.offset + items.length < json.total : items.length === 50 });
      setLinkCatalog(previous => ({ ...previous, [key]: [...new Map([...previous[key], ...items].map(item => [item.id, item])).values()] }));
    }).catch(error => {
      if (!cancelled) setLinkResourcePage({ items: [], loading: false, error: getFriendlyAnalysisError(error), hasMore: false });
    });
    return () => { cancelled = true; };
  }, [projectId, linksMemo, linkForm.link_type, linkResourceQuery]);

  const loadMemos = useCallback(
    async ({ soft = false } = {}) => {
      if (!projectId) return;

      try {
        if (soft) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMsg("");

        const [memosJson, codesJson] = await Promise.all([
          getAnalysisMemos(projectId, {
            ...filters,
            limit: 200,
            offset: 0,
          }),
          getAnalysisCodes(projectId, { limit: 200, offset: 0 }),
        ]);

        setMemos(getMemosPayload(memosJson));
        setCodes(getCodesPayload(codesJson));
      } catch (error) {
        setErrorMsg(error?.message ?? "No se pudieron cargar los memos.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId, filters]
  );

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function openCreateModal() {
    setEditingMemo(null);
    setForm(MEMO_EMPTY_FORM);
    setModalOpen(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function openEditModal(memo) {
    setEditingMemo(memo);
    setForm(normalizeMemoForm(memo));
    setModalOpen(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function closeModal() {
    setModalOpen(false);
    setEditingMemo(null);
    setForm(MEMO_EMPTY_FORM);
  }

  function setFormField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function saveMemo() {
    const validationError = validateMemoForm(form);

    if (validationError) {
      setErrorMsg(validationError);
      return false;
    }

    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      if (editingMemo) {
        await updateAnalysisMemo(
          projectId,
          editingMemo.id,
          buildMemoUpdatePayload(form, editingMemo.revision)
        );
        setSuccessMsg("El memo se actualizó correctamente.");
      } else {
        await createAnalysisMemo(projectId, buildMemoCreatePayload(form));
        setSuccessMsg("El memo se creó correctamente.");
      }

      closeModal();
      await loadMemos({ soft: true });
      return true;
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeMemo(memo) {
    if (!memo?.id) return;

    const confirmed = window.confirm("¿Seguro que quieres eliminar este memo?");
    if (!confirmed) return;

    try {
      setDeletingId(memo.id);
      setErrorMsg("");
      setSuccessMsg("");

      await deleteAnalysisMemo(projectId, memo.id);
      setSuccessMsg("El memo se eliminó correctamente.");
      await loadMemos({ soft: true });
    } catch (error) {
      setErrorMsg(getFriendlyAnalysisError(error));
    } finally {
      setDeletingId("");
    }
  }

  async function openLinksPanel(memo) {
    const request = ++linkRequestRef.current;
    const isCurrent = () => linkRequestRef.current === request;
    setLinksMemo(memo);
    setLinks([]);
    setCanLink(false);
    setLinkForm({ link_type: "code", code_id: "", segment_id: "", document_id: "", participant_id: "" });
    setLinkSearchDraft("");
    setLinkResourceQuery({ search: "", offset: 0 });

    if (!memo?.id) return;

    try {
      setLinksLoading(true);
      setErrorMsg("");
      const [linksResult, projectResult] = await Promise.allSettled([
        getAnalysisMemoLinks(projectId, memo.id),
        requestJson(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" }, "No se pudieron cargar los permisos."),
      ]);
      if (!isCurrent()) return;
      const errors = [];
      const memoLinks = linksResult.status === "fulfilled" ? getLinksPayload(linksResult.value) : [];
      setLinks(memoLinks);
      setLinksLoadFailed(linksResult.status === "rejected");
      if (linksResult.status === "rejected") errors.push(getFriendlyAnalysisError(linksResult.reason));
      if (projectResult.status === "rejected") errors.push(getFriendlyAnalysisError(projectResult.reason));
      setCanLink(linksResult.status === "fulfilled" && projectResult.status === "fulfilled" && ["owner", "editor"].includes(projectResult.value?.project?.my_role));
      errors.push(...await loadLinkCatalog(memoLinks, isCurrent));
      if (isCurrent()) setErrorMsg([...new Set(errors)].join(" "));
    } catch (error) {
      if (isCurrent()) setErrorMsg(getFriendlyAnalysisError(error));
    } finally {
      if (isCurrent()) setLinksLoading(false);
    }
  }

  async function loadLinkCatalog(memoLinks, isCurrent) {
    const errors = [];
    if (!projectId) return errors;
    const targets = [...new Map(memoLinks.filter(link => ["document", "participant"].includes(link.link_type)).map(link => [
      `${link.link_type}:${link[`${link.link_type}_id`]}`, link,
    ])).values()];
                                                                              
                                                                    
    for (let offset = 0; offset < targets.length; offset += 5) {
      if (!isCurrent()) return errors;
      const results = await Promise.allSettled(targets.slice(offset, offset + 5).map(async link => {
        const type = link.link_type;
        const json = await (type === "document" ? getCorpusDocument : getCorpusParticipant)(projectId, link[`${type}_id`]);
        return { key: type === "document" ? "documents" : "participants", item: json[type] };
      }));
      if (!isCurrent()) return errors;
      const resolved = [];
      for (const result of results) {
        if (result.status === "fulfilled") resolved.push(result.value);
        else errors.push(getFriendlyAnalysisError(result.reason));
      }
      setLinkCatalog(previous => {
        const next = { ...previous };
        for (const { key, item } of resolved) {
          if (item?.id) next[key] = [...new Map([...next[key], item].map(row => [row.id, row])).values()];
        }
        return next;
      });
    }
    if (!linkCatalogLoadedRef.current) {
      try {
        const json = await getAnalysisSegments(projectId, { status: "all", limit: 200, offset: 0 });
        if (!isCurrent()) return errors;
        setLinkCatalog(previous => ({ ...previous, segments: Array.isArray(json?.segments) ? json.segments : [] }));
        linkCatalogLoadedRef.current = true;
      } catch (error) { errors.push(getFriendlyAnalysisError(error)); }
    }
    return errors;
  }

  function closeLinksPanel() {
    linkRequestRef.current += 1;
    setLinksMemo(null);
    setLinks([]);
    setCanLink(false);
  }

  function setLinkField(name, value) {
    if (name === "link_type") {
      setLinkSearchDraft("");
      setLinkResourceQuery({ search: "", offset: 0 });
      setLinkResourcePage({ items: [], loading: true, error: "", hasMore: false });
    }
    setLinkForm((prev) => ({
      ...(name === "link_type" ? { code_id: "", segment_id: "", document_id: "", participant_id: "" } : prev),
      [name]: value,
    }));
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function createLink() {
    if (!linksMemo?.id || !canLink || linksLoading || linkMutationRef.current) return false;

    const targetKey = `${linkForm.link_type}_id`;
    const payload = { link_type: linkForm.link_type, [targetKey]: String(linkForm[targetKey] ?? "").trim() };

    if (!["code", "segment", "document", "participant"].includes(linkForm.link_type) || !payload[targetKey]) {
      setErrorMsg("Selecciona un recurso para vincular.");
      return false;
    }
    const request = linkRequestRef.current;

    try {
      linkMutationRef.current = true;
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await createAnalysisMemoLink(projectId, linksMemo.id, payload);
      if (linkRequestRef.current !== request) return true;
      setSuccessMsg("El vínculo se creó correctamente.");
      await openLinksPanel(linksMemo);
      return true;
    } catch (error) {
      if (linkRequestRef.current === request) setErrorMsg(getFriendlyAnalysisError(error));
      return false;
    } finally {
      linkMutationRef.current = false;
      setSaving(false);
    }
  }

  async function removeLink(link) {
    if (!linksMemo?.id || !link?.id || !canLink || linksLoading || linkMutationRef.current) return;

    const request = linkRequestRef.current;
    try {
      linkMutationRef.current = true;
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await deleteAnalysisMemoLink(projectId, linksMemo.id, link.id);
      if (linkRequestRef.current !== request) return;
      setSuccessMsg("El vínculo se eliminó correctamente.");
      await openLinksPanel(linksMemo);
    } catch (error) {
      if (linkRequestRef.current === request) setErrorMsg(getFriendlyAnalysisError(error));
    } finally {
      linkMutationRef.current = false;
      setSaving(false);
    }
  }

  return {
    memos,
    codes,
    filters,
    loading,
    refreshing,
    saving,
    deletingId,
    errorMsg,
    successMsg,
    modalOpen,
    editingMemo,
    form,
    linksMemo,
    links,
    linksLoading,
    linksLoadFailed,
    linkCatalog,
    linkForm,
    canLink,
    linkSearchDraft,
    linkResourcePage,
    linkResourceQuery,
    setLinkSearchDraft,
    searchLinkResources: () => {
      setLinkForm(previous => ({ ...previous, document_id: "", participant_id: "" }));
      setLinkResourceQuery({ search: linkSearchDraft.trim(), offset: 0 });
    },
    changeLinkResourcePage: delta => {
      setLinkForm(previous => ({ ...previous, document_id: "", participant_id: "" }));
      setLinkResourceQuery(previous => ({ ...previous, offset: Math.max(0, previous.offset + delta * 50) }));
    },
    retryLinkResources: () => setLinkResourceQuery(previous => ({ ...previous })),
    updateFilter,
    openCreateModal,
    openEditModal,
    closeModal,
    setFormField,
    saveMemo,
    removeMemo,
    openLinksPanel,
    closeLinksPanel,
    setLinkField,
    createLink,
    removeLink,
    reload: () => loadMemos({ soft: true }),
  };
}
