import type { TestInfo } from '@playwright/test';
import type { UiActionEvidence } from './control-coverage';
export interface SourceIdentity { runId: string; commit: string; sourceDigest: string }
export type ExecutedUiEvidence = UiActionEvidence & SourceIdentity;
export const { sanitizeFrontendAttachments } = require('./safe-report-attachments.cjs');
/** Callbacks must perform actual browser assertions; no control proof is inferred from a test title. */
export async function recordUiAction(testInfo: TestInfo, input: {
  controlId: string; identity: SourceIdentity; mode: 'mocked' | 'live'; roles: string[]; states: string[]; backendActionIds: string[];
  interaction: { description: string; execute: () => Promise<void> }; visible: { description: string; execute: () => Promise<void> };
  request?: { description: string; execute: () => Promise<void> }; readback?: { description: string; execute: () => Promise<void> };
}): Promise<ExecutedUiEvidence> {
  await input.interaction.execute(); await input.visible.execute();
  if (input.request) await input.request.execute(); if (input.readback) await input.readback.execute();
  return { ...input.identity, controlId: input.controlId, testId: testInfo.testId, mode: input.mode, outcome: 'passed',
    interaction: input.interaction.description, visibleAssertion: input.visible.description, requestAssertion: input.request?.description,
    readbackAssertion: input.readback?.description, cleanup: 'not-required', roles: input.roles, states: input.states, backendActionIds: input.backendActionIds };
}
export async function attachUiEvidence(testInfo: TestInfo, proofs: ExecutedUiEvidence[], cleanup: 'passed' | 'failed') {
  const { safeEvidence } = require('../shared/safe-evidence.cjs');
  await testInfo.attach('frontend-ui-proof', { contentType: 'application/json', body: Buffer.from(JSON.stringify(safeEvidence(proofs.map(proof => ({ ...proof, cleanup, outcome: testInfo.status === 'passed' ? proof.outcome : 'failed' }))))) });
}
