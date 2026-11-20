import { createMockApi } from '../frontend/mock-api';
import { createSeedData } from '../frontend/seed-data';
test('missing mock handler is denied, never continued to a real API', async () => {
  const api = createMockApi({ projects: [] });
  expect((await api.dispatch('POST', '/api/unknown', { name: 'never remote' })).status).toBe(501);
});
test('external browser destination is denied', async () => {
  expect((await createMockApi({}).dispatch('GET', 'https://unapproved.example/api/projects')).status).toBe(501);
});
test('foreign-origin rejection retains exact origin for transport diagnostics',async()=>{
  const api=createMockApi({});await api.dispatch('GET','https://unapproved.example/_next/chunk.js');
  expect(()=>api.assertNoUnexpectedRequests()).toThrow('https://unapproved.example/_next/chunk.js');
});
test('project UI mutation changes only seeded local state', async () => {
  const dataset = { projects: [] as any[] };
  const api = createMockApi(dataset);
  await api.dispatch('POST', '/api/projects', { name: 'Clicked creation' });
  expect(dataset.projects).toHaveLength(1);
  expect(dataset.projects[0].name).toBe('Clicked creation');
});
test('source catalog is not shadowed by document-by-ID route', async () => {
  const dataset = createSeedData('project-a','run-a');
  dataset.sources = [{ id: 'source-a', label: 'Entrevista', deleted_at: null }];
  expect((await createMockApi(dataset).dispatch('GET','/api/projects/project-a/documents/sources')).json.sources).toEqual([{ id: 'source-a', label: 'Entrevista', deleted_at: null }]);
});
test('foreign project never receives owned fixture state', async () => {
  const response = await createMockApi(createSeedData('project-a','run-a')).dispatch('GET','/api/projects/project-b/delimitation');
  expect(response.status).toBe(404);
  expect(response.json).not.toHaveProperty('data');
});
test('owned unknown-module versions route stays denied and fails request audit', async () => {
  const api = createMockApi(createSeedData('project-a','run-a'));
  const result = await api.dispatch('GET','/api/projects/project-a/not-a-real-module/versions');
  expect(result.status).toBe(501);
  expect(api.requests).toContainEqual({ method: 'GET', path: '/api/projects/project-a/not-a-real-module/versions', body: null, status: 501, handled: false });
  expect(() => api.assertNoUnexpectedRequests()).toThrow('not-a-real-module/versions');
});
test.each(['delimitation/versions','research-design/versions','sample-config/versions','documents/document-a/versions'])('explicit supported version list %s returns only its seeded versions', async endpoint => {
  const data = createSeedData('project-a','run-a');
  data.documents.push({ id: 'document-a', title: 'Owned document' });
  data.versions[endpoint] = [{ id: 'version-a', label: 'Snapshot' }];
  const api = createMockApi(data);
  expect(await api.dispatch('GET',`/api/projects/project-a/${endpoint}`)).toEqual({ status: 200, json: { ok: true, versions: [{ id: 'version-a', label: 'Snapshot' }] } });
  expect(() => api.assertNoUnexpectedRequests()).not.toThrow();
});
test('supported version path does not authorize an unsupported mutation method', async () => {
  const api = createMockApi(createSeedData('project-a','run-a'));
  expect((await api.dispatch('PUT','/api/projects/project-a/delimitation/versions')).status).toBe(501);
  expect(() => api.assertNoUnexpectedRequests()).toThrow();
});
test.each([['all',['p1','p2','c1','c2'],4],['coded',['c1','c2'],2],['uncoded',['p1','p2'],2]])('default segment queue %s returns mixed rows with full counts',async(status,ids,total)=>{
  const data=createSeedData('project-a','run-a');data.segments=['p1','p2','c1','c2'].map(id=>({id,selected_text:id,document_id:'doc-a',is_coded:id.startsWith('c'),code_count:id.startsWith('c')?1:0}));
  const result=(await createMockApi(data).dispatch('GET',`/api/projects/project-a/analysis/segments?status=${status}`)).json;
  expect(result.segments.map((row:any)=>row.id)).toEqual(ids);expect(result.total).toBe(total);expect(result.counts).toEqual({all:4,coded:2,uncoded:2});
});
test('segment search and page preserve complete counts and filtered total',async()=>{
  const data=createSeedData('project-a','run-a');data.segments=[{id:'a',is_coded:false,selected_text:'Memoria',document_id:'doc-a'},{id:'b',is_coded:false,selected_text:'Memoria segunda',document_id:'doc-a'},{id:'c',is_coded:true,selected_text:'Otra',document_id:'doc-b'}];
  const result=(await createMockApi(data).dispatch('GET','/api/projects/project-a/analysis/segments?status=uncoded&search=memoria&document_id=doc-a&limit=1&offset=1')).json;
  expect(result.segments.map((row:any)=>row.id)).toEqual(['b']);expect(result.total).toBe(2);expect(result.counts).toEqual({all:3,coded:1,uncoded:2});
});
test('neutral status all never filters another resource by a literal all row status',async()=>{
  const data=createSeedData('project-a','run-a');data.documents=[{id:'a',status:'draft'}];expect((await createMockApi(data).dispatch('GET','/api/projects/project-a/documents?status=all')).json.documents).toEqual([{id:'a',status:'draft'}]);
});
