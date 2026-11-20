import type { UiControlContract } from './control-manifest';
export interface UiControlEvidence {
  controlId: string; mode: string; interacted: boolean; passed: boolean;
  states: readonly string[]; roles: readonly string[]; backendActionIds: readonly string[];
  persistenceVerified?: boolean; spec?: string; runId?: string;
}
export interface UiActionEvidence {
  controlId: string; testId: string; runId: string; commit: string; mode: 'mocked' | 'live';
  outcome: 'passed' | 'failed' | 'blocked' | 'not-demonstrated';
  interaction: string; visibleAssertion: string; requestAssertion?: string;
  readbackAssertion?: string; cleanup: 'passed' | 'failed' | 'not-required';
  roles?: readonly string[]; states?: readonly string[]; backendActionIds?: readonly string[];
}
export function validateUiActionEvidence(contracts: readonly UiControlContract[], evidence: readonly UiActionEvidence[]) {
  const issues: string[] = [];
  if (new Set(evidence.map(item => `${item.runId}/${item.commit}`)).size > 1) issues.push('Mixed frontend evidence run/commit identities');
  const validEvidence = evidence.filter(item => {
    let valid = true;
    if (!item.runId || !item.commit || !item.testId) { issues.push(`Evidence identity missing: ${item.controlId}`); valid = false; }
    if (!item.interaction || !item.visibleAssertion || item.outcome !== 'passed' || item.cleanup === 'failed') { issues.push(`UI proof incomplete: ${item.controlId}`); valid = false; }
    const control = contracts.find(candidate => candidate.id === item.controlId);
    if (control?.kind === 'mutation' && (!item.requestAssertion || !item.readbackAssertion || item.cleanup !== 'passed')) { issues.push(`Mutation proof incomplete: ${item.controlId}`); valid = false; }
    return valid;
  });
  const project = (item: UiActionEvidence): UiControlEvidence => ({
    controlId: item.controlId, mode: item.mode, interacted: Boolean(item.interaction), passed: item.outcome === 'passed' && item.cleanup !== 'failed',
    roles: item.roles ?? [], states: item.states ?? [], backendActionIds: item.backendActionIds ?? [],
    persistenceVerified: item.mode === 'live' && Boolean(item.readbackAssertion),
  });
  // Diagnostics retain rejected proofs; only individually valid proofs can earn credit.
  const diagnostics = validateUiControlCoverage(contracts, evidence.map(project));
  const coverage = validateUiControlCoverage(contracts, validEvidence.map(project));
  return { issues: [...issues,...diagnostics.issues], uncovered: coverage.uncovered };
}
export function validateUiControlCoverage(contracts: readonly UiControlContract[], evidence: readonly UiControlEvidence[]) {
  const issues: string[] = [];
  const byId = new Map(contracts.map(control => [control.id, control]));
  if (byId.size !== contracts.length) issues.push('Duplicate control contract IDs');
  for (const item of evidence) {
    const control = byId.get(item.controlId);
    if (!control) { issues.push(`Unknown control: ${item.controlId}`); continue; }
    if (!['mocked', 'live'].includes(item.mode)) issues.push(`Unknown evidence mode: ${item.controlId}`);
    if (!item.interacted || !item.passed) issues.push(`Control was not successfully exercised: ${item.controlId}`);
    if (control.persistence === 'live' && (item.mode !== 'live' || !item.persistenceVerified)) issues.push(`Live persistence not verified: ${item.controlId}`);
    for (const id of item.backendActionIds) if (!control.backendActionIds.includes(id)) issues.push(`Action not in control contract: ${item.controlId}/${id}`);
  }
  const uncovered = contracts.filter(control => {
    const valid = evidence.filter(item => item.controlId === control.id && item.interacted && item.passed && ['live', 'mocked'].includes(item.mode) && item.backendActionIds.every(id => control.backendActionIds.includes(id)) && (control.persistence !== 'live' || (item.mode === 'live' && item.persistenceVerified)));
    return !valid.length || control.states.some(state => !valid.some(item => item.states.includes(state))) || control.roles.some(role => !valid.some(item => item.roles.includes(role))) || control.backendActionIds.some(id => !valid.some(item => item.backendActionIds.includes(id)));
  }).map(control => control.id);
  return { issues, uncovered };
}
