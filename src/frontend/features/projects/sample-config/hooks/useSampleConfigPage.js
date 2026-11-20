"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useSampleConfigQuery } from "@/features/projects/sample-config/hooks/useSampleConfigQuery";
import { useSampleConfigForm } from "@/features/projects/sample-config/hooks/useSampleConfigForm";
import { useSampleConfigMutations } from "@/features/projects/sample-config/hooks/useSampleConfigMutations";
import { useSampleConfigAutosave } from "@/features/projects/sample-config/hooks/useSampleConfigAutosave";
import {
  buildDraftCollectionTechniques,
  buildDraftConfigFromModel,
  buildSampleConfigProgressFromModel,
} from "@/features/projects/sample-config/helpers/sampleConfig.helpers";

export function useSampleConfigPage(projectId) {
  const query = useSampleConfigQuery(projectId);
  const form = useSampleConfigForm(query.sampleData);
  const mutations = useSampleConfigMutations();

  useEffect(() => {
    if (mutations.savingState === "success" && form.isDirty) {
      mutations.resetSaveFeedback();
    }
  }, [form.isDirty, mutations]);

  const applyServerSampleConfigData = useCallback(
    (data) => {
      query.applySampleConfigData(data);
    },
    [query]
  );

  const saveCurrent = useCallback(async () => {
    if (!projectId || !query.isReady) return null;
    if (mutations.savingState === "saving") return null;

    const payload = form.buildPayload();

    try {
      const data = await mutations.saveSampleConfig(projectId, payload);
      applyServerSampleConfigData(data);
      return data;
    } catch (error) {
      if (error?.status === 409) {
        await query.reload();
      }
      throw error;
    }
  }, [projectId, query, form, mutations, applyServerSampleConfigData]);

  useSampleConfigAutosave({
    enabled: !!projectId && query.isReady && !query.isRefreshing,
    isDirty: form.isDirty,
    changeKey: form.currentSnapshot,
    savingState: mutations.savingState,
    delay: 1400,
    onAutosave: saveCurrent,
  });

  const progress = useMemo(
    () => buildSampleConfigProgressFromModel(form.model),
    [form.model]
  );

  const config = useMemo(() => {
    return buildDraftConfigFromModel(
      projectId,
      query.sampleData?.config ?? null,
      form.model
    );
  }, [projectId, query.sampleData, form.model]);

  const collectionTechniques = useMemo(() => {
    return buildDraftCollectionTechniques(projectId, form.model);
  }, [projectId, form.model]);

  const canManualSave =
    query.isReady &&
    form.isDirty &&
    mutations.savingState !== "saving" &&
    !query.bootstrapping;

  return {
    projectId,

    bootstrapping: query.bootstrapping,
    isReady: query.isReady,
    dataStatus: query.dataStatus,
    optionsStatus: query.optionsStatus,
    loadError: query.loadError,
    refreshError: query.refreshError,
    isRefreshing: query.isRefreshing,
    reload: query.reload,

    sampleData: query.sampleData,
    options: query.options,

    model: form.model,
    setModel: form.setModel,
    isDirty: form.isDirty,
    progress,
    canManualSave,

    config,
    collectionTechniques,

    savingState: mutations.savingState,
    savingError: mutations.savingError,

    setField: form.setField,

    isTechniqueSelected: form.isTechniqueSelected,
    toggleStandardTechnique: form.toggleStandardTechnique,
    removeTechnique: form.removeTechnique,

    customTechniqueInput: form.customTechniqueInput,
    setCustomTechniqueInput: form.setCustomTechniqueInput,
    customTechniqueError: form.customTechniqueError,
    addCustomTechnique: form.addCustomTechnique,
    customTechniques: form.customTechniques,

    saveCurrent,
    applyServerSampleConfigData,
  };
}