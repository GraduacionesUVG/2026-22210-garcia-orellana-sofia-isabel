import { test, expect } from '../fixtures';

const memo = { id: '66666666-6666-4666-8666-666666666666', title: 'Memo soporte ñ', body: 'Evidencia comunitaria', status: 'confirmed', revision: 0, deleted_at: null };
const insight = { id: '77777777-7777-4777-8777-777777777777', title: 'Hallazgo de cuidado', summary: 'Redes comunitarias', status: 'confirmed', revision: 0, deleted_at: null };

test.describe('report', () => {
  for (const mode of ['empty', 'mixed', 'complete'] as const) {
    test(`${mode} report is reached by sidebar click and shows correct readiness after reload`, async ({ page, ui }) => {
      ui.seed({ memos: mode === 'empty' ? [] : [memo], insights: mode === 'empty' ? [] : [{ ...insight, status: mode === 'mixed' ? 'draft' : 'confirmed' }],
        workflow: { ...ui.dataset.workflow, evidence: {}, phaseMap: mode === 'complete' ? { delimitation: { state: 'completed' }, design: { state: 'completed' } } : {} } });
      await page.goto(`/projects/${ui.projectId}/analysis/memos`);
      await page.locator(`a[href="/projects/${ui.projectId}/report"]`).filter({ visible: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`/projects/${ui.projectId}/report$`));
      await expect(page.getByRole('heading', { name: 'Síntesis del proyecto', exact: true })).toBeVisible();
      await expect(page.getByText(mode === 'complete' ? 'Listo para compartir' : 'Borrador de síntesis', { exact: true })).toBeVisible();
      if (mode !== 'empty') {
        await expect(page.getByRole('heading', { name: memo.title, exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: insight.title, exact: true })).toBeVisible();
      }
      await page.reload();
      await expect(page.getByText(mode === 'complete' ? 'Listo para compartir' : 'Borrador de síntesis', { exact: true })).toBeVisible();
      expect(ui.requests.some(r => r.method === 'GET' && r.path === `/api/projects/${ui.projectId}/analysis/insights`)).toBe(true);
    });
  }

  test('one of four source failures keeps available data and retry recovers', async ({ page, ui }) => {
    ui.seed({ memos: [memo], insights: [insight] });
    let fail = true;
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/dashboard`, () => fail ? { status: 503, json: { ok: false, error: 'Dependencia temporal' } } : { json: { ok: true, overview: { documents_count: 9 } } });
    await page.goto(`/projects/${ui.projectId}/report`);
    await expect(page.getByText('Algunas fuentes del reporte no están disponibles. Puedes reintentar.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: memo.title, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: insight.title, exact: true })).toBeVisible();
    fail = false;
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await expect(page.getByText('Algunas fuentes del reporte no están disponibles. Puedes reintentar.', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: memo.title, exact: true })).toBeVisible();
    expect(ui.requests.filter(r => r.method === 'GET' && r.path.endsWith('/analysis/dashboard')).map(r => r.status)).toContain(503);
  });

  test('total failure has recovery and cannot claim ready', async ({ page, ui }) => {
    for (const suffix of ['workflow', 'analysis/dashboard', 'analysis/memos', 'analysis/insights']) {
      ui.mockApi.route('GET', `/api/projects/${ui.projectId}/${suffix}`, () => ({ status: 503, json: { ok: false, error: 'Reporte no disponible temporalmente' } }));
    }
    await page.goto(`/projects/${ui.projectId}/report`);
    await expect(page.getByText('Reporte no disponible temporalmente', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar', exact: true })).toBeEnabled();
    await expect(page.getByText('Listo para compartir', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await expect.poll(() => ui.requests.filter(r => r.path.endsWith('/analysis/insights')).length).toBeGreaterThanOrEqual(2);
  });

  test('null fields remain readable without rendering null or stale source', async ({ page, ui }) => {
    ui.seed({ memos: [{ ...memo, title: null, body: null }], insights: [{ ...insight, title: null, summary: null, interpretation: null }] });
    await page.goto(`/projects/${ui.projectId}/report`);
    await expect(page.getByRole('heading', { name: 'Memo sin título', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hallazgo sin título', exact: true })).toBeVisible();
    await expect(page.getByText('Este memo todavía no tiene contenido.', { exact: true })).toBeVisible();
    await expect(page.getByText('null', { exact: true })).toHaveCount(0);
    ui.seed({ memos: [], insights: [] });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Memo sin título', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Hallazgo sin título', exact: true })).toHaveCount(0);
  });

  for (const source of ['memos', 'insights'] as const) {
  test(`report independently retrieves all201 ${source} or truthfully discloses that source limit`, async ({ page, ui }, testInfo) => {
    const original = source === 'memos' ? memo : insight;
    const rows = Array.from({ length: 201 }, (_, i) => ({ ...original, id: `${source}-${i}`, title: `${source} fuente ${i + 1}` }));
    ui.seed({ workflow: { ...ui.dataset.workflow, evidence: {} }, memos: source === 'memos' ? rows : [memo], insights: source === 'insights' ? rows : [insight] });
    const retrieved = new Set<string>();
    const observed: Promise<void>[] = [];
    const observationErrors: string[] = [];
    const path = `/api/projects/${ui.projectId}/analysis/${source}`;
    page.on('response', response => {
      if (response.request().method() !== 'GET' || new URL(response.url()).pathname !== path) return;
      observed.push((async () => {
        expect(await response.finished()).toBeNull();
        const json = await response.json();
        for (const row of json[source] ?? []) retrieved.add(row.id);
      })().catch(error => { observationErrors.push(String(error)); }));
    });
    await page.goto(`/projects/${ui.projectId}/report`);
    await expect(page.getByRole('heading', { name: 'Síntesis del proyecto', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: rows[0].title, exact: true })).toBeVisible();
    const warning = page.getByText(/primeros 200|más.*200|reporte parcial|fuentes.*incompletas|límite.*(?:memos|hallazgos)/i).filter({ visible: true }).first();
    try {
      await expect.poll(async () => {
        await Promise.all(observed);
        expect(observationErrors).toEqual([]);
        return rows.every(row => retrieved.has(row.id)) || await warning.isVisible();
      }, { message: `${source}: neither complete relevant retrieval nor truthful visible partial state` }).toBe(true);
      if (rows.every(row => retrieved.has(row.id))) {
        const label = source === 'memos' ? 'Memos' : 'Hallazgos';
        const metric = page.locator('div.min-w-0.border-l').filter({ has: page.getByText(label, { exact: true }) });
        await expect(metric.locator('p').first()).toHaveText('201');
        expect(retrieved.has(rows[200].id)).toBe(true);
      } else {
        await expect(warning).toBeVisible();
        expect(retrieved.size).toBeLessThan(201);
      }
    } finally {
      await testInfo.attach(`report-${source}-retrieved-ids`, { body: JSON.stringify([...retrieved]), contentType: 'application/json' });
    }
  });
  }

  for (const source of ['memos', 'insights'] as const) {
    test(`failed final ${source} page remains visibly partial and retry retrieves the complete catalog`, async ({ page, ui }) => {
      const original = source === 'memos' ? memo : insight;
      const rows = Array.from({ length: 201 }, (_, i) => ({ ...original, id: `${source}-${i}`, title: `${source} página ${i + 1}` }));
      ui.seed({ memos: [memo], insights: [insight], workflow: { ...ui.dataset.workflow, evidence: {} } });
      let fail = true;
      const path = `/api/projects/${ui.projectId}/analysis/${source}`;
      ui.mockApi.route('GET', path, ({ url }) => {
        const offset = Number(url.searchParams.get('offset') || 0);
        if (offset === 200 && fail) return { status: 503, json: { ok: false, error: 'DEPENDENCY_UNAVAILABLE' } };
        return { json: { ok: true, [source]: rows.slice(offset, offset + 200) } };
      });
      await page.goto(`/projects/${ui.projectId}/report`);
      await expect(page.getByText('Algunas fuentes del reporte no están disponibles. Puedes reintentar.', { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: source === 'memos' ? insight.title : memo.title, exact: true })).toBeVisible();
      expect(ui.requests.some(r => r.path === path && r.status === 503)).toBe(true);
      fail = false;
      await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
      await expect(page.getByText('Algunas fuentes del reporte no están disponibles. Puedes reintentar.', { exact: true })).toHaveCount(0);
      const label = source === 'memos' ? 'Memos' : 'Hallazgos';
      const metric = page.locator('div.min-w-0.border-l').filter({ has: page.getByText(label, { exact: true }) });
      await expect(metric.locator('p').first()).toHaveText('201');
      await page.reload();
      await expect(metric.locator('p').first()).toHaveText('201');
    });
  }

  test('changing projects through dashboard cannot restore an old report final page after its exact late request terminates', async ({ page, ui }, testInfo) => {
    const secondId = 'a1111111-1111-4111-8111-111111111111';
    ui.seed({ projects: [...ui.dataset.projects, { ...ui.dataset.projects[0], id: secondId, name: 'Segundo proyecto de reporte' }] });
    const barrier = ui.mockApi.barrier();
    const oldPath = `/api/projects/${ui.projectId}/analysis/memos`;
    let started = false;
    let oldRequest: any;
    let terminal: any;
    let resolveOld!: () => void;
    const oldTerminal = new Promise<void>(resolve => { resolveOld = resolve; });
    page.on('request', request => { const url = new URL(request.url()); if (request.method() === 'GET' && url.pathname === oldPath && url.searchParams.get('offset') === '200') oldRequest = request; });
    page.on('requestfinished', request => { if (request === oldRequest) { terminal = { url: request.url(), kind: 'finished' }; resolveOld(); } });
    page.on('requestfailed', request => { if (request === oldRequest) { terminal = { url: request.url(), kind: 'failed', error: request.failure()?.errorText }; resolveOld(); } });
    ui.mockApi.route('GET', oldPath, async ({ url }) => {
      if (Number(url.searchParams.get('offset') || 0) === 0) return { json: { ok: true, memos: Array.from({ length: 200 }, (_, i) => ({ ...memo, id: `old-${i}` })) } };
      started = true; await barrier.wait;
      return { json: { ok: true, memos: [{ ...memo, title: 'FUENTE ANTIGUA NO RESTAURAR' }] } };
    });
    ui.mockApi.route('GET', `/api/projects/${secondId}/analysis/memos`, () => ({ json: { ok: true, memos: [{ ...memo, id: 'second-project-memo', title: 'Fuente exclusiva segundo proyecto' }], total: 1 } }));
    ui.mockApi.route('GET', `/api/projects/${secondId}/analysis/insights`, () => ({ json: { ok: true, insights: [], total: 0 } }));
    try {
      await page.goto(`/projects/${ui.projectId}/report`);
      await expect.poll(() => started).toBe(true);
      await page.getByRole('link', { name: 'Volver a proyectos', exact: true }).click();
      const heading = page.getByRole('heading', { name: 'Segundo proyecto de reporte', exact: true });
      await expect(heading).toBeVisible();
      await page.locator('[role=button]').filter({ has: heading }).click();
      await page.locator(`a[href="/projects/${secondId}/report"]`).filter({ visible: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`/projects/${secondId}/report$`));
      await expect(page.getByRole('heading', { name: 'Fuente exclusiva segundo proyecto', exact: true })).toBeVisible();
      barrier.release(); await oldTerminal;
      if (terminal.kind === 'finished') expect(await (await oldRequest.response()).finished()).toBeNull();
      else expect(terminal.error).toMatch(/abort|cancel/i);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.getByRole('heading', { name: 'FUENTE ANTIGUA NO RESTAURAR', exact: true })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Fuente exclusiva segundo proyecto', exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Fuente exclusiva segundo proyecto', exact: true })).toBeVisible();
    } finally {
      barrier.release();
      await testInfo.attach('previous-project-report-terminal', { body: JSON.stringify(terminal ?? { started }), contentType: 'application/json' });
    }
  });
});
