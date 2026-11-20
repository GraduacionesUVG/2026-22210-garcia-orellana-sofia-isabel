import assert from 'node:assert/strict';
import { test } from 'node:test';
import Zip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { seedAnalysis, handleAnalysis } from '../analisis/index.mjs';
import { seedMethodData } from '../metodologia/seed.mjs';
function project(rich=true) {
  const id = crypto.randomUUID();
  return {id, name:'Memoria comunitaria y redes de cuidado', ...seedMethodData(id,rich),...seedAnalysis(id,rich)};
}
function session(project) {
  return async (path,method='GET',body={},expectStatus=200) => {
    const url = new URL('http://local/'+path);
    const response = await handleAnalysis({project,account:{id:'ana'},method,body,url,path:url.pathname.slice(1)});
    assert.equal(response.status,expectStatus,path+' '+method);
    return path.startsWith('exports/') ? response : response.json();
  };
}
test('semillas coordinadas, panel, coocurrencia, alcance y paginación',async ()=>{
  const projectData=project(), read=session(projectData);
  const snapshot=await read('analysis/dashboard');
  assert.equal(snapshot.overview.segments_count,6);
  assert.equal(snapshot.overview.coded_segments_count,5);
  assert.equal(snapshot.overview.assignments_count,8);
  assert.equal(snapshot.overview.quotes_count,5);
  assert.equal(snapshot.relationships[0].shared_segment_count,2);
  assert.equal(snapshot.documentPatterns.documents.length,2);
  assert.equal(snapshot.groupComparisons.groups.length,2);
  for(const row of projectData.segments) {
    const doc=projectData.documents.find(doc=>doc.id===row.document_id);
    assert.equal(doc.content.slice(row.start_char,row.end_char),row.selected_text);
  }
  const result=await read('analysis/segments?status=coded&search=oir&limit=1');
  assert.deepEqual(result.counts,{all:6,coded:5,uncoded:1});
  const filtered=await read('analysis/segments?search=jovenes&limit=1');
  assert.equal(filtered.total,1);
  const list=await read('analysis/segments?offset=4&limit=1'); assert.equal(list.segments.length,1);
  projectData.documents[0].deleted_at=new Date().toISOString();
  assert.equal((await read('analysis/overview')).overview.segments_count,3);
  projectData.documents[0].deleted_at=null;
  assert.equal((await read('analysis/overview')).overview.segments_count,6);
  assert.equal((await session(project(false))('analysis/dashboard')).overview.documents_count,0);
});
test('revisiones, rangos y asignaciones se reflejan en el panel',async ()=>{
  const projectData=project(), run=session(projectData), doc=projectData.documents[0];
  const route='documents/'+doc.id+'/segments';
  const slice={base_document_revision:doc.revision,start_char:0,end_char:6,selected_text:'Cuando',note:'Nueva selección'};
  await run(route,'POST',{...slice,selected_text:'Incorrecto'},400);
  const {segment}=await run(route,'POST',slice,201);
  const code={name:'Aprendizaje',color:'#0f766e',position:4};
  const {code:added}=await run('analysis/codes','POST',code,201);
  await run('analysis/codes','POST',code,409);
  const assignmentRoute='analysis/segments/'+segment.id+'/codes';
  const {segment_code}=await run(assignmentRoute,'POST',{code_id:added.id, is_quote:true},201);
  await run(assignmentRoute,'POST',{code_id:added.id},409);
  await run('analysis/codes/'+added.id,'DELETE',{},409);
  assert.equal((await run('analysis/overview')).overview.coded_segments_count,6);
  await run(assignmentRoute+'/'+segment_code.id,'PATCH',{base_revision:0, is_quote:false});
  await run(assignmentRoute+'/'+segment_code.id,'PATCH',{base_revision:0, is_quote:true},409);
  await run(assignmentRoute+'/'+segment_code.id,'DELETE');
  await run('analysis/codes/'+added.id,'DELETE');
  await run(route+'/'+segment.id,'PATCH',{base_revision:0,note:'Versión nueva'});
  await run(route+'/'+segment.id,'PATCH',{base_revision:0,note:'Posible conflicto'},409);
  await run(route+'/'+segment.id,'DELETE');
  assert.equal((await run('analysis/overview')).overview.segments_count,6);
  await run('analysis/codes/'+projectData.codes[0].id,'PATCH',{base_revision:0,parent_code_id:projectData.codes[1].id},409);
});
test('vínculos de evidencia, etiquetas, catálogos y archivos exportados',async ()=>{
  const projectData=project(), run=session(projectData);
  const memo=(await run('analysis/memos','POST',{title:'Análisis de prueba',body:'Apuntes',tags:['Prueba']},201)).memo;
  const insight=(await run('analysis/insights','POST',{title:'Hallazgo <de prueba>',summary:'Análisis & contraste',confidence:'high'},201)).insight;
  const linkRoute='analysis/insights/'+insight.id+'/links';
  const link=(await run(linkRoute,'POST',{link_type:'memo',memo_id:memo.id},201)).link;
  const exact=(await run('analysis/insights?include_links=true&search=hallazgo')).links.find(row=>row.id===link.id);
  assert.equal(exact.target_label,memo.title);
  assert.equal((await run('analysis/memos?tag=prueba')).memos.length,1);
  await run(linkRoute,'POST',{link_type:'memo',memo_id:'unknown'},400);
  const files=await Zip.loadAsync(await (await run('exports/bundle?scope=all&format=zip')).arrayBuffer());
  const contents = Object.keys(files.files).filter(k=>!files.files[k].dir);
  assert.equal(contents.length,18);
  for(const key of contents) {
    if(key.endsWith('.pdf')) assert.ok((await PDFDocument.load(await files.file(key).async('uint8array'))).getPageCount()>0);
    if(key.endsWith('.docx')) assert.ok((await Zip.loadAsync(await files.file(key).async('uint8array'))).file('word/document.xml'));
  }
  const docx=await Zip.loadAsync(await files.file('bitacora-de-hallazgos.docx').async('uint8array'));
  const xml=await docx.file('word/document.xml').async('text');
  assert.match(xml,/Hallazgo &lt;de prueba&gt;/); assert.match(xml,/Análisis &amp; contraste/); assert.match(xml,/Análisis de prueba/);
  const protocol=await files.file('protocolo-de-investigacion.md').async('text');
  assert.match(protocol,/Entrevista semiestructurada/); assert.match(protocol,/Las Jacarandas/);
  const report=await Zip.loadAsync(await (await run('exports/bundle?scope=report&format=zip')).arrayBuffer());
  assert.equal(Object.values(report.files).filter(f=>!f.dir).length,6);
  const quotes=(await run('exports/quotes?format=docx'));
  assert.match(quotes.headers.get('content-disposition'),/attachment.*\.docx/);
  await run(linkRoute+'/'+link.id,'DELETE');
  assert.equal((await run(linkRoute)).links.length,0);
  await run('analysis/memos/'+memo.id,'DELETE');
  assert.equal((await run('analysis/memos?tag=prueba')).memos.length,0);
});
test('las vistas de análisis conservan el orden, las páginas y las bajas del corpus', async () => {
  const data = project(), read = session(data);
  const template = data.segments[0];
  for (let index = 0; index < 12; index++) {
    data.codes.push({...data.codes[0], id: 'extra-' + index, name: 'Código ' + index});
    data.segments.push({...template, id: 'pending-' + index, start_char: index});
  }
  data.codes[1].deleted_at = '2026-11-18';
  data.documents[1].deleted_at = '2026-11-18';
  data.assignments[0].deleted_at = '2026-11-18';
  const dashboard = await read('analysis/dashboard');
  const stats = (await read('analysis/codes/stats')).stats;
  const pending = (await read('analysis/segments/uncoded')).segments;
  assert.deepEqual((await read('analysis/overview')).overview, dashboard.overview);
  assert.deepEqual(stats.slice(0, 8), dashboard.stats);
  assert.deepEqual(pending.slice(0, 8), dashboard.uncodedSegments);
  assert.deepEqual((await read('analysis/codes/stats?offset=8&limit=2')).stats, stats.slice(8, 10));
  assert.deepEqual((await read('analysis/segments/uncoded?offset=8&limit=2')).segments, pending.slice(8, 10));
  assert.deepEqual((await read('analysis/segments?status=uncoded')).segments, pending);
  assert.deepEqual((await read('analysis/relationships')).relationships, dashboard.relationships);
  const patterns = await read('analysis/document-patterns?limit=1');
  assert.deepEqual(patterns.documents, dashboard.documentPatterns.documents);
  assert.deepEqual(patterns.patterns, dashboard.documentPatterns.patterns.slice(0, 1));
  assert.equal(dashboard.overview.assignments_count, 2);
  assert.equal(dashboard.overview.uncoded_segments_count, 14);
});
