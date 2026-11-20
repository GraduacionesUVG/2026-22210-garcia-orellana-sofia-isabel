import { randomUUID } from 'node:crypto';
import { seedMethod } from './metodologia/index.mjs';
import { seedAnalysis } from './analisis/index.mjs';

export function createProject(owner, name, description = '', options = {}) {
  const id = options.id || randomUUID();
  const rich = Boolean(options.rich);
  const date = rich ? '2026-10-04T15:00:00.000Z' : new Date().toISOString();
  const project = { id, owner_id: owner.id, name, description, created_at: date, updated_at: date, is_active: true,
    ...seedMethod(id, rich), ...seedAnalysis(id, rich) };
  if (!project.team.members.some(member => member.user_id === owner.id)) {
    project.team.members.unshift({user_id: owner.id, full_name: owner.full_name, email: owner.email, role: 'owner', created_at: date});
  }
  return project;
}

export function roleOf(project, account) {
  return project.team.members.find(member => member.user_id === account.id)?.role;
}

export function projectSummary(project, account) {
  const {id, name, description, owner_id, created_at, updated_at, is_active} = project;
  return {id, name, description, owner_id, created_at, updated_at, is_active, my_role: roleOf(project, account)};
}

const present = (row, keys) => keys.filter(key => Boolean(row[key])).length;
const active = rows => rows.filter(row => !row.deleted_at);
export function workflow(project) {
  const {delimitation, researchDesign, sampleConfig} = project;
  const evidence = {
    delimitationFilledFields: present(delimitation.delim, ['topic','context_place','time_period','population','resources']),
    delimitationIncludeItems: delimitation.include.length, delimitationExcludeItems: delimitation.exclude.length,
    designFilledCoreFields: present(researchDesign.design, ['research_question','general_objective']),
    specificObjectives: researchDesign.specific_objectives.length,
    sampleFilledCoreFields: present(sampleConfig.config, ['main_approach_code','scope_code','target_sample_size','field_phase','sample_size_rationale']),
    collectionTechniques: sampleConfig.collection_techniques.length,
    confirmedInsights: active(project.insights).filter(row => row.status === 'confirmed').length,
  };
  for (const key of ['documents','segments','codes','assignments','memos','insights']) evidence[key] = active(project[key]).length;
  const count = (...values) => values.filter(Boolean).length;
  const e = evidence;
  const phases = [
    ['delimitation','Delimitación', e.delimitationFilledFields + count(e.delimitationIncludeItems,e.delimitationExcludeItems), 7],
    ['design','Diseño', e.designFilledCoreFields + count(e.specificObjectives), 3],
    ['sample','Muestra', e.sampleFilledCoreFields + count(e.collectionTechniques), 6],
    ['collection','Corpus', count(e.documents,e.segments), 2],
    ['analysis','Análisis', count(e.segments,e.codes,e.assignments,e.insights), 4],
    ['report','Reporte', count(e.insights,e.confirmedInsights), 2],
  ].map(([key,label,value,total]) => {
    const progress = Math.round(100 * value / total);
    return {key,label,progress,state:progress === 100 ? 'completed' : progress ? 'in_progress' : 'not_started'};
  });
  phases.forEach((phase,index) => {
    phase.available = index === 0 || phase.progress > 0 || phases[index - 1].progress === 100;
    if (phase.key === 'analysis') phase.available = phases[3].progress > 0 || count(e.segments,e.codes,e.assignments,e.memos,e.insights) > 0;
  });
  return {phases,phaseMap:Object.fromEntries(phases.map(phase => [phase.key,phase])),evidence,
    progress:Math.round(phases.reduce((total,phase) => total + phase.progress, 0) / phases.length)};
}
