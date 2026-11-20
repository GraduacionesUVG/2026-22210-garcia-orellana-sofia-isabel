import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { createProject } from './proyectos.mjs';
import { fail, ok } from './metodologia/common.mjs';

const sessionName = 'antropologia_demo';
const recoveryName = 'antropologia_demo_recuperacion';
const hour = 3_600_000;
const demoId = '10000000-0000-4000-8000-000000000001';
const assistantId = '94000000-0000-4000-8000-000000000001';
const mail = value => String(value || '').trim().toLowerCase();
const validPassword = value => typeof value === 'string' && value.trim().length > 0 && value.length >= 6 && value.length <= 128;
function credentials(password) {
  const salt = randomBytes(16).toString('hex');
  return {salt, hash:scryptSync(password,salt,32)};
}
function matches(account,password) {
  return !!account && validPassword(password) && timingSafeEqual(account.hash,scryptSync(password,account.salt,32));
}
function profile(account) {
  return {user:{id:account.id,email:account.email},profile:{id:account.id,full_name:account.full_name}};
}
function newAccount(id,email,full_name,password) {
  return {id,email,full_name,...credentials(password)};
}
export function database() {
  const key = Symbol.for('antropologia.frontend.demostracion');
  if (globalThis[key]) return globalThis[key];
  const demo = newAccount(demoId,'demo@example.test','Ana Morales','Antropologia2026!');
  const editor = newAccount(assistantId,'asistente@example.test','Luis Pérez',randomUUID());
  const featured = createProject(demo,'Memoria y cuidados en Las Jacarandas','Relatos y notas de campo sobre encuentros entre generaciones en un barrio ficticio.',{rich:true,id:'11111111-1111-4111-8111-111111111111'});
  const shared = createProject(editor,'Archivo de oficios del barrio','Proyecto compartido para registrar relatos sobre oficios locales.');
  shared.team.members.push({user_id:demo.id,full_name:demo.full_name,email:demo.email,role:'editor',created_at:shared.created_at});
  globalThis[key] = {accounts:[demo,editor],projects:[featured,shared],sessions:new Map(),links:new Map(),resets:new Map()};
  return globalThis[key];
}
function cookie(request,name) {
  return (request.headers.get('cookie') || '').split(';').map(item => item.trim()).find(item => item.startsWith(name + '='))?.slice(name.length + 1);
}
function grant(store,account,duration) {
  const token = randomUUID();
  store.set(token,{user:account.id,expires:Date.now() + duration});
  return token;
}
function lookup(db,store,token) {
  const entry = store.get(token);
  if (entry && entry.expires > Date.now()) return db.accounts.find(account => account.id === entry.user);
  if (entry) store.delete(token);
}
export function session(db,request) {
  return lookup(db,db.sessions,cookie(request,sessionName));
}
function setCookie(response,name,value,seconds) {
  response.headers.append('set-cookie',name + '=' + value + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + seconds);
  return response;
}
function login(db,account,extra = {}) {
  return setCookie(ok({...profile(account),...extra}),sessionName,grant(db.sessions,account,12*hour),43200);
}
function change(db,account,password) {
  Object.assign(account,credentials(password));
  for (const store of [db.sessions,db.links,db.resets]) {
    for (const [key,entry] of store) if (entry.user === account.id) store.delete(key);
  }
}
export function recoveryCallback(request) {
  const db = database();
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const account = lookup(db,db.links,token);
  const origin = process.env.ANTROPOLOGIA_ORIGEN || url.origin;
  const response = new Response(null,{status:303,headers:{location:new URL(account ? '/auth/reset' : '/auth/reset?e=invalid',origin).href}});
  db.links.delete(token);
  return account ? setCookie(response,recoveryName,grant(db.resets,account,hour/4),900) : response;
}
export function handleAccount({db,request,method,path,body,account,url}) {
  if (path === 'users/me' && account) {
    if (method === 'GET') return ok(profile(account));
    if (method === 'PATCH') {
      const name = String(body.full_name || '').trim();
      if (!name) return fail('Ingresa tu nombre completo.');
      account.full_name = name;
      for (const project of db.projects) {
        const member = project.team.members.find(person => person.user_id === account.id);
        if (member) member.full_name = name;
      }
      return ok(profile(account));
    }
  }
  if (!path.startsWith('auth/') || method !== 'POST') return;
  const email = mail(body.email);
  const found = db.accounts.find(person => person.email === email);
  switch (path) {
    case 'auth/login':
      return matches(found,body.password) ? login(db,found) : fail('Correo o contraseña incorrectos.',401);
    case 'auth/register': {
      const name = String(body.full_name || '').trim();
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !validPassword(body.password)) return fail('Revisa el nombre, el correo y la contraseña.');
      if (found) return fail('Este correo ya está registrado.',409);
      const created = newAccount(randomUUID(),email,name,body.password);
      db.accounts.push(created);
      return login(db,created,{needsEmailConfirmation:false});
    }
    case 'auth/logout':
      db.sessions.delete(cookie(request,sessionName));
      return setCookie(ok({}),sessionName,'',0);
    case 'auth/forgot-password':
      if (found) {
        const link = new URL('/auth/callback',process.env.ANTROPOLOGIA_ORIGEN || url.origin);
        link.searchParams.set('token',grant(db.links,found,hour/4));
        console.info('Recuperación de cuenta de demostración (válida por 15 minutos):',link.href);
      }
      return ok({});
    case 'auth/reset-password': {
      const user = lookup(db,db.resets,cookie(request,recoveryName));
      if (!user) return fail('Solicita un nuevo enlace de recuperación.',401);
      if (!validPassword(body.newPassword)) return fail('Revisa la nueva contraseña.');
      change(db,user,body.newPassword);
      return setCookie(ok({}),recoveryName,'',0);
    }
    case 'auth/change-password':
      if (!matches(account,body.currentPassword)) return fail('La contraseña actual es incorrecta.',401);
      if (!validPassword(body.newPassword) || body.newPassword === body.currentPassword) return fail('Revisa la nueva contraseña.');
      change(db,account,body.newPassword);
      return login(db,account);
  }
}
