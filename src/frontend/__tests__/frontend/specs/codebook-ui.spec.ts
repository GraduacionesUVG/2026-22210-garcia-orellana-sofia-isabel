import { test, expect } from '../fixtures';

const parentId = '44444444-4444-4444-8444-444444444444';
const childId = '55555555-5555-4555-8555-555555555555';
const parent = { id: parentId, name: 'Cuidado', description: 'Relaciones de cuidado', definition: 'Apoyo mutuo', position: 0, revision: 0, parent_code_id: null, color: '#005944', deleted_at: null };

test.describe('codebook', () => {
  test('creates Unicode child then edits and moves only that code; branch comparison starts closed', async ({ page, ui }) => {
    ui.seed({ codes: [parent] });
    const path = `/api/projects/${ui.projectId}/analysis/codes`;
    let child: any = null;
    ui.mockApi.route('GET', path, () => ({ status: 200, json: { ok: true, codes: child ? [parent, child] : [parent], total: child ? 2 : 1 } }));
    ui.mockApi.route('POST', path, ({ body }: any) => { child = { ...body, id: childId, revision: 0 }; return { status: 201, json: { ok: true, code: child } }; });
    ui.mockApi.route('PATCH', `${path}/${childId}`, ({ body }: any) => { child = { ...child, ...body, revision: child.revision + 1 }; return { status: 200, json: { ok: true, code: child } }; });
    await page.goto(`/projects/${ui.projectId}/analysis/codes`);
    const operation = page.locator('details').filter({ has: page.getByText('Árbol operativo', { exact: true }) });
    await expect(operation).not.toHaveAttribute('open', '');
    await page.getByRole('button', { name: 'Crear código', exact: true }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('Cuidado 🌿 específico');
    await page.getByLabel('Definición', { exact: true }).fill('Ayuda cotidiana');
    await page.getByRole('combobox', { name: /^Código padre/ }).selectOption(parentId);
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Cuidado 🌿 específico', exact: true }) });
    await expect(card).toBeVisible();
    expect(ui.requests.find((r: any) => r.method === 'POST' && r.path === path)?.body).toMatchObject({ name: 'Cuidado 🌿 específico', parent_code_id: parentId });
    await card.getByRole('button', { name: 'Editar codigo' }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('Cuidado editado');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Cuidado editado', exact: true })).toBeVisible();
    await operation.locator('summary').click();
    await page.getByLabel('Código a mover').selectOption(childId);
    await page.getByRole('combobox', { name: /^Código padre/ }).selectOption('');
    await page.getByLabel('Posición', { exact: true }).fill('2');
    await page.getByRole('button', { name: 'Guardar posición' }).click();
    await expect(page.getByText('Sin alertas críticas', { exact: true })).toBeVisible();
    expect(ui.requests.filter((r: any) => r.method === 'PATCH').map((r: any) => r.path)).toEqual([`${path}/${childId}`, `${path}/${childId}`]);
    expect(ui.requests.filter((r: any) => r.method === 'PATCH').at(-1)?.body).toMatchObject({ parent_code_id: null, position: 2 });
    await page.getByLabel('Primera rama').selectOption(parentId);
    await page.getByLabel('Segunda rama').selectOption(childId);
    await expect(page.getByRole('heading', { name: 'Comparar ramas', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Cuidado editado', exact: true })).toBeVisible();
  });

  test('dependency409 rejects deletion visibly and retains code after reload', async ({ page, ui }) => {
    ui.seed({ codes: [parent] });
    const path = `/api/projects/${ui.projectId}/analysis/codes/${parentId}`;
    ui.mockApi.route('DELETE', path, () => ({ status: 409, json: { ok: false, error: 'CODE_HAS_DEPENDENCIES' } }));
    await page.goto(`/projects/${ui.projectId}/analysis/codes`);
    const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Cuidado', exact: true }) });
    await expect(card).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await card.getByRole('button', { name: 'Eliminar codigo' }).click();
    await expect(page.getByText(/dependencias|CODE_HAS_DEPENDENCIES/i).filter({ visible: true }).first()).toBeVisible();
    expect(ui.requests.filter((r: any) => r.method === 'DELETE' && r.path === path)).toHaveLength(1);
    await page.reload();
    await expect(card).toBeVisible();
  });
});
