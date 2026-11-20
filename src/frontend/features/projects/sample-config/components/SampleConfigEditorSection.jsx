"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/common/Icon";
import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import SampleConfigVersionsModal from "@/features/projects/sample-config/components/SampleConfigVersionsModal";
import { useSampleConfigContext } from "@/features/projects/sample-config/components/SampleConfigProvider";
import { FieldHelpLabel } from "@/features/projects/workspace/field-help";
import AnnotatedTextarea from "@/features/projects/delimitation/components/AnnotatedTextarea";
import { createProjectExportAction } from "@/features/projects/exports/helpers/projectExports.helpers";
import { getNextProjectStepLabel } from "@/features/projects/workspace/workspaceWorkflowNavigation";

function FieldShell({
  label,
  hint,
  children,
  phase,
  field,
  required = false,
  anchorId = "",
}) {
  return (
    <div
  id={anchorId || undefined}
  data-field-key={field || undefined}
  className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-4"
>
      <div className="mb-3 min-h-[72px]">
        {phase && field ? (
          <FieldHelpLabel
            phase={phase}
            field={field}
            tooltipPosition="right"
            required={required}
            labelClassName="text-slate-400"
          >
            {label}
          </FieldHelpLabel>
        ) : (
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            {label}
          </p>
        )}

        {hint ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function RefreshBanner({ refreshError, isRefreshing, onRetry }) {
  if (!isRefreshing && !refreshError) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        refreshError
          ? "border-amber-200 bg-amber-50"
          : "border-[#005944]/15 bg-[#005944]/5"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${
              refreshError
                ? "bg-amber-100 text-amber-700"
                : "bg-[#005944]/10 text-[#005944]"
            }`}
          >
            <Icon
              name={refreshError ? "warning" : "sync"}
              className={`text-lg ${isRefreshing ? "animate-spin" : ""}`}
            />
          </span>

          <div>
            <p
              className={`text-sm font-black uppercase tracking-widest ${
                refreshError ? "text-amber-700" : "text-[#005944]"
              }`}
            >
              {refreshError ? "No se pudo actualizar" : "Actualizando datos"}
            </p>
            <p
              className={`mt-1 text-sm ${
                refreshError ? "text-amber-700/90" : "text-slate-600"
              }`}
            >
              {refreshError
                ? refreshError
                : "Se está sincronizando la información más reciente sin cerrar el editor."}
            </p>
          </div>
        </div>

        {refreshError ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700"
          >
            <Icon name="refresh" className="text-base" />
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function SampleConfigEditorSection() {
  const router = useRouter();
  const [exportError, setExportError] = useState("");
  const {
    projectId,
    bootstrapping,
    isReady,
    loadError,
    refreshError,
    isRefreshing,
    reload,

    savingState,
    savingError,

    options,
    model,
    fieldHighlights,

    setField,

    isTechniqueSelected,
    toggleStandardTechnique,
    removeTechnique,

    customTechniqueInput,
    setCustomTechniqueInput,
    customTechniqueError,
    addCustomTechnique,

    openVersions,
    versionActionState,
    versionActionError,
    createVersionCurrent,
  } = useSampleConfigContext();

  const showBlockingError = !bootstrapping && !isReady && !!loadError;
  if (bootstrapping) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
        Cargando configuración de muestra...
      </div>
    );
  }

  return (
    <>
    <WorkspaceEditorCard
      title="Editor de Muestra"
      icon="groups"
      savingState={savingState}
      savingError={exportError || savingError}
      secondaryActions={[
        {
          icon: "history",
          label: "Versiones anteriores",
          onClick: openVersions,
          disabled: !isReady || versionActionState === "restoring",
        },
        {
          icon: "bookmark_add",
          label:
            versionActionState === "saving"
              ? "Guardando versión..."
              : "Guardar versión",
          onClick: createVersionCurrent,
          disabled:
            !isReady ||
            versionActionState === "saving" ||
            versionActionState === "restoring",
        },
        createProjectExportAction({
          projectId,
          exportType: "protocol",
          format: "docx",
          label: "Exportar protocolo",
          onError: setExportError,
        }),
        createProjectExportAction({
          projectId,
          exportType: "protocol",
          format: "pdf",
          label: "Protocolo PDF",
          onError: setExportError,
        }),
      ]}
      primaryActionLabel={getNextProjectStepLabel("sample")}
      primaryActionIcon="arrow_forward"
      onPrimaryAction={() =>
        router.push(`/projects/${encodeURIComponent(projectId)}/corpus`)
      }
      primaryActionDisabled={!projectId || savingState === "saving"}
    >
      {exportError ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{exportError}</p> : null}
      {showBlockingError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Icon name="error" className="text-xl" />
            </span>

            <div className="flex-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-red-700">
                No se pudo cargar la fase
              </h3>
              <p className="mt-2 text-sm text-red-700/90">{loadError}</p>

              <button
                type="button"
                onClick={reload}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#005944] px-4 py-2 text-sm font-semibold text-white"
              >
                <Icon name="refresh" className="text-base" />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!bootstrapping && isReady ? (
        <div className="space-y-5">
          <RefreshBanner
            refreshError={refreshError}
            isRefreshing={isRefreshing}
            onRetry={reload}
          />

          {savingState === "conflict" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {savingError}
            </div>
          ) : null}

          {savingState === "error" && savingError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {savingError}
            </div>
          ) : null}

          {versionActionState === "error" && versionActionError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {versionActionError}
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-2">
            <FieldShell
  label="Enfoque principal"
  hint="Selecciona el enfoque metodológico principal de esta muestra."
  field="main_approach_code"
  anchorId="sampleConfig-main_approach_code"
>
              <select
                value={model.main_approach_code}
                onChange={(e) => setField("main_approach_code", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#005944]"
              >
                <option value="">Selecciona una opción</option>
                {options.main_approaches.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldShell>

            <FieldShell
  label="Alcance"
  hint="Selecciona el alcance principal de la fase de muestra"
  field="scope_code"
  anchorId="sampleConfig-scope_code"
>
              <select
                value={model.scope_code}
                onChange={(e) => setField("scope_code", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#005944]"
              >
                <option value="">Selecciona una opción</option>
                {options.scopes.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>

          <FieldShell
            label="Técnicas de recolección"
            hint="Puedes combinar técnicas estándar y agregar técnicas personalizadas."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {options.collection_technique_options.map((item) => (
                <label
                  key={item.code}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                    isTechniqueSelected(item.code)
                      ? "border-[#005944]/20 bg-[#005944]/5"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isTechniqueSelected(item.code)}
                    onChange={() => toggleStandardTechnique(item.code)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#005944] focus:ring-[#005944]"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.label}
                    </p>
                    {item.description ? (
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>

            <div
              id="sampleConfig-custom_technique"
              className="mt-5 scroll-mt-28 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"
            >
              <FieldHelpLabel
                phase="sampleConfig"
                field="custom_technique"
                tooltipPosition="right"
                labelClassName="text-slate-400"
              >
                Agregar otra técnica
              </FieldHelpLabel>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Usa este campo solo si la técnica que necesitas no aparece en la
                lista estándar.
              </p>

              <div className="mt-3 flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={customTechniqueInput}
                  onChange={(e) => setCustomTechniqueInput(e.target.value)}
                  placeholder="Ej. Cartografía social"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#005944]"
                />

                <button
                  type="button"
                  onClick={addCustomTechnique}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005944] px-4 py-3 text-sm font-semibold text-white"
                >
                  <Icon name="add" className="text-base" />
                  Agregar
                </button>
              </div>

              {customTechniqueError ? (
                <p className="mt-2 text-sm text-amber-700">
                  {customTechniqueError}
                </p>
              ) : null}
            </div>

            {model.collection_techniques.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {model.collection_techniques.map((item) => {
                  const label = item.is_custom
                    ? item.custom_label
                    : options.collection_technique_options.find(
                        (opt) => opt.code === item.technique_code
                      )?.label || item.technique_code;

                  return (
                    <span
                      key={item.clientId}
                      className="inline-flex items-center gap-2 rounded-full border border-[#005944]/15 bg-[#005944]/5 px-3 py-2 text-xs font-semibold text-[#005944]"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => removeTechnique(item.clientId)}
                        className="rounded-full p-0.5 hover:bg-[#005944]/10"
                        aria-label={`Eliminar ${label}`}
                      >
                        <Icon name="close" className="text-sm" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Todavía no has agregado ninguna técnica.
              </p>
            )}
          </FieldShell>

          <div className="grid gap-5 xl:grid-cols-2">
            <FieldShell
              label="Fase de campo"
              hint="Describe brevemente en qué etapa del trabajo de campo se encuentra esta muestra."
              phase="sampleConfig"
              field="field_phase"
              anchorId="sampleConfig-field_phase"
            >
              <AnnotatedTextarea
                value={model.field_phase}
                onChange={(value) => setField("field_phase", value)}
                highlights={fieldHighlights?.field_phase ?? []}
                minHeightClass="min-h-[132px]"
                placeholder="Ej. Trabajo de campo inicial con acceso preliminar a comunidades urbanas."
              />
            </FieldShell>

            <FieldShell
              label="Tamaño de muestra"
              hint="Ingresa el número estimado de participantes o unidades esperadas."
              phase="sampleConfig"
              field="target_sample_size"
              anchorId="sampleConfig-target_sample_size"
            >
              <input
                type="number"
                min="1"
                value={model.target_sample_size}
                onChange={(e) => setField("target_sample_size", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#005944]"
                placeholder="Ej. 12"
              />
            </FieldShell>
          </div>

          <FieldShell
            label="Justificación del tamaño de muestra"
            hint="Explica por qué ese tamaño es razonable para esta fase."
            phase="sampleConfig"
            field="sample_size_rationale"
            anchorId="sampleConfig-sample_size_rationale"
          >
            <AnnotatedTextarea
              value={model.sample_size_rationale}
              onChange={(value) => setField("sample_size_rationale", value)}
              highlights={fieldHighlights?.sample_size_rationale ?? []}
              minHeightClass="min-h-[150px]"
              placeholder="Ej. Se estima suficiente para lograr saturación teórica preliminar dentro del tiempo disponible."
            />
          </FieldShell>

        </div>
      ) : null}
    </WorkspaceEditorCard>
    <SampleConfigVersionsModal />
  </>
  );
}
