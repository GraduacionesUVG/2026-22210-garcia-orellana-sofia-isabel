import {
  buildResearchDesignPersistedSignature,
  normalizeResearchDesignLoadResponse,
} from "@/features/projects/research-design/helpers/researchDesign.helpers";
import { normalizeSampleConfigLoadResponse } from "@/features/projects/sample-config/helpers/sampleConfig.helpers";

describe("initial load helpers", () => {
  it("normalizes research design data together with the server evaluation", () => {
    const result = normalizeResearchDesignLoadResponse({
      data: {
        design: {
          research_question: "Como aprende una estudiante con apoyo familiar?",
          general_objective: "Comprender la experiencia de aprendizaje.",
          revision: 3,
        },
        specific_objectives: [
          { id: "objective-1", text: "Describir apoyos.", position: 0 },
        ],
        evaluation: {
          summary: {
            has_question: true,
            has_general_objective: true,
            specific_objectives_count: 1,
            total_issues: 0,
            critical_issues: 0,
            warning_issues: 0,
            alignment_issues: 0,
            overall_status: "good",
          },
        },
      },
    });

    expect(result.model.revision).toBe(3);
    expect(result.evaluation?.summary.overall_score).toBe(100);
    expect(buildResearchDesignPersistedSignature(result.model)).toBe(
      "rev:3|objective-1:0"
    );
  });

  it("normalizes sample config data together with embedded options", () => {
    const result = normalizeSampleConfigLoadResponse("project-1", {
      config: {
        project_id: "project-1",
        main_approach_code: "ethnographic",
        scope_code: "exploratory",
        field_phase: "Campo inicial",
        target_sample_size: 12,
        sample_size_rationale: "Por saturacion teorica.",
        revision: 2,
      },
      collection_techniques: [
        { id: "tech-1", technique_code: "interview", is_custom: false },
      ],
      options: {
        main_approaches: [{ code: "ethnographic", label: "Etnografico" }],
        scopes: [{ code: "exploratory", label: "Exploratorio" }],
        collection_technique_options: [
          { code: "interview", label: "Entrevista" },
        ],
      },
    });

    expect(result.sampleData.config.revision).toBe(2);
    expect(result.options.main_approaches).toHaveLength(1);
    expect(result.options.collection_technique_options[0].code).toBe(
      "interview"
    );
  });
});
