import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AnalysisCodebookPanel from "@/features/projects/analysis/components/AnalysisCodebookPanel";
import AnalysisCodingQueue from "@/features/projects/analysis/components/AnalysisCodingQueue";
import AnalysisCodesSection from "@/features/projects/analysis/components/AnalysisCodesSection";
import AnalysisSegmentCodeCard from "@/features/projects/analysis/components/AnalysisSegmentCodeCard";
import AnalysisCodeStatsPanel from "@/features/projects/analysis/components/AnalysisCodeStatsPanel";
import AnalysisUncodedSegmentsPanel from "@/features/projects/analysis/components/AnalysisUncodedSegmentsPanel";

describe("readable analysis resource context", () => {
  const id = "33333333-3333-4333-8333-333333333304";
  it("does not turn a missing code name into its database identifier", () => {
    const card = renderToStaticMarkup(createElement(AnalysisSegmentCodeCard, { segmentCode: { code_id: id }, code: null }));
    const stats = renderToStaticMarkup(createElement(AnalysisCodeStatsPanel, { stats: [{ code_id: id, count: 2 }] }));
    expect(card).toContain("Código no disponible");
    expect(stats).toContain("Código no disponible");
    expect(card + stats).not.toContain(id);
  });
  it("retains available code names", () => {
    const card = renderToStaticMarkup(createElement(AnalysisSegmentCodeCard, { segmentCode: { code_id: id }, code: { name: "Confianza 🌿" } }));
    expect(card).toContain("Confianza 🌿");
    expect(card).not.toContain("Código no disponible");
  });
  it("shows readable fallback for whitespace document titles", () => {
    const html = renderToStaticMarkup(createElement(AnalysisUncodedSegmentsPanel, { projectId: "project-local", segments: [{ id: "segment-local", document_id: id, document_title: "   ", selected_text: "miedo." }] }));
    expect(html).toContain("Documento no disponible");
    expect(html).not.toContain(id);
    expect(html).toContain("miedo.");
  });
});

jest.mock("@/features/projects/analysis/components/AnalysisProvider", () => ({
  useAnalysisContext: () => ({ projectId: "local-project" }),
}));
jest.mock("@/features/projects/analysis/hooks/useAnalysisCodes", () => ({
  useAnalysisCodes: () => createCodebookManager(),
}));

function createCodebookManager() {
  const codes = [
    {
      id: "code-1",
      name: "Aprendizaje apoyado",
      description: "Prácticas de acompañamiento",
      definition: "Aprendizaje facilitado por la familia",
      inclusion_criteria: "Menciones de apoyo",
      exclusion_criteria: "Aprendizaje individual",
      parent_code_id: null,
      position: 0,
    },
    {
      id: "code-2",
      name: "Confianza progresiva",
      description: "Cambios en autonomía",
      definition: "Confianza construida con el tiempo",
      inclusion_criteria: "Menciones de confianza",
      exclusion_criteria: "Eventos aislados",
      parent_code_id: null,
      position: 1,
    },
  ];

  return {
    codes,
    statsByCodeId: new Map([
      ["code-1", { segment_count: 5 }],
      ["code-2", { segment_count: 8 }],
    ]),
    stats: [],
    filters: { search: "", parent_code_id: "" },
    loading: false,
    refreshing: false,
    movingId: "",
    deletingId: "",
    errorMsg: "",
    successMsg: "",
    modalOpen: false,
    form: {},
    editingCode: null,
    saving: false,
    openCreateModal: () => undefined,
    openEditModal: () => undefined,
    closeModal: () => undefined,
    setFormField: () => undefined,
    saveCode: () => undefined,
    moveCode: () => Promise.resolve(),
    removeCode: () => Promise.resolve(),
    updateFilter: () => undefined,
  };
}

describe("research workflow UI handoffs", () => {
  test("an export failure is visible independently of the normal save badge", () => {
    const runtime = require("react");
    const originalState = runtime.useState;
    let injected = false;
    const state = jest.spyOn(runtime, "useState").mockImplementation((initial: any) => {
      // Keep Next Link and the actual codebook's own state hooks intact.
      if (initial === "" && !injected) {
        injected = true;
        return ["No se pudo exportar el archivo. Reintenta la descarga.", () => undefined];
      }
      return originalState(initial);
    });
    try {
      const html = renderToStaticMarkup(createElement(AnalysisCodesSection));
      expect(html).toMatch(/<p role="alert"[^>]*>No se pudo exportar el archivo\. Reintenta la descarga\.<\/p>/);
      expect(html).toContain("Libro de códigos");
    } finally {
      state.mockRestore();
    }
  });
  test("queue selection and disclosure are independent native controls in a noninteractive list", () => {
    const html = renderToStaticMarkup(createElement(AnalysisCodingQueue, {
      manager: { counts: { uncoded: 0 }, filters: { status: "all", search: "" },
        segments: [{ id: "s", selected_text: "Evidencia", is_coded: true, codes: [{ id: "c", name: "Cuidado" }] }],
        loading: false, refreshing: false, updateFilter: () => undefined },
      selectedSegmentId: "s", onSelect: () => undefined,
    }));
    expect(html).toContain('<ul aria-label="Segmentos disponibles">');
    expect(html).toContain('<li');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('<details');
    expect(html).not.toContain('role="option"');
    expect(html).not.toContain('role="listbox"');
  });
  test("renders readable labels for every codebook operational control", () => {
    const html = renderToStaticMarkup(
      createElement(AnalysisCodebookPanel, {
        manager: createCodebookManager(),
      })
    );

    expect(html).toContain("Árbol operativo");
    expect(html).toContain("Código a mover");
    expect(html).toContain("Código padre");
    expect(html).toContain("Posición");
    expect(html).toContain("Primera rama");
    expect(html).toContain("Segunda rama");
  });
});
