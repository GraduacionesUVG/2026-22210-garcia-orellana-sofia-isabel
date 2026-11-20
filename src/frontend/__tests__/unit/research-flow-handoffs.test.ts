import { buildProjectExportUrl } from "@/features/projects/exports/helpers/projectExports.helpers";
import { buildProjectStepRoutes } from "@/features/projects/workspace/components/ProjectProgressSidebar";

describe("research flow handoffs", () => {
  it("connects protocol phases to the next canonical destination", () => {
    const routes = buildProjectStepRoutes("project-123");

    expect(routes.sample).toBe("/projects/project-123/sample-config");
    expect(routes.collection).toBe("/projects/project-123/corpus");
    expect(routes.segments).toBe(
      "/projects/project-123/analysis/segments"
    );
    expect(routes.analysis).toBe("/projects/project-123/analysis");
    expect(routes.codes).toBe("/projects/project-123/analysis/codes");
    expect(routes.memos).toBe("/projects/project-123/analysis/memos");
    expect(routes.insights).toBe("/projects/project-123/analysis/insights");
    expect(routes.report).toBe("/projects/project-123/report");
  });

  it("builds the existing synthesis bundle URL for the report page", () => {
    expect(
      buildProjectExportUrl("project 123", "bundle", "zip", {
        scope: "report",
      })
    ).toBe(
      "/api/projects/project%20123/exports/bundle?format=zip&scope=report"
    );
  });
});
