import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { test, expect } from '../fixtures';
import { seedPresentation, presentationDocumentId } from '../presentation-seed';
import { assertVisualApproval } from '../visual-approval';

// A human approves these synthetic screens; raster baselines are platform-specific.
const surfaces = [
  ['dashboard', '/dashboard', 'Panel de Mis Proyectos'],
  ['document', '/corpus/:document', 'Editar documento'],
  ['queue', '/analysis/codes?view=coding', 'Codificación'],
  ['codebook', '/analysis/codes', 'Codificación'],
  ['memos', '/analysis/memos', 'Memos'],
  ['insights', '/analysis/insights', 'Hallazgos'],
  ['report', '/report', 'Reporte'],
] as const;

test.describe('visual approval required', () => {
  for (const [name, suffix] of surfaces) {
    test(`${name} deterministic candidate only passes an explicitly approved baseline`, async ({ page, ui }, testInfo) => {
      if(testInfo.config.updateSnapshots!=='none')throw new Error('BASELINE_APPROVAL_REQUIRED: runtime snapshot updates are forbidden');
      seedPresentation(ui); await page.setViewportSize({ width: 1440, height: 900 });
      await page.clock.setFixedTime(new Date('2026-10-04T12:00:00Z'));
      const url = name === 'dashboard' ? suffix : `/projects/${ui.projectId}${suffix.replace(':document', presentationDocumentId)}`;
      await page.goto(url);
      if (name === 'dashboard') await expect(page.getByText('E2E_PRESENTACION_LOCAL', { exact: true })).toBeVisible();
      else if (name === 'document') await expect(page.getByPlaceholder('Ej. Entrevista P01 sobre prácticas educativas')).toHaveValue('Entrevista sobre memoria comunitaria y redes de cuidado');
      else if (name === 'queue') await expect(page.getByRole('list', { name: 'Segmentos disponibles' }).getByRole('listitem').first()).toBeVisible();
      else if (name === 'codebook') await expect(page.getByRole('button', { name: 'Crear código', exact: true })).toBeVisible();
      else if (name === 'memos') await expect(page.getByRole('heading', { name: 'Memoria compartida como cuidado cotidiano', exact: true })).toBeVisible();
      else if (name === 'insights') await expect(page.getByText('El cuidado sostiene la transmisión de memoria', { exact: true }).first()).toBeVisible();
      else await expect(page.getByRole('heading', { name: 'Síntesis del proyecto' })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' });
      const candidate = await page.screenshot({ animations: 'disabled', fullPage: false });
      await testInfo.attach(`visual-${name}-candidate.png`, { body: candidate, contentType: 'image/png' });
      const approvalFile = path.resolve('__tests__/frontend/visual-approvals.json');
      if (!existsSync(approvalFile)) throw new Error('BASELINE_APPROVAL_REQUIRED: candidate is synthetic; human approval absent. Font CSS uses local surrogate, not production font fidelity.');
      const approvals = JSON.parse(readFileSync(approvalFile, 'utf8'));
      const baseline = testInfo.snapshotPath(`${name}.png`);
      const approvalSet = approvals[`${testInfo.project.name}:${name}`];
      const approval = approvalSet?.platforms?.[process.platform];
      if (!approvalSet?.approvedBy || !approvalSet?.approvedAt || !approval?.sha256 || !existsSync(baseline)) throw new Error(`BASELINE_APPROVAL_REQUIRED: ${name}/${process.platform}`);
      const digest = createHash('sha256').update(readFileSync(baseline)).digest('hex');
      assertVisualApproval({updateSnapshots:testInfo.config.updateSnapshots,expectedDigest:approval.sha256,beforeDigest:digest,afterDigest:digest});
      await expect(page).toHaveScreenshot(`${name}.png`, { animations: 'disabled', maxDiffPixelRatio: 0.001 });
      const afterDigest=createHash('sha256').update(readFileSync(baseline)).digest('hex');
      assertVisualApproval({updateSnapshots:testInfo.config.updateSnapshots,expectedDigest:approval.sha256,beforeDigest:digest,afterDigest});
    });
  }
});
