const { safeEvidence } = require('../shared/safe-evidence.cjs');
function sanitizeFrontendAttachments(value, env = process.env) {
  function visit(item) {
    if (Array.isArray(item)) return item.map(visit);
    if (!item || typeof item !== 'object') return item;
    return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, key === 'attachments' && Array.isArray(child) ? child.map(attachment => {
      const { body, path, ...metadata } = attachment;
      if (!/^(text\/|application\/json)/.test(attachment.contentType || '') || path) return { ...metadata, withheld: 'Attachment content not approved for safe publication' };
      const text = body ? Buffer.from(body,'base64').toString('utf8') : '';
      return { ...metadata, body: Buffer.from(safeEvidence(text,env)).toString('base64') };
    }) : visit(child)]));
  }
  return safeEvidence(visit(value),env);
}
module.exports = { sanitizeFrontendAttachments };
