// Applied before the reporter's first write. Never mutate runtime configuration,
// assertion statuses, timestamps, or files after their evidence envelope is bound.
// This reporter adapter is intentionally CommonJS, like safe-jest-results.cjs.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { stripVTControlCharacters } = require("node:util");

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function diagnosticPatterns(secret) {
  const pretty = value => value.replace(/["\\]/gu, "\\$&");
  const escapeControls = value => value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/gu, character => {
    const short = { "\b": "\\b", "\f": "\\f", "\v": "\\v" };
    return short[character] ?? `\\x${character.codePointAt(0).toString(16).padStart(2, "0")}`;
  });
  // Installed pretty-format escapes quotes/backslashes; Jest string diffs escape
  // controls separately. Whole-string variants avoid ambiguous per-character
  // alternatives (and exponential regex backtracking on repeated backslashes).
  // Exactly two supported inputs: a direct value and a JSON-string response
  // body. Apply the installed renderer's pretty/control escapes to each once;
  // this is a fixed-size composition, not recursive arbitrary decoding.
  const json = JSON.stringify(secret).slice(1, -1);
  const forms = new Set([secret, json].flatMap(value => [value, pretty(value), escapeControls(value), escapeControls(pretty(value))]));
  // Suite-level Jest messages indent the entire diff in addition to its marker.
  return [...forms].sort((a, b) => b.length - a.length).map(form => new RegExp(form.split("\n").map(escapePattern).join("\\n(?:[\\t ]*[ +-] )?"), "gu"));
}

function isReporterStatus(value, path) {
  const jestAssertion = ['passed', 'failed', 'skipped', 'pending', 'todo', 'disabled', 'focused'];
  const playwrightResult = ['passed', 'failed', 'timedOut', 'skipped', 'interrupted'];
  if (path[0] === 'testResults' && typeof path[1] === 'number') {
    if (path.length === 3 && path[2] === 'status') return ['passed', 'failed', 'skipped', 'focused'].includes(value);
    // Jest's processor receives testResults; its JSON formatter emits
    // assertionResults. Only these real assertion positions are control data.
    if (path.length === 5 && ['testResults', 'assertionResults'].includes(path[2]) && typeof path[3] === 'number' && path[4] === 'status') return jestAssertion.includes(value);
  }
  let index = 0;
  while (path[index] === 'suites' && typeof path[index + 1] === 'number') index += 2;
  if (!index || path[index] !== 'specs' || typeof path[index + 1] !== 'number' || path[index + 2] !== 'tests' || typeof path[index + 3] !== 'number') return false;
  const tail = path.slice(index + 4);
  if (tail.length === 1 && tail[0] === 'status') return ['expected', 'unexpected', 'flaky', 'skipped'].includes(value);
  if (tail.length === 1 && tail[0] === 'expectedStatus') return playwrightResult.includes(value);
  return tail.length === 3 && tail[0] === 'results' && typeof tail[1] === 'number' && tail[2] === 'status' && playwrightResult.includes(value);
}

function safeEvidence(value, env = process.env) {
  const sensitiveKey = /(?:password|secret|token|cookie|authorization|(?:api|anon|service.role).*key|database.url|supabase.*url|test_.*email)/iu;
  const secrets = Object.entries(env).filter(([key, item]) => sensitiveKey.test(key) && typeof item === "string" && item.length)
    .map(([, item]) => item).sort((a, b) => b.length - a.length);
  const patterns = [...new Set(secrets.flatMap(secret => [secret, stripVTControlCharacters(secret)]))]
    .filter(Boolean).sort((a, b) => b.length - a.length).flatMap(diagnosticPatterns);
  function clean(item, key = "", path = []) {
    if (/^[a-z_][a-z0-9_]*$/iu.test(key) && sensitiveKey.test(key)) return "[REDACTED]";
    if (typeof item === "string") {
      if (isReporterStatus(item, path)) return item;
      for (const secret of secrets) item = item.split(secret).join("[REDACTED]");
      // Match the rendered value, including mixed escaping, before the report's
      // first write. Strip presentation-only ANSI, never the live configuration.
      item = stripVTControlCharacters(item);
      for (const pattern of patterns) item = item.replace(pattern, "[REDACTED]");
      return item;
    }
    if (Array.isArray(item)) return item.map((value, index) => clean(value, "", [...path, index]));
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).map(([name, value]) => [name, clean(value, name, [...path, name])]));
    return item;
  }
  return clean(JSON.parse(JSON.stringify(value)));
}
module.exports = { safeEvidence };
