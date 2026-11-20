import { validateUiControlCoverage, validateUiActionEvidence, type UiActionEvidence } from '../frontend/control-coverage';
import { discoverUiControls } from '../frontend/control-discovery';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const contract = { id: 'project.create', route: '/dashboard', source: 'features/projects/components/CreateProjectModal.jsx', roles: ['owner'], states: ['success'], backendActionIds: ['projects.modal-create'], persistence: 'live', disposition: 'improve' };
const evidence = { controlId: 'project.create', mode: 'live', interacted: true, passed: true, states: ['success'], roles: ['owner'], backendActionIds: ['projects.modal-create'], persistenceVerified: true };
describe('frontend coverage honesty', () => {
  test('the frontend runner discovers auth resilience and excludes the live dashboard journey', () => {
    const root = path.resolve(__dirname, '../..');
    const env: NodeJS.ProcessEnv = { ...process.env, FRONTEND_TEST_MODE: 'mocked', FRONTEND_BASE_URL: 'http://127.0.0.1:4317' };
    delete env.JEST_WORKER_ID;
    const list = (config: string) => JSON.parse(execFileSync(process.execPath, [
      require.resolve('@playwright/test/cli'), 'test', `--config=${config}`,
      '--list', '--reporter=json', 'e2e/(auth|dashboard)-ui.spec.ts',
    ], { cwd: root, encoding: 'utf8', env }));
    const frontend = list('playwright.frontend.config.ts');
    expect(frontend.errors).toEqual([]);
    expect(frontend.suites.map((suite: { file: string }) => suite.file)).toEqual(['e2e/auth-ui.spec.ts']);
  }, 15000);
  test('unknown_control_blocks_gate', () => { expect(validateUiControlCoverage([contract], [{ ...evidence, controlId: 'unknown' }]).issues).not.toEqual([]); });
  test('mock_is_not_live_persistence', () => { expect(validateUiControlCoverage([contract], [{ ...evidence, mode: 'mocked' }]).issues).not.toEqual([]); });
  test('disabled_control_is_not_passing_coverage', () => { expect(validateUiControlCoverage([contract], [{ ...evidence, interacted: false }]).issues).not.toEqual([]); });
  test('valid live evidence covers the declared control', () => { expect(validateUiControlCoverage([contract], [evidence])).toEqual({ issues: [], uncovered: [] }); });
  test('unobserved roles and states remain uncovered', () => { expect(validateUiControlCoverage([{ ...contract, roles: ['owner', 'viewer'] }], [evidence]).uncovered).toContain('project.create'); });
  test('mixed run identities block an evidence gate', () => {
    const proof: UiActionEvidence = { controlId: 'project.create', testId: 'browser-create', runId: 'run-a', commit: 'immutable-diff-a', mode: 'live', outcome: 'passed', interaction: 'click submit', visibleAssertion: 'created card', requestAssertion: 'POST exact payload', readbackAssertion: 'GET and reload match', cleanup: 'passed', states: ['success'], roles: ['owner'], backendActionIds: ['projects.modal-create'] };
    expect(validateUiActionEvidence([contract], [proof,{ ...proof, runId: 'run-b' }]).issues).not.toEqual([]);
  });
  test('discovery includes app components and feature controls, including dynamic names', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'frontend-discovery-'));
    try {
      for (const folder of ['app','components','features']) { mkdirSync(path.join(root, folder)); writeFileSync(path.join(root, folder, 'ui.jsx'), '<div><button aria-label="Guardar">Save</button><input/><Link href={href}>{title}</Link></div>'); }
      const result = discoverUiControls(root);
      expect(result).toHaveLength(9);
      expect(result.filter(control => control.dynamic)).toHaveLength(6);
      expect(result.map(control => control.file)).toContain('components/ui.jsx');
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
