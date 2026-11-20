export const FOCUSABLE_DRAWER_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function handleWorkspaceDrawerKeyDown(event, { drawer, close }) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }

  if (event.key !== "Tab" || !drawer) return;

  const focusable = Array.from(
    drawer.querySelectorAll(FOCUSABLE_DRAWER_SELECTOR)
  );

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && event.target === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && event.target === last) {
    event.preventDefault();
    first.focus();
  }
}
