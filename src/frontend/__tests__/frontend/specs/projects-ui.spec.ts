import { test, expect } from '../fixtures';

test.describe('projects mocked administration', () => {
  test('held creation blocks second click and Enter; rejected draft explicitly retries to one readback entity', async ({ page, ui }, testInfo) => {
    const barrier = ui.mockApi.barrier(); let started = 0;
    ui.mockApi.route('POST', '/api/projects', async ({ body }) => {
      const occurrence = ++started;
      if (occurrence === 1) { await barrier.wait; return { status: 503, json: { ok: false, error: 'Creación temporalmente no disponible.' } }; }
      const project = { id: 'GAP01-created', ...body, my_role: 'owner', is_active: true };
      ui.dataset.projects.push(project); return { status: 201, json: { ok: true, project } };
    });
    try {
      await page.goto('/dashboard');
      await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
      const name = page.getByPlaceholder('Ej. Análisis Etnográfico: Biblioteca');
      await expect(name).toHaveValue(''); await name.fill('GAP01 pending project');
      await page.getByRole('button', { name: /Crear$/ }).click();
      await expect.poll(() => started).toBe(1);
      const pending = page.getByRole('button', { name: /Creando/ }); await expect(pending).toBeDisabled();
      const box = await pending.boundingBox(); if (!box) throw new Error('Pending submit button has no visible bounds');
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await name.press('Enter');
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      expect(started).toBe(1);
      barrier.release();
      await expect(page.getByText('Creación temporalmente no disponible.', { exact: true })).toBeVisible();
      await expect(name).toHaveValue('GAP01 pending project');
      await page.getByRole('button', { name: /Crear$/ }).click();
      await expect(page.getByRole('heading', { name: 'GAP01 pending project', exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('heading', { name: 'GAP01 pending project', exact: true })).toHaveCount(1);
      expect(ui.requests.filter(row => row.method === 'POST' && row.path === '/api/projects').map(row => row.status)).toEqual([503, 201]);
    } finally { barrier.release(); await testInfo.attach('GAP01-create-sequence', { body: JSON.stringify(ui.requests), contentType: 'application/json' }); }
  });

  test('grid list shared and report transitions retain exact project identities', async ({ page, ui }) => {
    ui.seed({ projects: [{ id: ui.projectId, name: 'GAP01 owned', my_role: 'owner' }, { id: '51200000-0000-4000-8000-000000000001', name: 'GAP01 shared', my_role: 'editor' }] });
    await page.goto('/dashboard');
    const heading = page.getByRole('heading', { name: 'GAP01 owned', exact: true }); await expect(heading).toBeVisible();
    const card = page.locator('[role=button]').filter({ has: heading });
    await page.getByTitle('List', { exact: true }).click();
    await expect.poll(() => card.evaluate(node => getComputedStyle(node.parentElement!).gridTemplateColumns.split(' ').length)).toBe(1);
    await expect(page.getByRole('heading', { name: 'GAP01 shared', exact: true })).toBeVisible();
    await page.getByTitle('Grid', { exact: true }).click();
    await expect.poll(() => card.evaluate(node => getComputedStyle(node.parentElement!).gridTemplateColumns.split(' ').length)).toBeGreaterThan(1);
    await page.getByRole('link', { name: 'Compartidos', exact: false }).click();
    await expect(heading).toHaveCount(0); await expect(page.getByRole('heading', { name: 'GAP01 shared', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Reportes', exact: false }).click(); await expect(heading).toBeVisible();
    await page.getByRole('link', { name: 'Mis Proyectos', exact: false }).click();
    await expect(page).toHaveURL(/\/dashboard$/); await expect(heading).toHaveCount(1);
    expect(ui.requests.filter(row => row.method !== 'GET' && row.path.startsWith('/api/projects'))).toEqual([]);
  });

  test('visible project search recovers only the matching identity instead of a no-op', async ({ page, ui }, testInfo) => {
    ui.seed({ projects: [{ id: ui.projectId, name: 'GAP01 matching', my_role: 'owner' }, { id: '51200000-0000-4000-8000-000000000002', name: 'GAP01 unrelated', my_role: 'owner' }] });
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'GAP01 unrelated', exact: true })).toBeVisible();
    await page.getByPlaceholder('Buscar proyectos...').fill('matching');
    try {
      await expect(page.getByRole('heading', { name: 'GAP01 matching', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'GAP01 unrelated', exact: true })).toHaveCount(0);
    } finally { await testInfo.attach('GAP01-search-requests', { body: JSON.stringify(ui.requests), contentType: 'application/json' }); }
  });

  test('failed project list is visible and browser reload recovers the real catalog', async ({ page, ui }) => {
    let fail = true;
    ui.mockApi.route('GET', '/api/projects', () => fail ? { status: 503, json: { ok: false, error: 'Lista temporalmente no disponible.' } } : { status: 200, json: { ok: true, projects: ui.dataset.projects } });
    await page.goto('/dashboard'); await expect(page.getByText('Lista temporalmente no disponible.', { exact: true })).toBeVisible();
    fail = false; await page.reload();
    await expect(page.getByRole('heading', { name: ui.dataset.projects[0].name, exact: true })).toBeVisible();
    await expect(page.getByText('Lista temporalmente no disponible.', { exact: true })).toHaveCount(0);
    expect(ui.requests.filter(row => row.path === '/api/projects').map(row => row.status)).toEqual([503, 200]);
  });
  test('create cancel is local; submit persists Unicode and reloads one card', async ({ page, ui }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
    await page.getByPlaceholder('Ej. Análisis Etnográfico: Biblioteca').fill('Cancelado');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    expect(ui.requests.filter(request => request.method === 'POST' && request.path === '/api/projects')).toHaveLength(0);
    await page.getByRole('button', { name: 'Nuevo Proyecto', exact: true }).click();
    const title = 'Memoria comunitaria Ñandú 🧪 '.repeat(4).trim();
    await page.getByPlaceholder('Ej. Análisis Etnográfico: Biblioteca').fill(title);
    await page.getByPlaceholder('Describe el objetivo del proyecto…').fill('Comillas "vivas", memoria y pertenencia.');
    await page.getByRole('button', { name: /^.*Crear$/ }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    expect(ui.requests.filter(request => request.method === 'POST' && request.path === '/api/projects')).toHaveLength(1);
    await page.reload();
    await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(1);
  });

  test('same-label cards edit and delete only the selected ID with cancel and readback', async ({ page, ui }) => {
    const ids = [ui.projectId, '22222222-2222-4222-8222-222222222222'];
    await ui.seed({ projects: ids.map(id => ({ id, name: 'Etiqueta repetida', description: id, my_role: 'owner', is_active: true, members: [] })) });
    await page.goto('/dashboard');
    const cards = page.locator('[role=button]').filter({ has: page.getByRole('heading', { name: 'Etiqueta repetida', exact: true }) });
    await expect(cards).toHaveCount(2);
    const target = cards.filter({ hasText: ids[1] });
    await target.getByTitle('Acciones', { exact: true }).click();
    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    await expect(page.getByPlaceholder('Nombre del proyecto')).toHaveValue('Etiqueta repetida');
    await page.getByPlaceholder('Nombre del proyecto').fill('Proyecto editado');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    expect(ui.requests.filter(request => request.method === 'PATCH')).toHaveLength(0);
    await target.getByTitle('Acciones', { exact: true }).click();
    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    await expect(page.getByPlaceholder('Nombre del proyecto')).toHaveValue('Etiqueta repetida');
    await page.getByPlaceholder('Nombre del proyecto').fill('Proyecto editado');
    await page.getByRole('button', { name: /Guardar$/, exact: false }).click();
    await expect(page.getByRole('heading', { name: 'Proyecto editado', exact: true })).toBeVisible();
    expect(ui.requests.filter(request => request.method === 'PATCH').map(request => request.path)).toEqual([`/api/projects/${ids[1]}`]);
    const edited = page.locator('[role=button]').filter({ has: page.getByRole('heading', { name: 'Proyecto editado', exact: true }) });
    await edited.getByTitle('Acciones', { exact: true }).click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByText('¿Seguro que quieres eliminar', { exact: false })).toContainText('"Proyecto editado"');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    expect(ui.requests.filter(request => request.method === 'DELETE')).toHaveLength(0);
    await edited.getByTitle('Acciones', { exact: true }).click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await page.getByRole('button', { name: /Eliminar$/, exact: false }).click();
    await expect(page.getByRole('heading', { name: 'Proyecto editado', exact: true })).toHaveCount(0);
    expect(ui.requests.filter(request => request.method === 'DELETE').map(request => request.path)).toEqual([`/api/projects/${ids[1]}`]);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Etiqueta repetida', exact: true })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Proyecto editado', exact: true })).toHaveCount(0);
  });

  test('owner-only avatar is the person initial without invented extra members', async ({ page, ui }) => {
    await ui.seed({ projects: [{ id: ui.projectId, name: 'Zoología', my_role: 'owner', members: [{ user_id: ui.identity.id, full_name: 'Ana Pérez' }] }] });
    await page.goto('/dashboard');
    const avatar = page.getByLabel('Usuarios del proyecto');
    await expect(avatar).toHaveText('A');
    await expect(avatar.getByTitle('Ana Pérez')).toHaveCount(1);
    await expect(avatar).not.toContainText('+1');
  });

  test('views isolate shared membership and report cards navigate by keyboard', async ({ page, ui }) => {
    const sharedId = '22222222-2222-4222-8222-222222222222';
    await ui.seed({ projects: [{ id: ui.projectId, name: 'Propio', my_role: 'owner' }, { id: sharedId, name: 'Compartido', my_role: 'editor' }] });
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Compartidos', exact: false }).click();
    await expect(page).toHaveURL(/\?view=shared$/);
    await expect(page.getByRole('heading', { name: 'Propio', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Compartido', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Reportes', exact: false }).click();
    await expect(page.getByRole('heading', { name: 'Propio', exact: true })).toBeVisible();
    const card = page.locator('[role=button]').filter({ has: page.getByRole('heading', { name: 'Propio', exact: true }) });
    await card.focus(); await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/projects/${ui.projectId}/report$`));
    await expect(page.getByRole('main').getByRole('heading', { name: 'Reporte', exact: true })).toBeVisible();
  });

  test('empty response displays explicit empty state', async ({ page, ui }) => {
    await ui.seed({ projects: [] }); await page.goto('/dashboard');
    await expect(page.getByText('Aún no hay proyectos. Crea tu primer proyecto con “Nuevo Proyecto”.')).toBeVisible();
    await expect(page.locator('[role=button]').filter({ has: page.locator('h3') })).toHaveCount(0);
  });
});
