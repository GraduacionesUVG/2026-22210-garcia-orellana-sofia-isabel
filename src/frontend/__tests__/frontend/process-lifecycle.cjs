const { spawn } = require('node:child_process');
const { writeFileSync, unlinkSync } = require('node:fs');
function groupExists(groupId) {
  if (!Number.isInteger(groupId) || groupId <= 0) return false;
  try { process.kill(-groupId, 0); return true; }
  catch (error) { if (error.code === 'ESRCH') return false; if (error.code === 'EPERM') return true; throw error; }
}
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function startOwnedProcess(options) {
  if (process.platform === 'win32') throw new Error('Owned process-group lifecycle requires POSIX grouping; refusing unsupported cleanup');
  if (options.signal?.aborted) throw new Error('Owned process startup cancelled before spawn');
  const graceMs = options.graceMs ?? 4000, forceMs = options.forceMs ?? 2000, pollMs = options.pollMs ?? 25;
  if (![graceMs,forceMs,pollMs].every(value => Number.isInteger(value) && value >= 0) || !pollMs) throw new Error('Invalid owned process lifecycle deadline');
  let initializationComplete = false, recordWritten = false, exited = false;
  let stopped = false, escalated = false, code = null, exitSignal = null, startupError = null;
  let cleanupPromise, resolveResult, rejectResult;
  const result = new Promise((resolve,reject) => { resolveResult = resolve; rejectResult = reject; });
  // The caller may still be awaiting startup when an error occurs.
  result.catch(() => {});
  const child = spawn(options.command, options.args, { cwd: options.cwd, env: options.env, detached: true, stdio: options.stdio || 'pipe' });
  const groupId = child.pid;
  function send(signal) {
    if (!groupExists(groupId)) return;
    try { process.kill(-groupId,signal); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
  async function waitForGone(deadline) {
    while ((!exited || groupExists(groupId)) && Date.now() < deadline) await pause(pollMs);
    return exited && !groupExists(groupId);
  }
  function cleanup(signal = 'SIGTERM', requested = false) {
    stopped ||= requested;
    if (!initializationComplete) return result;
    if (cleanupPromise) return cleanupPromise;
    cleanupPromise = (async () => {
      try {
        send(signal);
        if (!await waitForGone(Date.now() + graceMs)) {
          escalated = true;
          send('SIGKILL');
          if (!await waitForGone(Date.now() + forceMs)) throw new Error(`Owned group ${groupId} shutdown unverified; ownership record retained at ${options.recordFile}`);
        }
        // Neither a direct-child exit nor a successful signal is exit proof.
        if (!exited || groupExists(groupId)) throw new Error(`Owned group ${groupId} still present; ownership record retained`);
        if (recordWritten) unlinkSync(options.recordFile);
        options.signal?.removeEventListener('abort', onAbort);
        if (startupError) throw startupError;
        const outcome = { code, signal: exitSignal, stopped, escalated, groupGone: true };
        resolveResult(outcome);
        return outcome;
      } catch (error) {
        options.signal?.removeEventListener('abort', onAbort);
        rejectResult(error);
        throw error;
      }
    })();
    cleanupPromise.catch(() => {});
    return cleanupPromise;
  }
  const onAbort = () => { stopped = true; cleanup('SIGTERM',true); };
  options.signal?.addEventListener('abort', onAbort, { once: true });
  const spawned = new Promise((resolve,reject) => {
    child.once('spawn',resolve);
    child.once('error',error => { startupError = error; exited = true; reject(error); cleanup('SIGTERM'); });
  });
  spawned.catch(() => {});
  child.once('exit',(value,signal) => { exited = true; code = value; exitSignal = signal; cleanup('SIGTERM'); });
  try {
    options.onSpawn?.(groupId);
    await spawned;
    writeFileSync(options.recordFile, JSON.stringify({ ...options.metadata, launcherPid: process.pid, serverPid: groupId, groupId, startedAt: new Date().toISOString() }));
    recordWritten = true;
    initializationComplete = true;
    if (exited || stopped || options.signal?.aborted) cleanup('SIGTERM',stopped || Boolean(options.signal?.aborted));
  } catch (error) {
    startupError = error;
    initializationComplete = true;
    // Even filesystem/observer initialization errors must compensate for spawn.
    try { await cleanup('SIGTERM'); }
    catch (cleanupError) { if (cleanupError !== error) throw new AggregateError([error,cleanupError], `Startup failed and cleanup unverified for owned group ${groupId}`); }
    throw error;
  }
  return { child, pid: groupId, groupId, result, stop: (signal = 'SIGTERM') => cleanup(signal,true) };
}
module.exports = { startOwnedProcess, groupExists };
