import { assertFrontendEnvironment, registerOwnedProject, cleanupOwnedProjects } from '../frontend/environment';
import { ResourceRegistry } from '../shared/resource-registry';
import { createServer } from 'node:net';
import { createServer as createHttpServer, type RequestListener } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { connect as tlsConnect } from 'node:tls';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { assertPlaywrightImage } from '../../scripts/frontend-ci-preflight.cjs';
const { assertPortAvailable } = require('../frontend/server-guard.cjs');
const { groupExists } = require('../frontend/process-lifecycle.cjs');
const { localTlsOrigin, startLocalTlsTransport } = require('../frontend/local-tls-transport.cjs');
describe('preinstalled frontend CI browser compatibility', () => {
  const image = { driverVersion: '1.58.2', dockerImageName: 'mcr.microsoft.com/playwright:v1.58.2-noble' };
  test('accepts the exact locked package and official browser image', () => {
    expect(assertPlaywrightImage({ lockedVersion: '1.58.2', installedVersion: '1.58.2', image })).toBe('1.58.2');
  });
  test.each([
    { lockedVersion: undefined, installedVersion: '1.58.2', image },
    { lockedVersion: '^1.58.2', installedVersion: '1.58.2', image },
    { lockedVersion: '1.58.2', installedVersion: '1.59.0', image },
    { lockedVersion: '1.58.2', installedVersion: '1.58.2', image: null },
    { lockedVersion: '1.58.2', installedVersion: '1.58.2', image: { ...image, driverVersion: '1.59.0' } },
    { lockedVersion: '1.58.2', installedVersion: '1.58.2', image: { ...image, dockerImageName: 'mcr.microsoft.com/playwright:v1.59.0-noble' } },
    { lockedVersion: '1.58.2', installedVersion: '1.58.2', image: { ...image, dockerImageName: 'unverified.example/playwright:v1.58.2-noble' } },
  ])('fails before running suites for incompatible setup %j', setup => {
    expect(() => assertPlaywrightImage(setup)).toThrow();
  });
});
describe('frontend environment fail closed', () => {
  test('production baseURL is rejected', () => { expect(() => assertFrontendEnvironment({ FRONTEND_BASE_URL: 'https://production.example' })).toThrow(); });
  test('unauthorized Supabase host is rejected', () => { expect(() => assertFrontendEnvironment({ FRONTEND_TEST_MODE: 'live', FRONTEND_ALLOW_LIVE: '1', NEXT_PUBLIC_SUPABASE_URL: 'https://wrong.example', TEST_ALLOWED_SUPABASE_HOST: 'approved.example' })).toThrow(); });
  test('live mode is denied even with host configuration without opt-in', () => { expect(() => assertFrontendEnvironment({ FRONTEND_TEST_MODE: 'live' })).toThrow(); });
  test('cannot register a project without this run ownership marker', () => { expect(() => registerOwnedProject(new ResourceRegistry(), { id: 'existing', name: 'User project' }, 'run-a')).toThrow(); });
  test('cannot reuse another run project', () => { const registry = new ResourceRegistry(); registry.register({ kind: 'project', id: 'p', marker: 'run-a' }); expect(() => registerOwnedProject(registry, { id: 'p', name: 'E2E_run-b' }, 'run-b')).toThrow(); });
  test('failed cleanup blocks the phase and retains ownership evidence', async () => { const registry = new ResourceRegistry(); registry.register({ kind: 'project', id: 'p', marker: 'run-a' }); await expect(cleanupOwnedProjects(registry, async () => { throw new Error('delete failed'); })).rejects.toThrow('delete failed'); expect(registry.get('project', 'p')).toBeDefined(); });
  test('mocked default is local', () => { expect(assertFrontendEnvironment({})).toEqual({ mode: 'mocked', baseURL: 'http://127.0.0.1:4317' }); });
  test('foreign server on the dedicated port blocks the phase', async () => {
    const server = createServer();
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as { port: number }).port;
    try { await expect(assertPortAvailable(port)).rejects.toThrow(); }
    finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  });
});

describe('frontend loopback TLS transport', () => {
  const ownedGroups: number[] = [];
  const ownedCertificateDirectories: string[] = [];
  async function upstream(handler: RequestListener) {
    const server = createHttpServer(handler);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as { port: number }).port;
    try { await assertPortAvailable(port + 1); }
    catch (error) { await new Promise<void>(resolve => server.close(() => resolve())); throw error; }
    return { server, origin: `http://127.0.0.1:${port}`, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
  }
  async function request(origin: string, requestPath = '/', method = 'GET', host?: string) {
    const url = new URL(origin);
    return new Promise<{ status: number; headers: any; body: string }>((resolve, reject) => {
      const req = httpsRequest({ hostname: url.hostname, port: url.port, path: requestPath, method, rejectUnauthorized: false, agent: false, headers: host ? { host } : undefined }, res => {
        let body = ''; res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode!, headers: res.headers, body }));
      });
      req.once('error', reject); req.end();
    });
  }
  async function track(handle: any) {
    expect(handle).toBeDefined();
    ownedGroups.push(handle.groupId, handle.certificateProcess.groupId);
    ownedCertificateDirectories.push(handle.certificateDirectory);
    expect(handle.certificateProcess.outcome.groupGone).toBe(true);
    return handle;
  }
  afterAll(() => {
    for (const group of ownedGroups) expect(groupExists(group)).toBe(false);
    for (const directory of ownedCertificateDirectories) expect(existsSync(directory)).toBe(false);
    console.info(JSON.stringify({ tlsOwnedGroups: ownedGroups, tlsCertificateDirectoriesRemoved: ownedCertificateDirectories.length, verifiedGone: true }));
  });
  test('derives only adjacent HTTPS loopback origins without changing their hostname', () => {
    expect(localTlsOrigin('http://127.0.0.1:4317')).toBe('https://127.0.0.1:4318');
    expect(localTlsOrigin('http://localhost:4320')).toBe('https://localhost:4321');
  });
  test.each(['https://127.0.0.1:4317', 'http://example.invalid:4317', 'http://127.0.0.2:4317', 'http://user@localhost:4317', 'http://localhost:4317/path', 'http://localhost:4317?dest=foreign', 'http://localhost:4317#fragment', 'http://localhost:65535'])('rejects unauthorized or non-origin upstream %s', origin => {
    expect(() => localTlsOrigin(origin)).toThrow();
  });
  test('forwards only to its fixed local upstream and preserves CSP and response status', async () => {
    const csp = "default-src 'self'; upgrade-insecure-requests; connect-src 'self'";
    const received: { url?: string; host?: string }[] = [];
    const local = await upstream((req, res) => { received.push({ url: req.url, host: req.headers.host }); res.writeHead(202, { 'content-security-policy': csp, 'content-type': 'text/plain' }); res.end('loopback body'); });
    const directory = mkdtempSync(path.join(tmpdir(), 'frontend-tls-test-'));
    let handle: any;
    try {
      handle = await track(await startLocalTlsTransport({ upstreamOrigin: local.origin, runId: 'tls-forward', recordFile: path.join(directory, 'proxy.json') }));
      expect(handle.ready).toMatchObject({ runId: 'tls-forward', upstreamOrigin: local.origin, tlsOrigin: handle.origin, pid: handle.pid });
      expect(handle.resourceRecordFile).toBe(path.join(directory, 'proxy.json.resources.json'));
      const resources = JSON.parse(readFileSync(handle.resourceRecordFile, 'utf8'));
      expect(resources).toMatchObject({ runId: 'tls-forward', certificateDirectory: handle.certificateDirectory });
      expect(resources.processes).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'certificate', groupId: handle.certificateProcess.groupId, groupGone: true }),
        expect.objectContaining({ kind: 'proxy', groupId: handle.groupId, groupGone: false }),
      ]));
      expect(existsSync(path.join(directory, 'proxy.json'))).toBe(true);
      expect(JSON.parse(readFileSync(path.join(directory, 'proxy.json'), 'utf8')).groupId).toBe(handle.groupId);
      const response = await request(handle.origin, '/document?search=unicode');
      expect(response).toMatchObject({ status: 202, body: 'loopback body' });
      expect(response.headers['content-security-policy']).toBe(csp);
      expect(received).toEqual([{ url: '/document?search=unicode', host: new URL(local.origin).host }]);
      expect(await handle.stop()).toMatchObject({ groupGone: true, escalated: false });
      expect(existsSync(handle.certificateDirectory)).toBe(false);
      expect(existsSync(path.join(directory, 'proxy.json'))).toBe(false);
      expect(existsSync(handle.resourceRecordFile)).toBe(false);
    } finally { if (handle) await handle.stop(); await local.close(); rmSync(directory, { recursive: true, force: true }); }
  }, 12000);
  test('rejects absolute URLs, protocol-relative URLs, foreign Host and CONNECT without reaching upstream', async () => {
    let received = 0;
    const local = await upstream((_req, res) => { received++; res.end('unexpected'); });
    const directory = mkdtempSync(path.join(tmpdir(), 'frontend-tls-negative-'));
    let handle: any;
    try {
      handle = await track(await startLocalTlsTransport({ upstreamOrigin: local.origin, runId: 'tls-negative', recordFile: path.join(directory, 'proxy.json') }));
      expect((await request(handle.origin, 'http://foreign.invalid/path')).status).toBe(400);
      expect((await request(handle.origin, '//foreign.invalid/path')).status).toBe(400);
      expect((await request(handle.origin, '/', 'GET', 'foreign.invalid')).status).toBe(403);
      const url = new URL(handle.origin);
      const connectResponse = await new Promise<string>((resolve, reject) => {
        const socket = tlsConnect({ host: url.hostname, port: Number(url.port), rejectUnauthorized: false }, () => socket.write(`CONNECT foreign.invalid:443 HTTP/1.1\r\nHost: ${url.host}\r\n\r\n`));
        let body = ''; socket.on('data', chunk => { body += chunk.toString(); });
        socket.once('error', reject); socket.once('end', () => { socket.destroy(); resolve(body); });
      });
      expect(connectResponse).toMatch(/^HTTP\/1\.1 405 /);
      expect(received).toBe(0);
    } finally { if (handle) await handle.stop(); await local.close(); rmSync(directory, { recursive: true, force: true }); }
  }, 12000);
  test('abort gracefully stops the owned TLS group and removes only its ephemeral certificate directory', async () => {
    const local = await upstream((_req, res) => res.end('alive'));
    const directory = mkdtempSync(path.join(tmpdir(), 'frontend-tls-abort-'));
    let handle: any;
    try {
      const controller = new AbortController();
      handle = await track(await startLocalTlsTransport({ upstreamOrigin: local.origin, runId: 'tls-abort', recordFile: path.join(directory, 'proxy.json'), signal: controller.signal }));
      expect((await request(handle.origin)).body).toBe('alive');
      controller.abort();
      expect(await handle.result).toMatchObject({ stopped: true, groupGone: true, escalated: false });
      expect(existsSync(handle.certificateDirectory)).toBe(false);
      expect(existsSync(directory)).toBe(true);
    } finally { if (handle) await handle.stop(); await local.close(); rmSync(directory, { recursive: true, force: true }); }
  }, 12000);
  test('pre-cancelled startup creates no child or certificate record', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'frontend-tls-preabort-'));
    const controller = new AbortController(); controller.abort();
    try {
      await expect(startLocalTlsTransport({ upstreamOrigin: 'http://127.0.0.1:4317', runId: 'tls-preabort', recordFile: path.join(directory, 'proxy.json'), signal: controller.signal })).rejects.toThrow(/cancel/i);
      expect(existsSync(path.join(directory, 'proxy.json'))).toBe(false);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  test('occupied adjacent TLS port is rejected rather than reusing the foreign listener', async () => {
    const local = await upstream((_req, res) => res.end('upstream'));
    const foreign = createServer();
    await new Promise<void>(resolve => foreign.listen(Number(new URL(local.origin).port) + 1, '127.0.0.1', resolve));
    const directory = mkdtempSync(path.join(tmpdir(), 'frontend-tls-occupied-'));
    try {
      await expect(startLocalTlsTransport({ upstreamOrigin: local.origin, runId: 'tls-occupied', recordFile: path.join(directory, 'proxy.json') })).rejects.toThrow(/unavailable/);
      expect(foreign.listening).toBe(true);
      expect(existsSync(path.join(directory, 'proxy.json'))).toBe(false);
    } finally { await new Promise<void>(resolve => foreign.close(() => resolve())); await local.close(); rmSync(directory, { recursive: true, force: true }); }
  });
  test('failed proxy ownership-record initialization reports both owned groups already gone and removes certificates', async () => {
    const local = await upstream((_req, res) => res.end('upstream'));
    const directory = mkdtempSync(path.join(tmpdir(), 'frontend-tls-initfail-'));
    let failure: any;
    try {
      try { await startLocalTlsTransport({ upstreamOrigin: local.origin, runId: 'tls-initfail', recordFile: directory }); }
      catch (error) { failure = error; }
      expect(failure).toBeDefined();
      expect(failure.tlsCleanup.processes).toHaveLength(2);
      ownedGroups.push(...failure.tlsCleanup.processes.map((row: any) => row.groupId));
      ownedCertificateDirectories.push(failure.tlsCleanup.certificateDirectory);
      expect(failure.tlsCleanup.processes.every((row: any) => row.groupGone)).toBe(true);
      expect(failure.tlsCleanup.certificateDirectoryGone).toBe(true);
      expect(existsSync(directory)).toBe(true);
    } finally { await local.close(); rmSync(directory, { recursive: true, force: true }); }
  }, 12000);
  test('unexpected proxy exit still verifies group cleanup and removes the owned certificate directory', async () => {
    const local = await upstream((_req, res) => res.end('upstream'));
    const directory = mkdtempSync(path.join(tmpdir(), 'frontend-tls-unexpected-'));
    let handle: any;
    try {
      handle = await track(await startLocalTlsTransport({ upstreamOrigin: local.origin, runId: 'tls-unexpected', recordFile: path.join(directory, 'proxy.json') }));
      process.kill(handle.pid, 'SIGKILL');
      expect(await handle.result).toMatchObject({ signal: 'SIGKILL', stopped: false, groupGone: true, certificateDirectoryGone: true });
      expect(groupExists(handle.certificateProcess.groupId)).toBe(false);
    } finally { if (handle) await handle.stop(); await local.close(); rmSync(directory, { recursive: true, force: true }); }
  }, 12000);
});
