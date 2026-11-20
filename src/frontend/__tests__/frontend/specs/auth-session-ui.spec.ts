import { test, expect } from '../fixtures';

test.describe('auth mocked session', () => {
  for (const status of [401, 429, 503]) {
    test(`${status} login failure permits explicit retry without leaking internals`, async ({ page, ui }) => {
      let attempts = 0;
      ui.mockApi.route('POST', '/api/auth/login', () => {
        attempts++;
        return attempts === 1
          ? { status, body: 'upstream internal secret', headers: { 'content-type': 'text/plain' } }
          : { status: 200, json: { ok: true } };
      });
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill('synthetic@example.invalid');
      await page.getByLabel('Contraseña', { exact: true }).fill('Synthetic-password-123!');
      await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).click();
      await expect(page.getByText('No se pudo iniciar sesión.', { exact: true })).toBeVisible();
      await expect(page.locator('body')).not.toContainText('upstream internal secret');
      const retry = page.getByRole('button', { name: 'Iniciar Sesión', exact: true });
      await expect(retry).toBeEnabled(); await retry.click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole('heading', { name: 'Panel de Mis Proyectos' })).toBeVisible();
      expect(attempts).toBe(2);
    });
  }

  test('Enter submits once and pending login cannot be clicked again', async ({ page, ui }) => {
    const barrier = ui.mockApi.barrier(); let requests = 0;
    ui.mockApi.route('POST', '/api/auth/login', async () => {
      requests++; await barrier.wait;
      return { status: 200, json: { ok: true } };
    });
    try {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill('synthetic@example.invalid');
      const password = page.getByLabel('Contraseña', { exact: true });
      await password.fill('Synthetic-password-123!'); await password.press('Enter');
      const pending = page.getByRole('button', { name: 'Ingresando...', exact: true });
      await expect(pending).toBeDisabled();
      await page.keyboard.press('Enter');
      await expect.poll(() => requests).toBe(1);
      barrier.release();
      await expect(page.getByRole('heading', { name: 'Panel de Mis Proyectos' })).toBeVisible();
      expect(requests).toBe(1);
    } finally { barrier.release(); }
  });

  test('empty password prevents login POST', async ({ page, ui }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('synthetic@example.invalid');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).click();
    expect(await page.getByLabel('Contraseña', { exact: true }).evaluate((node: HTMLInputElement) => node.validity.valueMissing)).toBe(true);
    expect(ui.requests.filter(request => request.method === 'POST' && request.path === '/api/auth/login')).toHaveLength(0);
  });

  test('forgot password only uses synthetic mocked endpoint', async ({ page, ui }) => {
    ui.mockApi.route('POST', '/api/auth/forgot-password', () => ({ status: 200, json: { ok: true } }));
    await page.goto('/login');
    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await page.getByLabel('Correo electrónico').fill('synthetic@example.invalid');
    await page.getByRole('button', { name: 'Enviar link de recuperación' }).click();
    await expect(page.getByText('Listo. Revisa tu correo (y spam) para el link de recuperación.')).toBeVisible();
    expect(ui.requests.filter(request => request.path === '/api/auth/forgot-password' && request.method === 'POST')).toHaveLength(1);
  });

  test('reset password mismatched fields remain local then mocked success', async ({ page, ui }) => {
    ui.mockApi.route('POST', '/api/auth/reset-password', () => ({ status: 200, json: { ok: true } }));
    await page.goto('/auth/reset');
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('Synthetic-password-123!');
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill('Mismatch-password-123!');
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
    await expect(page.getByText('Las contraseñas no coinciden.', { exact: true })).toBeVisible();
    expect(ui.requests.filter(request => request.path === '/api/auth/reset-password')).toHaveLength(0);
    await page.getByLabel('Confirmar contraseña', { exact: true }).fill('Synthetic-password-123!');
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
    await expect(page.getByText('Contraseña actualizada. Ya puedes iniciar sesión.')).toBeVisible();
    expect(ui.requests.filter(request => request.path === '/api/auth/reset-password')).toHaveLength(1);
  });
});
