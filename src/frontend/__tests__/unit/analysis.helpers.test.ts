import {
  ANALYSIS_WORKFLOW_STEPS,
  buildSegmentMemoDraft,
  getSegmentCodeNames,
  getSegmentDisplayTitle,
  getAdjacentCodingSegmentId,
  getAnalysisCodesHref,
  getAnalysisHref,
  getAnalysisInsightsHref,
  getAnalysisMemosHref,
  getAnalysisSegmentsHref,
  normalizeCodingView,
  pickSegmentationDocumentId,
  pickCodingSegmentId,
} from "@/features/projects/analysis/helpers/analysis.helpers";
import { getAllAnalysisMemos, getAllAnalysisInsights } from "@/features/projects/analysis/api/analysis.api";
import { fetchProjectExport } from "@/features/projects/exports/helpers/projectExports.helpers";

describe("complete analysis catalogs", () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });
  test.each(["memos", "insights"])("retrieves %s using real offset pages without a total field", async key => {
    const calls: string[] = [];
    global.fetch = jest.fn(async (input: any) => {
      calls.push(String(input));
      const offset = Number(new URL(String(input), "http://localhost").searchParams.get("offset"));
      return new Response(JSON.stringify({ ok: true, [key]: Array.from({ length: offset === 0 ? 200 : 1 }, (_, i) => ({ id: `${offset + i}` })), links: [{ id: "link-1" }] }));
    }) as any;
    const result = await (key === "memos" ? getAllAnalysisMemos : getAllAnalysisInsights)("project 1", { include_deleted: false, include_links: true });
    expect(result[key]).toHaveLength(201);
    expect(result[key][200].id).toBe("200");
    expect(calls).toHaveLength(2);
    expect(calls[1]).toContain("/api/projects/project%201/analysis/");
    expect(calls[1]).toContain("limit=200");
    expect(calls[1]).toContain("offset=200");
    expect(calls[1]).toContain("include_deleted=false");
    if (key === "insights") expect(result.links).toEqual([{ id: "link-1" }]);
  });
  test("a failed final page rejects rather than returning a complete-looking first page", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, memos: Array.from({ length: 200 }, (_, id) => ({ id })) })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: "DEPENDENCY_UNAVAILABLE" }), { status: 503 }));
    await expect(getAllAnalysisMemos("p")).rejects.toThrow("DEPENDENCY_UNAVAILABLE");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  test("cancellation between pages prevents an old scope from requesting another page", async () => {
    const controller = new AbortController();
    global.fetch = jest.fn(async () => {
      controller.abort();
      return new Response(JSON.stringify({ ok: true, memos: Array.from({ length: 200 }, (_, id) => ({ id })) }));
    }) as any;
    await expect(getAllAnalysisMemos("old-project", {}, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
  test("a server claiming more rows cannot end with an empty page silently", async () => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ ok: true, memos: [], total: 201 }))) as any;
    await expect(getAllAnalysisMemos("p")).rejects.toThrow(/incompleto/);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("export response validation before download", () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });
  test.each([401, 503])("rejects HTTP %i without navigation", async status => {
    global.fetch = jest.fn(async () => new Response("{}", { status })) as any;
    await expect(fetchProjectExport("p", "codebook", "docx")).rejects.toThrow(/No se pudo exportar/);
  });
  test.each(["text/html", "application/json"])("rejects successful %s instead of downloading an error document", async type => {
    global.fetch = jest.fn(async () => new Response("<html>Error</html>", { headers: { "content-type": type } })) as any;
    await expect(fetchProjectExport("p", "codebook", "docx")).rejects.toThrow(/No se pudo exportar/);
  });
  test("rejects non-binary data even when the MIME claims DOCX", async () => {
    global.fetch = jest.fn(async () => new Response("{\"error\":true}", { headers: { "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } })) as any;
    await expect(fetchProjectExport("p", "codebook", "docx")).rejects.toThrow(/No se pudo exportar/);
  });
  test("keeps the authorized URL and filename for a valid binary response", async () => {
    const bytes = new Uint8Array([80, 75, 3, 4, 0, 0]);
    global.fetch = jest.fn(async () => new Response(bytes, { headers: { "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "content-disposition": 'attachment; filename="evidencia.docx"' } })) as any;
    const result = await fetchProjectExport("project 1", "codebook", "docx");
    expect(result.filename).toBe("evidencia.docx");
    expect(new Uint8Array(await result.blob.arrayBuffer())).toEqual(bytes);
    expect(global.fetch).toHaveBeenCalledWith("/api/projects/project%201/exports/codebook?format=docx", expect.objectContaining({ credentials: "same-origin", cache: "no-store" }));
  });
});

describe("analysis workflow routes", () => {
  it("uses one canonical iterative order on every analysis screen", () => {
    expect(ANALYSIS_WORKFLOW_STEPS.map((step: { key: string }) => step.key)).toEqual([
      "segments",
      "codes",
      "overview",
      "memos",
      "insights",
    ]);

    expect(getAnalysisSegmentsHref("project 1")).toBe(
      "/projects/project%201/analysis/segments"
    );
    expect(
      getAnalysisSegmentsHref("project 1", { documentId: "document 1" })
    ).toBe(
      "/projects/project%201/analysis/segments?documentId=document+1"
    );
    expect(getAnalysisCodesHref("project 1")).toBe(
      "/projects/project%201/analysis/codes"
    );
    expect(
      getAnalysisCodesHref("project 1", { segmentId: "segment 1" })
    ).toBe("/projects/project%201/analysis/codes?segmentId=segment+1");
    expect(getAnalysisCodesHref("project 1", { view: "codebook" })).toBe(
      "/projects/project%201/analysis/codes?view=codebook"
    );
    expect(
      getAnalysisCodesHref("project 1", {
        view: "coding",
        segmentId: "segment 1",
      })
    ).toBe(
      "/projects/project%201/analysis/codes?view=coding&segmentId=segment+1"
    );
    expect(getAnalysisHref("project 1")).toBe("/projects/project%201/analysis");
    expect(getAnalysisMemosHref("project 1")).toBe(
      "/projects/project%201/analysis/memos"
    );
    expect(getAnalysisInsightsHref("project 1")).toBe(
      "/projects/project%201/analysis/insights"
    );
  });
});

describe("segmentation workspace state", () => {
  const documents = [{ id: "document-a" }, { id: "document-b" }];

  it("keeps a requested document only when it belongs to the corpus", () => {
    expect(pickSegmentationDocumentId(documents, "document-b")).toBe(
      "document-b"
    );
    expect(pickSegmentationDocumentId(documents, "missing")).toBe(
      "document-a"
    );
    expect(pickSegmentationDocumentId([], "document-b")).toBe("");
  });
});

describe("coding workspace state", () => {
  const segments = [{ id: "segment-a" }, { id: "segment-b" }];

  it("normalizes local coding views", () => {
    expect(normalizeCodingView("codebook")).toBe("codebook");
    expect(normalizeCodingView("coding")).toBe("coding");
    expect(normalizeCodingView("unknown")).toBe("codebook");
    expect(normalizeCodingView(undefined)).toBe("codebook");
  });

  it("keeps a requested segment when it belongs to the queue", () => {
    expect(pickCodingSegmentId(segments, "segment-b")).toBe("segment-b");
    expect(pickCodingSegmentId(segments, "missing")).toBe("segment-a");
    expect(pickCodingSegmentId([], "segment-b")).toBe("");
  });

  it("moves between adjacent segments without wrapping", () => {
    expect(getAdjacentCodingSegmentId(segments, "segment-a", 1)).toBe(
      "segment-b"
    );
    expect(getAdjacentCodingSegmentId(segments, "segment-b", -1)).toBe(
      "segment-a"
    );
    expect(getAdjacentCodingSegmentId(segments, "segment-b", 1)).toBe("");
    expect(getAdjacentCodingSegmentId(segments, "missing", 1)).toBe("");
  });
});

describe("buildSegmentMemoDraft", () => {
  it("creates an editable analytic memo draft from a segment", () => {
    const draft = buildSegmentMemoDraft({
      codes: [
        { id: "code-1", name: "confianza en aprendizaje digital" },
        { id: "code-2", name: "apoyo familiar" },
      ],
      selected_text:
        "Aprendi a usar el telefono para estudiar porque mi hermana me enseno paso a paso.",
    });

    expect(draft).toEqual({
      title: "Memo sobre confianza en aprendizaje digital, apoyo familiar",
      body:
        "Interpretacion inicial:\n\n\n\nEvidencia del segmento:\n\nAprendi a usar el telefono para estudiar porque mi hermana me enseno paso a paso.",
      memo_type: "analytic",
      status: "draft",
      tags: "segmento, interpretacion",
    });
  });

  it("falls back to a generic title when the segment has no codes", () => {
    const draft = buildSegmentMemoDraft({ selected_text: "" });

    expect(draft.title).toBe("Memo interpretativo desde segmento");
    expect(draft.body).toContain("Interpretacion inicial:");
  });
});

describe("segment code identity", () => {
  it("uses every assigned code as the visible analytical identity", () => {
    const segment = {
      label: "legacy title that must be ignored",
      codes: [
        { id: "code-1", name: "Migración juvenil" },
        { id: "code-2", name: "Cambio generacional" },
      ],
    };

    expect(getSegmentCodeNames(segment)).toEqual([
      "Migración juvenil",
      "Cambio generacional",
    ]);
    expect(getSegmentDisplayTitle(segment)).toBe(
      "Migración juvenil · Cambio generacional"
    );
  });

  it("uses a neutral state when a segment has not been coded", () => {
    expect(getSegmentCodeNames({ label: "legacy title" })).toEqual([]);
    expect(getSegmentDisplayTitle({ label: "legacy title" })).toBe(
      "Sin codificar"
    );
  });
});
