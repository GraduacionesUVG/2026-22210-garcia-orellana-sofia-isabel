import {
  isDelimitationComplete,
  normalizeDelimitationReviewResponse,
} from "@/features/projects/delimitation/helpers/delimitation.helpers";

describe("isDelimitationComplete", () => {
  const completeModel = {
    topic: "Prácticas de aprendizaje digital",
    context_place: "San Lucas Tolimán",
    time_period: "2025",
    population: "Estudiantes de secundaria",
    resources: "Entrevistas y observación",
    include: [{ id: "include-1", text: "Estudiantes activos" }],
    exclude: [{ id: "exclude-1", text: "Personas fuera del municipio" }],
  };

  it("requires every text field and both criteria lists", () => {
    expect(isDelimitationComplete(completeModel)).toBe(true);
    expect(
      isDelimitationComplete({ ...completeModel, resources: "" })
    ).toBe(false);
    expect(
      isDelimitationComplete({ ...completeModel, include: [] })
    ).toBe(false);
    expect(
      isDelimitationComplete({ ...completeModel, exclude: [] })
    ).toBe(false);
  });
});

describe("normalizeDelimitationReviewResponse", () => {
  it("preserves the evaluation source for transparent UI labeling", () => {
    const review = normalizeDelimitationReviewResponse({
      source: "heuristic",
      summary: "Evaluacion disponible.",
      overall: {
        score: 42,
        verdict: "muy_amplia",
        rationale: "Faltan componentes.",
      },
      fields: {},
      findings: [],
      jackQuestion: "Que falta definir?",
      suggestedNextStep: "Completa la poblacion.",
    });

    expect(review.source).toBe("heuristic");
  });
});
