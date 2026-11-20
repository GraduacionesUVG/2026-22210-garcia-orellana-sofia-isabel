import { test, expect } from '../fixtures';

const invitationId = '88888888-8888-4888-8888-888888888888';
const email = 'qa-invite@example.test';
const token = 'synthetic-local-token-only';
const invitation = { id: invitationId, email, role: 'editor', token, status: 'pending', expires_at: '2026-11-04T12:00:00Z' };

test.describe('team', () => {
  test('invite pending click is single-flight, copy URL acknowledges and revoke preserves other invitation', async ({ page, ui }) => {
    const barrier = ui.mockApi.barrier();
    let started = false;
    const path = `/api/projects/${ui.projectId}/team`;
    ui.seed({ team: { ...ui.dataset.team, invitations: [{ ...invitation, id: 'other-invite', email: 'qa-other@example.test', token: 'other-local-token' }] } });
    ui.mockApi.route('POST', path, async ({ body }) => {
      started = true; await barrier.wait;
      ui.dataset.team.invitations.push({ ...invitation, ...body });
      ui.dataset.team.activity.push({ id: 'local-event', event_type: 'invitation_created', actor_name: 'Investigadora Local', created_at: '2026-10-04T12:00:00Z' });
      return { status: 201, json: { ok: true, invitation } };
    });
    ui.mockApi.route('POST', `${path}/invitations/${invitationId}/revoke`, () => { ui.dataset.team.invitations.find((row: any) => row.id === invitationId).status = 'revoked'; return { json: { ok: true } }; });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).__copiedUrl = text; } } });
    });
    try {
      await page.goto(`/projects/${ui.projectId}/team`);
      await page.getByPlaceholder('correo@universidad.edu').fill(email);
      await page.getByRole('button', { name: 'Crear invitación', exact: true }).click();
      await expect.poll(() => started).toBe(true);
      await expect(page.getByRole('button', { name: 'Invitando...', exact: true })).toBeDisabled();
      const button = page.getByRole('button', { name: 'Invitando...', exact: true });
      const box = await button.boundingBox(); if (!box) throw new Error('Pending invite has no DOM target');
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      barrier.release();
      await expect(page.getByText('Invitación creada. Comparte el enlace con esa persona.', { exact: true })).toBeVisible();
      expect(ui.requests.filter(r => r.method === 'POST' && r.path === path)).toHaveLength(1);
      expect(ui.requests.find(r => r.method === 'POST' && r.path === path)?.body).toEqual({ email, role: 'editor' });
      const row = page.locator('div.space-y-3').filter({ has: page.getByText(email, { exact: true }) });
      await row.getByRole('button', { name: 'Copiar', exact: true }).click();
      await expect(row.getByRole('button', { name: 'Copiado', exact: true })).toBeVisible();
      const expectedOrigin = (process.env.NEXT_PUBLIC_APP_URL || 'https://antropologia.vercel.app').replace(/\/$/, '');
      expect(await page.evaluate(() => (window as any).__copiedUrl)).toBe(`${expectedOrigin}/project-invitations/accept?token=${token}`);
      await expect(page.getByText('Investigadora Local - Invitación creada', { exact: true })).toBeVisible();
      await row.getByRole('button', { name: 'Revocar', exact: true }).click();
      await expect(page.getByText(email, { exact: true })).toHaveCount(0);
      await expect(page.getByText('qa-other@example.test', { exact: true })).toBeVisible();
      expect(ui.requests.some(r => r.method === 'POST' && r.path === `${path}/invitations/${invitationId}/revoke`)).toBe(true);
      await page.reload(); await expect(page.getByText(email, { exact: true })).toHaveCount(0);
    } finally { barrier.release(); }
  });

  test('clipboard denial is visible and never says Copiado', async ({ page, ui }) => {
    ui.seed({ team: { ...ui.dataset.team, invitations: [invitation] } });
    await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('clipboard denied'); } } }); });
    await page.goto(`/projects/${ui.projectId}/team`);
    await page.getByRole('button', { name: 'Copiar', exact: true }).click();
    await expect(page.getByText(/No se pudo copiar|permiso.*portapapeles|clipboard denied/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copiado', exact: true })).toHaveCount(0);
  });

  for (const [state, status, message] of [['revoked', 404, 'PROJECT_INVITATION_NOT_FOUND'], ['used', 409, 'PROJECT_INVITATION_CONFLICT'], ['expired', 410, 'PROJECT_INVITATION_EXPIRED']] as const) {
    test(`browser acceptance ${state} token has explicit failure and no access success`, async ({ page, ui }) => {
      ui.mockApi.route('POST', '/api/project-invitations/accept', () => ({ status, json: { ok: false, error: message } }));
      await page.goto(`/project-invitations/accept?token=${token}`);
      await expect(page.getByRole('heading', { name: 'No se pudo aceptar', exact: true })).toBeVisible();
      await expect(page.getByText(message, { exact: true })).toBeVisible();
      await expect(page.getByText('Ya tienes acceso al proyecto.', { exact: true })).toHaveCount(0);
      expect(ui.requests.find(r => r.method === 'POST' && r.path === '/api/project-invitations/accept')?.body).toEqual({ token });
    });
  }

  test('browser acceptance uses exact token and team navigation shows granted mocked membership', async ({ page, ui }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    const recipient = { id: '10000000-0000-4000-8000-000000000004', email: 'qa-recipient@example.test', role: 'editor' as const };
    const owner = { ...ui.dataset.team.members[0] };
    const sibling = { user_id: '10000000-0000-4000-8000-000000000005', role: 'viewer', full_name: 'Miembro intacto', email: 'qa-sibling@example.test' };
    ui.seed({ identity: recipient, me: { user: { id: recipient.id, email: recipient.email }, profile: { full_name: 'Destinataria sintética', email: recipient.email } }, team: { ...ui.dataset.team, members: [owner, sibling], currentRole: 'editor' } });
    let accepted = false;
    const teamPath = `/api/projects/${ui.projectId}/team`;
    const denied = { status: 403, json: { ok: false, error: 'FORBIDDEN' } };
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}`, () => accepted ? { json: { ok: true, project: ui.dataset.projects[0] } } : denied);
    ui.mockApi.route('GET', teamPath, () => accepted ? { json: { ok: true, ...ui.dataset.team } } : denied);
    ui.mockApi.route('POST', '/api/project-invitations/accept', ({ body }) => {
      if (body?.token !== token) return { status: 404, json: { ok: false, error: 'PROJECT_INVITATION_NOT_FOUND' } };
      accepted = true;
      ui.dataset.team.members.push({ user_id: recipient.id, email: recipient.email, role: 'editor', full_name: 'Destinataria sintética' });
      return { status: 200, json: { ok: true, invitation: { project_id: ui.projectId } } };
    });
    await page.goto(`/projects/${ui.projectId}/team`);
    await expect(page.getByText('FORBIDDEN', { exact: true }).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(recipient.email, { exact: true })).toHaveCount(0);
    expect(ui.dataset.team.members.some((member: any) => member.user_id === recipient.id)).toBe(false);
    await page.goto(`/project-invitations/accept?token=${token}`);
    await expect(page.getByRole('heading', { name: 'Bienvenido al equipo', exact: true })).toBeVisible();
    expect(ui.requests.filter(r => r.method === 'POST' && r.path === '/api/project-invitations/accept').map(r => ({ body: r.body, status: r.status }))).toEqual([{ body: { token }, status: 200 }]);
    await page.getByRole('link', { name: /Ir al equipo/ }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${ui.projectId}/team$`));
    const members = page.locator('section').filter({ has: page.getByText('Miembros activos', { exact: true }) });
    await expect(members.getByText(ui.identity.email, { exact: true })).toBeVisible();
    await page.reload(); await expect(members.getByText(ui.identity.email, { exact: true })).toBeVisible();
    await expect(members.getByText(owner.email, { exact: true })).toBeVisible();
    await expect(members.getByText(sibling.email, { exact: true })).toBeVisible();
    expect(ui.dataset.team.members.filter((member: any) => member.user_id === recipient.id)).toHaveLength(1);
    expect(ui.requests.filter(r => r.method === 'GET' && r.path === teamPath).map(r => r.status)).toContain(403);
    expect(ui.requests.filter(r => r.method === 'GET' && r.path === teamPath).at(-1)?.status).toBe(200);
  });
});
