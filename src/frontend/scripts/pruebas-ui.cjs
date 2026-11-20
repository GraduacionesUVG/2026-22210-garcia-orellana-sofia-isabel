const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { collectFrontendIdentity } = require('../__tests__/frontend/source-identity.cjs');
if (require('node:fs').existsSync('.env.local')) process.loadEnvFile('.env.local');
const run = collectFrontendIdentity(process.cwd(), randomUUID());
const result = spawnSync(process.execPath, [
  require.resolve('@playwright/test/cli'), 'test', '--config=playwright.frontend.config.ts', ...process.argv.slice(2),
], {
  stdio: 'inherit',
  env: { ...process.env, FRONTEND_RUN_ID: run.runId, FRONTEND_EXPECTED_COMMIT: run.commit,
    FRONTEND_SOURCE_DIGEST: run.sourceDigest, FRONTEND_TEST_MODE: 'mocked',
    FRONTEND_SERVER_MODE: 'production', FRONTEND_LOCAL_TLS: '1', NEXT_TELEMETRY_DISABLED: '1' },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
