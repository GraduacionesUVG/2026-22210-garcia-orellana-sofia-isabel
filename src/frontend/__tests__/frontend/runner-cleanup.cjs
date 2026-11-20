'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { groupExists } = require('./process-lifecycle.cjs');
const { assertPortAvailable } = require('./server-guard.cjs');
const { localTlsOrigin, removeOwnedCertificateDirectory } = require('./local-tls-transport.cjs');

async function cleanupFrontendResources(options) {
  let httpOrigin;
  try { localTlsOrigin(options.httpOrigin); httpOrigin = new URL(options.httpOrigin).origin; }
  catch (error) { return {name:'cleanup',outcome:'failed',exitCode:1,reason:`Cleanup loopback origin invalid: ${error.message}`}; }
  const io = options.io ?? fs, alive = options.groupExists ?? groupExists;
  const signal = options.signalGroup ?? ((id, sig) => { try { process.kill(-id, sig); } catch (error) { if (error.code !== 'ESRCH') throw error; } });
  const pause = options.pause ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const removeCertificate = options.removeCertificate ?? removeOwnedCertificateDirectory;
  const checkPort = options.checkPort ?? assertPortAvailable;
  const errors = [], groups = new Set(), records = [];
  const serverFile = path.join(options.directory, 'server-process.json'), tlsFile = path.join(options.directory, 'tls-process.json'), resourcesFile = `${tlsFile}.resources.json`;
  const own = record => record.runId === options.runId && Number.isFinite(Date.parse(record.startedAt)) && Date.parse(record.startedAt) >= options.startedAt;
  const validGroup = id => Number.isInteger(id) && id >= 2;
  const read = file => JSON.parse(io.readFileSync(file, 'utf8'));
  const keep = (file, record) => records.push({ file, serialized: JSON.stringify(record) });
  let tlsInvalid = false, certificateDirectory;
  for (const [file, tls] of [[serverFile, false], [tlsFile, true]]) {
    if (!io.existsSync(file)) continue;
    try {
      const record = read(file);
      if (!own(record) || !validGroup(record.groupId)) throw new Error('Process record not proven owned by this run; left intact');
      if (!tls && record.origin !== httpOrigin) throw new Error('Server origin ownership mismatch; left intact');
      if (tls && (record.kind !== 'frontend-local-tls' || record.origin !== localTlsOrigin(httpOrigin) || record.upstreamOrigin !== httpOrigin || record.resourceRecordFile !== resourcesFile || typeof record.certificateDirectory !== 'string' || !record.certificateDirectory.trim())) throw new Error('TLS process origin/resource/certificate ownership mismatch; left intact');
      if (tls) certificateDirectory = record.certificateDirectory;
      groups.add(record.groupId); keep(file, record);
    } catch (error) { errors.push(`${path.basename(file)}: ${error.message}`); if (tls) tlsInvalid = true; }
  }
  if (io.existsSync(resourcesFile)) {
    try {
      const record = read(resourcesFile);
      if (tlsInvalid || !own(record) || record.upstreamOrigin !== httpOrigin || record.origin !== localTlsOrigin(httpOrigin) || typeof record.certificateDirectory !== 'string' || !record.certificateDirectory.trim() || !Array.isArray(record.processes) || record.processes.some(row => !['certificate','proxy'].includes(row.kind) || !validGroup(row.groupId) || row.pid !== row.groupId)) throw new Error('TLS resource record not proven owned by this run; left intact');
      if (certificateDirectory && certificateDirectory !== record.certificateDirectory) throw new Error('TLS certificate record mismatch; left intact');
      certificateDirectory = record.certificateDirectory;
      record.processes.forEach(row => groups.add(row.groupId)); keep(resourcesFile, record);
    } catch (error) { errors.push(`${path.basename(resourcesFile)}: ${error.message}`); tlsInvalid = true; }
  }
  // Never signal a group whose TLS ownership became ambiguous across records.
  if (tlsInvalid) for (const entry of records.filter(entry => entry.file !== serverFile)) { const record = JSON.parse(entry.serialized); if (record.groupId) groups.delete(record.groupId); records.splice(records.indexOf(entry), 1); }
  for (const id of groups) {
    try {
      const wait = async duration => { const end = Date.now() + duration; while (alive(id) && Date.now() < end) await pause(25); };
      if (alive(id)) { signal(id, 'SIGTERM'); await wait(6000); }
      if (alive(id)) { signal(id, 'SIGKILL'); await wait(3000); }
      if (alive(id)) throw new Error(`Owned group ${id} shutdown unverified; records retained`);
    } catch (error) { errors.push(error.message); }
  }
  if (!tlsInvalid && certificateDirectory && [...groups].every(id => !alive(id))) {
    try { removeCertificate(certificateDirectory, options.runId); } catch (error) { errors.push(error.message); }
  }
  if (!errors.length) for (const entry of records) {
    try { if (io.existsSync(entry.file)) { if (JSON.stringify(read(entry.file)) !== entry.serialized) throw new Error('Ownership changed during cleanup; record retained'); io.unlinkSync(entry.file); } }
    catch (error) { errors.push(error.message); }
  }
  if (options.browserAttempted) {
    try {
      const origin = new URL(httpOrigin);
      await checkPort(Number(origin.port || 80), origin.hostname);
      if (options.tlsRequired) { const tls = new URL(localTlsOrigin(httpOrigin)); await checkPort(Number(tls.port), tls.hostname); }
    } catch (error) { errors.push(`Dedicated listener cleanup unverified: ${error.message}`); }
  }
  return { name: 'cleanup', outcome: errors.length ? 'failed' : 'passed', exitCode: errors.length ? 1 : 0, ...(errors.length ? { reason: errors.join('; ') } : {}) };
}
module.exports = { cleanupFrontendResources };
