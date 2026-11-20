import { test, expect, type Page } from '@playwright/test';
import { attachContextRuntimeErrorMonitor, attachRuntimeErrorMonitor } from '../browser-assertions';

async function rejectAndAcknowledge(page: Page, marker: string) {
  await page.evaluate(value => {
    // Browser pageerror alone must not mask loss of the rejection channel.
    window.addEventListener('unhandledrejection', event => event.preventDefault(), { once: true });
    void Promise.reject(new Error(value));
  }, marker);
  await expect.poll(() => page.evaluate(() => (window as Window & { __frontendUnhandledRejections?: string[] }).__frontendUnhandledRejections?.length ?? 0)).toBe(1);
  // Binding delivery resolves only after the Node-side monitor has retained the event.
  await page.evaluate(() => (window as Window & { __frontendMonitorLastDelivery?: Promise<unknown> }).__frontendMonitorLastDelivery ?? Promise.resolve());
}

test.describe('runtime monitor infrastructure on isolated blank pages', () => {
  test('caught cross-origin fetch failure is not an uncaught runtime error @crossbrowser-smoke', async ({ page, context, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const deniedUrl = `${origin.replace('127.0.0.1', 'localhost')}/__qa_denied_fetch`;
    await context.route(`${origin}/__qa_runtime_monitor`, route => route.fulfill({ contentType: 'text/html', body: '<title>Runtime monitor</title>' }));
    await context.route(deniedUrl, route => route.fulfill({ status: 403, headers: { 'access-control-allow-origin': 'https://not-the-request-origin.invalid' }, body: 'Expected CORS denial' }));
    await page.goto(`${origin}/__qa_runtime_monitor`);
    const monitor = await attachRuntimeErrorMonitor(page);
    try {
      const result = await page.evaluate(async url => {
        try { await fetch(url); return 'unexpected success'; }
        catch { return 'handled fetch failure'; }
      }, deniedUrl);
      expect(result).toBe('handled fetch failure');
      await monitor.assertClean();
    } finally { monitor.dispose(); }
  });

  for (const diagnosticShape of ['stack', 'split-url'] as const) {
  test(`native-looking ${diagnosticShape} network text cannot hide a thrown JavaScript error @crossbrowser-smoke`, async ({ page, baseURL }) => {
    const monitor = await attachRuntimeErrorMonitor(page);
    const message = `Fetch API cannot load ${baseURL}/__qa_denied_fetch due to access control checks.`;
    try {
      const errorDelivered = page.waitForEvent('pageerror');
      await page.evaluate(({ value, shape }) => {
        setTimeout(() => {
          const error = new Error(value);
          if (shape === 'stack') error.stack = value;
          else {
            const colon = value.indexOf(':');
            error.name = value.slice(0, colon);
            error.message = value.slice(colon + 2);
            error.stack = '';
          }
          throw error;
        }, 0);
      }, { value: message, shape: diagnosticShape });
      await errorDelivered;
      await expect(monitor.assertClean()).rejects.toThrow(/access control checks/);
    } finally { monitor.dispose(); }
  });
  }

  test('uncaught fetch rejection still fails even with native network diagnostics @crossbrowser-smoke', async ({ page, context, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const deniedUrl = `${origin.replace('127.0.0.1', 'localhost')}/__qa_uncaught_fetch`;
    await context.route(`${origin}/__qa_runtime_monitor`, route => route.fulfill({ contentType: 'text/html', body: '<title>Runtime monitor</title>' }));
    await context.route(deniedUrl, route => route.fulfill({ status: 403, headers: { 'access-control-allow-origin': 'https://not-the-request-origin.invalid' }, body: 'Expected CORS denial' }));
    await page.goto(`${origin}/__qa_runtime_monitor`);
    const monitor = await attachRuntimeErrorMonitor(page);
    try {
      await page.evaluate(url => { void fetch(url); }, deniedUrl);
      await expect.poll(() => monitor.unhandledRejections.length).toBe(1);
      await expect(monitor.assertClean()).rejects.toThrow();
    } finally { monitor.dispose(); }
  });

  test('page monitor retains acknowledged rejection after document navigation', async ({ page }) => {
    const monitor = await attachRuntimeErrorMonitor(page);
    try {
      await monitor.assertClean();
      await rejectAndAcknowledge(page, 'monitor-before-navigation');
      await page.reload();
      await expect(monitor.assertClean()).rejects.toThrow(/monitor-before-navigation/);
    } finally { monitor.dispose(); }
  });

  test('context monitor retains acknowledged future-popup rejection after popup closes', async ({ page, context }) => {
    const monitor = await attachContextRuntimeErrorMonitor(context);
    try {
      await monitor.assertClean();
      const opened = page.waitForEvent('popup');
      await page.evaluate(() => { window.open('about:blank'); });
      const popup = await opened;
      await rejectAndAcknowledge(popup, 'monitor-closed-popup');
      await popup.close();
      await expect(monitor.assertClean()).rejects.toThrow(/monitor-closed-popup/);
    } finally { await monitor.dispose(); }
  });

  test('context monitor captures page errors in existing and future pages and stops collecting on disposal', async ({ page, context }) => {
    const monitor = await attachContextRuntimeErrorMonitor(context);
    try {
      await page.evaluate(() => { setTimeout(() => { throw new Error('monitor-existing-page-error'); }, 0); });
      await expect.poll(() => monitor.pageErrors).toEqual(['monitor-existing-page-error']);
      const opened = page.waitForEvent('popup');
      await page.evaluate(() => { window.open('about:blank'); });
      const popup = await opened;
      await popup.evaluate(() => { setTimeout(() => { throw new Error('monitor-future-page-error'); }, 0); });
      await expect.poll(() => monitor.pageErrors).toEqual(['monitor-existing-page-error', 'monitor-future-page-error']);
      await popup.close();
      await expect(monitor.assertClean()).rejects.toThrow(/monitor-future-page-error/);
      monitor.dispose();
      const ignored = page.waitForEvent('pageerror');
      await page.evaluate(() => { setTimeout(() => { throw new Error('monitor-disposed-error'); }, 0); });
      await ignored;
      await rejectAndAcknowledge(page, 'monitor-disposed-rejection');
      expect(monitor.pageErrors).toEqual(['monitor-existing-page-error', 'monitor-future-page-error']);
      expect(monitor.unhandledRejections).toEqual([]);
    } finally { monitor.dispose(); }
  });
});
