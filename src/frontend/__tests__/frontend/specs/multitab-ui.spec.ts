import { test, expect } from '../fixtures';
import { createMockApi } from '../mock-api';
import { attachRuntimeErrorMonitor } from '../browser-assertions';

test.describe('multitab independent synthetic sessions', () => {
  test('sequence M12-01 shared document revision conflicts visibly and resolves by manual reload/edit', async ({ page, context, browser, baseURL, ui }, testInfo) => {
    const contextB = await browser.newContext({ baseURL });
    const pageB = await contextB.newPage();
    const monitorA = await attachRuntimeErrorMonitor(page), monitorB = await attachRuntimeErrorMonitor(pageB);
    const shared = { id: 'M12-shared-document', project_id: ui.projectId, title: 'M12 shared evidence', content: 'Revision zero', document_type: 'interview', status: 'draft', revision: 0, deleted_at: null };
    ui.dataset.documents = [shared];
    const datasetB = structuredClone(ui.dataset);
    datasetB.documents = [shared];
    datasetB.me.user.email = 'second-synthetic@example.invalid';
    datasetB.me.profile.email = 'second-synthetic@example.invalid';
    const apiB = createMockApi(datasetB);
    await apiB.install(contextB, datasetB, baseURL);
    let loggedInA = false, loggedInB = false;
    ui.mockApi.route('POST', '/api/auth/login', () => { loggedInA = true; return { status: 200, json: { ok: true } }; });
    apiB.route('POST', '/api/auth/login', () => { loggedInB = true; return { status: 200, json: { ok: true } }; });
    ui.mockApi.route('GET', '/api/users/me', () => loggedInA ? { status: 200, json: ui.dataset.me } : { status: 401, json: { ok: false, error: 'Synthetic session A expired.' } });
    apiB.route('GET', '/api/users/me', () => loggedInB ? { status: 200, json: datasetB.me } : { status: 401, json: { ok: false, error: 'Synthetic session B expired.' } });
    const path = `/api/projects/${ui.projectId}/documents/${shared.id}`;
    for (const api of [ui.mockApi, apiB]) api.route('PATCH', path, ({ body }) => {
      if (body.base_revision !== shared.revision) return { status: 409, json: { ok: false, error: 'DOCUMENT_REVISION_CONFLICT', latest_document: { ...shared } } };
      Object.assign(shared, body, { revision: shared.revision + 1 });
      return { status: 200, json: { ok: true, document: { ...shared } } };
    });
    const placeholder = 'Pega aquí la entrevista, nota de campo, observación o texto cualitativo...';
    try {
      for (const [currentPage, email] of [[page, 'first-synthetic@example.invalid'], [pageB, 'second-synthetic@example.invalid']] as const) {
        await currentPage.goto('/login');
        await currentPage.getByLabel('Correo electrónico').fill(email);
        await currentPage.getByLabel('Contraseña', { exact: true }).fill('Synthetic-session-123!');
        await currentPage.getByRole('button', { name: 'Iniciar Sesión', exact: true }).click();
        await expect(currentPage.getByRole('heading', { name: 'Panel de Mis Proyectos' })).toBeVisible();
        await currentPage.goto(`/projects/${ui.projectId}/corpus/${shared.id}`);
        await expect(currentPage.getByPlaceholder(placeholder)).toHaveValue('Revision zero');
      }
      expect(contextB).not.toBe(context);
      await page.getByPlaceholder(placeholder).fill('Context A revision one');
      await page.getByRole('button', { name: /Guardar cambios/ }).click();
      await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();
      await pageB.getByPlaceholder(placeholder).fill('Context B stale local draft');
      await pageB.getByRole('button', { name: /Guardar cambios/ }).click();
      await expect(pageB.getByText('Este documento fue modificado en otra pestaña o por otro usuario. Recarga el documento antes de guardar.')).toBeVisible();
      await expect(pageB.getByPlaceholder(placeholder)).toHaveValue('Context B stale local draft');
      expect(shared.content).toBe('Context A revision one');
      expect(apiB.requests.filter(row => row.path === path && row.method === 'PATCH').map(row => row.status)).toEqual([409]);
      await pageB.getByRole('button', { name: /Recargar/ }).click();
      await expect(pageB.getByPlaceholder(placeholder)).toHaveValue('Context A revision one');
      await pageB.getByPlaceholder(placeholder).fill('Manual merge A and B');
      await pageB.getByRole('button', { name: /Guardar cambios/ }).click();
      await expect(pageB.getByText('Los cambios se guardaron correctamente.')).toBeVisible();
      await page.reload(); await pageB.reload();
      await expect(page.getByPlaceholder(placeholder)).toHaveValue('Manual merge A and B');
      await expect(pageB.getByPlaceholder(placeholder)).toHaveValue('Manual merge A and B');
      expect(apiB.requests.filter(row => row.path === path && row.method === 'PATCH').map(row => row.body.base_revision)).toEqual([0, 1]);
      await monitorA.assertClean(); await monitorB.assertClean();
    } finally {
      await testInfo.attach('M12-01-sequence', { body: JSON.stringify({ sessionA: ui.requests, sessionB: apiB.requests, sharedRevision: shared.revision }), contentType: 'application/json' });
      monitorA.dispose(); monitorB.dispose(); apiB.releaseAll(); await contextB.close(); apiB.assertNoUnexpectedRequests();
    }
  });

  test('sequence M12-02 session A logout does not impersonate a valid session after context B expiry', async ({ page, browser, baseURL, ui }, testInfo) => {
    const contextB = await browser.newContext({ baseURL }); const pageB = await contextB.newPage();
    const dataB = structuredClone(ui.dataset), apiB = createMockApi(dataB);
    dataB.me.user.email = 'second-synthetic@example.invalid'; dataB.me.profile.email = 'second-synthetic@example.invalid';
    await apiB.install(contextB, dataB, baseURL);
    const monitorA = await attachRuntimeErrorMonitor(page), monitorB = await attachRuntimeErrorMonitor(pageB);
    let sessionA = true, sessionB = true;
    ui.mockApi.route('POST', '/api/auth/logout', () => { sessionA = false; return { status: 200, json: { ok: true } }; });
    ui.mockApi.route('GET', '/api/users/me', () => sessionA ? { status: 200, json: ui.dataset.me } : { status: 401, json: { ok: false, error: 'Synthetic session A expired.' } });
    apiB.route('GET', '/api/users/me', () => sessionB ? { status: 200, json: dataB.me } : { status: 401, json: { ok: false, error: 'Synthetic session B expired.' } });
    apiB.route('PATCH', '/api/users/me', ({ body }) => sessionB ? { status: 200, json: { ...dataB.me, profile: { ...dataB.me.profile, ...body } } } : { status: 401, json: { ok: false, error: 'Synthetic session B expired.' } });
    try {
      await page.goto('/profile'); await pageB.goto('/profile');
      await expect(page.getByPlaceholder('Ej. Juan Perez')).toHaveValue(/\S/);
      await expect(pageB.getByPlaceholder('Ej. Juan Perez')).toHaveValue(/\S/);
      await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
      await expect(page).toHaveURL(/\/login$/);
      await pageB.reload();
      await expect(pageB.getByPlaceholder('Ej. Juan Perez')).toHaveValue(/\S/);
      sessionB = false;
      await pageB.getByPlaceholder('Ej. Juan Perez').fill('Expired B local draft');
      await pageB.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
      await expect(pageB.getByText('Synthetic session B expired.', { exact: true })).toBeVisible();
      await expect(pageB.getByText('Los cambios se guardaron correctamente.')).toHaveCount(0);
      await expect(pageB.getByPlaceholder('Ej. Juan Perez')).toHaveValue('Expired B local draft');
      await pageB.reload(); await expect(pageB).toHaveURL(/\/login$/);
      expect(ui.requests.filter(row => row.path === '/api/auth/logout')).toHaveLength(1);
      expect(apiB.requests.filter(row => row.path === '/api/auth/logout')).toHaveLength(0);
      await monitorA.assertClean(); await monitorB.assertClean();
    } finally {
      await testInfo.attach('M12-02-sequence', { body: JSON.stringify({ sessionA: ui.requests, sessionB: apiB.requests }), contentType: 'application/json' });
      monitorA.dispose(); monitorB.dispose(); apiB.releaseAll(); await contextB.close(); apiB.assertNoUnexpectedRequests();
    }
  });
});
