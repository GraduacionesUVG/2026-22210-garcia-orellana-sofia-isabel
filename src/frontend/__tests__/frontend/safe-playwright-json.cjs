const BackendSafeReporter = require('../shared/safe-playwright-json.cjs');
const { sanitizeFrontendAttachments } = require('./safe-report-attachments.cjs');
module.exports = class FrontendSafeReporter extends BackendSafeReporter {
  _serializeReport(result) { return sanitizeFrontendAttachments(super._serializeReport(result)); }
};
