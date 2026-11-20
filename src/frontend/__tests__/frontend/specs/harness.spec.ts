import { test, expect } from '../fixtures';
test('frontend-harness renders seeded dashboard and denies unexpected requests', async ({ page, ui }) => {
  await page.goto('/dashboard');
  await expect(page.getByText(`E2E_${ui.fixtureId}`, { exact: true })).toBeVisible();
  const status = await page.evaluate(async () => (await fetch('/api/unexpected-frontend-harness')).status);
  expect(status).toBe(501);
  expect(ui.requests.filter(request => request.path === '/api/unexpected-frontend-harness')).toEqual([expect.objectContaining({ method: 'GET', status: 501, handled: false })]);
  await expect(async () => ui.mockApi.assertNoUnexpectedRequests()).rejects.toThrow('unexpected-frontend-harness');
  // Explicit negative probe remains in the observable log; all other requests stay audited.
  ui.mockApi.expectDeniedRequest('GET', '/api/unexpected-frontend-harness');
});
