import SectionHeader from "@/features/projects/workspace/components/SectionHeader";

const SECTION_COPY = {
  overview: {
    title: "Explorar",
    description:
      "Lee patrones, tensiones y cobertura de evidencia para orientar la interpretación antropológica.",
  },
  segments: {
    title: "Segmentos",
    description:
      "Revisa las unidades de evidencia y decide cuáles necesitan codificación o mayor contexto.",
  },
  codes: {
    title: "Codificación",
    description:
      "Aplica códigos a cada evidencia y organiza el libro de códigos sin perder el contexto.",
  },
  memos: {
    title: "Memos",
    description:
      "Registra interpretaciones, dudas metodológicas y relaciones emergentes entre segmentos.",
  },
  insights: {
    title: "Hallazgos",
    description:
      "Consolida ideas con evidencia suficiente cuando el análisis ya tenga soporte.",
  },
};

export default function AnalysisHeader({
  activeSection = "overview",
}) {
  const copy = SECTION_COPY[activeSection] ?? SECTION_COPY.overview;

  return <SectionHeader title={copy.title} description={copy.description} />;
}
