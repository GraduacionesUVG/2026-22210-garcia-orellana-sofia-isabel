import { test, expect } from '../fixtures';

test.describe('permissions', () => {
  for (const role of ['owner', 'editor', 'viewer'] as const) {
    test(`${role} team controls match permissions after reload`, async ({ page, ui }) => {
      await page.setViewportSize({ width: 1600, height: 1100 });
      ui.seed({ identity: { ...ui.identity, role } });
      await page.goto(`/projects/${ui.projectId}/team`);
      if (role === 'owner') await expect(page.getByRole('button', { name: 'Crear invitación', exact: true })).toBeVisible();
      else {
        await expect(page.getByRole('button', { name: 'Crear invitación', exact: true })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Solo el propietario puede invitar o cambiar permisos', exact: true })).toBeVisible();
      }
      await expect(page.locator('select').filter({ has: page.locator('option[value="owner"]') }).first()).toBeDisabled();
      await page.reload();
      await expect(page.locator('section').filter({ has: page.getByText('Miembros activos', { exact: true }) }).getByText(ui.identity.email, { exact: true })).toBeVisible();
      expect(ui.requests.filter(r => r.method === 'POST' && r.path.endsWith('/team'))).toHaveLength(0);
    });
  }

  test('foreign project403 surfaces denial and offers no invite success', async ({ page, ui }) => {
    const foreignId = '99999999-9999-4999-8999-999999999999';
    ui.mockApi.route('GET', `/api/projects/${foreignId}/team`, () => ({ status: 403, json: { ok: false, error: 'FORBIDDEN' } }));
    ui.mockApi.route('GET', `/api/projects/${foreignId}`, () => ({ status: 403, json: { ok: false, error: 'FORBIDDEN' } }));
    await page.goto(`/projects/${foreignId}/team`);
    await expect(page.getByText(/FORBIDDEN|No tienes acceso|sin permiso/i).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear invitación', exact: true })).toHaveCount(0);
    expect(ui.requests.filter(r => r.method === 'POST' && r.path === `/api/projects/${foreignId}/team`)).toHaveLength(0);
  });

  test('permission revoked while invitation form is open rejects403 without persistence or false toast', async ({ page, ui }) => {
    const path = `/api/projects/${ui.projectId}/team`;
    ui.mockApi.route('POST', path, () => ({ status: 403, json: { ok: false, error: 'FORBIDDEN' } }));
    await page.goto(`/projects/${ui.projectId}/team`);
    await page.getByPlaceholder('correo@universidad.edu').fill('qa-denied@example.test');
    await page.getByRole('button', { name: 'Crear invitación', exact: true }).click();
    await expect(page.getByText('FORBIDDEN', { exact: true }).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('Invitación creada. Comparte el enlace con esa persona.', { exact: true })).toHaveCount(0);
    expect(ui.requests.find(r => r.method === 'POST' && r.path === path)?.status).toBe(403);
    await page.reload();
    await expect(page.getByText('qa-denied@example.test', { exact: true })).toHaveCount(0);
  });

  test('remove selected member keeps owner and unrelated member across reload', async ({ page, ui }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    const removedId = '10000000-0000-4000-8000-000000000002';
    ui.seed({ team: { ...ui.dataset.team, members: [...ui.dataset.team.members, { user_id: removedId, role: 'editor', full_name: 'Editor a retirar', email: 'qa-editor@example.test' }, { user_id: '10000000-0000-4000-8000-000000000003', role: 'viewer', full_name: 'Lectura intacta', email: 'qa-viewer@example.test' }] } });
    const path = `/api/projects/${ui.projectId}/team/members/${removedId}`;
    const isRemovedIdentityDenied = () => ui.identity.id === removedId && !ui.dataset.team.members.some((member: any) => member.user_id === removedId);
    const denied = { status: 403, json: { ok: false, error: 'FORBIDDEN' } };
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}`, () => isRemovedIdentityDenied() ? denied : { json: { ok: true, project: ui.dataset.projects[0] } });
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/team`, () => isRemovedIdentityDenied() ? denied : { json: { ok: true, ...ui.dataset.team } });
    ui.mockApi.route('DELETE', path, () => { ui.dataset.team.members = ui.dataset.team.members.filter((member: any) => member.user_id !== removedId); return { json: { ok: true } }; });
    await page.goto(`/projects/${ui.projectId}/team`);
    const row = page.locator('div.grid').filter({ has: page.getByText('Editor a retirar', { exact: true }) }).last();
    await row.getByRole('button', { name: 'Quitar acceso', exact: true }).click();
    await expect(page.getByText('Editor a retirar', { exact: true })).toHaveCount(0);
    await expect(page.locator('section').filter({ has: page.getByText('Miembros activos', { exact: true }) }).getByText('Investigadora Local', { exact: true })).toBeVisible();
    await expect(page.getByText('Lectura intacta', { exact: true })).toBeVisible();
    expect(ui.requests.filter(r => r.method === 'DELETE').map(r => r.path)).toEqual([path]);
    await page.reload(); await expect(page.getByText('Editor a retirar', { exact: true })).toHaveCount(0);
    ui.seed({ identity: { id: removedId, email: 'qa-editor@example.test', role: 'editor' }, me: { user: { id: removedId, email: 'qa-editor@example.test' }, profile: { full_name: 'Editor retirado', email: 'qa-editor@example.test' } } });
    await page.reload();
    await expect(page.getByText('FORBIDDEN', { exact: true }).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear invitación', exact: true })).toHaveCount(0);
    expect(ui.requests.filter(r => r.method === 'GET' && r.path === `/api/projects/${ui.projectId}/team`).at(-1)?.status).toBe(403);
  });
});
