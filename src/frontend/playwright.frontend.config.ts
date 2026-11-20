import { defineConfig } from '@playwright/test';
import { assertFrontendEnvironment } from './__tests__/frontend/environment';
const environment = assertFrontendEnvironment(process.env);
const { localTlsOrigin } = require('./__tests__/frontend/local-tls-transport.cjs');
const webkitBaseURL = localTlsOrigin(environment.baseURL);
const tlsEnabled = process.env.FRONTEND_LOCAL_TLS === '1';
export default defineConfig({
  testDir: '__tests__',
  testMatch: ['frontend/specs/**/*.spec.ts', 'e2e/auth-ui.spec.ts'],
  testIgnore: ['**/backend/**', '**/integration/**', '**/unit/**', '**/frontend/live/**'],
  fullyParallel: false, workers: 1, retries: 0, timeout: 30_000,
  updateSnapshots: 'none',
  expect: { timeout: 8000 },
  outputDir: '__tests__/reports/frontend/test-results',
  reporter: [['list'], ['./__tests__/frontend/safe-playwright-json.cjs', { outputFile: process.env.FRONTEND_RESULT_FILE ?? '__tests__/reports/frontend/playwright-results.json' }]],
  use: { baseURL: environment.baseURL, serviceWorkers: 'block', screenshot: 'only-on-failure', trace: 'off', video: 'off' },
  projects: [
    { name: 'frontend-mocked', use: { browserName: 'chromium' } },
    { name:'frontend-firefox-smoke', use:{ browserName:'firefox' }, grep:/@crossbrowser-(smoke|layout|download)/ },
    { name:'frontend-webkit-smoke', use:{ browserName:'webkit', baseURL:webkitBaseURL, ignoreHTTPSErrors:true }, grep:/@crossbrowser-(smoke|layout|download)/ },
  ],
  webServer: { command: 'node scripts/frontend-start-server.cjs', url: `${tlsEnabled?webkitBaseURL:environment.baseURL}/login`, ignoreHTTPSErrors:tlsEnabled, reuseExistingServer: false, timeout: 120_000, gracefulShutdown: { signal: 'SIGTERM', timeout: 6000 } },
});
