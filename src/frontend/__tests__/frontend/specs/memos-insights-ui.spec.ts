import { test, expect } from '../fixtures';

const memoId = '66666666-6666-4666-8666-666666666666';
const codeId = '44444444-4444-4444-8444-444444444444';
const segmentId = '33333333-3333-4333-8333-333333333333';
const insightId = '77777777-7777-4777-8777-777777777777';
const memo = { id: memoId, title: 'Memoria 🌿 comunitaria', body: 'Una interpretación Unicode ñ con evidencia.', memo_type: 'analytic', status: 'draft', tags: ['campo'], revision: 3, deleted_at: null, updated_at: '2026-10-04T12:00:00Z' };
const insight = { id: insightId, title: 'Hallazgo de memoria', summary: 'Apoyo vecinal', interpretation: 'Lectura situada', insight_type: 'pattern', confidence: 'medium', status: 'confirmed', tags: [], revision: 0, deleted_at: null, updated_at: '2026-10-04T12:00:00Z' };

test.describe('memos-insights', () => {
  test('insight cards and link panel show resolved context and readable unavailable resources', async ({ page, ui }) => {
    const links = [
      { id: 'link-segment', insight_id: insightId, link_type: 'segment', segment_id: segmentId, target_label: 'Mi hermana me acompañó 🌿' },
      { id: 'link-document', insight_id: insightId, link_type: 'document', document_id: '22222222-2222-4222-8222-222222222222', target_label: 'Entrevista de campo' },
      { id: 'link-missing', insight_id: insightId, link_type: 'code', code_id: codeId, target_label: null },
    ];
    ui.seed({ insights: [insight], insightLinks: links });
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/insights`, () => ({ json: { ok: true, insights: [insight], links } }));
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/insights/${insightId}/links`, () => ({ json: { ok: true, links } }));
    await page.goto(`/projects/${ui.projectId}/analysis/insights`);
    const card = page.locator('article').filter({ hasText: insight.title });
    await expect(card.getByText(/Mi hermana me acompañó 🌿/)).toBeVisible();
    await expect(card.getByText(/Entrevista de campo/)).toBeVisible();
    await expect(card.getByText(/Código no disponible/)).toBeVisible();
    await card.getByRole('button', { name: 'Vínculos', exact: true }).click();
    const panel = page.locator('section').filter({ has: page.getByText('Evidencia del hallazgo', { exact: true }) });
    await expect(panel.getByText('Mi hermana me acompañó 🌿', { exact: true })).toBeVisible();
    await expect(panel.getByText('Documento', { exact: true })).toBeVisible();
    await expect(panel.getByText(segmentId, { exact: true })).toHaveCount(0);
    await expect(panel.getByText(codeId, { exact: true })).toHaveCount(0);
    await panel.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await page.reload();
    await expect(page.locator('article').filter({ hasText: insight.title }).getByText(/Mi hermana me acompañó 🌿/)).toBeVisible();
  });
  test('memo create edit Unicode delete targets one row and survives mocked readback', async ({ page, ui }) => {
    ui.seed({ memos: [{ ...memo, id: '66666666-6666-4666-8666-666666666667', title: 'Memo intacto' }] });
    await page.goto(`/projects/${ui.projectId}/analysis/memos`);
    await page.getByRole('button', { name: 'Nuevo memo', exact: true }).click();
    await page.getByLabel('Título', { exact: true }).fill(memo.title);
    await page.getByLabel('Cuerpo', { exact: true }).fill(memo.body);
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    const card = page.locator('article').filter({ has: page.getByRole('heading', { name: memo.title, exact: true }) });
    await expect(card).toContainText(memo.body);
    const creation = ui.requests.find(r => r.method === 'POST' && r.path.endsWith('/analysis/memos'));
    expect(creation?.body).toMatchObject({ title: memo.title, body: memo.body });
    const id = ui.dataset.memos.find(row => row.title === memo.title)!.id;
    await card.getByRole('button', { name: 'Editar', exact: true }).click();
    await page.getByRole('textbox', { name: 'Cuerpo', exact: true }).fill('Lectura corregida ñ 🌿');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(card).toContainText('Lectura corregida ñ 🌿');
    expect(ui.requests.find(r => r.method === 'PATCH' && r.path.endsWith(`/memos/${id}`))?.body).toMatchObject({ base_revision: 0, body: 'Lectura corregida ñ 🌿' });
    await page.reload(); await expect(card).toContainText('Lectura corregida ñ 🌿');
    page.once('dialog', dialog => dialog.accept());
    await card.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(card).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Memo intacto', exact: true })).toBeVisible();
    expect(ui.requests.filter(r => r.method === 'DELETE').map(r => r.path)).toContain(`/api/projects/${ui.projectId}/analysis/memos/${id}`);
    await page.reload(); await expect(card).toHaveCount(0);
  });

  test('code and segment links created through controls retain labels and unlink only selected row after reload', async ({ page, ui }) => {
    ui.seed({ memos: [memo], codes: [{ id: codeId, name: 'Cuidado vecinal', revision: 0 }],
      segments: [{ id: segmentId, selected_text: 'La comunidad nos apoya', document_id: 'document-1', is_coded: true }] });
    const path = `/api/projects/${ui.projectId}/analysis/memos/${memoId}/links`;
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/segments`, () => ({ json: { ok: true, segments: ui.dataset.segments, total: 1, counts: { all: 1, coded: 1, uncoded: 0 } } }));
    let links: any[] = [];
    ui.mockApi.route('GET', path, () => ({ json: { ok: true, links } }));
    ui.mockApi.route('POST', path, ({ body }) => {
      const link = { ...body, id: body.link_type === 'code' ? 'link-code' : 'link-segment', memo_id: memoId };
      links.push(link); return { status: 201, json: { ok: true, link } };
    });
    ui.mockApi.route('DELETE', `${path}/link-code`, () => { links = links.filter(row => row.id !== 'link-code'); return { json: { ok: true } }; });
    await page.goto(`/projects/${ui.projectId}/analysis/memos`);
    await page.locator('article').filter({ hasText: memo.title }).getByRole('button', { name: 'Vínculos', exact: true }).click();
    const panel = page.locator('section').filter({ has: page.getByText('Vínculos del memo', { exact: true }) });
    await panel.locator('select').first().selectOption('code');
    await panel.locator('select').nth(1).selectOption(codeId);
    await panel.getByRole('button', { name: 'Vincular', exact: true }).click();
    await expect(panel.locator('p').filter({ hasText: /^Cuidado vecinal$/ })).toBeVisible();
    await panel.locator('select').first().selectOption('segment');
    await panel.getByPlaceholder('ID del segmento', { exact: true }).fill(segmentId);
    await panel.getByRole('button', { name: 'Vincular', exact: true }).click();
    await expect(panel.getByText('La comunidad nos apoya', { exact: true })).toBeVisible();
    expect(ui.requests.filter(r => r.method === 'POST' && r.path === path).map(r => r.body)).toEqual([
      { link_type: 'code', code_id: codeId }, { link_type: 'segment', segment_id: segmentId },
    ]);
    await expect(panel.getByText(segmentId, { exact: true })).toHaveCount(0);
    await panel.locator('div').filter({ has: page.locator('p').filter({ hasText: /^Cuidado vecinal$/ }) }).filter({ has: page.getByRole('button', { name: 'Eliminar vínculo' }) }).last().getByRole('button', { name: 'Eliminar vínculo' }).click();
    await expect(panel.locator('p').filter({ hasText: /^Cuidado vecinal$/ })).toHaveCount(0);
    await expect(panel.getByText('La comunidad nos apoya', { exact: true })).toBeVisible();
    expect(ui.requests.filter(r => r.method === 'DELETE').map(r => r.path)).toEqual([`${path}/link-code`]);
    await panel.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await page.reload();
    await page.locator('article').filter({ hasText: memo.title }).getByRole('button', { name: 'Vínculos', exact: true }).click();
    await expect(panel.getByText('La comunidad nos apoya', { exact: true })).toBeVisible();
    await expect(panel.locator('p').filter({ hasText: /^Cuidado vecinal$/ })).toHaveCount(0);
    expect(ui.requests.filter(r => r.method === 'GET' && r.path === path)).toHaveLength(5);
    expect(links.map(row => ({ type: row.link_type, target: row.segment_id ?? row.code_id }))).toEqual([{ type: 'segment', target: segmentId }]);
  });

  for (const type of ['document', 'participant'] as const) {
    test(`memo ${type} links search beyond page one, persist labels after reload and unlink only the selected target`, async ({ page, ui }) => {
      const key = type === 'document' ? 'documents' : 'participants';
      const label = type === 'document' ? 'Documento' : 'Participante';
      const title = type === 'document' ? 'Entrevista 🌿 completa' : 'P201 · Madre acompañante';
      const id = '22222222-2222-4222-8222-000000000201';
      const target = type === 'document' ? { id, title, revision: 0, deleted_at: null } : { id, alias: title, display_name: null, revision: 0, deleted_at: null };
      const rows = Array.from({ length: 201 }, (_, i) => ({ id: `22222222-2222-4222-8222-${String(i + 1).padStart(12, '0')}`, title: `Documento ${i + 1}`, alias: `P${i + 1}`, deleted_at: null }));
      rows[200] = target as any;
      ui.seed({ memos: [memo], [key]: rows, codes: [{ id: codeId, name: 'Código que se conserva', revision: 0 }] });
      const catalogPath = `/api/projects/${ui.projectId}/${key}`;
      ui.mockApi.route('GET', catalogPath, ({ url }) => {
        const limit = Number(url.searchParams.get('limit')), offset = Number(url.searchParams.get('offset'));
        if (limit < 1 || limit > 100) return { status: 400, json: { ok: false, error: 'Invalid catalog page size' } };
        const search = url.searchParams.get('search')?.toLowerCase() || '';
        const found = rows.filter(row => String(row.title || row.alias).toLowerCase().includes(search));
        return { json: { ok: true, [key]: found.slice(offset, offset + limit), total: found.length } };
      });
      const path = `/api/projects/${ui.projectId}/analysis/memos/${memoId}/links`;
      let links: any[] = [{ id: 'retained-link', memo_id: memoId, link_type: 'code', code_id: codeId }];
      ui.mockApi.route('GET', path, () => ({ json: { ok: true, links } }));
      ui.mockApi.route('POST', path, ({ body }) => { const link = { ...body, id: 'new-link', memo_id: memoId }; links.push(link); return { status: 201, json: { ok: true, link } }; });
      ui.mockApi.route('DELETE', `${path}/new-link`, () => { links = links.filter(link => link.id !== 'new-link'); return { json: { ok: true } }; });
      const open = async () => { await page.locator('article').filter({ hasText: memo.title }).getByRole('button', { name: 'Vínculos', exact: true }).click(); };
      await page.goto(`/projects/${ui.projectId}/analysis/memos`); await open();
      const panel = page.locator('section').filter({ has: page.getByText('Vínculos del memo', { exact: true }) });
      await panel.getByLabel('Tipo de vínculo', { exact: true }).selectOption(type);
      await expect(panel.getByLabel(label, { exact: true }).locator('option').nth(1)).toHaveText(type === 'document' ? 'Documento 1' : 'P1');
      await panel.getByRole('button', { name: 'Siguiente', exact: true }).click();
      await expect(panel.getByLabel(label, { exact: true }).locator('option').nth(1)).toHaveText(type === 'document' ? 'Documento 51' : 'P51');
      await panel.getByLabel('Buscar recurso', { exact: true }).fill(title);
      await panel.getByRole('button', { name: 'Buscar', exact: true }).click();
      await expect(panel.getByLabel(label, { exact: true }).locator(`option[value="${id}"]`)).toHaveText(title);
      await panel.getByLabel(label, { exact: true }).selectOption(id);
      await panel.getByRole('button', { name: 'Vincular', exact: true }).click();
      await expect(panel.locator('p').filter({ hasText: title }).last()).toHaveText(title);
      expect(ui.requests.filter(r => r.method === 'POST' && r.path === path).map(r => r.body)).toEqual([{ link_type: type, [`${type}_id`]: id }]);
      await panel.getByRole('button', { name: 'Cerrar', exact: true }).click(); await page.reload(); await open();
      await expect(panel.locator('p').filter({ hasText: title }).last()).toHaveText(title);
      await expect(panel.getByText(id, { exact: true })).toHaveCount(0);
      await panel.locator('div').filter({ has: page.locator('p').filter({ hasText: title }) }).filter({ has: page.getByRole('button', { name: 'Eliminar vínculo' }) }).last().getByRole('button', { name: 'Eliminar vínculo' }).click();
      await expect(panel.locator('p').filter({ hasText: title })).toHaveCount(0);
      await expect(panel.locator('p').filter({ hasText: /^Código que se conserva$/ })).toBeVisible();
      expect(ui.requests.filter(r => r.method === 'DELETE').map(r => r.path)).toEqual([`${path}/new-link`]);
      await panel.getByRole('button', { name: 'Cerrar', exact: true }).click(); await page.reload(); await open();
      await expect(panel.locator('p').filter({ hasText: title })).toHaveCount(0);
      await expect(panel.locator('p').filter({ hasText: /^Código que se conserva$/ })).toBeVisible();
      expect(links).toEqual([{ id: 'retained-link', memo_id: memoId, link_type: 'code', code_id: codeId }]);
    });
  }

  test('memo catalog failure is visible and retry recovers; failed403 linking preserves selection without a false success', async ({ page, ui }) => {
    const id = '22222222-2222-4222-8222-222222222222';
    ui.seed({ memos: [memo], documents: [{ id, title: 'Documento local', deleted_at: null }] });
    const path = `/api/projects/${ui.projectId}/analysis/memos/${memoId}/links`;
    ui.mockApi.route('GET', path, () => ({ json: { ok: true, links: [] } }));
    let failed = true;
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/documents`, () => failed ? { status: 503, json: { ok: false, error: 'Catálogo temporalmente no disponible' } } : { json: { ok: true, documents: ui.dataset.documents, total: 1 } });
    ui.mockApi.route('POST', path, () => ({ status: 403, json: { ok: false, error: 'FORBIDDEN' } }));
    await page.goto(`/projects/${ui.projectId}/analysis/memos`);
    await page.locator('article').filter({ hasText: memo.title }).getByRole('button', { name: 'Vínculos', exact: true }).click();
    const panel = page.locator('section').filter({ has: page.getByText('Vínculos del memo', { exact: true }) });
    await panel.getByLabel('Tipo de vínculo', { exact: true }).selectOption('document');
    await expect(panel.getByRole('alert')).toContainText('Catálogo temporalmente no disponible');
    failed = false; await panel.getByRole('button', { name: 'Reintentar catálogo', exact: true }).click();
    await panel.getByLabel('Documento', { exact: true }).selectOption(id);
    await panel.getByRole('button', { name: 'Vincular', exact: true }).click();
    await expect(panel.getByRole('alert')).toContainText('FORBIDDEN');
    await expect(panel.getByLabel('Documento', { exact: true })).toHaveValue(id);
    await expect(panel.getByText('El vínculo se creó correctamente.', { exact: true })).toHaveCount(0);
    expect(ui.requests.filter(r => r.method === 'POST' && r.path === path)).toHaveLength(1);
  });

  test('viewer can inspect memo links but has no linking or unlinking controls', async ({ page, ui }) => {
    ui.seed({ identity: { ...ui.identity, role: 'viewer' }, memos: [memo], codes: [{ id: codeId, name: 'Solo lectura' }] });
    const path = `/api/projects/${ui.projectId}/analysis/memos/${memoId}/links`;
    ui.mockApi.route('GET', path, () => ({ json: { ok: true, links: [{ id: 'existing', link_type: 'code', code_id: codeId }] } }));
    await page.goto(`/projects/${ui.projectId}/analysis/memos`);
    await page.locator('article').filter({ hasText: memo.title }).getByRole('button', { name: 'Vínculos', exact: true }).click();
    const panel = page.locator('section').filter({ has: page.getByText('Vínculos del memo', { exact: true }) });
    await expect(panel.locator('p').filter({ hasText: /^Solo lectura$/ })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Vincular', exact: true })).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Eliminar vínculo', exact: true })).toHaveCount(0);
    expect(ui.requests.filter(r => r.method !== 'GET')).toHaveLength(0);
  });

  for (const method of ['POST', 'DELETE'] as const) {
    test(`memo pending ${method} cannot reopen a closed memo over the newly selected memo`, async ({ page, ui }) => {
      const second = { ...memo, id: '66666666-6666-4666-8666-666666666667', title: 'Segundo memo' };
      ui.seed({ memos: [memo, second], codes: [{ id: codeId, name: 'Cuidado' }] });
      const path = `/api/projects/${ui.projectId}/analysis/memos/${memoId}/links`;
      const barrier = ui.mockApi.barrier();
      ui.mockApi.route('GET', path, () => ({ json: { ok: true, links: method === 'DELETE' ? [{ id: 'existing', link_type: 'code', code_id: codeId }] : [] } }));
      ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/memos/${second.id}/links`, () => ({ json: { ok: true, links: [] } }));
      ui.mockApi.route(method, method === 'POST' ? path : `${path}/existing`, async () => { await barrier.wait; return { json: { ok: true, link: { id: 'new' } } }; });
      await page.goto(`/projects/${ui.projectId}/analysis/memos`);
      await page.locator('article').filter({ hasText: memo.title }).getByRole('button', { name: 'Vínculos', exact: true }).click();
      const panel = page.locator('section').filter({ has: page.getByText('Vínculos del memo', { exact: true }) });
      await expect(panel.getByRole('button', { name: 'Vincular', exact: true })).toBeEnabled();
      if (method === 'POST') await panel.getByRole('combobox', { name: 'Código', exact: true }).selectOption(codeId);
      await panel.getByRole('button', { name: method === 'POST' ? 'Vincular' : 'Eliminar vínculo', exact: true }).click();
      await expect(panel.getByRole('button', { name: 'Vincular', exact: true })).toBeDisabled();
      await panel.getByRole('button', { name: 'Cerrar', exact: true }).click();
      await page.locator('article').filter({ hasText: second.title }).getByRole('button', { name: 'Vínculos', exact: true }).click();
      await expect(panel.getByRole('heading', { name: second.title, exact: true })).toBeVisible();
      barrier.release();
      await expect(panel.getByRole('button', { name: 'Vincular', exact: true })).toBeEnabled();
      await expect(panel.getByRole('heading', { name: second.title, exact: true })).toBeVisible();
      expect(ui.requests.filter(r => r.method === 'GET' && r.path === path)).toHaveLength(1);
    });
  }

  test('one missing linked document does not hide sibling labels or segments and can retry hydration', async ({ page, ui }) => {
    const missing = '22222222-2222-4222-8222-000000000001', good = '22222222-2222-4222-8222-000000000002';
    ui.seed({ memos: [memo], documents: [{ id: good, title: 'Documento intacto', deleted_at: null }], segments: [{ id: segmentId, selected_text: 'Evidencia intacta', is_coded: true }] });
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/memos/${memoId}/links`, () => ({ json: { ok: true, links: [
      { id: 'missing', link_type: 'document', document_id: missing }, { id: 'good', link_type: 'document', document_id: good }, { id: 'segment', link_type: 'segment', segment_id: segmentId },
    ] } }));
    let unavailable = true;
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/documents/${missing}`, () => unavailable ? { status: 404, json: { ok: false, error: 'DOCUMENT_NOT_FOUND' } } : { json: { ok: true, document: { id: missing, title: 'Documento recuperado' } } });
    await page.goto(`/projects/${ui.projectId}/analysis/memos`);
    await page.locator('article').filter({ hasText: memo.title }).getByRole('button', { name: 'Vínculos', exact: true }).click();
    const panel = page.locator('section').filter({ has: page.getByText('Vínculos del memo', { exact: true }) });
    await expect(panel.getByText('Documento intacto', { exact: true })).toBeVisible();
    await expect(panel.getByText('Evidencia intacta', { exact: true })).toBeVisible();
    await expect(panel.getByRole('alert')).toBeVisible();
    unavailable = false; await panel.getByRole('button', { name: 'Reintentar vínculos', exact: true }).click();
    await expect(panel.getByText('Documento recuperado', { exact: true })).toBeVisible();
    await expect(panel.getByRole('alert')).toHaveCount(0);
  });

  test('memo hydration blocks writes until complete and cannot erase a later failed mutation', async ({ page, ui }) => {
    const id = '22222222-2222-4222-8222-222222222222';
    ui.seed({ memos: [memo], codes: [{ id: codeId, name: 'Código disponible' }] });
    const path = `/api/projects/${ui.projectId}/analysis/memos/${memoId}/links`;
    const started = ui.mockApi.barrier(), hydration = ui.mockApi.barrier();
    ui.mockApi.route('GET', path, () => ({ json: { ok: true, links: [{ id: 'existing', link_type: 'document', document_id: id }] } }));
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/documents/${id}`, async () => {
      started.release(); await hydration.wait;
      return { json: { ok: true, document: { id, title: 'Documento cargado' } } };
    });
    ui.mockApi.route('POST', path, () => ({ status: 403, json: { ok: false, error: 'FORBIDDEN' } }));
    await page.goto(`/projects/${ui.projectId}/analysis/memos`);
    await page.locator('article').filter({ hasText: memo.title }).getByRole('button', { name: 'Vínculos', exact: true }).click();
    await started.wait;
    const panel = page.locator('section').filter({ has: page.getByText('Vínculos del memo', { exact: true }) });
    try {
      await expect(panel.getByRole('button', { name: 'Vincular', exact: true })).toBeDisabled();
      await expect(panel.getByRole('combobox', { name: 'Código', exact: true })).toBeDisabled();
      expect(ui.requests.filter(r => r.method === 'POST' && r.path === path)).toHaveLength(0);
    } finally { hydration.release(); }
    await expect(panel.getByText('Documento cargado', { exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Vincular', exact: true })).toBeEnabled();
    await panel.getByRole('combobox', { name: 'Código', exact: true }).selectOption(codeId);
    await panel.getByRole('button', { name: 'Vincular', exact: true }).click();
    await expect(panel.getByRole('alert')).toContainText('FORBIDDEN');
    await expect(panel.getByText('Documento cargado', { exact: true })).toBeVisible();
    await expect(panel.getByRole('combobox', { name: 'Código', exact: true })).toHaveValue(codeId);
    expect(ui.requests.filter(r => r.method === 'POST' && r.path === path)).toHaveLength(1);
    await expect(panel.getByText('El vínculo se creó correctamente.', { exact: true })).toHaveCount(0);
  });

  test('permission lookup failure retains readonly memo links and retry restores controls', async ({ page, ui }) => {
    ui.seed({ memos: [memo], codes: [{ id: codeId, name: 'Evidencia legible' }] });
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/analysis/memos/${memoId}/links`, () => ({ json: { ok: true, links: [{ id: 'existing', link_type: 'code', code_id: codeId }] } }));
    let failed = true;
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}`, () => failed ? { status: 503, json: { ok: false, error: 'Permisos temporalmente no disponibles' } } : { json: { ok: true, project: ui.dataset.projects[0] } });
    await page.goto(`/projects/${ui.projectId}/analysis/memos`);
    await page.locator('article').filter({ hasText: memo.title }).getByRole('button', { name: 'Vínculos', exact: true }).click();
    const panel = page.locator('section').filter({ has: page.getByText('Vínculos del memo', { exact: true }) });
    await expect(panel.getByText('Evidencia legible', { exact: true })).toBeVisible();
    await expect(panel.getByText('Este memo todavía no tiene vínculos.')).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Vincular', exact: true })).toHaveCount(0);
    await expect(panel.getByRole('alert')).toContainText('Permisos temporalmente no disponibles');
    failed = false; await panel.getByRole('button', { name: 'Reintentar vínculos', exact: true }).click();
    await expect(panel.getByRole('button', { name: 'Vincular', exact: true })).toBeEnabled();
  });

  for (const [status, error] of [[409, 'MEMO_REVISION_CONFLICT'], [503, 'Dependencia temporal no disponible']] as const) {
    test(`memo ${status} save shows error without success or changed readback`, async ({ page, ui }) => {
      ui.seed({ memos: [memo] });
      ui.mockApi.route('PATCH', `/api/projects/${ui.projectId}/analysis/memos/${memoId}`, () => ({ status, json: { ok: false, error } }));
      await page.goto(`/projects/${ui.projectId}/analysis/memos`);
      await page.locator('article').filter({ hasText: memo.title }).getByRole('button', { name: 'Editar', exact: true }).click();
      await page.getByRole('textbox', { name: 'Cuerpo', exact: true }).fill('No debe guardarse');
      await page.getByRole('button', { name: 'Guardar', exact: true }).click();
      await expect(page.getByText(status === 409 ? 'Este elemento fue modificado en otra pestaña. Recarga antes de guardar para evitar sobrescribir cambios.' : error, { exact: true }).filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('El memo se actualizó correctamente.', { exact: true })).toHaveCount(0);
      expect(ui.requests.find(r => r.method === 'PATCH')?.status).toBe(status);
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await page.reload();
      await expect(page.locator('article').filter({ hasText: memo.title })).toContainText(memo.body);
    });
  }

  test('Hallazgos can recover memo201 and its necessary content through available catalog controls', async ({ page, ui }) => {
    ui.seed({ memos: Array.from({ length: 201 }, (_, i) => ({ ...memo, id: `66666666-6666-4666-8666-${String(i + 1).padStart(12, '0')}`, title: `Memo fuente ${i + 1}`, body: `Contenido completo ñ ${i + 1}` })) });
    await page.goto(`/projects/${ui.projectId}/analysis/insights`);
    await expect(page.getByText('Memo fuente 1', { exact: true })).toBeVisible();
    const sources = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Parte de tus memos para construir el hallazgo', exact: true }) });
    const sentinel = sources.getByText('Memo fuente 201', { exact: true });
    // Accept eager retrieval, searchable catalogs, pagination, or load-more. A warning alone cannot recover a memo.
    const progress = async (action: () => Promise<unknown>) => {
      const rows = sources.locator('article').filter({ hasText: /Memo fuente \d+/ }).filter({ hasText: /Contenido completo ñ \d+/ });
      const before = JSON.stringify(await rows.allTextContents());
      const participating = new Map<import('@playwright/test').Request, { promise: Promise<void>; resolve: () => void; reject: (error: Error) => void }>();
      const observe = (request: import('@playwright/test').Request) => {
        if (request.method() !== 'GET' || new URL(request.url()).pathname !== `/api/projects/${ui.projectId}/analysis/memos`) return;
        let resolve!: () => void, reject!: (error: Error) => void;
        const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
        promise.catch(() => {}); participating.set(request, { promise, resolve, reject });
      };
      const finished = async (request: import('@playwright/test').Request) => {
        const terminal = participating.get(request); if (!terminal) return;
        try { const response = await request.response(); expect(response).not.toBeNull(); expect(await response!.finished()).toBeNull(); terminal.resolve(); }
        catch (error) { terminal.reject(error as Error); }
      };
      const failed = (request: import('@playwright/test').Request) => participating.get(request)?.reject(new Error(`Memo catalog request failed: ${request.failure()?.errorText}`));
      page.on('request', observe); page.on('requestfinished', finished); page.on('requestfailed', failed);
      try {
        await action();
        // Loading/page labels cannot count as progress. Cached actual memo rows can.
        await expect.poll(async () => await sentinel.isVisible() || await rows.count() > 0 && JSON.stringify(await rows.allTextContents()) !== before).toBe(true);
        await Promise.all([...participating.values()].map(terminal => terminal.promise));
        await expect(sources.locator('[aria-busy="true"]')).toHaveCount(0);
        await expect(sources.getByText(/^Cargando(?: memos)?(?:…|\.{3})?$/i)).toHaveCount(0);
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      } finally {
        page.off('request', observe); page.off('requestfinished', finished); page.off('requestfailed', failed);
        participating.forEach(terminal => terminal.resolve());
      }
    };
    const search = sources.getByRole('textbox', { name: /Buscar memo/i }).or(sources.getByPlaceholder(/Buscar memo/i));
    if (!(await sentinel.isVisible()) && await search.count()) {
      await progress(() => search.first().fill('Memo fuente 201'));
    }
    for (let pageNumber = 0; pageNumber < ui.dataset.memos.length && !(await sentinel.isVisible()); pageNumber++) {
      const next = sources.getByRole('button', { name: /^(Siguiente|Página siguiente|Cargar más|Ver más)(?: memos)?$/i }).filter({ visible: true }).first();
      if (!(await next.count())) break;
      // A temporarily disabled Next is pending, not an exhausted catalog. The final sentinel also completes this wait.
      await expect.poll(async () => await sentinel.isVisible() || await next.isEnabled()).toBe(true);
      if (await sentinel.isVisible()) break;
      await progress(() => next.click());
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    }
    await expect(sentinel).toBeVisible();
    await expect(sources.getByText('Contenido completo ñ 201', { exact: true })).toBeVisible();
  });

  test('creates confirmed insight and links memo through UI then report reload retains source', async ({ page, ui }) => {
    ui.seed({ memos: [memo], insights: [] });
    const path = `/api/projects/${ui.projectId}/analysis/insights`;
    let links: any[] = [];
    ui.mockApi.route('POST', path, ({ body }) => { ui.dataset.insights.push({ ...insight, ...body }); return { status: 201, json: { ok: true, insight: ui.dataset.insights[0] } }; });
    ui.mockApi.route('GET', `${path}/${insightId}/links`, () => ({ json: { ok: true, links } }));
    ui.mockApi.route('POST', `${path}/${insightId}/links`, ({ body }) => { const link = { ...body, id: 'linked-memo', insight_id: insightId }; links.push(link); return { status: 201, json: { ok: true, link } }; });
    await page.goto(`/projects/${ui.projectId}/analysis/insights`);
    await expect(page.getByText(memo.body, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Nuevo hallazgo', exact: true }).click();
    await page.getByLabel('Título', { exact: true }).fill(insight.title);
    await page.getByLabel('Resumen', { exact: true }).fill(insight.summary);
    await page.getByLabel('Interpretación', { exact: true }).fill(insight.interpretation);
    await page.locator('section').filter({ has: page.getByRole('heading', { name: 'Nuevo hallazgo', exact: true }) }).getByRole('combobox', { name: /^Estado/ }).selectOption('confirmed');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    const card = page.locator('article').filter({ has: page.getByRole('heading', { name: insight.title, exact: true }) });
    await card.getByRole('button', { name: /Vínculos|Evidencia/ }).click();
    const panel = page.locator('section').filter({ has: page.getByText('Evidencia del hallazgo', { exact: true }) });
    await panel.locator('select').first().selectOption('memo');
    await panel.locator('select').nth(1).selectOption(memoId);
    await panel.getByRole('button', { name: 'Vincular', exact: true }).click();
    await expect(panel.locator('p').filter({ hasText: /^Memoria 🌿 comunitaria$/ })).toBeVisible();
    expect(ui.requests.find(r => r.method === 'POST' && r.path.endsWith('/links'))?.body).toMatchObject({ link_type: 'memo', memo_id: memoId });
    await panel.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await page.goto(`/projects/${ui.projectId}/report`); await page.reload();
    await expect(page.getByRole('heading', { name: insight.title, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: memo.title, exact: true })).toBeVisible();
    await expect(page.getByText(/Selecciona Discutir/)).toHaveCount(0);
    await page.goto(`/projects/${ui.projectId}/analysis/insights`);
    await page.reload();
    await card.getByRole('button', { name: /Vínculos|Evidencia/ }).click();
    await expect(panel.locator('p').filter({ hasText: /^Memoria 🌿 comunitaria$/ })).toBeVisible();
    expect(ui.requests.filter(r => r.method === 'GET' && r.path === `${path}/${insightId}/links`)).toHaveLength(3);
    expect(links).toEqual([{ id: 'linked-memo', insight_id: insightId, link_type: 'memo', memo_id: memoId }]);
  });
});
