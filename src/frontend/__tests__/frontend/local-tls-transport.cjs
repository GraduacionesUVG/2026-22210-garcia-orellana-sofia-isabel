const fs = require('node:fs');
const path = require('node:path');
const { tmpdir } = require('node:os');
const https = require('node:https');
const { startOwnedProcess, groupExists } = require('./process-lifecycle.cjs');
const { assertPortAvailable } = require('./server-guard.cjs');

function localTlsOrigin(httpOrigin) {
  if (typeof httpOrigin !== 'string' || httpOrigin !== httpOrigin.trim()) throw new Error('Exact local HTTP origin required');
  const origin = new URL(httpOrigin);
  const port = Number(origin.port || 80);
  if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || port < 1 || port >= 65535) {
    throw new Error('TLS upstream must be a loopback HTTP origin with an available adjacent port');
  }
  return `https://${origin.hostname}:${port + 1}`;
}

function removeOwnedCertificateDirectory(directory, runId) {
  if (!fs.existsSync(directory)) return;
  const absolute = path.resolve(directory), parent = fs.realpathSync(tmpdir());
  if (path.dirname(absolute) !== parent || !path.basename(absolute).startsWith('frontend-local-tls-') || fs.realpathSync(absolute) !== absolute) throw new Error('Refusing unowned TLS certificate directory cleanup');
  const owner = JSON.parse(fs.readFileSync(path.join(absolute, 'owner.json'), 'utf8'));
  if (owner.runId !== runId || owner.directory !== absolute) throw new Error('TLS certificate ownership mismatch');
  fs.rmSync(absolute, { recursive: true, force: false });
}

async function waitForReady(handle, expected, signal) {
  return new Promise((resolve, reject) => {
    let output = '', settled = false;
    const timeout = setTimeout(() => finish(new Error('Local TLS listener readiness timed out')), 8000);
    const onAbort = () => finish(new Error('Local TLS startup cancelled'));
    const onData = chunk => {
      output += chunk.toString();
      if (output.length > 16384) return finish(new Error('Invalid local TLS readiness output'));
      const lines = output.split('\n'); output = lines.pop();
      for (const line of lines) {
        let ready; try { ready = JSON.parse(line); } catch { return finish(new Error('Invalid local TLS readiness JSON')); }
        if (ready.event !== 'frontend-tls-ready' || ready.runId !== expected.runId || ready.upstreamOrigin !== expected.upstreamOrigin || ready.tlsOrigin !== expected.origin || ready.pid !== handle.pid || !['127.0.0.1', '::1'].includes(ready.bindAddress)) return finish(new Error('Local TLS readiness ownership mismatch'));
        finish(null, ready);
      }
    };
    function finish(error, ready) {
      if (settled) return; settled = true;
      clearTimeout(timeout); handle.child.stdout.off('data', onData); signal?.removeEventListener('abort', onAbort);
      if (error) reject(error); else resolve(ready);
    }
    handle.child.stdout.on('data', onData);
    signal?.addEventListener('abort', onAbort, { once: true });
    handle.result.then(() => finish(new Error('Local TLS process exited before readiness')), finish);
    if (signal?.aborted) onAbort();
  });
}

async function proveReady(ready, signal) {
  const url = new URL(ready.tlsOrigin);
  return new Promise((resolve, reject) => {
    const request = https.get({ hostname: ready.bindAddress, port: url.port, path: `/.well-known/frontend-tls-ready/${encodeURIComponent(ready.runId)}`, headers: { host: url.host }, agent: false, rejectUnauthorized: false, signal }, response => {
      let body = '';
      response.on('data', chunk => { body += chunk.toString(); if (body.length > 16384) request.destroy(new Error('Invalid TLS readiness body')); });
      response.once('error', reject);
      response.once('end', () => {
        try {
          const proof = JSON.parse(body);
          if (response.statusCode !== 200 || proof.runId !== ready.runId || proof.pid !== ready.pid || proof.tlsOrigin !== ready.tlsOrigin || proof.upstreamOrigin !== ready.upstreamOrigin) throw new Error('TLS listener proof mismatch');
          resolve(proof);
        } catch (error) { reject(error); }
      });
    });
    request.setTimeout(3000, () => request.destroy(new Error('TLS listener proof timed out')));
    request.once('error', reject);
  });
}

async function startLocalTlsTransport({ upstreamOrigin, runId, recordFile, signal }) {
  const origin = localTlsOrigin(upstreamOrigin), upstream = new URL(upstreamOrigin);
  if (!/^[A-Za-z0-9._-]{1,160}$/.test(runId || '') || typeof recordFile !== 'string' || !recordFile) throw new Error('TLS run ownership and process record required');
  if (signal?.aborted) throw new Error('Local TLS startup cancelled before spawn');
  await assertPortAvailable(Number(new URL(origin).port), upstream.hostname);
  if (signal?.aborted) throw new Error('Local TLS startup cancelled before spawn');
  const certificateDirectory = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), 'frontend-local-tls-'));
  const resourceRecordFile = `${recordFile}.resources.json`;
  const startedAt = new Date().toISOString();
  const processes = [];
  let certificateOwnerWritten = false, resourcesWritten = false;
  function resources(phase) {
    return { runId, startedAt, launcherPid: process.pid, upstreamOrigin: upstream.origin, origin, certificateDirectory, phase, processes: processes.map(row => ({ ...row, groupGone: !groupExists(row.groupId) })) };
  }
  function saveResources(phase) {
    fs.writeFileSync(resourceRecordFile, JSON.stringify(resources(phase)), { mode: 0o600, flag: resourcesWritten ? 'w' : 'wx' });
    resourcesWritten = true;
  }
  function noteSpawn(kind, pid) {
    if (Number.isInteger(pid) && pid > 0) processes.push({ kind, pid, groupId: pid });
    saveResources(`${kind}-spawned`);
  }
  function cleanupCertificates() {
    if (processes.some(row => groupExists(row.groupId))) throw new Error('TLS owned process still present; resource ledger retained');
    if (certificateOwnerWritten) removeOwnedCertificateDirectory(certificateDirectory, runId);
    else {
      // Initialization failed before any spawn. Only remove the exact files/empty
      // directory we just created, not a recursive unvalidated target.
      const ownerFile = path.join(certificateDirectory, 'owner.json');
      if (fs.existsSync(ownerFile)) fs.unlinkSync(ownerFile);
      if (fs.existsSync(certificateDirectory)) fs.rmdirSync(certificateDirectory);
    }
    if (resourcesWritten) {
      saveResources('cleaned');
      fs.unlinkSync(resourceRecordFile); resourcesWritten = false;
    }
  }
  let certificate, proxy, certificateProcess;
  try {
    fs.chmodSync(certificateDirectory, 0o700);
    fs.writeFileSync(path.join(certificateDirectory, 'owner.json'), JSON.stringify({ runId, directory: certificateDirectory, launcherPid: process.pid }), { mode: 0o600 });
    certificateOwnerWritten = true;
    saveResources('certificate-directory-owned');
    certificate = await startOwnedProcess({ command: 'openssl', args: ['req', '-x509', '-newkey', 'rsa:2048', '-sha256', '-nodes', '-days', '1', '-keyout', path.join(certificateDirectory, 'key.pem'), '-out', path.join(certificateDirectory, 'cert.pem'), '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'], recordFile: path.join(certificateDirectory, 'openssl-process.json'), signal, metadata: { kind: 'frontend-tls-certificate', runId, certificateDirectory }, onSpawn: pid => noteSpawn('certificate', pid), stdio: ['ignore', 'ignore', 'ignore'] });
    const generationDeadline = setTimeout(() => { certificate.stop().catch(() => {}); }, 10000);
    const outcome = await certificate.result.finally(() => clearTimeout(generationDeadline));
    certificateProcess = { pid: certificate.pid, groupId: certificate.groupId, outcome };
    if (outcome.code !== 0 || outcome.stopped || !outcome.groupGone || groupExists(certificate.groupId)) throw new Error('Owned TLS certificate generation did not complete successfully');
    saveResources('certificate-complete');
    fs.chmodSync(path.join(certificateDirectory, 'key.pem'), 0o600);
    fs.chmodSync(path.join(certificateDirectory, 'cert.pem'), 0o600);
    proxy = await startOwnedProcess({ command: process.execPath, args: [path.resolve(__dirname, '../../scripts/frontend-tls-proxy.cjs'), upstream.origin, origin, runId, certificateDirectory], recordFile, signal, metadata: { kind: 'frontend-local-tls', runId, upstreamOrigin: upstream.origin, origin, certificateDirectory, resourceRecordFile }, onSpawn: pid => noteSpawn('proxy', pid), stdio: ['ignore', 'pipe', 'pipe'] });
    let proxyErrors = ''; proxy.child.stderr.on('data', chunk => { proxyErrors = (proxyErrors + chunk.toString()).slice(-8192); });
    const ready = await waitForReady(proxy, { runId, upstreamOrigin: upstream.origin, origin }, signal);
    await proveReady(ready, signal);
    saveResources('ready');
    const result = proxy.result.then(outcome => {
      cleanupCertificates();
      return { ...outcome, certificateDirectoryGone: !fs.existsSync(certificateDirectory), certificateProcess };
    });
    result.catch(() => {});
    return { ...proxy, origin, ready, certificateDirectory, certificateProcess, resourceRecordFile, result, stop: async (stopSignal = 'SIGTERM') => { await proxy.stop(stopSignal); return result; }, diagnostics: () => proxyErrors };
  } catch (error) {
    const cleanupErrors = [];
    for (const handle of [proxy, certificate]) if (handle) try { await handle.stop(); } catch (failure) { cleanupErrors.push(failure); }
    if (cleanupErrors.length === 0) try { cleanupCertificates(); } catch (failure) { cleanupErrors.push(failure); }
    const failure = cleanupErrors.length ? new AggregateError([error, ...cleanupErrors], 'TLS startup failed; owned cleanup could not be verified') : error;
    failure.tlsCleanup = { ...resources('startup-failed'), resourceRecordFile, certificateDirectoryGone: !fs.existsSync(certificateDirectory) };
    throw failure;
  }
}

module.exports = { localTlsOrigin, startLocalTlsTransport, removeOwnedCertificateDirectory };
