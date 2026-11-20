import { expect, type BrowserContext, type Page } from '@playwright/test';

/** Hydrated fixed-shell invariants; callers separately assert route-specific content. */
export async function assertWorkspaceOperable(page: Page): Promise<void> {
  const main = page.getByRole('main');
  await expect(main).toBeVisible();
  await expect(main.getByRole('heading').first()).toBeVisible();
  await expect(page.locator('#project-workspace-drawer')).toHaveCount(0);
  await expect.poll(() => main.evaluate(node => Boolean(node.closest('[inert]')))).toBe(false);
  await expect.poll(() => page.evaluate(() => {
    const shell = document.scrollingElement!;
    return shell.scrollHeight <= shell.clientHeight + 1;
  })).toBe(true);
  await expect.poll(() => main.evaluate(node => {
    const element = node as HTMLElement;
    return element.clientHeight > 0 && ['auto', 'scroll'].includes(getComputedStyle(element).overflowY);
  })).toBe(true);
}

export async function assertMainScrollBoundary(page: Page): Promise<void> {
  const main = page.getByRole('main');
  await expect.poll(() => main.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
  // Aim at main padding, not an independently scrollable textarea at its center.
  await main.hover({ position: { x: 8, y: 8 } });
  await page.mouse.wheel(0, 20_000);
  await expect.poll(() => main.evaluate(node => Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop))).toBeLessThanOrEqual(2);
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0);
  await main.getByRole('textbox').first().focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Control+End');
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0);
}

let monitorSerial = 0;
function installRuntimeBridge(bindingName: string) {
  const monitored = window as Window & {
    __frontendUnhandledRejections?: string[];
    __frontendMonitorLastDelivery?: Promise<unknown>;
  } & Record<string, unknown>;
  const installed = `${bindingName}_installed`;
  if (monitored[installed]) return;
  monitored[installed] = true;
  monitored.__frontendUnhandledRejections ??= [];
  const deliver = (channel: 'error' | 'rejection', message: string) => {
    // A disappearing frame may reject binding delivery. Handle it locally;
    // never let monitor delivery recursively produce unhandledrejection events.
    try {
      const binding = monitored[bindingName];
      if (typeof binding !== 'function') return;
      const delivery = Promise.resolve(binding(channel, message));
      monitored.__frontendMonitorLastDelivery = Promise.all([monitored.__frontendMonitorLastDelivery, delivery]).catch(() => undefined);
    } catch { /* The owning document/context is already disappearing. */ }
  };
  window.addEventListener('error', event => {
    if (event instanceof ErrorEvent) deliver('error', event.message || 'Uncaught JavaScript error');
  });
  window.addEventListener('unhandledrejection', event => {
    let message: string;
    try { message = String(event.reason?.message ?? event.reason); } catch { message = 'Unreadable unhandled rejection'; }
    monitored.__frontendUnhandledRejections!.push(message);
    deliver('rejection', message);
  });
}

async function createRuntimeMonitor(target: Page | BrowserContext) {
  const pageErrors: string[] = [], windowErrors: string[] = [], unhandledRejections: string[] = [], networkDiagnostics: string[] = [];
  const bindingName = `__frontendRuntimeMonitor_${++monitorSerial}`;
  let active = true;
  const pages = new Map<Page, (error: Error) => void>();
  const attachPage = (page: Page) => {
    if (pages.has(page)) return;
    const webkit = page.context().browser()?.browserType().name() === 'webkit';
    const onError = (error: Error) => {
      if (!active) return;
      // Playwright forwards WebKit's native fetch/CORS console diagnostics as
      // pageerror even when fetch is caught (or the old document is unloading).
      // Retain those diagnostics separately, not as JavaScript exceptions.
      // Real errors with identical text still fail via the independent DOM
      // ErrorEvent bridge; uncaught fetches fail via unhandledrejection.
      // Without a JS stack, Playwright splits the URL's colon into error.name
      // and drops its first slash from error.message.
      const nativeFetchDiagnostic = webkit && (
        /^Fetch API cannot load https?:\/\/\S+ due to access control checks\.(?:\n|$)/.test(error.stack ?? '') ||
        (!error.stack && /^Fetch API cannot load https?$/.test(error.name) && /^\/\S+ due to access control checks\.$/.test(error.message))
      );
      (nativeFetchDiagnostic ? networkDiagnostics : pageErrors).push(error.message);
    };
    pages.set(page, onError);
    page.on('pageerror', onError);
  };
  const isContext = 'pages' in target;
  if (isContext) {
    target.on('page', attachPage);
    target.pages().forEach(attachPage);
  } else attachPage(target);
  await target.exposeBinding(bindingName, (_source, channel: unknown, message: unknown) => {
    if (active) (channel === 'error' ? windowErrors : unhandledRejections).push(String(message));
  });
  await target.addInitScript(installRuntimeBridge, bindingName);
  for (const page of pages.keys()) {
    if (page.isClosed()) continue;
    try { await page.evaluate(installRuntimeBridge, bindingName); }
    catch (error) { if (!page.isClosed()) throw error; }
  }
  return {
    pageErrors, windowErrors, unhandledRejections, networkDiagnostics,
    async assertClean() {
      for (const page of pages.keys()) {
        if (!page.isClosed()) await page.evaluate(() => (window as Window & { __frontendMonitorLastDelivery?: Promise<unknown> }).__frontendMonitorLastDelivery);
      }
      expect(pageErrors, 'Uncaught page errors').toEqual([]);
      expect(windowErrors, 'Uncaught DOM JavaScript errors (retained in Node)').toEqual([]);
      expect(unhandledRejections, 'Unhandled promise rejections (retained in Node)').toEqual([]);
    },
    dispose() {
      active = false;
      if (isContext) target.off('page', attachPage);
      for (const [page, onError] of pages) page.off('pageerror', onError);
      pages.clear();
      // Playwright bindings/init scripts live until their owning context closes;
      // inactive callbacks cannot append errors after this monitor is disposed.
    },
  };
}

/** Expected HTTP/network rejections are not uncaught runtime errors. */
export async function attachRuntimeErrorMonitor(page: Page) { return createRuntimeMonitor(page); }

/** Register before navigation: context init scripts cover existing and future popup documents. */
export async function attachContextRuntimeErrorMonitor(context: BrowserContext) { return createRuntimeMonitor(context); }
