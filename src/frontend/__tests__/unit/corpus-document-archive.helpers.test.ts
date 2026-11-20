import {
  findDocumentTextMatches,
  getDocumentArchiveDateLabel,
  getDocumentArchiveMetadata,
} from "@/features/projects/corpus/helpers/corpus.helpers";

describe("corpus document archive helpers", () => {
  it("prefers field date and interview date before updated date for archive labeling", () => {
    expect(
      getDocumentArchiveDateLabel({
        field_date: "2026-06-20",
        interview_date: "2026-06-18",
        updated_at: "2026-06-21T12:00:00.000Z",
      })
    ).toContain("Fecha de campo");

    expect(
      getDocumentArchiveDateLabel({
        field_date: null,
        interview_date: "2026-06-18",
        updated_at: "2026-06-21T12:00:00.000Z",
      })
    ).toContain("Fecha de entrevista");
  });

  it("builds a compact qualitative archive metadata model", () => {
    expect(
      getDocumentArchiveMetadata({
        document_type: "interview",
        status: "ready_for_coding",
        field_date: "2026-06-20",
        location: "Ciudad de Guatemala",
        language: "es",
        notes: "Entrevista con ruido ambiental.",
      })
    ).toEqual(
      expect.objectContaining({
        typeLabel: "Entrevista",
        statusLabel: "Listo para codificación",
        locationLabel: "Ciudad de Guatemala",
        languageLabel: "es",
        notesPreview: "Entrevista con ruido ambiental.",
      })
    );
  });

  it("finds all case-insensitive matches inside document content with snippets", () => {
    expect(
      findDocumentTextMatches(
        "La conectividad aparece en la casa. Sin conectividad, la clase se detiene.",
        "conectividad"
      )
    ).toEqual([
      expect.objectContaining({
        index: 0,
        start: 3,
        text: "conectividad",
        before: "La ",
      }),
      expect.objectContaining({
        index: 1,
        text: "conectividad",
        after: ", la clase se detiene.",
      }),
    ]);
  });
});
