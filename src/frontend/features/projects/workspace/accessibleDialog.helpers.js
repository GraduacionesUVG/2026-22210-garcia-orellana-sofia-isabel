const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getDialogFocusableElements(dialog) {
  if (!dialog?.querySelectorAll) return [];
  return Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute?.("hidden")
  );
}

export function handleDialogKeyDown(event, { dialog, close }) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = getDialogFocusableElements(dialog);
  if (!focusable.length) {
    event.preventDefault();
    dialog?.focus?.();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && event.target === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && event.target === last) {
    event.preventDefault();
    first.focus();
  }
}

export function restoreDialogFocus(trigger) {
  if (trigger?.isConnected !== false && typeof trigger?.focus === "function") {
    trigger.focus();
  }
}
