import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seedMethod,handleMethod,acceptInvitation} from '../metodologia/index.mjs';
const owner = {id:'10000000-0000-4000-8000-000000000001',email:'demo@example.test',full_name:'Ana Morales'};
function setup(rich=true) {
  const project = {id:'proyecto',owner_id:owner.id,...seedMethod('proyecto',rich)};
  const db = {projects:[project]};
  async function request(uri, method='GET',body={},account=owner) {
    const url = new URL('http://localhost/' + uri);
    return await handleMethod({db,project,path:url.pathname.slice(1),url,method,body,account});
  }
  async function json(...args) {
    const r = await request(...args);
    assert(r.ok,(await r.clone().text()) + ' ' + args[0]);
    return r.json();
  }
  return {project,db,request,json};
}
test('Se conservan instantáneas independientes para los tres módulos y se rechazan revisiones obsoletas',async()=>{
  const {json,request} = setup();
  for(const [phase,row,field,value] of [['delimitation','delim','topic','Historia oral'],['research-design','design','general_objective','Reconstruir los relatos'],['sample-config','config','target_sample_size',14]]) {
    const previous = (await json(phase)).data[row];
    const first = (await json(phase + '/versions','POST',{label:'Previo'})).version;
    const saved = (await json(phase,'PATCH',{base_revision:previous.revision,[field]:value})).data[row];
    assert.equal(saved[field],value);
    assert.equal((await request(phase,'PATCH',{base_revision:previous.revision,[field]:value})).status,409);
    const url = phase + '/versions/' + first.id;
    assert.equal((await json(url)).version.label,'Previo');
    await json(url + '/restore','POST');
    const restored = (await json(phase)).data[row];
    assert.equal(restored[field],previous[field]);
    assert(restored.revision > saved.revision);
    assert.equal((await json(phase + '/versions')).versions[0].trigger_type,'before_restore');
  }
});
test('Los criterios, objetivos, técnicas y guías respetan los contratos de los formularios',async()=>{
  const {json,request} = setup(false);
  const criteria = 'delimitation/items';
  const item = (await json(criteria,'POST',{text:'Un criterio de ejemplo',kind:'include'})).item;
  await json(criteria + '/' + item.id,'PATCH',{text:'Otro criterio'});
  assert.equal((await json('delimitation')).data.include[0].text,'Otro criterio');
  assert.equal((await json(criteria + '/' + item.id,'DELETE')).deletedCount,1);
  const objectives = 'research-design/specific-objectives';
  const a = (await json(objectives,'POST',{text:'Primero'})).objective;
  const b = (await json(objectives,'POST',{text:'Segundo'})).objective;
  await json(objectives + '/reorder','POST',{ordered_ids:[b.id,a.id]});
  assert.equal((await json('research-design')).data.specific_objectives[0].text,'Segundo');
  assert.equal((await json(objectives + '/' + b.id,'PATCH',{base_revision:0,text:'Observación'})).objective.revision,1);
  assert.equal((await request(objectives + '/' + b.id,'PATCH',{base_revision:0,text:'Antiguo'})).status,409);
  await json(objectives + '/' + a.id,'DELETE');
  const opts = (await json('sample-config/options')).options;
  assert(opts.main_approaches.length && opts.collection_technique_options.length);
  const sample = (await json('sample-config','PATCH',{base_revision:0,collection_techniques:[{is_custom:true,custom_label:'Recorrido barrial'}]})).data;
  assert.equal(sample.collection_techniques[0].custom_label,'Recorrido barrial');
  assert.equal((await json('delimitation/review','POST',{draft:{topic:'Memoria'}})).review.overall.score,14);
  for (const phase of ['research-design','sample-config']) {
    const review = (await json(phase + '/review','POST')).data;
    assert.match(review.meta.model,/simulada/);
    assert(review.ai_review.issues.length);
  }
  for (const phase of ['delimitation','research-design','sample-config']) {
    const stream = await request(phase + '/chat','POST',{});
    assert.equal(stream.headers.get('x-vercel-ai-ui-message-stream'),'v1');
    assert.match(await stream.text(),/text-delta/);
  }
});
test('Catálogos, búsqueda, descarga, copias, papelera, métricas, versiones e integridad de segmentos',async()=>{
  const {project,json,request} = setup(false);
  const part = (await json('participants','POST',{alias:'A1',display_name:'Perfil A',notes:'Apoyo',attributes:{sample_group:'Grupo A'}})).participant;
  const src = (await json('documents/sources','POST',{code:'diario',label:'Diario'})).source;
  await json('documents/sources/' + src.id,'PATCH',{description:'Cuaderno de trabajo'});
  await json('participants/' + part.id,'PATCH',{display_name:'Perfil de prueba'});
  const doc = (await json('documents','POST',{title:'Día de campo',content:'Varias palabras aquí.',source_id:src.id,participant_id:part.id})).document;
  const url = 'documents/' + doc.id;
  assert.equal((await json('documents?search=dia&source_id=' + src.id)).documents.length,1);
  assert.equal((await json('participants')).participants[0].linked_document_count,1);
  assert.equal((await json('documents/stats')).stats.total_words,3);
  const version = (await json(url + '/versions','POST',{label:'Original'})).version;
  assert.equal(version.snapshot_title,'Día de campo');
  const updated = (await json(url,'PATCH',{content:'Segundo texto más largo.',base_revision:0})).document;
  await json(url + '/versions/' + version.id + '/restore','POST',{base_revision:updated.revision});
  assert.equal((await json(url)).document.content,'Varias palabras aquí.');
  await json(url + '/duplicate','POST');
  assert.equal((await json('documents')).documents.length,2);
  const download = await request(url + '/export');
  assert.match(download.headers.get('Content-Disposition'),/dia-de-campo.txt/);
  assert.match(await download.text(),/Varias palabras aquí/);
  await json(url,'DELETE');
  assert.equal((await json('documents/trash')).documents.length,1);
  assert.equal((await json('documents/stats')).stats.deleted_documents,1);
  await json(url + '/restore','POST');
  project.segments = [{document_id:doc.id,deleted_at:null}];
  const revision = (await json(url)).document.revision;
  assert.equal((await request(url,'PATCH',{content:'Desfase.',base_revision:revision})).status,409);
  await json('documents/sources/' + src.id,'DELETE');
  await json('participants/' + part.id,'DELETE');
  assert.equal((await json('participants')).participants.length,0);
  assert.equal((await json('documents/sources')).sources.length,0);
});
test('El equipo local admite roles, invitaciones, presencia, revocación y aceptación idempotente', async()=>{
  const {db,json,request} = setup(false);
  const guest = {id:'guest',full_name:'Invitada',email:'invitada@example.test'};
  assert.equal((await json('team')).members[0].user_id,owner.id);
  const invitation = (await json('team','POST',{email:guest.email,role:'editor'})).invitation;
  assert.equal((await acceptInvitation({db,body:{token:invitation.token},account:owner})).status,403);
  for (let attempt=0;attempt<2;attempt++) assert((await acceptInvitation({db,body:{token:invitation.token},account:guest})).ok);
  assert.equal((await json('team','GET',{},guest)).currentRole,'editor');
  await json('team/members/guest','PATCH',{role:'viewer'});
  assert.equal((await json('team','GET',{},guest)).currentRole,'viewer');
  await json('team/presence','POST',{presence_state:'viewing'},guest);
  assert.equal((await json('team')).presence[0].display_name,'Invitada');
  assert.equal((await request('team','POST',{email:'x@example.test',role:'editor'},guest)).status,403);
  await json('team/members/guest','DELETE');
  const revoked = (await json('team','POST',{email:guest.email,role:'editor'})).invitation;
  await json('team/invitations/' + revoked.id + '/revoke','POST');
  assert.equal((await acceptInvitation({db,body:{token:revoked.token},account:guest})).status,410);
});
