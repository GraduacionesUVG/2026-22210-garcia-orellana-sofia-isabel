import {
  buildInsightTimelineGroups,
  getInsightStatusLabel,
  summarizeInsightLinks,
} from "@/features/projects/analysis/helpers/analysis.helpers";

describe("analysis insight helpers", () => {
  it.each([
    ["code", "Código no disponible"], ["memo", "Memo no disponible"],
    ["segment", "Segmento no disponible"], ["document", "Documento no disponible"],
    ["participant", "Participante no disponible"],
  ])("does not expose the UUID when %s metadata is missing", (type, expected) => {
    const summary = summarizeInsightLinks([{ id: "link-1", link_type: type, [`${type}_id`]: "33333333-3333-4333-8333-333333333304" }]);
    expect(summary.items[0].label).toBe(expected);
  });

  it("uses resolved target context without changing the linked resource identity", () => {
    const link = { id: "link-1", link_type: "segment", segment_id: "33333333-3333-4333-8333-333333333304", target_label: "Mi hermana me acompañó a aprender 🌿" };
    expect(summarizeInsightLinks([link]).items).toEqual([{ ...link, label: "Mi hermana me acompañó a aprender 🌿" }]);
  });
  it("labels archived insights as discarded for the formal log", () => {
    expect(getInsightStatusLabel("draft")).toBe("Borrador");
    expect(getInsightStatusLabel("confirmed")).toBe("Confirmado");
    expect(getInsightStatusLabel("archived")).toBe("Descartado");
  });

  it("groups insight timeline entries by update date newest first", () => {
    const groups = buildInsightTimelineGroups([
      {
        id: "old",
        title: "Hallazgo anterior",
        status: "draft",
        updated_at: "2026-06-18T10:00:00.000Z",
      },
      {
        id: "new",
        title: "Hallazgo nuevo",
        status: "confirmed",
        updated_at: "2026-06-20T10:00:00.000Z",
      },
      {
        id: "same-day",
        title: "Hallazgo del mismo dia",
        status: "archived",
        updated_at: "2026-06-20T08:00:00.000Z",
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].items.map((item: { id: string }) => item.id)).toEqual([
      "new",
      "same-day",
    ]);
    expect(groups[1].items.map((item: { id: string }) => item.id)).toEqual([
      "old",
    ]);
  });

  it("summarizes linked evidence with readable code and memo names", () => {
    const summary = summarizeInsightLinks(
      [
        { id: "l1", link_type: "code", code_id: "code-1" },
        { id: "l2", link_type: "memo", memo_id: "memo-1" },
        { id: "l3", link_type: "segment", segment_id: "segment-1" },
      ],
      [{ id: "code-1", name: "Confianza progresiva" }],
      [{ id: "memo-1", title: "Memo de campo" }]
    );

    expect(summary.total).toBe(3);
    expect(summary.items[0].label).toBe("Confianza progresiva");
    expect(summary.items[1].label).toBe("Memo de campo");
    expect(summary.byType.segment).toBe(1);
  });
});
