import { test, expect } from '../fixtures';
import { assertWorkspaceOperable } from '../browser-assertions';

const destinations = [
  ['Delimitación', 'delimitation', 'Delimitación del proyecto'],
  ['Diseño', 'research-design', 'Diseño de la investigación'],
  ['Muestra', 'sample-config', 'Configuración de muestra'],
  ['Corpus', 'corpus', 'Corpus cualitativo'],
  ['Segmentos', 'analysis/segments', 'Segmentos'],
  ['Codificación', 'analysis/codes', 'Codificación'],
  ['Explorar', 'analysis', 'Explorar'],
  ['Memos', 'analysis/memos', 'Memos'],
  ['Hallazgos', 'analysis/insights', 'Hallazgos'],
  ['Reporte', 'report', 'Reporte'],
  ['Equipo', 'team', 'Equipo del proyecto'],
] as const;

test.describe('navigation workspace', () => {
  test('Segmentos left document picker wraps the complete title without retired metadata subtitles', async ({ page, ui }, testInfo) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    const id = 'GAP03-picker-long', other = 'GAP03-picker-other';
    const title = 'Memoria comunitaria Ñandú y prácticas intergeneracionales en el territorio. '.repeat(5).trim();
    ui.seed({ documents: [
      { id, project_id: ui.projectId, title, content: 'GAP03 selected long-title content', document_type: 'field_note', status: 'draft', participant_id: 'GAP03-picker-participant', location: 'GAP03 retired location', language: 'GAP03-language', field_date: '2026-10-04', revision: 0, deleted_at: null },
      { id: other, project_id: ui.projectId, title: 'GAP03 initial other document', content: 'GAP03 initial content', document_type: 'interview', status: 'draft', revision: 0, deleted_at: null },
    ], participants: [{ id: 'GAP03-picker-participant', alias: 'GAP03-alias', display_name: 'GAP03 retired participant', deleted_at: null }] });
    for (const documentId of [id, other]) ui.mockApi.route('GET', `/api/projects/${ui.projectId}/documents/${documentId}/segments`, () => ({ status: 200, json: { ok: true, segments: [], total: 0 } }));
    try {
      await page.goto(`/projects/${ui.projectId}/analysis/segments?documentId=${other}`);
      await expect(page.locator('textarea[readonly]')).toHaveValue('GAP03 initial content');
      const picker = page.locator('aside').filter({ has: page.getByRole('heading', { name: 'Archivos del corpus', exact: true }) });
      const titleNode = picker.getByText(title, { exact: true });
      const choice = picker.getByRole('button').filter({ has: page.getByText(title, { exact: true }) });
      await expect(titleNode).toHaveText(title);
      await expect.poll(() => titleNode.evaluate(node => node.scrollHeight <= node.clientHeight + 1 && node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      await expect.poll(() => titleNode.evaluate(node => node.clientHeight / parseFloat(getComputedStyle(node).lineHeight))).toBeGreaterThan(2);
      for (const subtitle of ['GAP03 retired participant', 'GAP03-alias', 'GAP03 retired location', 'GAP03-language', 'Nota de campo', 'Borrador']) await expect(choice).not.toContainText(subtitle);
      await choice.click();
      await expect(choice).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('textarea[readonly]')).toHaveValue('GAP03 selected long-title content');
      await expect(page).toHaveURL(new RegExp(`documentId=${id}$`));
      await page.reload(); await expect(choice).toHaveAttribute('aria-pressed', 'true');
      await expect(titleNode).toHaveText(title);
    } finally { await testInfo.attach('GAP03-picker-viewport-requests', { body: JSON.stringify({ viewport: page.viewportSize(), requests: ui.requests }), contentType: 'application/json' }); }
  });
  for (const [label, suffix, heading] of destinations) {
    for (const input of ['click', 'keyboard'] as const) {
      test(`${input} ${label} changes route and current content`, async ({ page, ui }) => {
        await page.goto(`/projects/${ui.projectId}/delimitation`);
        await expect(page.getByRole('heading', { name: 'Delimitación del proyecto', exact: true })).toBeVisible();
        if (['Codificación', 'Explorar', 'Memos', 'Hallazgos'].includes(label)) {
          await page.getByRole('button', { name: /Análisis/ }).click();
        }
        const link = page.locator(`a[href="/projects/${ui.projectId}/${suffix}"]`).filter({ visible: true }).first();
        if (input === 'click') await link.click();
        else { await link.focus(); await page.keyboard.press('Enter'); }
        await expect(page).toHaveURL(new RegExp(`/projects/${ui.projectId}/${suffix}$`));
        await expect(page.getByRole('main').getByRole('heading', { name: heading, exact: true })).toBeVisible();
        await assertWorkspaceOperable(page);
      });
    }
  }

  test('direct entry refresh back and forward retain route-specific content', async ({ page, ui }) => {
    await page.goto(`/projects/${ui.projectId}/research-design`);
    await expect(page.getByRole('heading', { name: 'Diseño de la investigación', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Diseño de la investigación', exact: true })).toBeVisible();
    await page.locator(`a[href="/projects/${ui.projectId}/corpus"]`).filter({ visible: true }).click();
    await expect(page.getByRole('heading', { name: 'Corpus cualitativo', exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Diseño de la investigación', exact: true })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole('heading', { name: 'Corpus cualitativo', exact: true })).toBeVisible();
  });

  test('mobile drawer navigation Escape and desktop resize release inert and scroll', async ({ page, ui }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/projects/${ui.projectId}/delimitation`);
    const trigger = page.getByRole('button', { name: 'Menú del proyecto', exact: true });
    await trigger.click();
    const drawer = page.getByRole('dialog', { name: 'Navegación del proyecto' });
    await expect(drawer).toBeVisible();
    await expect.poll(() => page.getByRole('main').evaluate(node => Boolean(node.closest('[inert]')))).toBe(true);
    await drawer.locator(`a[href="/projects/${ui.projectId}/corpus"]`).click();
    await expect(page.getByRole('heading', { name: 'Corpus cualitativo', exact: true })).toBeVisible();
    await expect(drawer).toHaveCount(0);
    await trigger.click(); await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await trigger.click(); await page.setViewportSize({ width: 1440, height: 900 });
    await assertWorkspaceOperable(page);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    await page.locator(`a[href="/projects/${ui.projectId}/sample-config"]`).filter({ visible: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Configuración de muestra', exact: true })).toBeVisible();
  });

  test('foreign route gives a visible not-found result', async ({ page, ui }) => {
    await page.goto(`/projects/${ui.projectId}/route-that-does-not-exist`);
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Delimitación del proyecto', exact: true })).toHaveCount(0);
  });

  test('invalid view uses the documented codebook default', async ({ page, ui }) => {
    await page.goto(`/projects/${ui.projectId}/analysis/codes?view=invalid&segmentId=nonexistent`);
    await expect(page.getByRole('heading', { name: 'Codificación', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Libro de códigos Definir/ })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: /Nuevo código/ })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Segmento activo' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('link', { name: /Libro de códigos Definir/ })).toHaveAttribute('aria-current', 'page');
  });

  for (const query of ['view=coding', 'view=coding&segmentId=nonexistent']) {
    test(`empty evidence with ${query} never fabricates a selected segment`, async ({ page, ui }) => {
      await ui.seed({ segments: [] });
      await page.goto(`/projects/${ui.projectId}/analysis/codes?${query}`);
      await expect(page.getByRole('heading', { name: 'Primero prepara evidencia' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Segmento activo' })).toHaveCount(0);
      expect(ui.requests.filter(request => request.path.includes('/segments/nonexistent/'))).toHaveLength(0);
      await assertWorkspaceOperable(page);
    });
  }
});
