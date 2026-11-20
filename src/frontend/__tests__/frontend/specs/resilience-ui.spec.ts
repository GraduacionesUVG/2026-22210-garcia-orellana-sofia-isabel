import { test, expect } from '../fixtures';
import type { Page, Request } from '@playwright/test';
import { attachRuntimeErrorMonitor } from '../browser-assertions';
import { faultController, installFault, registerFaultTarget } from '../fault-cases';

// Attach before a competing UI action: cancellation can precede barrier release.
function observeRequestTerminal(page: Page, request: Request) {
  let resolve!: (terminal: { kind: 'finished' | 'failed'; error: string | null }) => void;
  const terminal = new Promise<{ kind: 'finished' | 'failed'; error: string | null }>(done => { resolve = done; });
  const finished = (candidate: Request) => { if (candidate === request) resolve({ kind: 'finished', error: null }); };
  const failed = (candidate: Request) => { if (candidate === request) resolve({ kind: 'failed', error: candidate.failure()?.errorText ?? null }); };
  page.on('requestfinished', finished); page.on('requestfailed', failed);
  return { terminal, dispose: () => { page.off('requestfinished', finished); page.off('requestfailed', failed); } };
}

test.describe('resilience deterministic sequences', () => {
  test('reopened same-payload creation cannot issue a second POST while the original is pending', async ({ page, ui }) => {
    const barrier = ui.mockApi.barrier();
    let started = 0;
    ui.mockApi.route('POST', '/api/projects', async ({ body }) => {
      const ordinal = ++started;
      if (ordinal === 1) await barrier.wait;
      const project = { id: `same-pending-${ordinal}`, ...body, my_role: 'owner', is_active: true };
      ui.dataset.projects.push(project);
      return { status: 201, json: { ok: true, project } };
    });
    try {
      await page.goto('/dashboard');
      await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
      const field = page.getByPlaceholder('Ej. Análisis Etnográfico: Biblioteca');
      await field.fill('Mismo envío pendiente');
      await page.getByRole('button', { name: /Crear$/ }).click();
      await expect.poll(() => started).toBe(1);
      await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      await expect(field).toHaveCount(0);
      await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await field.fill('Mismo envío pendiente');
      await page.getByRole('button', { name: /Crear$/ }).click();
      await expect(page.getByText(/creación.*en curso|envío.*pendiente/i)).toBeVisible();
      expect(started).toBe(1);
      barrier.release();
      await expect(page.getByRole('heading', { name: 'Mismo envío pendiente', exact: true })).toHaveCount(1);
      await expect(field).toHaveValue('Mismo envío pendiente');
    } finally { barrier.release(); }
  });

  test('uncertain creation blocks duplicate POST when readback fails and manual verification recovers', async ({ page, context, ui }) => {
    const path = '/api/projects';
    let unavailable = false;
    ui.mockApi.route('GET', path, () => unavailable
      ? { status: 503, json: { ok: false, error: 'Readback no disponible.' } }
      : { status: 200, json: { ok: true, projects: ui.dataset.projects } });
    registerFaultTarget(context, { api: ui.mockApi, method: 'POST', path, respond: ({ body }) => {
      unavailable = true;
      const project = { id: 'uncertain-create-recovery', ...body, my_role: 'owner', is_active: true };
      ui.dataset.projects.push(project);
      return { status: 201, json: { ok: true, project } };
    } });
    await page.goto('/dashboard');
    await installFault(context, { method: 'POST', path, scenario: 'committed-response-lost', occurrence: 1 });
    await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
    const field = page.getByPlaceholder('Ej. Análisis Etnográfico: Biblioteca');
    await field.fill('Creación incierta recuperable');
    await page.getByRole('button', { name: /Crear$/ }).click();
    await expect(page.getByText(/No pudimos confirmar la creación/)).toBeVisible();
    await expect(field).toHaveValue('Creación incierta recuperable');
    // Verification must remain bound to the submitted payload, not an edited key.
    await expect(field).not.toBeEditable();
    await expect(page.getByPlaceholder('Describe el objetivo del proyecto…')).not.toBeEditable();
    await expect(page.getByRole('button', { name: /Crear$/ })).toBeDisabled();
    await field.press('Enter');
    expect(ui.requests.filter(row => row.path === path && row.method === 'POST')).toHaveLength(1);
    unavailable = false;
    await page.getByRole('button', { name: 'Comprobar creación', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Creación incierta recuperable', exact: true })).toHaveCount(1);
    // A matching row is a candidate, not proof this POST committed. Keep the
    // original draft until the user chooses to leave and review the list.
    await expect(field).toHaveValue('Creación incierta recuperable');
    await expect(page.getByText(/proyecto coincidente.*revisa/i)).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
    expect(ui.requests.filter(row => row.path === path && row.method === 'POST')).toHaveLength(1);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Creación incierta recuperable', exact: true })).toHaveCount(1);
  });

  test('malformed creation preflight cannot issue POST or claim an existing matching project', async ({ page, ui }) => {
    await page.goto('/dashboard');
    ui.mockApi.route('GET', '/api/projects', () => ({ status: 200, json: {} }));
    await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
    const field = page.getByPlaceholder('Ej. Análisis Etnográfico: Biblioteca');
    await field.fill('Preflight inválido');
    await page.getByRole('button', { name: /Crear$/ }).click();
    await expect(page.getByText(/No se pudo comprobar la lista de proyectos/)).toBeVisible();
    await expect(field).toHaveValue('Preflight inválido');
    expect(ui.requests.filter(row => row.method === 'POST' && row.path === '/api/projects')).toHaveLength(0);
  });

  test('a concurrent matching project does not confirm an ambiguous creation or discard its draft', async ({ page, context, ui }) => {
    const path = '/api/projects';
    await page.goto('/dashboard');
    registerFaultTarget(context, { api: ui.mockApi, method: 'POST', path, respond: ({ body }) => {
      // A different actor produced this row; this request did not commit.
      ui.dataset.projects.push({ id: 'other-actor-project', ...body, my_role: 'owner', is_active: true });
      return { status: 503, json: { ok: false } };
    } });
    await installFault(context, { method: 'POST', path, scenario: 'committed-response-lost', occurrence: 1 });
    await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
    const field = page.getByPlaceholder('Ej. Análisis Etnográfico: Biblioteca');
    await field.fill('Concurrente similar');
    await page.getByRole('button', { name: /Crear$/ }).click();
    await expect(field).toHaveValue('Concurrente similar');
    await expect(page.getByText(/proyecto coincidente.*revisa/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Crear$/ })).toBeDisabled();
    expect(ui.requests.filter(row => row.method === 'POST' && row.path === path)).toHaveLength(1);
  });

  test('sequence R12-01 malformed profile save retains draft then explicit retry and reload recover', async ({ page, context, ui }, testInfo) => {
    const monitor = await attachRuntimeErrorMonitor(page);
    const path = '/api/users/me';
    registerFaultTarget(context, { api: ui.mockApi, method: 'PATCH', path, respond: ({ body }) => {
      Object.assign(ui.dataset.me.profile, body); return { status: 200, json: ui.dataset.me };
    } });
    await installFault(context, { method: 'PATCH', path, scenario: 'malformed-json', occurrence: 1 });
    try {
      await page.goto('/profile');
      const field = page.getByPlaceholder('Ej. Juan Perez');
      await expect(field).toHaveValue(/\S/); await field.fill('R12-01 Ñandú');
      await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
      await expect(page.getByText('No se pudo actualizar el perfil.', { exact: true })).toBeVisible();
      await expect(field).toHaveValue('R12-01 Ñandú');
      await expect(page.getByText('Los cambios se guardaron correctamente.')).toHaveCount(0);
      await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
      await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();
      await page.reload(); await expect(field).toHaveValue('R12-01 Ñandú');
      expect(faultController(context, 'PATCH', path).observations.map(row => row.scenario)).toEqual(['malformed-json', 'normal']);
      await monitor.assertClean();
    } finally {
      await testInfo.attach('R12-01-sequence', { body: JSON.stringify(faultController(context, 'PATCH', path).observations), contentType: 'application/json' }); monitor.dispose();
    }
  });

  test('sequence R12-02 corpus B response released before A cannot restore stale rows', async ({ page, context, ui }, testInfo) => {
    const monitor = await attachRuntimeErrorMonitor(page);
    const path = `/api/projects/${ui.projectId}/documents`;
    const rows = [
      { id: 'R12-old', title: 'old corpus R12', content: 'old', document_type: 'interview', status: 'draft', deleted_at: null },
      { id: 'R12-new', title: 'new corpus R12', content: 'new', document_type: 'interview', status: 'draft', deleted_at: null },
    ];
    registerFaultTarget(context, { api: ui.mockApi, method: 'GET', path, respond: ({ url }) => ({ status: 200, json: { ok: true, documents: rows.filter(row => row.title.includes(url.searchParams.get('search') ?? '')), total: 2 } }) });
    const faults = faultController(context, 'GET', path);
    await installFault(context, { method: 'GET', path, scenario: 'out-of-order', occurrence: 2 });
    let oldTerminal: ReturnType<typeof observeRequestTerminal> | undefined;
    let observedOldTerminal: { kind: 'finished' | 'failed'; error: string | null } | undefined;
    try {
      await page.goto(`/projects/${ui.projectId}/corpus`);
      await expect(page.getByRole('link', { name: 'Abrir documento old corpus R12' })).toBeVisible();
      const oldRequestStarted = page.waitForRequest(request => request.method() === 'GET' && new URL(request.url()).pathname === path && new URL(request.url()).searchParams.get('search') === 'old');
      await page.getByRole('textbox', { name: 'Buscar', exact: true }).fill('old');
      await faults.waitFor(2);
      const oldRequest = await oldRequestStarted;
      oldTerminal = observeRequestTerminal(page, oldRequest);
      await page.getByRole('textbox', { name: 'Buscar', exact: true }).fill('new');
      await faults.waitFor(3);
      await expect(page.getByRole('link', { name: 'Abrir documento new corpus R12' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Abrir documento old corpus R12' })).toHaveCount(0);
      faults.release(2);
      observedOldTerminal = await oldTerminal.terminal;
      if (observedOldTerminal.kind === 'failed') {
        // An arbitrary transport failure is not proof that the UI cancelled stale work.
        expect(observedOldTerminal.error).toMatch(/^(net::ERR_ABORTED|NS_BINDING_ABORTED|Load request cancelled)$/);
      } else {
        const response = await oldRequest.response();
        expect(response).not.toBeNull();
        expect(await response!.finished()).toBeNull();
      }
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.getByRole('link', { name: 'Abrir documento new corpus R12' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Abrir documento old corpus R12' })).toHaveCount(0);
      await monitor.assertClean();
    } finally {
      oldTerminal?.dispose(); faults.releaseAll();
      await testInfo.attach('R12-02-sequence', { body: JSON.stringify({ observations: faults.observations, oldRequestTerminal: observedOldTerminal }), contentType: 'application/json' }); monitor.dispose();
    }
  });

  test('sequence R12-03 closing pending create then reopening cannot discard the new modal draft', async ({ page, context, ui }, testInfo) => {
    const monitor = await attachRuntimeErrorMonitor(page);
    const path = '/api/projects';
    registerFaultTarget(context, { api: ui.mockApi, method: 'POST', path, respond: ({ body }) => {
      const project = { id: 'R12-created-project', ...body, my_role: 'owner', is_active: true };
      ui.dataset.projects.push(project); return { status: 201, json: { ok: true, project } };
    } });
    await installFault(context, { method: 'POST', path, scenario: 'delayed', occurrence: 1 });
    const faults = faultController(context, 'POST', path);
    try {
      await page.goto('/dashboard');
      await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
      const name = page.getByPlaceholder('Ej. Análisis Etnográfico: Biblioteca');
      await name.fill('R12-first submitted');
      await page.getByRole('button', { name: /Crear$/, exact: false }).click();
      await faults.waitFor(1);
      await expect(page.getByRole('button', { name: /Creando/ })).toBeDisabled();
      await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
      await expect(name).toHaveValue(''); await name.fill('R12-new independent draft');
      faults.release(1);
      await expect.poll(() => faults.observations[0]?.completed).toBe(true);
      await expect(page.getByRole('heading', { name: 'R12-first submitted', exact: true })).toBeVisible();
      await expect(name).toHaveValue('R12-new independent draft');
      await monitor.assertClean();
    } finally { faults.releaseAll(); await testInfo.attach('R12-03-sequence', { body: JSON.stringify(faults.observations), contentType: 'application/json' }); monitor.dispose(); }
  });

  test('sequence R12-04 pending old document load cannot replace the switched project entity', async ({ page, context, ui }, testInfo) => {
    const monitor = await attachRuntimeErrorMonitor(page);
    const nextProject = '31200000-0000-4000-8000-000000000004';
    ui.dataset.projects.push({ id: nextProject, name: 'R12-next-project', my_role: 'owner' });
    ui.dataset.documents.push({ id: 'R12-next-document', project_id: nextProject, title: 'R12-next entity', content: 'Next project text', document_type: 'interview', status: 'draft', revision: 0, deleted_at: null });
    const path = `/api/projects/${ui.projectId}/documents/R12-old-document`;
    registerFaultTarget(context, { api: ui.mockApi, method: 'GET', path, respond: () => ({ status: 200, json: { ok: true, document: { id: 'R12-old-document', title: 'R12-old entity', content: 'Old project text', document_type: 'interview', status: 'draft', revision: 0 } } }) });
    await installFault(context, { method: 'GET', path, scenario: 'delayed', occurrence: 1 });
    const faults = faultController(context, 'GET', path);
    try {
      await page.goto(`/projects/${ui.projectId}/corpus/R12-old-document`);
      await faults.waitFor(1);
      await page.goto(`/projects/${nextProject}/corpus/R12-next-document`);
      const name = page.getByPlaceholder('Ej. Entrevista P01 sobre prácticas educativas');
      await expect(name).toHaveValue('R12-next entity');
      faults.release(1);
      await expect.poll(() => faults.observations[0]?.completed).toBe(true);
      await expect(name).toHaveValue('R12-next entity');
      await expect(page.getByPlaceholder('Pega aquí la entrevista, nota de campo, observación o texto cualitativo...')).toHaveValue('Next project text');
      await monitor.assertClean();
    } finally { faults.releaseAll(); await testInfo.attach('R12-04-sequence', { body: JSON.stringify(faults.observations), contentType: 'application/json' }); monitor.dispose(); }
  });

  test('sequence R12-05 accepted creation with lost response is ambiguous and reload finds one entity', async ({ page, context, ui }, testInfo) => {
    const monitor = await attachRuntimeErrorMonitor(page);
    await page.goto('/dashboard');
    const path = '/api/projects';
    const unrelated = ui.dataset.projects.map(project => ({ name: project.name, count: ui.dataset.projects.filter(other => other.name === project.name).length }));
    // The current project POST route has no idempotency key contract. Do not fake
    // name-based deduplication; accept UI confirmation without repeating POST.
    registerFaultTarget(context, { api: ui.mockApi, method: 'POST', path, respond: ({ body }) => {
      const project = { id: `R12-lost-response-project-${ui.dataset.projects.length}`, ...body, my_role: 'owner', is_active: true };
      ui.dataset.projects.push(project); return { status: 201, json: { ok: true, project } };
    } });
    await installFault(context, { method: 'POST', path, scenario: 'committed-response-lost', occurrence: 1 });
    const faults = faultController(context, 'POST', path);
    let recovery: 'confirmed-in-ui' | 'explicit-form-retry' | 'browser-readback' | undefined;
    let lostTerminal: ReturnType<typeof observeRequestTerminal> | undefined;
    const captureLost = (request: Request) => {
      if (!lostTerminal && request.method() === 'POST' && new URL(request.url()).pathname === path) lostTerminal = observeRequestTerminal(page, request);
    };
    page.on('request', captureLost);
    try {
      await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
      await page.getByPlaceholder('Ej. Análisis Etnográfico: Biblioteca').fill('R12-lost-response-once');
      const lostRequestStarted = page.waitForRequest(request => request.method() === 'POST' && new URL(request.url()).pathname === path);
      await page.getByRole('button', { name: /Crear$/, exact: false }).click();
      await lostRequestStarted;
      await faults.waitFor(1);
      expect(lostTerminal).toBeDefined();
      expect(await lostTerminal!.terminal).toEqual({ kind: 'failed', error: 'net::ERR_FAILED' });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const created = page.getByRole('heading', { name: 'R12-lost-response-once', exact: true });
      const field = page.getByPlaceholder('Ej. Análisis Etnográfico: Biblioteca');
      const submit = page.getByRole('button', { name: /Crear$/, exact: false });
      // A correct UI may reconcile automatically, retain an uncertain draft with
      // mutation suppressed, or offer its actual form recovery. No exact faulty
      // network message or universal second POST is required.
      await expect.poll(async () => await created.isVisible() || await field.isVisible()).toBe(true);
      if (await created.isVisible()) recovery = 'confirmed-in-ui';
      else {
        await expect(field).toHaveValue('R12-lost-response-once');
        await expect(page.getByRole('button', { name: /Creando/ })).toHaveCount(0);
        // Accept network/uncertainty/verification wording, not an exact invitation
        // to blindly repeat a mutation already accepted by the server.
        await expect(page.locator('form')).toContainText(/confirm|verific|comprob|inciert|desconoc|error de red|conexi[oó]n|respuesta|revisar/i);
        if (await submit.isVisible() && await submit.isEnabled()) {
          recovery = 'explicit-form-retry';
          const retryResponse = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === path);
          await submit.click();
          expect(await (await retryResponse).finished()).toBeNull();
          await expect(created).toBeVisible();
        } else recovery = 'browser-readback';
      }
      await page.reload();
      await expect(created).toHaveCount(1);
      for (const project of unrelated) await expect(page.getByRole('heading', { name: project.name, exact: true })).toHaveCount(project.count);
      expect(faults.observations[0]).toMatchObject({ scenario: 'committed-response-lost', completed: true, aborted: true });
      await monitor.assertClean();
    } finally {
      page.off('request', captureLost);
      lostTerminal?.dispose();
      await testInfo.attach('R12-05-sequence', { body: JSON.stringify({ recovery, observations: faults.observations, requests: ui.requests.filter(request => request.path === path) }), contentType: 'application/json' }); monitor.dispose();
    }
  });

  test('sequence R12-06 offline corpus refresh shows rejection then explicit retry restores one card', async ({ page, context, ui }, testInfo) => {
    const monitor = await attachRuntimeErrorMonitor(page);
    const path = `/api/projects/${ui.projectId}/documents`;
    const row = { id: 'R12-offline-document', title: 'R12-offline evidence', content: 'Text', document_type: 'interview', status: 'draft', deleted_at: null };
    registerFaultTarget(context, { api: ui.mockApi, method: 'GET', path, respond: () => ({ status: 200, json: { ok: true, documents: [row] } }) });
    const faults = faultController(context, 'GET', path);
    try {
      await page.goto(`/projects/${ui.projectId}/corpus`);
      await expect(page.getByRole('link', { name: 'Abrir documento R12-offline evidence' })).toBeVisible();
      await installFault(context, { method: 'GET', path, scenario: 'offline', occurrence: 2 });
      await page.getByRole('button', { name: 'Actualizar', exact: true }).last().click();
      await faults.waitFor(2);
      await expect(page.getByText('No se pudo cargar el corpus', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
      await expect(page.getByText('No se pudo cargar el corpus', { exact: true })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Abrir documento R12-offline evidence' })).toHaveCount(1);
      expect(faults.observations.map(row => row.scenario)).toEqual(['normal', 'offline', 'normal']);
      await monitor.assertClean();
    } finally { await testInfo.attach('R12-06-sequence', { body: JSON.stringify(faults.observations), contentType: 'application/json' }); monitor.dispose(); }
  });

  test('sequence R12-07 pending forbidden document checkpoint preserves label then explicit retry recovers', async ({ page, context, ui }, testInfo) => {
    const monitor = await attachRuntimeErrorMonitor(page);
    const document = { id: 'R12-version-document', project_id: ui.projectId, title: 'R12 version evidence', content: 'Checkpoint text', document_type: 'interview', status: 'draft', revision: 0, deleted_at: null };
    ui.dataset.documents = [document];
    const path = `/api/projects/${ui.projectId}/documents/${document.id}/versions`;
    const versions: any[] = [];
    ui.mockApi.route('GET', path, () => ({ status: 200, json: { ok: true, versions } }));
    ui.mockApi.route('GET', `${path}/R12-created-version`, () => ({ status: 200, json: { ok: true, version: versions[0] } }));
    registerFaultTarget(context, { api: ui.mockApi, method: 'POST', path, respond: ({ body }) => {
      const version = { id: 'R12-created-version', version_number: 1, label: body.label, snapshot_title: document.title, snapshot_content: document.content, snapshot_revision: document.revision };
      versions.push(version); return { status: 201, json: { ok: true, version } };
    } });
    await installFault(context, { method: 'POST', path, scenario: '403', occurrence: 1 });
    const faults = faultController(context, 'POST', path); faults.hold(1);
    try {
      await page.goto(`/projects/${ui.projectId}/corpus/${document.id}`);
      await page.getByRole('button', { name: /Ver versiones/ }).click();
      const label = page.getByLabel('Nombre de la versión'); await label.fill('R12 forbidden pending checkpoint');
      await page.locator('form').getByRole('button', { name: /Guardar versión/ }).click();
      await faults.waitFor(1);
      await expect(page.locator('form').getByRole('button', { name: /Guardando/ })).toBeDisabled();
      faults.release(1);
      await expect(page.getByText('Fallo sintético (403).', { exact: true })).toBeVisible();
      await expect(label).toHaveValue('R12 forbidden pending checkpoint');
      await expect(page.getByText('La versión se guardó correctamente.')).toHaveCount(0);
      await page.locator('form').getByRole('button', { name: /Guardar versión/ }).click();
      await expect(page.getByText('La versión se guardó correctamente.')).toBeVisible();
      await expect(page.getByRole('button', { name: /v1 R12 forbidden pending checkpoint/ })).toBeVisible();
      expect(versions).toHaveLength(1);
      await monitor.assertClean();
    } finally { faults.releaseAll(); await testInfo.attach('R12-07-sequence', { body: JSON.stringify(faults.observations), contentType: 'application/json' }); monitor.dispose(); }
  });

});
