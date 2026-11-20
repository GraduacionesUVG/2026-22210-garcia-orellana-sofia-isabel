import {
  buildDelimitationSummaryMetrics,
  buildDelimitationHeuristicSummary,
  buildResearchDesignSummaryMetrics,
  humanizeReviewStatus,
} from "@/features/projects/workspace/reviewSidebar.helpers";

describe("review sidebar helpers", () => {
  it("translates technical review statuses into Spanish UI labels", () => {
    expect(humanizeReviewStatus("aligned")).toBe("Alineado");
    expect(humanizeReviewStatus("partially_aligned")).toBe(
      "Parcialmente alineado",
    );
    expect(humanizeReviewStatus("misaligned")).toBe("Desalineado");
    expect(humanizeReviewStatus("not_applicable")).toBe("No aplica");
    expect(humanizeReviewStatus("partially_supported")).toBe(
      "Parcialmente sustentado",
    );
  });

  it("builds the same structural metric shape for both review sidebars", () => {
    expect(
      buildDelimitationSummaryMetrics({
        overall: { score: 72 },
        fields: {
          topic: { status: "bien_delimitado" },
          population: { status: "pendiente" },
        },
        findings: [
          { kind: "mejora", severity: "alta" },
          { kind: "fortaleza", severity: "baja" },
        ],
      }),
    ).toEqual([
      { label: "Calificación", value: "72/100" },
      { label: "Problemas", value: 1 },
      { label: "Críticos", value: 1 },
      { label: "Componentes", value: 1 },
    ]);

    expect(
      buildResearchDesignSummaryMetrics({
        summary: {
          overall_score: 60,
          total_issues: 9,
          critical_issues: 0,
          specific_objectives_count: 3,
          alignment_issues: 7,
        },
      }),
    ).toEqual([
      { label: "Calificación", value: "60/100" },
      { label: "Problemas", value: 9 },
      { label: "Críticos", value: 0 },
      { label: "Obj. específicos", value: 3 },
      { label: "Alineación", value: 7 },
    ]);
  });

  it("shows a general delimitation score before the AI review exists", () => {
    expect(
      buildDelimitationHeuristicSummary({
        model: {
          topic: "Tema concreto",
          context_place: "Ciudad de Guatemala",
          time_period: "2024-2025",
          population: "Estudiantes de 18 a 24 años",
          resources: "Entrevistas semiestructuradas",
          include: ["Estudiantes activos"],
          exclude: ["Menores de edad"],
        },
        heuristics: { signals: [], totalHighlights: 0 },
      }),
    ).toEqual({
      score: 90,
      verdict: "Razonable",
      metrics: [
        { label: "Calificación", value: "90/100" },
        { label: "Problemas", value: 0 },
        { label: "Críticos", value: 0 },
        { label: "Componentes", value: 7 },
      ],
    });
  });
});
