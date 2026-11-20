import type { UiFixture } from './fixtures';

export const presentationDocumentId = '22222222-2222-4222-8222-222222222222';
export const presentationCodeId = '44444444-4444-4444-8444-444444444444';
export const presentationSegmentId = '33333333-3333-4333-8333-333333333333';

/** Synthetic display data only. UUID fixture ownership remains independent. */
export function seedPresentation(ui: UiFixture): void {
  const document = { id: presentationDocumentId, project_id: ui.projectId, title: 'Entrevista sobre memoria comunitaria y redes de cuidado', content: 'La memoria se conserva cuando compartimos historias.\nEl cuidado permite continuar aprendiendo.', document_type: 'interview', status: 'ready_for_coding', revision: 0, deleted_at: null, created_at: '2026-10-04T12:00:00Z', updated_at: '2026-10-04T12:00:00Z' };
  const code = { id: presentationCodeId, name: 'Redes de cuidado', color: '#005944', description: 'Apoyo cotidiano entre personas.', definition: 'Acompañamiento que permite aprender.', parent_code_id: null, position: 0, revision: 0, deleted_at: null };
  ui.seed({
    projects: ui.dataset.projects.map(project => ({ ...project, name: 'E2E_PRESENTACION_LOCAL', description: 'Memoria comunitaria y aprendizaje' })),
    documents: [document], codes: [code],
    participants: [{ id: 'participant-presentation', alias: 'P01', display_name: 'Participante de la comunidad local', status: 'active', notes: '', attributes: {}, revision: 0, deleted_at: null }],
    segments: [{ id: presentationSegmentId, document_id: document.id, document_title: document.title, selected_text: 'La memoria se conserva cuando compartimos historias.', start_char: 0, end_char: 51, note: 'La memoria aparece como práctica compartida.', revision: 0, is_coded: true, code_count: 1, codes: [code], participant_label: 'Participante de la comunidad local' }],
    memos: [{ id: 'memo-presentation', title: 'Memoria compartida como cuidado cotidiano', body: 'Compartir historias permite sostener vínculos y aprender de las experiencias de otras personas.', memo_type: 'analytic', status: 'reviewed', revision: 0, tags: ['comunidad'], deleted_at: null, created_at: '2026-10-04T12:00:00Z', updated_at: '2026-10-04T12:00:00Z' }],
    insights: [{ id: 'insight-presentation', title: 'El cuidado sostiene la transmisión de memoria', summary: 'Las redes cotidianas conectan aprendizaje y memoria comunitaria.', interpretation: 'El acompañamiento es parte de la práctica de aprender.', insight_type: 'pattern', confidence: 'medium', status: 'confirmed', revision: 0, deleted_at: null, created_at: '2026-10-04T12:00:00Z', updated_at: '2026-10-04T12:00:00Z' }],
    corpusStats: { total_documents: 1, total_words: 16, total_characters: document.content.length, total_segments: 1 },
  });
  // This endpoint's status=all/coded/uncoded is a coding-state filter, not row.status.
  ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/segments`, ({ url, dataset }) => {
    const status = url.searchParams.get('status') ?? 'all';
    const search = (url.searchParams.get('search') ?? '').toLocaleLowerCase();
    const rows = dataset.segments.filter(row => (status === 'all' || Boolean(row.is_coded) === (status === 'coded')) && row.selected_text.toLocaleLowerCase().includes(search));
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 200);
    return { json: { ok: true, segments: rows.slice(offset, offset + limit), total: rows.length, counts: { all: dataset.segments.length, coded: dataset.segments.filter(row => row.is_coded).length, uncoded: dataset.segments.filter(row => !row.is_coded).length } } };
  });
  ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/segments/${presentationSegmentId}/codes`, () => ({ json: { ok: true, segment_codes: [{ id: 'presentation-assignment', segment_id: presentationSegmentId, code_id: code.id, code, note: 'Apoyo cotidiano', revision: 0 }] } }));
}
