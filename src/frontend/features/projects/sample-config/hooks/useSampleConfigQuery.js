"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getSampleConfig,
  getSampleConfigOptions,
} from "@/features/projects/sample-config/api/sampleConfig.api";
import {
  EMPTY_SAMPLE_OPTIONS,
  normalizeSampleConfigLoadResponse,
  normalizeSampleConfigOptions,
  normalizeSampleConfigResponse,
} from "@/features/projects/sample-config/helpers/sampleConfig.helpers";

export function useSampleConfigQuery(projectId) {
  const [dataStatus, setDataStatus] = useState("loading");
  const [optionsStatus, setOptionsStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [sampleData, setSampleData] = useState(() =>
    normalizeSampleConfigResponse(projectId, null)
  );
  const [options, setOptions] = useState(EMPTY_SAMPLE_OPTIONS);

  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setDataStatus("loading");
    setOptionsStatus("loading");
    setLoadError("");
    setRefreshError("");
    setIsRefreshing(false);
    setHasLoadedOnce(false);
    setSampleData(normalizeSampleConfigResponse(projectId, null));
    setOptions(EMPTY_SAMPLE_OPTIONS);
  }, [projectId]);

  const reload = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  const applySampleConfigData = useCallback(
    (payload) => {
      setSampleData(normalizeSampleConfigResponse(projectId, payload));
      setDataStatus("success");
      setLoadError("");
      setRefreshError("");
      setHasLoadedOnce(true);
    },
    [projectId]
  );

  const applySampleConfigOptions = useCallback((payload) => {
    setOptions(normalizeSampleConfigOptions(payload));
    setOptionsStatus("success");
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSampleConfig() {
      const isInitialLoad = !hasLoadedOnce;

      try {
        if (!projectId) {
          throw new Error("Project id inválido.");
        }

        if (isInitialLoad) {
          setDataStatus("loading");
          setOptionsStatus("loading");
          setLoadError("");
        } else {
          setIsRefreshing(true);
          setRefreshError("");
        }

        const sampleConfig = await getSampleConfig(projectId);
        const normalized = normalizeSampleConfigLoadResponse(
          projectId,
          sampleConfig
        );
        const sampleOptions = normalized.hasEmbeddedOptions
          ? normalized.options
          : normalizeSampleConfigOptions(await getSampleConfigOptions(projectId));

        if (!mounted) return;

        applySampleConfigData(normalized.sampleData);
        applySampleConfigOptions(sampleOptions);
      } catch (error) {
        if (!mounted) return;

        const message =
          error?.message || "Ocurrió un error cargando la fase de muestra.";

        if (isInitialLoad) {
          setDataStatus("error");
          setOptionsStatus("error");
          setLoadError(message);
        } else {
          setRefreshError(message);
        }
      } finally {
        if (mounted) {
          setIsRefreshing(false);
        }
      }
    }

    loadSampleConfig();

    return () => {
      mounted = false;
    };
  }, [
    projectId,
    reloadTick,
    hasLoadedOnce,
    applySampleConfigData,
    applySampleConfigOptions,
  ]);

  const bootstrapping =
    !hasLoadedOnce &&
    (dataStatus === "loading" || optionsStatus === "loading");

  const isReady =
    hasLoadedOnce &&
    dataStatus === "success" &&
    optionsStatus === "success" &&
    !loadError;

  return {
    dataStatus,
    optionsStatus,
    loadError,
    refreshError,
    isRefreshing,

    sampleData,
    options,

    bootstrapping,
    isReady,
    reload,

    applySampleConfigData,
    applySampleConfigOptions,
  };
}
