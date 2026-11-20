const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
function collectFrontendIdentity(appRoot, runId) {
  if (!runId) throw new Error('Explicit frontend suite run ID required');
  const git = args => execFileSync('git',args,{cwd:appRoot,encoding:'utf8'}).trim();
  const repository = git(['rev-parse','--show-toplevel']);
  const files = execFileSync('git',['ls-files','--full-name','--cached','--others','--exclude-standard','-z'],{cwd:repository,encoding:'utf8'}).split('\0').filter(file => /\.(ts|tsx|js|jsx|cjs|mjs|json|yml|yaml|css)$/.test(file) && !file.includes('/docs/') && !file.includes('/__tests__/reports/') && !file.startsWith('.superpowers/')).sort();
  const hash = createHash('sha256');
  for (const file of files) { hash.update(file+'\0'); const absolute=path.resolve(repository,file); hash.update(existsSync(absolute) ? readFileSync(absolute) : '<deleted>'); hash.update('\0'); }
  return { runId, commit:git(['rev-parse','HEAD']), sourceDigest:hash.digest('hex') };
}
function verifyFrontendArtifact(contents, artifact, runId) {
  const digest = createHash('sha256').update(contents).digest('hex');
  if (!artifact.sha256 || artifact.sha256 !== digest || artifact.runId !== runId) throw new Error('Frontend artifact identity/digest mismatch');
}
module.exports = { collectFrontendIdentity, verifyFrontendArtifact };
