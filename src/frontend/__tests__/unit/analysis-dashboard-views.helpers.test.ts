import {
  buildDashboardViewStorageKey,
  normalizeDashboardView,
  upsertDashboardView,
} from "@/features/projects/analysis/helpers/analysisDashboardViews.helpers";

describe("analysis dashboard saved views helpers", () => {
  it("builds a project-scoped storage key", () => {
    expect(buildDashboardViewStorageKey("project-1")).toBe(
      "analysis-dashboard-views:v1:project-1"
    );
  });

  it("normalizes saved views to stable dashboard fields", () => {
    const view = normalizeDashboardView({
      id: "custom-id",
      name: "  Cruces de confianza  ",
      storyPage: "relations",
      visualId: "relationship-matrix",
      visualTitle: "Matriz de co-ocurrencia",
      notes: "  Revisar cruce principal  ",
      ignored: "not persisted",
    });

    expect(view).toEqual({
      id: "custom-id",
      name: "Cruces de confianza",
      storyPage: "relations",
      visualId: "relationship-matrix",
      visualTitle: "Matriz de co-ocurrencia",
      notes: "Revisar cruce principal",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it("upserts views by id and keeps the newest first", () => {
    const existing = normalizeDashboardView({
      id: "view-a",
      name: "Evidencia inicial",
      storyPage: "evidence",
      createdAt: "2026-06-20T12:00:00.000Z",
      updatedAt: "2026-06-20T12:00:00.000Z",
    });

    const next = upsertDashboardView([existing], {
      id: "view-a",
      name: "Relaciones revisadas",
      storyPage: "relations",
    });

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      id: "view-a",
      name: "Relaciones revisadas",
      storyPage: "relations",
    });
    expect(next[0].createdAt).toBe(existing.createdAt);
    expect(next[0].updatedAt).not.toBe(existing.updatedAt);
  });
});
