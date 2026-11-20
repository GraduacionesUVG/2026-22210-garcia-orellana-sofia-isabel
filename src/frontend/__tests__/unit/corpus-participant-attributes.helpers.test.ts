import {
  buildParticipantPayload,
  getParticipantGroupLabel,
  normalizeParticipantAttributes,
} from "@/features/projects/corpus/helpers/corpus.helpers";

describe("corpus participant attribute helpers", () => {
  it("normalizes rich participant attributes into stable methodological keys", () => {
    expect(
      normalizeParticipantAttributes({
        sample_group: "  Mujeres adultas  ",
        participant_type: " Entrevista ",
        community: " Zona 18 ",
        age_range: "",
        custom_unstructured_key: " preserved ",
      })
    ).toEqual({
      sample_group: "Mujeres adultas",
      participant_type: "Entrevista",
      community: "Zona 18",
      age_range: "",
      gender_identity: "",
      recruitment_channel: "",
      socioeconomic_context: "",
      custom_unstructured_key: " preserved ",
    });
  });

  it("keeps rich attributes when building participant payloads", () => {
    expect(
      buildParticipantPayload({
        alias: " P03 ",
        display_name: "",
        notes: " Nota ",
        status: "active",
        attributes: {
          sample_group: "Diarios moviles",
          participant_type: "Estudiante",
          community: "Rural",
        },
      })
    ).toEqual({
      alias: "P03",
      display_name: null,
      notes: "Nota",
      status: "active",
      attributes: expect.objectContaining({
        sample_group: "Diarios moviles",
        participant_type: "Estudiante",
        community: "Rural",
      }),
    });
  });

  it("prefers sample group labels for comparisons", () => {
    expect(
      getParticipantGroupLabel({
        alias: "P01",
        attributes: {
          sample_group: "Madres cuidadoras",
          participant_type: "Entrevista",
        },
      })
    ).toBe("Madres cuidadoras");
  });
});
