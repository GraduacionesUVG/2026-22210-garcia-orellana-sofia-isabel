import {
  buildCodebookHierarchyExportHtml,
  buildCodeTreeIndex,
  compareCodeBranches,
  extractCodeKeywords,
  validateCodebookIntegrity,
} from "@/features/projects/analysis/helpers/analysisCodebook.helpers";

type TestCode = {
  id: string;
  name: string;
  description?: string;
  definition?: string;
  parent_code_id: string | null;
  color?: string;
  position: number;
};

const codes: TestCode[] = [
  {
    id: "root-family",
    name: "Aprendizaje apoyado por familia",
    description: "Acompanamiento familiar para estudiar con tecnologia.",
    definition: "Incluye ayuda practica, animo y mediacion cotidiana.",
    parent_code_id: null,
    color: "#0f766e",
    position: 1,
  },
  {
    id: "child-confidence",
    name: "Confianza progresiva",
    description: "Momentos donde la persona gana seguridad digital.",
    definition: "Incluye pequenas victorias, autonomia y cambio de percepcion.",
    parent_code_id: "root-family",
    color: "#2563eb",
    position: 1,
  },
  {
    id: "child-practice",
    name: "Uso practico de tecnologia",
    description: "Uso del telefono para tareas, clases y comunicacion.",
    definition: "Incluye rutinas, practicas domesticas y resolucion cotidiana.",
    parent_code_id: "root-family",
    color: "#0f766e",
    position: 2,
  },
  {
    id: "root-access",
    name: "Barreras de acceso",
    description: "Limitaciones materiales para estudiar.",
    definition: "Incluye conectividad, datos moviles y cansancio visual.",
    parent_code_id: null,
    color: "#c4661f",
    position: 2,
  },
];

const statsByCodeId = new Map([
  ["root-family", { code_id: "root-family", segment_count: 2 }],
  ["child-confidence", { code_id: "child-confidence", segment_count: 5 }],
  ["child-practice", { code_id: "child-practice", segment_count: 3 }],
  ["root-access", { code_id: "root-access", segment_count: 4 }],
]);

// The helpers are JavaScript modules without generated declaration files, so
// TypeScript infers their default array parameters as `never[]`. Keep the
// fixture strongly typed locally while narrowing only at that JS boundary.
const helperCodes = codes as never[];

describe("analysis codebook operational helpers", () => {
  it("indexes hierarchy, leaves and paths for operational codebook actions", () => {
    const index = buildCodeTreeIndex(codes);

    expect(index.rootIds).toEqual(["root-family", "root-access"]);
    expect(index.leafIds).toEqual([
      "child-confidence",
      "child-practice",
      "root-access",
    ]);
    expect(index.getDescendantIds("root-family")).toEqual([
      "child-confidence",
      "child-practice",
    ]);
    expect(index.getPath("child-confidence").map((item) => item.id)).toEqual([
      "root-family",
      "child-confidence",
    ]);
  });

  it("extracts methodological keywords per node without common filler words", () => {
    const keywords = extractCodeKeywords(codes[0], { limit: 5 });

    expect(keywords).toContain("aprendizaje");
    expect(keywords).toContain("familia");
    expect(keywords).not.toContain("para");
  });

  it("compares two branches using descendants, leaves, usage and shared keywords", () => {
    const comparison = compareCodeBranches({
      codes: helperCodes,
      statsByCodeId,
      leftCodeId: "root-family",
      rightCodeId: "root-access",
    } as never);

    expect(comparison.left.totalCodes).toBe(3);
    expect(comparison.left.leafCodes).toBe(2);
    expect(comparison.left.segmentCount).toBe(10);
    expect(comparison.right.totalCodes).toBe(1);
    expect(comparison.right.segmentCount).toBe(4);
    expect(comparison.difference.segmentCount).toBe(6);
  });

  it("validates orphan parents, cycles and duplicate sibling positions", () => {
    const issues = validateCodebookIntegrity([
      ...codes,
      {
        id: "orphan",
        name: "Codigo huerfano",
        parent_code_id: "missing-parent",
        position: 1,
      },
      {
        id: "duplicate-position",
        name: "Posicion repetida",
        parent_code_id: "root-family",
        position: 2,
      },
      {
        id: "cycle-a",
        name: "Ciclo A",
        parent_code_id: "cycle-b",
        position: 1,
      },
      {
        id: "cycle-b",
        name: "Ciclo B",
        parent_code_id: "cycle-a",
        position: 1,
      },
    ]);

    expect(issues.map((issue) => issue.type)).toEqual(
      expect.arrayContaining([
        "orphan_parent",
        "duplicate_sibling_position",
        "cycle",
      ])
    );
  });

  it("builds a premium hierarchical export with terms and integrity status", () => {
    const html = buildCodebookHierarchyExportHtml({
      projectName: "Aprendizaje digital comunitario",
      codes: helperCodes,
      statsByCodeId,
    });

    expect(html).toContain("Aprendizaje digital comunitario");
    expect(html).toContain("Aprendizaje apoyado por familia");
    expect(html).toContain("Confianza progresiva");
    expect(html).toContain("Terminos clave");
    expect(html).toContain("Sin alertas criticas");
  });
});
