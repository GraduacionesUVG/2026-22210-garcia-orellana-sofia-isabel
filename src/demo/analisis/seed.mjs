import { exampleDocuments } from "../documentos-ejemplo.mjs";

const definitions = [
  ["Memoria comunitaria", "#0f766e", "Relatos que reconstruyen experiencias compartidas del barrio.", "Referencias al recuerdo o al registro de historias colectivas.", "Menciones al pasado sin referencia a la vida colectiva."],
  ["Transmisión entre generaciones", "#2672a5", "Prácticas para comunicar conocimientos entre personas de distintas generaciones.", "Escuchar a las mayores, aprender por observación o registrar sus relatos.", "Actividades sin indicios de transmisión de conocimientos."],
  ["Redes de cuidado", "#9c4b73", "Acciones coordinadas que sostienen la participación de otras personas.", "Turnos de cuidado, acompañamiento o preparación de alimentos para el grupo.", "Tareas individuales sin mención de apoyo a alguien más."],
];
const seedDate = "2026-10-04T15:00:00.000Z";
function seedId(group, n) {
  const prefix = String(group).repeat(8);
  return prefix + "-1111-4111-8111-" + String(n).padStart(12, "0");
}

export function seedAnalysis(projectId, rich = true) {
  const state = { segments: [], codes: [], assignments: [], memos: [], insights: [], memoLinks: [], insightLinks: [] };
  if (!rich) return state;
  function row(group, n, fields) {
    return { id: seedId(group, n), project_id: projectId, revision: 0, created_at: seedDate, updated_at: seedDate, deleted_at: null, metadata: {}, ...fields };
  }
  for (const document of exampleDocuments) {
    let start = 0;
    for (const { text, note } of document.excerpts) {
      const end = start + text.length;
      state.segments.push(row(3, state.segments.length + 1, {
        document_id: document.id,
        start_char: start,
        end_char: end,
        selected_text: text,
        note,
      }));
      start = end + 1;
    }
  }
  state.codes = definitions.map(([name, color, definition, inclusion_criteria, exclusion_criteria], i) =>
    row(4, i + 1, { name, color, definition, description: definition, inclusion_criteria, exclusion_criteria, parent_code_id: i === 1 ? seedId(4, 1) : null, position: i, is_active: true })
  );
  const assignments = [
    [1, 1, true, "El patio como lugar de memoria"],
    [1, 2, false], [2, 1, false], [2, 3, true, "Turnos de cuidado"], [3, 2, true, "Aprender a preparar atol"],
    [4, 1, true, "Registro de relatos"], [4, 2, false], [5, 3, true, "Apoyo a quienes cuidan"],
  ];
  state.assignments = assignments.map(([segment, code, is_quote, quote_label = ""], i) =>
    row(5, i + 1, { segment_id: seedId(3, segment), code_id: seedId(4, code), analytic_note: state.segments[segment - 1].note, is_quote, quote_label })
  );
  state.memos = [
    row(6, 1, { title: "¿Quién puede quedarse a escuchar?", body: "En el patio, las vecinas alternan el cuidado de las niñas. Durante la jornada, otra vecina lleva comida. Ambas acciones ayudan a explicar cómo se sostiene el tiempo dedicado a escuchar y registrar historias.", memo_type: "analytic", status: "reviewed", tags: ["cuidado", "participación"] }),
    row(6, 2, { title: "Distinguir observación y recuerdo", body: "La entrevista recoge cómo P01 describe su aprendizaje. La nota de campo registra lo que se observó en la mesa comunal. Conviene preservar esa diferencia al comparar fragmentos.", memo_type: "methodological", status: "draft", tags: ["fuentes", "comparación"] }),
  ];
  state.insights = [
    row(7, 1, { title: "Escuchar las historias requiere organizar el cuidado", summary: "En el ejemplo del patio, las vecinas se turnan para que las demás puedan escuchar. En la jornada se observa otra forma de apoyo a quienes cuidan.", interpretation: "El cuidado forma parte de las condiciones de participación en los encuentros descritos.", insight_type: "pattern", confidence: "medium", status: "confirmed", tags: ["memoria", "cuidado"] }),
    row(7, 2, { title: "Del relato oral al cuaderno", summary: "Las historias escuchadas en la mesa comunal se anotan para revisarlas en un encuentro posterior.", interpretation: "Queda por explorar cómo el grupo decide qué se conserva por escrito.", insight_type: "question", confidence: "low", status: "draft", tags: ["registro"] }),
  ];
  state.memoLinks = [
    row(8, 1, { memo_id: seedId(6, 1), link_type: "segment", segment_id: seedId(3, 2) }),
    row(8, 2, { memo_id: seedId(6, 1), link_type: "segment", segment_id: seedId(3, 5) }),
    row(8, 3, { memo_id: seedId(6, 2), link_type: "document", document_id: exampleDocuments[1].id }),
  ];
  state.insightLinks = [
    row(9, 1, { insight_id: seedId(7, 1), link_type: "memo", memo_id: seedId(6, 1) }),
    row(9, 2, { insight_id: seedId(7, 1), link_type: "segment", segment_id: seedId(3, 2) }),
    row(9, 3, { insight_id: seedId(7, 1), link_type: "segment", segment_id: seedId(3, 5) }),
    row(9, 4, { insight_id: seedId(7, 2), link_type: "segment", segment_id: seedId(3, 4) }),
  ];
  return state;
}
