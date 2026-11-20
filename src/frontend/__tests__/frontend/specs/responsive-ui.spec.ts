import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import { seedPresentation, presentationDocumentId } from '../presentation-seed';

const directory = path.resolve('__tests__/reports/frontend/responsive');
const phase = process.env.FRONTEND_RESPONSIVE_PHASE;
const requirePlaywright = createRequire(require.resolve('playwright-core/package.json'));
const { PNG } = requirePlaywright('./lib/utilsBundle.js');
const pixelmatch = requirePlaywright('./lib/third_party/pixelmatch.js');

function desktopDifference(actual: Buffer, expected: Buffer) {
  const a = PNG.sync.read(actual);
  const b = PNG.sync.read(expected);
  if (a.width !== b.width || a.height !== b.height) throw new Error('Desktop image dimensions changed');
  let rawChangedPixels = 0;
  const comparable = Buffer.from(a.data);
  for (let index = 0; index < a.data.length; index += 4) {
    const delta = Math.max(...[0, 1, 2, 3].map(channel => Math.abs(a.data[index + channel] - b.data[index + channel])));
    if (delta) rawChangedPixels++;
    if (delta <= 1) b.data.copy(comparable, index, index, index + 4);
  }
  // Exclude 1/255 per-channel raster noise and detected edge antialiasing
  // (e.g. a rounded progress-bar cap). No image-wide pixel-count allowance;
  // retain all raw differences and reject every other changed pixel.
  const changedPixels = pixelmatch(comparable, b.data, null, a.width, a.height, { threshold: 0, includeAA: false });
  return { changedPixels, rawChangedPixels, rasterNoisePixels: rawChangedPixels - changedPixels };
}
const routes = [
  ['login', '/login', 'Bienvenido'], ['register', '/register', 'Crear cuenta'],
  ['forgot-password', '/forgot-password', 'Recuperar acceso'],
  ['reset-password', '/auth/reset', 'Reestablecer contraseña'],
  ['invitation', '/project-invitations/accept?token=responsive-local-token', 'Bienvenido al equipo'],
  ['dashboard', '/dashboard', 'Panel de Mis Proyectos'], ['profile', '/profile', 'Perfil de Usuario'],
  ['delimitation', '/projects/:id/delimitation', 'Delimitación del proyecto'],
  ['research', '/projects/:id/research-design', 'Diseño de la investigación'],
  ['sample', '/projects/:id/sample-config', 'Configuración de muestra'],
  ['corpus', '/projects/:id/corpus', 'Corpus cualitativo'],
  ['new-document', '/projects/:id/corpus/new', 'Corpus cualitativo'],
  ['document', `/projects/:id/corpus/${presentationDocumentId}`, ''],
  ['segments', '/projects/:id/analysis/segments', 'Segmentos'],
  ['codes', '/projects/:id/analysis/codes', 'Codificación'],
  ['coding', '/projects/:id/analysis/codes?view=coding', 'Codificación'],
  ['explore', '/projects/:id/analysis', 'Explorar'],
  ['memos', '/projects/:id/analysis/memos', 'Memos'],
  ['insights', '/projects/:id/analysis/insights', 'Hallazgos'],
  ['team', '/projects/:id/team', 'Equipo del proyecto'],
  ['report', '/projects/:id/report', 'Reporte'],
] as const;

test.describe('responsive layout and unchanged wide desktop', () => {
  test.setTimeout(120_000);
  for (const [name, route, heading] of routes) {
    test(`${name} reflows below 1024 and preserves wide desktop`, async ({ page, ui }) => {
      seedPresentation(ui);
      ui.mockApi.route('POST', '/api/project-invitations/accept', () => ({ json: { ok: true, invitation: { project_id: ui.projectId } } }));
      ui.mockApi.route('GET', `/api/projects/${ui.projectId}/documents/${presentationDocumentId}/segments`, ({ dataset }) => ({ json: { ok: true, segments: dataset.segments } }));
      await page.clock.setFixedTime(new Date('2026-10-18T15:00:00Z'));
      mkdirSync(directory, { recursive: true });
      const results = [];
      for (const width of [1024, 1280, 1440, 1920, 320, 390, 768, 1023]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route.replace(':id', ui.projectId));
        if (heading) await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
        else await expect(page.getByPlaceholder('Ej. Entrevista P01 sobre prácticas educativas')).toBeVisible();
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        const metrics = await page.evaluate(() => {
          const offenders = Array.from(document.querySelectorAll('button, input, select, textarea, a[href]')).flatMap(node => {
            const bounds = node.getBoundingClientRect();
            if (!bounds.width || !bounds.height || getComputedStyle(node).visibility === 'hidden') return [];
            let ancestor = node.parentElement;
            while (ancestor && ancestor.tagName !== 'MAIN' && ancestor !== document.body) {
              const css = getComputedStyle(ancestor);
              if (['auto', 'scroll'].includes(css.overflowX) && ancestor.scrollWidth > ancestor.clientWidth + 1) return [];
              ancestor = ancestor.parentElement;
            }
            return bounds.left < -1 || bounds.right > innerWidth + 1
              ? [{ label: node.getAttribute('aria-label') || node.getAttribute('placeholder') || node.textContent?.trim().slice(0, 80), left: Math.round(bounds.left), right: Math.round(bounds.right) }]
              : [];
          });
          return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, offenders };
        });
        results.push(metrics);
        if (phase) {
          const image = await page.screenshot({ animations: 'disabled', style: 'nextjs-portal { visibility: hidden !important; }' });
          const filename = `${name}-${width}.png`;
          mkdirSync(path.join(directory, phase), { recursive: true });
          writeFileSync(path.join(directory, phase, filename), image);
          if (phase === 'after' && width >= 1536) {
            const comparison = desktopDifference(image, readFileSync(path.join(directory, 'before', filename)));
            Object.assign(metrics, { desktopComparison: comparison });
            expect.soft(comparison.changedPixels, `${name}: desktop ${width}px changed pixels (1/255 raster noise and detected edge antialiasing excluded)`).toBe(0);
          }
        }
        if (width < 1024) {
          expect.soft(metrics.documentWidth, `${name} ${width}px document overflow`).toBeLessThanOrEqual(width + 1);
          expect.soft(metrics.offenders, `${name} ${width}px clipped controls`).toEqual([]);
          if (name === 'dashboard') {
            await expect.soft(page.getByPlaceholder('Buscar proyectos...')).toBeVisible();
            await expect.soft(page.getByRole('link', { name: 'Mis Proyectos', exact: true })).toBeVisible();
          }
        }
      }
      if (phase) writeFileSync(path.join(directory, `${phase}-${name}.json`), JSON.stringify(results, null, 2));
    });
  }

  test('mobile assistant tools open with keyboard and return focus without duplicating the chat', async ({ page, ui }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto(`/projects/${ui.projectId}/delimitation`);
    const trigger = page.getByRole('button', { name: 'Revisión y Jack AI', exact: true });
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Herramientas del proyecto' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cerrar herramientas' }).focus();
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true);
    await page.getByRole('tab', { name: 'Jack AI', exact: true }).click();
    await expect(dialog.getByRole('textbox').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('main')).not.toHaveAttribute('inert');
    await trigger.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('main')).not.toHaveAttribute('inert');
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  test('mobile navigation keeps search, project views and profile reachable', async ({ page, ui }) => {
    seedPresentation(ui);
    await page.setViewportSize({ width: 390, height: 600 });
    await page.goto('/dashboard');
    const search = page.getByPlaceholder('Buscar proyectos...');
    await expect(search).toBeVisible();
    await search.fill('NO_COINCIDE');
    await expect(page.getByText('No hay proyectos que coincidan con tu búsqueda.')).toBeVisible();
    await page.getByRole('link', { name: 'Compartidos', exact: true }).click();
    await expect(page).toHaveURL(/view=shared/);
    await page.getByRole('link', { name: /Perfil$/ }).click();
    await expect(page.getByRole('heading', { name: 'Perfil de Usuario' })).toBeVisible();
  });

  test('mobile narrow field labels retain a readable line length', async ({ page, ui }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(`/projects/${ui.projectId}/delimitation`);
    const label = page.locator('label').filter({ hasText: '1. Tema de Investigación' });
    await expect(label).toBeVisible();
    const bounds = await label.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(120);
    expect(bounds?.height).toBeLessThanOrEqual(60);
  });

  test('mobile project dialog can reach its actions at a keyboard-sized viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 420 });
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /Nuevo Proyecto/ }).click();
    const submit = page.locator('form button[type="submit"]');
    await submit.scrollIntoViewIfNeeded();
    const bounds = await submit.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(420);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
  });

  test('mobile populated comparison scrolls locally without losing full participant labels', async ({ page, ui }) => {
    const groups = Array.from({ length: 6 }, (_, i) => ({ key: `participant-${i}`, label: `Participante ${i} con nombre extenso María José 🌿` }));
    ui.seed({ analysisDashboard: { ok: true, overview: { segments_count: 12, coded_segments_count: 12 }, codes: [{ id: 'code-1', name: 'Cuidado' }], stats: [], relationships: [], documentPatterns: { documents: [], patterns: [] }, groupComparisons: { attribute: 'participant', groups, rows: [{ code_id: 'code-1', code_name: 'Cuidado', counts: Object.fromEntries(groups.map(group => [group.key, 2])) }] }, uncodedSegments: [], insights: [] } });
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(`/projects/${ui.projectId}/analysis`);
    await page.getByRole('button', { name: /3\. Relaciones/ }).click();
    const last = page.getByLabel(`Participante o grupo: ${groups.at(-1)!.label}`, { exact: true });
    await expect(last).toHaveAttribute('title', groups.at(-1)!.label);
    const matrix = last.locator('xpath=../..');
    expect(await matrix.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true);
    await last.scrollIntoViewIfNeeded();
    expect(await matrix.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });

  test('mobile invited teammate sees readable owner identity without management permissions or UUID fallback', async ({ page, ui }) => {
    const owner = ui.dataset.team.members[0];
    ui.seed({ identity: { ...ui.identity, role: 'editor' }, team: { ...ui.dataset.team, members: [{ ...owner, full_name: null, email: null, username: null }], currentRole: 'editor' } });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/projects/${ui.projectId}/team`);
    await expect(page.getByText('Propietario del proyecto', { exact: true })).toBeVisible();
    await expect(page.getByText(owner.user_id, { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Crear invitación', exact: true })).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: 'Permiso de Propietario del proyecto' })).toBeDisabled();
  });
});

// Unlike the mobile checks, inspect the independently scrolling workspace too:
// a fixed shell can hide overflow while documentElement still fits the viewport.
async function laptopOverflow(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector('main')!;
    const boundary = main.getBoundingClientRect();
    const offenders = Array.from(main.querySelectorAll('section, article, button, input, select, textarea, svg[role="img"]')).flatMap(node => {
      const bounds = node.getBoundingClientRect();
      if (!bounds.width || !bounds.height || getComputedStyle(node).visibility === 'hidden') return [];
      let parent = node.parentElement;
      while (parent && parent !== main) {
        const css = getComputedStyle(parent);
        if (['auto', 'scroll'].includes(css.overflowX) && parent.scrollWidth > parent.clientWidth + 1) return [];
        parent = parent.parentElement;
      }
      return bounds.left < boundary.left - 1 || bounds.right > boundary.right + 1
        ? [{ element: node.tagName, label: node.getAttribute('aria-label') || node.textContent?.trim().slice(0, 90), left: Math.round(bounds.left), right: Math.round(bounds.right) }]
        : [];
    });
    const wideContainers = Array.from(main.querySelectorAll('div, section')).filter(node => node.scrollWidth > node.clientWidth + 2 && !['auto', 'scroll'].includes(getComputedStyle(node).overflowX)).slice(0, 8).map(node => ({ className: node.className, width: node.clientWidth, scrollWidth: node.scrollWidth }));
    return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, mainWidth: main.clientWidth, mainScrollWidth: main.scrollWidth, authDecoration: main.classList.contains('responsive-auth'), wideContainers, offenders };
  });
}

function seedLaptopAnalysis(ui: Parameters<typeof seedPresentation>[0]) {
  seedPresentation(ui);
  const codes = [
    { id: 'laptop-code-1', name: 'Aprendizaje apoyado por familia', color: '#0f766e' },
    { id: 'laptop-code-2', name: 'Confianza progresiva', color: '#2563eb' },
  ];
  const documents = Array.from({ length: 3 }, (_, index) => ({ id: `laptop-document-${index}`, title: `Entrevista ${index + 1}: aprendizaje digital y apoyo familiar`, document_type: 'interview' }));
  const patterns = codes.map(code => ({ code_id: code.id, document_count: 3, total_segments: 9, quote_count: 9, documents: documents.map(document => ({ document_id: document.id, document_title: document.title, document_type: document.document_type, segments: Array.from({ length: 3 }, (_, index) => ({ segment_id: `${code.id}-${document.id}-${index}`, selected_text: 'Al principio me daba pena preguntar porque sentía que todos sabían más que yo, pero mi hermana me fue enseñando paso a paso.', code_names: [code.name, 'Autonomía negociada'], is_quote: true })) })) }));
  ui.seed({ analysisDashboard: { ok: true, overview: { segments_count: 19, coded_segments_count: 19, memos_count: 5, documents_count: 3 }, codes, stats: codes.map(code => ({ code_id: code.id, code_name: code.name, segment_count: 9 })), relationships: [], documentPatterns: { documents, patterns }, groupComparisons: { attribute: 'participant', groups: [], rows: [] }, uncodedSegments: [], insights: [] } });
}

test.describe('small laptop overflow regressions', () => {
  test.setTimeout(150_000);
  for (const width of [1024, 1280, 1366, 1440, 1920]) {
    test(`laptop ${width}px populated exploration keeps charts and quotes reachable`, { tag: '@crossbrowser-layout' }, async ({ page, ui }, testInfo) => {
      seedLaptopAnalysis(ui);
      await page.clock.setFixedTime(new Date('2026-10-22T15:00:00Z'));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/projects/${ui.projectId}/analysis`);
      await expect(page.getByRole('heading', { name: 'Explorar', exact: true })).toBeVisible();
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      const flow = page.getByRole('img', { name: 'Flujo de evidencia hacia memos', exact: true });
      await flow.scrollIntoViewIfNeeded();
      // Scrolling is allowed only if deliberate and operable, never hidden clipping.
      const flowAccess = await flow.evaluate(node => {
        const parent = node.parentElement!;
        return { clipped: node.getBoundingClientRect().right > parent.getBoundingClientRect().right + 1, scrollable: ['auto', 'scroll'].includes(getComputedStyle(parent).overflowX) };
      });
      expect.soft(!flowAccess.clipped || flowAccess.scrollable, 'The final memo stage must not be clipped').toBe(true);
      const flowRegion = flow.locator('..');
      if (await flowRegion.evaluate(node => node.scrollWidth > node.clientWidth + 1)) {
        await flowRegion.focus();
        await page.keyboard.press('End');
        await expect.poll(() => flowRegion.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
      }
      for (const title of [/1\. Evidencia/, /2\. Patrones/, /3\. Relaciones/, /4\. Memos/]) {
        await page.getByRole('button', { name: title }).click();
        const metrics = await laptopOverflow(page);
        expect.soft(metrics.mainScrollWidth, `${width}px workspace overflow in ${title}`).toBeLessThanOrEqual(metrics.mainWidth + 1);
        expect.soft(metrics.offenders, `${width}px content escaping the workspace in ${title}`).toEqual([]);
        if (phase && width === 1920) {
          const image = await page.screenshot({ animations: 'disabled', style: 'nextjs-portal { visibility: hidden !important; }' });
          const filename = path.join(directory, `laptop-wide-${title.source.match(/[1-4]/)![0]}.png`);
          if (phase === 'before') writeFileSync(filename, image);
          else expect.soft(desktopDifference(image, readFileSync(filename)).changedPixels, 'Wide desktop appearance unchanged').toBe(0);
        }
        if (String(title).includes('Patrones')) {
          const quotes = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Citas y segmentos por documento', exact: true }) });
          const article = quotes.locator('article').first();
          await article.scrollIntoViewIfNeeded();
          expect.soft(await article.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'Quote content must fit its document card').toBe(true);
          mkdirSync(directory, { recursive: true });
          await testInfo.attach(`laptop-quotes-${width}`, { body: await page.screenshot({ path: path.join(directory, `laptop-quotes-${width}.png`), animations: 'disabled' }), contentType: 'image/png' });
        }
      }
    });
  }

  for (const [name, route, heading] of routes) {
    test(`laptop audit ${name} retains content and controls inside its workspace`, async ({ page, ui }) => {
      seedLaptopAnalysis(ui);
      ui.mockApi.route('POST', '/api/project-invitations/accept', () => ({ json: { ok: true, invitation: { project_id: ui.projectId } } }));
      ui.mockApi.route('GET', `/api/projects/${ui.projectId}/documents/${presentationDocumentId}/segments`, ({ dataset }) => ({ json: { ok: true, segments: dataset.segments } }));
      for (const width of [1024, 1280, 1366, 1440]) {
        await page.setViewportSize({ width, height: 768 });
        await page.goto(route.replace(':id', ui.projectId));
        if (heading) await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
        else await expect(page.getByPlaceholder('Ej. Entrevista P01 sobre prácticas educativas')).toBeVisible();
        await page.waitForLoadState('networkidle');
        if (await page.locator('main').count()) {
          const metrics = await laptopOverflow(page);
          expect.soft(metrics.documentWidth, `${name} ${width}px document overflow`).toBeLessThanOrEqual(width + 1);
          // Auth backgrounds intentionally bleed outside the viewport and are clipped;
          // their actual cards/controls are still checked by offenders above.
          if (!metrics.authDecoration) expect.soft(metrics.mainScrollWidth, `${name} ${width}px workspace overflow ${JSON.stringify(metrics.wideContainers)}`).toBeLessThanOrEqual(metrics.mainWidth + 1);
          expect.soft(metrics.offenders, `${name} ${width}px inaccessible content`).toEqual([]);
        } else {
          expect.soft(await page.evaluate(() => document.documentElement.scrollWidth), `${name} ${width}px overflow`).toBeLessThanOrEqual(width + 1);
        }
      }
    });
  }
});
