import {allowed, containsText, copy, documentFields, fail, id, missing, now, ok, paginate, setCounts, stale, stamp, touch, trim} from './common.mjs';
import {versions} from './versions.mjs';

const docTypes = ['interview','focus_group','field_note','observation','diary','archival_document','open_text','other'];
const docStatuses = ['draft','transcribed','cleaned','reviewed','ready_for_coding','archived'];
const catalogSpecs = {
  participants:{key:'participant', primary:'alias', fields:['alias','display_name','status','notes','attributes'],defaults:{alias:'',display_name:null,status:'active',notes:'',attributes:{}}},
  sources:{key:'source',primary:'code',fields:['code','label','description','position','is_active'],defaults:{code:'',label:'',description:'',position:100,is_active:true,is_default:false}},
};
function matches(row, url, keys) {
  return keys.every(key => !url.searchParams.get(key) || row[key] === url.searchParams.get(key));
}
function listDocuments({project,url}, trash) {
  const rows = project.documents.filter(d => Boolean(d.deleted_at) === trash &&
    matches(d,url,['document_type','status','source_id','participant_id']) &&
    containsText(d,['title','content','notes','location'],url.searchParams.get('search')));
  rows.sort((a,b) => (trash ? b.deleted_at.localeCompare(a.deleted_at) : b.updated_at.localeCompare(a.updated_at)));
  return ok({documents:paginate(rows,url),total:rows.length});
}
function corpusStats(project) {
  const docs = project.documents.filter(doc => !doc.deleted_at);
  const sum = key => docs.reduce((total,doc) => total + doc[key], 0);
  const groupBy = field => {
    const groups = new Map();
    for (const doc of docs) {
      const key = doc[field] ?? 'unassigned';
      const group = groups.get(key) ?? {key,count:0,word_count:0,character_count:0};
      group.count++;
      group.word_count += doc.word_count;
      group.character_count += doc.character_count;
      groups.set(key,group);
    }
    return [...groups.values()];
  };
  const words = sum('word_count'), characters = sum('character_count');
  const live = new Set(docs.map(doc => doc.id));
  return {total_documents:docs.length,deleted_documents:project.documents.length-docs.length,total_words:words,total_characters:characters,
    average_words_per_document:docs.length ? Math.round(words/docs.length) : 0,average_characters_per_document:docs.length ? Math.round(characters/docs.length) : 0,
    by_type:groupBy('document_type'),by_status:groupBy('status'),by_source:groupBy('source_id'),by_participant:groupBy('participant_id'),
    total_segments: (project.segments ?? []).filter(s => !s.deleted_at && live.has(s.document_id)).length};
}
function withLinks(project, participant) {
  const documents = project.documents.filter(doc => !doc.deleted_at && doc.participant_id === participant.id);
  const dates = documents.map(doc => doc.field_date ?? doc.interview_date ?? doc.updated_at).sort();
  return {...participant, linked_document_count:documents.length,last_document_at:dates.at(-1) ?? null};
}
function catalog({project,method,url,account,body}, name, rowId) {
  const {key,primary,fields,defaults} = catalogSpecs[name];
  const rows = project[name];
  const present = row => name === 'participants' ? withLinks(project,row) : row;
  if (!rowId && method === 'GET') {
    const result = rows.filter(row => (!row.deleted_at || url.searchParams.get('include_deleted') === 'true') &&
      (!url.searchParams.has('active') || Boolean(row.is_active) === (url.searchParams.get('active') === 'true')) &&
      matches(row,url,['status']) && containsText(row,fields,url.searchParams.get('search')));
    if (name === 'sources') result.sort((a,b) => a.position-b.position || a.label.localeCompare(b.label,'es'));
    else result.sort((a,b) => a.alias.localeCompare(b.alias,'es'));
    return ok({[name]:paginate(result,url).map(present),total:result.length});
  }
  let row = rowId && rows.find(value => value.id === rowId && !value.deleted_at);
  if (rowId && !row) return missing();
  if (row && method === 'GET') return ok({[key]:present(row)});
  if (row && method === 'DELETE') {
    if (row.is_default) return fail('DEFAULT_SOURCE_CANNOT_BE_DELETED',409);
    row.deleted_at = now();
    touch(row,account.id);
    return ok({[key]:row});
  }
  const creating = !rowId && method === 'POST';
  if (!creating && !(row && method === 'PATCH')) return undefined;
  if (row) {
    const conflict = stale(row,body,'PARTICIPANT_REVISION_CONFLICT','latest_participant');
    if (conflict) return conflict;
  }
  const draft = {...(row ?? defaults),...allowed(body,fields)};
  draft[primary] = trim(draft[primary]);
  if (!draft[primary]) return fail(name === 'sources' ? 'Escribe un código para la fuente.' : 'Escribe un alias para el participante.');
  if (name === 'sources') {
    draft.code = draft.code.toLowerCase();
    if (!trim(draft.label)) return fail('Escribe una etiqueta para la fuente.');
    if (row?.is_default && draft.code !== row.code) return fail('DEFAULT_SOURCE_CODE_CANNOT_BE_CHANGED',409);
  }
  if (rows.some(other => other.id !== row?.id && !other.deleted_at && trim(other[primary]).toLowerCase() === draft[primary].toLowerCase())) {
    return fail(name === 'sources' ? 'Ya existe una fuente con ese código.' : 'Ya existe un participante con ese alias.',409);
  }
  if (creating) {
    row = {...stamp(project.id,now(),account.id),deleted_at:null,...draft,id:id()};
    rows.push(row);
  } else {
    Object.assign(row,draft);
    touch(row,account.id);
  }
  return ok({[key]:present(row)},creating ? 201 : 200);
}
function validateDocument(project,draft,current) {
  if (!trim(draft.title) || draft.title.length > 250) return fail('Escribe un título de hasta 250 caracteres.');
  if (typeof draft.content !== 'string' || draft.content.length > 1_000_000) return fail('El texto del documento supera el límite permitido.');
  if (!docTypes.includes(draft.document_type) || !docStatuses.includes(draft.status)) return fail('El tipo o el estado del documento es inválido.');
  for (const [key,list] of [['participant_id','participants'],['source_id','sources']]) {
    if (draft[key] && draft[key] !== current?.[key] && !project[list].some(record => record.id === draft[key] && !record.deleted_at)) {
      return fail('La fuente o el participante ya no está disponible.',409);
    }
  }
  if (current && draft.content !== current.content && project.segments?.some(s => s.document_id === current.id && !s.deleted_at)) {
    return fail('DOCUMENT_HAS_ACTIVE_SEGMENTS',409);
  }
}
function createDocument(project, data, account) {
  const document = {title:'',content:'',document_type:'interview',status:'draft',source_id:null,participant_id:null,interview_date:null,field_date:null,
    language:'es',location:'',notes:'',metadata:{},...allowed(data,documentFields),...stamp(project.id,now(),account.id),id:id(),deleted_at:null};
  const error = validateDocument(project,document);
  if (error) return error;
  setCounts(document);
  project.documents.unshift(document);
  return ok({document},201);
}
function exportDocument(document, url) {
  if ((url.searchParams.get('format') || 'txt') !== 'txt') return fail('El formato de documento disponible es TXT.');
  const contents = [document.title,'','Tipo: ' + document.document_type,'Estado: ' + document.status];
  if (document.location) contents.push('Lugar: ' + document.location);
  if (document.notes) contents.push('Notas: ' + document.notes);
  contents.push('',document.content);
  const slug = document.title.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'documento';
  return new Response(contents.join('\n'),{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="' + slug + '.txt"','Cache-Control':'no-store'}});
}
export function corpus(ctx, parts) {
  const {project, method, body, account, url} = ctx;
  if (parts[0] === 'participants') return catalog(ctx,'participants',parts[1]);
  const [,docId,action,...tail] = parts;
  if (docId === 'sources') return catalog(ctx,'sources',action);
  if (docId === 'stats' && method === 'GET') return ok({stats:corpusStats(project)});
  if (docId === 'trash' && method === 'GET') return listDocuments(ctx,true);
  if (!docId && method === 'GET') return listDocuments(ctx,false);
  if (!docId && method === 'POST') return createDocument(project,body,account);
  if (action === 'segments') return undefined;
  const document = project.documents.find(doc => doc.id === docId && (!doc.deleted_at || action === 'restore'));
  if (!document) return missing();
  if (action === 'versions') return versions({...ctx,scope:'documents/' + docId,document,tail});
  if (action === 'export' && method === 'GET') return exportDocument(document,url);
  if (action === 'duplicate' && method === 'POST') return createDocument(project,{...copy(document),title:(document.title.slice(0,242) + ' (copia)'),metadata:{...document.metadata,duplicated_from_document_id:docId}},account);
  if ((action === 'restore' && method === 'POST') || (!action && method === 'DELETE')) {
    document.deleted_at = action === 'restore' ? null : now();
    touch(document,account.id);
    return ok({document});
  }
  if (!action && method === 'GET') return ok({document});
  if (!action && method === 'PATCH') {
    const conflict = stale(document,body,'DOCUMENT_REVISION_CONFLICT','latest_document');
    if (conflict) return conflict;
    const draft = {...document,...allowed(body,documentFields)};
    const error = validateDocument(project,draft,document);
    if (error) return error;
    Object.assign(document,draft);
    touch(document,account.id);
    setCounts(document);
    return ok({document});
  }
}
