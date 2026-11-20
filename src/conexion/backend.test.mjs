import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { forward } from './backend.mjs';

const frontend = 'http://localhost:3000';

function configureOrigins(t, backend) {
  for (const [key, value] of Object.entries({ BACKEND_ORIGIN: backend, ANTROPOLOGIA_ORIGEN: frontend })) {
    const previous = process.env[key];
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
    process.env[key] = value;
  }
}

async function respondToRequest(request, response) {
  switch (request.url) {
    case '/api/auth/login': {
      let body = '';
      for await (const chunk of request) body += chunk;
      response.writeHead(200, {
        'content-type': 'application/json',
        'set-cookie': ['demo_a=A; Domain=localhost; Path=/; HttpOnly', 'demo_b=B; Path=/'],
      });
      response.end(JSON.stringify({ body: JSON.parse(body), origin: request.headers.origin }));
      return;
    }
    case '/auth/callback?prueba=1':
      response.writeHead(303, { location: '/auth/reset' });
      response.end();
      return;
    case '/api/descargar':
      response.writeHead(200, { 'content-disposition': 'attachment; filename="prueba.txt"' });
      response.end('Datos de ejemplo');
      return;
    case '/api/chat':
      response.writeHead(200, { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' });
      response.end('data: ' + request.headers.cookie + '\n\n');
      return;
    default:
      response.writeHead(404);
      response.end();
  }
}

test('El conector conserva sesión, redirección, contenido de una descarga y flujo de texto', async t => {
  const server = createServer(respondToRequest);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));

  const upstream = 'http://127.0.0.1:' + server.address().port;
  configureOrigins(t, upstream);
  const send = (path, options) => forward(new Request(frontend + path, options));

  const login = await send('/api/auth/login', {
    method: 'POST',
    headers: { origin: frontend, 'content-type': 'application/json' },
    body: JSON.stringify({ demo: true }),
  });
  assert.deepEqual(await login.json(), { body: { demo: true }, origin: upstream });
  assert.equal(login.headers.getSetCookie().length, 2);
  assert.doesNotMatch(login.headers.getSetCookie()[0], /Domain=/i);

  const redirect = await send('/auth/callback?prueba=1');
  assert.equal(redirect.headers.get('location'), frontend + '/auth/reset');

  const file = await send('/api/descargar');
  assert.match(file.headers.get('content-disposition'), /prueba.txt/);
  assert.equal(await file.text(), 'Datos de ejemplo');

  const stream = await send('/api/chat', { headers: { cookie: 'demo_a=A' } });
  assert.equal(stream.headers.get('x-vercel-ai-ui-message-stream'), 'v1');
  assert.match(await stream.text(), /data: demo_a=A/);
});

test('La conexión identifica una dirección de configuración inválida antes de llamar a la API', async t => {
  const request = new Request(frontend + '/api/projects');
  configureOrigins(t, 'http://localhost:3317');
  t.mock.method(globalThis, 'fetch', () => assert.fail('Se hizo una petición con una dirección inválida.'));

  for (const value of ['mi servidor', 'http://localhost:3317/api']) {
    process.env.BACKEND_ORIGIN = value;
    const response = await forward(request);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /BACKEND_ORIGIN/);
  }

  process.env.BACKEND_ORIGIN = 'http://127.0.0.1:3000';
  assert.equal((await forward(request)).status, 503);

  process.env.BACKEND_ORIGIN = 'http://localhost:3317';
  process.env.ANTROPOLOGIA_ORIGEN = 'mi interfaz';
  const response = await forward(request);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /NEXT_PUBLIC_APP_URL/);
});

test('Las redirecciones de la API local vuelven al frontend por su origen público', async t => {
  configureOrigins(t, 'http://127.0.0.1:3317');
  const callback = new Request(frontend + '/auth/callback');
  const path = '/login?e=missing_code#inicio';
  const cases = [
    ['http://localhost:3317', frontend],
    ['http://[::1]:3317', frontend],
    ['http://localhost:3318', 'http://localhost:3318'],
    ['https://localhost:3317', 'https://localhost:3317'],
    ['https://cuentas.example.test', 'https://cuentas.example.test'],
  ];

  let location;
  t.mock.method(globalThis, 'fetch', async () => Response.redirect(location, 307));
  for (const [from, to] of cases) {
    location = from + path;
    const response = await forward(callback);
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('location'), to + path);
  }
});
