"use client";

const FIELD_HIGHLIGHT_STYLE = {
  boxShadow:
    "0 0 0 4px rgba(0, 89, 68, 0.16), 0 18px 42px rgba(15, 23, 42, 0.14)",
  borderColor: "#005944",
};

function cssEscape(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return String(value).replace(/["\\]/g, "\\$&");
}

function getFieldSelectors({ phase, field, objectiveId }) {
  const selectors = [];

  const sampleConfigAliases = {
    main_approach: "main_approach_code",
    scope: "scope_code",
    collection_techniques: "custom_technique",
  };

  const normalizedField =
    phase === "sampleConfig" && sampleConfigAliases[field]
      ? sampleConfigAliases[field]
      : field;

  if (objectiveId) {
    selectors.push(`#specific-objective-${cssEscape(objectiveId)}`);
    selectors.push(`[data-objective-id="${cssEscape(objectiveId)}"]`);
  }

  if (phase === "delimitation" && normalizedField) {
    selectors.push(`#delimitation-${cssEscape(normalizedField)}`);
    selectors.push(`[data-field-key="${cssEscape(normalizedField)}"]`);
  }

  if (phase === "researchDesign" && normalizedField) {
    selectors.push(`#researchDesign-${cssEscape(normalizedField)}`);
    selectors.push(`[data-field-key="${cssEscape(normalizedField)}"]`);
  }

  if (phase === "sampleConfig" && normalizedField) {
    selectors.push(`#sampleConfig-${cssEscape(normalizedField)}`);
    selectors.push(`[data-field-key="${cssEscape(normalizedField)}"]`);
  }

  if (normalizedField) {
    selectors.push(`[data-field-key="${cssEscape(normalizedField)}"]`);
  }

  return selectors;
}

function findTargetElement(target) {
  const selectors = getFieldSelectors(target);

  for (const selector of selectors) {
    const element = document.querySelector(selector);

    if (element) return element;
  }

  return null;
}

function focusEditableInside(element) {
  const editable = element?.querySelector?.(
    "textarea, input, select, [contenteditable='true']"
  );

  if (!editable) return;

  window.setTimeout(() => {
    try {
      editable.focus({ preventScroll: true });
    } catch {
      editable.focus();
    }
  }, 450);
}

function clearFieldHighlight(element) {
  if (!element) return;

  element.style.boxShadow = element.dataset.previousBoxShadow || "";
  element.style.borderColor = element.dataset.previousBorderColor || "";

  delete element.dataset.previousBoxShadow;
  delete element.dataset.previousBorderColor;
  delete element.dataset.workspaceFieldActive;
}

function applyFieldHighlight(element) {
  if (!element) return;

  if (!element.dataset.workspaceFieldActive) {
    element.dataset.previousBoxShadow = element.style.boxShadow || "";
    element.dataset.previousBorderColor = element.style.borderColor || "";
  }

  element.dataset.workspaceFieldActive = "true";
  element.style.transition =
    "box-shadow 240ms ease, border-color 240ms ease, background-color 240ms ease";
  element.style.boxShadow = FIELD_HIGHLIGHT_STYLE.boxShadow;
  element.style.borderColor = FIELD_HIGHLIGHT_STYLE.borderColor;

  window.clearTimeout(element.__workspaceFieldHighlightTimer);

  element.__workspaceFieldHighlightTimer = window.setTimeout(() => {
    clearFieldHighlight(element);
  }, 2600);
}

export function navigateToWorkspaceField(target = {}) {
  if (typeof window === "undefined") return false;

  const element = findTargetElement(target);

  if (!element) return false;

  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });

  window.setTimeout(() => {
    applyFieldHighlight(element);
    focusEditableInside(element);
  }, 380);

  return true;
}

export function getDelimitationFieldTarget(field) {
  return {
    phase: "delimitation",
    field,
  };
}

export function getResearchDesignFieldTarget(field) {
  return {
    phase: "researchDesign",
    field,
  };
}

export function getSpecificObjectiveTarget(objectiveId) {
  return {
    phase: "researchDesign",
    field: "specific_objective",
    objectiveId,
  };
}

export function getSampleConfigFieldTarget(field) {
  return {
    phase: "sampleConfig",
    field,
  };
}