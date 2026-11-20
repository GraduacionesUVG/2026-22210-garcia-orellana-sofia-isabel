// Execute the real hook callbacks/API/merge logic without introducing a DOM dependency.
// React scheduling and visible controls are covered by the accompanying browser regressions.
const mockSlots: any[] = [];
let mockCursor = 0;
const mockEffects: (() => any)[] = [];
const mockDebounced: (() => Promise<void>)[] = [];
let mockResearchModel: any;
jest.mock('@/features/projects/research-design/hooks/useResearchDesignQuery', () => ({
  useResearchDesignQuery: () => ({
    model: mockResearchModel,
    setModel: (update: any) => { mockResearchModel = update(mockResearchModel); },
    loading: false, loadError: '', reload: () => undefined,
  }),
}));
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: (initial: any) => {
    const index = mockCursor++;
    return mockSlots[index] ?? (mockSlots[index] = { current: initial });
  },
  useState: (initial: any) => {
    const index = mockCursor++;
    if (!(index in mockSlots)) mockSlots[index] = initial;
    return [mockSlots[index], (value: any) => {
      mockSlots[index] = typeof value === 'function' ? value(mockSlots[index]) : value;
    }];
  },
  useEffect: (effect: () => any, deps?: any[]) => {
    const index = mockCursor++;
    const previous = mockSlots[index];
    if (!deps || !previous || deps.some((value, position) => !Object.is(value, previous[position]))) mockEffects.push(effect);
    mockSlots[index] = deps;
  },
  useMemo: (value: () => any) => value(),
  useCallback: (value: any) => value,
}));
jest.mock('@/features/projects/delimitation/hooks/useDebouncedEffect', () => ({
  __esModule: true,
  default: (callback: () => Promise<void>) => { mockDebounced.push(callback); },
}));
import { useDelimitationAutosave } from '@/features/projects/delimitation/hooks/useDelimitationAutosave';
import { useResearchDesignAutosave } from '@/features/projects/research-design/hooks/useResearchDesignAutosave';
import { useResearchDesignObjectivesAutosave } from '@/features/projects/research-design/hooks/useResearchDesignObjectivesAutosave';
import { useDelimitationMutations } from '@/features/projects/delimitation/hooks/useDelimitationMutations';
import { useResearchDesignMutations } from '@/features/projects/research-design/hooks/useResearchDesignMutations';
import { useResearchDesignPage } from '@/features/projects/research-design/hooks/useResearchDesignPage';
import { normalizeDelimitationResponse } from '@/features/projects/delimitation/helpers/delimitation.helpers';
import { useCorpusDashboard } from '@/features/projects/corpus/hooks/useCorpusDashboard';
import { saveDelimitation } from '@/features/projects/delimitation/api/delimitation.api';
import { saveResearchDesign, updateSpecificObjective } from '@/features/projects/research-design/api/researchDesign.api';

function render<T>(hook: () => T) {
  mockCursor = 0; mockEffects.splice(0); mockDebounced.splice(0);
  const value = hook();
  const cleanups = mockEffects.map(effect => effect()).filter(Boolean);
  return { value, cleanup: () => cleanups.forEach(cleanup => cleanup()) };
}
function inspect<T>(hook: () => T) {
  mockCursor = 0; mockEffects.splice(0); mockDebounced.splice(0);
  return hook();
}
function response(status: number, json: any) { return { ok: status < 400, status, json: async () => json }; }
async function settled() { for (let index = 0; index < 12; index++) await Promise.resolve(); }
const originalFetch = global.fetch;
beforeEach(() => { mockSlots.splice(0); mockEffects.splice(0); mockDebounced.splice(0); });
afterEach(() => { global.fetch = originalFetch; });

test('delimitation load retains the optimistic revision used by the next save', () => {
  expect(normalizeDelimitationResponse({ delim: { topic: 'Existing', revision: 7 } }).revision).toBe(7);
  expect(normalizeDelimitationResponse({ delim: {} }).revision).toBe(0);
});

test.each([
  ['DELIMITATION_REVISION_CONFLICT', () => saveDelimitation('local-project', { base_revision: 0, topic: 'Draft' })],
  ['RESEARCH_DESIGN_REVISION_CONFLICT', () => saveResearchDesign('local-project', { base_revision: 0, research_question: 'Draft' })],
  ['SPECIFIC_OBJECTIVE_REVISION_CONFLICT', () => updateSpecificObjective('local-project', 'objective-1', { base_revision: 0, text: 'Draft' })],
] as const)('opaque %s is displayed as an actionable draft-preserving conflict', async (code, save) => {
  global.fetch = jest.fn(async () => response(409, { ok: false, error: code, code })) as any;
  await expect(save()).rejects.toMatchObject({ status: 409, code, message: expect.stringMatching(/borrador.*Copia tus cambios antes de recargar/) });
});

test.each([
  ['delimitation', useDelimitationAutosave, { topic: 'Local draft', revision: 2 }, 'DELIMITATION_REVISION_CONFLICT', 'latest_delimitation'],
  ['research design', useResearchDesignAutosave, { research_question: 'Local draft', revision: 2 }, 'RESEARCH_DESIGN_REVISION_CONFLICT', 'latest_design'],
] as const)('%s preserves a conflicting draft without retrying a newer revision', async (_label, hook, initial, code, latestKey) => {
  let model: any = { ...initial };
  const writes: any[] = [];
  global.fetch = jest.fn(async (_url, options: any) => {
    writes.push(JSON.parse(options.body));
    return writes.length === 1
      ? response(409, { ok: false, error: 'Revision conflict: copy your draft before reloading.', code, [latestKey]: { revision: 3 } })
      : response(200, { ok: true, delim: { topic: 'Overwritten', revision: 4 }, design: { research_question: 'Overwritten', revision: 4 } });
  }) as any;
  const mount = () => hook({ projectId: 'local-project', model, setModel: (update: any) => { model = update(model); }, loading: false, loadError: '' });
  render(mount);
  await mockDebounced[0]();
  expect(writes).toHaveLength(1);
  expect(writes[0].base_revision).toBe(2);
  expect(model).toEqual(initial);
  const state = inspect(mount);
  expect(state.savingState).toBe('error');
  expect(state.savingError).toContain('Revision conflict');
});

test('specific objective preserves dirty text and its revision after a conflict without retry', async () => {
  let model: any = { specific_objectives: [{ id: 'objective-1', text: 'Local draft', revision: 2, _dirty: true, _lastSavedText: 'Original' }] };
  const original = structuredClone(model), writes: any[] = [], states: string[] = [], errors: string[] = [];
  global.fetch = jest.fn(async (_url, options: any) => {
    writes.push(JSON.parse(options.body));
    return writes.length === 1
      ? response(409, { ok: false, error: 'Objective revision conflict', code: 'SPECIFIC_OBJECTIVE_REVISION_CONFLICT', latest_objective: { id: 'objective-1', text: 'Other author', revision: 3 } })
      : response(200, { ok: true, objective: { id: 'objective-1', text: 'Local draft', revision: 4 } });
  }) as any;
  render(() => useResearchDesignObjectivesAutosave({ projectId: 'local-project', model, setModel: (update: any) => { model = update(model); }, loading: false, loadError: '', setSavingState: (state: string) => states.push(state), setSavingError: (error: string) => errors.push(error) }));
  await mockDebounced[0]();
  expect(writes).toEqual([{ base_revision: 2, text: 'Local draft' }]);
  expect(model).toEqual(original);
  expect(states.at(-1)).toBe('error');
  expect(errors.at(-1)).toBe('Objective revision conflict');
});

test.each(['delimitation', 'research design'])('%s conflict remains visible after an independent mutation succeeds', async domain => {
  let model: any = domain === 'delimitation'
    ? { topic: 'Unsaved draft', revision: 2, include: [], exclude: [] }
    : { research_question: 'Unsaved draft', revision: 2, specific_objectives: [{ id: 'unrelated-objective', text: 'Remove this' }] };
  global.fetch = jest.fn(async (_url, options: any) => options.method === 'PATCH'
    ? response(409, { ok: false, error: 'Persistent draft conflict', code: domain === 'delimitation' ? 'DELIMITATION_REVISION_CONFLICT' : 'RESEARCH_DESIGN_REVISION_CONFLICT' })
    : response(200, { ok: true, item: { id: 'criterion', text: 'Independent criterion' }, deletedCount: 1 })) as any;
  const props = () => ({ projectId: 'local-project', model, setModel: (update: any) => { model = update(model); }, loading: false, loadError: '' });
  const mount = () => {
    const saving = domain === 'delimitation' ? useDelimitationAutosave(props()) : useResearchDesignAutosave(props());
    const mutations = domain === 'delimitation' ? useDelimitationMutations({ ...props(), ...saving }) : useResearchDesignMutations({ ...props(), ...saving });
    return { ...saving, ...mutations };
  };
  const mounted: any = render(mount).value;
  await mockDebounced[0]();
  if (domain === 'delimitation') await mounted.onAddItem('include', 'Independent criterion');
  else await mounted.onDeleteSpecificObjective('unrelated-objective');
  const state = inspect(mount);
  expect(state.savingState).toBe('error'); expect(state.savingError).toBe('Persistent draft conflict');
  expect(model[domain === 'delimitation' ? 'topic' : 'research_question']).toBe('Unsaved draft');
  expect(model.revision).toBe(2);
  if (domain === 'delimitation') expect(model.include).toEqual([{ id: 'criterion', text: 'Independent criterion' }]);
  else expect(model.specific_objectives).toEqual([]);
  mounted.setSavingState('saving');
  const pendingState = inspect(mount);
  expect(pendingState.savingState).toBe('saving');
  expect(pendingState.savingError).toBe('Persistent draft conflict');
});

test('specific objective conflict remains visible when the independent research question save succeeds', async () => {
  mockResearchModel = { research_question: '', general_objective: '', revision: 0, specific_objectives: [{ id: 'conflict-objective', text: 'Unsaved objective draft', revision: 2, _dirty: true, _lastSavedText: 'Original' }] };
  global.fetch = jest.fn(async (url: any, options: any) => String(url).includes('/specific-objectives/')
    ? response(409, { ok: false, error: 'Persistent objective conflict', code: 'SPECIFIC_OBJECTIVE_REVISION_CONFLICT' })
    : response(200, { ok: true, design: { ...JSON.parse(options.body), revision: 1 } })) as any;
  render(() => useResearchDesignPage('local-project'));
  await mockDebounced[1]();
  mockResearchModel = { ...mockResearchModel, research_question: 'Independent accepted question' };
  render(() => useResearchDesignPage('local-project'));
  await mockDebounced[0]();
  const page = inspect(() => useResearchDesignPage('local-project'));
  expect(page.savingState).toBe('error'); expect(page.savingError).toBe('Persistent objective conflict');
  expect(page.model.research_question).toBe('Independent accepted question'); expect(page.model.revision).toBe(1);
  expect(page.model.specific_objectives[0].text).toBe('Unsaved objective draft');
  expect(page.model.specific_objectives[0].revision).toBe(2);
});

test('a successful delimitation save still merges its revision without replacing newer local typing', async () => {
  let model: any = { topic: 'Submitted', revision: 2 };
  global.fetch = jest.fn(async () => {
    model = { ...model, topic: 'Typed during save' };
    return response(200, { ok: true, delim: { topic: 'Submitted', revision: 3 } });
  }) as any;
  const mount = () => useDelimitationAutosave({ projectId: 'local-project', model, setModel: (update: any) => { model = update(model); }, loading: false, loadError: '' });
  render(mount);
  await mockDebounced[0]();
  expect(model.topic).toBe('Typed during save'); expect(model.revision).toBe(3);
  expect(inspect(mount).savingState).toBe('saved');
});

test.each(['success', 'error'])('a superseded corpus %s cannot overwrite the latest result or clear its loading state', async oldOutcome => {
  const pending: ((value: any) => void)[] = [];
  global.fetch = jest.fn(async (url: any) => {
    if (/\/documents\?/.test(String(url))) return new Promise(resolve => pending.push(resolve));
    return response(200, { ok: true, stats: {}, sources: [], participants: [] });
  }) as any;
  const first = render(() => useCorpusDashboard('local-project'));
  first.value.updateFilter('search', 'current');
  first.cleanup();
  const second = render(() => useCorpusDashboard('local-project'));
  pending[0](oldOutcome === 'error' ? response(503, { error: 'Stale failure' }) : response(200, { documents: [{ id: 'old', title: 'Obsolete result' }] }));
  await settled();
  let state = inspect(() => useCorpusDashboard('local-project'));
  expect(state.documents).toEqual([]);
  expect(state.loading).toBe(true);
  expect(state.errorMsg).toBe('');
  pending[1](response(200, { documents: [{ id: 'new', title: 'Current result' }] })); await settled();
  state = inspect(() => useCorpusDashboard('local-project'));
  expect(state.documents).toEqual([{ id: 'new', title: 'Current result' }]);
  expect(state.loading).toBe(false); expect(state.errorMsg).toBe('');
  second.cleanup();
});

test('an earlier same-query corpus refresh cannot replace a later refresh', async () => {
  const pending: ((value: any) => void)[] = [];
  global.fetch = jest.fn(async (url: any) => /\/documents\?/.test(String(url))
    ? new Promise(resolve => pending.push(resolve))
    : response(200, { ok: true, stats: {}, sources: [], participants: [] })) as any;
  const mounted = render(() => useCorpusDashboard('local-project'));
  const latest = mounted.value.refresh();
  pending[1](response(200, { documents: [{ id: 'new' }] })); await latest;
  pending[0](response(200, { documents: [{ id: 'old' }] })); await settled();
  expect(inspect(() => useCorpusDashboard('local-project')).documents).toEqual([{ id: 'new' }]);
  mounted.cleanup();
});
