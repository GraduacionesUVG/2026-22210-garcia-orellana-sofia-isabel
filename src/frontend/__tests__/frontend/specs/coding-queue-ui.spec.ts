import { test, expect } from '../fixtures';

const documentId = '22222222-2222-4222-8222-222222222222';
const codeId = '44444444-4444-4444-8444-444444444444';
const segmentIds = [1, 2, 3, 4].map(n => `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`);
const rows = segmentIds.map((id, i) => ({ id, document_id: documentId, document_title: 'Entrevista de campo',
  selected_text: ['Pendiente uno', 'Pendiente dos', 'Listo tres', 'Listo cuatro'][i], start_char: 0, end_char: 12,
  revision: 0, note: null, participant_label: 'Ana QA', is_coded: i > 1, code_count: i > 1 ? 1 : 0,
  codes: i > 1 ? [{ id: codeId, code_id: codeId, name: 'Cuidado' }] : [] }));
const expectedRows = { Todos: ['Pendiente uno', 'Pendiente dos', 'Listo tres', 'Listo cuatro'],
  Pendientes: ['Pendiente uno', 'Pendiente dos'], Listos: ['Listo tres', 'Listo cuatro'] };
const permutations = [ ['Todos','Pendientes','Listos'], ['Todos','Listos','Pendientes'],
  ['Pendientes','Todos','Listos'], ['Pendientes','Listos','Todos'], ['Listos','Todos','Pendientes'],
  ['Listos','Pendientes','Todos'] ] as const;

function installQueue(ui: any, segments = rows) {
  ui.seed({ segments, codes: [{ id: codeId, name: 'Cuidado', position: 0, revision: 0, color: '#005944', parent_code_id: null }] });
  ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/segments`, ({ url }: any) => {
    const status = url.searchParams.get('status') || 'all';
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const filtered = segments.filter(row => (status === 'all' || row.is_coded === (status === 'coded')) && row.selected_text.toLowerCase().includes(search));
    const limit = Number(url.searchParams.get('limit') || 200);
    const offset = Number(url.searchParams.get('offset') || 0);
    return { status: 200, json: { ok: true, segments: filtered.slice(offset, offset + limit), total: filtered.length,
      counts: { all: segments.length, coded: segments.filter(row => row.is_coded).length, uncoded: segments.filter(row => !row.is_coded).length } } };
  });
  ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/segments/:id/codes`, () => ({ status: 200, json: { ok: true, segment_codes: [] } }));
}

test.describe('coding-queue', () => {
  for (const order of permutations) {
    // Each test receives an independent browser context/cache; removing cache guards must fail this matrix.
    test(`cold and warm ${order.join(' → ')} keep exact mixed rows and badges`, async ({ page, ui }) => {
      installQueue(ui);
      await page.goto(`/projects/${ui.projectId}/analysis/codes?view=coding`);
      const queue = page.locator('aside').filter({ hasText: 'Cola de evidencia' });
      await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toHaveCount(4);
      for (const label of [...order, ...order]) {
        await queue.getByRole('button', { name: label, exact: true }).click();
        await expect(queue.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
        await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toHaveCount(expectedRows[label].length);
        for (const text of expectedRows[label]) await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem').filter({ hasText: text })).toBeVisible();
        await expect(queue.getByText('2 pendientes', { exact: true })).toBeVisible();
      }
      expect(ui.requests.filter((r: any) => r.method === 'GET' && r.path === `/api/projects/${ui.projectId}/analysis/segments`).length).toBeGreaterThan(0);
      await page.reload();
      await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toHaveCount(4);
    });
  }

  test('201 rows do not derive pending rows from the partial first200 page', async ({ page, ui }) => {
    const segments = Array.from({ length: 201 }, (_, i) => ({ ...rows[0], id: `33333333-3333-4333-8333-${String(i + 1).padStart(12, '0')}`,
      selected_text: i === 200 ? 'Pendiente fuera de primera página' : `Listo ${i + 1}`, is_coded: i !== 200, code_count: i === 200 ? 0 : 1 }));
    installQueue(ui, segments);
    await page.goto(`/projects/${ui.projectId}/analysis/codes?view=coding`);
    const queue = page.locator('aside').filter({ hasText: 'Cola de evidencia' });
    await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toHaveCount(200);
    await queue.getByRole('button', { name: 'Pendientes', exact: true }).click();
    await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toHaveCount(1);
    await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toContainText('Pendiente fuera de primera página');
    await expect(queue.getByText('1 pendientes', { exact: true })).toBeVisible();
    expect(ui.requests.some((r: any) => r.path.includes('/analysis/segments') && r.method === 'GET' && r.handled)).toBe(true);
  });

  test('Pendientes is the first user filter in a fresh context', async ({ page, ui }) => {
    installQueue(ui);
    await page.goto(`/projects/${ui.projectId}/analysis/codes?view=coding`);
    const queue = page.locator('aside').filter({ hasText: 'Cola de evidencia' });
    await queue.getByRole('button', { name: 'Pendientes', exact: true }).click();
    await expect(queue.getByRole('button', { name: 'Pendientes', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toHaveCount(2);
  });

  test('reversed search responses cannot restore stale queue data', async ({ page, ui }, testInfo) => {
    installQueue(ui);
    const old = ui.mockApi.barrier();
    let oldStarted = false;
    let oldRequest: any;
    let oldResult: any;
    let resolveOld!: () => void;
    const oldTerminal = new Promise<void>(resolve => { resolveOld = resolve; });
    const path = `/api/projects/${ui.projectId}/analysis/segments`;
    page.on('request', request => {
      const url = new URL(request.url());
      if (request.method() === 'GET' && url.pathname === path && url.searchParams.get('search') === 'uno') oldRequest = request;
    });
    page.on('requestfinished', request => { if (request === oldRequest) { oldResult = { url: request.url(), terminal: 'finished' }; resolveOld(); } });
    page.on('requestfailed', request => { if (request === oldRequest) { oldResult = { url: request.url(), terminal: 'failed', error: request.failure()?.errorText }; resolveOld(); } });
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/segments`, async ({ url }: any) => {
      const search = url.searchParams.get('search') || '';
      if (search === 'uno') { oldStarted = true; await old.wait; }
      const result = rows.filter(row => row.selected_text.toLowerCase().includes(search));
      return { status: 200, json: { ok: true, segments: result, total: result.length, counts: { all: 4, coded: 2, uncoded: 2 } } };
    });
    try {
      await page.goto(`/projects/${ui.projectId}/analysis/codes?view=coding`);
      const queue = page.locator('aside').filter({ hasText: 'Cola de evidencia' });
      await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toHaveCount(4);
      await queue.getByRole('searchbox', { name: 'Buscar segmentos' }).fill('uno');
      await expect.poll(() => oldStarted).toBe(true);
      expect(new URL(oldRequest.url()).searchParams.get('search')).toBe('uno');
      const newResponse = page.waitForResponse(response => {
        const url = new URL(response.url());
        return response.request().method() === 'GET' && url.pathname === path && url.searchParams.get('search') === 'dos';
      });
      await queue.getByRole('searchbox', { name: 'Buscar segmentos' }).fill('dos');
      expect(await (await newResponse).finished()).toBeNull();
      await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toHaveCount(1);
      await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toContainText('Pendiente dos');
      old.release();
      await oldTerminal;
      if (oldResult.terminal === 'finished') {
        const response = await oldRequest.response();
        expect(response?.status()).toBe(200);
        expect((await response.json()).segments.map((row: any) => row.id)).toEqual([segmentIds[0]]);
      } else expect(oldResult.error).toMatch(/abort|cancel/i);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await testInfo.attach('exact-old-search-terminal', { body: JSON.stringify(oldResult), contentType: 'application/json' });
      await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toContainText('Pendiente dos');
      await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem').filter({ hasText: 'Pendiente uno' })).toHaveCount(0);
    } finally { old.release(); }
  });

  test('assign and remove last code invalidate both pending badge and filtered queue', async ({ page, ui }) => {
    const segments = rows.map(row => ({ ...row, codes: [...row.codes] }));
    installQueue(ui, segments);
    const path = `/api/projects/${ui.projectId}/analysis/segments/${segmentIds[0]}/codes`;
    let assigned: any[] = [];
    ui.mockApi.route('GET', path, () => ({ json: { ok: true, segment_codes: assigned } }));
    ui.mockApi.route('POST', path, ({ body }) => {
      assigned = [{ ...body, id: 'assignment-local', segment_id: segmentIds[0], revision: 0 }];
      segments[0] = { ...segments[0], is_coded: true, code_count: 1, codes: [{ id: codeId, code_id: codeId, name: 'Cuidado' }] };
      return { status: 201, json: { ok: true, segment_code: assigned[0] } };
    });
    ui.mockApi.route('DELETE', `${path}/assignment-local`, () => {
      assigned = []; segments[0] = { ...segments[0], is_coded: false, code_count: 0, codes: [] };
      return { json: { ok: true } };
    });
    await page.goto(`/projects/${ui.projectId}/analysis/codes?view=coding&segmentId=${segmentIds[0]}`);
    const queue = page.locator('aside').filter({ hasText: 'Cola de evidencia' });
    const panel = page.getByRole('region', { name: 'Aplica categorías a esta evidencia' });
    await expect(queue.getByText('2 pendientes', { exact: true })).toBeVisible();
    await panel.getByRole('combobox', { name: /^Código/ }).selectOption(codeId);
    await panel.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(queue.getByText('1 pendientes', { exact: true })).toBeVisible();
    await expect(panel.locator('span').filter({ hasText: /^Cuidado$/ })).toBeVisible();
    expect(ui.requests.find(r => r.method === 'POST' && r.path === path)?.body).toMatchObject({ code_id: codeId });
    await page.reload();
    await expect(queue.getByText('1 pendientes', { exact: true })).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await panel.getByRole('button', { name: 'Quitar código', exact: true }).click();
    await expect(panel.getByText(/Este segmento todavía no tiene códigos/)).toBeVisible();
    expect(ui.requests.find(r => r.method === 'DELETE' && r.path === `${path}/assignment-local`)?.status).toBe(200);
    await expect(queue.getByText('2 pendientes', { exact: true })).toBeVisible();
    await queue.getByRole('button', { name: 'Pendientes', exact: true }).click();
    await expect(queue.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem')).toHaveCount(2);
    await page.reload();
    await expect(queue.getByText('2 pendientes', { exact: true })).toBeVisible();
  });
});
