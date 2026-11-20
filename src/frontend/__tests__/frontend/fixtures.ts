import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { ResourceRegistry } from '../shared/resource-registry';
import { assertFrontendEnvironment, registerOwnedProject, cleanupOwnedProjects } from './environment';
import { createMockApi } from './mock-api';
import { createSeedData, type MockDataset, type MockIdentity } from './seed-data';
import { attachContextRuntimeErrorMonitor } from './browser-assertions';
import { recordUiAction, attachUiEvidence, type ExecutedUiEvidence, type SourceIdentity } from './action-evidence';
export interface UiFixture {
  mode: 'mocked' | 'live'; runId: string; fixtureId: string; sourceIdentity: SourceIdentity; projectId: string; identity: MockIdentity;
  seed(data: Partial<MockDataset>): void; registry: ResourceRegistry;
  dataset: MockDataset; requests: ReturnType<typeof createMockApi>['requests']; mockApi: ReturnType<typeof createMockApi>;
  recordAction(input: Omit<Parameters<typeof recordUiAction>[1], 'identity' | 'mode'>): Promise<void>;
}
export const test = base.extend<{ ui: UiFixture }>({
  ui: [async ({ context, baseURL }, use, testInfo) => {
    assertFrontendEnvironment(process.env);
    const runId = process.env.FRONTEND_RUN_ID;
    if (!runId || !process.env.FRONTEND_EXPECTED_COMMIT || !process.env.FRONTEND_SOURCE_DIGEST) throw new Error('Frontend runner suite/source identity missing; use test:frontend:mocked');
    const fixtureId = `${Date.now()}_${randomUUID()}`;
    const sourceIdentity = { runId, commit:process.env.FRONTEND_EXPECTED_COMMIT, sourceDigest:process.env.FRONTEND_SOURCE_DIGEST };
    const projectId = randomUUID();
    const dataset = createSeedData(projectId, runId);
    const registry = new ResourceRegistry();
    dataset.projects[0].name = `E2E_${fixtureId}`;
    registerOwnedProject(registry, dataset.projects[0] as { id: string; name: string }, fixtureId);
    const api = createMockApi(dataset);
    await api.install(context, dataset, baseURL);
    const monitor = await attachContextRuntimeErrorMonitor(context);
    const proofs: ExecutedUiEvidence[] = [];
    const ui: UiFixture = { mode: 'mocked', runId, fixtureId, sourceIdentity, projectId, identity: dataset.identity, dataset, registry, requests: api.requests, mockApi: api,
      async recordAction(input) { proofs.push(await recordUiAction(testInfo,{ ...input, identity:sourceIdentity, mode:'mocked' })); },
      seed(data) {
        Object.assign(dataset, data);
        if (data.identity) { ui.identity = dataset.identity; dataset.team.currentRole = data.identity.role; dataset.projects.forEach(project => { project.my_role = data.identity!.role; }); }
      },
    };
    try { await use(ui); }
    finally {
      let cleanup: 'passed' | 'failed' = 'passed';
      try { api.releaseAll(); await cleanupOwnedProjects(registry, async id => { dataset.projects = dataset.projects.filter(project => project.id !== id); }); api.assertNoUnexpectedRequests(); await monitor.assertClean(); }
      catch (error) { cleanup='failed'; throw error; }
      finally { await monitor.dispose(); await attachUiEvidence(testInfo,proofs,cleanup); }
    }
  }, { auto: true }],
});
export { expect };
export type { MockDataset, MockIdentity } from './seed-data';
