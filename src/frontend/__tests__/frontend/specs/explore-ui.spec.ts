import { test, expect } from '../fixtures';

test.describe('explore', () => {
  test('pending evidence shows document and participant context, never raw resource IDs', async ({ page, ui }) => {
    const documentId = '33333333-3333-4333-8333-333333333304';
    const segmentId = '44444444-4444-4444-8444-444444444404';
    ui.seed({ analysisDashboard: { ...ui.dataset.analysisDashboard, overview: { segments_count: 1, coded_segments_count: 0 },
      uncodedSegments: [{ id: segmentId, document_id: documentId, document_title: 'Entrevista sobre aprendizaje familiar', participant_label: 'María José 🌿', selected_text: 'miedo.' },
        { id: 'pending-no-metadata', document_id: documentId, selected_text: 'Evidencia sin contexto disponible' }] } });
    await page.goto(`/projects/${ui.projectId}/analysis`);
    const card = page.locator('article').filter({ hasText: 'miedo.' });
    await expect(card.getByText('Entrevista sobre aprendizaje familiar', { exact: true })).toBeVisible();
    await expect(card.getByText('María José 🌿', { exact: true })).toBeVisible();
    await expect(card.getByRole('link', { name: 'Codificar', exact: true })).toHaveAttribute('href', `/projects/${ui.projectId}/analysis/codes?view=coding&segmentId=${segmentId}`);
    await expect(page.getByText(documentId, { exact: true })).toHaveCount(0);
    await expect(page.getByText('Documento no disponible', { exact: true })).toBeVisible();
  });
  test('visual Memo opens context-preserving editor and never creates an insight', async ({ page, ui }) => {
    ui.seed({ analysisDashboard: { ok: true, overview: { segments_count: 4, coded_segments_count: 2, codes_count: 1, memos_count: 0 },
      codes: [], stats: [], relationships: [], documentPatterns: { documents: [], patterns: [] }, groupComparisons: { groups: [], rows: [] }, uncodedSegments: [], insights: [] } });
    await page.goto(`/projects/${ui.projectId}/analysis`);
    await page.getByRole('button', { name: 'Memo', exact: true }).first().click();
    await expect(page.getByRole('textbox', { name: 'Cuerpo', exact: true })).toHaveValue('Vista de cobertura y salud analitica del corpus: muestra si la evidencia marcada ya permite discutir patrones.');
    await page.getByLabel('Título', { exact: true }).fill('Memo desde cobertura 🌿');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Nuevo memo', exact: true })).toHaveCount(0);
    expect(ui.requests.find(r => r.method === 'POST' && r.path.endsWith('/analysis/memos'))?.body).toMatchObject({ title: 'Memo desde cobertura 🌿', metadata: { source_visual: 'evidence-command-center' } });
    expect(ui.requests.filter(r => r.method === 'POST' && r.path.endsWith('/analysis/insights'))).toHaveLength(0);
    await page.goto(`/projects/${ui.projectId}/analysis/memos`); await page.reload();
    await expect(page.getByRole('heading', { name: 'Memo desde cobertura 🌿', exact: true })).toBeVisible();
  });

  test('participant comparison exposes full truncated group label and accessible alternative', async ({ page, ui }) => {
    const fullName = 'Participante con nombre completo muy extenso María José ñ 🌿';
    ui.seed({ analysisDashboard: { ok: true, overview: { segments_count: 2, coded_segments_count: 2 },
      codes: [{ id: 'code-1', name: 'Cuidado' }], stats: [], relationships: [], documentPatterns: { documents: [], patterns: [] },
      groupComparisons: { attribute: 'participant', groups: [{ key: 'participant-1', label: fullName }], rows: [{ code_id: 'code-1', code_name: 'Cuidado', counts: { 'participant-1': 2 } }] }, uncodedSegments: [], insights: [] } });
    await page.goto(`/projects/${ui.projectId}/analysis`);
    await page.getByRole('button', { name: /3\. Relaciones/ }).click();
    const label = page.getByLabel(`Participante o grupo: ${fullName}`, { exact: true });
    await expect(label).toBeVisible();
    await expect(label).toHaveAttribute('title', fullName);
    await label.hover();
    await expect(label).toHaveAccessibleName(`Participante o grupo: ${fullName}`);
  });
});
