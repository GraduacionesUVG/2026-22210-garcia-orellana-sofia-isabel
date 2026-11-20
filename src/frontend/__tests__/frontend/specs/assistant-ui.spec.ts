import { test, expect } from '../fixtures';

function stream(parts: Record<string, any>[]) {
  return parts.map(part => `data: ${JSON.stringify(part)}\n\n`).join('') + 'data: [DONE]\n\n';
}
const successful = () => stream([{ type: 'start', messageId: 'assistant-local' }, { type: 'text-start', id: 'text-1' },
  { type: 'text-delta', id: 'text-1', delta: 'Lectura parcial ' }, { type: 'text-delta', id: 'text-1', delta: 'con evidencia ñ 🌿' },
  { type: 'text-end', id: 'text-1' }, { type: 'finish' }]);

test.describe('assistant', () => {
  test('real visual Discutir sends exact context and renders all simulated stream fragments', async ({ page, ui }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    ui.seed({ analysisDashboard: { ...ui.dataset.analysisDashboard, overview: { segments_count: 4, coded_segments_count: 2 } } });
    const path = `/api/projects/${ui.projectId}/analysis/chat`;
    ui.mockApi.route('POST', path, () => ({ status: 200, body: successful(), headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' } }));
    await page.goto(`/projects/${ui.projectId}/analysis`);
    await page.getByRole('button', { name: 'Discutir', exact: true }).first().click();
    await expect(page.getByText(/Ahorita vas a contextualizar/)).toBeVisible();
    await page.getByPlaceholder('Escribe tu interpretación o duda...').fill('¿Qué significa la cobertura?');
    await page.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(page.getByText('Lectura parcial con evidencia ñ 🌿', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Detener', exact: true })).toHaveCount(0);
    const body = ui.requests.find(r => r.method === 'POST' && r.path === path)?.body;
    expect(body.visualContext).toMatchObject({ id: 'evidence-command-center' });
    expect(body.messages.at(-1).parts).toContainEqual({ type: 'text', text: '¿Qué significa la cobertura?' });
    await page.getByRole('button', { name: 'Limpiar chat', exact: true }).click();
    await expect(page.getByText('Lectura parcial con evidencia ñ 🌿', { exact: true })).toHaveCount(0);
    await expect(page.getByPlaceholder('Escribe tu interpretación o duda...')).toBeEnabled();
  });

  test('stop held request restores send without waiting for provider', async ({ page, ui }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    const held = ui.mockApi.barrier(); let started = false;
    ui.mockApi.route('POST', `/api/projects/${ui.projectId}/analysis/chat`, async () => { started = true; await held.wait; return { status: 200, body: successful(), headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' } }; });
    try {
      await page.goto(`/projects/${ui.projectId}/analysis/memos`);
      await page.getByPlaceholder('Escribe tu interpretación o duda...').fill('Pregunta abortada');
      await page.getByRole('button', { name: 'Enviar', exact: true }).click();
      await expect.poll(() => started).toBe(true);
      await page.getByRole('button', { name: 'Detener', exact: true }).click();
      await page.getByPlaceholder('Escribe tu interpretación o duda...').fill('Puedo continuar');
      await expect(page.getByRole('button', { name: 'Enviar', exact: true })).toBeEnabled();
      held.release();
      await expect(page.getByText('Lectura parcial con evidencia ñ 🌿', { exact: true })).toHaveCount(0);
    } finally { held.release(); }
  });

  test('progressive after-header chunks render before completion; Stop aborts, rejects late tail and permits real retry', async ({ page, ui }, testInfo) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    const path = `/api/projects/${ui.projectId}/analysis/chat`;
    await page.addInitScript(({ registeredPath }) => {
      const originalFetch = window.fetch.bind(window);
      const encoder = new TextEncoder();
      const entries: any[] = [];
      const state: any = {
        entries,
        release(index: number, chunk: string) {
          const entry = entries[index];
          if (!entry || entry.closed) { if (entry) entry.dropped++; return false; }
          entry.controller.enqueue(encoder.encode(chunk)); entry.chunks++; return true;
        },
        finish(index: number) {
          const entry = entries[index];
          if (!entry || entry.closed) return false;
          entry.closed = true; entry.completed = true; entry.detach(); entry.controller.close(); return true;
        },
        snapshot() { return entries.map(({ controller, detach, ...entry }) => entry); },
        close() {
          window.fetch = originalFetch;
          for (const entry of entries) {
            entry.detach();
            if (!entry.closed) { entry.closed = true; entry.controller.error(new DOMException('Local fixture cleanup', 'AbortError')); }
          }
        },
      };
      (window as any).__progressiveLocal = state;
      window.fetch = async (input, init) => {
        const requestUrl = input instanceof Request ? input.url : String(input);
        const url = new URL(requestUrl, window.location.href);
        const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
        // Only this registered synthetic project POST is replaced. All other requests
        // remain under the existing default-deny browser routing; no network bypass.
        if (url.origin !== window.location.origin || url.pathname !== registeredPath || url.search || method !== 'POST') return originalFetch(input, init);
        const bodyText = init?.body ?? (input instanceof Request ? await input.clone().text() : '');
        const signal = init?.signal ?? (input instanceof Request ? input.signal : null);
        const entry: any = { url: url.href, method, body: JSON.parse(String(bodyText)), chunks: 0, dropped: 0, aborted: false, cancelled: false, closed: false, completed: false, headersReturned: false };
        const abort = () => {
          entry.aborted = true;
          if (!entry.closed) { entry.closed = true; entry.controller.error(new DOMException('Local synthetic stream aborted', 'AbortError')); }
          entry.detach();
        };
        entry.detach = () => signal?.removeEventListener('abort', abort);
        const responseBody = new ReadableStream<Uint8Array>({
          start(controller) { entry.controller = controller; },
          cancel() { entry.cancelled = true; entry.closed = true; entry.detach(); },
        });
        entries.push(entry);
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) abort();
        const response = new Response(responseBody, { status: 200, headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' } });
        entry.headersReturned = true;
        return response;
      };
    }, { registeredPath: path });
    const release = (index: number, chunk: string) => page.evaluate(({ index, chunk }) => (window as any).__progressiveLocal.release(index, chunk), { index, chunk });
    const frame = (parts: Record<string, any>[]) => parts.map(part => `data: ${JSON.stringify(part)}\n\n`).join('');
    try {
      await page.goto(`/projects/${ui.projectId}/analysis/memos`);
      await page.getByPlaceholder('Escribe tu interpretación o duda...').fill('Pregunta progresiva sintética');
      await page.getByRole('button', { name: 'Enviar', exact: true }).click();
      await expect.poll(() => page.evaluate(() => (window as any).__progressiveLocal.snapshot()[0]?.headersReturned)).toBe(true);
      expect(await release(0, frame([{ type: 'start', messageId: 'after-header-local' }, { type: 'text-start', id: 'progressive-text' }, { type: 'text-delta', id: 'progressive-text', delta: 'Parte progresiva uno ' }]))).toBe(true);
      await expect(page.getByText('Parte progresiva uno', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Detener', exact: true })).toBeVisible();
      expect(await release(0, frame([{ type: 'text-delta', id: 'progressive-text', delta: 'continúa ñ 🌿' }]))).toBe(true);
      await expect(page.getByText('Parte progresiva uno continúa ñ 🌿', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => (window as any).__progressiveLocal.snapshot()[0].completed)).toBe(false);
      await page.getByRole('button', { name: 'Detener', exact: true }).click();
      await expect.poll(() => page.evaluate(() => (window as any).__progressiveLocal.snapshot()[0].aborted)).toBe(true);
      expect(await release(0, frame([{ type: 'text-delta', id: 'progressive-text', delta: ' COLA TARDÍA NO DEBE RESUCITAR' }]))).toBe(false);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.getByText(/COLA TARDÍA NO DEBE RESUCITAR/)).toHaveCount(0);
      await page.getByPlaceholder('Escribe tu interpretación o duda...').fill('Reintento tras aborto');
      await page.getByRole('button', { name: 'Enviar', exact: true }).click();
      await expect.poll(() => page.evaluate(() => (window as any).__progressiveLocal.snapshot().length)).toBe(2);
      expect(await release(1, successful())).toBe(true);
      expect(await page.evaluate(() => (window as any).__progressiveLocal.finish(1))).toBe(true);
      await expect(page.getByText('Lectura parcial con evidencia ñ 🌿', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Detener', exact: true })).toHaveCount(0);
      const entries = await page.evaluate(() => (window as any).__progressiveLocal.snapshot());
      expect(entries.map((entry: any) => ({ method: entry.method, path: new URL(entry.url).pathname }))).toEqual([{ method: 'POST', path }, { method: 'POST', path }]);
      expect(entries[0]).toMatchObject({ chunks: 2, dropped: 1, aborted: true, closed: true, completed: false });
      expect(entries[1]).toMatchObject({ chunks: 1, aborted: false, closed: true, completed: true });
      expect(entries[1].body.messages.at(-1).parts).toContainEqual({ type: 'text', text: 'Reintento tras aborto' });
    } finally {
      await testInfo.attach('local-progressive-stream-lifecycle', { body: JSON.stringify(await page.evaluate(() => (window as any).__progressiveLocal?.snapshot() ?? [])), contentType: 'application/json' });
      await page.evaluate(() => (window as any).__progressiveLocal?.close());
    }
  });

  for (const [status, error] of [[429, 'Límite temporal de solicitudes'], [503, 'Dependencia temporal de IA'], [500, 'No hay un proveedor de IA configurado.']] as const) {
    test(`${status} ${error} is visible and leaves input/send recoverable`, async ({ page, ui }) => {
      await page.setViewportSize({ width: 1600, height: 1100 });
      const path = `/api/projects/${ui.projectId}/analysis/chat`;
      ui.mockApi.route('POST', path, () => ({ status, body: error, headers: { 'content-type': 'text/plain' } }));
      await page.goto(`/projects/${ui.projectId}/analysis/memos`);
      await expect(page.getByText(/Selecciona Discutir/)).toHaveCount(0);
      await page.getByPlaceholder('Escribe tu interpretación o duda...').fill('Consulta local');
      await page.getByRole('button', { name: 'Enviar', exact: true }).click();
      await expect(page.getByText(error, { exact: true })).toBeVisible();
      await page.getByPlaceholder('Escribe tu interpretación o duda...').fill('Reintentar consulta');
      await expect(page.getByRole('button', { name: 'Enviar', exact: true })).toBeEnabled();
      expect(ui.requests.find(r => r.method === 'POST' && r.path === path)?.status).toBe(status);
    });
  }

  test('in-band simulated stream error is shown and does not lock assistant', async ({ page, ui }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    ui.mockApi.route('POST', `/api/projects/${ui.projectId}/analysis/chat`, () => ({ status: 200, body: stream([{ type: 'start', messageId: 'failed-local' }, { type: 'error', errorText: 'Stream local interrumpido' }]), headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' } }));
    await page.goto(`/projects/${ui.projectId}/analysis/insights`);
    await page.getByPlaceholder('Escribe tu interpretación o duda...').fill('Interpretación');
    await page.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(page.getByText('Stream local interrumpido', { exact: true })).toBeVisible();
    await page.getByPlaceholder('Escribe tu interpretación o duda...').fill('Nueva interpretación');
    await expect(page.getByRole('button', { name: 'Enviar', exact: true })).toBeEnabled();
  });
});
