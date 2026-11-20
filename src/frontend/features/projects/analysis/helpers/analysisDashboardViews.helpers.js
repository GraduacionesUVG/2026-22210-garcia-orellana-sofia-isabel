export const DASHBOARD_VIEW_STORAGE_VERSION = 1;

export function buildDashboardViewStorageKey(projectId) {
  return `analysis-dashboard-views:v${DASHBOARD_VIEW_STORAGE_VERSION}:${projectId}`;
}

function nowIso() {
  return new Date().toISOString();
}

function cleanText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function normalizeDashboardView(view = {}) {
  const createdAt = cleanText(view.createdAt, nowIso());

  return {
    id: cleanText(view.id, `view-${Date.now()}`),
    name: cleanText(view.name, "Vista sin nombre"),
    storyPage: cleanText(view.storyPage, "evidence"),
    visualId: cleanText(view.visualId),
    visualTitle: cleanText(view.visualTitle),
    notes: cleanText(view.notes),
    createdAt,
    updatedAt: cleanText(view.updatedAt, nowIso()),
  };
}

export function upsertDashboardView(views = [], draft = {}) {
  const existing = views.find((view) => view.id === draft.id);
  const normalized = normalizeDashboardView({
    ...draft,
    createdAt: existing?.createdAt,
    updatedAt: nowIso(),
  });

  return [
    normalized,
    ...views.filter((view) => view.id !== normalized.id),
  ].slice(0, 12);
}

export function parseDashboardViews(rawValue) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeDashboardView);
  } catch {
    return [];
  }
}
