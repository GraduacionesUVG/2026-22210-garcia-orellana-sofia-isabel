import type { BrowserContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import type { MockDataset } from './seed-data';
export interface MockResponse { status?: number; json?: any; body?: string | Buffer; headers?: Record<string, string> }
export interface MockRequest { method: string; path: string; body: any; url: URL; dataset: MockDataset }
export interface RequestRecord { method: string; path: string; body: any; status: number; handled: boolean; origin?: string }
export type MockHandler = (request: MockRequest) => MockResponse | Promise<MockResponse>;
export function createMockApi(input: Partial<MockDataset> | Record<string, any>) {
  const dataset = input as MockDataset;
  const requests: RequestRecord[] = [];
  const handlers: { method: string; pattern: RegExp; handler: MockHandler }[] = [];
  const expectedNegatives = new Map<string, number>();
  const barriers = new Set<() => void>();
  let origin = 'http://127.0.0.1:4317';
  const blocked = { status: 501, json: { ok: false, error: 'UNHANDLED_FRONTEND_MOCK_REQUEST' } };
  function route(method: string, path: string, handler: MockHandler) {
    const pattern = new RegExp(`^${path.split('/').map(part => part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/')}$`);
    handlers.push({ method: method.toUpperCase(), pattern, handler });
  }
  async function dispatch(method: string, path: string, body: any = null): Promise<MockResponse> {
    const url = new URL(path, origin);
    const request = { method: method.toUpperCase(), path: url.pathname, body, url, dataset };
    let result: MockResponse = blocked;
    let handled = false;
    // Explicit offline CSS surrogate: visual tests document fallback fonts.
    if (method === 'GET' && url.hostname === 'fonts.googleapis.com' && url.pathname === '/css2') {
      result = { status: 200, body: '', headers: { 'content-type': 'text/css' } }; handled = true;
    }
    if (url.origin === origin) {
      const custom = handlers.findLast(item => item.method === request.method && item.pattern.test(url.pathname));
      if (custom) { result = await custom.handler(request); handled = true; }
      else { const response = defaultResponse(request); if (response) { result = response; handled = true; } }
    }
    requests.push({ method: request.method, path: request.path, body, status: result.status ?? 200, handled, ...(url.origin !== origin ? {origin:url.origin} : {}) });
    return result;
  }
  async function install(context: BrowserContext, data: MockDataset = dataset, baseURL = origin) {
    if (data !== dataset) Object.assign(dataset, data);
    origin = new URL(baseURL).origin;
    await context.route('**/*', async browserRoute => {
      const req = browserRoute.request();
      const url = new URL(req.url());
      // Local page/RSC/static requests remain real, but never API or foreign traffic.
      if (url.origin === origin && !url.pathname.startsWith('/api/')) return browserRoute.continue();
      let body: any = req.postData();
      try { body = req.postDataJSON(); } catch { /* text/empty request */ }
      const response = await dispatch(req.method(), req.url(), body);
      await browserRoute.fulfill({ status: response.status ?? 200, headers: response.headers, ...(response.body !== undefined ? { body: response.body } : { json: response.json }) });
    });
  }
  function barrier() {
    let release!: () => void;
    const wait = new Promise<void>(resolve => { release = () => { barriers.delete(release); resolve(); }; });
    barriers.add(release);
    return { wait, release };
  }
  return { route, dispatch, install, requests, dataset, barrier,
    expectDeniedRequest: (method: string, path: string, count = 1) => { expectedNegatives.set(`${method.toUpperCase()} ${path}`, count); },
    releaseAll: () => { for (const release of barriers) release(); }, assertNoUnexpectedRequests: () => {
    const unexpected = requests.filter(item => !item.handled && !expectedNegatives.has(`${item.method} ${item.path}`));
    if (unexpected.length) throw new Error(`Unexpected mocked requests: ${unexpected.map(item => `${item.method} ${item.origin??''}${item.path}`).join(', ')}`);
    for (const [key, count] of expectedNegatives) if (requests.filter(item => !item.handled && `${item.method} ${item.path}` === key).length !== count) throw new Error(`Negative mock probe count mismatch: ${key}`);
  } };
}
function defaultResponse(req: MockRequest): MockResponse | undefined {
  const { method, path, body, dataset: data, url } = req;
  const json = (value: any, status = 200): MockResponse => ({ status, json: { ok: true, ...value } });
  const row = () => ({ id: randomUUID(), project_id: path.split('/')[3], created_at: '2026-10-04T12:00:00Z', updated_at: '2026-10-04T12:00:00Z', deleted_at: null, revision: 0, ...body });
  if (path === '/api/users/me') {
    if (method === 'GET') return json(data.me);
    if (method === 'PATCH') { Object.assign(data.me.profile, body); return json(data.me); }
  }
  if (path === '/api/projects') {
    data.projects ??= [];
    if (method === 'GET') return json({ projects: data.projects });
    if (method === 'POST') { const project = { ...row(), my_role: 'owner', status: 'active' }; data.projects.push(project); return json({ project }, 201); }
  }
  if (/^\/api\/projects\/[^/]+$/.test(path)) {
    const project = data.projects?.find(item => item.id === path.split('/')[3]);
    if (!project) return { status: 404, json: { error: 'NOT_FOUND' } };
    if (method === 'GET') return json({ project });
    if (method === 'PATCH') { Object.assign(project, body); return json({ project }); }
    if (method === 'DELETE') { data.projects.splice(data.projects.indexOf(project), 1); return json({ deleted: true }); }
  }
  const prefix = path.match(/^\/api\/projects\/[^/]+\/(.*)$/)?.[1];
  if (!prefix) return;
  if (!data.projects?.some(project => project.id === path.split('/')[3])) return { status: 404, json: { ok: false, error: 'UNOWNED_MOCK_PROJECT' } };
  if (prefix === 'workflow' && method === 'GET') return json({ workflow: data.workflow });
  for (const [endpoint, key, member] of [['delimitation','delimitation','delim'], ['research-design','researchDesign','design'], ['sample-config','sampleConfig','config']] as const) {
    if (prefix === endpoint && method === 'GET') return json({ data: data[key] });
    if (prefix === endpoint && method === 'PATCH') {
      Object.assign(data[key][member], body, { revision: data[key][member].revision + 1 });
      return json({ data: data[key], [member]: data[key][member] });
    }
  }
  if (prefix === 'sample-config/options' && method === 'GET') return json({ options: data.sampleOptions });
  if (prefix === 'team' && method === 'GET') return json(data.team);
  if (prefix === 'team/presence' && method === 'POST') return json({ active: data.team.presence });
  if (prefix === 'documents/stats' && method === 'GET') return json({ stats: data.corpusStats });
  if (prefix === 'analysis/dashboard' && method === 'GET') return json(data.analysisDashboard);
  if (prefix === 'analysis/overview' && method === 'GET') return json({ overview: data.analysisDashboard.overview });
  if (['analysis/codes/stats', 'analysis/relationships', 'analysis/document-patterns'].includes(prefix) && method === 'GET') return json({ stats: [], relationships: [], patterns: [] });
  if (prefix === 'analysis/segments' && method === 'GET') {
    const rows = (data.segments ?? []).filter(item => !item.deleted_at);
    const counts = rows.reduce((summary, item) => {
      summary.all += 1;
      if (item.is_coded) summary.coded += 1; else summary.uncoded += 1;
      return summary;
    }, { all: 0, coded: 0, uncoded: 0 });
    const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
    const search = normalize(url.searchParams.get('search'));
    const status = url.searchParams.get('status'), documentId = url.searchParams.get('document_id');
    const visible = rows.filter(item => {
      if (status === 'coded' && !item.is_coded || status === 'uncoded' && item.is_coded) return false;
      if (documentId && item.document_id !== documentId) return false;
      return !search || normalize([item.note, item.selected_text, item.document_title, item.participant_label, (item.codes ?? []).map((code: any) => code.name)].join(' ')).includes(search);
    });
    const offset = Number(url.searchParams.get('offset') ?? 0), limit = Number(url.searchParams.get('limit') ?? visible.length);
    return json({ segments: visible.slice(offset, offset + limit), total: visible.length, counts });
  }
  const collections: Record<string, [string, string]> = {
    'documents/sources': ['sources', 'source'], documents: ['documents', 'document'], participants: ['participants', 'participant'],
    'analysis/codes': ['codes', 'code'], 'analysis/segments': ['segments', 'segment'], 'analysis/memos': ['memos', 'memo'], 'analysis/insights': ['insights', 'insight'],
    'research-design/specific-objectives': ['researchDesign.specific_objectives', 'objective'],
  };
  for (const [endpoint, [key, singular]] of Object.entries(collections)) {
    const [parent, nested] = key.split('.');
    const rows: any[] = nested ? data[parent][nested] : (data[parent] ??= []);
    if (prefix === endpoint) {
      if (method === 'GET') {
        let visible = rows.filter(item => url.searchParams.get('include_deleted') === 'true' || !item.deleted_at);
        const search = url.searchParams.get('search')?.toLowerCase();
        if (search) visible = visible.filter(item => [item.title,item.name,item.alias,item.text,item.content].some(value => String(value ?? '').toLowerCase().includes(search)));
        for (const field of ['status','document_type','source_id','participant_id','parent_code_id']) { const value = url.searchParams.get(field); if (value && !(field === 'status' && value === 'all')) visible = visible.filter(item => String(item[field]) === value); }
        const total = visible.length;
        const offset = Number(url.searchParams.get('offset') ?? 0), limit = Number(url.searchParams.get('limit') ?? total);
        return json({ [nested ?? parent]: visible.slice(offset, offset + limit), total });
      }
      if (method === 'POST') { const created = row(); rows.push(created); return json({ [singular]: created }, 201); }
    }
    if (prefix.startsWith(`${endpoint}/`) && !prefix.slice(endpoint.length + 1).includes('/')) {
      const id = prefix.slice(endpoint.length + 1);
      const item = rows.find(value => value.id === id);
      if (!item) return { status: 404, json: { error: 'NOT_FOUND' } };
      if (method === 'GET') return json({ [singular]: item });
      if (method === 'PATCH') { Object.assign(item, body, { revision: (item.revision ?? 0) + 1 }); return json({ [singular]: item }); }
      if (method === 'DELETE') { item.deleted_at = '2026-10-04T12:00:00Z'; return json({ deleted: true, deletedCount: 1 }); }
    }
  }
  const workflowVersionList = ['delimitation/versions', 'research-design/versions', 'sample-config/versions'].includes(prefix);
  const documentVersionList = /^documents\/[^/]+\/versions$/.test(prefix);
  if ((workflowVersionList || documentVersionList) && method === 'GET') return json({ versions: data.versions?.[prefix] ?? [] });
  if (prefix === 'delimitation/evaluate' && method === 'GET') return json({ evaluation: null });
  if (prefix === 'research-design/evaluate' && method === 'GET') return json({ evaluation: null });
}
export const mockApi = { install: async (context: BrowserContext, dataset: MockDataset, baseURL?: string) => { const api = createMockApi(dataset); await api.install(context, dataset, baseURL); return api; } };
