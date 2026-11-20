import { validateUiActionEvidence } from './control-coverage';
import type { UiControlContract } from './control-manifest';
import type { ExecutedUiEvidence, SourceIdentity } from './action-evidence';
export interface FrontendPhase { name: string; outcome: 'passed' | 'failed' | 'blocked' | 'aborted'; exitCode: number; durationMs?: number; reason?: string }
export interface ExecutedTest { testId: string; phase?: string; outcome: string; critical: boolean; errors?: string[]; title?: string; file?: string; line?: number; project?: string }
export function classifyBrowserOutcome(status: string, results: {status:string;errors?: {message?:string}[]}[]) {
  if(status==='expected'&&results.length&&results.every(result=>result.status==='passed'))return 'passed';
  if(status==='flaky')return 'flaky';
  if(status==='skipped')return 'skipped';
  const errors=results.flatMap(result=>result.errors??[]);
  if(errors.length&&errors.every(error=>error.message?.includes('BASELINE_APPROVAL_REQUIRED')))return 'blocked';
  return 'failed';
}
export const requiredFrontendPhases = ['build','unit','mocked','accessibility','layout','visual','firefox','webkit','critical-smoke','performance','live','cleanup'];
export function buildFrontendReport(input: { expected: SourceIdentity; actual: SourceIdentity; manifestComplete: boolean; contracts: readonly UiControlContract[]; evidence: ExecutedUiEvidence[]; phases: FrontendPhase[]; tests: ExecutedTest[]; artifactIssues?: string[]; visualApproved: boolean; liveAuthorized: boolean }) {
  const issues: string[] = [...(input.artifactIssues ?? [])];
  for (const key of ['runId','commit','sourceDigest'] as const) if (!input.expected[key] || input.actual[key] !== input.expected[key]) issues.push(`Current source identity mismatch: ${key}`);
  if (!input.evidence.length) issues.push('Empty UI action evidence');
  for (const proof of input.evidence) {
    for (const key of ['runId','commit','sourceDigest'] as const) if (proof[key] !== input.expected[key]) issues.push(`Evidence identity mismatch: ${proof.controlId}/${key}`);
    const executed = input.tests.find(test => test.testId === proof.testId);
    if (!executed || executed.outcome !== 'passed') issues.push(`UI proof has no matching successful executed test: ${proof.controlId}`);
  }
  for (const test of input.tests) if (test.critical && test.outcome !== 'passed') issues.push(`Critical test not demonstrated: ${test.testId}/${test.outcome}`);
  for (const name of requiredFrontendPhases) {
    const phase = input.phases.find(phase => phase.name === name);
    if (!phase || phase.outcome !== 'passed' || phase.exitCode !== 0) issues.push(`Required phase not passed: ${name}`);
  }
  if (!input.manifestComplete) issues.push('Control inventory OPEN: percentage denominator not certified');
  if (!input.visualApproved) issues.push('BASELINE_APPROVAL_REQUIRED');
  if (!input.liveAuthorized) issues.push('Live phase blocked by local-only authorization');
  const attributable = input.evidence.filter(proof => ['runId','commit','sourceDigest'].every(key => proof[key as keyof SourceIdentity] === input.expected[key as keyof SourceIdentity]) && input.tests.some(test => test.testId === proof.testId && test.outcome === 'passed'));
  const coverage = validateUiActionEvidence(input.contracts,attributable);
  issues.push(...validateUiActionEvidence(input.contracts,input.evidence).issues);
  if (coverage.uncovered.length) issues.push(`Controls not fully demonstrated: ${coverage.uncovered.join(', ')}`);
  return { identity: input.expected, certified: issues.length === 0, exitCode: issues.length ? 2 : 0, issues,
    inventory: { complete: input.manifestComplete, knownControls: input.contracts.length, percent: input.manifestComplete ? Math.round((input.contracts.length - coverage.uncovered.length) / Math.max(1,input.contracts.length) * 100) : null },
    controls: input.contracts.map(control => ({ id: control.id, mode: control.persistence === 'live' ? 'live-required' : 'mocked-or-live', outcome: coverage.uncovered.includes(control.id) ? 'not-demonstrated' : 'passed' })),
    phases: input.phases, tests: input.tests, flaky: input.tests.filter(test => test.outcome === 'flaky'), livePersistence: input.liveAuthorized ? 'requires-proof' : 'blocked',
  };
}
export function summarizePerformance(samples: { scenario: string; mode: string; durationMs: number; requests: number }[]) {
  if (!samples.length) throw new Error('Performance evidence absent');
  const keys = [...new Set(samples.map(sample => `${sample.scenario}/${sample.mode}`))];
  return keys.map(key => {
    const rows=samples.filter(sample => `${sample.scenario}/${sample.mode}` === key);
    const values=rows.map(sample => sample.durationMs).sort((a,b) => a-b);
    if (rows.length !== 5 || values.some(value => !Number.isFinite(value) || value < 0)) throw new Error(`Performance requires exactly five valid repetitions: ${key}`);
    return { scenario:rows[0].scenario, mode:rows[0].mode, count:rows.length, p50:values[Math.ceil(values.length*.5)-1], p95:values[Math.ceil(values.length*.95)-1], requests:rows.map(sample => sample.requests), budgetMs:1500, budgetApproved:false };
  });
}
