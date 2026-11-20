import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleApiRequest, handleAuthCallback } from './datos.mjs';

test('La API conectada nunca entrega los datos de ejemplo si falta su configuración', async t => {
  delete process.env.BACKEND_ORIGIN;
  t.after(() => { delete process.env.ANTROPOLOGIA_MODO; });
  const projects = new Request('http://localhost:3000/api/projects');
  const callback = new Request('http://localhost:3000/auth/callback');
  for (const mode of [undefined, 'conectado']) {
    if (mode) process.env.ANTROPOLOGIA_MODO = mode;
    else delete process.env.ANTROPOLOGIA_MODO;
    assert.equal((await handleApiRequest(projects)).status, 503);
    assert.equal((await handleAuthCallback(callback)).status, 503);
  }
  process.env.ANTROPOLOGIA_MODO = 'desconocido';
  await assert.rejects(handleApiRequest(projects), /modo del frontend/);
});

test('La demo usa sus cuentas locales aunque exista un origen de API configurado', async t => {
  process.env.ANTROPOLOGIA_MODO = 'demo';
  process.env.BACKEND_ORIGIN = 'https://example.invalid';
  t.after(() => {
    delete process.env.ANTROPOLOGIA_MODO;
    delete process.env.BACKEND_ORIGIN;
  });
  t.mock.method(globalThis, 'fetch', () => assert.fail('La demo intentó contactar a una API externa.'));
  const projects = new Request('http://localhost:3000/api/projects');
  const auth = new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo@example.test', password: 'Antropologia2026!' }),
  });
  assert.equal((await handleApiRequest(projects)).status, 401);
  const session = await handleApiRequest(auth);
  assert.equal(session.status, 200);
  assert.match(session.headers.get('set-cookie'), /antropologia_demo=/);
  const reset = await handleAuthCallback(new Request('http://localhost:3000/auth/callback'));
  assert.equal(reset.status, 303);
  assert.match(reset.headers.get('location'), /auth\/reset/);
});
