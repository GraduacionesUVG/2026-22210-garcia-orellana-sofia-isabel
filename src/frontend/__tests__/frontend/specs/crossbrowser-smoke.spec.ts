import { test, expect } from '../fixtures';
test('critical cross-browser navigation smoke', { tag: ['@crossbrowser-smoke','@critical-smoke'] }, async ({ page, ui }) => {
  await page.goto(`/projects/${ui.projectId}/delimitation`);
  await expect(page.getByRole('heading', { name: 'Delimitación del proyecto', exact:true })).toBeVisible();
  await ui.recordAction({ controlId:'navigation.workspace.corpus', roles:['owner'], states:['success'], backendActionIds:[],
    interaction:{ description:'Keyboard Enter on the current project Corpus link', execute:async () => { const link=page.locator(`a[href="/projects/${ui.projectId}/corpus"]`).filter({visible:true}); await link.focus(); await page.keyboard.press('Enter'); } },
    visible:{ description:'Current project corpus URL and heading', execute:async () => { await expect(page).toHaveURL(new RegExp(`/projects/${ui.projectId}/corpus$`)); await expect(page.getByRole('heading',{name:'Corpus cualitativo',exact:true})).toBeVisible(); } },
  });
});
