const fs = require('node:fs');
const path = require('node:path');
const dns = require('node:dns/promises');
const http = require('node:http');
const https = require('node:https');
const { localTlsOrigin, removeOwnedCertificateDirectory } = require('../__tests__/frontend/local-tls-transport.cjs');

async function main() {
  const [upstreamOrigin, tlsOrigin, runId, certificateDirectory] = process.argv.slice(2);
  if (localTlsOrigin(upstreamOrigin) !== tlsOrigin || !/^[A-Za-z0-9._-]{1,160}$/.test(runId || '')) throw new Error('Invalid local TLS proxy configuration');
  const owner = JSON.parse(fs.readFileSync(path.join(certificateDirectory, 'owner.json'), 'utf8'));
  if (owner.runId !== runId || owner.directory !== fs.realpathSync(certificateDirectory)) throw new Error('Unowned TLS certificate directory');
  const upstream = new URL(upstreamOrigin), tls = new URL(tlsOrigin);
  // Resolve once and pin actual sockets to a verified literal loopback address.
  const addresses = upstream.hostname === '127.0.0.1' ? [{ address: '127.0.0.1' }] : await dns.lookup('localhost', { all: true });
  if (!addresses.length || addresses.some(row => !['127.0.0.1', '::1'].includes(row.address))) throw new Error('Non-loopback localhost resolution refused');
  const bindAddress = addresses[0].address;
  const ready = { event: 'frontend-tls-ready', runId, pid: process.pid, upstreamOrigin: upstream.origin, tlsOrigin, bindAddress };
  let stopping = false;
  const server = https.createServer({ key: fs.readFileSync(path.join(certificateDirectory, 'key.pem')), cert: fs.readFileSync(path.join(certificateDirectory, 'cert.pem')) }, (request, response) => {
    const hostCount = request.rawHeaders.filter((value, index) => index % 2 === 0 && value.toLowerCase() === 'host').length;
    if (hostCount !== 1 || request.headers.host?.toLowerCase() !== tls.host.toLowerCase()) { response.writeHead(403); response.end('Foreign destination refused'); return; }
    if (!request.url?.startsWith('/') || request.url.startsWith('//')) { response.writeHead(400); response.end('Origin-form local request required'); return; }
    if (stopping) { response.writeHead(503); response.end('Local TLS transport stopping'); return; }
    if (request.url === `/.well-known/frontend-tls-ready/${encodeURIComponent(runId)}` && request.method === 'GET') { response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify(ready)); return; }
    const headers = { ...request.headers, host: upstream.host, 'x-forwarded-host': tls.host, 'x-forwarded-proto': 'https' };
    delete headers['proxy-authorization']; delete headers['proxy-connection'];
    const forwarded = http.request({ hostname: bindAddress, port: Number(upstream.port || 80), path: request.url, method: request.method, headers, agent: false }, upstreamResponse => {
      // Preserve CSP and all ordinary response headers; never weaken app policy.
      response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      upstreamResponse.once('error', error => response.destroy(error));
      upstreamResponse.pipe(response);
    });
    forwarded.once('error', () => { if (!response.headersSent) { response.writeHead(502); response.end('Local upstream unavailable'); } else response.destroy(); });
    request.once('aborted', () => forwarded.destroy());
    response.once('close', () => { if (!response.writableFinished) forwarded.destroy(); });
    request.pipe(forwarded);
  });
  server.on('connect', (_request, socket) => socket.end('HTTP/1.1 405 Method Not Allowed\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'));
  server.on('upgrade', (_request, socket) => socket.end('HTTP/1.1 405 Method Not Allowed\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'));
  const stop = () => {
    if (stopping) return; stopping = true;
    server.close(error => {
      try { if (error) throw error; removeOwnedCertificateDirectory(certificateDirectory, runId); }
      catch (failure) { console.error(failure.message); process.exitCode = 1; }
      process.off('SIGTERM', stop); process.off('SIGINT', stop);
    });
    server.closeIdleConnections();
  };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(Number(tls.port), bindAddress, resolve); });
  process.stdout.write(JSON.stringify(ready) + '\n');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
