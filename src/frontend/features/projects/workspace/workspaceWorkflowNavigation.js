export const PROJECT_WORKFLOW_STEPS = [
  { key: "delimitation", label: "Delimitación", icon: "filter_alt" },
  { key: "design", label: "Diseño", icon: "schema" },
  { key: "sample", label: "Muestra", icon: "groups" },
  { key: "collection", label: "Corpus", icon: "inventory_2" },
  { key: "segments", label: "Segmentos", icon: "segment" },
  { key: "analysis", label: "Análisis", icon: "analytics" },
  { key: "report", label: "Reporte", icon: "description" },
];

export function getNextProjectStep(stepKey) {
  const currentIndex = PROJECT_WORKFLOW_STEPS.findIndex(
    (step) => step.key === stepKey
  );

  if (currentIndex < 0) return null;

  return PROJECT_WORKFLOW_STEPS[currentIndex + 1] ?? null;
}

export function getNextProjectStepLabel(stepKey) {
  const nextStep = getNextProjectStep(stepKey);
  return nextStep ? `Siguiente: ${nextStep.label}` : null;
}
