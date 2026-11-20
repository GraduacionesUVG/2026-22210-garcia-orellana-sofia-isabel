import { test, expect } from '../fixtures';
import type { Page, Request } from '@playwright/test';

const documentId = '22222222-2222-4222-8222-222222222222';
const content = 'Hola 🌿 café. Evidencia de campo.';
const segmentId = '33333333-3333-4333-8333-333333333333';

async function reloadSegmentWorkspace(page: Page, segmentsPath: string) {
  let reloadStarted = false;
  const freshRequests = new WeakSet<Request>();
  const onRequest = (request: Request) => {
    if (reloadStarted && request.method() === 'GET' && new URL(request.url()).pathname === segmentsPath) freshRequests.add(request);
  };
  page.on('request', onRequest);
  try {
    // Arm the response oracle before navigation. Firefox can emit the new
    // document's API request before `framenavigated`, so navigation-event
    // ordering must not decide whether a readback counts as fresh.
    const responsePromise = page.waitForResponse(response => freshRequests.has(response.request()));
    reloadStarted = true;
    const [response] = await Promise.all([
      // A save can leave a GET in flight in the old document. Its response is
      // not a reload readback, even if it arrives after navigation starts.
      responsePromise,
      // `load` also waits for unrelated images, not just the usable workspace.
      page.reload({ waitUntil: 'domcontentloaded' }),
    ]);
    expect(response.status(), 'Fresh segment read must succeed after reload').toBe(200);
    await expect(page.locator('textarea[readonly]')).toHaveValue(content);
  } finally {
    page.off('request', onRequest);
  }
}

test.describe('segmentation', () => {
  for (const selectionMode of ['keyboard emoji', 'mouse Unicode fragment'] as const) {
  test(`${selectionMode} selection creates exact UTF16 offsets then edits deletes and reloads the target @crossbrowser-smoke`, async ({ page, ui }, testInfo) => {
    ui.seed({ documents: [{ id: documentId, project_id: ui.projectId, title: 'Entrevista Unicode', content,
      document_type: 'interview', revision: 7, deleted_at: null, word_count: 6, character_count: content.length }], segments: [] });
    const path = `/api/projects/${ui.projectId}/documents/${documentId}/segments`;
    let saved: Record<string, unknown> | null = null;
    ui.mockApi.route('GET', path, () => ({ status: 200, json: { ok: true, segments: saved ? [saved] : [], total: saved ? 1 : 0 } }));
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/segments`, () => ({ status: 200, json: { ok: true, segments: [], counts: { all: 0, coded: 0, uncoded: 0 }, total: 0 } }));
    ui.mockApi.route('POST', path, ({ body }) => { saved = { ...body, id: segmentId, document_id: documentId, revision: 0 }; return { status: 201, json: { ok: true, segment: saved } }; });
    ui.mockApi.route('PATCH', `${path}/${segmentId}`, ({ body }) => { saved = { ...saved, ...body, revision: 1 }; return { status: 200, json: { ok: true, segment: saved } }; });
    ui.mockApi.route('DELETE', `${path}/${segmentId}`, () => { saved = null; return { status: 200, json: { ok: true } }; });
    await page.goto(`/projects/${ui.projectId}/analysis/segments?documentId=${documentId}`, { waitUntil: 'domcontentloaded' });
    const source = page.locator('textarea[readonly]');
    await expect(source).toHaveValue(content);
    await expect(page.getByRole('button', { name: 'Crear segmento', exact: true })).toBeDisabled();
    const start = selectionMode === 'keyboard emoji' ? 5 : 0;
    const end = selectionMode === 'keyboard emoji' ? 7 : content.length;
    const selectedText = content.slice(start, end);
    if (selectionMode === 'keyboard emoji') {
    await source.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ArrowLeft');
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    expect(await source.evaluate((element: HTMLTextAreaElement) => ({ start: element.selectionStart, end: element.selectionEnd, text: element.value.slice(element.selectionStart, element.selectionEnd) }))).toEqual({ start: 5, end: 7, text: '🌿' });
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(page.getByRole('button', { name: 'Crear segmento', exact: true })).toBeDisabled();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+ArrowLeft');
    expect(await source.evaluate((element: HTMLTextAreaElement) => ({ start: element.selectionStart, end: element.selectionEnd, text: element.value.slice(element.selectionStart, element.selectionEnd) }))).toEqual({ start: 5, end: 7, text: '🌿' });
    await page.keyboard.type('No debe editarse');
    await expect(source).toHaveValue(content);
    await testInfo.attach('keyboard-selection-state', { body: JSON.stringify(await source.evaluate((element: HTMLTextAreaElement) => ({ start: element.selectionStart, end: element.selectionEnd, direction: element.selectionDirection, readonly: element.readOnly }))), contentType: 'application/json' });
    } else {
      const box = await source.boundingBox();
      if (!box) throw new Error('Selectable source has no mouse target');
      await page.mouse.move(box.x + 18, box.y + 29);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 18, box.y + 29, { steps: 12 });
      await page.mouse.up();
    }
    await expect(page.getByText(`Caracteres ${start}–${end}`, { exact: true })).toBeVisible();
    await expect(page.locator('blockquote').filter({ hasText: '🌿' })).toHaveText(`“${selectedText}”`);
    await page.getByLabel('Nota opcional').fill('Observación 🌿');
    await page.getByRole('button', { name: 'Crear segmento', exact: true }).click();
    await expect(page.getByText('Observación 🌿', { exact: true })).toBeVisible();
    expect(ui.requests.find(r => r.method === 'POST' && r.path === path)?.body).toMatchObject({ start_char: start, end_char: end, selected_text: selectedText, base_document_revision: 7 });
    const card = page.locator('article').filter({ hasText: 'Observación 🌿' });
    await expect(card.getByRole('link', { name: /Codificar/ })).toHaveAttribute('href', `/projects/${ui.projectId}/analysis/codes?view=coding&segmentId=${segmentId}`);
    await card.getByRole('button', { name: 'Editar segmento' }).click();
    await card.getByRole('textbox', { name: 'Nota', exact: true }).fill('Nota corregida');
    await card.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText('Nota corregida', { exact: true })).toBeVisible();
    // A nonessential image may still be loading while React and the segment API
    // are already ready. Keep it pending deterministically, not with a sleep.
    const imageGate = ui.mockApi.barrier();
    let imageStarted = false;
    let finishImage!: () => void;
    const imageFinished = new Promise<void>(resolve => { finishImage = resolve; });
    await page.route('**/__qa_pending_segment_image.svg', async route => {
      imageStarted = true;
      try {
        await imageGate.wait;
        await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' });
      } finally { finishImage(); }
    });
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const image = document.createElement('img');
        image.hidden = true;
        image.src = '/__qa_pending_segment_image.svg';
        document.body.appendChild(image);
      }, { once: true });
    });
    try {
      await reloadSegmentWorkspace(page, path);
      await expect(page.getByText('Nota corregida', { exact: true })).toBeVisible();
      await expect(page.locator('blockquote')).toHaveText(`“${selectedText}”`);
      await expect(page.getByText(`Caracteres ${start}–${end}`, { exact: true })).toBeVisible();
      await expect.poll(() => imageStarted).toBe(true);
      expect(await page.evaluate(() => document.readyState)).toBe('interactive');
    } finally {
      imageGate.release();
      // Await the owned intercepted request before another navigation or teardown.
      if (imageStarted) await imageFinished;
    }
    page.once('dialog', dialog => dialog.accept());
    await page.locator('article').filter({ hasText: 'Nota corregida' }).getByRole('button', { name: 'Eliminar segmento' }).click();
    await expect(page.getByText('Sin segmentos todavía', { exact: true })).toBeVisible();
    expect(ui.requests.filter(r => r.method === 'DELETE').map(r => r.path)).toContain(`${path}/${segmentId}`);
    await reloadSegmentWorkspace(page, path);
    await expect(page.getByText('Sin segmentos todavía', { exact: true })).toBeVisible();
  });
  }

  test('reload rejects a failed segment read instead of accepting an empty shell @crossbrowser-smoke', async ({ page, ui }) => {
    // Keep old-document prefetches pending so reload cancellation is exercised
    // deterministically, rather than only on a cold/slow CI worker.
    const prefetchGate = ui.mockApi.barrier();
    let reloading = false;
    let prefetchStarted = false;
    await page.route('**/*', async route => {
      if (!reloading && new URL(route.request().url()).searchParams.has('_rsc')) {
        prefetchStarted = true;
        await prefetchGate.wait;
      }
      await route.fallback();
    });
    ui.seed({ documents: [{ id: documentId, project_id: ui.projectId, title: 'Entrevista Unicode', content,
      document_type: 'interview', revision: 7, deleted_at: null, word_count: 6, character_count: content.length }], segments: [] });
    const path = `/api/projects/${ui.projectId}/documents/${documentId}/segments`;
    ui.mockApi.route('GET', path, () => ({ json: { ok: true, segments: [], total: 0 } }));
    await page.goto(`/projects/${ui.projectId}/analysis/segments?documentId=${documentId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Sin segmentos todavía', { exact: true })).toBeVisible();
    ui.mockApi.route('GET', path, () => ({ status: 503, json: { ok: false, error: 'Lectura de segmentos no disponible (QA)' } }));
    await expect.poll(() => prefetchStarted).toBe(true);
    reloading = true;
    const releasePrefetches = (request: Request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) prefetchGate.release();
    };
    page.on('request', releasePrefetches);
    try {
      await expect(reloadSegmentWorkspace(page, path)).rejects.toThrow('Fresh segment read must succeed after reload');
    } finally {
      prefetchGate.release();
      page.off('request', releasePrefetches);
    }
    await expect(page.getByRole('alert').filter({ hasText: 'Lectura de segmentos no disponible (QA)' })).toBeVisible();
  });

  test('mouse selection captures exact real textarea fragment; empty selection never posts', async ({ page, ui }) => {
    ui.seed({ documents: [{ id: documentId, title: 'Mouse evidence', content: 'Evidencia', document_type: 'interview', revision: 0, deleted_at: null }], segments: [] });
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/documents/${documentId}/segments`, () => ({ json: { ok: true, segments: [], total: 0 } }));
    await page.goto(`/projects/${ui.projectId}/analysis/segments?documentId=${documentId}`, { waitUntil: 'domcontentloaded' });
    const source = page.locator('textarea[readonly]');
    await expect(source).toHaveValue('Evidencia');
    const box = await source.boundingBox();
    if (!box) throw new Error('Selectable source has no mouse target');
    await page.mouse.move(box.x + 18, box.y + 29);
    await page.mouse.down();
    await page.mouse.move(box.x + 125, box.y + 29, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('blockquote').filter({ hasText: 'Evidencia' })).toHaveText('“Evidencia”');
    await page.getByRole('button', { name: 'Limpiar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Crear segmento', exact: true })).toBeDisabled();
    expect(ui.requests.filter(r => r.method === 'POST' && r.path.endsWith('/segments'))).toHaveLength(0);
  });
});
