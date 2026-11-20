import { test, expect } from '../fixtures';

test.describe('workflow versions through visible controls', () => {
  for (const module of ['research-design', 'sample-config'] as const) {
    test(`${module} UI-created checkpoints select cancel restore fields and ordered lists after reload`, async ({ page, ui }, testInfo) => {
      const isDesign = module === 'research-design';
      const datasetKey = isDesign ? 'researchDesign' : 'sampleConfig';
      const member = isDesign ? 'design' : 'config';
      const endpoint = `/api/projects/${ui.projectId}/${module}`, base = `${endpoint}/versions`;
      const versions: any[] = [], snapshots: Record<string, any> = {};
      ui.mockApi.route('PATCH', endpoint, ({ body }) => {
        Object.assign(ui.dataset[datasetKey][member], body, { revision: ui.dataset[datasetKey][member].revision + 1 });
        if (!isDesign) ui.dataset.sampleConfig.collection_techniques = body.collection_techniques;
        return { status: 200, json: { ok: true, data: ui.dataset[datasetKey], [member]: ui.dataset[datasetKey][member] } };
      });
      ui.mockApi.route('GET', base, () => ({ status: 200, json: { ok: true, versions } }));
      ui.mockApi.route('POST', base, ({ body }) => {
        const number = versions.length + 1, id = `GAP02-${module}-${number}`;
        const snapshot = structuredClone(ui.dataset[datasetKey]); snapshots[id] = snapshot;
        const version = { id, label: body.label, version_number: number, revision: number, created_at: `2026-10-04T12:0${number}:00Z`, trigger_type: 'manual', snapshot: isDesign ? snapshot : { ...snapshot.config, collection_techniques: snapshot.collection_techniques } };
        versions.unshift(version); return { status: 201, json: { ok: true, created: true, version } };
      });
      ui.mockApi.route('POST', `${base}/:versionId/restore`, ({ path }) => {
        const revision = ui.dataset[datasetKey][member].revision + 1;
        ui.dataset[datasetKey] = structuredClone(snapshots[path.split('/').at(-2)!]);
        ui.dataset[datasetKey][member].revision = revision;
        return { status: 200, json: { ok: true, data: ui.dataset[datasetKey], restored: { current: ui.dataset[datasetKey] } } };
      });
      if (isDesign) ui.mockApi.route('DELETE', `${endpoint}/specific-objectives/:objectiveId`, ({ path }) => {
        ui.dataset.researchDesign.specific_objectives = ui.dataset.researchDesign.specific_objectives.filter((row: any) => row.id !== path.split('/').at(-1));
        return { status: 200, json: { ok: true, deletedCount: 1 } };
      });
      if (isDesign) ui.seed({ researchDesign: { design: { research_question: '', general_objective: '', revision: 0 }, specific_objectives: [
        { id: 'GAP02-objective-1', text: 'Seed first', position: 0, revision: 0 }, { id: 'GAP02-objective-2', text: 'Seed second', position: 1, revision: 0 },
      ] } });
      try {
      await page.goto(`/projects/${ui.projectId}/${module}`);
      const field = page.getByPlaceholder(isDesign
        ? 'Ej: ¿Cómo perciben los estudiantes universitarios el uso de inteligencia artificial generativa en sus procesos de aprendizaje?'
        : 'Ej. Trabajo de campo inicial con acceso preliminar a comunidades urbanas.');
      const specific = page.getByPlaceholder('Ej: Identificar los usos académicos más frecuentes de la inteligencia artificial generativa entre estudiantes universitarios.');
      await field.fill('GAP02 first Ñandú');
      if (isDesign) {
        await specific.nth(0).fill('GAP02 first ordered objective'); await specific.nth(1).fill('GAP02 second ordered objective');
        await expect.poll(() => ui.dataset.researchDesign.specific_objectives.map((row: any) => row.text)).toEqual(['GAP02 first ordered objective', 'GAP02 second ordered objective']);
      } else {
        for (const label of ['GAP02 first technique', 'GAP02 second technique']) {
          await page.getByPlaceholder('Ej. Cartografía social').fill(label);
          await page.getByRole('button', { name: /Agregar$/ }).click();
          await expect(page.getByRole('button', { name: `Eliminar ${label}`, exact: true })).toBeVisible();
        }
      }
      await expect.poll(() => ui.dataset[datasetKey][member][isDesign ? 'research_question' : 'field_phase']).toBe('GAP02 first Ñandú');
      if (!isDesign) await expect.poll(() => ui.dataset.sampleConfig.collection_techniques.length).toBe(2);
      for (const number of [1, 2]) {
        if (number === 2) {
          await field.fill('GAP02 second draft');
          if (isDesign) await page.locator('[data-objective-id="GAP02-objective-1"]').getByRole('button', { name: /Eliminar/ }).click();
          else await page.getByRole('button', { name: 'Eliminar GAP02 first technique', exact: true }).click();
          await expect.poll(() => ui.dataset[datasetKey][member][isDesign ? 'research_question' : 'field_phase']).toBe('GAP02 second draft');
          await expect.poll(() => (isDesign ? ui.dataset.researchDesign.specific_objectives : ui.dataset.sampleConfig.collection_techniques).length).toBe(1);
        }
        await page.getByRole('button', { name: /Versiones anteriores/ }).click();
        await page.getByLabel('Nombre de la versión').fill(`GAP02 checkpoint ${number}`);
        await page.locator('form').getByRole('button', { name: /Guardar versión/ }).click();
        await expect(page.getByRole('button', { name: new RegExp(`v${number} GAP02 checkpoint ${number}`) })).toBeVisible();
        await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      }
      await page.getByRole('button', { name: /Versiones anteriores/ }).click();
      await page.getByRole('button', { name: /v1 GAP02 checkpoint 1/ }).click();
      await expect(page.getByText('GAP02 first Ñandú', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Restaurar$/ }).click();
      await expect(page.getByRole('heading', { name: '¿Quieres reemplazar el borrador actual?' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      expect(ui.requests.filter(row => row.path.endsWith('/restore'))).toHaveLength(0);
      await expect(field).toHaveValue('GAP02 second draft');
      await page.getByRole('button', { name: /Restaurar$/ }).click();
      await page.getByRole('button', { name: /Restaurar$/ }).last().click();
      await expect.poll(() => ui.requests.filter(row => row.path.endsWith('/restore')).length).toBe(1);
      if (!isDesign) await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      await expect(field).toHaveValue('GAP02 first Ñandú');
      await page.reload(); await expect(field).toHaveValue('GAP02 first Ñandú');
      if (isDesign) {
        await expect(specific).toHaveCount(2);
        await expect(specific.nth(0)).toHaveValue('GAP02 first ordered objective');
        await expect(specific.nth(1)).toHaveValue('GAP02 second ordered objective');
      } else {
        await expect(page.getByRole('button', { name: /^Eliminar GAP02 .* technique$/ })).toHaveCount(2);
        await expect(page.getByRole('button', { name: /^Eliminar GAP02 .* technique$/ }).nth(0)).toHaveAccessibleName('Eliminar GAP02 first technique');
        await expect(page.getByRole('button', { name: /^Eliminar GAP02 .* technique$/ }).nth(1)).toHaveAccessibleName('Eliminar GAP02 second technique');
      }
      const restoredRevision = ui.dataset[datasetKey][member].revision;
      await field.fill('GAP02 after restored revision');
      await expect.poll(() => ui.requests.filter(row => row.method === 'PATCH' && row.path === endpoint && row.body[isDesign ? 'research_question' : 'field_phase'] === 'GAP02 after restored revision').at(-1)?.body.base_revision).toBeGreaterThanOrEqual(restoredRevision);
      expect(ui.requests.filter(row => row.path.endsWith('/restore')).map(row => row.path)).toEqual([`${base}/GAP02-${module}-1/restore`]);
      } finally { await testInfo.attach('GAP02-lifecycle-requests', { body: JSON.stringify(ui.requests), contentType: 'application/json' }); }
    });
  }
  test('two delimitation versions preview cancel and restore the UI-created snapshot', async ({ page, ui }) => {
    const base = `/api/projects/${ui.projectId}/delimitation/versions`;
    const snapshots: Record<string, any> = {};
    const versions: any[] = [];
    ui.mockApi.route('GET', base, () => ({ status: 200, json: { ok: true, versions } }));
    ui.mockApi.route('POST', base, ({ body }) => {
      const version = { id: `version-${versions.length + 1}`, version_number: versions.length + 1, label: body.label, trigger_type: 'manual', created_at: '2026-10-04T12:00:00Z' };
      snapshots[version.id] = structuredClone(ui.dataset.delimitation);
      versions.unshift(version);
      return { status: 201, json: { ok: true, data: { created: true, version } } };
    });
    ui.mockApi.route('GET', `${base}/:versionId`, ({ path }) => ({ status: 200, json: { ok: true, data: snapshots[path.split('/').at(-1)!] } }));
    ui.mockApi.route('POST', `${base}/:versionId/restore`, ({ path }) => {
      ui.dataset.delimitation = structuredClone(snapshots[path.split('/').at(-2)!]);
      ui.dataset.delimitation.delim.revision += 1;
      return { status: 200, json: { ok: true, data: ui.dataset.delimitation } };
    });
    await page.goto(`/projects/${ui.projectId}/delimitation`);
    const topic = page.getByPlaceholder('Describe tu tema central...');
    for (const [index, value] of ['Primer borrador Ñandú', 'Segundo borrador 🧪'].entries()) {
      await topic.fill(value);
      await expect.poll(() => ui.requests.filter(request => request.method === 'PATCH' && request.path.endsWith('/delimitation')).at(-1)?.body.topic).toBe(value);
      await page.getByRole('button', { name: /Guardar versión/ }).click();
      await page.getByLabel('Nombre de la versión').fill(`Checkpoint ${index + 1}`);
      await page.locator('form').getByRole('button', { name: /Guardar versión/ }).click();
      await expect(page.getByText(`Versión v${index + 1} guardada correctamente.`)).toBeVisible();
      await page.getByRole('button', { name: 'Cerrar', exact: true }).filter({ visible: true }).last().click();
    }
    await page.getByRole('button', { name: /Versiones anteriores/ }).click();
    await page.getByRole('button', { name: /v1 Checkpoint 1/ }).click();
    await expect(page.getByText('Primer borrador Ñandú', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Restaurar$/, exact: false }).click();
    await expect(page.getByRole('heading', { name: '¿Quieres reemplazar el borrador actual?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    expect(ui.requests.filter(request => request.path.endsWith('/restore'))).toHaveLength(0);
    await expect(topic).toHaveValue('Segundo borrador 🧪');
    await page.getByRole('button', { name: /Restaurar$/, exact: false }).click();
    await page.getByRole('button', { name: /Restaurar$/, exact: false }).last().click();
    await expect(page.getByText('Versión restaurada correctamente.')).toBeVisible();
    expect(ui.requests.filter(request => request.path.endsWith('/restore')).map(request => request.path)).toEqual([`${base}/version-1/restore`]);
    await page.getByRole('button', { name: 'Cerrar', exact: true }).filter({ visible: true }).last().click();
    await expect(topic).toHaveValue('Primer borrador Ñandú');
    await page.reload(); await expect(topic).toHaveValue('Primer borrador Ñandú');
  });

  for (const status of [409, 503]) {
    test(`${status} version creation retains its label and never claims saved`, async ({ page, ui }) => {
      ui.mockApi.route('POST', `/api/projects/${ui.projectId}/delimitation/versions`, () => ({ status, json: { ok: false, error: 'No se pudo guardar el punto de control.' } }));
      await page.goto(`/projects/${ui.projectId}/delimitation`);
      await page.getByRole('button', { name: /Guardar versión/ }).click();
      const label = page.getByLabel('Nombre de la versión'); await label.fill('Mi checkpoint pendiente');
      await page.locator('form').getByRole('button', { name: /Guardar versión/ }).click();
      await expect(page.getByText('No se pudo guardar el punto de control.', { exact: true })).toBeVisible();
      await expect(label).toHaveValue('Mi checkpoint pendiente');
      await expect(page.locator('form').getByRole('button', { name: /Guardar versión/ })).toBeEnabled();
      await expect(page.getByText(/guardada correctamente/)).toHaveCount(0);
    });
  }
});
