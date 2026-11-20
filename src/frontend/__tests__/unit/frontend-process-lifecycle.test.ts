import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
const { startOwnedProcess } = require('../frontend/process-lifecycle.cjs');
const fixture = path.resolve(__dirname, '../frontend/process-fixture.cjs');
const ownedGroups: number[] = [];
const ownedDescendants: number[] = [];
function alive(pid: number) { try { process.kill(pid,0); return true; } catch (error: any) { if (error.code === 'ESRCH') return false; if (error.code === 'EPERM') return true; throw error; } }
async function waitGone(pid: number) {
  const end = Date.now() + 3000;
  while (alive(pid) && Date.now() < end) await new Promise(resolve => setTimeout(resolve,10));
  if (alive(pid)) throw new Error(`Task-owned process/group still present: ${pid}`);
}
async function cleanup(groupId?: number) {
  if (!groupId) return;
  ownedGroups.push(groupId);
  if (alive(-groupId)) { try { process.kill(-groupId,'SIGKILL'); } catch (error: any) { if (error.code !== 'ESRCH') throw error; } }
  await waitGone(-groupId);
}
async function ready(child: any): Promise<{ pid: number; port: number }> {
  return new Promise((resolve,reject) => {
    let text = '';
    const timeout = setTimeout(() => reject(new Error('Fixture readiness missing')),2000);
    const onData = (chunk: Buffer) => {
      text += chunk.toString();
      const line = text.split('\n').find(value => value.includes('descendant-ready'));
      if (line) { clearTimeout(timeout); child.stdout.off('data',onData); const record = JSON.parse(line); ownedDescendants.push(record.pid); resolve(record); }
    };
    child.stdout.on('data',onData);
  });
}
describe('frontend owned group lifecycle', () => {
  afterAll(() => {
    for (const id of ownedGroups) expect(alive(-id)).toBe(false);
    for (const id of ownedDescendants) expect(alive(id)).toBe(false);
    console.info(JSON.stringify({ ownedGroups, ownedDescendants, verifiedGone: true }));
  });
  test('direct parent early exit retains record until descendant is killed and group proven gone', async () => {
    const directory = mkdtempSync(path.join(tmpdir(),'frontend-lifecycle-'));
    const recordFile = path.join(directory,'process.json');
    let groupId: number | undefined;
    try {
      const handle = await startOwnedProcess({ command: process.execPath, args: [fixture,'ignore'], recordFile, graceMs: 180, forceMs: 2000, pollMs: 10 });
      groupId = handle.groupId;
      const descendant = await ready(handle.child);
      const exited = once(handle.child,'exit');
      process.kill(handle.pid,'SIGTERM');
      await exited;
      expect(alive(descendant.pid)).toBe(true);
      expect(existsSync(recordFile)).toBe(true);
      expect(JSON.parse(readFileSync(recordFile,'utf8')).groupId).toBe(groupId);
      const result = await handle.result;
      expect(result.escalated).toBe(true);
      expect(result.groupGone).toBe(true);
      expect(alive(-handle.groupId)).toBe(false);
      expect(existsSync(recordFile)).toBe(false);
    } finally { await cleanup(groupId); rmSync(directory,{ recursive: true, force: true }); }
  });
  test('cancellation signals the owned group and awaits escalation before resolving', async () => {
    const directory = mkdtempSync(path.join(tmpdir(),'frontend-cancellation-'));
    const recordFile = path.join(directory,'process.json');
    let groupId: number | undefined;
    try {
      const controller = new AbortController();
      const handle = await startOwnedProcess({ command: process.execPath, args: [fixture,'ignore'], recordFile, signal: controller.signal, graceMs: 100, forceMs: 2000, pollMs: 10 });
      groupId = handle.groupId;
      await ready(handle.child);
      controller.abort();
      let timeout: NodeJS.Timeout | undefined;
      const result = await Promise.race([handle.result,new Promise(resolve => { timeout = setTimeout(() => resolve({ timeout: true }),500); })]).finally(() => { if (timeout) clearTimeout(timeout); });
      expect(result).toMatchObject({ stopped: true, escalated: true, groupGone: true });
      expect(alive(-handle.groupId)).toBe(false);
      expect(existsSync(recordFile)).toBe(false);
    } finally { await cleanup(groupId); rmSync(directory,{ recursive: true, force: true }); }
  });
  test('graceful stop does not escalate after all owned members exit', async () => {
    const directory = mkdtempSync(path.join(tmpdir(),'frontend-graceful-'));
    let groupId: number | undefined;
    try {
      const handle = await startOwnedProcess({ command: process.execPath, args: [fixture,'graceful'], recordFile: path.join(directory,'process.json'), graceMs: 200, forceMs: 2000, pollMs: 10 });
      groupId = handle.groupId;
      await ready(handle.child);
      expect(await handle.stop()).toMatchObject({ groupGone: true, escalated: false });
      expect(alive(-handle.groupId)).toBe(false);
    } finally { await cleanup(groupId); rmSync(directory,{ recursive: true, force: true }); }
  });
  test('ownership artifact initialization failure cleans a spawned group before rejecting', async () => {
    const directory = mkdtempSync(path.join(tmpdir(),'frontend-startup-failure-'));
    let groupId: number | undefined;
    try {
      await expect(startOwnedProcess({ command: process.execPath, args: [fixture,'ignore'], recordFile: directory, graceMs: 80, forceMs: 2000, pollMs: 10, onSpawn: (pid: number) => { groupId = pid; } })).rejects.toThrow();
      expect(groupId).toBeDefined();
      expect(alive(-groupId!)).toBe(false);
    } finally { await cleanup(groupId); rmSync(directory,{ recursive: true, force: true }); }
  });
  test('spawn error is explicit and cannot publish a false ownership record', async () => {
    const directory = mkdtempSync(path.join(tmpdir(),'frontend-spawn-error-'));
    const recordFile = path.join(directory,'process.json');
    try {
      await expect(startOwnedProcess({ command: path.join(directory,'nonexistent-command'), args: [], recordFile, graceMs: 80, forceMs: 2000, pollMs: 10 })).rejects.toThrow('ENOENT');
      expect(existsSync(recordFile)).toBe(false);
    } finally { rmSync(directory,{ recursive: true, force: true }); }
  });
  test('pre-cancelled startup never spawns or writes an ownership record', async () => {
    const directory = mkdtempSync(path.join(tmpdir(),'frontend-pre-cancel-'));
    const recordFile = path.join(directory,'process.json');
    const controller = new AbortController(); controller.abort();
    let spawned = false;
    try {
      await expect(startOwnedProcess({ command: process.execPath, args: [fixture,'ignore'], recordFile, signal: controller.signal, onSpawn: () => { spawned = true; } })).rejects.toThrow('cancelled');
      expect(spawned).toBe(false);
      expect(existsSync(recordFile)).toBe(false);
    } finally { rmSync(directory,{ recursive: true, force: true }); }
  });
});
