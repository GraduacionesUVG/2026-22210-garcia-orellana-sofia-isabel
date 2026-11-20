"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAnalysisSegments } from "@/features/projects/analysis/api/analysis.api";

const SEARCH_DEBOUNCE_MS = 250;
const QUEUE_CACHE_TTL_MS = 15_000;

const DEFAULT_FILTERS = {
  status: "all",
  search: "",
  document_id: "",
  limit: 200,
  offset: 0,
};

function getSegmentsPayload(json) {
  return Array.isArray(json?.segments) ? json.segments : [];
}

function getCountsPayload(json) {
  return {
    all: Number(json?.counts?.all ?? 0),
    coded: Number(json?.counts?.coded ?? 0),
    uncoded: Number(json?.counts?.uncoded ?? 0),
  };
}

function filterCachedSegments(json, status) {
  const allSegments = getSegmentsPayload(json);
  const segments =
    status === "coded"
      ? allSegments.filter((segment) => segment.is_coded)
      : allSegments.filter((segment) => !segment.is_coded);

  return {
    ...json,
    segments,
    total: segments.length,
  };
}

export function useAnalysisSegmentsQueue(projectId, options = {}) {
  const { initialStatus = "all" } = options;
  const [segments, setSegments] = useState([]);
  const [counts, setCounts] = useState({ all: 0, coded: 0, uncoded: 0 });
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    status: initialStatus,
  });
  const [documentOptions, setDocumentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const requestRef = useRef(0);
  const cacheRef = useRef(new Map());
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setRequestSearch(filters.search);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [filters.search]);

  const requestFilters = useMemo(
    () => ({ ...filters, search: requestSearch }),
    [filters, requestSearch]
  );

  const loadSegments = useCallback(
    async ({ soft = false } = {}) => {
      if (!projectId) return;

      if (soft) cacheRef.current.clear();

      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      const cacheKey = JSON.stringify(requestFilters);
      const cached = cacheRef.current.get(cacheKey);
      const completeAllKey = JSON.stringify({
        ...requestFilters,
        status: "all",
      });
      const completeAll = cacheRef.current.get(completeAllKey);

      if (
        !soft &&
        requestFilters.status !== "all" &&
        !requestFilters.search &&
        completeAll &&
        completeAll.expiresAt > Date.now() &&
        Number(completeAll.json?.total ?? 0) <=
          getSegmentsPayload(completeAll.json).length
      ) {
        const derived = filterCachedSegments(
          completeAll.json,
          requestFilters.status
        );
        cacheRef.current.set(cacheKey, {
          json: derived,
          expiresAt: Date.now() + QUEUE_CACHE_TTL_MS,
        });
        setSegments(getSegmentsPayload(derived));
        setCounts(getCountsPayload(derived));
        setTotal(Number(derived.total ?? 0));
        setErrorMsg("");
        setLoading(false);
        setRefreshing(false);
        hasLoadedRef.current = true;
        return;
      }

      if (!soft && cached && cached.expiresAt > Date.now()) {
        const nextSegments = getSegmentsPayload(cached.json);
        setSegments(nextSegments);
        setCounts(getCountsPayload(cached.json));
        setTotal(Number(cached.json?.total ?? nextSegments.length));
        setErrorMsg("");
        setLoading(false);
        setRefreshing(false);
        hasLoadedRef.current = true;
        return;
      }

      try {
        if (soft || hasLoadedRef.current) setRefreshing(true);
        else setLoading(true);
        setErrorMsg("");

        const json = await getAnalysisSegments(projectId, requestFilters);
        if (requestId !== requestRef.current) return;

        const nextSegments = getSegmentsPayload(json);

        setSegments(nextSegments);
        setCounts(getCountsPayload(json));
        setTotal(Number(json?.total ?? nextSegments.length));
        cacheRef.current.set(cacheKey, {
          json,
          expiresAt: Date.now() + QUEUE_CACHE_TTL_MS,
        });
        setDocumentOptions((current) => {
          const optionsById = new Map(
            current.map((item) => [item.value, item])
          );

          nextSegments.forEach((segment) => {
            if (!segment?.document_id) return;
            optionsById.set(segment.document_id, {
              value: segment.document_id,
              label: segment.document_title || "Documento",
            });
          });

          return Array.from(optionsById.values()).sort((a, b) =>
            a.label.localeCompare(b.label, "es")
          );
        });
        hasLoadedRef.current = true;
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (requestId !== requestRef.current) return;
        setErrorMsg(
          error?.message ?? "No se pudieron cargar los segmentos del análisis."
        );
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [projectId, requestFilters]
  );

  useEffect(() => {
    loadSegments();

    return () => {
      requestRef.current += 1;
    };
  }, [loadSegments]);

  function updateFilter(name, value) {
    setFilters((current) => {
      if (current[name] === value) return current;

      return {
        ...current,
        [name]: value,
        offset: 0,
      };
    });
  }

  function resetFilters() {
    setFilters({ ...DEFAULT_FILTERS, status: initialStatus });
  }

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
          filters.document_id ||
          filters.status !== initialStatus
      ),
    [filters, initialStatus]
  );
  const reload = useCallback(() => loadSegments({ soft: true }), [loadSegments]);

  return {
    segments,
    counts,
    total,
    filters,
    documentOptions,
    loading,
    refreshing,
    errorMsg,
    hasActiveFilters,
    updateFilter,
    resetFilters,
    reload,
  };
}
