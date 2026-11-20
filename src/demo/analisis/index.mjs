import { analysisView, codeOrder, latestFirst, normalize, paginate, resolvedLinks, targetFor, visible } from "./lecturas.mjs";
export { seedAnalysis } from "./seed.mjs";

const success = (value, status = 200) => Response.json({ ok: true, ...value }, { status });
const fail = (error, status = 400) => Response.json({ ok: false, error }, { status });
const notFound = type => fail(type.toUpperCase() + "_NOT_FOUND", 404);
const unsupported = () => fail("METHOD_NOT_ALLOWED", 405);
const find = (rows, id) => rows.find(item => item.id === id && !item.deleted_at);
const truth = (q, name) => ["1", "true"].includes(q.get(name));
const fields = (data, names) => Object.fromEntries(names.filter(k => Object.hasOwn(data, k)).map(k => [k, data[k]]));

function createRow(ctx, data) {
  const now = new Date().toISOString();
  const actor = ctx.account?.id || null;
  return { ...data, id: crypto.randomUUID(), project_id: ctx.project.id, revision: 0, created_at: now, updated_at: now, deleted_at: null, created_by: actor, updated_by: actor };
}
function modify(ctx, item, changes) {
  Object.assign(item, changes, { revision: item.revision + 1, updated_at: new Date().toISOString(), updated_by: ctx.account?.id || null });
  return item;
}
function revisionError(item, body, type) {
  if (body.base_revision !== item.revision) return fail(type.toUpperCase() + "_REVISION_CONFLICT", 409);
}
function listRows(ctx, key, rows, searchFields, compare, match = () => true) {
  const {q} = ctx;
  const text = normalize(q.get("search")), tag = normalize(q.get("tag"));
  const includeDeleted = truth(q, "include_deleted");
  const filtered = rows.filter(item => (includeDeleted || !item.deleted_at) &&
    match(item) && (!tag || (item.tags || []).some(value=>normalize(value)===tag)) &&
    (!text || normalize(searchFields.map(key => item[key] ?? "").join(" ")).includes(text))
  ).sort(compare);
  return { [key]: paginate(filtered, q), total: filtered.length };
}

function handleSegments(ctx, documentId, id) {
  const {project, body, method} = ctx;
  const doc = find(project.documents, documentId);
  if (!doc) return notFound("document");
  const rows = project.segments.filter(item => item.document_id === documentId);
  if (!id && method === "GET") return success(listRows(ctx, "segments", rows, ["selected_text","note"], (a,b)=>a.start_char-b.start_char));
  const item = id && find(rows, id);
  if (id && !item) return notFound("segment");
  if (item && method === "GET") return success({ segment: item });
  if (item && method === "DELETE") {
    const deleted_at = new Date().toISOString();
    for (const row of visible(project.assignments).filter(row=>row.segment_id===item.id)) modify(ctx, row, {deleted_at});
    return success({ segment: modify(ctx, item, {deleted_at}) });
  }
  if (!(item ? method === "PATCH" : method === "POST")) return unsupported();
  if (item) {
    const conflict = revisionError(item, body, "segment");
    if (conflict) return conflict;
  }
  const changes = fields(body, ["start_char","end_char","selected_text","note"]);
  if (!item || ["start_char","end_char","selected_text"].some(k=>Object.hasOwn(changes, k))) {
    if (body.base_document_revision !== doc.revision) return fail("DOCUMENT_REVISION_CONFLICT", 409);
    const {start_char:start,end_char:end,selected_text:text} = {...item, ...changes};
    if (!Number.isInteger(start) || !Number.isInteger(end) || start<0 || end<=start) return fail("INVALID_SEGMENT_RANGE");
    if (end>doc.content.length) return fail("SEGMENT_RANGE_OUTSIDE_DOCUMENT");
    if (doc.content.slice(start,end)!==text) return fail("SELECTED_TEXT_DOES_NOT_MATCH_DOCUMENT");
  }
  if (item) return success({segment:modify(ctx,item,changes)});
  const segment = createRow(ctx,{document_id:doc.id, note:"", ...changes});
  project.segments.push(segment);
  return success({segment},201);
}

function handleAssignments(ctx, segmentId, id) {
  const {project, method, body, q} = ctx;
  if (!targetFor(project,"segment",segmentId)) return notFound("segment");
  const rows = project.assignments.filter(row=>row.segment_id===segmentId);
  if (!id && method==="GET") {
    const all = (truth(q,"include_deleted") ? rows : visible(rows)).filter(row=>!q.get("code_id") || row.code_id===q.get("code_id"));
    return success({segment_codes:paginate(all,q), total:all.length});
  }
  const patch = fields(body,["analytic_note","quote_label","is_quote","metadata"]);
  if (!id && method==="POST") {
    if (!find(project.codes,body.code_id)) return notFound("code");
    if (visible(rows).some(row=>row.code_id===body.code_id)) return fail("SEGMENT_CODE_ALREADY_EXISTS",409);
    const assignment = createRow(ctx,{segment_id:segmentId, code_id:body.code_id, analytic_note:"", quote_label:"", is_quote:false, metadata:{}, ...patch});
    project.assignments.push(assignment);
    return success({segment_code:assignment},201);
  }
  const item = find(rows,id);
  if (!item) return notFound("segment_code");
  if (method==="GET") return success({segment_code:item});
  if (method==="PATCH") {
    const conflict = revisionError(item,body,"segment_code");
    return conflict || success({segment_code:modify(ctx,item,patch)});
  }
  if (method==="DELETE") return success({segment_code:modify(ctx,item,{deleted_at:new Date().toISOString()})});
  return unsupported();
}

const catalog = {
  codes: {type:"code", label:"name", defaults:{description:null, definition:null, inclusion_criteria:null, exclusion_criteria:null, parent_code_id:null, color:"#0f766e", position:0, is_active:true, metadata:{}}, search:["name","description","definition"]},
  memos: {type:"memo", label:"title", defaults:{body:"", memo_type:"analytic", status:"draft", tags:[], metadata:{}}, search:["title","body","tags"]},
  insights: {type:"insight", label:"title", defaults:{summary:"", interpretation:"", insight_type:"pattern", confidence:"medium", status:"draft", tags:[], metadata:{}}, search:["title","summary","interpretation","tags"]},
};
function codeStructureError(ctx, item, patch) {
  const {codes} = ctx.project;
  if (patch.name && visible(codes).some(code=>code.id!==item?.id && code.name.toLocaleLowerCase("es")===patch.name.toLocaleLowerCase("es"))) return fail("CODE_ALREADY_EXISTS",409);
  if (!patch.parent_code_id) return;
  let parent = find(codes, patch.parent_code_id);
  if (!parent) return notFound("code");
  const visited = new Set([item?.id]);
  while (parent) {
    if (visited.has(parent.id)) return fail("CODE_PARENT_CYCLE",409);
    visited.add(parent.id);
    parent = find(codes,parent.parent_code_id);
  }
}
function handleCatalog(ctx, name, id) {
  const {project,q,method,body} = ctx;
  const spec = catalog[name], rows = project[name];
  if (!id && method==="GET") {
    const filters = ["status","memo_type","insight_type","confidence","parent_code_id"];
    const page = listRows(ctx,name,rows,spec.search,name==="codes" ? codeOrder : latestFirst,
      item=>filters.every(key=>!q.get(key) || String(item[key])===q.get(key)));
    if (name==="insights" && truth(q,"include_links")) {
      const ids = new Set(page.insights.map(item=>item.id));
      page.links = resolvedLinks(project,project.insightLinks.filter(link=>ids.has(link.insight_id)));
    }
    return success(page);
  }
  const item = id && find(rows,id);
  if (id && !item) return notFound(spec.type);
  if (item && method==="GET") return success({[spec.type]:item});
  if (item && method==="DELETE") {
    if (name==="codes" && visible(rows).some(code=>code.parent_code_id===id)) return fail("CODE_HAS_ACTIVE_CHILDREN",409);
    if (name==="codes" && visible(project.assignments).some(a=>a.code_id===id)) return fail("CODE_HAS_ACTIVE_ASSIGNMENTS",409);
    return success({[spec.type]:modify(ctx,item,{deleted_at:new Date().toISOString()})});
  }
  if (!(item ? method==="PATCH" : method==="POST")) return unsupported();
  if (item) {
    const conflict = revisionError(item,body,spec.type);
    if (conflict) return conflict;
  }
  const patch = fields(body,[spec.label,...Object.keys(spec.defaults)]);
  if (!item || Object.hasOwn(patch,spec.label)) {
    const label = patch[spec.label];
    if (typeof label!=="string" || !label.trim()) return fail("VALIDATION_ERROR");
    patch[spec.label] = label.trim();
  }
  if (name==="codes") {
    const error = codeStructureError(ctx,item,patch);
    if (error) return error;
  }
  if (item) return success({[spec.type]:modify(ctx,item,patch)});
  const created = createRow(ctx,{...spec.defaults,...patch});
  rows.push(created);
  return success({[spec.type]:created},201);
}
function handleLinks(ctx,name,ownerId,id) {
  const {project,method,body} = ctx;
  const ownerType = catalog[name].type;
  const ownerField = ownerType+"_id";
  if (!find(project[name],ownerId)) return notFound(ownerType);
  const table = project[ownerType+"Links"];
  const rows = table.filter(link=>link[ownerField]===ownerId);
  if (!id && method==="GET") return success({links:resolvedLinks(project,rows)});
  if (!id && method==="POST") {
    const type = body.link_type, targetKey = type+"_id", targetId = body[targetKey];
    const types = ownerType==="memo" ? ["code","segment","document","participant"] : ["code","segment","document","participant","memo"];
    if (!types.includes(type) || !targetFor(project,type,targetId)) return fail("INVALID_LINK_TARGET");
    const existing = rows.find(link => !link.deleted_at && link.link_type === type && link[targetKey] === targetId);
    if (existing) return success({link:existing});
    const link = createRow(ctx,{[ownerField]:ownerId, link_type:type, [targetKey]:targetId});
    table.push(link);
    return success({link},201);
  }
  const link = find(rows,id);
  if (!link) return notFound("link");
  if (method==="DELETE") return success({link:modify(ctx,link,{deleted_at:new Date().toISOString()})});
  return unsupported();
}

const reports = {
  "analysis/dashboard": view => view.dashboard(),
  "analysis/overview": view => ({overview: view.overview()}),
  "analysis/codes/stats": (view, q) => ({stats: paginate(view.stats(), q)}),
  "analysis/relationships": (view, q) => ({relationships: paginate(view.relationships(), q)}),
  "analysis/segments": (view, q) => view.queue(q),
  "analysis/segments/uncoded": (view, q) => ({segments: view.uncoded(q)}),
  "analysis/document-patterns": (view, q) => {
    const {documents, patterns} = view.documentPatterns();
    return {documents, patterns: paginate(patterns, q)};
  },
};

export async function handleAnalysis(context) {
  const {path, project, method} = context;
  if (!project) return;
  const [area,resource,id,sub,item,extra] = path.split("/");
  const ctx = {...context, body:context.body || {}, q:context.url.searchParams};
  if (area==="documents" && id==="segments" && !item) return handleSegments(ctx,resource,sub);
  if (area==="exports" && !id && method==="GET") {
    const {exportProject} = await import("./exportaciones.mjs");
    return exportProject(project,resource,ctx.q);
  }
  if (area!=="analysis" || resource==="chat" || extra) return;
  if (resource==="segments" && sub==="codes") return handleAssignments(ctx,id,item);
  if (method === "GET" && Object.hasOwn(reports, path)) {
    return success(reports[path](analysisView(project), ctx.q));
  }
  if (Object.hasOwn(catalog,resource)) {
    if (resource!=="codes" && sub==="links") return handleLinks(ctx,resource,id,item);
    if (!sub) return handleCatalog(ctx,resource,id);
  }
}
