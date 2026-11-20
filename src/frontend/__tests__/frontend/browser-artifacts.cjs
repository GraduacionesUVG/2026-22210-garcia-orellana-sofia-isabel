'use strict';
const browserPhases = new Set(['mocked','accessibility','layout','visual','firefox','webkit','critical-smoke','performance']);
const path = require('node:path');
const { readFileSync } = require('node:fs');
const { verifyFrontendArtifact } = require('./source-identity.cjs');
const phaseProject = name => ['firefox','webkit'].includes(name) ? `frontend-${name}-smoke` : 'frontend-mocked';
function browserSelection(name, args) {
  const selection = { project: phaseProject(name), files: [] };
  const value = flag => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : args.find(arg => arg.startsWith(flag + '='))?.slice(flag.length + 1); };
  selection.project = value('--project') ?? selection.project;
  selection.grep = value('--grep'); selection.grepInvert = value('--grep-invert');
  // The dedicated cross-browser projects themselves select these registered tags.
  if (['firefox','webkit'].includes(name) && !selection.grep) selection.grep = '@crossbrowser-(smoke|layout|download)';
  selection.repeatEach = Number(value('--repeat-each') ?? 1);
  selection.files = args.filter(arg => !arg.startsWith('-') && /\.spec\.[cm]?[jt]sx?$/.test(arg)).map(file => file.replace(/^__tests__\//,''));
  return selection;
}
function parseBrowserPhaseArtifact(input) {
  const entries = [];
  try {
    const { name, directory, runId, selection, artifacts } = input;
    if (!browserPhases.has(name) || !selection || selection.project !== phaseProject(name)) throw new Error('Unknown phase or wrong project selection');
    const bound = artifacts.filter(artifact => artifact.name === name);
    if (bound.length !== 1) throw new Error('Exactly one bound result required');
    const artifact = bound[0];
    if (path.resolve(artifact.path) !== path.join(path.resolve(directory), `${name}.json`)) throw new Error('Wrong phase result pathname');
    const contents = (input.readFile ?? readFileSync)(artifact.path);
    verifyFrontendArtifact(contents, artifact, runId);
    const raw = JSON.parse(contents.toString('utf8'));
    if (!raw || !Array.isArray(raw.suites) || !raw.suites.length || !Array.isArray(raw.errors) || !Array.isArray(raw.config?.projects)) throw new Error('Malformed canonical result');
    const project = raw.config.projects.find(project => project.name === selection.project);
    if (!project || (selection.repeatEach !== undefined && project.repeatEach !== selection.repeatEach)) throw new Error('Wrong project/repetition association');
    const counters = ['expected','unexpected','skipped','flaky'];
    if (!raw.stats || counters.some(key => !Number.isInteger(raw.stats[key]) || raw.stats[key] < 0)) throw new Error('Malformed canonical outcome counters');
    const count = Object.fromEntries(counters.map(key => [key, 0]));
    const visit = (suite, ancestors = []) => {
      if (!suite || typeof suite !== 'object' || (suite.specs !== undefined && !Array.isArray(suite.specs)) || (suite.suites !== undefined && !Array.isArray(suite.suites))) throw new Error('Malformed canonical suite');
      const titles = [...ancestors, suite.title ?? ''];
      for (const spec of suite.specs ?? []) {
        if (typeof spec.id !== 'string' || !spec.id || typeof spec.title !== 'string' || typeof spec.file !== 'string' || !Number.isInteger(spec.line) || !Array.isArray(spec.tests) || !spec.tests.length) throw new Error('Malformed selected spec');
        for (const test of spec.tests) {
          if (test.projectName !== selection.project || !counters.includes(test.status) || !Array.isArray(test.results) || !test.results.length) throw new Error('Wrong project, outcome, or absent execution');
          const tags = (spec.tags ?? []).map(tag => tag.startsWith('@') ? tag : `@${tag}`);
          const title = [selection.project, spec.file, ...titles, spec.title, ...tags].join(' ');
          if ((selection.grep && !new RegExp(selection.grep).test(title)) || (selection.grepInvert && new RegExp(selection.grepInvert).test(title)) || (selection.files?.length && !selection.files.some(file => spec.file.includes(file)))) throw new Error('Result outside required phase selection');
          for (const result of test.results) {
            if (!['passed','failed','timedOut','skipped','interrupted'].includes(result.status) || !Array.isArray(result.errors) || (result.attachments !== undefined && !Array.isArray(result.attachments))) throw new Error('Malformed executed result');
          }
          count[test.status]++;
          entries.push({ phase: name, spec, test });
        }
      }
      for (const child of suite.suites ?? []) visit(child, titles);
    };
    raw.suites.forEach(suite => visit(suite));
    if (!entries.length || counters.some(key => raw.stats[key] !== count[key])) throw new Error('Empty selection or inconsistent canonical outcome counters');
    const repeatEach = selection.repeatEach ?? project.repeatEach ?? 1;
    const repetitions = new Map();
    for (const {spec,test} of entries) {
      // Playwright gives repetitions distinct spec IDs; source location/title/project identify the selected case.
      const key = JSON.stringify([spec.file,spec.line,spec.title,test.projectName]);
      repetitions.set(key,(repetitions.get(key) ?? 0) + 1);
    }
    if (!Number.isInteger(repeatEach) || repeatEach < 1 || [...repetitions.values()].some(count => count !== repeatEach)) throw new Error('Required actual execution repetitions absent or inconsistent');
    return { entries, issues: [], errors: raw.errors };
  } catch (error) { return { entries: [], issues: [`Browser artifact not demonstrated: ${input.name}: ${error.message}`], errors: [] }; }
}
function finishFrontendPhase(result, artifactInput) {
  if (!browserPhases.has(result.name)) return result;
  const parsed = parseBrowserPhaseArtifact(artifactInput);
  if (parsed.issues.length) return { ...result, outcome: result.outcome === 'aborted' ? 'aborted' : 'failed', exitCode: Math.max(2, result.exitCode), reason: [result.reason, ...parsed.issues].filter(Boolean).join('; ') };
  if (result.exitCode === 0 && (parsed.errors.length || parsed.entries.some(({test}) => test.status !== 'expected' || test.results.some(item => item.status !== 'passed')))) return { ...result, outcome: 'failed', exitCode: 2, reason: `Browser artifact outcomes not demonstrated: ${result.name}` };
  return result;
}
module.exports = { browserPhases, browserSelection, finishFrontendPhase, parseBrowserPhaseArtifact };
