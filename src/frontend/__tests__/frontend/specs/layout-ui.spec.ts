import { test, expect } from '../fixtures';
import { assertWorkspaceOperable } from '../browser-assertions';
import { seedPresentation, presentationDocumentId } from '../presentation-seed';

test.describe('layout', () => {
  test('1280 team member names remain visible within the narrow content column', async ({ page, ui }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    ui.seed({ team: { ...ui.dataset.team, members: [...ui.dataset.team.members, { user_id: 'team-layout-editor', role: 'editor', full_name: 'Colaboradora de campo', email: 'qa-editor@example.test' }] } });
    await page.goto(`/projects/${ui.projectId}/team`);
    const members = page.locator('section').filter({ has: page.getByText('Miembros activos', { exact: true }) });
    await expect(members.getByText('Colaboradora de campo', { exact: true })).toBeVisible();
    await expect(members.getByText('qa-editor@example.test', { exact: true })).toBeVisible();
    const button = members.getByRole('button', { name: 'Quitar acceso', exact: true }).filter({ visible: true }).last();
    await expect(button).toBeEnabled();
    // An actionability trial performs hit-testing, without deleting the synthetic member.
    await button.click({ trial: true });
  });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 390, height: 844 }]) {
    test(`${viewport.width}x${viewport.height} populated report fits shell and sidebar opens by keyboard`, { tag: '@crossbrowser-layout' }, async ({ page, ui }) => {
      seedPresentation(ui); await page.setViewportSize(viewport);
      await page.goto(`/projects/${ui.projectId}/report`);
      await expect(page.getByRole('heading', { name: 'Síntesis del proyecto' })).toBeVisible();
      await assertWorkspaceOperable(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No external horizontal overflow').toBe(true);
      if (viewport.width < 1024) {
        const trigger = page.getByRole('button', { name: 'Menú del proyecto', exact: true });
        await trigger.focus(); await page.keyboard.press('Enter');
        const drawer = page.getByRole('dialog', { name: 'Navegación del proyecto' });
        await expect(drawer).toBeVisible();
        await drawer.locator(`a[href="/projects/${ui.projectId}/corpus"]`).focus();
        await page.keyboard.press('Enter');
      } else await page.locator(`a[href="/projects/${ui.projectId}/corpus"]`).filter({ visible: true }).focus().then(() => page.keyboard.press('Enter'));
      await expect(page.getByRole('heading', { name: 'Corpus cualitativo', exact: true })).toBeVisible();
      await assertWorkspaceOperable(page);
      await page.getByRole('link', { name: /^Abrir documento Entrevista/ }).click();
      await expect(page).toHaveURL(new RegExp(`/corpus/${presentationDocumentId}$`));
      await expect(page.getByPlaceholder('Ej. Entrevista P01 sobre prácticas educativas')).toHaveValue('Entrevista sobre memoria comunitaria y redes de cuidado');
      await assertWorkspaceOperable(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }

  test('200 percent root text reflow keeps report navigation operable (not native browser zoom)', async ({ page, ui }) => {
    seedPresentation(ui); await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`/projects/${ui.projectId}/report`);
    await expect(page.getByRole('heading', { name: 'Síntesis del proyecto' })).toBeVisible();
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await assertWorkspaceOperable(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const link = page.locator(`a[href="/projects/${ui.projectId}/corpus"]`).filter({ visible: true });
    await link.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Corpus cualitativo', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nueva transcripción/ }).last()).toBeEnabled();
  });
});
