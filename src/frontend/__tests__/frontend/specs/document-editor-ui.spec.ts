import { test, expect } from '../fixtures';
import { assertMainScrollBoundary, assertWorkspaceOperable } from '../browser-assertions';

const titlePlaceholder = 'Ej. Entrevista P01 sobre prácticas educativas';
const contentPlaceholder = 'Pega aquí la entrevista, nota de campo, observación o texto cualitativo...';

test.describe('document-editor real controls mocked persistence', () => {
  test('native trash confirmation cancel sends no DELETE then trash restores exact document after reload', async ({ page, ui }, testInfo) => {
    const id = 'GAP03-trash-document', sibling = 'GAP03-unaffected-document';
    const row = { id, project_id: ui.projectId, title: 'GAP03 trash evidence', content: 'Trash retained content Ñandú', document_type: 'interview', status: 'draft', revision: 2, deleted_at: null as string | null };
    ui.seed({ documents: [row, { ...row, id: sibling, title: 'GAP03 unaffected sibling' }] });
    const endpoint = `/api/projects/${ui.projectId}/documents/${id}`;
    ui.mockApi.route('DELETE', endpoint, () => { row.deleted_at = '2026-10-04T12:00:00Z'; return { status: 200, json: { ok: true, deleted: true } }; });
    ui.mockApi.route('GET', `/api/projects/${ui.projectId}/documents/trash`, () => ({ status: 200, json: { ok: true, documents: ui.dataset.documents.filter(item => item.deleted_at) } }));
    ui.mockApi.route('POST', `${endpoint}/restore`, () => { row.deleted_at = null; row.revision++; return { status: 200, json: { ok: true, document: row } }; });
    try {
      await page.goto(`/projects/${ui.projectId}/corpus/${id}`);
      await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue('Trash retained content Ñandú');
      page.once('dialog', async dialog => { expect(dialog.message()).toBe('¿Seguro que quieres enviar este documento a la papelera?'); await dialog.dismiss(); });
      await page.getByRole('button', { name: /Enviar a papelera/ }).click();
      expect(ui.requests.filter(request => request.method === 'DELETE')).toHaveLength(0);
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: /Enviar a papelera/ }).click();
      await expect(page).toHaveURL(new RegExp(`/projects/${ui.projectId}/corpus$`));
      await expect(page.getByRole('link', { name: 'Abrir documento GAP03 trash evidence', exact: true })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Abrir documento GAP03 unaffected sibling', exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Papelera/ }).click();
      const trash = page.locator('section').filter({ has: page.getByRole('button', { name: 'Cerrar papelera', exact: true }) });
      const deletedCard = trash.locator('article').filter({ has: page.getByRole('heading', { name: 'GAP03 trash evidence', exact: true }) });
      await expect(deletedCard).toBeVisible();
      await deletedCard.getByRole('button', { name: /Restaurar/ }).click();
      await expect(page.getByText('El documento se restauró correctamente.', { exact: true })).toBeVisible();
      await expect(deletedCard).toHaveCount(0);
      await page.getByRole('button', { name: 'Cerrar papelera', exact: true }).click();
      await page.reload();
      await expect(page.getByRole('link', { name: 'Abrir documento GAP03 trash evidence', exact: true })).toHaveCount(1);
      await expect(page.getByRole('link', { name: 'Abrir documento GAP03 unaffected sibling', exact: true })).toHaveCount(1);
      await page.getByRole('link', { name: 'Abrir documento GAP03 trash evidence', exact: true }).click();
      await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue('Trash retained content Ñandú');
      expect(ui.requests.filter(request => request.method === 'DELETE').map(request => request.path)).toEqual([endpoint]);
      expect(ui.requests.filter(request => request.method === 'POST' && request.path.endsWith('/restore')).map(request => request.path)).toEqual([`${endpoint}/restore`]);
    } finally { await testInfo.attach('GAP03-trash-sequence', { body: JSON.stringify(ui.requests), contentType: 'application/json' }); }
  });

  test('document checkpoints save actual edits select exact snapshot cancel then restore title text and revision', async ({ page, ui }, testInfo) => {
    const row = { id: 'GAP03-history-document', project_id: ui.projectId, title: 'GAP03 original title', content: 'GAP03 original text', document_type: 'interview', status: 'draft', revision: 0, deleted_at: null };
    ui.seed({ documents: [row] });
    const endpoint = `/api/projects/${ui.projectId}/documents/${row.id}`, base = `${endpoint}/versions`, versions: any[] = [];
    ui.mockApi.route('GET', base, () => ({ status: 200, json: { ok: true, versions } }));
    ui.mockApi.route('POST', base, ({ body }) => {
      const number = versions.length + 1;
      const version = { id: `GAP03-history-${number}`, version_number: number, label: body.label, snapshot_title: row.title, snapshot_content: row.content, snapshot_revision: row.revision, snapshot_document_type: row.document_type, snapshot_status: row.status, snapshot_language: 'es' };
      versions.unshift(version); return { status: 201, json: { ok: true, version } };
    });
    ui.mockApi.route('GET', `${base}/:versionId`, ({ path }) => ({ status: 200, json: { ok: true, version: versions.find(version => version.id === path.split('/').at(-1)) } }));
    ui.mockApi.route('POST', `${base}/:versionId/restore`, ({ path, body }) => {
      if (body.base_revision !== row.revision) return { status: 409, json: { ok: false, error: 'DOCUMENT_REVISION_CONFLICT' } };
      const version = versions.find(item => item.id === path.split('/').at(-2));
      Object.assign(row, { title: version.snapshot_title, content: version.snapshot_content, revision: row.revision + 1 });
      return { status: 200, json: { ok: true, document: row } };
    });
    try {
      await page.goto(`/projects/${ui.projectId}/corpus/${row.id}`);
      await expect(page.getByPlaceholder(titlePlaceholder)).toHaveValue('GAP03 original title');
      for (const number of [1, 2]) {
        await page.getByPlaceholder(titlePlaceholder).fill(`GAP03 saved title ${number}`);
        await page.getByPlaceholder(contentPlaceholder).fill(`GAP03 saved text ${number} Ñandú 🧪`);
        await page.getByRole('button', { name: /Guardar cambios/ }).click();
        await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();
        await page.getByRole('button', { name: /Ver versiones/ }).click();
        await page.getByLabel('Nombre de la versión').fill(`GAP03 checkpoint ${number}`);
        await page.locator('form').getByRole('button', { name: /Guardar versión/ }).click();
        await expect(page.getByRole('button', { name: new RegExp(`v${number} GAP03 checkpoint ${number}`) })).toBeVisible();
        await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      }
      await page.getByRole('button', { name: /Ver versiones/ }).click();
      await page.getByRole('button', { name: /v1 GAP03 checkpoint 1/ }).click();
      await expect(page.getByText('GAP03 saved text 1 Ñandú 🧪', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Restaurar$/ }).click();
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      expect(ui.requests.filter(request => request.path.endsWith('/restore'))).toHaveLength(0);
      await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue('GAP03 saved text 2 Ñandú 🧪');
      await page.getByRole('button', { name: /Restaurar$/ }).click();
      await page.getByRole('button', { name: /Restaurar$/ }).last().click();
      await expect(page.getByText('La versión se restauró correctamente.', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      await expect(page.getByPlaceholder(titlePlaceholder)).toHaveValue('GAP03 saved title 1');
      await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue('GAP03 saved text 1 Ñandú 🧪');
      await page.reload();
      await expect(page.getByPlaceholder(titlePlaceholder)).toHaveValue('GAP03 saved title 1');
      await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue('GAP03 saved text 1 Ñandú 🧪');
      expect(ui.requests.filter(request => request.path.endsWith('/restore')).map(request => [request.path, request.body.base_revision])).toEqual([[`${base}/GAP03-history-1/restore`, 2]]);
      await page.getByPlaceholder(contentPlaceholder).fill('GAP03 edit after restored revision');
      await page.getByRole('button', { name: /Guardar cambios/ }).click();
      await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();
      expect(ui.requests.filter(request => request.method === 'PATCH' && request.path === endpoint).at(-1)?.body.base_revision).toBe(3);
    } finally { await testInfo.attach('GAP03-history-sequence', { body: JSON.stringify(ui.requests), contentType: 'application/json' }); }
  });
  test('create normalized CRLF quotes emoji and edit reload the same document', async ({ page, ui }) => {
    const title = 'Entrevista Ñandú 🧪';
    const text = 'Dijo: "memoria" 🧪\r\nSegunda línea\r\n\r\nÚltima línea';
    await page.goto(`/projects/${ui.projectId}/corpus`);
    await page.getByRole('button', { name: /Nueva transcripción/ }).last().click();
    await expect(page.getByRole('button', { name: /Guardar transcripción/ })).toBeDisabled();
    await page.getByPlaceholder(titlePlaceholder).fill(title);
    await page.getByPlaceholder(contentPlaceholder).fill(text);
    await page.getByRole('button', { name: /Guardar transcripción/ }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${ui.projectId}/corpus$`));
    const card = page.getByRole('link', { name: `Abrir documento ${title}`, exact: true });
    await expect(card).toBeVisible(); await card.focus(); await page.keyboard.press('Enter');
    const id = ui.dataset.documents[0].id;
    await expect(page).toHaveURL(new RegExp(`/projects/${ui.projectId}/corpus/${id}$`));
    await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue(text.replace(/\r\n/g, '\n'));
    await page.getByPlaceholder(titlePlaceholder).fill('Entrevista corregida 🧪');
    await page.getByRole('button', { name: /Guardar cambios/ }).click();
    await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();
    expect(ui.requests.filter(request => request.method === 'PATCH' && request.path.includes('/documents/')).map(request => request.path)).toEqual([`/api/projects/${ui.projectId}/documents/${id}`]);
    await page.reload();
    await expect(page.getByPlaceholder(titlePlaceholder)).toHaveValue('Entrevista corregida 🧪');
    await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue(text.replace(/\r\n/g, '\n'));
    await assertWorkspaceOperable(page);
  });

  test('409 document rejection keeps edited text and never announces success', async ({ page, ui }) => {
    const id = 'document-conflict';
    await ui.seed({ documents: [{ id, project_id: ui.projectId, title: 'Documento protegido', content: 'Texto original', document_type: 'interview', status: 'draft', revision: 2, deleted_at: null }] });
    ui.mockApi.route('PATCH', `/api/projects/${ui.projectId}/documents/${id}`, () => ({ status: 409, json: { ok: false, error: 'DOCUMENT_REVISION_CONFLICT' } }));
    await page.goto(`/projects/${ui.projectId}/corpus/${id}`);
    await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue('Texto original');
    await page.getByPlaceholder(contentPlaceholder).fill('Borrador preservado 🧪');
    await page.getByRole('button', { name: /Guardar cambios/ }).click();
    await expect(page.getByText('Este documento fue modificado en otra pestaña o por otro usuario. Recarga el documento antes de guardar.')).toBeVisible();
    await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue('Borrador preservado 🧪');
    await expect(page.getByText('Los cambios se guardaron correctamente.')).toHaveCount(0);
  });

  test('segment-locked content rejection preserves the unsaved text', async ({ page, ui }) => {
    const id = 'document-segmented';
    await ui.seed({ documents: [{ id, project_id: ui.projectId, title: 'Documento segmentado', content: 'Texto con segmentos', document_type: 'interview', status: 'draft', revision: 1, deleted_at: null }] });
    ui.mockApi.route('PATCH', `/api/projects/${ui.projectId}/documents/${id}`, () => ({ status: 409, json: { ok: false, error: 'DOCUMENT_HAS_ACTIVE_SEGMENTS' } }));
    await page.goto(`/projects/${ui.projectId}/corpus/${id}`);
    await page.getByPlaceholder(contentPlaceholder).fill('Cambio que afecta segmentos');
    await page.getByRole('button', { name: /Guardar cambios/ }).click();
    await expect(page.getByText('DOCUMENT_HAS_ACTIVE_SEGMENTS', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue('Cambio que afecta segmentos');
    expect(ui.dataset.documents[0].content).toBe('Texto con segmentos');
    await expect(page.getByText('Los cambios se guardaron correctamente.')).toHaveCount(0);
  });

  test('pending save disables navigation and retains the current entity until completion', async ({ page, ui }) => {
    const id = 'document-pending'; const barrier = ui.mockApi.barrier();
    await ui.seed({ documents: [{ id, project_id: ui.projectId, title: 'Entidad pendiente', content: 'Texto pendiente', document_type: 'interview', status: 'draft', revision: 0, deleted_at: null }] });
    ui.mockApi.route('PATCH', `/api/projects/${ui.projectId}/documents/${id}`, async ({ body }) => {
      await barrier.wait; Object.assign(ui.dataset.documents[0], body, { revision: 1 });
      return { status: 200, json: { ok: true, document: ui.dataset.documents[0] } };
    });
    try {
      await page.goto(`/projects/${ui.projectId}/corpus/${id}`);
      await page.getByPlaceholder(contentPlaceholder).fill('Guardado pendiente 🧪');
      await page.getByRole('button', { name: /Guardar cambios/ }).click();
      await expect(page.getByRole('button', { name: /Volver al corpus/ })).toBeDisabled();
      await expect(page.getByRole('button', { name: /Recargar/ })).toBeDisabled();
      await expect(page.getByPlaceholder(titlePlaceholder)).toHaveValue('Entidad pendiente');
      await expect(page).toHaveURL(new RegExp(`/projects/${ui.projectId}/corpus/${id}$`));
      barrier.release();
      await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();
      await page.reload(); await expect(page.getByPlaceholder(contentPlaceholder)).toHaveValue('Guardado pendiente 🧪');
    } finally { barrier.release(); }
  });

  test('long editor and catalog modal use internal scroll and closing leaves no overlay', async ({ page, ui }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/projects/${ui.projectId}/corpus/new`);
    await page.getByPlaceholder(titlePlaceholder).fill('Documento largo');
    await page.getByPlaceholder(contentPlaceholder).fill('Línea de texto 🧪\n'.repeat(100));
    await assertWorkspaceOperable(page); await assertMainScrollBoundary(page);
    await page.getByRole('button', { name: /Volver al corpus/ }).click();
    await page.getByRole('button', { name: /Participantes.*Crea alias/ }).click();
    const modal = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Participantes y fuentes' }) });
    await expect(modal).toBeVisible();
    expect(await page.evaluate(() => document.scrollingElement!.scrollHeight <= document.scrollingElement!.clientHeight + 1)).toBe(true);
    await modal.getByRole('button', { name: 'Cerrar configuración' }).click();
    await assertWorkspaceOperable(page);
    await page.getByRole('button', { name: /Participantes.*Crea alias/ }).click();
    await expect(modal.getByPlaceholder('Ej. P01')).toBeEditable();
    await modal.getByRole('button', { name: 'Cerrar configuración' }).click();
    await assertWorkspaceOperable(page);
  });
});
