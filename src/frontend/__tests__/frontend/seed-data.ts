export type MockRow = Record<string, any>;
export interface MockIdentity { id: string; email: string; role: 'owner' | 'editor' | 'viewer' }
export interface MockDataset {
  identity: MockIdentity; me: MockRow; projects: MockRow[]; workflow: MockRow;
  delimitation: MockRow; researchDesign: MockRow; sampleConfig: MockRow; sampleOptions: MockRow;
  documents: MockRow[]; participants: MockRow[]; sources: MockRow[]; codes: MockRow[];
  segments: MockRow[]; memos: MockRow[]; insights: MockRow[]; team: MockRow;
  analysisDashboard: MockRow; corpusStats: MockRow; versions: Record<string, MockRow[]>;
  [key: string]: any;
}
export function createSeedData(projectId: string, runId: string): MockDataset {
  const identity: MockIdentity = { id: '10000000-0000-4000-8000-000000000001', email: 'qa-local@example.test', role: 'owner' };
  return {
    identity,
    me: { ok: true, user: { id: identity.id, email: identity.email, user_metadata: { full_name: 'Investigadora Local' } }, profile: { full_name: 'Investigadora Local', email: identity.email } },
    projects: [{ id: projectId, name: `E2E_${runId}`, description: 'Proyecto sintético local', my_role: 'owner', status: 'active', is_active: true, created_at: '2026-10-04T12:00:00Z', updated_at: '2026-10-04T12:00:00Z' }],
    workflow: { progress: 75, phases: [], phaseMap: {}, evidence: {} },
    delimitation: { delim: { project_id: projectId, topic: 'Memoria comunitaria', context_place: 'Guatemala', time_period: '2026', population: 'Personas adultas', resources: 'Entrevistas', revision: 0 }, include: [], exclude: [] },
    researchDesign: { design: { project_id: projectId, research_question: '¿Cómo se construye la memoria comunitaria?', general_objective: 'Comprender la memoria comunitaria', revision: 0 }, specific_objectives: [] },
    sampleConfig: { config: { project_id: projectId, main_approach_code: null, scope_code: null, field_phase: '', target_sample_size: null, sample_size_rationale: '', revision: 0 }, collection_techniques: [] },
    sampleOptions: { main_approaches: [], scopes: [], collection_technique_options: [] },
    documents: [], participants: [], sources: [], codes: [], segments: [], memos: [], insights: [],
    team: { currentRole: 'owner', members: [{ user_id: identity.id, role: 'owner', full_name: 'Investigadora Local', email: identity.email }], invitations: [], presence: [], activity: [] },
    analysisDashboard: { ok: true, overview: {}, code_usage: [], relationships: [], document_patterns: [], uncoded_segments: [] },
    corpusStats: { total_documents: 0, total_words: 0, total_characters: 0, total_segments: 0 },
    versions: {},
  };
}
