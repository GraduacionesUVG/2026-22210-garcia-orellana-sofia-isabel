export const demoOwner = '10000000-0000-4000-8000-000000000001';
export const seedDate = '2026-10-04T15:00:00.000Z';
export const id = () => globalThis.crypto.randomUUID();
export const now = () => new Date().toISOString();
export const copy = value => structuredClone(value);
export const trim = value => String(value ?? '').trim();
export const ok = (value, status = 200) => Response.json({ok: true, ...value}, {status});
export const fail = (error, status = 400, detail = {}) => Response.json({ok: false, error, ...detail}, {status});
export const missing = () => fail('No se encontró el registro en este proyecto.', 404);
export const allowed = (obj, fields) => Object.fromEntries(fields.filter(key => Object.hasOwn(obj, key)).map(key => [key, obj[key]]));
export function stamp(projectId, at = now(), actor = null) {
  return {project_id: projectId, revision: 0, created_at: at, updated_at: at, created_by: actor, updated_by: actor};
}
export function touch(row, actor) {
  row.revision = (row.revision ?? 0) + 1;
  row.updated_at = now();
  row.updated_by = actor ?? null;
}
export function stale(row, body, code, key) {
  if (body.base_revision !== undefined && body.base_revision !== row.revision) {
    return fail(code, 409, {code, [key]: row});
  }
}
export function paginate(rows, url) {
  const start = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const limit = Math.max(0, Math.min(1000, Number(url.searchParams.get('limit') ?? 100)));
  return rows.slice(start, start + limit);
}
export function containsText(row, fields, query) {
  const fold = input => trim(input).normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
  const needle = fold(query);
  return !needle || fields.some(field => fold(row[field]).includes(needle));
}
export const documentFields = ['title','content','document_type','status','source_id','participant_id','interview_date','field_date','language','location','notes','metadata'];
export function setCounts(document) {
  document.character_count = document.content.length;
  document.word_count = document.content.trim() ? document.content.trim().split(/\s+/u).length : 0;
}
