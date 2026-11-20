import * as ProjectProgressSidebarModule from "@/features/projects/workspace/components/ProjectProgressSidebar";

type DrawerKeyEvent = {
  key: string;
  shiftKey?: boolean;
  target?: unknown;
  preventDefault: () => void;
};

type DrawerKeyboardHandler = (
  event: DrawerKeyEvent,
  input: {
    drawer: null | { querySelectorAll: () => unknown[] };
    close: () => void;
  }
) => void;

function loadDrawerKeyboardHandler() {
  try {
    const helpers = jest.requireActual(
      "@/features/projects/workspace/workspaceNavigation.helpers"
    ) as { handleWorkspaceDrawerKeyDown?: DrawerKeyboardHandler };
    return helpers.handleWorkspaceDrawerKeyDown;
  } catch {
    return undefined;
  }
}

describe("project workspace navigation", () => {
  it("builds one canonical set of project workspace routes", () => {
    const buildProjectStepRoutes = (
      ProjectProgressSidebarModule as typeof ProjectProgressSidebarModule & {
        buildProjectStepRoutes?: (
          projectId: string | null
        ) => Record<string, string | null>;
      }
    ).buildProjectStepRoutes;
    const projectSteps = (
      ProjectProgressSidebarModule as typeof ProjectProgressSidebarModule & {
        PROJECT_STEPS?: Array<{ key: string }>;
      }
    ).PROJECT_STEPS;

    expect(typeof buildProjectStepRoutes).toBe("function");
    expect(Array.isArray(projectSteps)).toBe(true);
    expect(buildProjectStepRoutes?.("project-123")).toEqual({
      delimitation: "/projects/project-123/delimitation",
      design: "/projects/project-123/research-design",
      sample: "/projects/project-123/sample-config",
      collection: "/projects/project-123/corpus",
      segments: "/projects/project-123/analysis/segments",
      analysis: "/projects/project-123/analysis",
      codes: "/projects/project-123/analysis/codes",
      memos: "/projects/project-123/analysis/memos",
      insights: "/projects/project-123/analysis/insights",
      report: "/projects/project-123/report",
      team: "/projects/project-123/team",
    });
    expect(projectSteps?.map((step) => step.key)).toEqual([
      "delimitation",
      "design",
      "sample",
      "collection",
      "segments",
      "analysis",
      "report",
    ]);
  });

  it("closes the workspace drawer with Escape", () => {
    const handleWorkspaceDrawerKeyDown = loadDrawerKeyboardHandler();
    let closed = false;
    let prevented = false;

    expect(typeof handleWorkspaceDrawerKeyDown).toBe("function");

    handleWorkspaceDrawerKeyDown?.(
      {
        key: "Escape",
        preventDefault() {
          prevented = true;
        },
      },
      {
        drawer: null,
        close() {
          closed = true;
        },
      }
    );

    expect(prevented).toBe(true);
    expect(closed).toBe(true);
  });

  it("wraps focus inside the workspace drawer", () => {
    const handleWorkspaceDrawerKeyDown = loadDrawerKeyboardHandler();
    let focused = "";
    let prevented = false;
    const first = {
      focus() {
        focused = "first";
      },
    };
    const last = {
      focus() {
        focused = "last";
      },
    };

    expect(typeof handleWorkspaceDrawerKeyDown).toBe("function");

    handleWorkspaceDrawerKeyDown?.(
      {
        key: "Tab",
        shiftKey: false,
        target: last,
        preventDefault() {
          prevented = true;
        },
      },
      {
        drawer: {
          querySelectorAll() {
            return [first, last];
          },
        },
        close() {},
      }
    );

    expect(prevented).toBe(true);
    expect(focused).toBe("first");
  });
});
