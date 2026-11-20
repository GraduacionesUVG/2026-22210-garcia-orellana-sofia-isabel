import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';
import { seedPresentation } from '../presentation-seed';

test.describe('accessibility', () => {
  for (const suffix of ['corpus', 'analysis/codes', 'analysis/codes?view=coding', 'analysis/memos', 'analysis/insights', 'report', 'team']) {
    test(`serious and critical axe violations absent on ${suffix}`, async ({ page, ui }, testInfo) => {
      seedPresentation(ui);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/projects/${ui.projectId}/${suffix}`);
      await expect(page.getByRole('main').getByRole('heading').first()).toBeVisible();
      // Wait for a concrete populated control, not merely the shell heading.
      if (suffix === 'team') await expect(page.getByPlaceholder('correo@universidad.edu')).toBeVisible();
      if (suffix === 'report') await expect(page.getByRole('heading', { name: 'Síntesis del proyecto' })).toBeVisible();
      if (suffix === 'analysis/memos') await expect(page.getByRole('heading', { name: 'Memoria compartida como cuidado cotidiano', exact: true })).toBeVisible();
      if (suffix === 'analysis/insights') await expect(page.getByText('El cuidado sostiene la transmisión de memoria', { exact: true }).first()).toBeVisible();
      if (suffix === 'corpus') await expect(page.getByRole('link', { name: /^Abrir documento Entrevista/ })).toBeVisible();
      if (suffix === 'analysis/codes') await expect(page.getByRole('button', { name: 'Crear código', exact: true })).toBeVisible();
      if (suffix.includes('view=coding')) await expect(page.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem').first()).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      await testInfo.attach('axe-triage.json', { body: Buffer.from(JSON.stringify(results.violations.map(({ id, impact, description, nodes }) => ({ id, impact, description, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })), null, 2)), contentType: 'application/json' });
      const blocking = results.violations.filter(issue => ['serious', 'critical'].includes(issue.impact ?? '')).map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) }));
      expect(blocking, 'Blocking accessibility violations; full triage retained in attachment').toEqual([]);
    });
  }

  for (const activationKey of ['Enter', 'Space']) {
    test(`catalog modal opens with ${activationKey} after loading and has an accessible dialog name`, { tag: '@crossbrowser-smoke' }, async ({ page, ui }) => {
      seedPresentation(ui);
      const catalogResponse = ui.mockApi.barrier();
      ui.mockApi.route('GET', `/api/projects/${ui.projectId}/participants`, async () => {
        await catalogResponse.wait;
        return { json: { ok: true, participants: ui.dataset.participants, total: ui.dataset.participants.length } };
      });
      await page.goto(`/projects/${ui.projectId}/corpus`);
      const trigger = page.getByRole('button', { name: /Participantes.*Crea alias/ });
      await expect(trigger).toBeDisabled();
      await trigger.focus();
      await expect(trigger).not.toBeFocused();
      await page.keyboard.press(activationKey);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      catalogResponse.release();
      // focus() does not wait for a disabled button to become interactive.
      // Wait for dashboard loading to finish before sending real keyboard input.
      await expect(trigger).toBeEnabled();
      await trigger.focus();
      await expect(trigger).toBeFocused();
      await page.keyboard.press(activationKey);
      const section = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Participantes y fuentes', exact: true }) });
      await expect(section.getByPlaceholder('Ej. P01')).toBeEditable();
      await expect(page.getByRole('dialog', { name: 'Participantes y fuentes', exact: true })).toBeVisible();
    });
  }

  test('catalog modal traps Tab and Shift+Tab within its controls', { tag: '@crossbrowser-smoke' }, async ({ page, ui }) => {
    seedPresentation(ui);
    await page.goto(`/projects/${ui.projectId}/corpus`);
    await page.getByRole('button', { name: /Participantes.*Crea alias/ }).click();
    const section = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Participantes y fuentes', exact: true }) });
    await expect(section.getByPlaceholder('Ej. P01')).toBeEditable();
    const controls = section.locator('button, input, textarea, select, a[href]').filter({ visible: true });
    await controls.last().focus(); await page.keyboard.press('Tab');
    await expect.poll(() => section.evaluate(node => node.contains(document.activeElement))).toBe(true);
    await controls.first().focus(); await page.keyboard.press('Shift+Tab');
    await expect.poll(() => section.evaluate(node => node.contains(document.activeElement))).toBe(true);
  });

  test('codebook icon actions have accessible names and native disclosure responds to Enter', async ({ page, ui }) => {
    seedPresentation(ui);
    await page.goto(`/projects/${ui.projectId}/analysis/codes`);
    const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Redes de cuidado', exact: true }) });
    await expect(card.getByRole('button', { name: 'Editar codigo', exact: true })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Eliminar codigo', exact: true })).toBeVisible();
    const details = page.locator('details').filter({ has: page.getByText('Árbol operativo', { exact: true }) });
    await expect(details).not.toHaveAttribute('open', '');
    await details.locator('summary').focus(); await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(page.getByLabel('Código a mover')).toBeVisible();
    await details.locator('summary').focus(); await page.keyboard.press('Enter');
    await expect(details).not.toHaveAttribute('open', '');
    await expect(page.getByLabel('Código a mover')).not.toBeVisible();
  });

  test('catalog Escape closes overlay independently of its semantic role', { tag: '@crossbrowser-smoke' }, async ({ page, ui }) => {
    await page.goto(`/projects/${ui.projectId}/corpus`);
    const trigger = page.getByRole('button', { name: /Participantes.*Crea alias/ });
    await trigger.click();
    const section = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Participantes y fuentes', exact: true }) });
    await expect(section.getByPlaceholder('Ej. P01')).toBeEditable();
    await section.getByPlaceholder('Ej. P01').focus(); await page.keyboard.press('Escape');
    await expect(section).toHaveCount(0); await expect(trigger).toBeFocused();
  });
});
