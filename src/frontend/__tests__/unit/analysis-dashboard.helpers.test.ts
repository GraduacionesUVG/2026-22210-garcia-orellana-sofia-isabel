import { normalizeAnalysisDashboardPayload } from "@/features/projects/analysis/helpers/analysis.helpers";

describe("analysis dashboard helpers", () => {
  it("normalizes the consolidated dashboard snapshot for the overview hook", () => {
    const payload = normalizeAnalysisDashboardPayload({
      overview: { segments_count: 2 },
      stats: [{ code_id: "code-1" }],
      codes: [{ id: "code-1" }],
      uncodedSegments: [{ segment_id: "segment-1" }],
      relationships: [{ source_code_id: "code-1", target_code_id: "code-2" }],
      insights: [{ id: "insight-1" }],
      documentPatterns: {
        documents: [{ id: "document-1" }],
        patterns: [{ code_id: "code-1" }],
      },
      groupComparisons: {
        attribute: "sample_group",
        groups: [{ key: "Mujeres", label: "Mujeres" }],
        rows: [{ code_id: "code-1", counts: { Mujeres: 2 } }],
      },
    });

    expect(payload).toEqual({
      overview: { segments_count: 2 },
      codeStats: [{ code_id: "code-1" }],
      codes: [{ id: "code-1" }],
      uncodedSegments: [{ segment_id: "segment-1" }],
      codeRelationships: [{ source_code_id: "code-1", target_code_id: "code-2" }],
      insights: [{ id: "insight-1" }],
      documentPatterns: {
        documents: [{ id: "document-1" }],
        patterns: [{ code_id: "code-1" }],
      },
      groupComparisons: {
        attribute: "sample_group",
        groups: [{ key: "Mujeres", label: "Mujeres" }],
        rows: [{ code_id: "code-1", counts: { Mujeres: 2 } }],
      },
    });
  });
});
