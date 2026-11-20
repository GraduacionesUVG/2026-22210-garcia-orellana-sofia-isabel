import { test, expect } from '../fixtures';
import type { Page, Request } from '@playwright/test';
import { assertWorkspaceOperable, attachContextRuntimeErrorMonitor } from '../browser-assertions';
import { createMockApi } from '../mock-api';

function observeRequestTerminal(page: Page, request: Request) {
  let resolve!: (terminal: { kind: 'finished' | 'failed'; error: string | null }) => void;
  const terminal = new Promise<{ kind: 'finished' | 'failed'; error: string | null }>(done => { resolve = done; });
  const finished = (candidate: Request) => { if (candidate === request) resolve({ kind: 'finished', error: null }); };
  const failed = (candidate: Request) => { if (candidate === request) resolve({ kind: 'failed', error: candidate.failure()?.errorText ?? null }); };
  page.on('requestfinished', finished); page.on('requestfailed', failed);
  return { terminal, dispose: () => { page.off('requestfinished', finished); page.off('requestfailed', failed); } };
}

test.describe('workflow real form controls with local readback', () => {
  test('delimitation conflict remains alerted after an independent criterion saves successfully', async ({ page, ui }) => {
    const path = `/api/projects/${ui.projectId}/delimitation`;
    ui.mockApi.route('PATCH', path, () => ({ status: 409, json: { ok: false, error: 'Conflicto persistente de delimitación', code: 'DELIMITATION_REVISION_CONFLICT', latest_delimitation: { ...ui.dataset.delimitation.delim, revision: 7 } } }));
    ui.mockApi.route('POST', `${path}/items`, ({ body }) => {
      const item = { id: 'independent-criterion', ...body };
      ui.dataset.delimitation.include.push(item);
      return { status: 201, json: { ok: true, item } };
    });
    await page.goto(`/projects/${ui.projectId}/delimitation`);
    const field = page.getByPlaceholder('Describe tu tema central...');
    await field.fill('Borrador delimitación no guardado');
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Conflicto persistente de delimitación');
    await page.locator('#delimitation-include').getByPlaceholder('Agregar criterio...', { exact: true }).fill('Criterio independiente guardado');
    await page.locator('#delimitation-include').getByTitle('Agregar', { exact: true }).click();
    await expect(page.getByText('Criterio independiente guardado', { exact: true })).toBeVisible();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Conflicto persistente de delimitación');
    await expect(page.getByText('Draft Guardado', { exact: true })).toHaveCount(0);
    await expect(field).toHaveValue('Borrador delimitación no guardado');
    expect(ui.requests.filter(request => request.method === 'PATCH' && request.path === path)).toHaveLength(1);
    expect(ui.dataset.delimitation.delim.topic).not.toBe('Borrador delimitación no guardado');
  });

  test('research conflict remains alerted after an independent specific objective saves successfully', async ({ page, ui }) => {
    const path = `/api/projects/${ui.projectId}/research-design`;
    ui.mockApi.route('PATCH', path, () => ({ status: 409, json: { ok: false, error: 'Conflicto persistente de diseño', code: 'RESEARCH_DESIGN_REVISION_CONFLICT', latest_design: { ...ui.dataset.researchDesign.design, revision: 7 } } }));
    await page.goto(`/projects/${ui.projectId}/research-design`);
    const question = page.getByPlaceholder('Ej: ¿Cómo perciben los estudiantes universitarios el uso de inteligencia artificial generativa en sus procesos de aprendizaje?');
    await question.fill('Pregunta de diseño no guardada');
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Conflicto persistente de diseño');
    await page.getByRole('button', { name: /Agregar objetivo/ }).click();
    await page.getByPlaceholder('Ej: Identificar los usos académicos más frecuentes de la inteligencia artificial generativa entre estudiantes universitarios.').fill('Objetivo independiente guardado');
    await expect.poll(() => ui.dataset.researchDesign.specific_objectives[0]?.text).toBe('Objetivo independiente guardado');
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Conflicto persistente de diseño');
    await expect(page.getByText('Draft Guardado', { exact: true })).toHaveCount(0);
    await expect(question).toHaveValue('Pregunta de diseño no guardada');
    expect(ui.requests.filter(request => request.method === 'PATCH' && request.path === path)).toHaveLength(1);
    expect(ui.dataset.researchDesign.design.research_question).not.toBe('Pregunta de diseño no guardada');
  });

  test('specific objective conflict remains alerted after an independent question saves successfully', async ({ page, ui }) => {
    const objective = { id: 'objective-alert', text: 'Objetivo original', revision: 2, position: 0 };
    ui.seed({ researchDesign: { design: { research_question: '', general_objective: '', revision: 0 }, specific_objectives: [objective] } });
    const path = `/api/projects/${ui.projectId}/research-design/specific-objectives/${objective.id}`;
    ui.mockApi.route('PATCH', path, () => ({ status: 409, json: { ok: false, error: 'Conflicto persistente de objetivo', code: 'SPECIFIC_OBJECTIVE_REVISION_CONFLICT', latest_objective: { ...objective, revision: 3 } } }));
    await page.goto(`/projects/${ui.projectId}/research-design`);
    const field = page.getByPlaceholder('Ej: Identificar los usos académicos más frecuentes de la inteligencia artificial generativa entre estudiantes universitarios.');
    await field.fill('Objetivo específico no guardado');
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Conflicto persistente de objetivo');
    await page.getByPlaceholder('Ej: ¿Cómo perciben los estudiantes universitarios el uso de inteligencia artificial generativa en sus procesos de aprendizaje?').fill('Pregunta independiente guardada');
    await expect.poll(() => ui.dataset.researchDesign.design.research_question).toBe('Pregunta independiente guardada');
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Conflicto persistente de objetivo');
    await expect(page.getByText('Draft Guardado', { exact: true })).toHaveCount(0);
    await expect(field).toHaveValue('Objetivo específico no guardado');
    expect(ui.requests.filter(request => request.method === 'PATCH' && request.path === path)).toHaveLength(1);
    expect(ui.dataset.researchDesign.specific_objectives[0].text).toBe('Objetivo original');
  });

  test('specific objective conflict preserves local text and never retries the newer server revision', async ({ page, ui }, testInfo) => {
    const objective = { id: 'objective-conflict', text: 'Objetivo guardado original', revision: 2, position: 0 };
    ui.seed({ researchDesign: { design: { research_question: '', general_objective: '', revision: 0 }, specific_objectives: [objective] } });
    const path = `/api/projects/${ui.projectId}/research-design/specific-objectives/${objective.id}`;
    let writes = 0;
    ui.mockApi.route('PATCH', path, ({ body }) => {
      writes += 1;
      return writes === 1
        ? { status: 409, json: { ok: false, error: 'Conflicto del objetivo específico', code: 'SPECIFIC_OBJECTIVE_REVISION_CONFLICT', latest_objective: { ...objective, text: 'Objetivo de otra persona', revision: 3 } } }
        : { status: 200, json: { ok: true, objective: { ...objective, text: body.text, revision: 4 } } };
    });
    await page.goto(`/projects/${ui.projectId}/research-design`);
    const field = page.getByPlaceholder('Ej: Identificar los usos académicos más frecuentes de la inteligencia artificial generativa entre estudiantes universitarios.');
    await expect(field).toHaveValue('Objetivo guardado original');
    await field.fill('Mi objetivo específico en conflicto');
    await expect(page.getByText('Conflicto del objetivo específico', { exact: true })).toBeVisible();
    await expect(field).toHaveValue('Mi objetivo específico en conflicto');
    expect(writes).toBe(1);
    expect(ui.requests.filter(request => request.method === 'PATCH' && request.path === path).map(request => request.body)).toEqual([{ base_revision: 2, text: 'Mi objetivo específico en conflicto' }]);
    expect(ui.dataset.researchDesign.specific_objectives[0]).toEqual(objective);
    await testInfo.attach('specific-objective-conflict-requests', { body: JSON.stringify(ui.requests), contentType: 'application/json' });
  });

  test('delimitation edits after reload use the loaded server revision', async ({ page, ui }) => {
    ui.dataset.delimitation.delim.topic = 'Delimitación de revisión siete';
    ui.dataset.delimitation.delim.revision = 7;
    const path = `/api/projects/${ui.projectId}/delimitation`;
    ui.mockApi.route('PATCH', path, ({ body }) => {
      if (body.base_revision !== ui.dataset.delimitation.delim.revision) return { status: 409, json: { ok: false, error: 'Revisión obsoleta', code: 'DELIMITATION_REVISION_CONFLICT', latest_delimitation: { ...ui.dataset.delimitation.delim } } };
      Object.assign(ui.dataset.delimitation.delim, body, { revision: ui.dataset.delimitation.delim.revision + 1 });
      return { status: 200, json: { ok: true, delim: { ...ui.dataset.delimitation.delim } } };
    });
    await page.goto(`/projects/${ui.projectId}/delimitation`);
    const field = page.getByPlaceholder('Describe tu tema central...');
    await expect(field).toHaveValue('Delimitación de revisión siete');
    await field.fill('Primer cambio con revisión cargada');
    await expect.poll(() => ui.dataset.delimitation.delim.topic).toBe('Primer cambio con revisión cargada');
    await page.reload();
    await expect(field).toHaveValue('Primer cambio con revisión cargada');
    const revision = ui.dataset.delimitation.delim.revision;
    await field.fill('Segundo cambio después de recargar');
    await expect.poll(() => ui.dataset.delimitation.delim.topic).toBe('Segundo cambio después de recargar');
    expect(ui.requests.filter(request => request.method === 'PATCH' && request.path === path).at(-1)?.body.base_revision).toBe(revision);
    expect(ui.requests.some(request => request.path === path && request.status === 409)).toBe(false);
  });

  test('two contexts competing research edits expose conflict instead of retrying an unapproved overwrite', async ({ page, browser, baseURL, ui }, testInfo) => {
    const contextB = await browser.newContext({ baseURL });
    const pageB = await contextB.newPage(), datasetB = structuredClone(ui.dataset), apiB = createMockApi(datasetB);
    await apiB.install(contextB, datasetB, baseURL);
    const monitorB = await attachContextRuntimeErrorMonitor(contextB);
    const shared = { research_question: '', general_objective: '', revision: 0 };
    const path = `/api/projects/${ui.projectId}/research-design`;
    for (const api of [ui.mockApi, apiB]) {
      api.route('GET', path, () => ({ status: 200, json: { ok: true, data: { design: { ...shared }, specific_objectives: [] } } }));
      api.route('PATCH', path, ({ body }) => {
        if (body.base_revision !== shared.revision) return { status: 409, json: { ok: false, error: 'GAP02 competing revision conflict', code: 'RESEARCH_DESIGN_REVISION_CONFLICT', latest_design: { ...shared } } };
        Object.assign(shared, body, { revision: shared.revision + 1 }); return { status: 200, json: { ok: true, design: { ...shared } } };
      });
    }
    const placeholder = 'Ej: ¿Cómo perciben los estudiantes universitarios el uso de inteligencia artificial generativa en sus procesos de aprendizaje?';
    try {
      await page.goto(`/projects/${ui.projectId}/research-design`); await pageB.goto(`/projects/${ui.projectId}/research-design`);
      await expect(page.getByPlaceholder(placeholder)).toHaveValue(''); await expect(pageB.getByPlaceholder(placeholder)).toHaveValue('');
      await page.getByPlaceholder(placeholder).fill('GAP02 context A accepted question');
      await expect.poll(() => shared.research_question).toBe('GAP02 context A accepted question');
      await pageB.getByPlaceholder(placeholder).fill('GAP02 context B local conflict');
      await expect.poll(() => apiB.requests.some(row => row.path === path && row.status === 409)).toBe(true);
      await expect(pageB.getByText('GAP02 competing revision conflict', { exact: true })).toBeVisible();
      expect(apiB.requests.filter(row => row.method === 'PATCH' && row.path === path)).toHaveLength(1);
      await expect(pageB.getByPlaceholder(placeholder)).toHaveValue('GAP02 context B local conflict');
      expect(shared.research_question).toBe('GAP02 context A accepted question');
      await monitorB.assertClean();
    } finally {
      await testInfo.attach('GAP02-context-competition', { body: JSON.stringify({ shared, sessionA: ui.requests, sessionB: apiB.requests }), contentType: 'application/json' });
      monitorB.dispose(); apiB.releaseAll(); await contextB.close(); apiB.assertNoUnexpectedRequests();
    }
  });

  test('pending research autosave settles after actual navigation without replacing the sample draft', async ({ page, ui }, testInfo) => {
    const held = ui.mockApi.barrier(); let started = false;
    const path = `/api/projects/${ui.projectId}/research-design`;
    ui.mockApi.route('PATCH', path, async ({ body }) => {
      started = true; await held.wait;
      Object.assign(ui.dataset.researchDesign.design, body, { revision: ui.dataset.researchDesign.design.revision + 1 });
      return { status: 200, json: { ok: true, design: ui.dataset.researchDesign.design } };
    });
    ui.mockApi.route('PATCH', `/api/projects/${ui.projectId}/sample-config`, ({ body }) => {
      Object.assign(ui.dataset.sampleConfig.config, body, { revision: ui.dataset.sampleConfig.config.revision + 1 });
      ui.dataset.sampleConfig.collection_techniques = body.collection_techniques;
      return { status: 200, json: { ok: true, data: ui.dataset.sampleConfig } };
    });
    let oldTerminal: ReturnType<typeof observeRequestTerminal> | undefined;
    let oldRequestEvidence: { method: string; url: string; body: any; terminal?: { kind: 'finished' | 'failed'; error: string | null } } | undefined;
    try {
      await page.goto(`/projects/${ui.projectId}/research-design`);
      const oldRequestStarted = page.waitForRequest(request => request.method() === 'PATCH' && new URL(request.url()).pathname === path);
      await page.getByPlaceholder('Ej: ¿Cómo perciben los estudiantes universitarios el uso de inteligencia artificial generativa en sus procesos de aprendizaje?').fill('GAP02 pending design draft');
      await expect.poll(() => started).toBe(true);
      const oldRequest = await oldRequestStarted;
      oldTerminal = observeRequestTerminal(page, oldRequest);
      oldRequestEvidence = { method: oldRequest.method(), url: oldRequest.url(), body: oldRequest.postDataJSON() };
      await page.getByRole('link', { name: /^Muestra / }).click();
      await expect(page).toHaveURL(new RegExp(`/projects/${ui.projectId}/sample-config$`));
      const sample = page.getByPlaceholder('Ej. Trabajo de campo inicial con acceso preliminar a comunidades urbanas.');
      await sample.fill('GAP02 next module independent draft');
      await expect.poll(() => ui.dataset.sampleConfig.config.field_phase).toBe('GAP02 next module independent draft');
      held.release(); oldRequestEvidence.terminal = await oldTerminal.terminal;
      if (oldRequestEvidence.terminal.kind === 'failed') {
        expect(oldRequestEvidence.terminal.error).toMatch(/^(net::ERR_ABORTED|NS_BINDING_ABORTED|Load request cancelled)$/);
      } else {
        const response = await oldRequest.response();
        expect(response).not.toBeNull(); expect(await response!.finished()).toBeNull();
      }
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(sample).toHaveValue('GAP02 next module independent draft');
      await expect(page.getByRole('heading', { name: 'Configuración de muestra', exact: true })).toBeVisible();
      await page.reload(); await expect(sample).toHaveValue('GAP02 next module independent draft');
      expect(oldRequestEvidence.body.research_question).toBe('GAP02 pending design draft');
    } finally {
      oldTerminal?.dispose(); held.release();
      await testInfo.attach('GAP02-pending-navigation', { body: JSON.stringify({ oldRequest: oldRequestEvidence, requests: ui.requests }), contentType: 'application/json' });
    }
  });
  test('delimitation autosaves all five real fields and criteria survive reload', async ({ page, ui }, testInfo) => {
    const criteria = ui.dataset.delimitation.include;
    ui.mockApi.route('POST', `/api/projects/${ui.projectId}/delimitation/items`, ({ body }) => {
      const item = { id: 'criterion-1', ...body }; criteria.push(item);
      return { status: 201, json: { ok: true, item } };
    });
    ui.mockApi.route('DELETE', `/api/projects/${ui.projectId}/delimitation/items/criterion-1`, () => {
      criteria.splice(0); return { status: 200, json: { ok: true, deletedCount: 1 } };
    });
    await page.goto(`/projects/${ui.projectId}/delimitation`);
    const fields = [
      ['Describe tu tema central...', 'Memoria Ñandú 🧪'], ['Ej: Sololá, Lago de Atitlán...', 'Guatemala'],
      ['Ej: 2010 - 2023', '2025–2026'], ['¿Quiénes son tus sujetos?', 'Personas adultas'],
      ['Materiales, acceso a datos, herramientas...', 'Grabadora y acceso comunitario'],
    ] as const;
    for (const [placeholder, value] of fields) await page.getByPlaceholder(placeholder, { exact: true }).fill(value);
    await expect.poll(() => ui.requests.filter(request => request.method === 'PATCH' && request.path.endsWith('/delimitation')).at(-1)?.body.topic).toBe('Memoria Ñandú 🧪');
    await expect(page.getByText('Draft Guardado', { exact: true })).toBeVisible();
    await page.getByPlaceholder('Agregar criterio...', { exact: true }).first().fill('Mayor de edad');
    await testInfo.attach('criterion-viewport-and-requests', { body: JSON.stringify({ viewport: page.viewportSize(), requests: ui.requests }), contentType: 'application/json' });
    await page.getByTitle('Agregar', { exact: true }).first().click();
    await expect(page.getByText('Mayor de edad', { exact: true })).toBeVisible();
    await page.reload();
    for (const [placeholder, value] of fields) await expect(page.getByPlaceholder(placeholder, { exact: true })).toHaveValue(value);
    await expect(page.getByText('Mayor de edad', { exact: true })).toBeVisible();
    await page.getByTitle('Eliminar', { exact: true }).first().click();
    await expect(page.getByText('Mayor de edad', { exact: true })).toHaveCount(0);
    await page.reload(); await expect(page.getByText('Mayor de edad', { exact: true })).toHaveCount(0);
    await assertWorkspaceOperable(page);
  });

  test('research design edits question objective and specific objective then reloads', async ({ page, ui }) => {
    ui.mockApi.route('DELETE', `/api/projects/${ui.projectId}/research-design/specific-objectives/:objectiveId`, ({ path }) => {
      ui.dataset.researchDesign.specific_objectives = ui.dataset.researchDesign.specific_objectives.filter((item: { id: string }) => item.id !== path.split('/').at(-1));
      return { status: 200, json: { ok: true, deletedCount: 1 } };
    });
    await page.goto(`/projects/${ui.projectId}/research-design`);
    const question = page.getByPlaceholder('Ej: ¿Cómo perciben los estudiantes universitarios el uso de inteligencia artificial generativa en sus procesos de aprendizaje?');
    const objective = page.getByPlaceholder('Ej: Analizar las percepciones de estudiantes universitarios sobre el uso de inteligencia artificial generativa en sus procesos de aprendizaje.');
    await question.fill('¿Cómo se recuerda la comunidad?'); await objective.fill('Comprender narrativas comunitarias');
    await expect.poll(() => ui.requests.filter(request => request.method === 'PATCH' && request.path.endsWith('/research-design')).at(-1)?.body.general_objective).toBe('Comprender narrativas comunitarias');
    await page.getByRole('button', { name: /Agregar objetivo/ }).click();
    const specific = page.getByPlaceholder('Ej: Identificar los usos académicos más frecuentes de la inteligencia artificial generativa entre estudiantes universitarios.');
    await specific.fill('Identificar relatos intergeneracionales');
    await expect.poll(() => ui.dataset.researchDesign.specific_objectives[0]?.text).toBe('Identificar relatos intergeneracionales');
    await page.reload();
    await expect(question).toHaveValue('¿Cómo se recuerda la comunidad?');
    await expect(objective).toHaveValue('Comprender narrativas comunitarias');
    await expect(specific).toHaveValue('Identificar relatos intergeneracionales');
    await page.getByRole('button', { name: /Eliminar/ }).filter({ visible: true }).click();
    await expect(specific).toHaveCount(0);
    await page.reload(); await expect(specific).toHaveCount(0);
  });

  test('sample custom technique and optional blank fields autosave and reload', async ({ page, ui }) => {
    ui.mockApi.route('PATCH', `/api/projects/${ui.projectId}/sample-config`, ({ body }) => {
      Object.assign(ui.dataset.sampleConfig.config, body, { revision: ui.dataset.sampleConfig.config.revision + 1 });
      ui.dataset.sampleConfig.collection_techniques = body.collection_techniques;
      return { status: 200, json: { ok: true, data: ui.dataset.sampleConfig } };
    });
    await page.goto(`/projects/${ui.projectId}/sample-config`);
    await page.getByPlaceholder('Ej. Trabajo de campo inicial con acceso preliminar a comunidades urbanas.').fill('Trabajo de campo local');
    await page.getByPlaceholder('Ej. Cartografía social').fill('Historia oral Ñandú');
    await page.getByRole('button', { name: /Agregar$/, exact: false }).click();
    await expect(page.getByRole('button', { name: 'Eliminar Historia oral Ñandú' })).toBeVisible();
    await expect.poll(() => ui.requests.filter(request => request.path.endsWith('/sample-config') && request.method === 'PATCH').at(-1)?.body.collection_techniques?.[0]?.custom_label).toBe('Historia oral Ñandú');
    await page.reload();
    await expect(page.getByPlaceholder('Ej. Trabajo de campo inicial con acceso preliminar a comunidades urbanas.')).toHaveValue('Trabajo de campo local');
    await expect(page.getByRole('button', { name: 'Eliminar Historia oral Ñandú' })).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar Historia oral Ñandú' }).click();
    await expect.poll(() => ui.requests.filter(request => request.path.endsWith('/sample-config') && request.method === 'PATCH').at(-1)?.body.collection_techniques).toEqual([]);
  });

  test('503 autosave retains local draft and never displays saved success', async ({ page, ui }) => {
    ui.mockApi.route('PATCH', `/api/projects/${ui.projectId}/delimitation`, () => ({ status: 503, json: { ok: false, error: 'No se pudo guardar temporalmente.' } }));
    await page.goto(`/projects/${ui.projectId}/delimitation`);
    const topic = page.getByPlaceholder('Describe tu tema central...');
    await topic.fill('Borrador ante 503');
    await expect(page.getByText('No se pudo guardar temporalmente.', { exact: true }).first()).toBeVisible();
    await expect(topic).toHaveValue('Borrador ante 503');
    await expect(page.getByText('Draft Guardado', { exact: true })).toHaveCount(0);
  });

  test('409 latest revision requires conflict visibility instead of silent overwrite', async ({ page, ui }, testInfo) => {
    let writes = 0;
    ui.mockApi.route('PATCH', `/api/projects/${ui.projectId}/delimitation`, ({ body }) => {
      writes++;
      return writes === 1
        ? { status: 409, json: { ok: false, error: 'Conflicto de revisión', code: 'DELIMITATION_REVISION_CONFLICT', latest_delimitation: { ...ui.dataset.delimitation.delim, revision: 7, topic: 'Edición de otra persona' } } }
        : { status: 200, json: { ok: true, delim: { ...body, revision: 8 } } };
    });
    await page.goto(`/projects/${ui.projectId}/delimitation`);
    await page.getByPlaceholder('Describe tu tema central...').fill('Mi borrador en conflicto');
    await expect.poll(() => ui.requests.some(request => request.path.endsWith('/delimitation') && request.status === 409)).toBe(true);
    await testInfo.attach('revision-conflict-requests', { body: JSON.stringify({ viewport: page.viewportSize(), requests: ui.requests }), contentType: 'application/json' });
    await expect(page.getByText('Conflicto de revisión', { exact: true })).toBeVisible();
    expect(writes, 'A conflict must not trigger an unapproved overwrite at the latest revision').toBe(1);
    await expect(page.getByPlaceholder('Describe tu tema central...')).toHaveValue('Mi borrador en conflicto');
  });
});
