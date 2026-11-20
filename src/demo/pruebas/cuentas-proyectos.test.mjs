import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleApiRequest } from '../router.mjs';
import { recoveryCallback, database } from '../cuentas.mjs';

const base = 'http://localhost:3000';
const request = (path, method = 'GET', body, cookie) => handleApiRequest(new Request(base + '/api/' + path, {
  method, headers:{origin:base,...(cookie ? {cookie} : {}),'content-type':'application/json'},
  body:body ? JSON.stringify(body) : undefined,
}));
const cookieOf = response => response.headers.get('set-cookie').split(';')[0];

test('Acceso, proyecto de ejemplo, datos del reporte y cierre de sesión',async () => {
  assert.equal((await request('projects')).status,401);
  const response = await request('auth/login','POST',{email:'demo@example.test',password:'Antropologia2026!'});
  assert.equal(response.status,200);
  const cookie = cookieOf(response);
  const {projects} = await (await request('projects','GET',null,cookie)).json();
  assert.deepEqual(projects.map(project=>project.my_role).sort(),['editor','owner']);
  const path = 'projects/' + projects.find(p=>p.my_role === 'owner').id;
  const {workflow} = await (await request(path + '/workflow','GET',null,cookie)).json();
  assert.equal(workflow.progress,100);
  assert.equal(workflow.evidence.documents,2);
  const chat = await request(path + '/analysis/chat','POST',{messages:[]},cookie);
  assert.match(await chat.text(),/text-delta[\s\S]*6 segmentos[\s\S]*\[DONE\]/);
  const logout = new Request(base + '/api/auth/logout', { method: 'POST', headers: {cookie}, body: '' });
  assert.equal((await handleApiRequest(logout)).status,200);
  assert.equal((await request('users/me','GET',null,cookie)).status,401);
});

test('Una cuenta nueva puede crear, editar y retirar su propio proyecto',async () => {
  const signup = await request('auth/register','POST',{full_name:'Visitante',email:'visitante@example.test',password:'Ejemplo123!'});
  const cookie = cookieOf(signup);
  assert.deepEqual((await (await request('projects','GET',null,cookie)).json()).projects,[]);
  const another = 'projects/11111111-1111-4111-8111-111111111111';
  assert.equal((await request(another,'GET',null,cookie)).status,404);
  const created = await request('projects','POST',{name:'Nuevo estudio',description:'Práctica'},cookie);
  assert.equal(created.status,201);
  const {project} = await created.json();
  const path = 'projects/' + project.id;
  const summary = await (await request(path + '/workflow','GET',null,cookie)).json();
  assert.equal(summary.workflow.progress,0);
  assert.deepEqual(summary.workflow.phases.filter(p=>p.available).map(p=>p.key),['delimitation']);
  assert.equal((await request(path,'PATCH',{name:'Estudio revisado'},cookie)).status,200);
  assert.equal((await (await request(path,'GET',null,cookie)).json()).project.name,'Estudio revisado');
  assert.equal((await request(path,'DELETE',null,cookie)).status,200);
  assert.equal((await request(path,'GET',null,cookie)).status,404);
});

test('Recuperación local de un solo uso y cambio de contraseña desde el perfil',async () => {
  const email = 'recuperacion@example.test';
  const start = await request('auth/register','POST',{full_name:'Cuenta de prueba',email,password:'Primera123!'});
  const previous = cookieOf(start);
  await request('auth/forgot-password','POST',{email});
  const db = database();
  const id = db.accounts.find(account=>account.email === email).id;
  const token = [...db.links].find(([,entry])=>entry.user === id)[0];
  const callback = new Request(base + '/auth/callback?token=' + token);
  const grant = recoveryCallback(callback);
  assert.match(grant.headers.get('location'),/\/auth\/reset$/);
  assert.equal(recoveryCallback(callback).headers.get('set-cookie'),null);
  assert.equal((await request('auth/reset-password','POST',{newPassword:'Segunda123!'},cookieOf(grant))).status,200);
  assert.equal((await request('users/me','GET',null,previous)).status,401);
  const login = await request('auth/login','POST',{email,password:'Segunda123!'});
  const updated = await request('auth/change-password','POST',{currentPassword:'Segunda123!',newPassword:'Tercera123!'},cookieOf(login));
  const me = await (await request('users/me','PATCH',{full_name:'Nombre editado'},cookieOf(updated))).json();
  assert.equal(me.profile.full_name,'Nombre editado');
});
