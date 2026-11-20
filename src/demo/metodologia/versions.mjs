import {allowed, copy, demoOwner, documentFields, fail, id, missing, now, ok, seedDate, setCounts, stale, touch, trim} from './common.mjs';

export const protocol = {
  delimitation:{key:'delimitation', row:'delim', fields:['topic','context_place','time_period','population','resources'], children:['include','exclude'], code:'DELIMITATION_REVISION_CONFLICT', latest:'latest_delimitation'},
  'research-design':{key:'researchDesign', row:'design', fields:['research_question','general_objective'], children:['specific_objectives'], code:'RESEARCH_DESIGN_REVISION_CONFLICT', latest:'latest_design'},
  'sample-config':{key:'sampleConfig', row:'config', fields:['main_approach_code','scope_code','field_phase','target_sample_size','sample_size_rationale'], children:['collection_techniques'], code:'SAMPLE_CONFIG_REVISION_CONFLICT', latest:'latest_config'},
};
function snapshot(project, scope, document) {
  if (document) return copy(allowed(document, [...documentFields,'revision','word_count','character_count']));
  const {key,row,fields,children} = protocol[scope];
  const data = project[key];
  const values = copy(allowed(data[row], fields));
  const lists = copy(allowed(data, children));
  if (scope === 'delimitation') return {delim:values,...lists};
  return {...values,...lists};
}
function makeVersion(project, scope, saved, label, actor, options = {}) {
  const bucket = project.methodVersions[scope] ??= [];
  const version = {
    id:options.id ?? id(), project_id:project.id, version_number:(bucket[0]?.version_number ?? 0) + 1, label:trim(label) || null,
    trigger_type:options.trigger ?? 'manual',created_at:options.date ?? now(), created_by:actor, snapshot:saved,
  };
  if (scope.startsWith('documents/')) {
    version.document_id = scope.split('/')[1];
    for (const [key,value] of Object.entries(saved)) version['snapshot_' + key] = value;
  }
  bucket.unshift(version);
  return version;
}
export function seedVersions(project) {
  const baseline = 'Propuesta inicial';
  let number = 0;
  const metadata = () => ({id:'95000000-0000-4000-8000-' + String(++number).padStart(12,'0'), date:seedDate});
  for (const scope of Object.keys(protocol)) {
    const saved = snapshot(project,scope);
    if (scope === 'delimitation') saved.delim.resources = 'Cuaderno de campo y guía de entrevista.';
    if (scope === 'research-design') saved.specific_objectives = saved.specific_objectives.slice(0,1);
    if (scope === 'sample-config') saved.target_sample_size = 4;
    makeVersion(project,scope,saved,baseline,demoOwner,metadata());
  }
  for (const doc of project.documents) {
    const scope = 'documents/' + doc.id;
    const saved = snapshot(project,scope,doc);
    saved.notes = 'Registro inicial del ejercicio de demostración.';
    makeVersion(project,scope,saved,'Registro inicial',demoOwner,metadata());
  }
}
export function versions({project,scope,document=null,tail,method,body,account}) {
  const bucket = project.methodVersions[scope] ?? [];
  const [versionId, action] = tail;
  if (!versionId && method === 'GET') return ok({versions:bucket});
  if (!versionId && method === 'POST') {
    const saved = snapshot(project,scope,document);
    const same = !document && bucket[0] && JSON.stringify(bucket[0].snapshot) === JSON.stringify(saved);
    const version = same ? bucket[0] : makeVersion(project,scope,saved,body.label,account.id);
    return ok({version,data:{created:!same,reason:same ? 'duplicate_snapshot' : null,version}},same ? 200 : 201);
  }
  const version = bucket.find(item => item.id === versionId);
  if (!version) return missing();
  if (!action && method === 'GET') return ok({version,snapshot:version.snapshot,data:{version,...version.snapshot}});
  if (action !== 'restore' || method !== 'POST') return undefined;
  const meta = protocol[scope];
  const target = document ?? project[meta.key][meta.row];
  const conflict = stale(target,body,meta?.code ?? 'DOCUMENT_REVISION_CONFLICT',meta?.latest ?? 'latest_document');
  if (conflict) return conflict;
  const saved = copy(version.snapshot);
  if (document && saved.content !== document.content && project.segments?.some(s => !s.deleted_at && s.document_id === document.id)) return fail('DOCUMENT_HAS_ACTIVE_SEGMENTS',409);
  if (body.create_backup_of_current !== false) {
    makeVersion(project,scope,snapshot(project,scope,document),'Respaldo antes de restaurar v' + version.version_number,account.id,{trigger:'before_restore'});
  }
  if (document) {
    Object.assign(document,allowed(saved,documentFields));
    setCounts(document);
    touch(document,account.id);
    return ok({document});
  }
  const group = project[meta.key];
  Object.assign(target,allowed(saved.delim ?? saved,meta.fields));
  touch(target,account.id);
  for (const name of meta.children) {
    const currentRows = new Map(group[name].map(item => [item.id,item]));
    group[name] = saved[name].map(item => {
      const restored = {...item};
      if (typeof restored.revision === 'number') {
        restored.revision = Math.max(restored.revision,currentRows.get(restored.id)?.revision ?? 0);
        touch(restored,account.id);
      }
      return restored;
    });
  }
  const restored = {version,current:group};
  return ok({data:restored,restored});
}
