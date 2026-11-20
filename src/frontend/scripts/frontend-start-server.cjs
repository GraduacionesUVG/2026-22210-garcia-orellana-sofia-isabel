const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { assertPortAvailable } = require('../__tests__/frontend/server-guard.cjs');
const { startOwnedProcess } = require('../__tests__/frontend/process-lifecycle.cjs');
const { startLocalTlsTransport } = require('../__tests__/frontend/local-tls-transport.cjs');
async function serveOwnedFrontendProcesses({ startNext, startTls, controller }) {
  const handles = []; let failure;
  try {
    handles.push(await startNext());
    if (startTls) handles.push(await startTls());
    const outcome = await Promise.race(handles.map(handle => handle.result));
    if (!outcome.groupGone || (!controller.signal.aborted && !outcome.stopped)) throw new Error('Owned frontend service exited unexpectedly');
  } catch (error) { failure = error; }
  finally {
    controller.abort();
    const stopped = await Promise.allSettled(handles.map(handle => handle.stop()));
    const cleanupFailures = stopped.flatMap(result => result.status === 'rejected' ? [result.reason] : result.value?.groupGone !== true ? [new Error('Owned frontend service cleanup unverified')] : []);
    if (cleanupFailures.length) throw new AggregateError([...(failure ? [failure] : []), ...cleanupFailures], 'Frontend service cleanup unverified');
  }
  if (failure) throw failure;
  return 0;
}
async function main() {
  const origin = new URL(process.env.FRONTEND_BASE_URL || 'http://127.0.0.1:4317');
  if (origin.protocol !== 'http:' || !['127.0.0.1','localhost'].includes(origin.hostname)) throw new Error('Local frontend origin required');
  const port = Number(origin.port || 80);
  await assertPortAvailable(port, origin.hostname);
  const preload = path.resolve('__tests__/frontend/no-external-network.cjs');
  const production = process.env.FRONTEND_SERVER_MODE === 'production';
  // Filesystem setup precedes spawn; all later errors retain a managed handle.
  mkdirSync('__tests__/reports/frontend', { recursive: true });
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.on('SIGINT',stop); process.on('SIGTERM',stop);
  try {
  process.exitCode = await serveOwnedFrontendProcesses({ startNext: () => startOwnedProcess({
    command: process.execPath, args: [require.resolve('next/dist/bin/next'), production ? 'start' : 'dev', '--hostname', origin.hostname, '--port', String(port)],
    stdio: 'inherit', signal: controller.signal,
    recordFile: '__tests__/reports/frontend/server-process.json', metadata: { port, origin: origin.origin, runId: process.env.FRONTEND_RUN_ID },
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NODE_OPTIONS: `--require=${preload}` },
  }), controller,
    startTls: process.env.FRONTEND_LOCAL_TLS === '1' ? () => startLocalTlsTransport({upstreamOrigin:origin.origin,runId:process.env.FRONTEND_RUN_ID,recordFile:path.resolve('__tests__/reports/frontend/tls-process.json'),signal:controller.signal}) : undefined,
  });
  } finally { process.off('SIGINT',stop); process.off('SIGTERM',stop); }
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { serveOwnedFrontendProcesses };
