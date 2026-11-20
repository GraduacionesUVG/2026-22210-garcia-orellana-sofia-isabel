'use strict';

async function withVerifiedCleanup(operation, ops) {
  let childCode, cleanup;
  try { childCode = await operation(); }
  finally { cleanup = await ops.cleanup(); }
  // Compute the final status only after cleanup. Unknown ownership is never success.
  if (ops.signal?.aborted || !cleanup || cleanup.outcome !== 'passed' || cleanup.exitCode !== 0) return Math.max(2, childCode ?? 0);
  return childCode;
}

// The CLI and injected runner tests use this same command dispatcher.
async function runFrontendCommand(command, cli, ops) {
  if (!['unit', 'mocked', 'performance', 'crossbrowser', 'smoke', 'gate', 'typecheck'].includes(command)) throw new Error('Unknown frontend runner command');
  await ops.begin();
  if (command === 'unit') return (await ops.phase('unit', 'jest/bin/jest', ['--config=jest.frontend.config.ts', ...cli])).exitCode;
  if (command === 'mocked' || command === 'performance') {
    return withVerifiedCleanup(async () => (await ops.play(command, command === 'performance' ? ['--grep', '@frontend-performance', ...cli] : cli)).exitCode, ops);
  }
  if (command === 'smoke') {
    return withVerifiedCleanup(async () => (await ops.play('critical-smoke', ['--grep', '@critical-smoke', '--repeat-each=3', ...cli])).exitCode, ops);
  }
  if (command === 'crossbrowser') {
    return withVerifiedCleanup(async () => {
      let code = 0;
      for (const browser of ['firefox', 'webkit']) {
        const result = await ops.phase(browser, '@playwright/test/cli', ['test', '--config=playwright.frontend.config.ts', `--project=frontend-${browser}-smoke`, ...cli]);
        code = Math.max(code, result.exitCode);
      }
      return code;
    }, ops);
  }
  await ops.prepareBuild();
  if (command === 'typecheck') return withVerifiedCleanup(async () => (await ops.phase('build', 'next/dist/bin/next', ['build'], ops.buildEnv)).exitCode, ops);
  try {
    const build = await ops.phase('build', 'next/dist/bin/next', ['build'], ops.buildEnv);
    await ops.phase('unit', 'jest/bin/jest', ['--config=jest.frontend.config.ts', '--runInBand']);
    if (build.exitCode === 0) {
      await ops.play('mocked', ['--grep-invert', 'visual approval|@frontend-performance']);
      await ops.play('accessibility', ['--grep', 'accessibility']);
      await ops.play('layout', ['--grep', 'layout']);
      await ops.play('visual', ['--grep', 'visual approval']);
      for (const browser of ['firefox', 'webkit']) await ops.phase(browser, '@playwright/test/cli', ['test', '--config=playwright.frontend.config.ts', `--project=frontend-${browser}-smoke`]);
      await ops.play('critical-smoke', ['--grep', '@critical-smoke', '--repeat-each=3']);
      await ops.play('performance', ['--grep', '@frontend-performance']);
    } else for (const name of ['mocked', 'accessibility', 'layout', 'visual', 'firefox', 'webkit', 'critical-smoke', 'performance']) ops.record({ name, outcome: 'blocked', exitCode: 2, reason: 'Production build failed' });
    ops.record({ name: 'live', outcome: 'blocked', exitCode: 2, reason: 'User local-only authorization' });
  } finally { await ops.cleanup(); }
  const result = await ops.report();
  return cli.includes('--mocked-only') ? localFrontendExitCode(result) : result.exitCode;
}

function localFrontendExitCode(result) {
  const approvalOnly = test => test.phase === 'visual' && test.outcome === 'blocked' && test.errors?.length > 0 && test.errors.every(error => typeof error === 'string' && error.includes('BASELINE_APPROVAL_REQUIRED'));
  const visualTests = result.tests.filter(test => test.phase === 'visual');
  const visualBlocked = visualTests.length > 0 && visualTests.every(approvalOnly);
  const liveBlocked = result.phases.some(phase => phase.name === 'live' && phase.outcome === 'blocked' && phase.reason === 'User local-only authorization');
  const required = ['build','unit','mocked','accessibility','layout','visual','firefox','webkit','critical-smoke','performance','cleanup'];
  if (required.some(name => !result.phases.some(phase => phase.name === name && phase.outcome === 'passed' && phase.exitCode === 0) && !(name === 'visual' && visualBlocked && result.phases.some(phase => phase.name === name && ['failed','blocked'].includes(phase.outcome))))) return 2;
  if (result.tests.some(test => test.outcome !== 'passed' && !approvalOnly(test))) return 2;
  const allowed = issue => {
    if (issue === 'Control inventory OPEN: percentage denominator not certified') return result.inventory.complete === false;
    if (issue.startsWith('Controls not fully demonstrated: ')) return result.inventory.complete === false;
    if (issue === 'BASELINE_APPROVAL_REQUIRED') return true;
    if (issue === 'Live phase blocked by local-only authorization' || issue === 'Required phase not passed: live') return liveBlocked;
    if (issue === 'Required phase not passed: visual') return visualBlocked;
    return visualTests.some(test => approvalOnly(test) && issue === `Critical test not demonstrated: ${test.testId}/blocked`);
  };
  return result.issues.every(allowed) ? 0 : 2;
}

module.exports = { runFrontendCommand, localFrontendExitCode };
