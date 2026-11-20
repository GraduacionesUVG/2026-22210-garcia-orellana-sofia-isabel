const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function httpOrigin(value) {
  if (!URL.canParse(value)) return null;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) return null;
  return url.origin;
}

const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

function isBackendOrigin(candidate, backend) {
  return candidate.origin === backend.origin || (
    loopbackHosts.has(candidate.hostname) && loopbackHosts.has(backend.hostname) &&
    candidate.protocol === backend.protocol && candidate.port === backend.port
  );
}

export async function forward(request) {
  const incoming = new URL(request.url);
  const publicOrigin = httpOrigin(process.env.ANTROPOLOGIA_ORIGEN || incoming.origin);
  if (!publicOrigin) {
    return Response.json({ ok: false, error: 'Configura NEXT_PUBLIC_APP_URL con el origen de la interfaz.' }, { status: 503 });
  }
  const upstream = httpOrigin(process.env.BACKEND_ORIGIN);
  const backend = upstream && new URL(upstream);
  if (!backend || isBackendOrigin(new URL(publicOrigin), backend) || isBackendOrigin(incoming, backend)) {
    return Response.json({ ok: false, error: 'Configura BACKEND_ORIGIN con la dirección del servidor de la API.' }, { status: 503 });
  }

  const headers = new Headers();
  for (const name of ['accept', 'content-type', 'cookie', 'authorization', 'if-match', 'if-none-match']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (writeMethods.has(request.method)) {
    const source = request.headers.get('origin');
    if (source !== publicOrigin) {
      return Response.json({ ok: false, error: 'Origen de solicitud inválido.' }, { status: 403 });
    }
    headers.set('origin', upstream);
  }
  backend.pathname = incoming.pathname;
  backend.search = incoming.search;
  let result;
  try {
    result = await fetch(backend, {
      method: request.method,
      headers,
      body: writeMethods.has(request.method) ? request.body : undefined,
      duplex: 'half',
      redirect: 'manual',
      cache: 'no-store',
      signal: request.signal,
    });
  } catch (error) {
    if (request.signal.aborted) throw error;
    return Response.json({ ok: false, error: 'No se pudo conectar con la API.' }, { status: 502 });
  }

  const output = new Headers();
  for (const name of ['content-type', 'content-disposition', 'cache-control', 'etag', 'vary',
    'retry-after', 'x-vercel-ai-ui-message-stream']) {
    const value = result.headers.get(name);
    if (value) output.set(name, value);
  }
  for (const cookie of result.headers.getSetCookie()) {
    output.append('set-cookie', cookie.replace(/;\s*domain=[^;]+/gi, ''));
  }
  const location = result.headers.get('location');
  if (location) {
    const redirect = new URL(location, backend);
    output.set('location', isBackendOrigin(redirect, backend)
      ? publicOrigin + redirect.pathname + redirect.search + redirect.hash
      : redirect.href);
  }
  return new Response(result.body, { status: result.status, headers: output });
}

export { forward as handleApiRequest, forward as handleAuthCallback };
