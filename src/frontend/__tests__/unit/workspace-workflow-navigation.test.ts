import {
  getNextProjectStepLabel,
  getNextProjectStep,
  PROJECT_WORKFLOW_STEPS,
} from "@/features/projects/workspace/workspaceWorkflowNavigation";

describe("project workflow navigation labels", () => {
  it("keeps the sidebar order as the source of truth for the next step", () => {
    expect(PROJECT_WORKFLOW_STEPS.map((step) => step.key)).toEqual([
      "delimitation",
      "design",
      "sample",
      "collection",
      "segments",
      "analysis",
      "report",
    ]);

    expect(getNextProjectStep("delimitation")?.label).toBe("Diseño");
    expect(getNextProjectStepLabel("delimitation")).toBe("Siguiente: Diseño");
    expect(getNextProjectStepLabel("design")).toBe("Siguiente: Muestra");
    expect(getNextProjectStepLabel("sample")).toBe("Siguiente: Corpus");
    expect(getNextProjectStepLabel("report")).toBeNull();
  });
});
