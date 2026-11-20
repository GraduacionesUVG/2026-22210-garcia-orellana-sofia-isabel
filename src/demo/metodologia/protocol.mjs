import {allowed,fail,id,missing,now,ok,stale,stamp,touch,trim} from './common.mjs';
import {protocol,versions} from './versions.mjs';
import {evaluateDesign,guide} from './guide.mjs';

function collection({project,account,body,method}, scope, rowId) {
  const criteria = scope === 'delimitation';
  const data = criteria ? project.delimitation : project.researchDesign;
  const lists = criteria ? [data.include,data.exclude] : [data.specific_objectives];
  if (!criteria && rowId === 'reorder' && method === 'POST') {
    const rows = data.specific_objectives, order = body.ordered_ids;
    if (!Array.isArray(order) || new Set(order).size !== order.length || order.length !== rows.length || order.some(id => !rows.some(row => row.id === id))) {
      return fail('La lista de objetivos cambió. Actualiza el formulario.',409);
    }
    data.specific_objectives = order.map((rowId,position) => {
      const row = rows.find(item => item.id === rowId);
      row.position = position;
      return row;
    });
    return ok({objectives:data.specific_objectives});
  }
  const text = trim(body.text);
  if ((method === 'PATCH' || method === 'POST') && (!text || text.length > (criteria ? 300 : 3000))) return fail('Revisa la longitud del texto.');
  const key = criteria ? 'item' : 'objective';
  if (!rowId && method === 'POST') {
    if (criteria && !['include','exclude'].includes(body.kind)) return fail('Selecciona el tipo de criterio.');
    const list = criteria ? data[body.kind] : lists[0];
    const row = {...stamp(project.id,now(),account.id),id:id(),text,position:list.length};
    if (criteria) row.kind = body.kind;
    list.push(row);
    return ok({[key]:row},201);
  }
  const list = lists.find(group => group.some(row => row.id === rowId));
  if (!list) return missing();
  const index = list.findIndex(row => row.id === rowId), row = list[index];
  if (method === 'DELETE') {
    list.splice(index,1);
    list.forEach((item,position) => {item.position = position;});
    return ok({deletedCount:1});
  }
  if (method === 'PATCH') {
    const conflict = stale(row,body,'SPECIFIC_OBJECTIVE_REVISION_CONFLICT','latest_objective');
    if (conflict) return conflict;
    row.text = text;
    touch(row,account.id);
    return ok({[key]:row});
  }
}
export function handleProtocol(ctx, parts) {
  const {project,account,body,method} = ctx;
  const [scope,action,...tail] = parts;
  const meta = protocol[scope];
  const group = project[meta.key], row = group[meta.row];
  if (action === 'versions') return versions({...ctx,scope,tail});
  if (action === 'items' && scope === 'delimitation' || action === 'specific-objectives' && scope === 'research-design') return collection(ctx,scope,tail[0]);
  if (action === 'options' && scope === 'sample-config' && method === 'GET') return ok({options:project.sampleOptions});
  if (action === 'evaluate' && method === 'GET' || ['chat','review'].includes(action) && method === 'POST') return guide(ctx,scope,action);
  if (action) return undefined;
  if (method === 'GET') {
    if (scope === 'sample-config') return ok({data:{...group,options:project.sampleOptions}});
    if (scope === 'research-design') return ok({data:{...group,evaluation:evaluateDesign(project)}});
    return ok({data:group});
  }
  if (method !== 'PATCH') return undefined;
  if (!Number.isInteger(body.base_revision) || body.base_revision < 0) return fail('Se requiere la revisión base.');
  const conflict = stale(row,body,meta.code,meta.latest);
  if (conflict) return conflict;
  const patch = allowed(body,meta.fields);
  if (scope === 'sample-config') {
    if (patch.target_sample_size != null && (!Number.isInteger(patch.target_sample_size) || patch.target_sample_size < 1)) return fail('El tamaño debe ser un entero positivo.');
    if (Object.hasOwn(body,'collection_techniques')) {
      const techniques = body.collection_techniques;
      if (!Array.isArray(techniques) || techniques.some(t => !t || !(t.is_custom ? trim(t.custom_label) : trim(t.technique_code)))) return fail('Revisa las técnicas de recolección.');
      group.collection_techniques = techniques.map((t,position) => ({id:id(),project_id:project.id,position,is_custom:Boolean(t.is_custom),
        custom_label:t.is_custom ? trim(t.custom_label) : null,technique_code:t.is_custom ? null : trim(t.technique_code)}));
    }
  }
  for (const [key,value] of Object.entries(patch)) row[key] = typeof value === 'string' ? value.trim() : value;
  touch(row,account.id);
  return ok({[meta.row]:row,data:group});
}
