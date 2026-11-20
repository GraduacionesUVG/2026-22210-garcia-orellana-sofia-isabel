import { database, session, handleAccount } from './cuentas.mjs';
import { roleOf, createProject, projectSummary, workflow } from './proyectos.mjs';
import { handleMethod, acceptInvitation } from './metodologia/index.mjs';
import { handleAnalysis } from './analisis/index.mjs';
import { fail, ok, missing } from './metodologia/common.mjs';
import { chatResponse } from './respuesta-chat.mjs';

export { recoveryCallback as handleAuthCallback } from './cuentas.mjs';

function projectList({ db, account, method, body }) {
  if (method === 'GET') {
    const projects = db.projects.filter(project => roleOf(project, account));
    return ok({ projects: projects.map(project => projectSummary(project, account)) });
  }
  if (method !== 'POST') return missing();
  const name = String(body.name || '').trim();
  if (!name) return fail('Ingresa el nombre del proyecto.');
  const project = createProject(account, name, String(body.description || '').trim());
  if (typeof body.is_active === 'boolean') project.is_active = body.is_active;
  db.projects.unshift(project);
  return ok({ project: projectSummary(project, account) }, 201);
}

function projectRecord({ db, project, account, role, method, body }) {
  if (method === 'GET') return ok({ project: projectSummary(project, account) });
  if (role !== 'owner') return fail('Solo la persona propietaria puede administrar este proyecto.', 403);
  if (method === 'DELETE') {
    db.projects.splice(db.projects.indexOf(project), 1);
    return ok({ id: project.id });
  }
  if (method !== 'PATCH') return missing();
  if (Object.hasOwn(body, 'name')) {
    const name = String(body.name || '').trim();
    if (!name) return fail('Ingresa el nombre del proyecto.');
    project.name = name;
  }
  if (Object.hasOwn(body, 'description')) project.description = String(body.description || '').trim();
  if (typeof body.is_active === 'boolean') project.is_active = body.is_active;
  project.updated_at = new Date().toISOString();
  return ok({ project: projectSummary(project, account) });
}

async function projectResource(context) {
  const { project, role, method, path } = context;
  if (!path) return projectRecord(context);
  if (method !== 'GET' && role === 'viewer' && path !== 'team/presence') {
    return fail('Este proyecto es de solo lectura.', 403);
  }
  if (method === 'GET' && path === 'workflow') return ok({ workflow: workflow(project) });
  if (method === 'POST' && path === 'analysis/chat') {
    const count = project.segments.filter(row => !row.deleted_at).length;
    return chatResponse('Guía de demostración. Este proyecto contiene ' + count
      + ' segmentos. Elige una cita y revisa su documento de origen. ¿Qué otro fragmento apoya o contradice tu interpretación? Puedes vincular la comparación a un memo.');
  }

  const response = await handleAnalysis(context) || await handleMethod(context);
  if (response?.ok && method !== 'GET' && path !== 'team/presence' && !path.endsWith('/chat')) {
    project.updated_at = new Date().toISOString();
  }
  return response || missing();
}

export async function handleApiRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  const method = request.method;
  let body = {};
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = request.headers.get('origin');
    const local = new URL(process.env.ANTROPOLOGIA_ORIGEN || url.origin).origin;
    if (origin && origin !== local && origin !== url.origin) return fail('Origen de solicitud inválido.', 403);
    const payload = await request.text();
    if (payload.trim()) {
      try {
        body = JSON.parse(payload);
      } catch {
        return fail('El contenido debe ser JSON.');
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Se esperaba un objeto.');
    }
  }
  const db = database();
  const account = session(db, request);
  const context = { db, account, request, url, path, method, body };
  const auth = handleAccount(context);
  if (auth) return auth;
  if (!account) return fail('Inicia sesión para continuar.', 401);
  if (path === 'project-invitations/accept' && method === 'POST') return acceptInvitation(context);
  const [section, id, ...resource] = path.split('/');
  if (section !== 'projects') return missing();
  if (!id) return projectList(context);

  const project = db.projects.find(item => item.id === id);
  const role = project && roleOf(project, account);
  if (!role) return missing();
  return projectResource({ ...context, project, role, path: resource.join('/') });
}
