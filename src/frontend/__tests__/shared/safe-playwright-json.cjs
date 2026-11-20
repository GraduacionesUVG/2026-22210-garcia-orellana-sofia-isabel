/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const JSONReporter = require(path.join(path.dirname(require.resolve("playwright/package.json")), "lib/reporters/json.js")).default;
const { safeEvidence } = require("./safe-evidence.cjs");

// Sanitize the final report before Playwright writes it to disk.
module.exports = class SafeJSONReporter extends JSONReporter {
  _serializeReport(result) { return safeEvidence(super._serializeReport(result)); }
};
