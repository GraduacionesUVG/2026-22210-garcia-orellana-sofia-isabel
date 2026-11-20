import {
  buildResearchDesignFieldHighlights,
  normalizeResearchDesignReviewResponse,
} from "@/features/projects/research-design/helpers/researchDesign.helpers";
import {
  buildSampleConfigFieldHighlights,
  computeLiveSampleConfigEvaluation,
} from "@/features/projects/sample-config/helpers/sampleConfig.review.helpers";
import { normalizeSampleConfigReviewResponse } from "@/features/projects/sample-config/helpers/sampleConfig.helpers";

describe("review quality helpers", () => {
  it("normalizes research design review with a 1-100 score derived from existing heuristic issues", () => {
    const normalized = normalizeResearchDesignReviewResponse({
      evaluation: {
        summary: {
          has_question: true,
          has_general_objective: true,
          specific_objectives_count: 2,
          total_issues: 2,
          critical_issues: 1,
          warning_issues: 1,
          alignment_issues: 0,
          overall_status: "critical",
        },
      },
      ai_review: {
        overall_status: "critical",
        concise_summary: "Hay problemas.",
        issues: [],
        guiding_questions: [],
        improvement_suggestions: [],
        coverage_check: {},
        delimitation_alignment: {},
        next_step: "Revisar.",
      },
    });

    expect(normalized.ai_review.overall_score).toBe(74);
  });

  it("turns matched research design terms into field highlights without changing the heuristics", () => {
    const highlights = buildResearchDesignFieldHighlights({
      question: {
        issues: [
          {
            field: "research_question",
            severity: "warning",
            message: 'La pregunta contiene el termino "impacto".',
            suggestion: "Aclara la dimension observable.",
            matched_terms: ["impacto"],
          },
        ],
      },
    });

    expect(highlights.research_question).toEqual([
      expect.objectContaining({
        start: 0,
        end: 7,
        text: "impacto",
        severity: "warning",
      }),
    ]);
  });

  it("normalizes sample review with a 1-100 score and highlights warned text fields", () => {
    const evaluation = computeLiveSampleConfigEvaluation({
      main_approach_code: "ethnographic",
      scope_code: "exploratory",
      field_phase: "Inicial",
      target_sample_size: "12",
      sample_size_rationale: "Poco",
      collection_techniques: [
        { technique_code: "interview", is_custom: false },
      ],
    });
    const normalized = normalizeSampleConfigReviewResponse({
      evaluation,
      ai_review: {
        overall_status: "warning",
        concise_summary: "Debe mejorar.",
        issues: [],
        strengths: [],
        guiding_questions: [],
        improvement_suggestions: [],
        coverage_check: {},
        next_step: "Revisar.",
      },
    });
    const highlights = buildSampleConfigFieldHighlights(
      {
        field_phase: "Inicial",
        sample_size_rationale: "Poco",
      },
      evaluation
    );

    expect(normalized.ai_review.overall_score).toBeGreaterThanOrEqual(1);
    expect(normalized.ai_review.overall_score).toBeLessThanOrEqual(100);
    expect(highlights.field_phase[0]).toEqual(
      expect.objectContaining({ start: 0, end: 7, severity: "warning" })
    );
    expect(highlights.sample_size_rationale[0]).toEqual(
      expect.objectContaining({ start: 0, end: 4, severity: "warning" })
    );
  });
});
