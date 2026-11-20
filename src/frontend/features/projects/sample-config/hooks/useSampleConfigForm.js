"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildSampleConfigComparableSnapshot,
  buildSampleConfigFormModel,
  buildSampleConfigPayload,
} from "@/features/projects/sample-config/helpers/sampleConfig.helpers";

function createClientId() {
  return `tmp_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function useSampleConfigForm(sampleData) {
  const initialBaseModel = buildSampleConfigFormModel(sampleData);
  const initialBaseSnapshot =
    buildSampleConfigComparableSnapshot(initialBaseModel);

  const [baseModel, setBaseModel] = useState(initialBaseModel);
  const [baseSnapshot, setBaseSnapshot] = useState(initialBaseSnapshot);
  const [model, setModel] = useState(initialBaseModel);
  const [customTechniqueInput, setCustomTechniqueInput] = useState("");

  const didHydrateRef = useRef(false);
  const baseSnapshotRef = useRef(initialBaseSnapshot);
  const previousProjectIdRef = useRef(sampleData?.config?.project_id ?? "");

  const serverRevision = sampleData?.config?.revision ?? 0;
  const currentProjectId = sampleData?.config?.project_id ?? "";

  useEffect(() => {
    const nextBaseModel = buildSampleConfigFormModel(sampleData);
    const nextBaseSnapshot =
      buildSampleConfigComparableSnapshot(nextBaseModel);
    const previousBaseSnapshot = baseSnapshotRef.current;
    const projectChanged = previousProjectIdRef.current !== currentProjectId;

    setBaseModel(nextBaseModel);
    setBaseSnapshot(nextBaseSnapshot);

    setModel((prevModel) => {
      const prevModelSnapshot =
        buildSampleConfigComparableSnapshot(prevModel);
      const hadLocalChanges = prevModelSnapshot !== previousBaseSnapshot;

      if (projectChanged || !didHydrateRef.current || !hadLocalChanges) {
        return nextBaseModel;
      }

      return prevModel;
    });

    if (projectChanged || !didHydrateRef.current) {
      setCustomTechniqueInput("");
    }

    didHydrateRef.current = true;
    baseSnapshotRef.current = nextBaseSnapshot;
    previousProjectIdRef.current = currentProjectId;
  }, [sampleData, currentProjectId]);

  const currentSnapshot = useMemo(
    () => buildSampleConfigComparableSnapshot(model),
    [model]
  );

  const isDirty = currentSnapshot !== baseSnapshot;

  const selectedStandardTechniqueCodes = useMemo(() => {
    return new Set(
      model.collection_techniques
        .filter((item) => !item.is_custom && item.technique_code)
        .map((item) => item.technique_code)
    );
  }, [model.collection_techniques]);

  const customTechniques = useMemo(() => {
    return model.collection_techniques.filter((item) => item.is_custom);
  }, [model.collection_techniques]);

  const setField = useCallback((field, value) => {
    setModel((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const isTechniqueSelected = useCallback(
    (code) => selectedStandardTechniqueCodes.has(code),
    [selectedStandardTechniqueCodes]
  );

  const toggleStandardTechnique = useCallback((code) => {
    setModel((prev) => {
      const exists = prev.collection_techniques.some(
        (item) => !item.is_custom && item.technique_code === code
      );

      if (exists) {
        return {
          ...prev,
          collection_techniques: prev.collection_techniques.filter(
            (item) => !(item.is_custom === false && item.technique_code === code)
          ),
        };
      }

      return {
        ...prev,
        collection_techniques: [
          ...prev.collection_techniques,
          {
            clientId: createClientId(),
            technique_code: code,
            custom_label: null,
            is_custom: false,
          },
        ],
      };
    });
  }, []);

  const removeTechnique = useCallback((clientId) => {
    setModel((prev) => ({
      ...prev,
      collection_techniques: prev.collection_techniques.filter(
        (item) => item.clientId !== clientId
      ),
    }));
  }, []);

  const customTechniqueError = useMemo(() => {
    const trimmed = customTechniqueInput.trim();

    if (!trimmed) return "";

    const duplicate = model.collection_techniques.some(
      (item) =>
        item.is_custom &&
        String(item.custom_label || "")
          .trim()
          .toLowerCase() === trimmed.toLowerCase()
    );

    if (duplicate) {
      return "Esa técnica personalizada ya fue agregada.";
    }

    return "";
  }, [customTechniqueInput, model.collection_techniques]);

  const addCustomTechnique = useCallback(() => {
    const trimmed = customTechniqueInput.trim();

    if (!trimmed) return false;

    const duplicate = model.collection_techniques.some(
      (item) =>
        item.is_custom &&
        String(item.custom_label || "")
          .trim()
          .toLowerCase() === trimmed.toLowerCase()
    );

    if (duplicate) return false;

    setModel((prev) => ({
      ...prev,
      collection_techniques: [
        ...prev.collection_techniques,
        {
          clientId: createClientId(),
          technique_code: null,
          custom_label: trimmed,
          is_custom: true,
        },
      ],
    }));

    setCustomTechniqueInput("");
    return true;
  }, [customTechniqueInput, model.collection_techniques]);

  const buildPayload = useCallback(() => {
    return buildSampleConfigPayload(model, serverRevision);
  }, [model, serverRevision]);

  return {
    baseModel,
    model,
    setModel,
    isDirty,
    serverRevision,
    currentSnapshot,

    setField,

    isTechniqueSelected,
    toggleStandardTechnique,
    removeTechnique,

    customTechniqueInput,
    setCustomTechniqueInput,
    customTechniqueError,
    addCustomTechnique,
    customTechniques,

    buildPayload,
  };
}