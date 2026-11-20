"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import FieldTopic from "@/features/projects/delimitation/components/FieldTopic";
import FieldContext from "@/features/projects/delimitation/components/FieldContext";
import FieldPopulation from "@/features/projects/delimitation/components/FieldPopulation";
import FieldResources from "@/features/projects/delimitation/components/FieldResources";
import CriteriaEditor from "@/features/projects/delimitation/components/CriteriaEditor";
import WorkspaceEditorCard from "@/features/projects/workspace/components/WorkspaceEditorCard";
import { getNextProjectStepLabel } from "@/features/projects/workspace/workspaceWorkflowNavigation";

const EMPTY_HEURISTICS = {
  fieldHighlights: {
    topic: [],
    context_place: [],
    time_period: [],
    population: [],
    resources: [],
  },
  signals: [],
  jackQuestion: "",
  totalHighlights: 0,
};

const FIELD_LABELS = {
  topic: "Tema de investigación",
  context_place: "Contexto espacial",
  time_period: "Periodo",
  population: "Población de estudio",
  resources: "Recursos",
  include: "Criterios de inclusión",
  exclude: "Criterios de exclusión",
};

const REQUIRED_FIELDS = new Set([
  "topic",
  "context_place",
  "time_period",
  "population",
]);

function normalizeText(value) {
  return String(value ?? "").trim();
}

function getSignalTone(signal = {}) {
  const raw = `${signal?.level ?? ""} ${signal?.severity ?? ""} ${
    signal?.kind ?? ""
  }`.toLowerCase();

  if (
    raw.includes("muy amplio") ||
    raw.includes("importante") ||
    raw.includes("alta") ||
    raw.includes("critical") ||
    raw.includes("crítico")
  ) {
    return "critical";
  }

  if (
    raw.includes("pendiente") ||
    raw.includes("revisar") ||
    raw.includes("difuso") ||
    raw.includes("media") ||
    raw.includes("warning") ||
    raw.includes("mejora")
  ) {
    return "warning";
  }

  if (raw.includes("detalle") || raw.includes("baja") || raw.includes("info")) {
    return "info";
  }

  return "warning";
}

function toneRank(tone) {
  if (tone === "critical") return 3;
  if (tone === "warning") return 2;
  if (tone === "info") return 1;
  return 0;
}

function defaultFieldSuggestion(field) {
  switch (field) {
    case "topic":
      return "Agrega una dimensión observable como efecto, relación, percepción, uso, incidencia, comparación o desempeño.";
    case "context_place":
      return "Indica un lugar más concreto: ciudad, municipio, comunidad, institución, sede o zona específica.";
    case "time_period":
      return "Convierte el periodo en fechas, meses, ciclos o años concretos.";
    case "population":
      return "Aclara quiénes son exactamente: edad, rol, institución, condición, grado, cargo, sector o ubicación.";
    case "resources":
      return "Menciona fuentes, bases, documentos, instituciones, herramientas o accesos reales disponibles.";
    case "include":
      return "Agrega criterios que definan qué casos, personas, documentos o unidades sí entran al estudio.";
    case "exclude":
      return "Agrega criterios que definan qué casos, personas, documentos o unidades quedan fuera del estudio.";
    default:
      return "Revisa este campo y vuelve la redacción más concreta.";
  }
}

function defaultPendingMessage(field) {
  switch (field) {
    case "topic":
      return "Todavía falta definir el fenómeno o tema central de investigación.";
    case "context_place":
      return "Todavía falta indicar dónde ocurrirá el estudio.";
    case "time_period":
      return "Todavía falta definir el periodo temporal del estudio.";
    case "population":
      return "Todavía falta indicar quiénes serán los sujetos o grupo de estudio.";
    case "include":
      return "Todavía no hay criterios de inclusión definidos.";
    case "exclude":
      return "Todavía no hay criterios de exclusión definidos.";
    default:
      return "Este campo todavía está pendiente.";
  }
}

function normalizeSignalForField(signal = {}) {
  const field = normalizeText(signal?.field || "overall");
  const tone = getSignalTone(signal);

  const title =
    normalizeText(signal?.title) ||
    normalizeText(signal?.level) ||
    `${FIELD_LABELS[field] || "Campo"} necesita revisión`;

  const message =
    normalizeText(signal?.message) ||
    normalizeText(signal?.text) ||
    "Hay un punto que conviene revisar en este campo.";

  const suggestion =
    normalizeText(signal?.suggestion) || defaultFieldSuggestion(field);

  return {
    field,
    tone,
    title,
    message,
    suggestion,
    label: signal?.level || undefined,
    source: "signal",
  };
}

function normalizeHighlightForField(field, highlight = {}) {
  const tone =
    field === "topic" || field === "population" ? "critical" : "warning";

  return {
    field,
    tone,
    title:
      normalizeText(highlight?.title) ||
      `${FIELD_LABELS[field] || "Campo"} necesita más precisión`,
    message:
      normalizeText(highlight?.message) ||
      normalizeText(highlight?.tooltip) ||
      "Hay un fragmento marcado que puede volver el alcance demasiado amplio.",
    suggestion:
      normalizeText(highlight?.suggestion) || defaultFieldSuggestion(field),
    label: tone === "critical" ? "Importante" : "Revisar",
    source: "highlight",
  };
}

function normalizePendingForField(field) {
  return {
    field,
    tone: "warning",
    title: `${FIELD_LABELS[field] || "Campo"} pendiente`,
    message: defaultPendingMessage(field),
    suggestion: defaultFieldSuggestion(field),
    label: "Pendiente",
    source: "pending",
  };
}

function pickMostImportantState(candidates) {
  const valid = candidates.filter(Boolean);

  if (!valid.length) return null;

  return valid.sort((a, b) => toneRank(b.tone) - toneRank(a.tone))[0];
}

function buildFieldStates({ model, heuristics, review }) {
  const fieldHighlights =
    heuristics?.fieldHighlights ?? EMPTY_HEURISTICS.fieldHighlights;

  const heuristicSignals = Array.isArray(heuristics?.signals)
    ? heuristics.signals
    : [];

  const reviewSignals = Array.isArray(review?.signals) ? review.signals : [];

  const allSignals = [...heuristicSignals, ...reviewSignals];

  const fields = [
    "topic",
    "context_place",
    "time_period",
    "population",
    "resources",
    "include",
    "exclude",
  ];

  return fields.reduce((acc, field) => {
    const candidates = [];

    const value = model?.[field];

    if (REQUIRED_FIELDS.has(field) && !normalizeText(value)) {
      candidates.push(normalizePendingForField(field));
    }

    if (
      field === "include" &&
      (!Array.isArray(model?.include) || model.include.length === 0)
    ) {
      candidates.push(normalizePendingForField(field));
    }

    if (
      field === "exclude" &&
      (!Array.isArray(model?.exclude) || model.exclude.length === 0)
    ) {
      candidates.push(normalizePendingForField(field));
    }

    const highlights = Array.isArray(fieldHighlights?.[field])
      ? fieldHighlights[field]
      : [];

    if (highlights.length > 0) {
      candidates.push(normalizeHighlightForField(field, highlights[0]));
    }

    const fieldSignals = allSignals
      .filter((signal) => signal?.field === field)
      .map(normalizeSignalForField);

    candidates.push(...fieldSignals);

    acc[field] = pickMostImportantState(candidates);

    return acc;
  }, {});
}

export default function EditorCard({
  projectId,
  model,
  heuristics = EMPTY_HEURISTICS,
  review = null,
  setModel,
  savingState,
  savingError,
  onAddItem,
  onDeleteItem,
  onOpenVersions,
  onOpenCreateVersion,
}) {
  const router = useRouter();

  const fieldHighlights =
    heuristics?.fieldHighlights ?? EMPTY_HEURISTICS.fieldHighlights;

  const fieldStates = useMemo(
    () => buildFieldStates({ model, heuristics, review }),
    [model, heuristics, review]
  );

  function handleGoToResearchDesign() {
    if (!projectId) return;
    router.push(`/projects/${projectId}/research-design`);
  }

  return (
    <WorkspaceEditorCard
      title="Editor de Delimitación"
      savingState={savingState}
      savingError={savingError}
      secondaryActions={[
        {
          icon: "history",
          label: "Versiones anteriores",
          onClick: onOpenVersions,
        },
        {
          icon: "bookmark_add",
          label: "Guardar versión",
          onClick: onOpenCreateVersion,
        },
      ]}
      primaryActionLabel={getNextProjectStepLabel("delimitation")}
      onPrimaryAction={handleGoToResearchDesign}
      primaryActionDisabled={!projectId}
    >
      <FieldTopic
        value={model.topic}
        highlights={fieldHighlights.topic}
        fieldState={fieldStates.topic}
        onChange={(value) => setModel((prev) => ({ ...prev, topic: value }))}
      />

      <FieldContext
        contextPlace={model.context_place}
        timePeriod={model.time_period}
        contextPlaceHighlights={fieldHighlights.context_place}
        timePeriodHighlights={fieldHighlights.time_period}
        contextPlaceState={fieldStates.context_place}
        timePeriodState={fieldStates.time_period}
        onChangeContextPlace={(value) =>
          setModel((prev) => ({ ...prev, context_place: value }))
        }
        onChangeTimePeriod={(value) =>
          setModel((prev) => ({ ...prev, time_period: value }))
        }
      />

      <FieldPopulation
        value={model.population}
        highlights={fieldHighlights.population}
        fieldState={fieldStates.population}
        onChange={(value) =>
          setModel((prev) => ({ ...prev, population: value }))
        }
      />

      <FieldResources
        value={model.resources}
        highlights={fieldHighlights.resources}
        fieldState={fieldStates.resources}
        onChange={(value) =>
          setModel((prev) => ({ ...prev, resources: value }))
        }
      />

      <CriteriaEditor
        include={model.include}
        exclude={model.exclude}
        includeState={fieldStates.include}
        excludeState={fieldStates.exclude}
        onAddItem={onAddItem}
        onDeleteItem={onDeleteItem}
      />

      {savingError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {savingError}
        </div>
      ) : null}
    </WorkspaceEditorCard>
  );
}
