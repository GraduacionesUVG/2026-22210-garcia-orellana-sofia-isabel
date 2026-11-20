import { test, expect } from '../fixtures';

test.describe('profile mocked', () => {
  test('cancel is local and save reloads the changed name without faculty', async ({ page, ui }) => {
    await page.goto('/profile');
    const name = page.getByPlaceholder('Ej. Juan Perez');
    await expect(name).toHaveValue(/\S/);
    const original = await name.inputValue();
    await name.fill('Cancelado 🧪');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(name).toHaveValue(original);
    expect(ui.requests.filter(request => request.method === 'PATCH')).toHaveLength(0);
    await name.fill('Investigadora Ñandú 🧪');
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();
    expect(ui.requests.filter(request => request.path === '/api/users/me' && request.method === 'PATCH').map(request => request.body)).toEqual([{ full_name: 'Investigadora Ñandú 🧪' }]);
    await page.reload();
    await expect(name).toHaveValue('Investigadora Ñandú 🧪');
    await expect(page.locator('body')).not.toContainText(/Facultad/i);
  });

  test('expired session on load redirects to login without profile data', async ({ page, ui }) => {
    ui.mockApi.route('GET', '/api/users/me', () => ({ status: 401, json: { ok: false, error: 'Sesión expirada.' } }));
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Iniciar Sesión', exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Ej. Juan Perez')).toHaveCount(0);
  });

  test('expired session during save cannot show false success or discard local name', async ({ page, ui }) => {
    ui.mockApi.route('PATCH', '/api/users/me', () => ({ status: 401, json: { ok: false, error: 'Sesión expirada.' } }));
    await page.goto('/profile');
    const name = page.getByPlaceholder('Ej. Juan Perez');
    await expect(name).toHaveValue(/\S/); await name.fill('Borrador conservado');
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    await expect(page.getByText('Sesión expirada.', { exact: true })).toBeVisible();
    await expect(name).toHaveValue('Borrador conservado');
    await expect(page.getByText('Los cambios se guardaron correctamente.')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Guardar cambios', exact: true })).toBeEnabled();
  });

  test('password change remains synthetic and clears sensitive fields', async ({ page, ui }) => {
    ui.mockApi.route('POST', '/api/auth/change-password', () => ({ status: 200, json: { ok: true } }));
    await page.goto('/profile');
    await expect(page.getByPlaceholder('Ej. Juan Perez')).toHaveValue(/\S/);
    const passwords = page.locator('input[type=password]');
    await passwords.nth(0).fill('Synthetic-old-123!');
    await passwords.nth(1).fill('Synthetic-new-123!');
    await passwords.nth(2).fill('Synthetic-new-123!');
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    await expect(page.getByText('El perfil y la contraseña se actualizaron correctamente.')).toBeVisible();
    for (const input of await passwords.all()) await expect(input).toHaveValue('');
    expect(ui.requests.filter(request => request.path === '/api/auth/change-password' && request.method === 'POST')).toHaveLength(1);
  });

  test('logout and browser back do not expose the previous profile', async ({ page, ui }) => {
    let loggedOut = false;
    ui.mockApi.route('POST', '/api/auth/logout', () => { loggedOut = true; return { status: 200, json: { ok: true } }; });
    ui.mockApi.route('GET', '/api/users/me', () => loggedOut
      ? { status: 401, json: { ok: false, error: 'Sesión expirada.' } }
      : { status: 200, json: ui.dataset.me });
    ui.mockApi.route('GET', '/api/projects', () => loggedOut
      ? { status: 401, json: { ok: false, error: 'Sesión expirada.' } }
      : { status: 200, json: { ok: true, projects: ui.dataset.projects } });
    await page.goto('/dashboard'); await page.goto('/profile');
    await expect(page.getByPlaceholder('Ej. Juan Perez')).toHaveValue(/\S/);
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goBack();
    await expect(page.getByPlaceholder('Ej. Juan Perez')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: new RegExp(`E2E_${ui.runId}`) })).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Investigadora Local');
  });
});
