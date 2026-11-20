import { ResourceRegistry } from '../shared/resource-registry';
import { assertSafeBackendEnvironment } from '../shared/environment-guard';
export function assertFrontendEnvironment(env: Record<string, string | undefined>) {
  const mode = env.FRONTEND_TEST_MODE ?? 'mocked';
  if (!['mocked', 'live'].includes(mode)) throw new Error('Unknown frontend mode');
  const baseURL = env.FRONTEND_BASE_URL ?? 'http://127.0.0.1:4317';
  const url = new URL(baseURL);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.username || url.password || url.pathname !== '/') throw new Error('Frontend baseURL must be a local HTTP origin');
  if (mode === 'live') {
    if (env.FRONTEND_ALLOW_LIVE !== '1') throw new Error('Live frontend execution requires explicit authorization');
    assertSafeBackendEnvironment(env);
    throw new Error('Esta configuración solo admite pruebas con API simulada');
  }
  return { mode: 'mocked' as const, baseURL: url.origin };
}
export function registerOwnedProject(registry: ResourceRegistry, project: { id: string; name: string }, runId: string) {
  if (!runId || !project.id || !project.name.startsWith(`E2E_${runId}`)) throw new Error('Project has no current run ownership marker');
  registry.register({ kind: 'project', id: project.id, marker: runId });
}
export async function cleanupOwnedProjects(registry: ResourceRegistry, remove: (id: string) => Promise<void>) {
  const failures: string[] = [];
  for (const record of registry.list().filter(item => item.kind === 'project')) {
    try { await remove(record.id); registry.unregister(record.kind, record.id); }
    catch (error) { failures.push(`${record.id}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  if (failures.length) throw new Error(`Frontend cleanup failed: ${failures.join('; ')}`);
}
